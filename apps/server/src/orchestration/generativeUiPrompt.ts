// @effect-diagnostics nodeBuiltinImport:off
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const GENERATE_COMMAND_PATTERN = /^\s*(?:\/generate|@generate)(?:\s+|$)/i;
const MENTION_PATTERN = /@([^\s@]+)/g;
const MAX_CONTEXT_FILES = 4;
const MAX_CONTEXT_CHARS_PER_FILE = 24_000;
const MAX_TEXT_FILE_BYTES = 256 * 1024;
const MAX_EXTERNAL_CONTEXTS = 4;
const MAX_EXTERNAL_CONTEXT_CHARS = 18_000;
const FETCH_TIMEOUT_MS = 6_000;

export function parseGenerateCommand(text: string): { prompt: string } | null {
  if (!GENERATE_COMMAND_PATTERN.test(text)) {
    return null;
  }

  return {
    prompt: text.replace(GENERATE_COMMAND_PATTERN, "").trim(),
  };
}

export interface GenerateFileContext {
  readonly path: string;
  readonly content: string;
  readonly truncated: boolean;
}

export interface GenerateGroundingContext {
  readonly source: "file" | "github" | "url" | "weather";
  readonly label: string;
  readonly status: "loaded" | "failed";
  readonly content: string;
  readonly truncated: boolean;
}

export function collectGenerateFileContexts(input: {
  readonly text: string;
  readonly cwd: string;
}): GenerateFileContext[] {
  const parsed = parseGenerateCommand(input.text);
  if (!parsed) {
    return [];
  }

  const contexts: GenerateFileContext[] = [];
  const seen = new Set<string>();
  for (const mention of extractMentionCandidates(input.text)) {
    const filePath = resolveMentionedFilePath(input.cwd, mention);
    if (!filePath || seen.has(filePath)) {
      continue;
    }
    seen.add(filePath);
    const context = readGenerateFileContext(filePath);
    if (context) {
      contexts.push(context);
    }
    if (contexts.length >= MAX_CONTEXT_FILES) {
      break;
    }
  }
  return contexts;
}

