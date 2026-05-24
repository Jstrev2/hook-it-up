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
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState<ProfileData[]>([]);
  const [rejects, setRejects] = useState(0);
  const [snapped, setSnapped] = useState(0);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const [fighting, setFighting] = useState<ProfileData | null>(null);

  const onBite = useCallback(() => {
    setPhase("biting");
  }, []);

  const onCatch = useCallback(() => {
    // Pick who's on the line BEFORE the reel game starts
    const match = MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)];
    setFighting(match);
    setPhase("reeling");
  }, []);

  // Wire up the ocean engine
  oceanRef.current = useOcean(canvasRef, { onBite, onCatch });

  const handleCast = () => {
    if (phaseRef.current !== "idle" || !oceanRef.current) return;
    setPhase("casting");

    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetX = w * 0.25 + Math.random() * w * 0.5;
    const targetY = h * 0.38 + Math.random() * h * 0.15;

    oceanRef.current.cast(targetX, targetY);

    setTimeout(() => setPhase("waiting"), 1000);

    const biteDelay = 2500 + Math.random() * 3500;
    setTimeout(() => {
      oceanRef.current?.bite();
    }, biteDelay);
  };

  // Reel game outcomes
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

  // Pick a fight profile for the reeling game
  const fightingFish = caught || MATCH_POOL[0];

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-blue-950">
      {/* ── Canvas Layer ── */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ── Status Text ── */}
      <div className="absolute top-[42%] left-0 right-0 text-center z-10 pointer-events-none">
        {phase === "waiting" && (
          <p className="text-cyan-300/50 text-lg animate-pulse tracking-wide drop-shadow-lg">
            Watching the bobber...
          </p>
        )}
        {phase === "biting" && (
          <p className="text-coral font-bold text-2xl tracking-wide drop-shadow-lg" style={{ animation: "bob 0.4s ease-in-out infinite" }}>
            🎣 You&apos;ve got a bite!
          </p>
        )}
      </div>

      {/* ── Cast Button ── */}
      {phase === "idle" && (
        <div className="absolute bottom-[10%] left-0 right-0 flex justify-center z-20">
          <button
            onClick={handleCast}
            className="px-14 py-6 text-2xl font-extrabold text-white bg-gradient-to-r from-coral to-orange-500 rounded-full hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-coral/40 flex items-center gap-4 tracking-wide"
          >
            <span>🎣</span>
            CAST
            <span>🎣</span>
          </button>
        </div>
      )}

      {/* ── Reel Game ── */}
      {fighting && phase === "reeling" && (
        <ReelGame
          fishName={fighting.name}
          fightLevel={fighting.fight}
          onCaught={handleReelCaught}
          onSnap={handleReelSnap}
          onLost={handleReelLost}
        />
      )}

      {/* ── Profile Card ── */}
      {caught && (
        <ProfileCard
          profile={caught}
          visible={phase === "revealed"}
          onKeep={handleKeep}
          onRelease={handleRelease}
        />
      )}

      {/* ── Score ── */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <div className="bg-deep-sea/70 backdrop-blur-md border border-cyan-800/50 rounded-2xl px-4 py-2 flex items-center gap-2 text-sm shadow-lg">
          <span>🐟</span>
          <span className="font-bold text-coral">{score}</span>
          <span className="text-cyan-300/60">points</span>
        </div>
        <div className="bg-deep-sea/70 backdrop-blur-md border border-cyan-800/50 rounded-2xl px-4 py-2 text-xs text-cyan-300/60 shadow-lg">
          {catches.length} caught • {rejects} released • {snapped} snapped
        </div>
      </div>
    </main>
  );
}
