import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { InlineGenerativeUi } from "./InlineGenerativeUi";

describe("generative study UI components", () => {
  it("renders high-level reference, dashboard, runbook, comparison, inspector, and planner layouts", () => {
    const markup = renderToStaticMarkup(
      <InlineGenerativeUi
        source={`
          root = Stack([reference, dashboard, runbook, comparison, inspector, planner])
          reference = ReferenceUi("Git cheat sheet", "Choose the safest command for the job.", [compare])
          compare = Tab("Compare", [gitTable], "git", "emerald")
          gitTable = Table(["Command", "Use"], [["merge", "Combine branches"], ["rebase", "Clean local history"]])
          dashboard = DashboardUi("Build health", "Current runtime status.", [metric1], [dashboardNote])
          metric1 = Metric("Checks", "3 passing", "emerald", "check")
          dashboardNote = Callout("Watch", "Latency is stable.", "emerald", "activity")
          runbook = RunbookUi("Deploy runbook", "Follow these steps in order.", [step1], [rollback])
          step1 = TimelineItem("Step 1", "Prepare", "Confirm clean working tree.", "blue")
          rollback = Callout("Rollback", "Keep the previous artifact available.", "amber", "alert")
          comparison = ComparisonUi("Storage choices", "Pick by durability and speed.", table2, [compareNote])
          table2 = Table(["Option", "Best for"], [["SQLite", "Local state"], ["Postgres", "Shared state"]])
          compareNote = Text("Prefer Postgres when multiple users write concurrently.")
          inspector = InspectorUi("Repository inspection", "Summary of available context.", [finding])
          finding = SourceStatus("Sources", ["loaded: README.md"])
          planner = PlannerUi("Migration plan", "Track rollout stages.", [phase1], [progress1])
          phase1 = TimelineItem("Phase 1", "Schema", "Add compatible columns.", "cyan")
          progress1 = Progress("Rollout", 2, 5, "cyan")
        `}
      />,
    );

    expect(markup).toContain("Git cheat sheet");
    expect(markup).toContain("Build health");
    expect(markup).toContain("Deploy runbook");
    expect(markup).toContain("Storage choices");
    expect(markup).toContain("Repository inspection");
    expect(markup).toContain("Migration plan");
    expect(markup).not.toContain("click to reveal definition");
  });

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

  it("renders StudyUi when flashcard and quiz arrays are assigned to reusable aliases", () => {
    const markup = renderToStaticMarkup(
      <InlineGenerativeUi
        source={`
          root = Stack([study, flashDeck, q1])
          study = StudyUi("Python async", "Review async safely.", [overview, review], cards, quizItems)
          overview = Tab("Overview", [intro], "study", "blue")
          intro = Text("Async code cooperatively waits at await points.")
          review = Tab("Review", [flashDeck, q1], "target", "emerald")
          flashDeck = Flashcards(cards)
          cards = [c1, c2]
          c1 = Flashcard("await", "Pauses the current coroutine.")
          c2 = Flashcard("event loop", "Schedules coroutine progress.")
          quizItems = [q1]
          q1 = Quiz("What does async help most?", ["CPU loops", "I/O waiting"], "I/O waiting")
        `}
      />,
    );

    expect(markup).toContain("Python async");
    expect(markup).toContain("Review");
    expect(markup).toContain("await");
    expect(markup).toContain("What does async help most?");
  });
});
