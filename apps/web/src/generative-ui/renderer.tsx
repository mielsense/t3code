import type { ReactNode } from "react";
import type { OpenUiCall, OpenUiValue } from "./openuiParser";
import {
  GeneratedBadge,
  GeneratedButton,
  GeneratedCallout,
  GeneratedCard,
  GeneratedCodeBlock,
  GeneratedComparisonUi,
  GeneratedDashboardUi,
  GeneratedFlashcard,
  GeneratedFlashcards,
  GeneratedHeroSummary,
  GeneratedInspectorUi,
  GeneratedList,
  GeneratedMetric,
  GeneratedPlannerUi,
  GeneratedProgress,
  GeneratedQuiz,
  GeneratedReferenceUi,
  GeneratedRunbookUi,
  GeneratedSourceStatus,
  GeneratedStack,
  GeneratedStandaloneIcon,
  GeneratedStatGrid,
  GeneratedStudyDeck,
  GeneratedStudyUi,
  GeneratedTab,
  GeneratedTable,
  GeneratedTabs,
  GeneratedText,
  GeneratedTimeline,
  GeneratedTimelineItem,
  GeneratedWidget,
} from "./components";
import type { GeneratedComponentProps, RenderContext } from "./renderingTypes";
import { keyForValue } from "./renderingUtils";

export function renderChildren(value: OpenUiValue | undefined, context: RenderContext): ReactNode {
  const resolved =
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    value.type === "ref" &&
    !context.seen.has(value.name)
      ? context.program.statements.get(value.name)
      : value;
  if (!Array.isArray(resolved)) {
    return null;
  }
  const nextContext =
    value && typeof value === "object" && !Array.isArray(value) && value.type === "ref"
      ? { ...context, seen: new Set([...context.seen, value.name]) }
      : context;
  return resolved.map((entry, index) => (
    <RenderValue key={keyForValue(entry, index)} value={entry} context={nextContext} />
  ));
}

export function RenderValue({ value, context }: { value: OpenUiValue; context: RenderContext }) {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return <span>{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    return (
      <>
        {value.map((entry, index) => (
          <RenderValue key={keyForValue(entry, index)} value={entry} context={context} />
        ))}
      </>
    );
  }
  if (value.type === "ref") {
    if (context.seen.has(value.name)) {
      return null;
    }
    const resolved = context.program.statements.get(value.name);
    if (!resolved) {
      return null;
    }
    const nextContext = { ...context, seen: new Set([...context.seen, value.name]) };
    return <RenderValue value={resolved} context={nextContext} />;
  }
  return <RenderCall call={value} context={context} />;
}

export function RenderCall({ call, context }: { call: OpenUiCall; context: RenderContext }) {
  const props: GeneratedComponentProps = {
    call,
    context,
    renderChildren,
    renderValue: (value, nextContext) => <RenderValue value={value} context={nextContext} />,
  };

  switch (call.component) {
    case "Widget":
      return <GeneratedWidget {...props} />;
    case "Card":
      return <GeneratedCard {...props} />;
    case "Stack":
      return <GeneratedStack {...props} />;
    case "Text":
      return <GeneratedText {...props} />;
    case "List":
      return <GeneratedList {...props} />;
    case "Metric":
      return <GeneratedMetric {...props} />;
    case "Button":
      return <GeneratedButton {...props} />;
    case "Badge":
      return <GeneratedBadge {...props} />;
    case "Icon":
      return <GeneratedStandaloneIcon {...props} />;
    case "Callout":
      return <GeneratedCallout {...props} />;
    case "CodeBlock":
      return <GeneratedCodeBlock {...props} />;
    case "Table":
      return <GeneratedTable {...props} />;
    case "Tabs":
      return <GeneratedTabs {...props} />;
    case "Tab":
      return <GeneratedTab {...props} />;
    case "Flashcards":
      return <GeneratedFlashcards {...props} />;
    case "Flashcard":
      return <GeneratedFlashcard {...props} />;
    case "Quiz":
      return <GeneratedQuiz {...props} />;
    case "SourceStatus":
      return <GeneratedSourceStatus {...props} />;
    case "HeroSummary":
      return <GeneratedHeroSummary {...props} />;
    case "StatGrid":
      return <GeneratedStatGrid {...props} />;
    case "Timeline":
      return <GeneratedTimeline {...props} />;
    case "TimelineItem":
      return <GeneratedTimelineItem {...props} />;
    case "Progress":
      return <GeneratedProgress {...props} />;
    case "StudyDeck":
      return <GeneratedStudyDeck {...props} />;
    case "ReferenceUi":
    case "ReferenceGuide":
      return <GeneratedReferenceUi {...props} />;
    case "StudyUi":
    case "StudyGuide":
      return <GeneratedStudyUi {...props} />;
    case "DashboardUi":
    case "Dashboard":
      return <GeneratedDashboardUi {...props} />;
    case "RunbookUi":
    case "Runbook":
      return <GeneratedRunbookUi {...props} />;
    case "ComparisonUi":
    case "ComparisonGuide":
      return <GeneratedComparisonUi {...props} />;
    case "InspectorUi":
    case "Inspector":
      return <GeneratedInspectorUi {...props} />;
    case "PlannerUi":
    case "Planner":
      return <GeneratedPlannerUi {...props} />;
    default:
      return <UnknownOpenUiComponent component={call.component} />;
  }
}

function UnknownOpenUiComponent({ component }: { component: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/55 p-3 text-muted-foreground text-sm">
      Unknown OpenUI component: <code className="text-foreground">{component}</code>
    </div>
  );
}
