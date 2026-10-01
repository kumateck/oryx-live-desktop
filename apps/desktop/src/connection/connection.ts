import type { ConnectionBridge } from "../bridge";
import wordmarkUrl from "../../../../assets/oryx-wordmark.svg";
import "./style.css";

const form = document.querySelector<HTMLFormElement>("#site-form");
const input = document.querySelector<HTMLInputElement>("#site-url");
const message = document.querySelector<HTMLParagraphElement>("#message");
const logo = document.querySelector<HTMLElement>("#brand-logo");
if (!form || !input || !message || !logo) throw new Error("Connection form is incomplete");
logo.style.maskImage = `url("${wordmarkUrl}")`;
logo.style.webkitMaskImage = `url("${wordmarkUrl}")`;

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
