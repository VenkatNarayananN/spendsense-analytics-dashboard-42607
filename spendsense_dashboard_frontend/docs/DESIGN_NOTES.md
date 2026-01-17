# SpendSense Dashboard — Design Notes

## Theme direction (Fintech analytics, “ocean” pastel/gradient)
SpendSense uses a professional fintech analytics aesthetic built around **deep-ocean blues** with a **teal accent**, softened by subtle gradients and translucent surfaces. The goal is to feel trustworthy and data-forward while still modern/polished.

### Implementation
- Theme is driven by CSS variables in `src/App.css`.
- The active mode is applied on the document root using:  
  `document.documentElement.dataset.ssTheme = "dark" | "light"`
- The mode is persisted in local storage (`spendsense.theme.v1`) via `src/state/theme.js`.

## Spacing & layout consistency
A single spacing scale is used throughout the app shell and components:
- `--ss-space-1..5` (8 / 12 / 16 / 24 / 32)

Consistent patterns:
- **Cards**: `.ss-card` + `.ss-card-pad`
- **Headers**: `PageHeader` for page title/description + right-side actions
- **Controls**: `.ss-input`, `.ss-select`, `.ss-btn` variants

## Typography consistency
Typography is intentionally compact (analytics-first):
- Titles: `.ss-section-title` (18px, heavy)
- Card titles: `.ss-card-title` (14px, heavy)
- Secondary text: `.ss-muted` / `.ss-card-caption` (12–13px)

## Buttons & chips
Buttons use a single component (`Button`) and 3 variants:
- `primary` (gradient brand)
- `secondary` (teal accent)
- `ghost` (neutral outline)

Chips use `Chip` with tones: `primary | secondary | success | warn | error`.

## Realtime indicator (“Live” badge)
Transactions and Alerts display a subtle realtime connection indicator:
- `LiveBadge` component (`src/components/ui.js`)
- Visual: pill + **pulsing dot** when subscribed
- Behavior:
  - `SUBSCRIBED` → “Live” (green + pulse)
  - `SUBSCRIBING` → “Connecting…” (amber + pulse)
  - otherwise → “Disconnected/Offline”

Realtime status is derived from the Supabase channel subscribe callback and exposed via `AppDataContext` (`realtimeStatus`).

## Charts in dark/light mode
Charts are lightweight SVG components designed to be theme-aware:
- Area chart uses CSS variables (`--ss-chart-line`, `--ss-chart-grid`, `--ss-chart-label`).
- Bar chart fill/strokes also use CSS variables so both dark and light themes remain readable without duplicating chart logic.

## Notes for future additions
- New pages should prefer `Card`, `Button`, `Chip`, and `PageHeader` primitives.
- Avoid page-specific colors; prefer extending tokens in `App.css` and consuming via CSS variables.
