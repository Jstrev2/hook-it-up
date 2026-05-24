"use client";

import { useRef, useEffect, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────

export type OceanPhase = "idle" | "casting" | "waiting" | "biting";

export interface OceanState {
  phase: OceanPhase;
  bobber: Vec2 & { active: boolean };
  lineSag: number;
}

interface Vec2 {
  x: number;
  y: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleFreq: number;
  twinklePhase: number;
  parallax: number;
}

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speed: number;
  decay: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  active: boolean;
}

interface CastData {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
  initialVx: number;
  initialVy: number;
  active: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────

const WAVE_LAYERS = [
  { amplitude: 14, frequency: 0.012, phaseSpeed: 0.4, color: "rgba(6,182,212,0.25)" },
  { amplitude: 8, frequency: 0.025, phaseSpeed: 0.7, color: "rgba(8,145,178,0.20)" },
  { amplitude: 4, frequency: 0.045, phaseSpeed: 1.1, color: "rgba(14,116,144,0.15)" },
];

const STAR_COUNT = 80;
const RIPPLE_POOL_SIZE = 20;
const PARTICLE_POOL_SIZE = 40;

// ─── Physics Helpers ────────────────────────────────────────────────

function springTowards(current: number, target: number, stiffness: number, damping: number, dt: number): number {
  const force = (target - current) * stiffness;
  const velocity = force * dt;
  return current + velocity * (1 - damping);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ─── Precompute Stars ───────────────────────────────────────────────

function createStars(w: number, h: number): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h * 0.55, // top 55% of screen
    size: 0.5 + Math.random() * 1.8,
    brightness: 0.2 + Math.random() * 0.8,
    twinkleFreq: 1 + Math.random() * 3,
    twinklePhase: Math.random() * Math.PI * 2,
    parallax: 0.1 + Math.random() * 0.4,
  }));
}

// ─── Preallocate Pools ──────────────────────────────────────────────

function createRipplePool(): Ripple[] {
  return Array.from({ length: RIPPLE_POOL_SIZE }, () => ({
    x: 0, y: 0, radius: 0, maxRadius: 0, opacity: 0, speed: 0, decay: 0, active: false,
  }));
}

function createParticlePool(): Particle[] {
  return Array.from({ length: PARTICLE_POOL_SIZE }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, opacity: 0, active: false,
  }));
}

// ─── Spawn Helpers ──────────────────────────────────────────────────

function spawnRipple(pool: Ripple[], x: number, y: number, maxRadius: number, opacity: number): void {
  for (const r of pool) {
    if (!r.active) {
      r.x = x; r.y = y; r.radius = 0; r.maxRadius = maxRadius;
      r.opacity = opacity; r.speed = 20 + Math.random() * 15; r.decay = 0.3 + Math.random() * 0.2;
      r.active = true;
      return;
    }
  }
}

function spawnSplash(pool: Particle[], x: number, y: number, count: number): void {
  let spawned = 0;
  for (const p of pool) {
    if (!p.active && spawned < count) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 40 + Math.random() * 80;
      p.x = x; p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.maxLife = 0.4 + Math.random() * 0.6;
      p.life = p.maxLife;
      p.size = 1.5 + Math.random() * 2.5;
      p.opacity = 0.6 + Math.random() * 0.4;
      p.active = true;
      spawned++;
    }
  }
}

function spawnPlankton(pool: Particle[], w: number, h: number): void {
  for (const p of pool) {
    if (!p.active) {
      p.x = Math.random() * w;
      p.y = h * 0.4 + Math.random() * h * 0.3;
      p.vx = (Math.random() - 0.5) * 4;
      p.vy = (Math.random() - 0.5) * 2;
      p.maxLife = 4 + Math.random() * 6;
      p.life = p.maxLife;
      p.size = 1 + Math.random() * 2;
      p.opacity = 0.15 + Math.random() * 0.3;
      p.active = true;
    }
  }
}

