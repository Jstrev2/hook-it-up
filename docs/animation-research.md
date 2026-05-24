# iOS First-Person Fishing Game: State-of-the-Art Animation Research

**Date:** May 2026 | **Target:** iOS (Metal API, iPhone 13+ / A15+)
**Companion to:** `ios-fishing-game-graphics-research.md` (water rendering)

---

## 1. Animation Architecture Overview

### Recommendation: Hybrid Procedural + State Machine

Don't use purely baked animations. Fishing is physics-driven — line tension, fish pull direction, rod bend all respond to runtime forces. Use:

| Layer | Technique | Tool |
|-------|-----------|------|
| Rod & reel animation | Procedural + Animation Rigging | Unity Animation Rigging package |
| Casting | Procedural trajectory + baked swing | DOTween + custom projectile solver |
| Line physics | Verlet/catenary simulation | Custom compute or CPU math |
| Fish behavior | Animation state machine + blend trees | Unity Animator + procedural layering |
| Camera | First-person Cinemachine | Cinemachine with noise + impulse |
| VFX | GPU particle systems | Unity VFX Graph (URP) or Shuriken |
| UI feedback | Tween-based | DOTween (free, production-hardened) |

### Why not baked animations:
- Fish pull direction and strength are dynamic — can't pre-keyframe a rod bending in 360° based on combat state
- Line slack/tension is a real-time physics problem
- Casting arc depends on player aim input — not a single canned animation

---

## 2. Casting Animation (First-Person POV)

### 2.1 Rod Swing

Two-phase approach:

**Phase 1 — Backswing (wind-up):**
- Player holds and releases (or flicks). IK chain from shoulder → arm → wrist → rod butt.
- Use **Unity Animation Rigging Two-Bone IK** constraint on the arm, with the IK target animated along a backswing arc.
- 0.3-0.5s duration, ease-in ease-out.

**Phase 2 — Forward cast (power stroke):**
- IK target accelerates forward. Rod tip trails behind (whip effect).
- Add **procedural rod bend**: the rod tip GameObject lags behind the butt rotation, constrained by a spring-damper model. Stiffness drops during the power stroke so the rod loads up visibly.
- 0.2-0.4s duration.
- At release point: spawn lure/bait projectile, apply impulse.

### 2.2 Lure/Bait Flight

- Projectile arc solved from release point to target water surface point.
- Use a **parabolic trajectory** (gravity-driven) with slight wind offset.
- Trail renderer or ribbon particle for the arcing line.
- Impact: spawn water splash VFX + ring ripple shader at hit point (see Section 6).

### 2.3 Camera During Cast

- Cinemachine Impulse Listener on the virtual camera.
- Small recoil impulse on forward cast (0.1-0.2 amplitude).
- Slight forward lean in FOV during the backswing (player "loading up").

### Performance
- IK solver: ~0.1ms
- Projectile + trail: negligible
- VFX spawn: ~0.2ms
- Total cast: <0.5ms CPU

---

## 3. Reeling & Rod Animation

### 3.1 Rod Bend (Runtime Procedural)

The rod is a chain of 3-5 bones. The butt is IK-controlled to the player's hands. Each subsequent bone applies:

```
bend_angle = fish_pull_force * sin(angle_between_rod_direction_and_pull) * bone_flexibility
```

- **Spring-damper** smooths the transition — rod doesn't snap, it loads up.
- Stiffness decreases as the fish fights harder = rod "loading."
- When the fish surges: large, fast deflection. When it pauses: rod rebounds.
- When the line goes slack: rod snaps back to rest pose with a small overshoot oscillation.

Tool: **Unity Animation Rigging** — use a Damped Transform constraint on each rod bone, driven by script-derived target positions based on line tension vector.

### 3.2 Reel Handle

- Continuous rotation at a speed proportional to line retrieval rate.
- Speed ramps up/down based on whether the fish is pulling line out (drag slipping) or you're gaining line.
- Simple quaternion rotation on an axis — no need for the Animator.

### 3.3 Line Tension Visual Feedback

