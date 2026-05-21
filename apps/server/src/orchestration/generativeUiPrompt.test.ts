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

const githubUserFetchMock = async (url: string | URL | Request) => {
  const href = String(url);
  if (href.includes("/users/mielsense/events")) {
    return Response.json([{ type: "PushEvent", repo: { name: "mielsense/demo" } }]);
  }
  if (href.includes("/users/mielsense/repos")) {
    return Response.json([{ name: "demo", pushed_at: "2026-05-21T00:00:00Z" }]);
  }
  if (href.includes("/users/mielsense")) {
    return Response.json({ login: "mielsense", public_repos: 12 });
  }
  return new Response("Not found", { status: 404 });
};

describe("parseGenerateCommand", () => {
  it("parses slash generate prompts", () => {
    expect(parseGenerateCommand("/generate make flashcards")?.prompt).toBe("make flashcards");
  });

  it("parses mention-style generate prompts", () => {
    expect(parseGenerateCommand(" @generate weather widget ")?.prompt).toBe("weather widget");
  });

  it("ignores normal messages", () => {
    expect(parseGenerateCommand("please generate a test")).toBeNull();
  });
});

describe("buildGenerativeUiProviderPrompt", () => {
  it("wraps generate requests with UI-only instructions", () => {
    const prompt = buildGenerativeUiProviderPrompt("/generate make a weather widget");
    expect(prompt).toContain("UI-only response mode");
    expect(prompt).toContain("```openui");
    expect(prompt).toContain("make a weather widget");
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

    expect(prompt).toContain("Cheat sheet / reference / comparison");
    expect(prompt).toContain(
      "Do not include Flashcard or Quiz unless the user explicitly asks for flashcards, quiz, self-test, exam drill, memorization, recall, or practice questions.",
    );
    expect(prompt).toContain(
      "For cheat sheets, references, and comparisons, prefer Tabs, Table, Card, List, CodeBlock, and Callout.",
    );
    expect(prompt).toContain('root = Widget("Git workflow cheat sheet", [status, summary, tabs])');
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
  it("loads GitHub user context for GitHub generate requests", async () => {
    const contexts = await collectGenerateGroundingContexts({
      text: "/generate github commit dashboard for mielsense",
      cwd: process.cwd(),
      fetchImpl: githubUserFetchMock as typeof fetch,
    });

    expect(contexts.find((context) => context.source === "github")?.content).toContain("PushEvent");
  });

  it("records failed weather context instead of omitting it", async () => {
    const contexts = await collectGenerateGroundingContexts({
      text: "/generate weather for Atlantis",
      cwd: process.cwd(),
      fetchImpl: (async () => new Response("Nope", { status: 500 })) as unknown as typeof fetch,
    });

    expect(contexts).toContainEqual(
      expect.objectContaining({ source: "weather", status: "failed" }),
    );
  });
});
