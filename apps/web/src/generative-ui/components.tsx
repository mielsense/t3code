import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { OpenUiValue } from "./openuiParser";
import { GeneratedIcon, toneStyles } from "./icons";
import type { GeneratedComponentProps, GenerativeUiTone } from "./renderingTypes";
import {
  asNumber,
  asString,
  asStringArray,
  asTone,
  keyForValue,
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
  const tabs = Array.isArray(call.args[0]) ? call.args[0] : [];
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
  const values = Array.isArray(call.args[0]) ? call.args[0] : [];
  return (
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2">
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
      className="group flex h-full min-h-32 w-full flex-col rounded-lg border border-border/70 bg-background/55 p-4 text-left text-sm transition hover:border-border hover:shadow-sm hover:shadow-black/10"
    >
      <span className="flex items-center gap-2 text-muted-foreground text-xs">
        <GeneratedIcon className="size-3.5" name={icon} tone={tone} />
        {flipped ? "Back" : "Front"}
      </span>
      <span className="mt-3 block text-base leading-relaxed">
        {flipped ? asString(call.args[1]) : asString(call.args[0])}
      </span>
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

export function GeneratedWeather({ call }: GeneratedComponentProps) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/55 p-4">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <GeneratedIcon name="weather" tone="cyan" />
        {asString(call.args[0])}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-semibold text-3xl">{asString(call.args[1])}</span>
        <span className="text-sm">{asString(call.args[2])}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {asStringArray(call.args[3]).map((detail) => (
          <Badge key={detail} className={toneStyles.cyan.chip} variant="outline">
            {detail}
          </Badge>
        ))}
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

export function GeneratedStudyDeck({ call, context, renderValue }: GeneratedComponentProps) {
  const cards = call.args[2];
  const count = Array.isArray(cards) ? cards.length : 0;
  return (
    <section className="space-y-4">
      <GeneratedHeroSummary
        call={{
          type: "call",
          component: "HeroSummary",
          args: [
            asString(call.args[0], "Study deck"),
            asString(call.args[1]),
            [
              {
                type: "call",
                component: "Metric",
                args: ["Cards", String(count), "violet", "brain"],
              },
            ],
            "violet",
            "study",
          ],
        }}
        context={context}
        renderChildren={(value, nextContext) => {
          if (!Array.isArray(value)) return null;
          return value.map((entry, index) => (
            <span key={keyForValue(entry, index)}>{renderValue(entry, nextContext)}</span>
          ));
        }}
        renderValue={renderValue}
      />
      <GeneratedFlashcards
        call={{ type: "call", component: "Flashcards", args: [cards ?? []] }}
        context={context}
        renderChildren={() => null}
        renderValue={renderValue}
      />
      <div className="space-y-3">
        {Array.isArray(call.args[3])
          ? call.args[3].map((entry, index) => (
              <div key={keyForValue(entry, index)}>{renderValue(entry, context)}</div>
            ))
          : null}
      </div>
    </section>
  );
}
