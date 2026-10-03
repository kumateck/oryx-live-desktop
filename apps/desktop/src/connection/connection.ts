import type { ConnectionBridge } from "../bridge";

const form = document.querySelector<HTMLFormElement>("#site-form");
const input = document.querySelector<HTMLInputElement>("#site-url");
const message = document.querySelector<HTMLParagraphElement>("#message");
if (!form || !input || !message) throw new Error("Connection form is incomplete");

const bridge: ConnectionBridge = window.oryxConnection;
void bridge.getStatus().then((status) => {
  input.value = status.siteUrl;
  message.textContent = status.error;
}).catch(() => { message.textContent = "The desktop connection service is unavailable."; });

form.addEventListener("submit", (event) => {
  event.preventDefault();
  message.textContent = "Connecting…";
  void bridge.setSiteUrl(input.value).catch((error: Error) => {
    message.textContent = error.message;
  });
});
