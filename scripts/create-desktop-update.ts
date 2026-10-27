import { verifyRelease } from "../apps/desktop/src/updates/manifest.ts";
import { createHash, createPrivateKey, createPublicKey, generateKeyPairSync, sign } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { jsonObject, parseJson, versionParts } from "../shared/desktop-updates.ts";

const command = process.argv[2];
if (command === "keygen") {
  const privateFile = process.argv[3]; const publicFile = process.argv[4];
  if (!privateFile || !publicFile || resolve(privateFile) === resolve(publicFile)) throw new Error("Use keygen <private-key-file> <public-key-file>; store the private key outside Git");
  const keys = generateKeyPairSync("ed25519", { privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  await mkdir(dirname(resolve(privateFile)), { recursive: true, mode: 0o700 });
  await mkdir(dirname(resolve(publicFile)), { recursive: true, mode: 0o700 });
  await writeFile(privateFile, keys.privateKey, { flag: "wx", mode: 0o600 });
  await writeFile(publicFile, keys.publicKey, { flag: "wx", mode: 0o644 });
  console.log("Created an Ed25519 update signing key and public verification key. Keep the private key outside the repository.");
} else if (command === "publish") {
  const installer = process.argv[3]; const output = process.argv[4];
  if (!installer || !output) throw new Error("Use publish <universal-installer.exe> <output-directory>");
  const privateKey = createPrivateKey(process.env.ORYX_DESKTOP_UPDATE_PRIVATE_KEY ?? "");
  const expected = createPublicKey(process.env.ORYX_DESKTOP_UPDATE_PUBLIC_KEY ?? "");
  if (privateKey.asymmetricKeyType !== "ed25519" || expected.asymmetricKeyType !== "ed25519" || !createPublicKey(privateKey).export({ type: "spki", format: "der" }).equals(expected.export({ type: "spki", format: "der" }))) throw new Error("Release signing and desktop verification keys do not match");
  const metadata = jsonObject(parseJson(await readFile(new URL("../apps/desktop/package.json", import.meta.url), "utf8")));
  if (typeof metadata.version !== "string") throw new Error("Missing desktop package version");
  versionParts(metadata.version);
  const bytes = await readFile(installer);
  if (bytes.length < 1024 * 1024 || bytes[0] !== 0x4d || bytes[1] !== 0x5a) throw new Error("The signed update must be the built universal Windows NSIS installer");
  const payload = JSON.stringify({ version: metadata.version, platform: "win32", arch: "universal", architectures: ["ia32", "x64"], size: bytes.length, sha512: createHash("sha512").update(bytes).digest("hex"), notes: process.env.ORYX_DESKTOP_RELEASE_NOTES ?? "" });
  const envelope = JSON.stringify({ payload, signature: sign(null, Buffer.from(payload), privateKey).toString("base64") });
  verifyRelease(envelope, process.env.ORYX_DESKTOP_UPDATE_PUBLIC_KEY ?? "", "ia32");
  const base = join(output, "desktop", "windows");
  await mkdir(join(base, metadata.version), { recursive: true });
  await writeFile(join(base, metadata.version, "OryxLiveDesktop-Setup.exe"), bytes, { flag: "wx", mode: 0o644 });
  await writeFile(join(base, "latest.json"), envelope, { flag: "wx", mode: 0o644 });
  console.log(`Prepared signed desktop ${metadata.version} for Windows x86 and x64. Publish the versioned installer before latest.json.`);
} else throw new Error("Use keygen or publish");