export async function collectGenerateGroundingContexts(input: {
  readonly text: string;
  readonly cwd: string;
  readonly fetchImpl?: typeof fetch;
}): Promise<GenerateGroundingContext[]> {
  const parsed = parseGenerateCommand(input.text);
  if (!parsed) {
    return [];
  }
  const fetchImpl = input.fetchImpl ?? fetch;
  const contexts: GenerateGroundingContext[] = collectGenerateFileContexts(input).map(
    (context) => ({
      source: "file",
      label: context.path,
      status: "loaded",
      content: context.content,
      truncated: context.truncated,
    }),
  );

  for (const resolver of buildExternalResolvers(parsed.prompt)) {
    if (contexts.length >= MAX_CONTEXT_FILES + MAX_EXTERNAL_CONTEXTS) {
      break;
    }
    contexts.push(await resolver(fetchImpl));
  }

  return contexts;
}

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
          "No grounding context was available. If the user asked for current data, remote data, GitHub data, weather, or file-derived UI, state that the data could not be loaded instead of inventing values.",
          "",
        ].join("\n");
  const groundingStatusLines =
    groundingContexts.length > 0
      ? groundingContexts.map(
          (context) => `- ${context.source}:${context.label}: ${context.status}`,
        )
      : ["- none: failed"];
  return [
    "You are in T3 Code /generate mode.",
    "",
    "This is a UI-only response mode. Do not edit files and do not propose workspace changes. You may use provided grounding context. If content is provided, the generated UI must be grounded in that content.",
    "",
    "Do not use placeholders or guessed live data. If grounding context is missing or insufficient, say that clearly and render a small status UI instead of fake values.",
    "",
    "Grounding status to render visibly in the UI:",
    ...groundingStatusLines,
    "Include SourceStatus as the first or second child in the Widget so the user can see which sources were loaded or failed.",
    "",
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
    '- Icon names accept "activity", "alert", "book", "brain", "check", "code", "data", "file", "git", "idea", "info", "lab", "layers", "list", "question", "sparkles", "study", "target", "trophy", "weather", "x", or "zap".',
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
    "- Weather(location: string, temperature: string, condition: string, details?: string[])",
    "- SourceStatus(title: string, items: string[])",
    "- HeroSummary(title: string, subtitle: string, metrics: Metric[], tone?: string, icon?: string)",
    "- StatGrid(metrics: Metric[])",
    "- Timeline(items: TimelineItem[])",
    "- TimelineItem(title: string, subtitle: string, detail: string, tone?: string)",
    "- Progress(label: string, value: number, max: number, tone?: string)",
    "- StudyDeck(title: string, summary: string, sections: Tab[], cards: Flashcard[], quiz: Quiz[])",
    "- Legacy StudyDeck(title: string, summary: string, cards: Flashcard[], quiz: Quiz[]) is supported, but prefer the sectioned form for new study guides.",
    "",
    "First choose the UI type from the user's request:",
    "- Cheat sheet / reference / comparison: use Widget with concise overview, Tabs, Table, Card, List, CodeBlock, and Callout. Do not use StudyDeck, Flashcard, or Quiz unless the user explicitly asks for study, recall, flashcards, quiz, or practice.",
    "- Study guide / exam prep / learn-this: use StudyDeck only when the user asks to study, learn, revise, cram, prepare for an exam, memorize, or self-test.",
    "- Dashboard / status / report: use HeroSummary, StatGrid, Metric, Progress, Table, SourceStatus, and Callout.",
    "- Runbook / checklist / procedure: use Card, List, Timeline, TimelineItem, Progress, Callout, and CodeBlock.",
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
    'root = Widget("Git workflow cheat sheet", [status, summary, tabs])',
    'status = SourceStatus("Sources", ["none: failed"])',
    'summary = Text("Compare merge, rebase, cherry-pick, and stash by what history they create, when they are safe, and what risk they carry.")',
    "tabs = Tabs([compare, commands, safety])",
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

type ExternalResolver = (fetchImpl: typeof fetch) => Promise<GenerateGroundingContext>;

function buildExternalResolvers(prompt: string): ExternalResolver[] {
  const resolvers: ExternalResolver[] = [];
  const urls = extractUrls(prompt);
  for (const url of urls) {
    const githubTarget = parseGitHubUrl(url);
    resolvers.push(githubTarget ? githubResolver(githubTarget) : urlResolver(url));
  }

  const githubUsername = extractGitHubUsernameRequest(prompt);
  if (githubUsername && !urls.some((url) => url.includes("github.com"))) {
    resolvers.push(githubResolver({ type: "user", owner: githubUsername }));
  }

  const weatherLocation = extractWeatherLocation(prompt);
  if (weatherLocation) {
    resolvers.push(weatherResolver(weatherLocation));
  }

  return resolvers.slice(0, MAX_EXTERNAL_CONTEXTS);
}

function extractUrls(text: string): string[] {
  return [...text.matchAll(/https?:\/\/[^\s)]+/gi)].map((match) => match[0]);
}

type GitHubTarget =
  | { readonly type: "user"; readonly owner: string }
  | { readonly type: "repo"; readonly owner: string; readonly repo: string };

function parseGitHubUrl(rawUrl: string): GitHubTarget | null {
  try {
    const url = new URL(rawUrl);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      return null;
    }
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    if (!owner) {
      return null;
    }
    return repo ? { type: "repo", owner, repo } : { type: "user", owner };
  } catch {
    return null;
  }
}

function extractGitHubUsernameRequest(prompt: string): string | null {
  if (!/\bgithub\b/i.test(prompt)) {
    return null;
  }
  const forMatch = /\bfor\s+([A-Za-z0-9-]{1,39})\b/i.exec(prompt);
  if (forMatch?.[1]) {
    return forMatch[1];
  }
  const words = prompt.match(/\b[A-Za-z0-9-]{1,39}\b/g) ?? [];
  const ignored = new Set([
    "generate",
    "github",
    "commit",
    "commits",
    "dashboard",
    "activity",
    "data",
    "user",
    "profile",
    "repo",
    "repository",
  ]);
  return words.findLast((word) => !ignored.has(word.toLowerCase())) ?? null;
}

function extractWeatherLocation(prompt: string): string | null {
  const match = /\bweather\s+(?:for|in)\s+([A-Za-z][A-Za-z\s,.-]{1,80})/i.exec(prompt);
  return match?.[1]?.trim().replace(/[.?!]$/, "") ?? null;
}

