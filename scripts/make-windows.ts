import { spawn } from "node:child_process";
const index = process.argv.indexOf("--arch");
const arch = index < 0 ? "universal" : process.argv[index + 1];
if (arch !== "universal" && arch !== "x64" && arch !== "ia32") throw new Error("Use --arch universal, --arch x64 or --arch ia32");
const env = { ...process.env, ORYX_WINDOWS_ARCH: arch };
async function run(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(process.execPath, ["x", ...args], { env, stdio: "inherit", shell: false });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Windows ${arch} build failed (${code})`)));
  });
}
await run(["--no-install", "electron-forge", "package", "--platform", "win32", "--arch", arch === "universal" ? "x64" : arch]);
await run(["--no-install", "electron-builder", "--config", "electron-builder.config.cjs", "--win", "nsis", ...(arch === "universal" ? ["--ia32", "--x64"] : [`--${arch}`]), "--publish", "never"]);
