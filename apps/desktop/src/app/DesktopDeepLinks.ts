// @effect-diagnostics nodeBuiltinImport:off
import * as FS from "node:fs";
import * as Path from "node:path";

import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import * as Scope from "effect/Scope";

import * as Electron from "electron";

import { DESKTOP_DEEP_LINK_SCHEME, parseDesktopProjectDeepLink } from "../deepLink.ts";
import * as ElectronApp from "../electron/ElectronApp.ts";
import * as DesktopLifecycle from "./DesktopLifecycle.ts";
import * as DesktopObservability from "./DesktopObservability.ts";
import * as DesktopState from "./DesktopState.ts";
import * as DesktopWindow from "../window/DesktopWindow.ts";

type DesktopDeepLinksRuntimeServices =
  | DesktopLifecycle.DesktopShutdown
  | DesktopState.DesktopState
  | DesktopWindow.DesktopWindow
  | ElectronApp.ElectronApp;

export interface DesktopDeepLinksShape {
  readonly register: Effect.Effect<void, never, DesktopDeepLinksRuntimeServices | Scope.Scope>;
}

export class DesktopDeepLinks extends Context.Service<DesktopDeepLinks, DesktopDeepLinksShape>()(
  "t3/desktop/DeepLinks",
) {}

const { logInfo: logDeepLinkInfo, logWarning: logDeepLinkWarning } =
  DesktopObservability.makeComponentLogger("desktop-deep-link");

function getStartupDeepLinks(): string[] {
  return process.argv.filter((arg) => arg.startsWith(`${DESKTOP_DEEP_LINK_SCHEME}://`));
}

function resolveDeepLinkedProjectPath(rawPath: string): string | null {
  try {
    const resolvedPath = Path.resolve(rawPath);
    if (!FS.existsSync(resolvedPath)) {
      return null;
    }
    if (!FS.statSync(resolvedPath).isDirectory()) {
      return null;
    }
    return resolvedPath;
  } catch {
    return null;
  }
}

function getDefaultProtocolClientArgs(): {
  readonly path?: string;
  readonly args?: readonly string[];
} {
  const defaultAppProcess = process as NodeJS.Process & { readonly defaultApp?: boolean };
  if (!defaultAppProcess.defaultApp || !process.argv[1]) {
    return {};
  }
  return {
    path: process.execPath,
    args: [Path.resolve(process.argv[1])],
  };
}

const make = Effect.gen(function* () {
  const registered = yield* Ref.make(false);

  return DesktopDeepLinks.of({
    register: Effect.gen(function* () {
      const alreadyRegistered = yield* Ref.getAndSet(registered, true);
      if (alreadyRegistered) return;

      const electronApp = yield* ElectronApp.ElectronApp;
      const shutdown = yield* DesktopLifecycle.DesktopShutdown;
      const state = yield* DesktopState.DesktopState;
      const desktopWindow = yield* DesktopWindow.DesktopWindow;
      const context = yield* Effect.context<DesktopDeepLinksRuntimeServices>();
      const runEffect = Effect.runPromiseWith(context);

      const hasLock = yield* electronApp.requestSingleInstanceLock;
      if (!hasLock) {
        yield* logDeepLinkInfo("another desktop instance is already running");
        yield* Ref.set(state.quitting, true);
        yield* shutdown.request;
        yield* electronApp.quit;
        return;
      }

      const protocolClientArgs = getDefaultProtocolClientArgs();
      yield* electronApp.setAsDefaultProtocolClient(
        DESKTOP_DEEP_LINK_SCHEME,
        protocolClientArgs.path,
        protocolClientArgs.args,
      );

      const handleRawDeepLink = Effect.fn("desktop.deepLink.handleRaw")(function* (
        rawUrl: string,
      ): Effect.fn.Return<void, never, never> {
        const parsed = parseDesktopProjectDeepLink(rawUrl);
        if (!parsed) {
          return;
        }

        const projectPath = resolveDeepLinkedProjectPath(parsed.path);
        if (!projectPath) {
          yield* logDeepLinkWarning("project deep link path is not a readable directory", {
            path: parsed.path,
          });
          return;
        }

        yield* logDeepLinkInfo("project deep link received", { projectPath });
        yield* desktopWindow.openProjectPath(projectPath).pipe(
          Effect.catch((error) =>
            logDeepLinkWarning("failed to open project from deep link", {
              error: String(error),
              projectPath,
            }),
          ),
        );
      });

      for (const deepLink of getStartupDeepLinks()) {
        yield* handleRawDeepLink(deepLink);
      }

      yield* electronApp.on("second-instance", (_event: Electron.Event, argv: string[]) => {
        const deepLink = argv.find((arg) => arg.startsWith(`${DESKTOP_DEEP_LINK_SCHEME}://`));
        if (deepLink) {
          void runEffect(handleRawDeepLink(deepLink));
          return;
        }

        void runEffect(
          desktopWindow.revealOrCreateMain.pipe(
            Effect.catch((error) =>
              logDeepLinkWarning("failed to focus existing desktop window", {
                error: String(error),
              }),
            ),
            Effect.withSpan("desktop.deepLink.focusSecond"),
          ),
        );
      });

      yield* electronApp.on("open-url", (event: Electron.Event, rawUrl: string) => {
        event.preventDefault();
        void runEffect(handleRawDeepLink(rawUrl));
      });
    }).pipe(Effect.withSpan("desktop.deepLinks.register")),
  });
});

export const layer = Layer.effect(DesktopDeepLinks, make);
