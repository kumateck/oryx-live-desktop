import { useState } from "react";
import { Button } from "@/components/ui/button";
import { showSystemAlert } from "./desktop-companion";
/** Device-only diagnostic: never creates a business event or unread item. */
export function CompanionTestNotification() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const send = async () => {
    if (sending) return;
    setSending(true); setResult(null);
    try {
      const accepted = await showSystemAlert("ORYX · Test notification", "This is a device test. No ERP record or unread alert was created.", `device-test:${Date.now()}`);
      setResult(accepted ? "Test submitted to your operating system. If no banner appears, check Oryx notification permissions and Do Not Disturb." : "The native notification test is unavailable. Open this page in an updated Oryx desktop app.");
    } finally { setSending(false); }
  };
  return <div className="p-3"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium">Test system notifications</p><p className="mt-1 text-xs text-muted-foreground">Check this device’s notification display. This does not test backend alert rules or RabbitMQ delivery.</p></div><Button variant="outline" size="sm" disabled={sending} onClick={() => void send()}>{sending ? "Sending…" : "Send test notification"}</Button></div>{result ? <p role="status" className="mt-2 text-xs text-muted-foreground">{result}</p> : null}</div>;
}
