import { describe, expect, it } from "vitest";

import { parseDesktopProjectDeepLink } from "./deepLink.ts";

describe("parseDesktopProjectDeepLink", () => {
  it("parses a t3 open-project deep link", () => {
    expect(
      parseDesktopProjectDeepLink("t3://open?path=%2FUsers%2Falex%2Fproject", {
        resolvePath: (input) => `/resolved${input}`,
      }),
    ).toEqual({
      path: "/resolved/Users/alex/project",
    });
  });

  it("rejects non-project deep links", () => {
    expect(parseDesktopProjectDeepLink("t3://app/index.html")).toBeNull();
    expect(parseDesktopProjectDeepLink("https://example.com")).toBeNull();
  });

  it("rejects deep links without a path", () => {
    expect(parseDesktopProjectDeepLink("t3://open")).toBeNull();
    expect(parseDesktopProjectDeepLink("t3://open?path=")).toBeNull();
  });
});
