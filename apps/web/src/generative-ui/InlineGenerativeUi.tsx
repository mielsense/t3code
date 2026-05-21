import { useMemo, useState, type ReactNode } from "react";
import {
  parseOpenUiProgram,
  type OpenUiCall,
  type OpenUiProgram,
  type OpenUiValue,
} from "./openuiParser";
import { cn } from "~/lib/utils";

interface InlineGenerativeUiProps {
  source: string;
}

type RenderContext = {
  program: OpenUiProgram;
  seen: Set<string>;
};

function asString(value: OpenUiValue | undefined, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: OpenUiValue | undefined): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];
}

function renderChildren(value: OpenUiValue | undefined, context: RenderContext): ReactNode {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((entry, index) => (
    <RenderValue key={keyForValue(entry, index)} value={entry} context={context} />
  ));
}

function RenderValue({ value, context }: { value: OpenUiValue; context: RenderContext }) {
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

function RenderCall({ call, context }: { call: OpenUiCall; context: RenderContext }) {
  switch (call.component) {
    case "Widget":
      return (
        <div className="my-3 overflow-hidden rounded-lg border border-border/70 bg-card/70 shadow-sm">
          <div className="border-border/60 border-b px-4 py-3 font-medium text-sm">
            {asString(call.args[0], "Generated UI")}
          </div>
          <div className="space-y-3 p-4">{renderChildren(call.args[1], context)}</div>
        </div>
      );
    case "Card":
      return (
        <section className="rounded-md border border-border/70 bg-background/70 p-3">
          <h4 className="mb-2 font-medium text-sm">{asString(call.args[0], "Card")}</h4>
          <div className="space-y-2">{renderChildren(call.args[1], context)}</div>
        </section>
      );
    case "Stack":
      return <div className="space-y-2">{renderChildren(call.args[0], context)}</div>;
    case "Text": {
      const variant = asString(call.args[1], "body");
      return (
        <p
          className={cn(
            "text-sm",
            variant === "heading" && "font-semibold text-foreground",
            variant === "muted" && "text-muted-foreground",
            variant === "caption" && "text-muted-foreground text-xs",
          )}
        >
          {asString(call.args[0])}
        </p>
      );
    }
    case "List":
      return (
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {asStringArray(call.args[0]).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case "Metric":
      return (
        <div className="inline-flex min-w-32 flex-col rounded-md border border-border/70 bg-background/70 px-3 py-2">
          <span className="text-muted-foreground text-xs">{asString(call.args[0])}</span>
          <span className="font-semibold text-lg">{asString(call.args[1])}</span>
        </div>
      );
    case "Button":
      return (
        <button
          type="button"
          className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        >
          {asString(call.args[0], "Action")}
        </button>
      );
    case "Table":
      return <GeneratedTable headers={asStringArray(call.args[0])} rows={call.args[1]} />;
    case "Tabs":
      return <GeneratedTabs items={call.args[0]} context={context} />;
    case "Tab":
      return <div className="space-y-2">{renderChildren(call.args[1], context)}</div>;
    case "Flashcards":
      return <Flashcards cards={call.args[0]} context={context} />;
    case "Flashcard":
      return <Flashcard front={asString(call.args[0])} back={asString(call.args[1])} />;
    case "Quiz":
      return (
        <Quiz
          question={asString(call.args[0])}
          choices={asStringArray(call.args[1])}
          answer={asString(call.args[2])}
        />
      );
    case "Weather":
      return (
        <div className="rounded-md border border-border/70 bg-background/70 p-3">
          <div className="text-muted-foreground text-xs">{asString(call.args[0])}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-semibold text-2xl">{asString(call.args[1])}</span>
            <span className="text-sm">{asString(call.args[2])}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {asStringArray(call.args[3]).map((detail) => (
              <span
                key={detail}
                className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs"
              >
                {detail}
              </span>
            ))}
          </div>
        </div>
      );
    case "SourceStatus":
      return (
        <section className="rounded-md border border-border/70 bg-background/70 p-3">
          <h4 className="font-medium text-sm">{asString(call.args[0], "Grounding status")}</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {asStringArray(call.args[1]).map((item) => (
              <span
                key={item}
                className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      );
    case "HeroSummary":
      return (
        <section className="rounded-md border border-border/70 bg-background/70 p-4">
          <h3 className="font-semibold text-base">{asString(call.args[0], "Summary")}</h3>
          <p className="mt-1 text-muted-foreground text-sm">{asString(call.args[1])}</p>
          <div className="mt-4 flex flex-wrap gap-2">{renderChildren(call.args[2], context)}</div>
        </section>
      );
    case "StatGrid":
      return (
        <div className="grid gap-2 sm:grid-cols-3">{renderChildren(call.args[0], context)}</div>
      );
    case "Timeline":
      return (
        <div className="space-y-2 border-border/70 border-l pl-4">
          {renderChildren(call.args[0], context)}
        </div>
      );
    case "TimelineItem":
      return (
        <div className="relative pb-3">
          <div className="-left-[21px] absolute top-1 size-2 rounded-full bg-foreground/50" />
          <h4 className="font-medium text-sm">{asString(call.args[0])}</h4>
          <p className="text-muted-foreground text-xs">{asString(call.args[1])}</p>
          <p className="mt-1 text-sm">{asString(call.args[2])}</p>
        </div>
      );
    case "Progress": {
      const value = typeof call.args[1] === "number" ? call.args[1] : 0;
      const max = typeof call.args[2] === "number" && call.args[2] > 0 ? call.args[2] : 100;
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
            <div className="h-full bg-foreground/70" style={{ width: `${percent}%` }} />
          </div>
        </div>
      );
    }
    case "StudyDeck":
      return (
        <section className="space-y-3">
          <HeroSummaryFromStudyDeck call={call} context={context} />
          <Flashcards cards={call.args[2]} context={context} />
          <div className="space-y-2">{renderChildren(call.args[3], context)}</div>
        </section>
      );
    default:
      return null;
  }
}

function HeroSummaryFromStudyDeck({ call, context }: { call: OpenUiCall; context: RenderContext }) {
  return (
    <section className="rounded-md border border-border/70 bg-background/70 p-4">
      <h3 className="font-semibold text-base">{asString(call.args[0], "Study deck")}</h3>
      <p className="mt-1 text-muted-foreground text-sm">{asString(call.args[1])}</p>
      <div className="mt-3">
        <ProgressFromCounts cards={call.args[2]} context={context} />
      </div>
    </section>
  );
}

function ProgressFromCounts({
  cards,
  context,
}: {
  cards: OpenUiValue | undefined;
  context: RenderContext;
}) {
  const count = Array.isArray(cards) ? cards.length : 0;
  return (
    <RenderCall
      call={{ type: "call", component: "Progress", args: ["Cards loaded", count, count || 1] }}
      context={context}
    />
  );
}

function GeneratedTable({ headers, rows }: { headers: string[]; rows: OpenUiValue | undefined }) {
  const rowValues = Array.isArray(rows)
    ? rows.filter((row): row is OpenUiValue[] => Array.isArray(row))
    : [];
  return (
    <div className="overflow-x-auto rounded-md border border-border/70">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/60">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowValues.map((row, rowIndex) => (
            <tr key={keyForValue(row, rowIndex)} className="border-border/60 border-t">
              {row.map((cell) => (
                <td key={String(cell)} className="px-3 py-2">
                  {typeof cell === "string" ? cell : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GeneratedTabs({
  items,
  context,
}: {
  items: OpenUiValue | undefined;
  context: RenderContext;
}) {
  const tabs = Array.isArray(items) ? items : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const active = tabs[activeIndex];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1 rounded-md bg-muted/60 p-1">
        {tabs.map((tab, index) => {
          const call = resolveCall(tab, context);
          const title =
            call?.component === "Tab"
              ? asString(call.args[0], `Tab ${index + 1}`)
              : `Tab ${index + 1}`;
          return (
            <button
              key={keyForValue(tab, index)}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "rounded px-2.5 py-1 text-xs",
                index === activeIndex ? "bg-background shadow-sm" : "text-muted-foreground",
              )}
            >
              {title}
            </button>
          );
        })}
      </div>
      {active ? <RenderValue value={active} context={context} /> : null}
    </div>
  );
}

function Flashcards({
  cards,
  context,
}: {
  cards: OpenUiValue | undefined;
  context: RenderContext;
}) {
  const values = Array.isArray(cards) ? cards : [];
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {values.map((card, index) => (
        <RenderValue key={keyForValue(card, index)} value={card} context={context} />
      ))}
    </div>
  );
}

function Flashcard({ front, back }: { front: string; back: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((value) => !value)}
      className="min-h-28 rounded-md border border-border/70 bg-background/70 p-3 text-left text-sm transition hover:border-border"
    >
      <span className="text-muted-foreground text-xs">{flipped ? "Back" : "Front"}</span>
      <span className="mt-2 block">{flipped ? back : front}</span>
    </button>
  );
}

function Quiz({
  question,
  choices,
  answer,
}: {
  question: string;
  choices: string[];
  answer: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="rounded-md border border-border/70 bg-background/70 p-3">
      <p className="font-medium text-sm">{question}</p>
      <div className="mt-3 grid gap-2">
        {choices.map((choice) => (
          <button
            key={choice}
            type="button"
            onClick={() => setSelected(choice)}
            className={cn(
              "rounded-md border border-border/70 px-3 py-2 text-left text-sm",
              selected === choice &&
                (choice === answer
                  ? "border-emerald-500/70 bg-emerald-500/10"
                  : "border-destructive/70 bg-destructive/10"),
            )}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

function resolveCall(value: OpenUiValue, context: RenderContext): OpenUiCall | null {
  if (typeof value !== "object" || Array.isArray(value)) return null;
  if (value.type === "call") return value;
  return context.program.statements.get(value.name) ?? null;
}

function keyForValue(value: OpenUiValue, fallback: number): string {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `${String(value)}:${fallback}`;
  }
  if (Array.isArray(value)) {
    return `array:${value.length}:${fallback}`;
  }
  if (value.type === "ref") {
    return `ref:${value.name}`;
  }
  return `call:${value.component}:${fallback}`;
}

export function InlineGenerativeUi({ source }: InlineGenerativeUiProps) {
  const result = useMemo(() => {
    try {
      return { program: parseOpenUiProgram(source), error: null };
    } catch (error) {
      return {
        program: null,
        error: error instanceof Error ? error.message : "Invalid generated UI.",
      };
    }
  }, [source]);

  if (!result.program) {
    return (
      <pre className="overflow-x-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
        {result.error}
        {"\n\n"}
        {source}
      </pre>
    );
  }

  return (
    <RenderCall
      call={result.program.root}
      context={{ program: result.program, seen: new Set(["root"]) }}
    />
  );
}
