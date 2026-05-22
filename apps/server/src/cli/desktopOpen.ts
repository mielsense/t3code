// @effect-diagnostics nodeBuiltinImport:off
import * as ChildProcess from "node:child_process";
import * as Path from "node:path";

const SERVER_SUBCOMMANDS = new Set(["auth", "project", "serve", "start"]);

export function resolveDesktopOpenUrl(args: readonly string[]): string | null {
  if (args.length !== 1) {
    return null;
  }

  const [candidate] = args;
  if (!candidate || candidate.startsWith("-") || SERVER_SUBCOMMANDS.has(candidate)) {
    return null;
  }

  const projectPath = Path.resolve(candidate);
  return `t3://open?path=${encodeURIComponent(projectPath)}`;
}

export function openDesktopProjectFromCli(args: readonly string[]): boolean {
  const url = resolveDesktopOpenUrl(args);
  if (!url) {
    return false;
  }

  const command =
    process.platform === "darwin"
      ? { file: "open", args: [url] }
      : process.platform === "win32"
        ? { file: "cmd", args: ["/c", "start", "", url] }
        : { file: "xdg-open", args: [url] };

  const result = ChildProcess.spawnSync(command.file, command.args, {
    stdio: "ignore",
    windowsHide: true,
  });

  if (result.error) {
    process.stderr.write(`Failed to open T3 Code desktop link: ${result.error.message}\n`);
    process.exitCode = 1;
  } else if (typeof result.status === "number" && result.status !== 0) {
    process.stderr.write(`Failed to open T3 Code desktop link: ${url}\n`);
    process.exitCode = result.status;
  }

  return true;
}
