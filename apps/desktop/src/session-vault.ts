import { readFile, rm, writeFile } from "node:fs/promises";

/** Operating-system encryption, as Electron's safeStorage gives it. Null when none is available. */
export interface Cipher {
  encrypt(plain: string): Buffer;
  decrypt(sealed: Buffer): string;
}

interface Stored { origin: string; token: string }

const maxTokenLength = 4096;

/** A refresh token is an opaque string from the server; anything else is not kept. */
export function isRefreshToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxTokenLength && !/\s/.test(value);
}

/**
 * Keeps one refresh token, encrypted by the operating system for the signed-in OS user, and tied to the
 * server it came from: a token is only given back to that same server's pages. Without OS encryption,
 * nothing is written and the sign-in lasts as long as the window, as it does in a browser.
 */
export function createSessionVault(file: string, cipher: () => Cipher | null) {
  const forget = () => rm(file, { force: true });
  return {
    async load(origin: string): Promise<string | null> {
      const sealer = cipher();
      if (!sealer) return null;
      let stored: Stored;
      try { stored = JSON.parse(sealer.decrypt(await readFile(file))) as Stored; }
      catch { await forget(); return null; }
      if (stored.origin !== origin || !isRefreshToken(stored.token)) return null;
      return stored.token;
    },
    async save(origin: string, token: string | null): Promise<void> {
      const sealer = cipher();
      if (!sealer || token === null) { await forget(); return; }
      if (!isRefreshToken(token)) throw new Error("Not a refresh token.");
      await writeFile(file, sealer.encrypt(JSON.stringify({ origin, token } satisfies Stored)), { mode: 0o600 });
    },
    forget,
  };
}
export type SessionVault = ReturnType<typeof createSessionVault>;
