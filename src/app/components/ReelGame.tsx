"use client";

import { useEffect, useRef, useCallback, useState } from "react";

interface ReelGameProps {
  fishName: string;
  fightLevel: number; // 1-5, higher = decays faster
  onCaught: () => void;
  onSnap: () => void;
  onLost: () => void;
}

export default function ReelGame({ fishName, fightLevel, onCaught, onSnap, onLost }: ReelGameProps) {
  const progressRef = useRef(0);     // 0-100, catch target
  const tensionRef = useRef(50);     // 0-100, current tension
  const gameRef = useRef(true);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const tapCountRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [tension, setTension] = useState(50);

  const decayRate = 4 + fightLevel * 1.5; // tension lost per second
  const tapGain = 14;
  const maxTension = 100;
  const snapThreshold = 95;

  useEffect(() => {
    const animate = (ts: number) => {
      if (!gameRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = ts;
      const dt = (ts - lastTimeRef.current) / 1000;
      lastTimeRef.current = ts;

      // Natural tension decay (fish fighting)
      tensionRef.current = Math.max(0, tensionRef.current - decayRate * dt);

      // Slow progress gain when tension is in the sweet spot (25-80)
      if (tensionRef.current > 25 && tensionRef.current < 80) {
        progressRef.current += (8 * dt);
      }

      // Check lose conditions
      if (tensionRef.current <= 0) {
        gameRef.current = false;
        onLost();
        return;
      }
      if (tensionRef.current >= snapThreshold) {
        gameRef.current = false;
        onSnap();
        return;
      }
      // Catch!
      if (progressRef.current >= 100) {
        gameRef.current = false;
        onCaught();
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
    tensionRef.current = Math.min(maxTension, tensionRef.current + tapGain);
    tapCountRef.current++;
  }, []);

  // Bar color based on tension
  const barColor = tension > snapThreshold - 15
    ? "#ef4444" // red — danger zone
    : tension < 20
    ? "#f59e0b" // amber — too loose
    : "#22c55e"; // green — sweet spot

  const isSweetSpot = tension > 25 && tension < 80;

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-auto"
      onClick={handleTap}
    >
      {/* Translucent backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/80 via-cyan-950/70 to-teal-950/80" />

      {/* Fish name */}
      <div className="relative z-10 mb-6 text-center">
        <p className="text-cyan-300/60 text-sm tracking-wider mb-1">REELING IN...</p>
        <h2 className="text-3xl font-extrabold text-white">{fishName}</h2>
      </div>

      {/* Tension meter bar */}
      <div className="relative z-10 w-4/5 max-w-xs mb-6">
        {/* Label */}
        <div className="flex justify-between text-xs text-cyan-400/60 mb-2">
          <span>Loose</span>
          <span>Tension</span>
          <span>Snap!</span>
        </div>

        {/* Bar track */}
        <div className="w-full h-6 bg-gray-800/80 rounded-full border border-cyan-800/30 overflow-hidden relative">
          {/* Fill */}
          <div
            className="h-full rounded-full transition-colors duration-150"
            style={{
              width: `${tension}%`,
              backgroundColor: barColor,
              boxShadow: isSweetSpot ? "0 0 12px rgba(34,197,94,0.4)" : tension > snapThreshold - 15 ? "0 0 12px rgba(239,68,68,0.6)" : "none",
            }}
          />

          {/* Snap zone marker */}
          <div className="absolute right-[5%] top-0 bottom-0 w-0.5 bg-red-500/40" />
          <div className="absolute right-0 top-0 bottom-0 w-2 bg-red-500/15" />

          {/* Sweet spot indicator */}
          <div className="absolute left-[25%] top-0 bottom-0 w-[55%] border border-dashed border-green-500/20 rounded-full pointer-events-none" />
        </div>

        {/* Progress bar underneath */}
        <div className="w-full h-2 bg-gray-800/60 rounded-full mt-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-coral rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-center text-[10px] text-cyan-400/40 mt-1">Progress</p>
      </div>

      {/* Instructions */}
      <div className="relative z-10 text-center">
        <p className="text-white/70 text-lg animate-pulse">TAP TO REEL</p>
        <p className="text-cyan-400/40 text-xs mt-1">Keep the bar in the green zone</p>
        {tension > snapThreshold - 20 && (
          <p className="text-red-400 text-sm mt-2 animate-pulse">⚠️ TOO TIGHT — EASE UP!</p>
        )}
        {tension < 15 && (
          <p className="text-amber-400 text-sm mt-2 animate-pulse">⚠️ LINE'S GOING SLACK — REEL FASTER!</p>
        )}
      </div>
    </div>
  );
}
