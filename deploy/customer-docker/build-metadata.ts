import { readFile, writeFile } from "node:fs/promises";
import { compatibility, validateBuild } from "../customer-server/release.ts";
import { commit, parse } from "../customer-server/data.ts";

const sha = process.env.RELEASE_SHA ? commit(process.env.RELEASE_SHA) : "unversioned";
const branch = process.env.RELEASE_BRANCH ?? "entrance-server";
if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch) || branch.includes("..")) throw new Error("Invalid release branch");
const policy = compatibility(parse(await readFile("deploy/customer-server/release.json", "utf8")));
await validateBuild("apps/web/dist");
const html = await readFile("apps/web/dist/index.html", "utf8");
const criticalAssets = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"'?#]+)["']/g)].flatMap((match) => match[1] ? [match[1]] : []);
await writeFile("apps/web/dist/deployment.json", JSON.stringify({ ...policy, commit: sha, branch, builtAt: new Date().toISOString(), criticalAssets }));
