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

function drawRod(
  ctx: CanvasRenderingContext2D,
  pivot: Vec2,
  angle: number,
  bend: number,
  length: number,
  time: number
) {
  ctx.save();

  // Rod blank — drawn as a tapered path
  const buttWidth = 5;
  const midWidth = 3;
  const tipWidth = 1.2;
  const corkLen = length * 0.12;
  const buttEnd = { x: pivot.x - Math.cos(angle) * corkLen * 0.3, y: pivot.y - Math.sin(angle) * corkLen * 0.3 };

  // Compute control points along the rod with bend
  // Bend increases toward tip (quadratic distribution)
  const segments = 30;
  const path: Vec2[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const bendAmount = bend * t * t; // quadratic — tip bends most
    const a = angle + bendAmount;
    const px = pivot.x + Math.cos(a) * t * length;
    const py = pivot.y + Math.sin(a) * t * length;
    path.push({ x: px, y: py });
  }

  // Draw tapered shaft
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const t = i / segments;
    const w = buttWidth + (tipWidth - buttWidth) * t;
    // Perpendicular to tangent for width
    const nextT = Math.min(1, t + 0.02);
    const aNext = angle + bend * nextT * nextT;
    const tx = Math.cos(aNext);
    const ty = Math.sin(aNext);
    // Perpendicular: (-ty, tx)
    const perpX = -ty * w / 2;
    const perpY = tx * w / 2;

    if (i === 0) ctx.moveTo(path[i].x + perpX, path[i].y + perpY);
    else ctx.lineTo(path[i].x + perpX, path[i].y + perpY);
  }
  ctx.strokeStyle = "#1a1a2e";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Fill shaft
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const t = i / segments;
    const w = buttWidth + (tipWidth - buttWidth) * t;
    const nextT = Math.min(1, t + 0.02);
    const aNext = angle + bend * nextT * nextT;
    const tx = Math.cos(aNext);
    const ty = Math.sin(aNext);
    const perpX = -ty * w / 2;
    const perpY = tx * w / 2;
    if (i === 0) ctx.moveTo(path[i].x + perpX, path[i].y + perpY);
    else ctx.lineTo(path[i].x + perpX, path[i].y + perpY);
  }
  for (let i = path.length - 1; i >= 0; i--) {
    const t = i / segments;
    const w = buttWidth + (tipWidth - buttWidth) * t;
    const nextT = Math.min(1, t + 0.02);
    const aNext = angle + bend * nextT * nextT;
    const tx = Math.cos(aNext);
    const ty = Math.sin(aNext);
    const perpX = -ty * w / 2;
    const perpY = tx * w / 2;
    ctx.lineTo(path[i].x - perpX, path[i].y - perpY);
  }
  ctx.closePath();

  // Gradient fill — dark charcoal with subtle highlight
  const grad = ctx.createLinearGradient(
    pivot.x - 10, pivot.y,
    path[path.length - 1].x, path[path.length - 1].y
  );
  grad.addColorStop(0, "#2d2d44");
  grad.addColorStop(0.3, "#3a3a55");
  grad.addColorStop(0.6, "#2a2a40");
  grad.addColorStop(1, "#1e1e30");
  ctx.fillStyle = grad;
  ctx.fill();

  // Cork grip
  const corkEnd = corkLen;
  const corkStartT = 0.05;
  const corkEndT = corkStartT + corkLen / length;
  ctx.beginPath();
  for (let i = Math.floor(corkStartT * segments); i <= Math.floor(corkEndT * segments); i++) {
    const t = i / segments;
    const a = angle + bend * t * t;
    const cx = pivot.x + Math.cos(a) * t * length;
    const cy = pivot.y + Math.sin(a) * t * length;
    const w = buttWidth + (tipWidth - buttWidth) * t + 3; // slightly thicker
    // Perpendicular
    const tanX = Math.cos(a);
    const tanY = Math.sin(a);
    const perpX = -tanY * w / 2;
    const perpY = tanX * w / 2;
    if (i === Math.floor(corkStartT * segments)) ctx.moveTo(cx + perpX, cy + perpY);
    else ctx.lineTo(cx + perpX, cy + perpY);
  }
  for (let i = Math.floor(corkEndT * segments); i >= Math.floor(corkStartT * segments); i--) {
    const t = i / segments;
    const a = angle + bend * t * t;
    const cx = pivot.x + Math.cos(a) * t * length;
    const cy = pivot.y + Math.sin(a) * t * length;
    const w = buttWidth + (tipWidth - buttWidth) * t + 3;
    const tanX = Math.cos(a);
    const tanY = Math.sin(a);
    const perpX = -tanY * w / 2;
    const perpY = tanX * w / 2;
    ctx.lineTo(cx - perpX, cy - perpY);
  }
  ctx.closePath();
  ctx.fillStyle = "#c4a46c";
  ctx.fill();

  // Cork speckle texture
  for (let i = 0; i < 20; i++) {
    const t = corkStartT + (Math.random() * (corkEndT - corkStartT));
    const a = angle + bend * t * t;
    const cx = pivot.x + Math.cos(a) * t * length;
    const cy = pivot.y + Math.sin(a) * t * length;
    const offX = (Math.random() - 0.5) * 5;
    const offY = (Math.random() - 0.5) * 5;
    ctx.fillStyle = `rgba(${150 + Math.random()*50},${130 + Math.random()*40},${90 + Math.random()*30},0.5)`;
    ctx.beginPath();
    ctx.arc(cx + offX, cy + offY, 0.3 + Math.random() * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Reel (below grip, on bottom side)
  const reelT = corkStartT + 0.02;
  const reelA = angle + bend * reelT * reelT;
  const reelX = pivot.x + Math.cos(reelA) * reelT * length;
  const reelY = pivot.y + Math.sin(reelA) * reelT * length;
  // Reel foot (stem)
  const reelFootLen = 12;
  const footPerp = { x: -Math.sin(reelA), y: Math.cos(reelA) }; // perpendicular (below rod)
  ctx.strokeStyle = "#666";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(reelX, reelY);
  ctx.lineTo(reelX + footPerp.x * reelFootLen, reelY + footPerp.y * reelFootLen);
  ctx.stroke();

  // Reel body (circle)
  const reelCenterX = reelX + footPerp.x * reelFootLen;
  const reelCenterY = reelY + footPerp.y * reelFootLen;
  ctx.fillStyle = "#555";
  ctx.beginPath();
  ctx.arc(reelCenterX, reelCenterY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#444";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Reel spool highlight
  ctx.fillStyle = "#777";
  ctx.beginPath();
  ctx.arc(reelCenterX - 1, reelCenterY - 1, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Reel handle (rotate with time)
  ctx.save();
  ctx.translate(reelCenterX, reelCenterY);
  ctx.rotate(time * 3);
  ctx.fillStyle = "#666";
  ctx.fillRect(-1, -5, 2, 5);
  ctx.fillStyle = "#888";
  ctx.beginPath();
  ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eyelets (line guides) along the rod
  const eyeletCount = 5;
  for (let ei = 1; ei <= eyeletCount; ei++) {
    const et = corkEndT + ((ei / (eyeletCount + 1)) * (1 - corkEndT));
    const ea = angle + bend * et * et;
    const ex = pivot.x + Math.cos(ea) * et * length;
    const ey = pivot.y + Math.sin(ea) * et * length;
    const tanX = Math.cos(ea);
    const tanY = Math.sin(ea);
    const perpX = -tanY;
    const perpY = tanX;

    // Small ring on top of rod at this point
    ctx.strokeStyle = "#888";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(ex + perpX * 3, ey + perpY * 3, 2.5 - ei * 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Tip eyelet (larger)
  const tipP = path[path.length - 1];
  ctx.strokeStyle = "#aaa";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(tipP.x, tipP.y, 2, 0, Math.PI * 2);
  ctx.stroke();
  // Tiny glow at tip
  ctx.fillStyle = "rgba(165,243,252,0.5)";
  ctx.beginPath();
  ctx.arc(tipP.x, tipP.y, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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
    rodPivot: { x: 0, y: 0 },
    rodAngle: 0,       // current angle (screen-space rad)
    rodTargetAngle: 0, // spring target
    rodBend: 0,        // tip deflection (whip)
    rodBendV: 0,       // bend velocity
    castAnimPhase: 0,  // 0=none, 1=backswing, 2=whip, 3=recover
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
      state.rodPivot = { x: w * 0.35, y: h * 0.78 };
      state.rodAngle = -0.25; // slight upward angle
      state.rodTargetAngle = -0.25;
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

      // ── Rod whip physics ──
      const rodPivot = state.rodPivot;
      // Spring toward target angle
      state.rodAngle += ((state.rodTargetAngle - state.rodAngle) * 8 - (state.rodAngle - state.rodTargetAngle) * 0.5) * dt;
      // Bend decays toward 0 with velocity
      state.rodBendV -= state.rodBend * 15 * dt;
      state.rodBendV *= 0.9;
      state.rodBend += state.rodBendV * dt;
      state.rodBend *= 0.93;
      if (Math.abs(state.rodBend) < 0.001) state.rodBend = 0;

      // Compute rod tip from pivot + angle + bend
      const rodLength = Math.min(w, h) * 0.35;
      const tipAngle = state.rodAngle + state.rodBend;
      const rodTip: Vec2 = {
        x: rodPivot.x + Math.cos(tipAngle) * rodLength,
        y: rodPivot.y + Math.sin(tipAngle) * rodLength,
      };

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
        drawLine(ctx, rodTip, state.bobber, state.time, state.phase);
      }

      // Bobber
      if (state.bobber.active) {
        drawBobber(ctx, state.bobber, state.time, state.phase);
      }

      // Fishing rod (drawn on top of water, first-person in hand)
      drawRod(ctx, rodPivot, state.rodAngle, state.rodBend, rodLength, state.time);

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

    // Compute rod tip from current angle
    const rodLength = Math.min(state.w, state.h) * 0.35;
    const rodTipX = state.rodPivot.x + Math.cos(state.rodAngle) * rodLength;
    const rodTipY = state.rodPivot.y + Math.sin(state.rodAngle) * rodLength;
    const startX = rodTipX;
    const startY = rodTipY - 20;

    // Whip animation: backswing → snap forward
    state.rodTargetAngle = -0.55; // pull back
    state.rodBendV = -0.3;
    setTimeout(() => {
      state.rodTargetAngle = 0.35; // whip forward
      state.rodBendV = 0.8;
    }, 150);
    setTimeout(() => {
      state.rodTargetAngle = -0.25; // recover
    }, 500);

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
