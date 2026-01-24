# Blender Asset Handoff: Satoshi Typography

## Font Source

**Font Family**: Satoshi
**Foundry**: Indian Type Foundry
**License**: Free for commercial use
**Download**: https://www.fontshare.com/fonts/satoshi

Download the complete font family (all weights) for Blender text objects.

---

## Font Weights Used

| Weight | CSS Value | Usage | Blender Setting |
|--------|-----------|-------|-----------------|
| Regular | 400 | Body text | Satoshi-Regular.otf |
| Medium | 500 | Taglines, subtitles | Satoshi-Medium.otf |
| Semibold | 600 | CTA buttons | Satoshi-Semibold.otf |
| Bold | 700 | Section titles | Satoshi-Bold.otf |
| Black | 900 | Hero title ("DEM Systems") | Satoshi-Black.otf |

---

## Typography Specifications

### Hero Title ("DEM Systems")

```
Font: Satoshi Black (900)
Letter Spacing: -0.02em (tracking: -20)
Line Height: 1.1
Color: #000000 (pure black)
```

**Blender Text Object Settings:**
- Font: Satoshi-Black.otf
- Character Spacing: 0.98 (to achieve -0.02em)
- Word Spacing: 1.0
- Line Spacing: 1.1
- Shear: 0
- Offset X/Y: 0

### Section Title

```
Font: Satoshi Bold (700)
Letter Spacing: -0.01em (tracking: -10)
Line Height: 1.1
Color: #000000
```

**Blender Text Object Settings:**
- Font: Satoshi-Bold.otf
- Character Spacing: 0.99

---

## "S" Letter Geometry (for Rope Threading)

The "S" in "Systems" requires special treatment for the rope physics animation.

### SVG Path Reference

The S is constructed from 3 segments for depth layering:

**Upper Curve** (rope passes BEHIND):
```
M 75 30
C 75 12, 58 0, 40 0
C 18 0, 0 15, 0 35
C 0 52, 12 62, 30 68
```

**Middle Connector** (transition zone):
```
M 30 68 C 48 74, 52 70, 70 72
```

**Lower Curve** (rope passes IN FRONT):
```
M 70 72
C 88 78, 100 88, 100 105
C 100 125, 82 140, 60 140
C 42 140, 25 128, 25 110
```

### Blender Geometry Requirements

1. **Import the SVG**: `/assets/s-letter.svg` (viewBox: 100x140)
2. **Convert to mesh**: Stroke width 16 units = ~11mm rope diameter appearance
3. **Extrude depth**: Minimal (0.5-1 unit) - this is for layering, not 3D effect
4. **Split into 3 objects**:
   - `S_Upper` (z-index: -0.02, rope behind)
   - `S_Middle` (z-index: 0, neutral)
   - `S_Lower` (z-index: +0.02, rope in front)

### Proportions Relative to Full Text

```
"DEM Systems" full width: 100%
"S" in Systems:
  - Horizontal position: ~58% from left
  - Height: matches cap height of other letters
  - Width: approximately 7% of total text width
```

---

## Material Specifications

### Text Material (Glossy Black)

```
Base Color: #000000 (0, 0, 0)
Roughness: 0.3
Metallic: 0.0
```

**Blender Principled BSDF:**
- Base Color: (0, 0, 0)
- Metallic: 0
- Roughness: 0.3
- IOR: 1.45
- Specular: 0.5

### Rope Material (Cotton)

For the rope that threads through the S:

```
Base Color: #000000 (0, 0, 0)
Roughness: 0.65
Metallic: 0.0
Clearcoat: 0.2
Clearcoat Roughness: 0.4
```

**Blender Principled BSDF:**
- Base Color: (0, 0, 0)
- Metallic: 0
- Roughness: 0.65
- Clearcoat: 0.2
- Clearcoat Roughness: 0.4
- Sheen: 0.3 (for cotton fiber effect)

---

## Rope Threading Path

The rope follows this path through the S:

```
1. Enter from top-right of S (behind upper curve)
2. Cross through middle diagonal (visible)
3. Exit bottom-left of S (in front of lower curve)
4. Continue to canvas bottom-left corner
```

### Control Points (Normalized -1 to 1 coordinate space)

| Point | X | Y | Z (depth) |
|-------|---|---|-----------|
| Entry (behind) | 0.1 | -0.2 | -0.02 |
| Mid-upper | -0.05 | -0.1 | 0 |
| Mid-lower | 0.05 | 0.1 | 0 |
| Exit (front) | -0.1 | 0.2 | +0.02 |

---

## Animation Reference

### Rope Physics Parameters

```json
{
  "diameter": 0.011,
  "segments_per_meter": 25,
  "mass_per_unit_length": 0.08,
  "stretch_stiffness": 0.45,
  "bending_stiffness": 0.08,
  "damping": 0.92
}
```

### Knot Pop Animation Timing

```
Tension buildup: 70% of knot animation duration
Snap release: 30% of knot animation duration
Easing: ease-out-back with overshoot on release
```

---

## Export Requirements

### For Web Integration

1. **3D Text mesh**: Export as GLTF/GLB
   - Include materials
   - Draco compression enabled
   - Separate S letter as distinct object

2. **Resolution**:
   - Text should be ~2000 polygons max
   - S letter: ~500 polygons (it's simple geometry)

### File Naming Convention

```
dem-systems-text.glb       # Full text mesh
dem-s-letter-upper.glb     # S upper curve (separate)
dem-s-letter-middle.glb    # S middle (separate)
dem-s-letter-lower.glb     # S lower curve (separate)
dem-rope-path.json         # Rope control points
```

---

## Color Palette

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Text/Rope | #000000 | (0, 0, 0) | All typography and rope |
| Background | #FFFFFF | (255, 255, 255) | Canvas background |
| Muted | #666666 | (102, 102, 102) | Secondary text (not in 3D) |

---

## Reference Files

- **Font CSS**: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,600,700,900&display=swap`
- **S Letter SVG**: `/assets/s-letter.svg`
- **Physics Spec**: `/thoughts/shared/specs/2026-01-17-rope-physics-v2.md`
- **Design CSS**: `/css/main.css`

---

## Questions for Blender Engineer

Before starting:

1. Is this for a pre-rendered animation or real-time (game engine)?
2. Target polygon budget for the full scene?
3. Do you need the rope as a Blender cloth/softbody sim, or just the path for Three.js?
4. Output format preference: GLTF, FBX, or Blender native?

---

## Contact

For clarification on specs or design intent, reference the original implementation at:
- Live site: https://demsystems.com
- Source: `/Users/jungmergs/dem-systems-website/`
