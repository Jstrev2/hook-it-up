"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface ReelGameProps {
  fishName: string;
  fightLevel: number;
  onCaught: () => void;
  onSnap: () => void;
  onLost: () => void;
}

export default function ReelGame({ fishName, fightLevel, onCaught, onSnap, onLost }: ReelGameProps) {
  const progressRef = useRef(0);
  const tensionRef = useRef(50);
  const gameRef = useRef(true);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [tension, setTension] = useState(50);
  const [tapScale, setTapScale] = useState(1);
  const [lastTapped, setLastTapped] = useState(0);

  const cbRef = useRef({ onCaught, onSnap, onLost });
  cbRef.current = { onCaught, onSnap, onLost };

  const decayRate = 3.5 + fightLevel * 1.8;
  const tapGain = 13;
  const maxTension = 100;
  const snapThreshold = 92;
  const sweetMin = 30;
  const sweetMax = 75;

  useEffect(() => {
    const animate = (ts: number) => {
      if (!gameRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = Math.min((ts - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = ts;

      tensionRef.current = Math.max(0, tensionRef.current - decayRate * dt);

      if (tensionRef.current > sweetMin && tensionRef.current < sweetMax) {
        progressRef.current += (9 * dt);
      }

      if (tensionRef.current <= 0) {
        gameRef.current = false;
        cbRef.current.onLost();
        return;
      }
      if (tensionRef.current >= snapThreshold) {
        gameRef.current = false;
        cbRef.current.onSnap();
        return;
      }
      if (progressRef.current >= 100) {
        gameRef.current = false;
        cbRef.current.onCaught();
        return;
      }

      setProgress(Math.min(100, progressRef.current));
      setTension(tensionRef.current);
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleTap = useCallback(() => {
    if (!gameRef.current) return;
    const now = Date.now();
    if (now - lastTapped < 80) return;
    setLastTapped(now);
    tensionRef.current = Math.min(maxTension, tensionRef.current + tapGain);
    setTapScale(0.92);
    setTimeout(() => setTapScale(1), 100);
  }, [lastTapped]);

  // Tension bar color
  const barColor =
    tension > snapThreshold - 15
      ? "#ef4444"
      : tension < 20
      ? "#f59e0b"
      : "#22c55e";

  const inSweet = tension > sweetMin && tension < sweetMax;
  const isHigh = tension > snapThreshold - 20;
  const isLow = tension < 20;

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-auto select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-cyan-950/70 to-teal-950/85" />

      {/* Tap anywhere to reel */}
      <button
        onClick={handleTap}
        className="absolute inset-0 z-10"
        aria-label="Tap to reel"
        style={{ WebkitTapHighlightColor: "transparent" }}
      />

      <div className="relative z-20 flex flex-col items-center gap-6 w-full px-8 max-w-md">
        {/* Header */}
        <div className="text-center">
          <p className="text-white/40 text-xs tracking-[0.2em] uppercase mb-1">Reeling in</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{fishName}</h2>
        </div>

        {/* Visual line tension indicator — animated dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, i) => {
            const t = (i + 1) / 5;
            const active = tension * 0.95 > t * 100;
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-200"
                style={{
                  width: 8 + t * 6,
                  height: 8 + t * 6,
                  backgroundColor: active
                    ? tension > snapThreshold - 20 ? "#ef4444" : inSweet ? "#22c55e" : "#f59e0b"
                    : "rgba(255,255,255,0.08)",
                  boxShadow: active && inSweet ? "0 0 8px rgba(34,197,94,0.5)" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Main tension bar */}
        <div className="w-full">
          <div className="flex justify-between text-[10px] text-white/30 mb-2 px-1">
            <span>Slack</span>
            <span className={inSweet ? "text-green-400" : ""}>Sweet spot</span>
            <span className="text-red-400/60">Snap!</span>
          </div>

          <div className="relative w-full h-7 bg-white/5 rounded-full border border-white/10 overflow-hidden backdrop-blur-sm">
            {/* Fill */}
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${tension}%`,
                backgroundColor: barColor,
                boxShadow: inSweet
                  ? "inset 0 0 16px rgba(34,197,94,0.3), 0 0 12px rgba(34,197,94,0.25)"
                  : isHigh
                  ? "0 0 12px rgba(239,68,68,0.4)"
                  : "none",
              }}
            />
            {/* Snap zone */}
            <div className="absolute right-0 top-0 bottom-0 w-[8%] bg-red-500/10 border-l border-red-500/20" />
            {/* Sweet zone indicator */}
            <div
              className="absolute top-0 bottom-0 border border-dashed border-green-500/15 pointer-events-none"
              style={{ left: `${sweetMin}%`, width: `${sweetMax - sweetMin}%` }}
            />
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-white/5 rounded-full mt-3 overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-coral rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center">
          <div
            className="transition-transform"
            style={{ transform: `scale(${tapScale})` }}
          >
            <p className="text-white/80 text-base font-semibold tracking-wide">
              {inSweet ? "✨ PERFECT!" : isHigh ? "⚠️ EASE UP" : isLow ? "REEL FASTER" : "TAP TO REEL"}
            </p>
          </div>
          <p className="text-white/25 text-xs mt-1">Keep the bar in the green zone</p>
        </div>
      </div>
    </div>
  );
}