- Rod tip oscillates with micro-vibrations when under tension (fish head shakes).
- Amplitude: 0.5-2cm world-space. Frequency: 5-15hz. Use Perlin noise for organic shake.
- When line is slack: rod goes still, tip droops slightly.

### Performance
- Rod chain (5 bones, damped transform): ~0.1ms
- Reel rotation: negligible
- Micro-vibration noise: negligible
- Total reeling: <0.2ms CPU

---

## 4. Fishing Line Physics

### 4.1 Catenary / Slack Line

The line hangs in a **catenary curve** between rod tip and water entry point. For slack line (no tension), solve the catenary:

```
y = a * cosh(x/a)   where a = horizontal_tension / (linear_density * gravity)
```

- For gameplay: approximate with 8-16 Verlet-integrated particles on CPU.
- Each particle has position, previous position (Verlet), and is constrained to neighbors.
- Rod tip particle: match rod tip world position.
- End particle: match lure/bobber position.
- Apply gravity each frame. Constrain distances between neighbors.

**Optimization for mobile:**
- Limit to 16 particles max.
- Skip simulation when line is under full tension (straight line from rod to lure is fine).
- Only simulate slack or semi-slack states.

### 4.2 Line Tension State Machine

```
SLACK     → no simulation needed, droop visible
TAUT      → straight line, micro-oscillation
FIGHTING  → high tension, rod bend active, line angle varies with fish position
BREAKING  → screen shake, line snap VFX
```

Transition between states based on: distance from rod tip to lure vs. line length.

### Performance
- 16-particle Verlet integration: ~0.05-0.1ms CPU
- Line rendering: LineRenderer with 16 points, simple unlit shader — negligible GPU cost

---

## 5. Fish Behavior & Combat Animation

### 5.1 State Machine

```
IDLE → BITE → HOOKED → FIGHTING → TIRED → NETTED
                    ↕
                  RUNNING (fish pulling line out)
                    ↕
                  SURFACE_BREAK (jump/breach)
```

### 5.2 Fish Mesh Animation

**Blend tree approach:**
- **Swim idle:** sinusoidal body wave, 0.5-2hz based on species
- **Fighting thrash:** higher amplitude, higher frequency (2-5hz), asymmetric (head shakes)
- **Surface break:** blend to vertical orientation, mouth-open pose, splash on re-entry
- **Tired:** low frequency, low amplitude, slight roll to one side

Implementation:
- Use Unity **Animator blend tree** with 1D parameter (fight_intensity, 0-1).
- The base animation is a looping swim cycle created with a sine-wave vertex shader (GPU) or bone animation.
- For mobile: prefer **vertex animation** for fish body wave rather than 20-bone spine chains. A sine-based GPU vertex shader on the fish mesh avoids bone transform costs entirely.

### 5.3 Fish Behavior Transitions

| Transition | Trigger | Animation Blend Time |
|------------|---------|---------------------|
| IDLE → BITE | Lure enters detection radius | Instant |
| BITE → HOOKED | Player sets hook (tap/swipe) | 0.1s |
| HOOKED → FIGHTING | Hook confirmed | 0.3s |
| FIGHTING → RUNNING | Fish AI decides to run | 0.2s |
| RUNNING → SURFACE_BREAK | Random probability based on species | 0.3s |
| FIGHTING → TIRED | Fish stamina depleted | 0.5s |
| TIRED → NETTED | Player reels to within netting range | 0.3s |

### Performance
- GPU vertex animation (fish body wave): ~0.05ms GPU (shader)
- Blend tree with 2-3 clips: ~0.1-0.2ms CPU
- Total fish: <0.3ms

---

## 6. Water Interaction VFX

### 6.1 Splash on Lure Landing

- **Ring ripple:** Expanding circle with alpha fade, normal-mapped to water surface. A single quad with an animated shader. ~0.1ms GPU.
- **Splash particles:** Small burst of 8-16 white/foam particles using Unity Particle System (billboards). 0.2-0.5s lifetime. ~0.2ms GPU.

### 6.2 Fish Surface Break

