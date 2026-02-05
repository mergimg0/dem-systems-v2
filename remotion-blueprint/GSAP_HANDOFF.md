# The Blueprint Machine - GSAP ScrollTrigger Handoff Document

**Source:** Remotion Implementation
**Target:** GSAP ScrollTrigger with Scrub
**Canvas:** 1920 × 1080 @ 30fps (950 frames = 31.67 seconds)
**Horizontal Center:** 960px

---

## Table of Contents
1. [Complete Animation Timeline](#complete-animation-timeline)
2. [Key Frame Screenshots](#key-frame-screenshots)
3. [Spring Behavior Reference](#spring-behavior-reference)
4. [Font Configuration](#font-configuration)
5. [Color Palette](#color-palette)
6. [Positioning Values](#positioning-values)
7. [The "Feel" Descriptors](#the-feel-descriptors)
8. [Technical Implementation Details](#technical-implementation-details)
9. [Easing Functions Reference](#easing-functions-reference)

---

## Complete Animation Timeline

### Phase 1: Grid Emergence (Frames 0-60)
| Frame | Global Time | Event |
|-------|-------------|-------|
| 0-30 | 0s-1s | Grid fades in (opacity 0→1), lines draw from center outward |
| 20-45 | 0.67s-1.5s | Corner markers fade in with stagger (5 frames apart) |
| 40-60 | 1.33s-2s | Crosshairs fade in at center |

### Phase 2: Layer Emergence (Frames 60-220)
| Frame | Global Time | Event |
|-------|-------------|-------|
| 45 | 1.5s | Timeline marker "30 min / Discovery" appears |
| 60 | 2s | **Layer 01 "Data Model"** emerges with spring animation |
| 80 | 2.67s | Callout 01 fades in (20 frames after layer) |
| 100 | 3.33s | Timeline marker "24 hours / V1 Build" appears |
| 105 | 3.5s | **Layer 02 "Business Logic"** emerges |
| 125 | 4.17s | Callout 02 fades in |
| 150 | 5s | **Layer 03 "Interface"** emerges |
| 170 | 5.67s | Callout 03 fades in |
| 180 | 6s | Timeline marker "7 days / Production" appears |
| 195 | 6.5s | **Layer 04 "Integrations"** emerges |
| 215 | 7.17s | Callout 04 fades in |

### Phase 3: Collapse (Frames 270-345)
| Frame | Global Time | Event |
|-------|-------------|-------|
| 270 | 9s | **Collapse begins** - layers start moving toward center |
| 290-315 | 9.67s-10.5s | Grid, crosshairs, title, timeline markers snap to center and disappear |
| 300-315 | 10s-10.5s | Callouts fade out |
| 320 | 10.67s | **Collapse complete** - all 4 layers stacked at centerY |
| 320-345 | 10.67s-11.5s | Layers fade out completely |

### Phase 4: Core Logo Sequence (Frames 345-445)
*All localFrame values = globalFrame - 345*

| Frame | Local | Event |
|-------|-------|-------|
| 345 | 0 | **CoreLogo appears** with spring scale + fade |
| 345-360 | 0-15 | "DEM" fades in with Easing.out(cubic) |
| 365-380 | 20-35 | Container width expands (0→170px) for "Systems" |
| 375-390 | 30-45 | "Systems" types out (7 chars in 15 frames) |
| 375-390 | 30-45 | Cursor blinks during typing |
| 395-400 | 50-55 | Cursor fades out |
| 410-425 | 65-80 | **"Complexity → Clarity" flashes in** with shutter effect |
| 410-440 | 65-95 | Tagline visible |
| 435-445 | 90-100 | **Pinch snap** - everything scales to 0 with Easing.in(exp) |

### Phase 5: Sentences Typewriter (Frames 455-606)
*localFrame = globalFrame - 345*

| Frame | Local | Event |
|-------|-------|-------|
| 455 | 110 | Sentences container fades in |
| 455-459 | 110-114 | **"30 minutes to understand."** types (4 frames!) |
| 459-498 | 114-153 | Hold (39 frames = 1.3s) |
| 498-502 | 153-157 | Delete sentence |
| 507-511 | 162-166 | **"24 hours to build."** types |
| 511-550 | 166-205 | Hold |
| 550-554 | 205-209 | Delete sentence |
| 559-563 | 214-218 | **"7 days to production."** types |
| 563-602 | 218-257 | Hold |
| 602-606 | 257-261 | Delete sentence |

### Phase 6: Ready + Arrow (Frames 606-813)
| Frame | Local | Event |
|-------|-------|-------|
| 606-651 | 261-306 | **Cursor blinks alone** (1.5s pause) |
| 651-681 | 306-336 | **"Ready?"** types slowly (30 frames for 6 chars) |
| 678-680 | 333-335 | Cursor fades out just before "?" appears |
| 705 | 360 | **Arrow appears** with initial fade-in (10 frames) |
| 705-770 | 360-425 | Arrow bounces (8px amplitude, sin wave at 0.11 frequency) |
| 705-770 | 360-425 | Arrow pulses opacity (40%-100%, sin wave at 0.12 frequency) |
| 770-780 | 425-435 | Arrow smoothly transitions to **pull-back position** (-8px up) |
| 780-793 | 435-448 | **TENSION HOLD** - arrow held at -8px with wiggle (±2.5px horizontal) |
| 793-813 | 448-468 | **EXPLOSIVE DESCENT** - arrowhead rockets down with quartic easing (t⁴) |

### Phase 7: Final State (Frames 813-950)
| Frame | Event |
|-------|-------|
| 813+ | Long vertical line visible, arrowhead off-screen |
| 950 | End of animation |

---

## Key Frame Screenshots

Screenshots exported to: `out/keyframes/`

```
out/keyframes/
├── 01-initial/
│   └── frame-0000.png          # Empty canvas, grid not yet visible
├── 02-grid-draw/
│   └── frame-0030.png          # Grid fully drawn
├── 03-first-layer/
│   ├── frame-0060.png          # Layer 01 emerging
│   └── frame-0080.png          # Layer 01 with callout
├── 04-all-layers/
│   └── frame-0220.png          # All 4 layers visible with callouts
├── 05-collapse-begins/
│   ├── frame-0270.png          # Collapse starting
│   └── frame-0295.png          # Mid-collapse
├── 06-collapse-complete/
│   └── frame-0320.png          # Layers stacked
├── 07-core-logo-appears/
│   ├── frame-0345.png          # "DEM" appearing
│   └── frame-0360.png          # "DEM" with spring bounce
├── 08-dem-systems-typed/
│   └── frame-0390.png          # "DEM Systems" complete
├── 09-tagline-flash/
│   └── frame-0410.png          # "Complexity → Clarity" visible
├── 10-pinch-snap/
│   ├── frame-0435.png          # Mid-pinch
│   └── frame-0445.png          # Nearly snapped away
├── 11-sentences/
│   ├── frame-0460.png          # First sentence
│   ├── frame-0520.png          # Second sentence
│   └── frame-0580.png          # Third sentence
├── 12-ready-typed/
│   ├── frame-0651.png          # Cursor blinking alone
│   └── frame-0681.png          # "Ready?" typed
├── 13-arrow-bounce/
│   ├── frame-0705.png          # Arrow first appears
│   └── frame-0750.png          # Arrow mid-bounce
├── 14-arrow-tension/
│   ├── frame-0780.png          # Arrow pulled back
│   └── frame-0790.png          # Arrow wiggling in tension
├── 15-arrow-explode/
│   ├── frame-0795.png          # Arrow starting descent
│   └── frame-0805.png          # Arrow mid-explosion
└── 16-final-state/
    ├── frame-0813.png          # Line extended, arrowhead exiting
    └── frame-0950.png          # Final frame
```

---

## Spring Behavior Reference

### Spring 1: Layer Emergence
```javascript
spring({
  frame: frame - layerStartFrame,
  fps: 30,
  config: { damping: 15, stiffness: 80 }
})
```
**Behavior:** Moderate overshoot (~15%), settles in ~20 frames (0.67s)
**Used at frames:** 60, 105, 150, 195 (each layer emergence)

### Spring 2: Core Logo Scale
```javascript
spring({
  frame: frame - 345,
  fps: 30,
  config: { damping: 12, stiffness: 100 }
})
```
**Behavior:** Slightly more bounce than layers (~18% overshoot), snappier feel, settles in ~18 frames (0.6s)
**Used at frame:** 345 (CoreLogo appearance)

### Approximate Spring Curves (sample values):
| Frame Offset | Layer Spring (d:15, s:80) | Logo Spring (d:12, s:100) |
|--------------|---------------------------|---------------------------|
| 0 | 0.00 | 0.00 |
| 5 | 0.45 | 0.55 |
| 10 | 0.92 | 1.05 |
| 15 | 1.08 | 1.12 |
| 20 | 1.02 | 1.03 |
| 25 | 0.99 | 0.99 |
| 30 | 1.00 | 1.00 |

---

## Font Configuration

### Font Family
```css
font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Font Source (CDN)
```html
<link rel="preconnect" href="https://api.fontshare.com" crossorigin>
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap" rel="stylesheet">
```

### Typography Specifications
| Element | Font Size | Font Weight | Letter Spacing |
|---------|-----------|-------------|----------------|
| "DEM Systems" | 36px | 700 (Bold) | -0.01em |
| "Complexity → Clarity" | 20px | 200 (Light) | 0.05em |
| Sentences / "Ready?" | 32px | 500 (Medium) | 0.02em |
| Timeline markers | 14px | 500 | 0.2em (uppercase) |
| Callout numbers | 14px | 600 | - |
| Callout labels | 16px | 600 | - |
| Callout sublabels | 12px | 400 | - |

---

## Color Palette

```javascript
const colors = {
  // Background
  bgWhite: '#FAFAFA',
  bgWarm: '#F5F5F4',

  // Blueprint navy lines (gradient from dark to light)
  navyDark: '#1e3a5f',      // Primary text, layer strokes
  navyMid: '#2d5a87',       // Secondary elements, cursor, arrow
  navyLight: '#4a7ba7',     // Grid lines (mid)
  navyFaint: '#a8c5db',     // Grid lines (light), crosshairs
  navyGhost: '#d4e4ed',     // Grid line ends (fade to transparent)

  // Accents (subtle)
  accentWarm: '#c45d35',    // Not used in main animation
  accentSlate: '#64748b',   // Not used in main animation

  // Text
  textDark: '#0f172a',      // Title text
  textMid: '#475569',       // Tagline "Complexity → Clarity"
  textLight: '#94a3b8',     // Sublabels

  // Layers
  layerFill: 'rgba(30, 58, 95, 0.03)',  // Very subtle fill
  layerStroke: '#1e3a5f',               // Same as navyDark
};
```

---

## Positioning Values

### Canvas Coordinates (1920×1080)
```javascript
// Phase 1: Layers + Callouts (centered as a group)
const centerX = width * 0.355;     // 681.6px - layer center
const centerY = height * 0.36;     // 388.8px - layer center
const calloutX = width * 0.647;    // 1242.24px - callout X position

// Phase 2: CoreLogo (true center)
const demLogoX = width * 0.50;     // 960px - exact center
const demLogoY = height * 0.5;     // 540px - exact center

// Sentences position (relative to CoreLogo)
left: width * 0.50 - x            // Centers at 960px
top: height / 2 - y               // Centers at 540px

// Crosshairs
horizontal: x1=0.34, x2=0.64      // 652.8px to 1228.8px
vertical: x=0.49                   // 940.8px

// Layer spacing
const explodedSpacing = 70;        // Pixels between layers when expanded
```

### Layer Y Positions (Expanded)
```javascript
// centerY = 388.8px, spacing = 70px
Layer 0: centerY + (0 - 1.5) * 70 = 283.8px
Layer 1: centerY + (1 - 1.5) * 70 = 353.8px
Layer 2: centerY + (2 - 1.5) * 70 = 423.8px
Layer 3: centerY + (3 - 1.5) * 70 = 493.8px
```

---

## The "Feel" Descriptors

### 1. Grid Emergence (frames 0-60)
*"The grid breathes into existence like a blueprint being unrolled on a drafting table. Lines draw from center outward simultaneously - horizontal and vertical - creating a sense of infinite potential space. The gradient fade at line ends gives it an ethereal quality, as if the grid extends beyond what we can see."*

**Emotionally important:** The staggered line drawing creates anticipation. Each line feels purposeful, not random.

### 2. Layer Emergence (frames 60-220)
*"Each layer doesn't just appear - it LANDS. There's a satisfying spring overshoot that gives each layer weight and presence. The timing between layers creates a rhythm: appear, settle, breathe, next. It feels like building blocks being placed by an expert hand."*

**Emotionally important:** The spring overshoot (~15%) is crucial. Without it, layers feel lifeless. The 45-frame gap between layers allows each to "breathe" before the next arrives.

### 3. The Pause Before Collapse (frames 220-270)
*"There's a pregnant pause when all four layers are visible. The system is complete. You feel the weight of what's been built. This moment of stillness makes the collapse feel more dramatic."*

**Emotionally important:** This ~1.67 second hold is NOT dead time. It's the moment of completion before transformation.

### 4. The Collapse (frames 270-320)
*"Everything snaps to center like being sucked into a singularity. The grid, crosshairs, timeline markers, and title all accelerate toward the same point with exponential easing - starting slow, then WHOOSH. The layers compress vertically, meeting at the center like a closing accordion."*

**Emotionally important:** The `Easing.in(Easing.exp)` creates that "event horizon" feeling. Linear would feel mechanical. The separate timing for layers (270-320) vs UI elements (290-315) creates visual depth.

### 5. The Snap Moment (frame 315)
*"There's a micro-moment of absolute stillness when everything converges. It's like the moment before a match strikes - potential energy at its peak."*

**Emotionally important:** The transformOrigin for the pinch is set to approximately center (width * 0.48, height * 0.5), making everything feel like it's being pulled into a black hole at that exact point.

### 6. "DEM" Appearing (frames 345-360)
*"The logo doesn't fade in - it arrives. The spring scale gives it a confident entrance, like someone stepping onto a stage. The cubic ease-out on the opacity prevents it from feeling jarring."*

**Emotionally important:** `Easing.out(cubic)` on opacity + spring on scale = confident but not aggressive.

### 7. "Systems" Typewriter (frames 375-390)
*"The typewriter feels organic, not mechanical. The cursor has a natural blink rhythm, and the container smoothly expands to accommodate each letter. There's no jolt or jump - the text flows into existence."*

**Emotionally important:** The `minWidth` expansion (0→170px with `Easing.out(cubic)`) prevents layout shift. The cursor blinks at `/4` rate during typing (faster, more energetic).

### 8. "Complexity → Clarity" Flash (frames 410-425)
*"This is the Polaroid moment. The tagline flickers in like a neon sign warming up: full brightness, dim, bright, half-dim, then stable. It has that film-flicker quality that feels nostalgic and premium."*

**Emotionally important:** The flash pattern is:
```javascript
{ start: 65, end: 67, value: 1 },      // Full
{ start: 67, end: 69, value: 0.3 },    // Dim
{ start: 69, end: 71, value: 1 },      // Full
{ start: 71, end: 73, value: 0.5 },    // Half
{ start: 73, end: 80, value: 1 },      // Stable
```
This specific pattern creates the "warming up" effect.

### 9. The Pinch-Snap (frames 435-445)
*"The logo compresses to a point and vanishes - not with a whimper but with decisive intent. The exponential easing makes it feel like the logo is being pulled away at light speed. One moment it's there, then it's rushing toward infinity."*

**Emotionally important:** `Easing.in(Easing.exp)` on scale from 1 to 0 over just 10 frames = AGGRESSIVE. This is not a gentle fade.

### 10. Sentences Appearing (frames 455+)
*"The sentences emerge with a subtle fade (5 frames), then the typing is RAPID - almost instantaneous. The 1.3 second hold lets each statement sink in. The delete is equally fast. It feels like confident communication - say what you mean, let it land, move on."*

**Emotionally important:** The 4-frame typing speed is deliberately aggressive. These aren't thoughts being composed - they're statements being declared.

### 11. The Cursor Blink Period (frames 606-651)
*"After the third sentence deletes, the cursor blinks alone in the void. It's expectant. Waiting. The slower blink rate (/15 = 0.5s on, 0.5s off) feels contemplative, not nervous."*

**Emotionally important:** This 1.5 second pause with just a blinking cursor creates anticipation. It's the "..." before the question.

### 12. "Ready?" (frames 651-681)
*"The word types slowly - deliberately. Each character lands with weight. The cursor fades out just before the question mark appears, as if the cursor's job is done. The question mark is the punctuation on the entire journey."*

**Emotionally important:** 30 frames for 6 characters = 5 frames per char = SLOW. This is not a statement, it's an invitation.

### 13. Arrow Bounce (frames 705-770)
*"The arrow bounces with playful energy - up and down, pulsing between 40% and 100% opacity. It's beckoning. Inviting. The bounce feels weightless, like a balloon on a string."*

**Emotionally important:**
- 8px amplitude is subtle enough to be elegant but noticeable
- Sin wave at 0.11 frequency = ~57 frame cycle = almost 2 seconds
- Opacity pulse adds life without being distracting

### 14. The Tension Hold (frames 780-793)
*"The arrow pulls back - held UP against its nature. The wiggle is the arrow straining against an invisible force. It WANTS to go. The horizontal wiggle (±2.5px) on both the arrowhead AND the line creates that 'head and neck' tension, like an arrow drawn in a bow."*

**Emotionally important:** This 13-frame hold (0.43 seconds) is pure anticipation. The wiggle frequency (1.5) is fast enough to feel tense but not jittery.

### 15. The Explosive Release (frames 793-813)
*"And then - RELEASE. The arrowhead LAUNCHES downward with quartic easing (t⁴). It starts slow for just a split second, then accelerates to impossible speed. The line stretches behind it like a laser beam being drawn. The arrowhead exits the frame faster than you can track. What's left is a single vertical line - a path that was traveled."*

**Emotionally important:**
- Quartic easing `(t) => t * t * t * t` is MORE aggressive than exponential for this range
- 20 frames (0.67s) for the entire descent
- The line stretching to `height * 1.2` (1296px) ensures arrowhead is WELL off-screen
- The snap from -8px bounce to 0 in just 3 frames before descent adds to the "release" feel

### 16. Final State (frames 813-950)
*"A vertical line remains - elegant, minimal, pointing the way forward. The animation has transformed from complex machinery to a single directional indicator. The journey is complete. The path is clear."*

**Emotionally important:** The line staying at 100% opacity (not fading) leaves a confident statement. This IS the call to action.

---

## Technical Implementation Details

### Typewriter Effect
```javascript
// Characters revealed over time
const visibleChars = Math.floor(
  interpolate(frame, [startFrame, endFrame], [0, text.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
);
const displayText = text.slice(0, visibleChars);
```

### Cursor Blink
```javascript
// Slower blink for sentences (/15 = 1 second cycle)
const cursorBlinkPhase = Math.floor(localFrame / 15) % 2 === 0;

// Faster blink for DEM Systems typing (/4 = ~0.27 second cycle)
const cursorBlink = localFrame >= 30 && Math.floor(localFrame / 4) % 2 === 0;
```

### Arrow Bounce
```javascript
// Normal bouncing
const bounce = Math.sin((localFrame - arrowStart) * 0.11) * 8;

// Opacity pulse (40% to 100%)
const pulse = 0.4 + (Math.sin((localFrame - arrowStart) * 0.12) + 1) / 2 * 0.6;
```

### Arrow Tension Wiggle
```javascript
const wiggleAmount = (localFrame >= pullBackFrame && localFrame < holdEndFrame)
  ? Math.sin((localFrame - pullBackFrame) * 1.5) * 2.5
  : 0;

// Applied to arrowhead X positions AND line bottom X
```

### Quartic Easing for Descent
```javascript
easing: (t) => t * t * t * t  // Quartic - extreme acceleration
```

---

## Easing Functions Reference

| Remotion Easing | GSAP Equivalent | Used For |
|-----------------|-----------------|----------|
| `Easing.out(Easing.cubic)` | `power3.out` | DEM fade-in, container expansion |
| `Easing.in(Easing.exp)` | `expo.in` | Pinch snap, UI element collapse |
| `Easing.inOut(Easing.cubic)` | `power3.inOut` | Layer collapse movement |
| `(t) => t * t * t * t` | `power4.in` (custom) | Arrow explosive descent |
| Linear (default) | `none` | Typewriter character reveal |

### Custom Easing Curves
```javascript
// Quartic (t⁴) - used for arrow descent
const quartic = (t) => t * t * t * t;

// Values at key points:
// t=0.0 → 0.0000
// t=0.2 → 0.0016
// t=0.4 → 0.0256
// t=0.6 → 0.1296
// t=0.8 → 0.4096
// t=1.0 → 1.0000
```

---

## ScrollTrigger Mapping Suggestion

For GSAP ScrollTrigger with scrub, consider mapping the 950 frames to scroll distance:

```javascript
// Example: 1 frame = ~3px scroll
const totalScrollDistance = 950 * 3; // 2850px

// Or map to viewport heights
const totalScrollDistance = window.innerHeight * 5; // 5 screen heights
```

The animation's natural "acts" suggest these scroll breakpoints:
1. **0-20%**: Grid + Layer emergence
2. **20-35%**: Layer hold + collapse
3. **35-50%**: CoreLogo sequence
4. **50-75%**: Sentences
5. **75-100%**: Ready + Arrow

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/compositions/BlueprintMachine.tsx` | Main orchestrator, layer configs, timing |
| `src/components/CoreLogo.tsx` | DEM Systems, sentences, arrow animations |
| `src/components/BlueprintGrid.tsx` | Grid drawing, crosshairs, corner markers |
| `src/components/IsometricLayer.tsx` | Isometric layer rendering |
| `src/components/Callout.tsx` | Callout boxes with numbers and text |
| `src/components/TimelineMarker.tsx` | Timeline markers on left side |
| `src/components/ProgressPulse.tsx` | Pulse lines from timeline to layers |
| `src/lib/colors.ts` | Color palette |

---

*Document generated for GSAP ScrollTrigger implementation handoff*
*Animation created in Remotion 4.0.417*