// ─── Draw Functions ─────────────────────────────────────────────────

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, stars: Star[], time: number, swayX: number) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
  skyGrad.addColorStop(0, "#0c1445");
  skyGrad.addColorStop(0.5, "#0a1a3a");
  skyGrad.addColorStop(1, "rgba(8,51,68,0)");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.6);

  // Stars with parallax
  for (const s of stars) {
    const px = (s.x + swayX * s.parallax + w) % w;
    const bright = s.brightness * (0.4 + 0.6 * Math.abs(Math.sin(time * s.twinkleFreq + s.twinklePhase)));
    ctx.fillStyle = `rgba(255,255,255,${bright})`;
    ctx.beginPath();
    ctx.arc(px, s.y, s.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moon
  const moonX = w * 0.18;
  const moonY = h * 0.09;
  const moonR = Math.min(w, h) * 0.06;

  // Moon glow
  const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 3);
  moonGlow.addColorStop(0, "rgba(253,230,138,0.25)");
  moonGlow.addColorStop(0.5, "rgba(253,230,138,0.05)");
  moonGlow.addColorStop(1, "rgba(253,230,138,0)");
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2);
  ctx.fill();

  // Moon body
  const moonBody = ctx.createRadialGradient(moonX - moonR * 0.15, moonY - moonR * 0.15, 0, moonX, moonY, moonR);
  moonBody.addColorStop(0, "rgba(254,240,180,0.85)");
  moonBody.addColorStop(0.7, "rgba(245,215,120,0.6)");
  moonBody.addColorStop(1, "rgba(217,180,80,0)");
  ctx.fillStyle = moonBody;
  ctx.beginPath();
  ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
  ctx.fill();
}

