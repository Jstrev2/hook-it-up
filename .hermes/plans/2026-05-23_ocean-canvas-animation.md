# Hook It Up — Animation Plan

**Date:** 2026-05-23
**Goal:** Replace CSS keyframe animations with a frame-by-frame `<canvas>` rendering engine that produces a convincing, atmospheric first-person fishing experience.

---

## Current State (What's Broken)

The current page uses pure CSS animations:
- `animate-bob`, `animate-ping` for bobber movement
- CSS `transition` for bobber position changes
- `@keyframes wave` on gradient divs for water
- `@keyframes twinkle` on positioned divs for stars
- SVG `<line>` with dasharray for fishing line

**Problems:**
- Bobber movement is linear interpolation via setInterval(30ms) — no physics
- Water "waves" are just gradient divs sliding left/right — looks like UI glitching
- Stars are 30 fixed-position divs — no parallax, no depth
- Fishing line is a straight dashed SVG line — no sag, no tension feedback
- Cast has no arc — bobber just lerps from A to B
- No splash, no ripple propagation, no atmosphere
- Everything is coupled to React renders — not rendering at display refresh rate

---

## Target Architecture

### Rendering Engine: Canvas 2D

A single full-screen `<canvas>` element replaces all oceanic visuals. React handles only the UI overlay layer (buttons, score, profile card). The canvas runs independently via `requestAnimationFrame`.

**Why Canvas 2D over other options:**
| Option | Pros | Cons |
|---|---|---|
| **CSS (current)** | Simple | No physics, janky |
| **Canvas 2D** ✅ | 60fps, physics, particle systems, moderate bundle | Manual draw calls |
| **Three.js / R3F** | 3D water, shaders, reflections | Heavy (~150KB gzip), overkill for 2.5D view |
| **PixiJS** | WebGL-accelerated 2D, sprite sheets | Extra dependency, learning curve |
| **Motion / Framer** | Declarative, great for UI | Not for procedural environments |

**Decision:** Canvas 2D. We're drawing a 2.5D first-person ocean view, not a 3D world. We get full control over every pixel at 60fps with zero framework overhead.

---

## Visual Layer Breakdown

```
┌─────────────────────────────────────────┐
│  SKY LAYER (stars, moon, clouds)        │
│  ├── Starfield (parallax, twinkling)    │
│  ├── Moon (glow, reflection on water)   │
│  └── Passing clouds (slow drift)        │
├─────────────────────────────────────────┤
│  WATER LAYER (dynamic ocean surface)    │
│  ├── Procedural wave field (sine+noise) │
│  ├── Moon reflection                    │
│  ├── Depth gradient (light → dark)      │
│  ├── Floating particles (plankton)      │
│  └── Bobber + ripples                   │
├─────────────────────────────────────────┤
│  UI OVERLAY (React DOM)                 │
│  ├── Cast button                        │
│  ├── Fishing rod + hands (SVG/static)   │
│  ├── Line rendering (canvas or SVG)     │
│  ├── Status text ("Waiting...")         │
│  ├── Profile card (on catch)            │
│  └── Score badge                        │
├─────────────────────────────────────────┤
│  BOAT DECK (static bottom bar)          │
│  ├── Wood planks                        │
│  ├── Hands/arms                         │
│  └── Rod with animated tip              │
└─────────────────────────────────────────┘
```

---

## Animation Sequence (Frame-by-Frame)

### Phase 1: Idle
- Ocean waves animate continuously (3 layers of sine waves at different frequencies)
- Stars twinkle (random phase offset per star)
- Moon hangs in sky with subtle glow pulse
- Bobber off-screen (or absent)
- Rod at rest angle, gentle sway matching boat motion
- Boat deck has subtle heave (vertical oscillation)

### Phase 2: Casting (~800ms)
- Rod whips forward (rotation: -15° → -45° over 400ms, then snap back)
- Bobber launches in parabolic arc (physics: initial velocity, gravity, air drag)
- Line follows bobber with sag (catenary-like curve, 3 control points)
- Small splash particles on entry point
- Concentric ring ripples expand from impact

### Phase 3: Waiting (2–5 seconds)
- Bobber floats with buoyancy physics (oscillating sin + random perturbation)
- Small persistent ripples around bobber
- Line has natural sag between rod tip and bobber
- Plankton particles drift near surface
- Occasional fish shadow passes below (subtle, no profile visible!)
- Moon reflection shimmers on wave crests

### Phase 4: Biting (~1.2s)
- Bobber yanks downward (sharp ease-in)
- Bobber resurfaces, yanks again (double-tap bite)
- Larger splash ripples expand
- Line goes taut, slight vibration
- Camera/reaction: slight screen shake
- Color shift: subtle red flash at edges

### Phase 5: Reveal
- Profile card slides up from bottom with spring physics
- Background blurs/dims (backdrop-filter or canvas opacity)
- Card has entrance animation (scale + translate spring)
- Emoji drops in with bounce
- Stars fill in sequentially with staggered delay

---

## Technical Implementation Plan

### New File: `src/app/hooks/useOcean.ts`

A custom hook that owns the canvas lifecycle:

