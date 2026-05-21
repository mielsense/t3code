// @effect-diagnostics nodeBuiltinImport:off
import { describe, expect, it } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  buildGenerativeUiProviderPrompt,
  collectGenerateFileContexts,
  collectGenerateGroundingContexts,
  parseGenerateCommand,
} from "./generativeUiPrompt.ts";

describe("parseGenerateCommand", () => {
  it("parses slash generate prompts", () => {
    expect(parseGenerateCommand("/generate make flashcards")?.prompt).toBe("make flashcards");
  });

  it("parses mention-style generate prompts", () => {
    expect(parseGenerateCommand(" @generate status widget ")?.prompt).toBe("status widget");
  });

  it("ignores normal messages", () => {
    expect(parseGenerateCommand("please generate a test")).toBeNull();
  });
});

describe("buildGenerativeUiProviderPrompt", () => {
  it("wraps generate requests with UI-only instructions", () => {
    const prompt = buildGenerativeUiProviderPrompt("/generate make a status widget");
    expect(prompt).toContain("UI-only response mode");
    expect(prompt).toContain("```openui");
    expect(prompt).toContain("make a status widget");
    expect(prompt).toContain("External fetches are disabled");
  });

  it("leaves normal requests unchanged", () => {
    expect(buildGenerativeUiProviderPrompt("hello")).toBe("hello");
  });

  it("includes extracted referenced file content", () => {
    const prompt = buildGenerativeUiProviderPrompt("/generate make cards from @notes.txt ", {
      fileContexts: [
        { path: "/tmp/notes.txt", content: "Python lists are mutable.", truncated: false },
      ],
    });
    expect(prompt).toContain("Python lists are mutable.");
    expect(prompt).toContain("Do not use placeholders");
    expect(prompt).toContain("Grounding status to render visibly in the UI:");
    expect(prompt).toContain("- file:/tmp/notes.txt: loaded");
    expect(prompt).toContain("Include SourceStatus only when local file context is present");
  });

  it("does not force source status for stable knowledge requests without sources", () => {
    const prompt = buildGenerativeUiProviderPrompt(
      "/generate a Git workflow cheat sheet comparing merge, rebase, cherry-pick, and stash",
    );

    expect(prompt).toContain("Grounding context:");
    expect(prompt).toContain(
      "No grounding context was supplied. For stable general-knowledge requests, do not mention missing grounding and do not add a Sources tab or SourceStatus.",
    );
    expect(prompt).not.toContain("none: failed");
    expect(prompt).not.toContain("Include SourceStatus as the first or second child");
  });

  it("instructs study guides to prioritize study content before recall tools", () => {
    const prompt = buildGenerativeUiProviderPrompt("/generate python study guide");

    expect(prompt).toContain("Study guide / exam prep / learn-this");
    expect(prompt).toContain("For study guides, make the default surface actual study content");
    expect(prompt).toContain(
      "Flashcards and Quiz should be separate tabs after the study content tabs",
    );
    expect(prompt).toContain(
      "StudyDeck(title: string, summary: string, sections: Tab[], cards: Flashcard[], quiz: Quiz[])",
    );
    expect(prompt).toContain("Use 3 or 4 study tabs at most");
    expect(prompt).toContain("Every CodeBlock must be preceded by Text or Callout");
  });

  it("instructs cheat sheets and references not to add recall tools unless requested", () => {
    const prompt = buildGenerativeUiProviderPrompt(
      "/generate a Git workflow cheat sheet comparing merge, rebase, cherry-pick, and stash",
    );

    expect(prompt).toContain(
      "ReferenceUi(title: string, summary: string, sections: Tab[] | Component[])",
    );
    expect(prompt).toContain(
      "DashboardUi(title: string, summary: string, metrics: Metric[], content: Component[])",
    );
    expect(prompt).toContain(
      "RunbookUi(title: string, summary: string, steps: TimelineItem[], content: Component[])",
    );
    expect(prompt).toContain(
      "ComparisonUi(title: string, summary: string, table: Table, content?: Component[])",
    );
    expect(prompt).toContain("InspectorUi(title: string, summary: string, content: Component[])");
    expect(prompt).toContain(
      "PlannerUi(title: string, summary: string, timeline: TimelineItem[], progress: Progress[])",
    );
    expect(prompt).toContain("Cheat sheet / reference / comparison");
    expect(prompt).toContain(
      "Do not include Flashcard or Quiz unless the user explicitly asks for flashcards, quiz, self-test, exam drill, memorization, recall, or practice questions.",
    );
    expect(prompt).toContain(
      "For cheat sheets, references, and comparisons, prefer Tabs, Table, Card, List, CodeBlock, and Callout.",
    );
    expect(prompt).toContain('root = ReferenceUi("Git workflow cheat sheet"');
    expect(prompt).not.toContain('sources = Tab("Sources"');
  });
});

describe("collectGenerateFileContexts", () => {
  it("resolves truncated mentions for filenames containing spaces", () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "t3-generate-context-"));
    try {
      fs.writeFileSync(path.join(cwd, "week 9 notes.txt"), "Lists have amortized append.");
      const contexts = collectGenerateFileContexts({
        text: "/generate flashcards for @week 9 notes.txt ",
        cwd,
      });
      expect(contexts[0]?.content).toContain("amortized append");
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });
});

describe("collectGenerateGroundingContexts", () => {
  it("does not fetch GitHub context for GitHub generate requests", async () => {
    const contexts = await collectGenerateGroundingContexts({
      text: "/generate github commit dashboard for mielsense",
      cwd: process.cwd(),
    });

    expect(contexts).toEqual([]);
  });

  it("does not fetch URL context for remote generate requests", async () => {
    const contexts = await collectGenerateGroundingContexts({
      text: "/generate dashboard from https://example.com/status",
      cwd: process.cwd(),
    });

    expect(contexts).toEqual([]);
  });
});
