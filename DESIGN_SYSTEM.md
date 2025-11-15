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

### Retro CRT Terminal Aesthetic

Think 1980s computer monitor - fictional in-game terminals like GTA with nostalgic, pixelated look.

**Core Elements**:

- **Monitor Frame**: Thick bezels around screen
- **Scanlines**: Animated horizontal lines
- **CRT Glow**: Subtle blur and bloom effects
- **Pixelated Rendering**: `image-rendering: pixelated`
- **Vignette**: Darkened corners
- **No Smooth Edges**: Jagged, authentic pixel look

**CSS Implementation** (`globals.css`):

```css
.crt-screen {
  image-rendering: pixelated;
  box-shadow: inset 0 0 100px rgba(0, 255, 0, 0.1);
}

.scanline {
  background: linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%);
  animation: scanline 8s linear infinite;
}

.vignette {
  box-shadow: inset 0 0 200px rgba(0, 0, 0, 0.9);
}
```

### Interaction Principles

**Playful, Not Realistic**:

- Exaggerated animations
- Immediate visual feedback
- Generous hover areas
- Cartoonish effects

**Every Action Has Feedback**:

- Clicks → sound + animation
- Hover → glow + scale
- Success → gold flash + beep
- Error → red shake + buzz

**Fake Processing Delays**:

- 1.5s delays simulate "system thinking"
- Progress animations during waits
- Adds to retro computer feel

**Constant Motion**:

- Blinking LEDs
- Scrolling alerts
- Pulsing indicators
- Scanline animation

**Norwegian Language**:

- All UI text in Norwegian
- Error messages in Norwegian
- Help text in Norwegian

## Color System

### Christmas Color Palette

**Primary Colors**:

| Color             | Hex       | Usage                          | Text Color            |
| ----------------- | --------- | ------------------------------ | --------------------- |
| **Neon Green**    | `#00ff00` | Primary UI, text, success      | `text-black`          |
| **Christmas Red** | `#ff0000` | Errors, warnings, alerts       | `text-black`          |
| **Gold**          | `#ffd700` | Achievements, completed states | `text-black`          |
| **Cold Blue**     | `#00ddff` | Secondary info, hints          | `text-black`          |
| **Dark CRT**      | `#0a1a0a` | Background (deep green-black)  | `text-(--neon-green)` |
| **Gray**          | `#666666` | Disabled, locked elements      | `text-(--neon-green)` |

### CSS Custom Properties

**Definition** (`globals.css`):

```css
:root {
  --neon-green: #00ff00;
  --christmas-red: #ff0000;
  --gold: #ffd700;
  --cold-blue: #00ddff;
  --dark-crt: #0a1a0a;
  --gray: #666666;
}
```

**Usage** (Tailwind CSS v4):

```tsx
// ✅ GOOD - Tailwind v4 syntax
<div className="bg-(--neon-green) text-black">
<button className="border-(--christmas-red)">
<span className="text-(--gold)">

// ❌ BAD - Old syntax
<div className="bg-[var(--neon-green)]">
```

### Color Usage Rules

**Contrast Rule**:

- Use `text-black` on bright backgrounds (neon green, gold, red)
- Ensures readability on high-contrast colors
- WCAG AA compliance

**Semantic Meanings**:

- **Green** = primary UI, navigation, success states
- **Red** = errors, warnings, critical alerts, locked items
- **Gold** = achievements, completed items, rewards
- **Blue** = hints, secondary information, help text
- **Gray** = disabled, locked, unavailable

**State Indicators**:

- **Available** → Neon green glow
- **Locked** → Gray with red lock icon
- **Completed** → Gold with checkmark
- **Error** → Red shake animation
- **Success** → Gold flash animation

## Typography

### VT323 Monospace Font

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
class SoundManager {
  private audioContext: AudioContext | null = null;

  playBeep(frequency: number, duration: number) {
    const oscillator = this.audioContext.createOscillator();
    oscillator.frequency.value = frequency;
    oscillator.connect(this.audioContext.destination);
    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}
```

**Hook** (`useSounds()`):

```typescript
const { playSuccess, playError, playClick } = useSounds();

// In component
<button onClick={() => {
  playClick();
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

**CRT Borders**:

```tsx
border-4 md:border-8 lg:border-20
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
