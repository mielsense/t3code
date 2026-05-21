# Inline Generative UI Design

## Goal

Add a `/generate` workflow that asks the provider for a UI-only answer and renders validated inline widgets inside chat messages.

## Product Boundary

`/generate` is explicit opt-in. Normal chat remains markdown-first. A generate turn is UI-only: the provider should not edit files, run commands, or propose workspace changes. The user-facing message remains the original prompt, while the provider receives additional generation instructions.

The first version renders a constrained component DSL in fenced `openui` blocks. Arbitrary HTML/CSS/JS is intentionally deferred to a later sandboxed artifact mode.

## Architecture

The server detects leading `/generate` or `@generate` text before dispatching a provider turn. It wraps the provider message with T3 Code instructions that require exactly one fenced `openui` block and document the supported component DSL.

The web app extends the composer slash command menu with `/generate`. Assistant markdown rendering detects fenced `openui` code blocks and sends them to a dedicated inline renderer. Invalid DSL output falls back to an error panel plus source text so malformed model output does not break the timeline.

## Component DSL

The inline DSL is line-oriented:

```text
root = Widget("Study cards", [intro, cards])
intro = Text("Review the key ideas.", "muted")
cards = Flashcards([card1])
card1 = Flashcard("Question", "Answer")
```

Supported components in the first slice are `Widget`, `Card`, `Stack`, `Text`, `List`, `Table`, `Metric`, `Button`, `Tabs`, `Tab`, `Flashcards`, `Flashcard`, `Quiz`, and `Weather`.

## Error Handling

The parser requires a `root` statement and rejects malformed lines, unterminated strings, invalid statement ids, and non-component statement values. Rendering ignores unknown components and missing references rather than throwing during React render.

## Testing

Unit coverage validates `/generate` prompt wrapping, normal prompt passthrough, composer command behavior, and parser handling of valid and invalid programs. Repository completion still requires `bun fmt`, `bun lint`, and `bun typecheck`.
