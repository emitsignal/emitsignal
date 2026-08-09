# EmitSignal Design System — v0.1

> Dev-native push notifications. Violet on near-black, monospace by default, dot as the persistent motif.

---

## Identity

**Voice** — Terse, technical, lowercase. Sentences end without ceremony.

**Visual** — Dense type, generous negative space, no gratuitous gradients, no rounded everything.

**Motif** — A single violet dot. It pulses, it tags, it is the signal.

---

## Logo — Pulse variant

The chosen mark is **Pulse**: a center dot with two radiating concentric rings. Literal to the product — the dot is the signal.

### SVG construction

```
MarkPulse at size S, centered at (S/2, S/2):

  outer ring  r = S × 0.425   stroke-opacity: 0.18   stroke-width: max(1, S × 0.02)
  inner ring  r = S × 0.275   stroke-opacity: 0.38   stroke-width: max(1, S × 0.025)
  center dot  r = S × 0.15    fill: solid
```

Color on dark: `#a78bfa` (violet)
Color on light: `#5b21b6` (violet deep)

### Wordmark lockup

```
[mark]  emitsignal
```

- Font: Geist Mono, weight 500, letter-spacing −0.5
- Font size: mark-size × 0.78
- Gap between mark and text: mark-size × 0.55

### App icon backgrounds

| Platform    | Background                                          | Corner radius  |
| ----------- | --------------------------------------------------- | -------------- |
| iOS         | `linear-gradient(180deg, #2d2150 0%, #18102b 100%)` | `size × 0.224` |
| Android bg  | `radial-gradient(#3a2868 → #0d0d0f)`                | circle mask    |
| Web favicon | solid `#08080a`                                     | `size × 0.22`  |

---

## Color

### Accent

| Token        | Hex                     | Usage                |
| ------------ | ----------------------- | -------------------- |
| `violet`     | `#a78bfa`               | Primary accent, dot  |
| `violetDim`  | `#7c3aed`               | Pressed state, links |
| `violetDeep` | `#5b21b6`               | Background accents   |
| `violetBg`   | `rgba(124,58,237,0.12)` | Subtle tints         |

### Background

| Token     | Hex       | Usage                   |
| --------- | --------- | ----------------------- |
| `bg`      | `#08080a` | Canvas, page background |
| `bgElev`  | `#111113` | Cards, sheets           |
| `bgElev2` | `#191a1d` | Hover, nested surfaces  |
| `bgLine`  | `#232427` | Borders, dividers       |
| `bgChip`  | `#141517` | Tags, pills             |

### Foreground

| Token     | Hex       | Usage          |
| --------- | --------- | -------------- |
| `fg`      | `#f7f7f8` | Primary text   |
| `fgMuted` | `#a1a1a6` | Secondary text |
| `fgDim`   | `#71717a` | Meta, labels   |
| `fgFaint` | `#3f3f46` | Placeholders   |

### Semantic

| Token   | Hex       | Usage                       |
| ------- | --------- | --------------------------- |
| `green` | `#4ade80` | Success, live, build passed |
| `amber` | `#fbbf24` | Warning, p4 priority        |
| `red`   | `#f87171` | Error, failed, p5 priority  |
| `cyan`  | `#67e8f9` | Info, links, notes          |
| `pink`  | `#f0abfc` | Deploy notifications        |

### Priority dots (p1 → p5)

```
p1 #818cf8  (indigo — lowest)
p2 #a78bfa  (violet)
p3 #c4b5fd  (violet light)
p4 #fbbf24  (amber — high)
p5 #f87171  (red — critical)
```

---

## Typography

### Typefaces

| Role               | Family     | Weights         |
| ------------------ | ---------- | --------------- |
| UI & copy          | Geist      | 400 500 600 700 |
| Code, meta, labels | Geist Mono | 400 500 600     |

Fallback sans: `-apple-system, BlinkMacSystemFont, system-ui, sans-serif`
Fallback mono: `'JetBrains Mono', ui-monospace, Menlo, monospace`

