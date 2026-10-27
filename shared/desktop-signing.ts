import { createHash, createPrivateKey, createPublicKey } from "node:crypto";

/** Inspect keys in memory; never emit or persist the private signing material. */
export function desktopSigningStatus(publicPem: string, privatePem: string): { configured: boolean; fingerprint: string } {
  if (!publicPem.trim() && !privatePem.trim()) return { configured: false, fingerprint: "" };
  if (!publicPem.trim() || !privatePem.trim()) throw new Error("Configure both the desktop update public variable and private secret, or neither for a manual-only installer.");
  const publicKey = createPublicKey(publicPem);
  const privateKey = createPrivateKey(privatePem);
  const expected = publicKey.export({ type: "spki", format: "der" });
  if (publicKey.asymmetricKeyType !== "ed25519" || privateKey.asymmetricKeyType !== "ed25519"
    || !createPublicKey(privateKey).export({ type: "spki", format: "der" }).equals(expected)) {
    throw new Error("The desktop release requires a matching Ed25519 signing and verification key pair.");
  }
  return { configured: true, fingerprint: createHash("sha256").update(expected).digest("hex") };
}
