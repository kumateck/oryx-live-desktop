import { engines, type DocumentFormat } from "./engines";
import { previewRuntime } from "./preview-runtime";

/** No same-origin privilege, network, native bridge, forms, popups, scripts from files, or external assets. */
export const previewSandbox = "allow-scripts";
export function previewFrame(format: DocumentFormat, glue: string, channel: string, parentOrigin: string) {
  const csp = `default-src 'none'; script-src 'nonce-${channel}' 'wasm-unsafe-eval'; style-src 'nonce-${channel}'; img-src data: blob:; font-src data:; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'`;
  const safeScript = (value: string) => value.replace(/<\/script/gi, "<\\/script");
  const code = `${glue}\n(${previewRuntime.toString()})(${JSON.stringify(channel)}, ${JSON.stringify(parentOrigin)}, __wbg_init);`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${csp}"><style nonce="${channel}">html,body{margin:0;width:100%;height:100%;overflow:hidden}canvas{display:block;width:100%;height:100%;touch-action:none}</style></head><body><canvas id="${engines[format].name}_canvas" aria-label="Attachment preview"></canvas><script type="module" nonce="${channel}">${safeScript(code)}</script></body></html>`;
}
