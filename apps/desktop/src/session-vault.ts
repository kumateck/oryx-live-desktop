import { open, readFile, rename, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";

export interface Cipher {
  encrypt(plain: string): Buffer;
  decrypt(sealed: Buffer): string;
}
interface Stored {
  origin: string;
  token: string;
}
export function isRefreshToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 4096 && !/\s/.test(value);
}

/** Serialize reads, writes and deletion. A failed replacement leaves the last complete encrypted file intact. */
export function createSessionVault(file: string, cipher: () => Cipher | null) {
  let pending = Promise.resolve();
  function queue<T>(operation: () => Promise<T>): Promise<T> {
    const result = pending.then(operation);
    pending = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }
  const remove = () => rm(file, { force: true });
  return {
    load(origin: string): Promise<string | null> {
      return queue(async () => {
        const sealer = cipher();
        if (!sealer) return null;
        let sealed: Buffer;
        try {
          sealed = await readFile(file);
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
          throw error;
        }
        let stored: Stored;
        try {
          stored = JSON.parse(sealer.decrypt(sealed)) as Stored;
        } catch {
          await remove();
          return null;
        }
        return stored.origin === origin && isRefreshToken(stored.token) ? stored.token : null;
      });
    },
    save(origin: string, token: string | null): Promise<void> {
      return queue(async () => {
        const sealer = cipher();
        if (!sealer || token === null) {
          await remove();
          return;
        }
        if (!isRefreshToken(token)) throw new Error("Not a refresh token.");
        const sealed = sealer.encrypt(JSON.stringify({ origin, token } satisfies Stored));
        const temporary = `${file}.${randomUUID()}.tmp`;
        try {
          const handle = await open(temporary, "wx", 0o600);
          try {
            await handle.writeFile(sealed);
            await handle.sync();
          } finally {
            await handle.close();
          }
          await rename(temporary, file);
        } finally {
          await rm(temporary, { force: true });
        }
      });
    },
    forget: (): Promise<void> => queue(remove),
    flush: (): Promise<void> => pending,
  };
}
export type SessionVault = ReturnType<typeof createSessionVault>;
