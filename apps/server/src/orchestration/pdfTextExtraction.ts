import * as zlib from "node:zlib";

export function extractPdfText(buffer: Buffer): string {
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
