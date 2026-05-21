import type { ReactNode } from "react";
import type { OpenUiCall, OpenUiProgram, OpenUiValue } from "./openuiParser";

export type GenerativeUiTone =
  | "neutral"
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "cyan";

export interface RenderContext {
  program: OpenUiProgram;
  seen: Set<string>;
}

export interface GeneratedComponentProps {
  call: OpenUiCall;
  context: RenderContext;
  renderChildren: (value: OpenUiValue | undefined, context: RenderContext) => ReactNode;
  renderValue: (value: OpenUiValue, context: RenderContext) => ReactNode;
}