function githubResolver(target: GitHubTarget): ExternalResolver {
  return async (fetchImpl) => {
    try {
      if (target.type === "repo") {
        const [repo, commits] = await Promise.all([
          fetchJson(fetchImpl, `https://api.github.com/repos/${target.owner}/${target.repo}`),
          fetchJson(
            fetchImpl,
            `https://api.github.com/repos/${target.owner}/${target.repo}/commits?per_page=20`,
          ),
        ]);
        return loadedExternalContext(
          "github",
          `${target.owner}/${target.repo}`,
          JSON.stringify({ repo, recentCommits: commits }, null, 2),
        );
      }

      const [user, repos, events] = await Promise.all([
        fetchJson(fetchImpl, `https://api.github.com/users/${target.owner}`),
        fetchJson(
          fetchImpl,
          `https://api.github.com/users/${target.owner}/repos?sort=pushed&per_page=20`,
        ),
        fetchJson(
          fetchImpl,
          `https://api.github.com/users/${target.owner}/events/public?per_page=30`,
        ),
      ]);
      return loadedExternalContext(
        "github",
        target.owner,
        JSON.stringify({ user, repositories: repos, recentEvents: events }, null, 2),
      );
    } catch (error) {
      return failedExternalContext(
        "github",
        target.type === "repo" ? `${target.owner}/${target.repo}` : target.owner,
        error,
      );
    }
  };
}

