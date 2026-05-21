// @effect-diagnostics nodeBuiltinImport:off
import * as fs from "node:fs";
import * as path from "node:path";
import { parseGenerateCommand } from "./generateCommand.ts";
import { extractPdfText } from "./pdfTextExtraction.ts";

const MENTION_PATTERN = /@([^\s@]+)/g;
const MAX_CONTEXT_FILES = 4;
const MAX_CONTEXT_CHARS_PER_FILE = 24_000;
const MAX_TEXT_FILE_BYTES = 256 * 1024;

export interface GenerateFileContext {
  readonly path: string;
  readonly content: string;
  readonly truncated: boolean;
}

export interface GenerateGroundingContext {
  readonly source: "file";
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
}): Promise<GenerateGroundingContext[]> {
  const parsed = parseGenerateCommand(input.text);
  if (!parsed) {
    return [];
  }
  return collectGenerateFileContexts(input).map((context) => ({
    source: "file",
    label: context.path,
    status: "loaded",
    content: context.content,
    truncated: context.truncated,
  }));
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

function normalizeExtractedText(value: string): string {
  return value
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