function drawWaves(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, waterStart: number) {
  for (const layer of WAVE_LAYERS) {
    ctx.beginPath();
    ctx.moveTo(0, h);

    for (let x = 0; x <= w; x += 2) {
      const y = waterStart + Math.sin(x * layer.frequency + time * layer.phaseSpeed) * layer.amplitude
        + Math.sin(x * layer.frequency * 2.3 + time * layer.phaseSpeed * 0.7) * layer.amplitude * 0.4;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = layer.color;
    ctx.fill();
  }
}

function drawMoonReflection(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, waterStart: number) {
  const moonX = w * 0.18;
  const reflectionX = moonX;
  const segments = 12;

  ctx.save();
  for (let i = 0; i < segments; i++) {
    const t = i / segments;
    const y = waterStart + t * 120 + Math.sin(time * 2 + i * 0.5) * 3;
    const alpha = 0.02 + (1 - t) * 0.08;
    const width = 2 + (1 - t) * 6;

    ctx.fillStyle = `rgba(253,230,138,${alpha})`;
    ctx.fillRect(reflectionX - width / 2, y, width, 2 + Math.random() * 2);
  }
  ctx.restore();
}

function drawLine(ctx: CanvasRenderingContext2D, rodTip: Vec2, bobber: Vec2, time: number, phase: OceanPhase) {
  if (phase === "idle") return;

  const sag = lerp(60, 40, Math.min(1, Math.abs(rodTip.x - bobber.x) / 200));
  const cpx = (rodTip.x + bobber.x) / 2;
  const cpy = Math.max(rodTip.y, bobber.y) + sag + Math.sin(time * 3) * 2;

  ctx.beginPath();
  ctx.moveTo(rodTip.x, rodTip.y);
  ctx.quadraticCurveTo(cpx, cpy, bobber.x, bobber.y);
  ctx.strokeStyle = "rgba(165,243,252,0.45)";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([3, 4]);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawBobber(ctx: CanvasRenderingContext2D, b: Vec2, time: number, phase: OceanPhase) {
  const bobScale = 0.8 + Math.sin(time * 2.5) * 0.05;

  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.scale(bobScale, bobScale);

  // Ripple rings during waiting/biting
  if (phase === "waiting") {
    const r = 12 + Math.sin(time * 3) * 2;
    ctx.strokeStyle = "rgba(6,182,212,0.2)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Bobber top (red)
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(0, -7, 6, 4, 0, Math.PI, 0);
  ctx.fill();

  // Bobber white band
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(-5, -7, 10, 6);

  // Bobber bottom (red)
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.ellipse(0, -1, 6, 4, 0, 0, Math.PI);
  ctx.fill();

  // Antenna
  ctx.strokeStyle = "#ef4444";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(0, -15);
  ctx.stroke();

  // Antenna ball
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(0, -15.5, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawRipples(ctx: CanvasRenderingContext2D, ripples: Ripple[], dt: number) {
  for (const r of ripples) {
    if (!r.active) continue;
    r.radius += r.speed * dt;
    r.opacity -= r.decay * dt;
    if (r.opacity <= 0 || r.radius > r.maxRadius) {
      r.active = false;
      continue;
    }
    const progress = r.radius / r.maxRadius;
    const alpha = r.opacity * (1 - progress);
    ctx.strokeStyle = `rgba(165,243,252,${alpha})`;
    ctx.lineWidth = 1.5 * (1 - progress);
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[], dt: number) {
  for (const p of particles) {
    if (!p.active) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 30 * dt; // slight gravity
    p.life -= dt;
    if (p.life <= 0) { p.active = false; continue; }
    const alpha = p.opacity * (p.life / p.maxLife);
    ctx.fillStyle = `rgba(165,243,252,${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2);
    ctx.fill();
  }
}

// ─── Hook ───────────────────────────────────────────────────────────

export interface OceanAPI {
  cast: (targetX: number, targetY: number) => void;
  bite: () => void;
  catch: () => void;
  reset: () => void;
}

interface UseOceanOptions {
  onBite: () => void;
  onCatch: () => void;
}

export function useOcean(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: UseOceanOptions
): OceanAPI {
  const stateRef = useRef({
    phase: "idle" as OceanPhase,
    w: 0,
    h: 0,
    waterStart: 0,
    time: 0,
    swayX: 0,
    stars: [] as Star[],
    ripples: createRipplePool(),
    particles: createParticlePool(),
    bobber: { x: 0, y: 0, active: false } as Vec2 & { active: boolean },
    bobberVy: 0,
    rodTip: { x: 0, y: 0 },
    castData: { startX: 0, startY: 0, targetX: 0, targetY: 0, startTime: 0, duration: 0, initialVx: 0, initialVy: 0, active: false } as CastData,
    biteForce: 0,
    planktonTimer: 0,
    lastTime: 0,
    onBite: options.onBite,
    onCatch: options.onCatch,
  });

  const state = stateRef.current;

  // Resize handler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      state.w = w;
      state.h = h;
      state.waterStart = h * 0.38;
      state.stars = createStars(w, h);
      state.rodTip = { x: w * 0.4, y: h * 0.75 };
      if (!state.bobber.active) {
        state.bobber.x = w * 0.5;
        state.bobber.y = h * 0.42;
      }
    };

    resize();
    window.addEventListener("resize", resize);

    // Main render loop
    let rafId: number;
    const loop = (timestamp: number) => {
      if (state.lastTime === 0) state.lastTime = timestamp;
      let dt = (timestamp - state.lastTime) / 1000;
      if (dt > 0.1) dt = 0.016; // cap to prevent spiral of death
      state.lastTime = timestamp;
      state.time += dt;

      const ctx = canvas.getContext("2d");
      if (!ctx) { rafId = requestAnimationFrame(loop); return; }

      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { w, h, waterStart } = state;

      // ── Sway (gentle boat motion) ──
      state.swayX = Math.sin(state.time * 0.3) * 2;

      // ── Handle cast physics ──
      if (state.castData.active) {
        const cd = state.castData;
        const elapsed = state.time - cd.startTime;
        const t = Math.min(elapsed / cd.duration, 1);
        // Arc trajectory
        const g = 500; // gravity pixels/s²
        state.bobber.x = cd.startX + cd.initialVx * elapsed;
        state.bobber.y = cd.startY + cd.initialVy * elapsed + 0.5 * g * elapsed * elapsed;
        state.bobber.active = true;

        if (t >= 1) {
          // Landed
          cd.active = false;
          state.bobber.y = Math.max(state.bobber.y, waterStart + 5);
          state.bobberVy = 0;
          spawnRipple(state.ripples, state.bobber.x, state.bobber.y, 40, 0.5);
          spawnSplash(state.particles, state.bobber.x, state.bobber.y, 8);
          state.phase = "waiting";
        }
      }

      // ── Bobber buoyancy physics ──
      if (state.bobber.active && state.phase !== "casting") {
        const bobY = state.bobber.y;
        const waterLevel = waterStart + Math.sin(state.bobber.x * 0.02 + state.time * 0.6) * 3;
        const depth = bobY - waterLevel;

        if (depth < 0) {
          // Above water — gravity pulls down
          state.bobberVy += 200 * dt;
        } else {
          // In water — buoyancy pushes up + damping
          const buoyancy = -depth * 80;
          const damping = -state.bobberVy * 3;
          state.bobberVy += (buoyancy + damping) * dt;
        }

        // Bite force
        if (state.biteForce !== 0) {
          state.bobberVy += state.biteForce * dt;
          state.biteForce *= Math.exp(-8 * dt); // decay bite force
          if (Math.abs(state.biteForce) < 1) state.biteForce = 0;
        }

        state.bobber.y += state.bobberVy * dt;
        state.bobber.y = Math.max(waterStart + 5, Math.min(state.bobber.y, h * 0.75));
      }

      // ── Plankton spawn ──
      state.planktonTimer += dt;
      if (state.planktonTimer > 3) {
        state.planktonTimer = 0;
        spawnPlankton(state.particles, w, h);
      }

      // ── DRAWING ORDER ──
      ctx.clearRect(0, 0, w, h);

      // Sky + stars + moon
      drawSky(ctx, w, h, state.stars, state.time, state.swayX);

      // Moon reflection on water
      drawMoonReflection(ctx, w, h, state.time, waterStart);

      // Waves
      drawWaves(ctx, w, h, state.time, waterStart);

      // Particles (plankton, splash)
      drawParticles(ctx, state.particles, dt);

      // Ripples
      drawRipples(ctx, state.ripples, dt);

      // Line
      if (state.bobber.active) {
        drawLine(ctx, state.rodTip, state.bobber, state.time, state.phase);
      }

      // Bobber
      if (state.bobber.active) {
        drawBobber(ctx, state.bobber, state.time, state.phase);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafId);
    };
  }, [canvasRef]);

  // ── Public API ──
  const cast = useCallback((targetX: number, targetY: number) => {
    if (state.phase !== "idle") return;
    state.phase = "casting";

    const startX = state.rodTip.x;
    const startY = state.rodTip.y - 20;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const duration = 0.6 + Math.random() * 0.3;
    const g = 500;

    // Solve for initial velocity to hit target with gravity
    // y = y0 + vy0*t + 0.5*g*t² → vy0 = (y - y0 - 0.5*g*t²) / t
    const vy0 = (dy - 0.5 * g * duration * duration) / duration;
    const vx0 = dx / duration;

    state.castData = {
      startX, startY, targetX, targetY,
      startTime: state.time,
      duration,
      initialVx: vx0,
      initialVy: vy0,
      active: true,
    };

    state.bobber.x = startX;
    state.bobber.y = startY;
    state.bobberVy = vy0;
    state.bobber.active = true;
    state.biteForce = 0;
  }, []);

  const bite = useCallback(() => {
    if (state.phase !== "waiting") return;
    state.phase = "biting";

    // First yank down
    state.biteForce = -400;
    spawnRipple(state.ripples, state.bobber.x, state.bobber.y, 30, 0.6);

    // Second yank after delay
    setTimeout(() => {
      if (state.phase === "biting") {
        state.biteForce = -500;
        spawnRipple(state.ripples, state.bobber.x, state.bobber.y, 45, 0.7);
      }
    }, 400);

    // Trigger catch after bite animation
    setTimeout(() => {
      if (state.phase === "biting") {
        state.onCatch();
      }
    }, 1200);
  }, []);

  const reset = useCallback(() => {
    state.phase = "idle";
    state.bobber.active = false;
    state.bobberVy = 0;
    state.biteForce = 0;
    state.castData.active = false;
  }, []);

  return { cast, bite, reset, catch: bite };
}
