import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

export const actionlintImage = "rhysd/actionlint:1.7.12@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667";

export function releaseBuildArguments(sha: string, target: "customer-validation" | "web", tag: string): string[] {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Validation requires a full Git commit SHA.");
  return ["buildx", "build", "--load", "--platform", "linux/amd64", "--file", "deploy/Dockerfile", "--target", target,
    "--tag", tag, "--build-arg", `RELEASE_SHA=${sha}`, "--build-arg", "RELEASE_BRANCH=entrance-server",
    "."];
}

function run(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, { cwd, stdio: "inherit", timeout: 75 * 60_000 });
  if (result.error || result.status !== 0) throw new Error(`${command} ${args[0] ?? ""} failed: ${result.error?.message ?? `exit ${result.status}`}`);
}

/** CI and pre-push validate the same immutable archive, never a different dirty working tree. */
export function validateCustomerRelease(sha: string): void {
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Validation requires a full Git commit SHA.");
  const check = spawnSync("docker", ["info"], { stdio: "ignore" });
  if (check.error || check.status !== 0) throw new Error("Start Docker before pushing. Release validation cannot be skipped.");
  const source = mkdtempSync(join(tmpdir(), "oryx-release-validation-"));
  const suffix = `${sha}-${randomUUID().slice(0, 8)}`;
  const validationImage = `oryx-live-validation:${suffix}`;
  const webImage = `oryx-live-validation-web:${suffix}`;
  try {
    const archive = spawnSync("git", ["archive", "--format=tar", sha], { maxBuffer: 256 * 1024 * 1024 });
    if (archive.error || archive.status !== 0) throw new Error("Could not export the exact outgoing Git commit for validation.");
    const extract = spawnSync("tar", ["-x", "-C", source], { input: archive.stdout });
    if (extract.error || extract.status !== 0) throw new Error("Could not extract the release validation archive.");
    console.log(`Validating exact commit ${sha} for linux/amd64 before approval.`);
    run("docker", ["run", "--rm", "--network", "none", "--platform", "linux/amd64", "--mount", `type=bind,source=${source},target=/repo,readonly`,
      "--workdir", "/repo", actionlintImage, "-color", ".github/workflows/customer-docker.yml"], source);
    run("docker", releaseBuildArguments(sha, "customer-validation", validationImage), source);
    run("docker", releaseBuildArguments(sha, "web", webImage), source);
    run(process.execPath, ["deploy/customer-docker/smoke.ts", webImage], source);
    console.log(`Customer release validation passed: ${sha}`);
  } finally {
    // Remove only this invocation's tagged images and archive; keep shared build cache and unrelated images.
    spawnSync("docker", ["image", "rm", validationImage, webImage], { stdio: "ignore" });
    rmSync(source, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const index = process.argv.indexOf("--sha");
    const head = index < 0 ? spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).stdout?.trim() : process.argv[index + 1];
    if (!head) throw new Error("Specify the exact release commit with --sha.");
    validateCustomerRelease(head);
  } catch (error) { console.error(error instanceof Error ? error.message : "Customer release validation failed."); process.exitCode = 1; }
}
