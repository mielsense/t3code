# Inline Generative UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/generate` as an explicit UI-only response mode with inline generated widgets rendered from fenced `openui` blocks.

**Architecture:** The server wraps `/generate` prompts before provider dispatch. The web composer exposes `/generate`, and `ChatMarkdown` routes fenced `openui` blocks to a focused parser/renderer with graceful source fallback.

**Tech Stack:** TypeScript, React, Vitest, existing T3 Code markdown renderer, no new runtime dependency in this slice.

---

### Task 1: Server Prompt Mode

**Files:**

- Create: `apps/server/src/orchestration/generativeUiPrompt.ts`
- Test: `apps/server/src/orchestration/generativeUiPrompt.test.ts`
- Modify: `apps/server/src/orchestration/Layers/ProviderCommandReactor.ts`

- [x] Add `parseGenerateCommand` for leading `/generate` and `@generate`.
- [x] Add `buildGenerativeUiProviderPrompt` with UI-only instructions and the supported DSL.
- [x] Apply prompt wrapping only at provider dispatch time so stored chat messages remain unchanged.
- [x] Cover slash parsing, mention parsing, prompt wrapping, and normal passthrough with Vitest.

### Task 2: Composer Command

**Files:**

- Modify: `apps/web/src/composer-logic.ts`
- Modify: `apps/web/src/components/chat/ChatComposer.tsx`
- Test: `apps/web/src/composer-logic.test.ts`

- [x] Add `generate` to built-in composer slash command typing.
- [x] Show `/generate` in the slash menu.
- [x] Insert `/generate ` into the prompt instead of toggling interaction mode.
- [x] Confirm `/generate` is not treated as a standalone `/plan` or `/default` mode command.

### Task 3: Inline DSL Parser

**Files:**

- Create: `apps/web/src/generative-ui/openuiParser.ts`
- Test: `apps/web/src/generative-ui/openuiParser.test.ts`

- [x] Parse line-oriented `id = Component(args...)` statements.
- [x] Support JSON strings, numbers, booleans, references, arrays, and component calls.
- [x] Require a `root` component call.
- [x] Cover valid programs and missing-root failures.

### Task 4: Inline Renderer

**Files:**

- Create: `apps/web/src/generative-ui/InlineGenerativeUi.tsx`
- Modify: `apps/web/src/components/ChatMarkdown.tsx`

- [x] Render `openui` fenced blocks through the inline UI renderer.
- [x] Add first-slice components: widget shell, cards, stack, text, list, metric, button, table, tabs, flashcards, quiz, and weather.
- [x] Show parse errors and source text instead of throwing.

### Task 5: Verification

**Files:**

- All touched files

- [x] Run `bun fmt`.
- [x] Run focused Vitest suites for web parser/composer and server prompt wrapping.
- [x] Run `bun lint`.
- [x] Run `bun typecheck`.
