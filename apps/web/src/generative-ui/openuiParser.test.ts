import { describe, expect, it } from "vitest";
import { parseOpenUiProgram, type OpenUiCall, type OpenUiValue } from "./openuiParser";

function expectCall(value: OpenUiValue | undefined): OpenUiCall {
  expect(value).toMatchObject({ type: "call" });
  return value as OpenUiCall;
}

describe("parseOpenUiProgram", () => {
  it("parses root and referenced components", () => {
    const program = parseOpenUiProgram(`
      root = Widget("Cards", [intro, cards])
      intro = Text("Study these", "muted")
      cards = Flashcards([card1])
      card1 = Flashcard("Q", "A")
    `);

    expect(program.root.component).toBe("Widget");
    expect(expectCall(program.statements.get("card1")).args).toEqual(["Q", "A"]);
  });

  it("parses multiline calls and nested arrays", () => {
    const program = parseOpenUiProgram(`
      root = Widget("Study", [overview, table])

      overview = List([
        "Strings: f-strings, casefolding, join",
        "Lists: deque, comprehensions, slicing assignment"
      ])

      table = Table(
        ["Topic", "Key idea"],
        [
          ["join", "Build strings with one allocation"],
          ["deque.popleft()", "Queue removal in O(1)"]
        ]
      )
    `);

    expect(expectCall(program.statements.get("overview")).args[0]).toEqual([
      "Strings: f-strings, casefolding, join",
      "Lists: deque, comprehensions, slicing assignment",
    ]);
    expect(expectCall(program.statements.get("table")).component).toBe("Table");
  });

  it("parses richer visual component arguments", () => {
    const program = parseOpenUiProgram(`
      root = Widget("Reference", [hero, tip, code])
      metric = Metric("Cards", "12", "violet", "brain")
      hero = HeroSummary("Python review", "Fast recall for strings.", [metric], "violet", "study")
      tip = Callout("Exam tip", "Use join() for large string assembly.", "amber", "idea")
      code = CodeBlock("python", "result = ''.join(chunks)")
    `);

    expect(expectCall(program.statements.get("hero")).args[3]).toBe("violet");
    expect(expectCall(program.statements.get("tip")).component).toBe("Callout");
    expect(expectCall(program.statements.get("code")).args[1]).toBe("result = ''.join(chunks)");
  });

  it("parses reusable array aliases for component arguments", () => {
    const program = parseOpenUiProgram(`
      root = StudyUi("Python async", "Review async patterns.", [overview], cards, quizItems)
      overview = Tab("Overview", [intro], "study", "blue")
      intro = Text("Async code cooperatively waits at await points.")
      cards = [c1, c2]
      c1 = Flashcard("await", "Pauses the current coroutine.")
      c2 = Flashcard("event loop", "Schedules coroutine progress.")
      quizItems = [q1]
      q1 = Quiz("What does async help most?", ["CPU loops", "I/O waiting"], "I/O waiting")
    `);

    expect(program.root.args[3]).toEqual({ type: "ref", name: "cards" });
    expect(program.statements.get("cards")).toEqual([
      { type: "ref", name: "c1" },
      { type: "ref", name: "c2" },
    ]);
  });

  it("rejects programs without root", () => {
    expect(() => parseOpenUiProgram('text = Text("No root")')).toThrow(/root/);
  });
});
