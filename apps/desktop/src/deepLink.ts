// @effect-diagnostics nodeBuiltinImport:off
import * as Path from "node:path";

export const DESKTOP_DEEP_LINK_SCHEME = "t3";
const OPEN_PROJECT_HOST = "open";

export interface DesktopProjectDeepLink {
  readonly path: string;
}

export function parseDesktopProjectDeepLink(
  rawUrl: string,
  options?: {
    readonly resolvePath?: (input: string) => string;
    readonly scheme?: string;
  },
): DesktopProjectDeepLink | null {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return null;
  }

  const expectedProtocol = `${options?.scheme ?? DESKTOP_DEEP_LINK_SCHEME}:`;
  if (parsedUrl.protocol !== expectedProtocol || parsedUrl.hostname !== OPEN_PROJECT_HOST) {
    return null;
  }

  const rawPath = parsedUrl.searchParams.get("path")?.trim();
  if (!rawPath) {
    return null;
  }

  const resolvePath = options?.resolvePath ?? Path.resolve;
  return { path: resolvePath(rawPath) };
}