Larger splash — fish breaches water:
- **Water displacement:** Briefly raise the water surface vertex at the breach point (vertex shader offset on the water mesh). Fades over 0.5s.
- **Splash column:** 20-40 particles, larger, with gravity and some foam.
- **Ripple rings:** Same as lure landing but larger scale, 2-3 concentric rings.
- **Droplets:** Small high-speed particles ejected radially.

### 6.3 Bobber/Lure Floating

- Sinusoidal bobbing (vertical oscillation) driven by wave height at position.
- Tilt based on wave normal.
- When fish bites: rapid downward jerk + splash.

### 6.4 Performance Budget (VFX)
- Small splash (lure): ~0.3ms GPU
- Large splash (fish breach): ~0.5-0.8ms GPU
- Bobbing: negligible (couple of transform updates)
- Total VFX budget per frame: target <1.0ms

### Tool: Unity Shuriken (Particle System) for mobile
- VFX Graph is powerful but heavier on mobile. Shuriken is production-hardened on iOS.
- Use simple unlit shaders for particles — no PBR on droplets.

---

## 7. Camera Animation (First-Person)

### 7.1 Cinemachine Setup

- **Virtual Camera** with POV composer or 3rd-person follow (depending on perspective)
- Add **Cinemachine Impulse Listener** for shake events
- Add **Noise** component for idle bob (subtle, ~0.2 amplitude)

### 7.2 Camera Events

| Event | Effect | Intensity |
|-------|--------|-----------|
| Cast forward | Small rearward impulse | 0.1-0.2 |
| Fish strike / hook set | Sharp forward + downward jerk | 0.3-0.5 |
| Fish running (line dragging) | Rhythmic forward tugging | 0.2-0.3 sustained |
| Fish surface break | Upward flash + splash shake | 0.4-0.6 |
| Line break / snap | Sharp rearward recoil | 0.5-0.7 |
| Idle breathing | Subtle vertical sine wave | 0.05-0.1 |

### 7.3 FOV Changes

- Slight FOV increase during a fish fight (adrenaline — 60° → 63° over 0.3s)
- FOV return to normal when fish is tired or netted
- Subtle but effective for feel

### Performance
- Cinemachine overhead: ~0.1-0.2ms CPU
- Impulse generation: negligible

---

## 8. UI Animation & Haptics Tie-In

### 8.1 Tension Meter / Drag Indicator

- Animated fill bar or radial gauge.
- Use DOTween: smoothly interpolate float value, smooth damping.
- Color shift: green → yellow → orange → red as tension increases.

### 8.2 Line Counter / Distance

- Number increment animation (counting up/down as line runs out).
- DOTween.DoValue or DOTween.DoFloat for smooth counting.

### 8.3 Haptics Sync (iOS Taptic Engine)

- Fish nibble: light tap (UIImpactFeedbackGenerator .light)
- Hook set: medium impact (.medium)
- Fish running: rhythmic light taps at line-out speed
- Fish surface break: heavy impact (.heavy) + sequence of lights
- Line snap: heavy impact + silence (dramatic pause)
- Reeling: continuous light haptic at reeling speed

Note: This is native iOS via Unity's `Handheld.Vibrate()` or a plugin. For rich haptics, use a native plugin that exposes CoreHaptics (AHAP patterns).

### 8.4 Performance
- DOTween UI animations: negligible CPU
- Haptics: zero CPU (hardware)

---

## 9. Mobile Animation Performance Best Practices

### 9.1 CPU Budget (60fps / 16.67ms frame)
- Total animation + VFX: target <3ms
- IK solvers (Animation Rigging): <0.5ms total
- Animator state machines: <0.5ms (limit to 5-8 states per controller)
- Procedural scripts (rod bend, line physics): <0.5ms
- DOTween/UI tweens: <0.3ms
- Cinemachine: <0.3ms
- VFX (Shuriken): <1.0ms

