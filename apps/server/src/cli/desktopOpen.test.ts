// @effect-diagnostics nodeBuiltinImport:off
import * as Path from "node:path";
import { describe, expect, it } from "vitest";

import { resolveDesktopOpenUrl } from "./desktopOpen.ts";

describe("resolveDesktopOpenUrl", () => {
  it("resolves a single project path into a t3 open deep link", () => {
    expect(resolveDesktopOpenUrl(["."])).toBe(
      `t3://open?path=${encodeURIComponent(Path.resolve("."))}`,
    );
  });

  it("does not intercept normal server CLI commands or flags", () => {
    expect(resolveDesktopOpenUrl([])).toBeNull();
    expect(resolveDesktopOpenUrl(["serve"])).toBeNull();
    expect(resolveDesktopOpenUrl(["--help"])).toBeNull();
    expect(resolveDesktopOpenUrl([".", "--port", "3773"])).toBeNull();
  });
});
