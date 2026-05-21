const GENERATE_COMMAND_PATTERN = /^\s*(?:\/generate|@generate)(?:\s+|$)/i;

export function parseGenerateCommand(text: string): { prompt: string } | null {
  if (!GENERATE_COMMAND_PATTERN.test(text)) {
    return null;
  }

  return {
    prompt: text.replace(GENERATE_COMMAND_PATTERN, "").trim(),
  };
}
