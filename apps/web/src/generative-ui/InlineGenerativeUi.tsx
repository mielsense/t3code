import { useMemo } from "react";
import { parseOpenUiProgram } from "./openuiParser";
import { RenderCall } from "./renderer";

interface InlineGenerativeUiProps {
  source: string;
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
      <pre className="overflow-x-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
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
