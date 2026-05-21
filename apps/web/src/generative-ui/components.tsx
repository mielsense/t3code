import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { OpenUiValue } from "./openuiParser";
import { GeneratedIcon, toneStyles } from "./icons";
import type { GeneratedComponentProps, GenerativeUiTone, RenderContext } from "./renderingTypes";
import {
  asNumber,
  asString,
  asStringArray,
  asTone,
  keyForValue,
  resolveArray,
  resolveCall,
} from "./renderingUtils";

export function GeneratedWidget({ call, context, renderChildren }: GeneratedComponentProps) {
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm shadow-black/5">
      <div className="flex items-center gap-2 border-border/60 border-b px-4 py-3">
        <GeneratedIcon name="sparkles" tone="violet" />
        <div className="min-w-0 flex-1 truncate font-semibold text-sm">
          {asString(call.args[0], "Generated UI")}
        </div>
      </div>
      <div className="space-y-4 p-4">{renderChildren(call.args[1], context)}</div>
    </div>
  );
}

export function GeneratedCard({ call, context, renderChildren }: GeneratedComponentProps) {
  const tone = asTone(call.args[2]);
  const icon = asString(call.args[3]);
  return (
    <section className="relative overflow-hidden rounded-lg border border-border/70 bg-background/55 p-4 shadow-xs/5">
      <div className="mb-3 flex items-center gap-2">
        {icon ? <GeneratedIcon name={icon} tone={tone} /> : null}
        <h4 className="font-semibold text-sm">{asString(call.args[0], "Card")}</h4>
      </div>
      <div className="space-y-3">{renderChildren(call.args[1], context)}</div>
    </section>
  );
}

export function GeneratedStack({ call, context, renderChildren }: GeneratedComponentProps) {
  return <div className="space-y-3">{renderChildren(call.args[0], context)}</div>;
}

export function GeneratedText({ call }: GeneratedComponentProps) {
  const variant = asString(call.args[1], "body");
  const tone = asTone(call.args[2]);
  return (
    <p
      className={cn(
        "text-sm leading-relaxed",
        variant === "heading" && "font-semibold text-base text-foreground",
        variant === "muted" && "text-muted-foreground",
        variant === "caption" && "text-muted-foreground text-xs",
        variant === "label" &&
          cn("font-medium text-xs uppercase tracking-wide", toneStyles[tone].text),
        variant !== "label" && tone !== "neutral" && toneStyles[tone].text,
      )}
    >
      {asString(call.args[0])}
    </p>
  );
}

