# NisseKomm - Design System

> Visual design language, responsive patterns, animations, and interaction principles.

## Table of Contents

- [Visual Language](#visual-language)
- [Color System](#color-system)
- [Typography](#typography)
- [Animation Library](#animation-library)
- [Sound Design](#sound-design)
- [Responsive Design](#responsive-design)
- [Touch Optimization](#touch-optimization)
- [Styling Conventions](#styling-conventions)

## Visual Language

### Kontrollrommet i Snøfall

The app is a control room in Snøfall, not a 1983 terminal (`docs/design-revisjon-2026.md`, option B). Two temperatures from `assets/stil.md`: warm brass, amber, parchment and dark wood for Snøfall; ice, steel and night for Kulde. As Frostgraden rises the whole interface cools; on day 24 it is warm again.

**Core Elements**:

- **Console frame** (`CRTFrame`, `.console-bezel`): dark wood with a thin brass rim. No scanlines or vignette on the frame.
- **CRT only where there is TV**: scanlines and vignette belong to Snøfall TV (`LiveCam`, drawn in canvas) and Julius' video (`JuliusVideo`, `.scanline-overlay .vignette`).
- **Thin title bars**: `RetroWindow` and `RetroModal` have a dark title strip with a 2 px brass rule and parchment text. The close button is neutral and keeps `aria-label="Lukk"`. Content, not chrome, is the brightest thing on screen.
- **Login**: Snøfall's door. Julius' office still (`/media/feed/julius-kontor.png`, falling back to `/village-day.jpg`) dimmed behind a brass plate headed «SNØFALL · DIREKTELINJE 90,0 MHz».
- **Desktop in two rows** («I DAG», «VERKTØY»): a 2×2 Julius tile (office still, «JULIUS» over «DAGBOK», red dot until today's video is watched) beside NisseMail, KodeTerminal and Snøfall TV; the tools follow in unlock order. Locked modules are hidden, never shown as «LÅST». Four columns from `md`, 56 px icons.
- **Sidebar** (`lg:w-56`): Frostgraden as a standing thermometer without a box, the three latest alerts under it. Before day 7: «LINJE 90,0 MHz · BÆREBØLGE» with one LED.
- **Day 10**: the workspace runs at `saturate(0.3)` with brief colour glimpses (`.frost-colors-leak`); text keeps its contrast and the sidebar is untouched.
- **Text size**: nothing a child reads is under 16 px (`text-base`).
- **Pixelated Rendering**: `image-rendering: pixelated` on icons.

### Interaction Principles

**Calm, never scary** (historie-2026). Feedback when something happens; stillness otherwise.

- Clicks → sound + short animation
- Success → gold flash + beep
- Error → red shake + buzz
- Fake processing delays (1.5 s) simulate "system thinking"
- Motion on a diet: Frostgraden ticks, one LED breathes. Avoid endless pulsing and blinking. `prefers-reduced-motion` stops every loop and transition (`globals.css`).

**Norwegian Language**: all UI text, errors and help in Norwegian.

## Color System

### Two temperatures, one variable

`--frost` (0–1) is set on `<html>` by `src/app/page.tsx` from `GameEngine.getFrostLevel() / 100`. On frost days (`getFrostMode().level > 0`, day 10 and 21) it is locked to 1. Before login it is 0.

| Role                  | Warm (frost 0) `--varm-*` | Cold (frost 1) `--kald-*` | Token             |
| --------------------- | ------------------------- | ------------------------- | ----------------- |
| Background            | `#120c08` dark wood       | `#0b1626` night           | `--crt-bg`        |
| Surface (window)      | `#1d140d`                 | `#12203a`                 | `--dark-crt`      |
| Border, title rule    | `#b8863b` brass           | `#5a7a99` steel           | `--brass`         |
| Primary text and UI   | `#f3e3c3` parchment       | `#dbe9f7` ice             | `--neon-green`    |
| Accent, numbers, hint | `#ffb347` amber           | `#9fd4ff` ice blue        | `--cold-blue`     |
| Success, completed    | `#ffd700` gold            | same                      | `--gold`          |
| Error                 | `#f0624a` brick           | same                      | `--christmas-red` |
| Northern lights, LED  | `#00ff8a`                 | same                      | `--aurora`        |
| Locked, disabled      | `#666666`                 | same                      | `--gray`          |

The old names are kept so the class names in components did not have to change. **`--neon-green` is no longer green**: it is the primary text colour. Each blended token is

```css
--neon-green: color-mix(
  in oklab,
  var(--varm-tekst),
  var(--kald-tekst) calc(var(--frost) * 100%)
);
```

Glows and shadows use `color-mix(in_oklab,var(--brass)_30%,transparent)` instead of hard-coded `rgba(0,255,0,…)`. The `green` icon colour in `lib/icons.tsx` is parchment.

**Usage** (Tailwind CSS v4):

```tsx
<div className="bg-(--dark-crt) border-2 border-(--brass) text-(--neon-green)">
<span className="text-(--gold)">
```

### Color Usage Rules

**Contrast**: body text meets WCAG AA (4.5:1) at both frost 0 and frost 1. `src/lib/__tests__/kontrast.test.ts` checks parchment/ice, amber/ice blue, gold and brick against background and surface, and black on brass. Change a token, run the test.

**Semantic Meanings**:

- **Parchment / ice** = primary UI and text
- **Amber / ice blue** = accents, numbers, hints
- **Gold** = achievements, completed items, success flash
- **Red** = errors and warnings
- **Green** = only northern lights (day 17), success blinks and LEDs
- **Gray** = disabled, locked

## Typography

### VT323 Monospace Font

Kid-facing components use the theme font `font-retro` (VT323), never `font-mono` (Geist Mono, left only in the parent guide).

**Source**: Google Fonts
**Fallback**: `'Courier New', monospace`

**Why VT323**:

- Authentic terminal feel
- Pixel-perfect rendering
- Excellent readability at small sizes
- Free and open source

**Import** (`layout.tsx`):

```tsx
import { VT323 } from "next/font/google";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});
```

**Application**:

```tsx
<html className={vt323.className}>
```

### Type Scale

**Responsive Sizing**:

```tsx
// Headers
<h1 className="text-2xl md:text-3xl lg:text-4xl">
<h2 className="text-xl md:text-2xl lg:text-3xl">

// Body
<p className="text-sm md:text-base lg:text-lg">

// Small
<span className="text-xs md:text-sm">
```

**Fixed Sizes**:

- `text-xs` (12px) - Small labels, timestamps
- `text-sm` (14px) - Body text, descriptions
- `text-base` (16px) - Primary content
- `text-lg` (18px) - Emphasis
- `text-xl` (20px) - Section headers
- `text-2xl` (24px) - Window titles

**Line Height**:

- Default: `leading-tight` (1.25)
- Headers: `leading-none` (1)
- Body: `leading-normal` (1.5)

## Animation Library

### Available Keyframes

Defined in `globals.css`:

```css
@keyframes scanline {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

@keyframes pulse-led {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

@keyframes flicker-in {
  0% {
    opacity: 0;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

@keyframes scale-in {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
}

@keyframes blink-cursor {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes crt-shake {
  0%,
  100% {
    transform: translate(0);
  }
  10% {
    transform: translate(-2px, 1px);
  }
  20% {
    transform: translate(2px, -1px);
  }
  30% {
    transform: translate(-1px, 2px);
  }
  40% {
    transform: translate(1px, -2px);
  }
  50% {
    transform: translate(-2px, -1px);
  }
}

@keyframes gold-flash {
  0%,
  100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(255, 215, 0, 0.3);
  }
}

@keyframes red-shake {
  0%,
  100% {
    transform: translateX(0);
  }
  25% {
    transform: translateX(-4px);
  }
  75% {
    transform: translateX(4px);
  }
}

@keyframes lock-shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-5deg);
  }
  75% {
    transform: rotate(5deg);
  }
}
```

### Usage Patterns

**Apply via Tailwind Classes**:

```tsx
// Window open animation
<div className="animate-[scale-in_0.3s_ease-out]">

// Success feedback
<div className="animate-[gold-flash_0.5s_ease-in-out]">

// Error shake
<div className="animate-[red-shake_0.3s_ease-in-out]">

// LED indicator
<div className="animate-[pulse-led_2s_ease-in-out_infinite]">

// Terminal cursor
<span className="animate-[blink-cursor_1s_step-end_infinite]">
```

### Animation Timing

**Duration Guidelines**:

- **Fast** (0.15s) - Micro-interactions, hovers
- **Normal** (0.3s) - UI transitions, modals
- **Slow** (0.5s) - Page transitions, reveals
- **Processing** (1.5s) - Fake delays, loading

**Easing Functions**:

- `ease-out` - Decelerating (most UI)
- `ease-in-out` - Smooth (modals, windows)
- `linear` - Constant (scanlines, progress)
- `step-end` - Blinking (cursor)

## Sound Design

### Audio Strategy

**Background Music**:

- Christmas jingle (loops)
- Default: OFF (30% volume)
- Toggle in top-right corner

**UI Effects**:

- Oscillator-based beeps
- Default: ON (50% volume)
- Toggle in top-right corner

**Separate Controls**:

- Music toggle (🎵 icon)
- Effects toggle (🔊 icon)
- Independent persistence

### Sound Events

**Boot Sequence**:

- Boot success → Success beep (440Hz)
- Desktop launch → Start jingle

**Window Operations**:

- Window open → UI beep (523Hz)
- Window close → UI beep (392Hz)

**Code Validation**:

- Success → Success beep (523Hz, 0.2s)
- Error → Error buzz (220Hz, 0.3s)

**Interactions**:

- Icon click → Click beep (392Hz, 0.1s)
- Button hover → Soft beep (330Hz, 0.05s)
- Locked icon → Error buzz

### Implementation

**SoundManager** (`lib/sounds.tsx`):

```typescript
// Static methods; named sounds are defined in soundConfigs
SoundManager.playSound("click");
SoundManager.playSound("success");
SoundManager.playJingle();
```

**Hook** (`useSounds()`):

```typescript
const { playSound } = useSounds();

// In component
<button onClick={() => {
  playSound("click");
  handleAction();
}}>
```

## Responsive Design

### Philosophy

**Desktop-First Design** with mobile/tablet optimization for "low hanging fruit" improvements. The app maintains retro CRT aesthetic while ensuring usability on touch devices.

### Breakpoint Strategy

**Mobile-First Tailwind**:

| Breakpoint  | Width   | Device                        | Experience                      |
| ----------- | ------- | ----------------------------- | ------------------------------- |
| **Default** | < 640px | Mobile phones                 | Single column, reduced effects  |
| **sm**      | 640px   | Large phones (landscape)      | Increased spacing               |
| **md**      | 768px   | Tablets (portrait)            | Multi-column enabled            |
| **lg**      | 1024px  | Tablets (landscape) / Laptops | **Full desktop starts**         |
| **xl**      | 1280px  | Desktop                       | Optimal viewing (design target) |

### Key Responsive Patterns

**Sidebar Collapse**:

```tsx
// Desktop only
<div className="hidden lg:flex">
  <Sidebar />
</div>

// Mobile only
<HamburgerMenu className="lg:hidden" />
```

**Grid Responsiveness**:

```tsx
// Calendar: 3 cols → 4 cols → 6 cols
<div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6">

// Desktop icons: 2 cols → 3 cols
<div className="grid grid-cols-2 md:grid-cols-3">
```

**Text Scaling**:

```tsx
<span className="text-xs md:text-sm lg:text-base">
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

**Spacing**:

```tsx
<div className="p-2 md:p-4 lg:p-6">
<div className="gap-2 md:gap-4 lg:gap-6">
```

**Split Layouts**:

```tsx
// Stack on mobile, side-by-side on desktop
<div className="flex flex-col lg:flex-row">

// Single column → grid
<div className="flex flex-col lg:grid lg:grid-cols-2">
```

### Component Responsive Checklist

**Console frame**:

```tsx
p-1 md:p-2 lg:p-4
```

**Windows**:

```tsx
w-full md:w-[90%] md:max-w-4xl
```

**Close Buttons**:

```tsx
w-12 h-12 // 48×48px minimum
```

**Calendar Grid**:

```tsx
grid-cols-3 md:grid-cols-4 lg:grid-cols-6
```

**Desktop Icons**:

```tsx
min-w-16 min-h-16 md:min-w-20 md:min-h-20
```

### Performance Optimizations (Mobile)

Defined in `@media (max-width: 768px)` in `globals.css`:

**Reduced Effects**:

- Scanline opacity: 30% (vs 100% desktop)
- Glow effects: 50% intensity reduction
- Vignette shadows: Lighter
- Animation duration: Faster

**Why**:

- Better performance on mobile devices
- Reduced battery drain
- Smoother scrolling
- Maintains aesthetic while optimizing

## Touch Optimization

### Touch Target Guidelines

**Minimum Sizes**:

- **Absolute minimum**: 44×44px (11 Tailwind units)
- **Preferred**: 48×48px (12 Tailwind units)
- **Comfortable**: 56×56px (14 Tailwind units)

**Implementation**:

```tsx
// Minimum
<button className="min-w-11 min-h-11">

// Preferred
<button className="min-w-12 min-h-12">

// Desktop icons
<button className="min-w-16 min-h-16 md:min-w-20 md:min-h-20">
```

### Active States

**Use `active:` instead of `hover:` only**:

```tsx
// ✅ GOOD - Works on touch
<button className="hover:scale-105 active:scale-95">

// ❌ BAD - No feedback on touch
<button className="hover:scale-105">
```

**Common Active States**:

```tsx
active: scale - 95; // Press effect
active: bg - --gold; // Color change
active: brightness - 90; // Dimming
active: translate - y - px; // Button press
```

### Drag & Drop

**Implement Both Mouse and Touch**:

```tsx
// Mouse events
onDragStart = { handleDragStart };
onDragOver = { handleDragOver };
onDrop = { handleDrop };

// Touch events
onTouchStart = { handleTouchStart };
onTouchMove = { handleTouchMove };
onTouchEnd = { handleTouchEnd };
onTouchCancel = { handleTouchCancel };
```

**Touch Handling**:

```tsx
// Prevent scroll interference
<div className="touch-none">

// Track touch identifier
const [touchId, setTouchId] = useState<number | null>(null);

onTouchStart={(e) => {
  const touch = e.touches[0];
  setTouchId(touch.identifier);
}}

onTouchMove={(e) => {
  const touch = Array.from(e.touches).find(t => t.identifier === touchId);
  if (touch) {
    // Handle movement
  }
}}
```

### Button Feedback

**Add Tactile Response**:

```tsx
<button className="
  bg-(--neon-green)
  text-black
  active:bg-(--gold)
  active:scale-95
  transition-all
  duration-150
">
```

## Styling Conventions

### Tailwind CSS v4 Syntax

**Custom Properties**:

```tsx
// ✅ GOOD - Tailwind v4
bg-(--neon-green)
text-(--gold)
border-(--christmas-red)

// ❌ BAD - Old syntax
bg-[var(--neon-green)]
text-[var(--gold)]
```

### Utility Classes Only

**No Custom CSS in Components**:

```tsx
// ✅ GOOD - Utility classes
<div className="flex items-center gap-4 p-6 bg-(--dark-crt)">

// ❌ BAD - Inline styles
<div style={{ display: 'flex', padding: '24px' }}>

// ❌ BAD - Custom CSS classes
<div className="custom-card">
```

### Animation Application

**Via Tailwind Classes**:

```tsx
// Keyframe reference
animate-[keyframe-name]

// With duration and easing
animate-[scale-in_0.3s_ease-out]

// Infinite loop
animate-[pulse-led_2s_ease-in-out_infinite]
```

### Conditional Styling

**Use className Composition**:

```tsx
const buttonClass = `
  px-6 py-3
  border-2 border-(--neon-green)
  ${isActive ? 'bg-(--gold) text-black' : 'bg-transparent text-(--neon-green)'}
  ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-(--neon-green) hover:text-black'}
  transition-all duration-200
`;

<button className={buttonClass}>
```

### Testing Strategy

**Chrome DevTools Responsive Mode**:

- iPhone 12 Pro (390×844)
- iPad Pro (1024×1366)
- Custom desktop (1920×1080)

**Physical Device Testing**:

- Touch interactions
- Drag-drop on tablet
- Sidebar animation on mobile
- Camera scanner on phone

**Key Test Cases**:

- NisseKrypto drag-drop on tablet
- QR scanner on mobile
- Calendar grid on all sizes
- Window modals on mobile
- Sidebar slide-in animation

---

**Last Updated**: November 2025
**Maintained By**: AI Coding Agents
