"use client";

import { useRef, useState, useCallback } from "react";
import { useOcean, type OceanAPI } from "./hooks/useOcean";
import ProfileCard from "./components/ProfileCard";
import ReelGame from "./components/ReelGame";
import { MATCH_POOL, type ProfileData } from "./data/profiles";

// ─── Main Page ──────────────────────────────────────────────────────

type Phase = "idle" | "casting" | "waiting" | "biting" | "reeling" | "revealed";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const oceanRef = useRef<OceanAPI | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [caught, setCaught] = useState<ProfileData | null>(null);
  const [fighting, setFighting] = useState<ProfileData | null>(null);
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState<ProfileData[]>([]);
  const [rejects, setRejects] = useState(0);
  const [snapped, setSnapped] = useState(0);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const onBite = useCallback(() => setPhase("biting"), []);

  const onCatch = useCallback(() => {
    const match = MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)];
    setFighting(match);
    setPhase("reeling");
  }, []);

  oceanRef.current = useOcean(canvasRef, { onBite, onCatch });

  const handleCast = () => {
    if (phaseRef.current !== "idle" || !oceanRef.current) return;
    setPhase("casting");

    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetX = w * 0.2 + Math.random() * w * 0.6;
    const targetY = h * 0.35 + Math.random() * h * 0.2;

    oceanRef.current.cast(targetX, targetY);
    setTimeout(() => setPhase("waiting"), 900);
    const biteDelay = 2500 + Math.random() * 3500;
    setTimeout(() => oceanRef.current?.bite(), biteDelay);
  };

  const handleReelCaught = useCallback(() => {
    if (fighting) {
      setCaught(fighting);
      setPhase("revealed");
    }
    oceanRef.current?.reset();
  }, [fighting]);

  const handleReelSnap = useCallback(() => {
    setPhase("idle");
    setSnapped((s) => s + 1);
    setFighting(null);
    oceanRef.current?.reset();
  }, []);

  const handleReelLost = useCallback(() => {
    setPhase("idle");
    setFighting(null);
    oceanRef.current?.reset();
  }, []);

  const handleKeep = () => {
    if (caught) {
      setScore((s) => s + caught.rarity);
      setCatches((prev) => [...prev, caught]);
    }
    setCaught(null);
    setPhase("idle");
  };

  const handleRelease = () => {
    setRejects((r) => r + 1);
    setCaught(null);
    setPhase("idle");
  };

  return (
    <main
      className="h-dvh w-dvw overflow-hidden relative bg-blue-950"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {/* Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* HUD: top-left — subtle branding */}
      <div className="absolute top-[max(16px,env(safe-area-inset-top,0px))] left-4 z-20 pointer-events-none">
        <h1 className="text-white/30 text-xs font-mono tracking-[0.15em]">HOOK IT UP</h1>
      </div>

      {/* HUD: top-right — stats */}
      <div className="absolute top-[max(16px,env(safe-area-inset-top,0px))] right-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-white/40">🐟</span>
          <span className="font-semibold text-coral tabular-nums">{score}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-white/25">
          <span>{catches.length} kept</span>
          <span>{snapped} lost</span>
        </div>
      </div>

      {/* Status text */}
      <div className="absolute top-[40%] left-0 right-0 text-center z-10 pointer-events-none">
        {phase === "waiting" && (
          <p className="text-white/30 text-sm tracking-wide animate-pulse">
            watching the bobber...
          </p>
        )}
        {phase === "biting" && (
          <p className="text-coral/90 font-bold text-xl tracking-wide" style={{ animation: "bob 0.3s ease-in-out infinite" }}>
            🎣 Bite!
          </p>
        )}
      </div>

      {/* Cast button — full-width at bottom, above safe area */}
      {phase === "idle" && (
        <div
          className="absolute left-4 right-4 z-20 flex justify-center"
          style={{
            bottom: `max(24px, env(safe-area-inset-bottom, 0px) + 12px)`,
          }}
        >
          <button
            onClick={handleCast}
            className="w-full max-w-sm py-5 bg-gradient-to-r from-coral to-orange-500 text-white text-lg font-extrabold rounded-2xl active:scale-[0.97] transition-all shadow-xl shadow-coral/30 tracking-wider flex items-center justify-center gap-3"
            style={{ minHeight: 56 }}
          >
            <span className="text-xl">🎣</span>
            CAST YOUR LINE
            <span className="text-xl">🎣</span>
          </button>
        </div>
      )}

      {/* Reel Game */}
      {fighting && phase === "reeling" && (
        <ReelGame
          fishName={fighting.name}
          fightLevel={fighting.fight}
          onCaught={handleReelCaught}
          onSnap={handleReelSnap}
          onLost={handleReelLost}
        />
      )}

      {/* Profile Card */}
      {caught && (
        <ProfileCard
          profile={caught}
          visible={phase === "revealed"}
          onKeep={handleKeep}
          onRelease={handleRelease}
        />
      )}
    </main>
  );
}