export function GeneratedList({ call }: GeneratedComponentProps) {
  const tone = asTone(call.args[1], "blue");
  return (
    <ul className="space-y-2 text-sm">
      {asStringArray(call.args[0]).map((item) => (
        <li key={item} className="flex gap-2 leading-relaxed">
          <GeneratedIcon className="mt-0.5 size-3.5" name="check" tone={tone} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function GeneratedMetric({ call }: GeneratedComponentProps) {
  const tone = asTone(call.args[2], "blue");
  const icon = asString(call.args[3], "activity");
  return (
    <div className="inline-flex min-w-36 flex-col rounded-lg border border-border/70 bg-background/45 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        <GeneratedIcon className="size-3.5" name={icon} tone={tone} />
        <span>{asString(call.args[0])}</span>
      </div>
      <span className="mt-1 font-semibold text-lg leading-tight">{asString(call.args[1])}</span>
    </div>
  );
}

export function GeneratedButton({ call }: GeneratedComponentProps) {
  const variant = asString(call.args[1], "outline") === "primary" ? "default" : "outline";
  const icon = asString(call.args[2]);
  return (
    <Button size="sm" variant={variant}>
      {icon ? <GeneratedIcon name={icon} /> : null}
      {asString(call.args[0], "Action")}
    </Button>
  );
}

export function GeneratedBadge({ call }: GeneratedComponentProps) {
  const tone = asTone(call.args[1], "blue");
  const icon = asString(call.args[2]);
  return (
    <Badge className={toneStyles[tone].chip} variant="outline">
      {icon ? <GeneratedIcon className="size-3" name={icon} tone={tone} /> : null}
      {asString(call.args[0], "Badge")}
    </Badge>
  );
}

export function GeneratedStandaloneIcon({ call }: GeneratedComponentProps) {
  return <GeneratedIcon name={asString(call.args[0], "sparkles")} tone={asTone(call.args[1])} />;
}

export function GeneratedCallout({ call }: GeneratedComponentProps) {
  const tone = asTone(call.args[2], "amber");
  const icon = asString(call.args[3], tone === "rose" ? "alert" : "idea");
  return (
    <aside className="rounded-lg border border-border/70 bg-background/45 px-3 py-2.5 text-sm">
      <div className="flex items-start gap-2">
        <GeneratedIcon className="mt-0.5" name={icon} tone={tone} />
        <div className="min-w-0">
          <div className="font-semibold">{asString(call.args[0], "Note")}</div>
          <p className="mt-1 text-muted-foreground leading-relaxed">{asString(call.args[1])}</p>
        </div>
      </div>
    </aside>
  );
}

export function GeneratedCodeBlock({ call }: GeneratedComponentProps) {
  const language = asString(call.args[0], "text");
  const code = asString(call.args[1]);
  return (
    <figure className="overflow-hidden rounded-lg border border-border/70 bg-muted/35">
      <figcaption className="flex items-center gap-2 border-border/60 border-b px-3 py-1.5 text-muted-foreground text-xs">
        <GeneratedIcon className="size-3.5" name="code" tone="cyan" />
        {language}
      </figcaption>
      <pre className="overflow-x-auto p-3 font-mono text-[0.8125rem] leading-relaxed">
        <code>{code}</code>
      </pre>
    </figure>
  );
}

export function GeneratedTable({ call }: GeneratedComponentProps) {
  const headers = asStringArray(call.args[0]);
  const rows = call.args[1];
  const rowValues = Array.isArray(rows)
    ? rows.filter((row): row is OpenUiValue[] => Array.isArray(row))
    : [];
  return (
    <div className="overflow-x-auto rounded-lg border border-border/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-semibold text-muted-foreground text-xs">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowValues.map((row, rowIndex) => (
            <tr key={keyForValue(row, rowIndex)} className="border-border/60 border-t">
              {headers.map((header, cellIndex) => {
                const cell = row[cellIndex];
                return (
                  <td key={header} className="px-3 py-2 align-top">
                    {typeof cell === "string" ? cell : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GeneratedTabs({ call, context, renderValue }: GeneratedComponentProps) {
  const tabs = resolveArray(call.args[0], context);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = tabs[activeIndex];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-lg border border-border/60 bg-background/45 p-1">
        {tabs.map((tab, index) => {
          const tabCall = resolveCall(tab, context);
          const title =
            tabCall?.component === "Tab"
              ? asString(tabCall.args[0], `Tab ${index + 1}`)
              : `Tab ${index + 1}`;
          const icon = tabCall?.component === "Tab" ? asString(tabCall.args[2]) : "";
          const tone = tabCall?.component === "Tab" ? asTone(tabCall.args[3]) : "neutral";
          return (
            <button
              key={keyForValue(tab, index)}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition",
                index === activeIndex
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {icon ? (
                <GeneratedIcon className="size-3.5" name={icon} tone={tone as GenerativeUiTone} />
              ) : null}
              {title}
            </button>
          );
        })}
      </div>
      {active ? renderValue(active, context) : null}
    </div>
  );
}

export function GeneratedTab({ call, context, renderChildren }: GeneratedComponentProps) {
  return <div className="space-y-3">{renderChildren(call.args[1], context)}</div>;
}

export function GeneratedFlashcards({ call, context, renderValue }: GeneratedComponentProps) {
  const values = resolveArray(call.args[0], context);
  return (
    <div className="space-y-3">
      {values.map((card, index) => (
        <div key={keyForValue(card, index)} className="min-w-0">
          {renderValue(card, context)}
        </div>
      ))}
    </div>
  );
}

export function GeneratedFlashcard({ call }: GeneratedComponentProps) {
  const [flipped, setFlipped] = useState(false);
  const tone = asTone(call.args[2], "violet");
  const icon = asString(call.args[3], "brain");
  return (
    <button
      type="button"
      onClick={() => setFlipped((value) => !value)}
      className="group w-full rounded-lg border border-border/70 bg-background/55 p-4 text-left text-sm transition hover:border-border hover:bg-background/70"
    >
      <span className="flex items-center gap-2 font-semibold text-base leading-tight">
        <GeneratedIcon className="size-3.5" name={icon} tone={tone} />
        {asString(call.args[0])}
      </span>
      <span className="mt-2 block text-muted-foreground text-xs">
        {flipped ? "definition revealed" : "click to reveal definition"}
      </span>
      {flipped ? (
        <span className="mt-3 block border-border/70 border-t pt-3 text-muted-foreground leading-relaxed">
          {asString(call.args[1])}
        </span>
      ) : null}
    </button>
  );
}

export function GeneratedQuiz({ call }: GeneratedComponentProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const choices = asStringArray(call.args[1]);
  const answer = asString(call.args[2]);
  return (
    <div className="rounded-lg border border-border/70 bg-background/55 p-4">
      <div className="flex items-start gap-2">
        <GeneratedIcon className="mt-0.5" name="question" tone="cyan" />
        <p className="font-semibold text-sm">{asString(call.args[0])}</p>
      </div>
      <div className="mt-3 grid gap-2">
        {choices.map((choice) => {
          const isSelected = selected === choice;
          const isCorrect = choice === answer;
          return (
            <button
              key={choice}
              type="button"
              onClick={() => setSelected(choice)}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2 text-left text-sm transition hover:bg-muted/35",
                isSelected &&
                  (isCorrect
                    ? "border-[#b8bb26]/45 text-[#b8bb26]"
                    : "border-[#fb4934]/45 text-[#fb4934]"),
              )}
            >
              <span>{choice}</span>
              {isSelected ? (
                <GeneratedIcon
                  name={isCorrect ? "check" : "x"}
                  tone={isCorrect ? "emerald" : "rose"}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GeneratedSourceStatus({ call }: GeneratedComponentProps) {
  return (
    <section className="rounded-lg border border-border/70 bg-background/45 p-3">
      <h4 className="flex items-center gap-2 font-medium text-sm">
        <GeneratedIcon name="file" tone="emerald" />
        {asString(call.args[0], "Grounding status")}
      </h4>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {asStringArray(call.args[1]).map((item) => {
          const lower = item.toLowerCase();
          const tone = lower.includes("failed")
            ? "rose"
            : lower.includes("loaded")
              ? "emerald"
              : "neutral";
          return (
            <Badge key={item} className={toneStyles[tone].chip} variant="outline">
              <GeneratedIcon
                className="size-3"
                name={tone === "rose" ? "alert" : "check"}
                tone={tone}
              />
              {item}
            </Badge>
          );
        })}
      </div>
    </section>
  );
}

export function GeneratedHeroSummary({ call, context, renderChildren }: GeneratedComponentProps) {
  const tone = asTone(call.args[3], "violet");
  const icon = asString(call.args[4], "study");
  return (
    <section className="rounded-xl border border-border/70 bg-background/55 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border border-border/70 bg-background/55 p-2">
          <GeneratedIcon name={icon} tone={tone} />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg leading-tight">
            {asString(call.args[0], "Summary")}
          </h3>
          <p className="mt-1 text-muted-foreground text-sm leading-relaxed">
            {asString(call.args[1])}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{renderChildren(call.args[2], context)}</div>
    </section>
  );
}

export function GeneratedStatGrid({ call, context, renderChildren }: GeneratedComponentProps) {
  return <div className="grid gap-2 sm:grid-cols-3">{renderChildren(call.args[0], context)}</div>;
}

export function GeneratedTimeline({ call, context, renderChildren }: GeneratedComponentProps) {
  return (
    <div className="space-y-2 border-border/70 border-l pl-4">
      {renderChildren(call.args[0], context)}
    </div>
  );
}

export function GeneratedTimelineItem({ call }: GeneratedComponentProps) {
  const tone = asTone(call.args[3], "blue");
  return (
    <div className="relative pb-3">
      <div
        className={cn("-left-[21px] absolute top-1 size-2 rounded-full", toneStyles[tone].accent)}
      />
      <h4 className="font-medium text-sm">{asString(call.args[0])}</h4>
      <p className="text-muted-foreground text-xs">{asString(call.args[1])}</p>
      <p className="mt-1 text-sm leading-relaxed">{asString(call.args[2])}</p>
    </div>
  );
}

export function GeneratedProgress({ call }: GeneratedComponentProps) {
  const value = asNumber(call.args[1]);
  const max = Math.max(1, asNumber(call.args[2], 100));
  const tone = asTone(call.args[3], "emerald");
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span>{asString(call.args[0])}</span>
        <span className="text-muted-foreground text-xs">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full", toneStyles[tone].accent)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function resolvedComponents(
  values: OpenUiValue | undefined,
  context: RenderContext,
  component: string,
): OpenUiValue[] {
  return resolveArray(values, context).filter(
    (value) => resolveCall(value, context)?.component === component,
  );
}

function hasRenderableValue(value: OpenUiValue | undefined): value is OpenUiValue {
  return value !== undefined;
}

function GeneratedIntentHeader({
  icon,
  summary,
  title,
  tone,
}: {
  icon: string;
  summary: string;
  title: string;
  tone: GenerativeUiTone;
}) {
  return (
    <header className="rounded-lg border border-border/70 bg-background/45 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <GeneratedIcon className="mt-0.5" name={icon} tone={tone} />
        <div className="min-w-0">
          <h3 className="font-semibold text-base leading-tight">{title}</h3>
          {summary ? (
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{summary}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function GeneratedSectionedIntent({
  call,
  context,
  icon,
  renderChildren,
  renderValue,
  tone,
}: GeneratedComponentProps & { icon: string; tone: GenerativeUiTone }) {
  const sections = call.args[2];
  const tabSections = resolvedComponents(sections, context, "Tab");
  return (
    <section className="space-y-4">
      <GeneratedIntentHeader
        icon={icon}
        summary={asString(call.args[1])}
        title={asString(call.args[0], "Generated UI")}
        tone={tone}
      />
      {tabSections.length > 0 ? (
        <GeneratedTabs
          call={{ type: "call", component: "Tabs", args: [tabSections] }}
          context={context}
          renderChildren={renderChildren}
          renderValue={renderValue}
        />
      ) : (
        <div className="space-y-3">{renderChildren(sections, context)}</div>
      )}
    </section>
  );
}

export function GeneratedReferenceUi(props: GeneratedComponentProps) {
  return <GeneratedSectionedIntent {...props} icon="book" tone="emerald" />;
}

export function GeneratedStudyUi(props: GeneratedComponentProps) {
  return <GeneratedStudyDeck {...props} />;
}

export function GeneratedDashboardUi({ call, context, renderChildren }: GeneratedComponentProps) {
  return (
    <section className="space-y-4">
      <GeneratedIntentHeader
        icon="activity"
        summary={asString(call.args[1])}
        title={asString(call.args[0], "Dashboard")}
        tone="cyan"
      />
      <GeneratedStatGrid
        call={{ type: "call", component: "StatGrid", args: [call.args[2] ?? []] }}
        context={context}
        renderChildren={renderChildren}
        renderValue={() => null}
      />
      <div className="space-y-3">{renderChildren(call.args[3], context)}</div>
    </section>
  );
}

export function GeneratedRunbookUi({ call, context, renderChildren }: GeneratedComponentProps) {
  return (
    <section className="space-y-4">
      <GeneratedIntentHeader
        icon="list"
        summary={asString(call.args[1])}
        title={asString(call.args[0], "Runbook")}
        tone="amber"
      />
      <GeneratedTimeline
        call={{ type: "call", component: "Timeline", args: [call.args[2] ?? []] }}
        context={context}
        renderChildren={renderChildren}
        renderValue={() => null}
      />
      <div className="space-y-3">{renderChildren(call.args[3], context)}</div>
    </section>
  );
}

export function GeneratedComparisonUi({
  call,
  context,
  renderChildren,
  renderValue,
}: GeneratedComponentProps) {
  return (
    <section className="space-y-4">
      <GeneratedIntentHeader
        icon="layers"
        summary={asString(call.args[1])}
        title={asString(call.args[0], "Comparison")}
        tone="blue"
      />
      {hasRenderableValue(call.args[2]) ? renderValue(call.args[2], context) : null}
      <div className="space-y-3">{renderChildren(call.args[3], context)}</div>
    </section>
  );
}

export function GeneratedInspectorUi(props: GeneratedComponentProps) {
  return <GeneratedSectionedIntent {...props} icon="file" tone="violet" />;
}

export function GeneratedPlannerUi({ call, context, renderChildren }: GeneratedComponentProps) {
  return (
    <section className="space-y-4">
      <GeneratedIntentHeader
        icon="target"
        summary={asString(call.args[1])}
        title={asString(call.args[0], "Plan")}
        tone="emerald"
      />
      <GeneratedTimeline
        call={{ type: "call", component: "Timeline", args: [call.args[2] ?? []] }}
        context={context}
        renderChildren={renderChildren}
        renderValue={() => null}
      />
      <div className="space-y-3">{renderChildren(call.args[3], context)}</div>
    </section>
  );
}

export function GeneratedStudyDeck({
  call,
  context,
  renderChildren,
  renderValue,
}: GeneratedComponentProps) {
  const maybeSections = call.args[2];
  const sections = resolvedComponents(maybeSections, context, "Tab");
  const usesSectionedDeck = sections.length > 0;
  const cards = usesSectionedDeck ? call.args[3] : call.args[2];
  const quizzes = usesSectionedDeck ? call.args[4] : call.args[3];
  const cardValues = resolveArray(cards, context);
  const quizValues = resolveArray(quizzes, context);
  const cardCount = cardValues.length;
  const quizCount = quizValues.length;
  const fallbackOverview: OpenUiValue = {
    type: "call",
    component: "Tab",
    args: [
      "Overview",
      [
        {
          type: "call",
          component: "Text",
          args: [asString(call.args[1]), "body"],
        },
      ],
      "book",
      "emerald",
    ],
  };
  const recallTabs: OpenUiValue[] = [
    ...(cardCount > 0
      ? [
          {
            type: "call" as const,
            component: "Tab",
            args: [
              "Flashcards",
              [
                {
                  type: "call" as const,
                  component: "Flashcards",
                  args: [cards ?? []],
                },
              ],
              "brain",
              "violet",
            ],
          },
        ]
      : []),
    ...(quizCount > 0
      ? [
          {
            type: "call" as const,
            component: "Tab",
            args: ["Quiz", quizzes ?? [], "question", "cyan"],
          },
        ]
      : []),
  ];
  const tabs = [...(usesSectionedDeck ? sections : [fallbackOverview]), ...recallTabs];
  return (
    <section className="space-y-4">
      <GeneratedIntentHeader
        icon="study"
        summary={asString(call.args[1])}
        title={asString(call.args[0], "Study deck")}
        tone="emerald"
      />
      <GeneratedTabs
        call={{ type: "call", component: "Tabs", args: [tabs] }}
        context={context}
        renderChildren={renderChildren}
        renderValue={renderValue}
      />
    </section>
  );
}
