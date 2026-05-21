import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InlineGenerativeUi } from "./InlineGenerativeUi";

describe("generative study UI components", () => {
  it("renders StudyDeck with study content as the initial tab instead of flashcards", () => {
    const markup = renderToStaticMarkup(
      <InlineGenerativeUi
        source={`
          root = StudyDeck("Software Programming Week 9", "Performance and safety.", [overview, plan], [card1], [quiz1])
          overview = Tab("Overview", [overviewText], "book", "emerald")
          overviewText = Text("Use join() for O(n) string construction.", "body")
          plan = Tab("5-Day Plan", [planText], "target", "amber")
          planText = Text("Study strings, lists, dictionaries, sets, and tuples.", "body")
          card1 = Flashcard("O(1)", "Constant time.")
          quiz1 = Quiz("Best queue front removal?", ["list.pop(0)", "deque.popleft()"], "deque.popleft()")
        `}
      />,
    );

    expect(markup).toContain("Overview");
    expect(markup).toContain("Use join() for O(n) string construction.");
    expect(markup).toContain("Flashcards");
    expect(markup).not.toContain("Study tabs");
    expect(markup).not.toContain("Cards");
    expect(markup).not.toContain("click to reveal definition");
    expect(markup).not.toContain("Best queue front removal?");
  });

  it("renders flashcards as definition reveal cards instead of front/back quiz tiles", () => {
    const markup = renderToStaticMarkup(
      <InlineGenerativeUi
        source={`
          root = Flashcards([card1])
          card1 = Flashcard("O(1)", "Constant time: execution takes the same duration regardless of dataset size.")
        `}
      />,
    );

    expect(markup).toContain("O(1)");
    expect(markup).toContain("click to reveal definition");
    expect(markup).not.toContain("Front");
  });
});
