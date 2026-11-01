import type { CompanionAlert, CompanionView, PanelBridge, PanelState } from "../contract";
import { alertCategory, alertSummary, categoryName, exactTime, groupAlerts, priorityChip, since } from "./alerts";
import { icon, type IconName } from "./icons";

declare global { interface Window { oryxPanel: PanelBridge } }

type Child = Node | string | null | undefined | false;
function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: { className?: string; text?: string; attrs?: Record<string, string> } = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (props.className) node.className = props.className;
  if (props.text !== undefined) node.textContent = props.text;
  for (const [key, value] of Object.entries(props.attrs ?? {})) node.setAttribute(key, value);
  for (const child of children) if (child) node.append(child);
  return node;
}
function button(className: string, label: string, onClick: () => void, ...children: Child[]): HTMLButtonElement {
  const node = el("button", { className, attrs: { type: "button", "aria-label": label, title: label } }, ...children);
  node.addEventListener("click", onClick);
  return node;
}
const iconButton = (name: IconName, label: string, onClick: () => void) => button("icon-button", label, onClick, icon(name));
function categoryIcon(alert: CompanionAlert, size = 16): HTMLElement {
  const category = alertCategory(alert.type);
  return el("span", { className: "alert-icon", attrs: { "data-category": category, "aria-hidden": "true" } }, icon(category, size));
}
function chip(alert: CompanionAlert): HTMLElement | null {
  const value = priorityChip(alert.priority);
  return value ? el("span", { className: "chip", text: value.text, attrs: { "data-tone": value.tone } }) : null;
}