function urlResolver(url: string): ExternalResolver {
  return async (fetchImpl) => {
    try {
      const response = await fetchWithTimeout(fetchImpl, url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type") ?? "";
      const text = await response.text();
      const content = contentType.includes("text/html") ? htmlToText(text) : text;
      return loadedExternalContext("url", url, content);
    } catch (error) {
      return failedExternalContext("url", url, error);
    }
  };
}

function weatherResolver(location: string): ExternalResolver {
  return async (fetchImpl) => {
    try {
      const geo = (await fetchJson(
        fetchImpl,
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      )) as {
        results?: Array<{ latitude: number; longitude: number; name: string; country?: string }>;
      };
      const result = geo.results?.[0];
      if (!result) {
        throw new Error("Location not found.");
      }
      const weather = await fetchJson(
        fetchImpl,
        `https://api.open-meteo.com/v1/forecast?latitude=${result.latitude}&longitude=${result.longitude}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&timezone=auto`,
      );
      return loadedExternalContext(
        "weather",
        `${result.name}${result.country ? `, ${result.country}` : ""}`,
        JSON.stringify({ location: result, weather }, null, 2),
      );
    } catch (error) {
      return failedExternalContext("weather", location, error);
    }
  };
}

async function fetchJson(fetchImpl: typeof fetch, url: string): Promise<unknown> {
  const response = await fetchWithTimeout(fetchImpl, url, {
    headers: { accept: "application/json", "user-agent": "t3code-generate" },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetchImpl(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

function loadedExternalContext(
  source: GenerateGroundingContext["source"],
  label: string,
  content: string,
): GenerateGroundingContext {
  const normalized = normalizeExtractedText(content);
  return {
    source,
    label,
    status: "loaded",
    content: normalized.slice(0, MAX_EXTERNAL_CONTEXT_CHARS),
    truncated: normalized.length > MAX_EXTERNAL_CONTEXT_CHARS,
  };
}

function failedExternalContext(
  source: GenerateGroundingContext["source"],
  label: string,
  error: unknown,
): GenerateGroundingContext {
  return {
    source,
    label,
    status: "failed",
    content: error instanceof Error ? error.message : "Failed to load data.",
    truncated: false,
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractMentionCandidates(text: string): string[] {
  return [...text.matchAll(MENTION_PATTERN)]
    .map((match) => match[1]?.trim())
    .filter((value): value is string => Boolean(value));
}

function resolveMentionedFilePath(cwd: string, mention: string): string | null {
  const directPath = path.resolve(cwd, mention);
  if (isReadableFile(directPath)) {
    return directPath;
  }

  const mentionDir = path.dirname(mention);
  const searchDir = path.resolve(cwd, mentionDir === "." ? "" : mentionDir);
  const basenamePrefix = path.basename(mention);
  try {
    const entry = fs
      .readdirSync(searchDir, { withFileTypes: true })
      .filter((candidate) => candidate.isFile() && candidate.name.startsWith(basenamePrefix))
      .toSorted((left, right) => left.name.localeCompare(right.name))[0];
    if (!entry) {
      return null;
    }
    const candidatePath = path.join(searchDir, entry.name);
    return isReadableFile(candidatePath) ? candidatePath : null;
  } catch {
    return null;
  }
}

function isReadableFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function readGenerateFileContext(filePath: string): GenerateFileContext | null {
  const extension = path.extname(filePath).toLowerCase();
  try {
    const buffer = fs.readFileSync(filePath);
    const raw =
      extension === ".pdf"
        ? extractPdfText(buffer)
        : buffer.length <= MAX_TEXT_FILE_BYTES
          ? buffer.toString("utf8")
          : buffer.subarray(0, MAX_TEXT_FILE_BYTES).toString("utf8");
    const normalized = normalizeExtractedText(raw);
    if (!normalized) {
      return null;
    }
    return {
      path: filePath,
      content: normalized.slice(0, MAX_CONTEXT_CHARS_PER_FILE),
      truncated: normalized.length > MAX_CONTEXT_CHARS_PER_FILE,
    };
  } catch {
    return null;
  }
}

function extractPdfText(buffer: Buffer): string {
  const chunks: string[] = [];
  let offset = 0;
  while (true) {
    const streamStart = buffer.indexOf("stream", offset);
    if (streamStart < 0) {
      break;
    }
    const streamEnd = buffer.indexOf("endstream", streamStart);
    if (streamEnd < 0) {
      break;
    }
    const header = buffer.subarray(Math.max(0, streamStart - 300), streamStart).toString("latin1");
    let dataStart = streamStart + "stream".length;
    if (buffer[dataStart] === 13 && buffer[dataStart + 1] === 10) {
      dataStart += 2;
    } else if (buffer[dataStart] === 10) {
      dataStart += 1;
    }
    const stream = buffer.subarray(dataStart, streamEnd);
    if (header.includes("/FlateDecode")) {
      try {
        chunks.push(extractPdfTextOperators(zlib.inflateSync(stream).toString("latin1")));
      } catch {
        // Ignore streams that are not text content or use unsupported filters.
      }
    }
    offset = streamEnd + "endstream".length;
  }
  return chunks.join("\n");
}

function extractPdfTextOperators(content: string): string {
  const chunks: string[] = [];
  for (const match of content.matchAll(/\[((?:.|\n|\r)*?)\]\s*TJ/g)) {
    chunks.push(decodePdfTextFragments(match[1] ?? ""));
  }
  for (const match of content.matchAll(/(\((?:\\.|[^\\)])*\))\s*Tj/g)) {
    chunks.push(decodePdfLiteral(match[1] ?? ""));
  }
  return chunks.join("\n");
}

function decodePdfTextFragments(value: string): string {
  const chunks: string[] = [];
  for (const match of value.matchAll(/\((?:\\.|[^\\)])*\)|-?\d+(?:\.\d+)?/g)) {
    const token = match[0];
    if (token.startsWith("(")) {
      chunks.push(decodePdfLiteral(token));
      continue;
    }
    const spacing = Number(token);
    if (Number.isFinite(spacing) && Math.abs(spacing) > 100) {
      chunks.push(" ");
    }
  }
  return chunks.join("");
}

function decodePdfLiteral(value: string): string {
  const inner = value.startsWith("(") && value.endsWith(")") ? value.slice(1, -1) : value;
  return inner
    .replace(/\\([nrtbf()\\])/g, (_match, escaped: string) => {
      switch (escaped) {
        case "n":
        case "r":
          return "\n";
        case "t":
          return "\t";
        case "b":
        case "f":
          return "";
        default:
          return escaped;
      }
    })
    .replace(/\\([0-7]{1,3})/g, (_match, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8)),
    )
    .replaceAll("\u001c", "fi")
    .replaceAll("\u001d", "fl")
    .replaceAll("\u001e", "ffi");
}

function normalizeExtractedText(value: string): string {
  return value
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