### Type ramp

| Name       | Family     | Weight | Size / LH | Letter-spacing |
| ---------- | ---------- | ------ | --------- | -------------- |
| Display    | Geist      | 600    | 44 / 48   | −1.2px         |
| Title      | Geist      | 600    | 24 / 30   | −0.5px         |
| Body       | Geist      | 400    | 15 / 22   | −0.1px         |
| Caption    | Geist      | 500    | 12 / 16   | 0px            |
| Code       | Geist Mono | 400    | 13 / 20   | 0px            |
| Label mono | Geist Mono | 500    | 10 / 14   | 1.4px          |

---

## Spacing

4pt base grid: `4 8 12 16 24 32 48`

---

## Radius

| Value | Usage                    |
| ----- | ------------------------ |
| 4     | Chips, small elements    |
| 6     | Buttons, inputs          |
| 8     | Code blocks, small cards |
| 10    | Notification rows        |
| 12    | Cards                    |
| 16    | Large modals, sheets     |

---

## Glow / Elevation

Priority dots and the logo mark use a CSS box-shadow glow:

```css
box-shadow: 0 0 14px #a78bfa;
```

Elevated cards cast a subtle shadow:

```css
box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.5);
```

Hairline dividers: `1px solid #232427` (W.bgLine)

---

## Core components

### Priority dot

A filled circle sized 4–10px. Color maps to priority level p1–p5. All dots include a glow matching their color.

### Topic avatar

A monogram avatar derived from the channel name using a deterministic hash → hue. Uses `oklch(0.42 0.14 {hue})` background.

### Status pill

Monospace label in a chip:

```
background: #141517
border: 1px solid #232427
border-radius: 999px
padding: 4px 10px
font: Geist Mono 11px
```

States: `● live` (green) · `delivered` (violet) · `queued` (amber) · `failed` (red)

### Button — primary

```
background: #a78bfa
color: #08080a
font: Geist 600 13px
border-radius: 8px
padding: 10px 16px
```

### Button — ghost

```
background: transparent
color: #f7f7f8
border: 1px solid #232427
font: Geist 500 13px
border-radius: 8px
padding: 10px 16px
```

### Code block

```
background: #030304
border: 1px solid #232427
border-radius: 8px
padding: 10px 12px
font: Geist Mono 11.5px / 1.55
```

---

## Asset locations

| Asset                               | Path                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------- |
| Website favicon (SVG)               | `packages/emitsignal-website/public/favicon.svg`                       |
| Website favicon (ICO)               | `packages/emitsignal-website/public/favicon.ico`                       |
| Website PWA icon 192                | `packages/emitsignal-website/public/logo192.png`                       |
| Website PWA icon 512                | `packages/emitsignal-website/public/logo512.png`                       |
| Website Apple touch icon            | `packages/emitsignal-website/public/apple-touch-icon.png`              |
| Mobile app icon (iOS 1024)          | `packages/emitsignal-mobile/assets/images/icon.png`                    |
| Mobile splash icon                  | `packages/emitsignal-mobile/assets/images/splash-icon.png`             |
| Mobile Android foreground           | `packages/emitsignal-mobile/assets/images/android-icon-foreground.png` |
| Mobile Android background           | `packages/emitsignal-mobile/assets/images/android-icon-background.png` |
| Mobile Android monochrome           | `packages/emitsignal-mobile/assets/images/android-icon-monochrome.png` |
| Mobile web favicon                  | `packages/emitsignal-mobile/assets/images/favicon.png`                 |
| Email mark (SVG)                    | `packages/emitsignal-emails/emails/static/mark.svg`                    |
| Email logo wordmark (SVG)           | `packages/emitsignal-emails/emails/static/logo.svg`                    |
| Email mark @2x (PNG, 64×64)         | `packages/emitsignal-emails/emails/static/logo.png`                    |
| Email banner wordmark (PNG, 480×96) | `packages/emitsignal-emails/emails/static/logo-banner.png`             |