/** The alerts list, one alert's details, or a new-alert card, drawn from the companion summary only. */
export function startPanel(): void {
  const bridge = window.oryxPanel;
  const root = el("main", { className: "panel-root" });
  document.body.dataset.surface = "panel";
  document.body.replaceChildren(root);
  let state: PanelState | null = null;
  let selected: string | null = null;
  let lastSelected: string | null = null;

  const close = () => bridge.close();
  const render = () => {
    if (!state) return;
    if (state.mode === "card") { root.replaceChildren(card(state.view, state.alertId)); return; }
    const alert = selected ? state.view.alerts?.find((item) => item.id === selected) : undefined;
    if (selected && !alert) selected = null;
    // A live refresh keeps the reader's place: scroll position and the focused row survive.
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusedId = active?.dataset.alertId, hadFocus = Boolean(active && root.contains(active));
    const scroll = root.querySelector(".panel-body")?.scrollTop ?? 0;
    root.replaceChildren(alert ? detail(alert) : list(state.view));
    const body = root.querySelector(".panel-body");
    if (body) body.scrollTop = scroll;
    if (hadFocus && focusedId) root.querySelector<HTMLElement>(`[data-alert-id="${CSS.escape(focusedId)}"]`)?.focus();
  };
  const select = (id: string | null) => {
    if (id) lastSelected = id;
    selected = id;
    if (!state || state.mode !== "list") return;
    const view = state.view;
    const alert = id ? view.alerts?.find((item) => item.id === id) : undefined;
    root.replaceChildren(alert ? detail(alert) : list(view));
    const target = id ? root.querySelector<HTMLElement>("[data-autofocus]")
      : root.querySelector<HTMLElement>(`[data-alert-id="${CSS.escape(lastSelected ?? "")}"]`) ?? root.querySelector<HTMLElement>(".alert-row");
    target?.focus();
    target?.scrollIntoView({ block: "nearest" });
  };

  function header(view: CompanionView, back?: () => void): HTMLElement {
    const summary = alertSummary(view);
    const live = view.signedIn && view.connected;
    const title = back
      ? button("back-button", "Back to all alerts", back, icon("back"), el("span", { text: "All alerts" }))
      : el("div", { className: "panel-title" }, el("h1", { text: "Alerts" }),
        el("p", { className: "panel-status", attrs: { "data-live": String(live) } },
          el("span", { className: "status-dot", attrs: { "aria-hidden": "true" } }),
          el("span", { text: view.signedIn ? `${summary.count} · ${summary.status}` : summary.status })));
    if (back) title.dataset.autofocus = "true";
    return el("header", { className: "panel-header" }, title, iconButton("close", "Close alerts", close));
  }

  function list(view: CompanionView): HTMLElement {
    const summary = alertSummary(view);
    const body = el("div", { className: "panel-body", attrs: { role: "region", "aria-label": "Unread alerts", tabindex: "-1" } });
    if (!summary.alerts.length) {
      const offline = view.signedIn && !view.connected;
      body.append(el("div", { className: "empty" },
        el("span", { className: "empty-icon", attrs: { "aria-hidden": "true" } }, icon(offline ? "offline" : view.signedIn ? "done" : "general", 22)),
        el("strong", { text: summary.empty }),
        el("p", { text: !view.signedIn ? "Your alerts appear here once you sign in." : offline ? "Live updates are paused. Oryx keeps checking every minute." : "New alerts for your department will appear here." })));
    }
    for (const group of groupAlerts(summary.alerts)) {
      const items = el("ul", { className: "alert-list", attrs: { role: "list" } });
      for (const alert of group.alerts) {
        const time = since(alert.at);
        const row = button("alert-row", `${alert.label}. ${alert.message}${time ? `. ${exactTime(alert.at)}` : ""}`, () => select(alert.id),
          categoryIcon(alert),
          el("span", { className: "alert-text" },
            el("span", { className: "alert-line" }, el("strong", { text: alert.label }), time ? el("time", { text: time, attrs: { datetime: alert.at ?? "", title: exactTime(alert.at) } }) : null),
            el("span", { className: "alert-message", text: alert.message }),
            chip(alert)),
          el("span", { className: "unread-dot", attrs: { "aria-hidden": "true" } }));
        row.dataset.alertId = alert.id;
        items.append(el("li", {}, row));
      }
      body.append(el("section", { className: "alert-group", attrs: { "aria-label": group.title } }, el("h2", { className: "group-title", text: group.title }), items));
    }
    const footer = el("footer", { className: "panel-footer" },
      button("button primary", view.signedIn ? "Open notifications in Oryx" : "Open Oryx", () => bridge.open(), el("span", { text: view.signedIn ? "Open notifications in Oryx" : "Open Oryx" }), icon("external", 14)));
    return el("section", { className: "panel", attrs: { "data-mode": "list", role: "dialog", "aria-label": "ORYX alerts" } }, header(view), body, footer);
  }

  function detail(alert: CompanionAlert): HTMLElement {
    const category = categoryName[alertCategory(alert.type)];
    const time = exactTime(alert.at);
    const body = el("div", { className: "panel-body detail", attrs: { tabindex: "-1" } },
      el("div", { className: "detail-heading" }, categoryIcon(alert, 20),
        el("div", {}, el("p", { className: "eyebrow", text: category }), el("h2", { className: "detail-title", text: alert.label }))),
      el("div", { className: "detail-meta" }, time ? el("time", { text: time, attrs: { datetime: alert.at ?? "" } }) : null, chip(alert),
        el("span", { className: "chip", text: "Unread", attrs: { "data-tone": "neutral" } })),
      el("p", { className: "detail-message", text: alert.message }));
    const footer = el("footer", { className: "panel-footer split" },
      button("button secondary", "Back to all alerts", () => select(null), el("span", { text: "Back" })),
      button("button primary", "Open in Oryx", () => bridge.open(alert.id), el("span", { text: "Open in Oryx" }), icon("external", 14)));
    return el("section", { className: "panel", attrs: { "data-mode": "detail", role: "dialog", "aria-label": `${alert.label} alert` } },
      header(state?.view ?? { unread: 0, connected: false, signedIn: false, focused: false, quiet: false, roaming: false }, () => select(null)), body, footer);
  }

  function card(view: CompanionView, alertId: string): HTMLElement {
    const alert = view.alerts?.find((item) => item.id === alertId);
    if (!alert) return el("div");
    const more = Math.max(0, (view.alerts?.length ?? 1) - 1);
    const node = el("section", { className: "panel card", attrs: { "data-mode": "card", role: "status", "aria-live": "polite", "aria-label": "New alert" } },
      categoryIcon(alert, 18),
      button("card-body", `${alert.label}: ${alert.message}. Open in Oryx`, () => bridge.open(alert.id),
        el("span", { className: "eyebrow", text: `New alert · ${categoryName[alertCategory(alert.type)]}` }),
        el("strong", { text: alert.label }),
        el("span", { className: "card-message", text: alert.message })),
      el("div", { className: "card-actions" },
        iconButton("list", more ? `Show all ${more + 1} alerts` : "Show all alerts", () => bridge.expand()),
        iconButton("close", "Dismiss", close)));
    node.addEventListener("pointerenter", () => bridge.hover(true));
    node.addEventListener("pointerleave", () => bridge.hover(false));
    node.addEventListener("focusin", () => bridge.hover(true));
    return node;
  }

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); if (selected) select(null); else close(); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    const rows = [...root.querySelectorAll<HTMLElement>(".alert-row")];
    if (!rows.length) return;
    event.preventDefault();
    const index = rows.findIndex((row) => row === document.activeElement);
    const next = event.key === "ArrowDown" ? Math.min(rows.length - 1, index + 1) : Math.max(0, index - 1);
    rows[index < 0 ? 0 : next]?.focus();
  });
  bridge.onState((next) => {
    const opened = state?.mode !== next.mode || next.mode === "card";
    if (opened) { selected = null; root.dataset.enter = "true"; setTimeout(() => { delete root.dataset.enter; }, 200); }
    state = next; render();
    if (opened && next.mode === "list") (root.querySelector<HTMLElement>(".alert-row") ?? root.querySelector<HTMLElement>(".panel-footer .button"))?.focus();
  });
  bridge.ready();
}
