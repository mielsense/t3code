import { parseGenerateCommand } from "./generateCommand.ts";
import type { GenerateFileContext, GenerateGroundingContext } from "./generateFileContext.ts";

export function buildGenerativeUiProviderPrompt(
  text: string,
  options: {
    readonly fileContexts?: ReadonlyArray<GenerateFileContext>;
    readonly groundingContexts?: ReadonlyArray<GenerateGroundingContext>;
  } = {},
): string {
  const parsed = parseGenerateCommand(text);
  if (!parsed) {
    return text;
  }

  const request = parsed.prompt.length > 0 ? parsed.prompt : "Create the most useful inline UI.";
  const groundingContexts =
    options.groundingContexts ??
    options.fileContexts?.map((context) => ({
      source: "file" as const,
      label: context.path,
      status: "loaded" as const,
      content: context.content,
      truncated: context.truncated,
    })) ??
    [];
  const groundingSection =
    groundingContexts.length > 0
      ? [
          "Grounding context:",
          ...groundingContexts.map((context) =>
            [
              `--- ${context.source}: ${context.label} [${context.status}]${context.truncated ? " (truncated)" : ""} ---`,
              context.content,
            ].join("\n"),
          ),
          "",
        ].join("\n")
      : [
          "Grounding context:",
          "No grounding context was supplied. For stable general-knowledge requests, do not mention missing grounding and do not add a Sources tab or SourceStatus.",
          "External fetches are disabled. If the user asked for current data, remote data, GitHub data, files, repo-specific information, or other source-backed UI without supplied local context, state that external/source data was not provided instead of inventing values.",
          "",
        ].join("\n");
  const groundingStatusLines = groundingContexts.map(
    (context) => `- ${context.source}:${context.label}: ${context.status}`,
  );
  const groundingStatusInstructions =
    groundingContexts.length > 0
      ? [
          "Grounding status to render visibly in the UI:",
          ...groundingStatusLines,
          "Include SourceStatus only when local file context is present, and keep it small.",
          "",
        ]
      : [
          "Grounding status:",
          "- No grounding context was supplied. Do not render SourceStatus or a Sources tab for stable general-knowledge requests.",
          "- External fetches are disabled. Only mention missing source context if the request needs source-backed, current, file, repo, GitHub, URL, or live data.",
          "",
        ];
  return [
    "You are in T3 Code /generate mode.",
    "",
    "This is a UI-only response mode. Do not edit files and do not propose workspace changes. You may use provided local grounding context. If content is provided, the generated UI must be grounded in that content.",
    "",
    "Do not use placeholders, guessed live data, or external data. If source-backed grounding is missing or insufficient for a source-backed request, say that clearly and render a small status UI instead of fake values.",
    "",
    ...groundingStatusInstructions,
    "Return a short markdown sentence if useful, then exactly one fenced `openui` block. Do not return raw HTML, CSS, JavaScript, React, SVG, or markdown tables for the UI.",
    "",
    "The `openui` block uses this line-oriented component DSL:",
    "- Each line is `id = Component(args...)`.",
    "- The required root line is `root = Widget(title, children)`.",
    "- Strings use JSON string syntax.",
    "- Arrays use `[item1, item2]` and can contain string literals or references to earlier or later component ids.",
    "- Prefer several small referenced components over deeply nested calls.",
    '- Optional tone arguments accept "neutral", "blue", "emerald", "amber", "rose", "violet", or "cyan". Tones render as Gruvbox-inspired micro accents on icons, badges, and occasional text only.',
    "- Do not rely on colored panels, colored card borders, or colored backgrounds; the renderer intentionally keeps containers neutral.",
    '- Icon names accept "activity", "alert", "book", "brain", "check", "code", "data", "file", "git", "idea", "info", "lab", "layers", "list", "question", "sparkles", "study", "target", "trophy", "x", or "zap".',
    "",
    "Available components:",
    "- Widget(title: string, children: Component[])",
    "- Card(title: string, children: Component[], tone?: string, icon?: string)",
    "- Stack(children: Component[])",
    '- Text(text: string, variant?: "body" | "muted" | "heading" | "caption" | "label", tone?: string)',
    "- List(items: string[], tone?: string)",
    "- Table(headers: string[], rows: string[][])",
    "- Metric(label: string, value: string, tone?: string, icon?: string)",
    "- Button(label: string, variant?: string, icon?: string)",
    "- Badge(label: string, tone?: string, icon?: string)",
    "- Icon(name: string, tone?: string)",
    "- Callout(title: string, text: string, tone?: string, icon?: string)",
    "- CodeBlock(language: string, code: string)",
    "- Tabs(items: Tab[])",
    "- Tab(title: string, children: Component[], icon?: string, tone?: string)",
    "- Flashcards(cards: Flashcard[])",
    "- Flashcard(front: string, back: string, tone?: string, icon?: string)",
    "- Quiz(question: string, choices: string[], answer: string)",
    "- SourceStatus(title: string, items: string[])",
    "- HeroSummary(title: string, subtitle: string, metrics: Metric[], tone?: string, icon?: string)",
    "- StatGrid(metrics: Metric[])",
    "- Timeline(items: TimelineItem[])",
    "- TimelineItem(title: string, subtitle: string, detail: string, tone?: string)",
    "- Progress(label: string, value: number, max: number, tone?: string)",
    "- StudyDeck(title: string, summary: string, sections: Tab[], cards: Flashcard[], quiz: Quiz[])",
    "- Legacy StudyDeck(title: string, summary: string, cards: Flashcard[], quiz: Quiz[]) is supported, but prefer the sectioned form for new study guides.",
    "- ReferenceUi(title: string, summary: string, sections: Tab[] | Component[])",
    "- StudyUi(title: string, summary: string, sections: Tab[], cards: Flashcard[], quiz: Quiz[])",
    "- DashboardUi(title: string, summary: string, metrics: Metric[], content: Component[])",
    "- RunbookUi(title: string, summary: string, steps: TimelineItem[], content: Component[])",
    "- ComparisonUi(title: string, summary: string, table: Table, content?: Component[])",
    "- InspectorUi(title: string, summary: string, content: Component[])",
    "- PlannerUi(title: string, summary: string, timeline: TimelineItem[], progress: Progress[])",
    "",
    "First choose the UI type from the user's request:",
    "- Cheat sheet / reference / comparison: use ReferenceUi or ComparisonUi with concise overview, Tabs, Table, Card, List, CodeBlock, and Callout. Do not use StudyDeck, StudyUi, Flashcard, or Quiz unless the user explicitly asks for study, recall, flashcards, quiz, or practice.",
    "- Study guide / exam prep / learn-this: use StudyUi or StudyDeck only when the user asks to study, learn, revise, cram, prepare for an exam, memorize, or self-test.",
    "- Dashboard / status / report: use DashboardUi with metrics, progress, status, tables, and callouts. Do not invent current/live values when no local source data was provided.",
    "- Runbook / checklist / procedure: use RunbookUi with ordered steps, safety callouts, progress, and command/code examples.",
    "- Inspector / source summary / repo summary: use InspectorUi with SourceStatus, tables, findings, and grounded summaries from supplied local context only.",
    "- Planner / timeline / schedule: use PlannerUi with timeline items and progress bars.",
    "- Drill / flashcards / quiz: use Flashcards and Quiz only when the user explicitly asks for recall tools.",
    "",
    "Design guidance:",
    "- Prefer the smallest useful UI shape for the request. Do not add unrelated learning, quiz, or gamified sections.",
    "- For cheat sheets, references, and comparisons, prefer Tabs, Table, Card, List, CodeBlock, and Callout.",
    "- Do not include Flashcard or Quiz unless the user explicitly asks for flashcards, quiz, self-test, exam drill, memorization, recall, or practice questions.",
    "- Prefer HeroSummary, Badge, Callout, CodeBlock, and tone/icon arguments only when they serve the chosen UI type.",
    "- Use CodeBlock for code examples instead of putting code inside plain Text.",
    "- Every CodeBlock must be preceded by Text or Callout explaining what the concept is, when to use it, and why the example matters.",
    "- Use Callout for exam tips, warnings, gotchas, or key takeaways.",
    "- For study guides, make the default surface actual study content: overview notes, study plans, patterns, code examples, tables, and comparisons.",
    "- Use 3 or 4 study tabs at most. Prefer Overview, Plan, Patterns, and Reference/Comparisons; combine pitfalls, labs, and examples into those tabs instead of creating more tabs.",
    "- Flashcards and Quiz should be separate tabs after the study content tabs, not the first or primary content.",
    "- Put dense study material in Tab sections such as Overview, Study Plan, Must-Know Patterns, Quick Comparisons, or Reference.",
    "- Use Flashcard for short recall prompts only; put definitions, examples, and explanations in normal study tabs first.",
    "- Keep all panels neutral. Use tones only for icons, badges, quiz feedback, progress bars, and very small text highlights.",
    "- Flashcards render as full-width neutral reveal cards; do not assign a different tone to every flashcard.",
    "",
    "Example:",
    "```openui",
    'root = ReferenceUi("Git workflow cheat sheet", "Compare merge, rebase, cherry-pick, and stash by what history they create, when they are safe, and what risk they carry.", [compare, commands, safety])',
    'compare = Tab("Compare", [table], "git", "emerald")',
    'table = Table(["Command", "Best for", "History effect", "Main risk"], [["merge", "Combining finished branches", "Preserves branch history", "Extra merge commits"], ["rebase", "Cleaning local commits", "Rewrites commit bases", "Unsafe after sharing"], ["cherry-pick", "Copying selected commits", "Creates new commits", "Missed dependencies"], ["stash", "Temporarily shelving work", "No branch history change", "Forgetting hidden work"]])',
    'commands = Tab("Commands", [mergeText, mergeCode, rebaseText, rebaseCode], "code", "cyan")',
    'mergeText = Text("Use merge when the branch relationship matters and you want a non-destructive integration path.")',
    'mergeCode = CodeBlock("bash", "git switch main\\ngit merge feature/login")',
    'rebaseText = Text("Use rebase only for local commits that have not been shared, because it rewrites commit ancestry.")',
    'rebaseCode = CodeBlock("bash", "git switch feature/login\\ngit rebase main")',
    'safety = Tab("Safety", [warning, rules], "alert", "amber")',
    'warning = Callout("History rewrite rule", "Do not rebase commits that teammates may already have pulled.", "amber", "alert")',
    'rules = List(["Merge shared branches.", "Rebase local cleanup work.", "Cherry-pick small isolated fixes.", "Stash only as a short-term workspace shelf."], "emerald")',
    "```",
    "",
    groundingSection,
    "User request:",
    request,
  ].join("\n");
}
