import { describe, expect, it } from "vitest";
import { parseOpenUiProgram } from "./openuiParser";

describe("parseOpenUiProgram", () => {
  it("parses root and referenced components", () => {
    const program = parseOpenUiProgram(`
      root = Widget("Cards", [intro, cards])
      intro = Text("Study these", "muted")
      cards = Flashcards([card1])
      card1 = Flashcard("Q", "A")
    `);

    expect(program.root.component).toBe("Widget");
    expect(program.statements.get("card1")?.args).toEqual(["Q", "A"]);
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

    expect(program.statements.get("overview")?.args[0]).toEqual([
      "Strings: f-strings, casefolding, join",
      "Lists: deque, comprehensions, slicing assignment",
    ]);
    expect(program.statements.get("table")?.component).toBe("Table");
  });

  it("rejects programs without root", () => {
    expect(() => parseOpenUiProgram('text = Text("No root")')).toThrow(/root/);
  });
});
