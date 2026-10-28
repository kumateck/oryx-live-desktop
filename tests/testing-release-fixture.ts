import { createHash } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";

// Disposable CLI fakes used to execute the actual workflow's remote script locally.
// No Docker socket, SSH credentials, network, or customer paths are used.
const statePath = process.env.ORYX_TESTING_STATE;
if (statePath) {
  const args = process.argv.slice(3);
  const state = new Map(readFileSync(statePath, "utf8").trim().split("\n").filter(Boolean).map((line): [string, string] => {
    const [name, release] = line.split("|");
    if (!name || !release) throw new Error("Invalid testing fixture state");
    return [name, release];
  }));
  const fail = process.env.ORYX_TESTING_FAIL;
  const save = () => writeFileSync(statePath, [...state].map(([name, release]) => `${name}|${release}`).join("\n"));
  const after = (flag: string) => args[args.indexOf(flag) + 1] ?? "";
  if (process.argv[2] === "curl") {
    process.stdout.write(args.at(-1)?.endsWith("/") ? '<script src="/assets/index.js"></script>' : "asset");
  } else {
    appendFileSync(`${statePath}.commands`, `${args.join(" ")}\n`);
    switch (args[0]) {
      case "login": break;
      case "pull": if (fail === "pull") process.exit(1); break;
      case "container": process.exit(state.has(args[2] ?? "") ? 0 : 1); break;
      case "network": console.log("172.18.0.1"); break;
      case "ps": if (args.includes("publish=8086")) console.log("fixture-backend"); break;
      case "inspect": console.log("sail"); break;
      case "port": console.log("5001/tcp -> 0.0.0.0:8086"); break;
      case "run": {
        if (args.includes("--name")) {
          const name = after("--name");
          if (state.has(name)) process.exit(1);
          state.set(name, "new"); save();
          if (name === "oryx-live-web" && fail === "activation") process.exit(1);
        } else if (after("--network").startsWith("container:") && fail === "candidate") process.exit(1);
        else if (after("--network") === "host" && fail === "health") process.exit(1);
        else if (args.some((arg) => arg.includes("HTTP_OK")) || after("--net") === "sail") {
          if (fail === "backend") process.exit(1);
        }
        break;
      }
      case "rename": {
        const from = args[1] ?? ""; const to = args[2] ?? "";
        if (fail === "rename" && from === "oryx-live-gateway") process.exit(1);
        const release = state.get(from);
        if (!release || state.has(to)) process.exit(1);
        state.delete(from); state.set(to, release); save(); break;
      }
      case "rm": for (const name of args.slice(1).filter((arg) => arg !== "-f")) state.delete(name); save(); break;
      case "start": case "stop": if (!state.has(args[1] ?? "")) process.exit(1); break;
      case "exec": console.log(`${createHash("sha256").update(fail === "assets" ? "wrong" : "asset").digest("hex")}  /usr/share/nginx/html/assets/index.js`); break;
      case "logs": break;
      default: throw new Error(`Unexpected Docker operation: ${args[0]}`);
    }
  }
}