### 9.2 Key Optimizations
- **Avoid Animator overuse:** Use procedural animation wherever possible. The Animator has per-frame overhead for each layer and parameter. Keep animator controllers flat (1-2 layers max).
- **Vertex animation over bone animation for fish:** A sine-wave vertex shader on the fish mesh costs ~0.05ms. A 20-bone spine animator costs ~0.3-0.5ms.
- **Object pooling for VFX:** Pre-instantiate splash particle systems. Never `Instantiate()` during gameplay.
- **LOD for distant effects:** Skip line rendering and micro-vibrations when zoomed out or in menus.
- **Update frequency:** Run line physics Verlet at 30fps (every other frame) — it's visually indistinguishable at 60fps display rate.
- **GPU instancing for particles:** All water droplets, foam, splash use the same material → batched.

### 9.3 Specific Tool Recommendations

| Tool | Purpose | Mobile Safe? |
|------|---------|--------------|
| **DOTween (free)** | UI tweens, float interpolation, transform animations | ✅ Extremely lightweight |
| **Unity Animation Rigging** | IK for arms/rod, damped constraints | ✅ (0.1-0.3ms per constraint) |
| **Cinemachine** | Camera management, impulse, noise | ✅ (0.1-0.2ms) |
| **Unity Animator** | Fish state machine, blend trees | ⚠️ Keep flat, minimal layers |
| **Shuriken Particle System** | Splash, foam, droplets | ✅ Mobile-hardened |
| **VFX Graph** | Advanced GPU particles | ⚠️ Heavier, A15+ only |
| **Unity Line Renderer** | Fishing line rendering | ✅ |
| **LeanTween** | Alternative to DOTween | ✅ Similar performance |

---

## 10. Animation Pipeline & Content Creation

### 10.1 What to Animate in Blender/Maya (baked)
- Fish swim cycle (1-3 variations per species)
- Fish surface break key poses
- Hand/arm poses for rod grip
- Netting animation

### 10.2 What to Do Procedurally (runtime)
- Rod bend (depends on fish direction + force)
- Line curve (physics)
- Cast arc (player aim dependent)
- Camera shake (event-driven)
- All VFX (runtime spawning)
- UI transitions

### 10.3 Blend Between Baked + Procedural
- Fish swim cycle (baked) → intensity blend tree (procedural parameter)
- Arm grip (IK, procedural) → cast animation (baked IK target path)

---

## 11. Summary: Recommended Animation Stack

```
Casting:          Animation Rigging Two-Bone IK + DOTween arc path + procedural rod bend
Line physics:     16-particle Verlet integration (30fps update)
Fish behavior:    GPU vertex animation swim cycle + Animator blend tree (fight_intensity 0-1)
Rod bend:         Animation Rigging Damped Transform chain (5 bones, spring-damper)
Camera:           Cinemachine POV + Impulse Listener + Noise (idle bob)
VFX:              Shuriken Particle Systems (object pooled) + ring ripple shader
UI:               DOTween for all interpolations
Haptics:          Native CoreHaptics plugin (AHAP patterns)
```

### Performance Budget (Animation + VFX only)
```
IK + procedural rod:    <0.5ms
Line physics:           <0.1ms
Fish animation:         <0.3ms
Cinemachine:            <0.3ms
VFX (pooled splashes):  <1.0ms
UI tweens:              <0.3ms
─────────────────────────────
Total animation:        <2.5ms (of 16.67ms frame)
```

### Key Assets/Tools to Acquire
- DOTween (free, Asset Store)
- Animation Rigging (Unity Package Manager, free)
- Cinemachine (Unity Package Manager, free)
- CoreHaptics Unity plugin (github or Asset Store, free options exist)

---

## 12. The "Hook It Up" Animation Enhancements — Quick Hits

If you already have a working app and want to upgrade animations incrementally:

1. **Rod bend** — biggest visual impact. Add Damped Transform chain to the rod. Makes every fight feel dynamic.
2. **Cinemachine impulse** — one afternoon of work. Hook set, fish surge, line snap all feel 10x better with camera shake.
3. **Line catenary** — swap straight line renderer for Verlet chain. Slack line looks real.
4. **Ring ripples on splash** — single quad + shader. Cheap and reads beautifully.
5. **Haptics** — iOS Taptic Engine makes fights visceral. Start with bite → light, hook set → medium, fish running → rhythmic.
6. **DOTween for UI** — if you're using Unity's built-in animation for meters/gauges, switch to DOTween. Smoother, less overhead, easier to tune.
