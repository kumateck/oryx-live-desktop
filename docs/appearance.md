# Appearance and shell controls

The UI defaults to the operating system font at 14 px. Light mode uses `#FFFFFF` background and `#1A1C1F` foreground. Dark mode uses `#181818` background and `#FFFFFF` foreground. The header and narrow icon rail are quiet window surfaces; the wider sidebar and work area form an inset layer. Header and footer stay fixed, while only the main content scrolls vertically.

Users can choose system, light, or dark mode. Each mode has its own accent, background, foreground, and UI font. Advanced settings expose UI and code font size, content and code font, reduced motion, per-mode editing, sidebar translucency, contrast, pointer cursors, and font smoothing. Settings are validated with Zod before reading from `localStorage`; this storage holds appearance preferences only, never session secrets. The settings page uses current shadcn controls generated into `apps/web/src/components/ui` on Tailwind CSS 4.

Accent names and primary color values mirror `oryx-next/src/features/appearance/config.ts` and `shadcn-themes.ts`: Amber, Blue, Cyan, Emerald, Fuchsia, Green, Indigo, Lime, Orange, Pink, Purple, Red, Rose, Sky, Teal, Violet, and Yellow. Lime is the initial desktop accent. The wordmark uses a brighter derived version of the selected accent in dark mode so it remains legible. Do not add a second independent accent list.

The animated header search currently searches available local pages. The notification sheet and account menu are working controls with typed data inputs; they receive live notifications and user identity only after the authenticated API/session integration. They do not display fabricated counts or identities. The global renderer and route error boundaries show a safe retry message; application error reporting currently goes to the local console and has an injectable reporter for a later approved telemetry destination.

After adding a route, run `bun run routes:generate`. After updating shadcn components, review generated code for compatibility with the repository's strict TypeScript settings, including `exactOptionalPropertyTypes`, then run `bun run check` and `bun run build:web`.