```typescript
interface OceanState {
  phase: Phase;
  bobber: { x: number; y: number; z: number };
  line: { sag: number; tension: number };
  waves: WaveLayer[];
  stars: Star[];
  particles: Particle[];
  ripples: Ripple[];
}

function useOcean(canvasRef: RefObject<HTMLCanvasElement>) {
  // requestAnimationFrame loop
  // - Updates wave phases each frame
  // - Updates bobber physics (buoyancy, bite forces)
  // - Updates particles (spawn, age, fade)
  // - Updates ripples (expand, fade)
  // - Draws all layers in order (sky → water → objects → effects)
  // Exposes: cast(targetX, targetY), setPhase()
}
```

### Wave Rendering

Use layered sine functions with Perlin-style perturbation:

```
waveHeight(x, t) = Σ A_i · sin(f_i · x + φ_i · t) + noise(x, t)
```

3 layers:
1. **Far swells**: slow, large amplitude (A=8, f=0.02, φ=0.3)
2. **Mid chop**: medium (A=4, f=0.06, φ=0.7)  
3. **Near ripples**: fast, small (A=1.5, f=0.15, φ=1.1)

Draw as filled paths from wave crests to bottom of canvas. Apply transparency gradient for depth.

### Bobber Physics

Treat bobber as a mass-spring-damper system:

```
F_buoyancy = k_buoy · (waterLevel - bobber.y)
F_gravity = m · g
F_drag = -d · v
F_bite = impulse on bite event

a = (F_buoy + F_grav + F_drag + F_bite) / m
v += a · dt
y += v · dt
```

On cast: set initial velocity vector from rod tip toward target, apply gravity arc.

### Line Rendering

The line is a quadratic Bézier curve between rod tip and bobber:

```
controlPoint.x = (rodTip.x + bobber.x) / 2
controlPoint.y = max(rodTip.y, bobber.y) + sag

sag = baseSag + (lineLength * sagFactor) - (tension * tensionFactor)
```

Draw as a tapered path (thick near rod, thin near bobber) with slight opacity.

### Starfield

Precompute N stars with random positions, sizes, base brightness, and twinkle phase offsets. On each frame, modulate brightness with `sin(t * freq + phase)`. Apply parallax: closer stars move slightly with a "boat sway" offset, distant stars are static.

### Ripple System

Object pool pattern — pre-allocate 20 ripples. On splash event, activate a ripple with:
- `centerX`, `centerY`, `radius=0`, `maxRadius`, `opacity=0.6`, `speed`
- Each frame: radius += speed, opacity -= decay
- When opacity ≤ 0: deactivate, return to pool
- Draw as concentric stroked circles with decreasing opacity

### Particles (Plankton / Sparkles)

Similar pool, 50 particles. Random drift near water surface:
- Tiny glowing dots (1-2px)
- Slow vertical oscillation
- Horizontal drift with wave motion
- Fade in/out over lifecycles

---

## Files to Change

| File | Change |
|---|---|
| `src/app/page.tsx` | Rewrite — canvas + React overlay, remove CSS animation classes |
| `src/app/globals.css` | Strip old keyframes, keep only utility classes |
| `src/app/hooks/useOcean.ts` | **New** — canvas rendering engine |
| `src/app/components/ProfileCard.tsx` | **New** — extracted reveal card with spring animation |
| `src/app/components/BoatHUD.tsx` | **New** — static deck + rod + hands overlay |

**Bundle impact:** ~12KB gzipped for the canvas engine (+ ~3KB for spring physics).

---

## Physics / Math Dependencies

No npm packages needed. We implement:

- **Spring physics** (for profile card reveal): standard `F = -k·x - d·v` with critically damped defaults
- **Wave synthesis**: `sin()+sin()+sin()` is sufficient for convincing water — no Perlin noise library needed
- **Particle system**: simple pool allocator, ~30 lines
- **Bézier curves**: `CanvasRenderingContext2D.quadraticCurveTo()` is built-in

---

## Risks & Tradeoffs

| Risk | Mitigation |
|---|---|
| Canvas text rendering is ugly | Keep all text in React DOM overlay |
| 60fps on mobile may be heavy | Throttle particle count, reduce wave layers on `max-width < 768px` |
| Resize handling | Listen to `ResizeObserver`, update canvas dimensions, recalculate star positions |
| React re-renders fighting canvas | Canvas runs independently via ref; React only re-renders on phase changes |
| Line between rod (DOM) and bobber (canvas) | Either: render rod in canvas too, or pass DOM positions to canvas. Rod in canvas is simpler. |

---

## Validation

1. **Dev:** `npm run dev` → visually verify each phase transition
2. **Performance:** Chrome DevTools → Performance tab → verify steady 60fps with <5ms frame budget for canvas
3. **Mobile:** Chrome DevTools → Device Mode → iPhone 14 → verify fluidity
4. **Edge cases:** Rapid double-casting (disabled during animation), window resize mid-cast

---

## Recommended Build Order

1. **Canvas shell + wave rendering** — get the ocean looking right first
2. **Starfield + moon** — atmosphere layer
3. **Bobber + physics** — cast arc, buoyancy, bite yank
4. **Line rendering** — Bézier with sag
5. **Particles + ripples** — polish
6. **Profile card reveal** — spring animation, backdrop blur
7. **Performance tuning** — mobile optimization, object pooling
