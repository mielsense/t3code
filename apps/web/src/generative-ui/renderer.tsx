import type { ReactNode } from "react";
import type { OpenUiCall, OpenUiValue } from "./openuiParser";
import {
  GeneratedBadge,
  GeneratedButton,
  GeneratedCallout,
  GeneratedCard,
  GeneratedCodeBlock,
  GeneratedFlashcard,
  GeneratedFlashcards,
  GeneratedHeroSummary,
  GeneratedList,
  GeneratedMetric,
  GeneratedProgress,
  GeneratedQuiz,
  GeneratedSourceStatus,
  GeneratedStack,
  GeneratedStandaloneIcon,
  GeneratedStatGrid,
  GeneratedStudyDeck,
  GeneratedTab,
  GeneratedTable,
  GeneratedTabs,
  GeneratedText,
  GeneratedTimeline,
  GeneratedTimelineItem,
  GeneratedWeather,
  GeneratedWidget,
} from "./components";
import type { GeneratedComponentProps, RenderContext } from "./renderingTypes";
import { keyForValue } from "./renderingUtils";

export function renderChildren(value: OpenUiValue | undefined, context: RenderContext): ReactNode {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry, index) => (
    <RenderValue key={keyForValue(entry, index)} value={entry} context={context} />
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
    const call = context.program.statements.get(value.name);
    if (!call) {
      return null;
    }
    const nextContext = { ...context, seen: new Set([...context.seen, value.name]) };
    return <RenderCall call={call} context={nextContext} />;
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
    case "Weather":
      return <GeneratedWeather {...props} />;
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
    default:
      return null;
  }
}
