// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { announce } from "./announce";
vi.mock("sonner", () => ({ toast: { info: vi.fn() } }));
afterEach(() => { delete window.oryxCompanion; vi.unstubAllGlobals(); });
it("shows native system alerts even when the document is in the foreground", async () => {
  const notify = vi.fn(async () => true);
  window.oryxCompanion = { notify, summary: async () => {}, onOpen: () => () => {} };
  vi.spyOn(document, "hasFocus").mockReturnValue(true);
  announce({ id: "event-1", message: "Review required", type: 13 }, () => {});
  await vi.waitFor(() => expect(notify).toHaveBeenCalledWith({ id: "event-1", title: "BMR/BPR requested", body: "Review required" }));
  vi.restoreAllMocks();
});
it("browser fallback requests interaction and click does not mark anything read", async () => {
  const shown: Array<{ onclick?: () => void }> = [], options: NotificationOptions[] = [];
  class BrowserNotification {
    static permission = "granted";
    onclick?: () => void;
    constructor(_title: string, option: NotificationOptions) { options.push(option); shown.push(this); }
    close() {}
  }
  vi.stubGlobal("Notification", BrowserNotification);
  const open = vi.fn();
  announce({ message: "Stock requires review", type: 15 }, open);
  await vi.waitFor(() => expect(options).toHaveLength(1));
  expect(options[0]?.requireInteraction).toBe(true);
  shown[0]?.onclick?.(); expect(open).toHaveBeenCalledOnce();
});
