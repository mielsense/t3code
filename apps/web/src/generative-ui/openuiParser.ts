export type OpenUiLiteral = string | number | boolean;
export type OpenUiValue = OpenUiLiteral | OpenUiValue[] | OpenUiReference | OpenUiCall;

export interface OpenUiReference {
  type: "ref";
  name: string;
}

export interface OpenUiCall {
  type: "call";
  component: string;
  args: OpenUiValue[];
}

export interface OpenUiProgram {
  statements: Map<string, OpenUiValue>;
  root: OpenUiCall;
}

type Token =
  | { type: "identifier"; value: string }
  | { type: "string"; value: string }
  | { type: "number"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "punct"; value: "(" | ")" | "[" | "]" | "," | "=" };

const IDENTIFIER_PATTERN = /[A-Za-z_][A-Za-z0-9_]*/y;
const NUMBER_PATTERN = /-?(?:0|[1-9]\d*)(?:\.\d+)?/y;

export function parseOpenUiProgram(source: string): OpenUiProgram {
  const statements = new Map<string, OpenUiValue>();
  for (const statement of splitOpenUiStatements(source)) {
    const equalIndex = statement.indexOf("=");
    if (equalIndex <= 0) {
      throw new Error(`Invalid OpenUI line: ${statement}`);
    }
    const name = statement.slice(0, equalIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      throw new Error(`Invalid OpenUI statement id: ${name}`);
    }
    const parser = new Parser(tokenize(statement.slice(equalIndex + 1)));
    const value = parser.parseValue();
    parser.expectEnd();
    statements.set(name, value);
  }

  const root = statements.get("root");
  if (!root || typeof root !== "object" || Array.isArray(root) || root.type !== "call") {
    throw new Error("OpenUI program must define root.");
  }
  return { statements, root };
}

function splitOpenUiStatements(source: string): string[] {
  const statements: string[] = [];
  let current = "";

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || (!current && (line.startsWith("#") || line.startsWith("//")))) {
      continue;
    }

    current = current ? `${current}\n${line}` : line;
    if (getNestingDepth(current) === 0) {
      statements.push(current);
      current = "";
    }
  }

  if (current) {
    statements.push(current);
  }

  return statements;
}

function getNestingDepth(input: string): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (const char of input) {
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === "(" || char === "[") {
      depth += 1;
    } else if (char === ")" || char === "]") {
      depth -= 1;
    }
  }

  return depth;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < input.length) {
    const char = input[index]!;
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if ("()[],=".includes(char)) {
      tokens.push({ type: "punct", value: char as Extract<Token, { type: "punct" }>["value"] });
      index += 1;
      continue;
    }
    if (char === '"') {
      const parsed = parseJsonString(input, index);
      tokens.push({ type: "string", value: parsed.value });
      index = parsed.end;
      continue;
    }

    IDENTIFIER_PATTERN.lastIndex = index;
    const identifier = IDENTIFIER_PATTERN.exec(input);
    if (identifier) {
      const value = identifier[0]!;
      if (value === "true" || value === "false") {
        tokens.push({ type: "boolean", value: value === "true" });
      } else {
        tokens.push({ type: "identifier", value });
      }
      index = IDENTIFIER_PATTERN.lastIndex;
      continue;
    }

    NUMBER_PATTERN.lastIndex = index;
    const number = NUMBER_PATTERN.exec(input);
    if (number) {
      tokens.push({ type: "number", value: Number(number[0]) });
      index = NUMBER_PATTERN.lastIndex;
      continue;
    }

    throw new Error(`Unexpected OpenUI token near: ${input.slice(index, index + 20)}`);
  }
  return tokens;
}

function parseJsonString(input: string, start: number): { value: string; end: number } {
  for (let index = start + 1; index < input.length; index += 1) {
    const char = input[index];
    if (char === "\\") {
      index += 1;
      continue;
    }
    if (char === '"') {
      return { value: JSON.parse(input.slice(start, index + 1)) as string, end: index + 1 };
    }
  }
  throw new Error("Unterminated OpenUI string.");
}

class Parser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parseValue(): OpenUiValue {
    const token = this.peek();
    if (!token) {
      throw new Error("Unexpected end of OpenUI input.");
    }
    if (token.type === "string" || token.type === "number" || token.type === "boolean") {
      this.index += 1;
      return token.value;
    }
    if (token.type === "punct" && token.value === "[") {
      return this.parseArray();
    }
    if (token.type === "identifier") {
      this.index += 1;
      if (this.matchPunct("(")) {
        const args = this.parseArguments();
        return { type: "call", component: token.value, args };
      }
      return { type: "ref", name: token.value };
    }
    throw new Error("Unexpected OpenUI value.");
  }

  expectEnd(): void {
    if (this.peek()) {
      throw new Error("Unexpected trailing OpenUI input.");
    }
  }

  private parseArray(): OpenUiValue[] {
    this.expectPunct("[");
    const values: OpenUiValue[] = [];
    if (this.matchPunct("]")) {
      return values;
    }
    do {
      values.push(this.parseValue());
    } while (this.matchPunct(","));
    this.expectPunct("]");
    return values;
  }

  private parseArguments(): OpenUiValue[] {
    const args: OpenUiValue[] = [];
    if (this.matchPunct(")")) {
      return args;
    }
    do {
      args.push(this.parseValue());
    } while (this.matchPunct(","));
    this.expectPunct(")");
    return args;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private matchPunct(value: Extract<Token, { type: "punct" }>["value"]): boolean {
    const token = this.peek();
    if (token?.type !== "punct" || token.value !== value) {
      return false;
    }
    this.index += 1;
    return true;
  }

  private expectPunct(value: Extract<Token, { type: "punct" }>["value"]): void {
    if (!this.matchPunct(value)) {
      throw new Error(`Expected '${value}' in OpenUI input.`);
    }
  }
}
