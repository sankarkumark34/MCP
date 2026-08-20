# UI Design Tokens

All visual values are centralized in
[`apps/web/src/styles/tokens.css`](../apps/web/src/styles/tokens.css) as CSS
custom properties. Components never hard-code raw colors.

The console is **light theme only** by design (spec §6.1) — `color-scheme:
light` is declared and no dark palette exists.

## Color system (spec §6.2)

| Token | Value | Use |
|-------|-------|-----|
| `--color-primary` | `#2563EB` | Primary actions, links, active nav |
| `--color-primary-dark` | `#1D4ED8` | Hover state of primary actions |
| `--color-text` | `#0F172A` | Body text |
| `--color-muted` | `#64748B` | Secondary text, labels |
| `--color-surface` | `#FFFFFF` | Cards, tables, inputs |
| `--color-canvas` | `#F8FAFC` | Page background |
| `--color-border` | `#E2E8F0` | Borders, dividers |
| `--color-success` | `#16A34A` | Sent status, active badges |
| `--color-warning` | `#D97706` | Retried status, capability warnings |
| `--color-danger` | `#DC2626` | Failed status, destructive actions |
| `--color-info` | `#0284C7` | Pending status, informational UI |

Each status color has a `-soft` background variant for badges and banners.

## Typography

Inter-first system stack (`--font-sans`), JetBrains Mono stack (`--font-mono`)
for IDs. Sizes: `--text-xs` (12px) → `--text-2xl` (28px).

## Spacing, radius, elevation

4px-based spacing scale (`--space-1` … `--space-8`), radii 6/10/14px,
three shadow levels (`--shadow-sm/md/lg`).

## Motion (spec §6.3)

Transitions are 150–250ms (`--transition-fast/base/slow`) and applied only to
hover, focus, dialogs, drawers and toasts. `prefers-reduced-motion: reduce`
collapses all durations to ~0.

## Status → color mapping

Statuses are always communicated with **text + color** (badges include the
status word), never color alone:

- `SENT` → success, `RETRIED` → warning, `FAILED` → danger,
  `PENDING` → info, `SKIPPED` → muted.
