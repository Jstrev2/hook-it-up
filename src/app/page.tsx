"use client";

import { useRef, useState, useCallback } from "react";
import { useOcean, type OceanAPI } from "./hooks/useOcean";
import ProfileCard, { type ProfileData } from "./components/ProfileCard";

// ─── Match Data ─────────────────────────────────────────────────────

const MATCH_POOL: ProfileData[] = [
  { name: "Nemo", emoji: "🐠", tagline: "Just keep swimming", bio: "Adventurous, loyal, loves exploring new reefs. Looking for someone to share anemones with.", size: 1 },
  { name: "Goldie", emoji: "🐟", tagline: "Wait, what were we talking about?", bio: "Short attention span but a huge heart. Forgets arguments in 3 seconds flat.", size: 1 },
  { name: "Angel", emoji: "🐠", tagline: "Too good for this ocean", bio: "Heavenly vibes. Loves sunrise swims, coral gardens, and deep conversations under the moonlight.", size: 2 },
  { name: "Puffy", emoji: "🐡", tagline: "Don't poke me", bio: "I puff up when I'm nervous (it's cute, I promise). Soft interior, spiky exterior.", size: 2 },
  { name: "Rio", emoji: "🐠", tagline: "Party in the kelp forest", bio: "Carnival energy 24/7. If you can't handle the bubbles, stay out of the reef.", size: 2 },
  { name: "Inky", emoji: "🦑", tagline: "Mysterious and ink-redible", bio: "Deep thinker, deeper waters. Writes poetry in ink. Prefers dark, quiet depths.", size: 3 },
  { name: "Flipper", emoji: "🐬", tagline: "Echo-locating my soulmate", bio: "Always jumping into new adventures. Highly intelligent, loves to play, clicks when happy.", size: 4 },
  { name: "Shelly", emoji: "🐢", tagline: "Worth the wait", bio: "Slow and steady wins the heart. 150 years old but young at shell.", size: 3 },
  { name: "Moby", emoji: "🐋", tagline: "Deep and meaningful", bio: "Big personality, bigger heart. Sings love songs that travel across oceans.", size: 5 },
  { name: "Jaws", emoji: "🦈", tagline: "I don't bite (much)", bio: "Looks scary, actually a softie. Top of the food chain but bottom when it comes to cuddles.", size: 5 },
  { name: "Horus", emoji: "🦑", tagline: "Ride or dive", bio: "Mythical vibes, very loyal. Pairs for life. Carries the relationship on his back.", size: 3 },
  { name: "Squish", emoji: "🪼", tagline: "Just drifting through", bio: "Go-with-the-flow type. Bioluminescent personality — literally glows at parties.", size: 3 },
  { name: "Marina", emoji: "🧜‍♀️", tagline: "Surface level isn't my thing", bio: "Half human, all heart. Sings songs that sailors can't resist. Collects shipwreck treasures.", size: 5 },
];

// ─── Main Page ──────────────────────────────────────────────────────

type Phase = "idle" | "casting" | "waiting" | "biting" | "revealed";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const oceanRef = useRef<OceanAPI | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [caught, setCaught] = useState<ProfileData | null>(null);
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState<ProfileData[]>([]);
  const [rejects, setRejects] = useState(0);
  const phaseRef = useRef<Phase>("idle");
  phaseRef.current = phase;

  const onBite = useCallback(() => {
    setPhase("biting");
  }, []);

  const onCatch = useCallback(() => {
    const match = MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)];
    setCaught(match);
    setPhase("revealed");
  }, []);

  // Wire up the ocean engine — assign API to ref so handleCast can call it
  oceanRef.current = useOcean(canvasRef, { onBite, onCatch });

  const handleCast = () => {
    if (phaseRef.current !== "idle" || !oceanRef.current) return;
    setPhase("casting");

    const w = window.innerWidth;
    const h = window.innerHeight;
    const targetX = w * 0.25 + Math.random() * w * 0.5;
    const targetY = h * 0.38 + Math.random() * h * 0.15;

    oceanRef.current.cast(targetX, targetY);

    // Wait for cast to land then start waiting
    setTimeout(() => setPhase("waiting"), 1000);

    // Random bite window
    const biteDelay = 2500 + Math.random() * 3500;
    setTimeout(() => {
      oceanRef.current?.bite();
    }, biteDelay);
  };

  const handleKeep = () => {
    if (caught) {
      setScore((s) => s + caught.size);
      setCatches((prev) => [...prev, caught]);
    }
    setCaught(null);
    setPhase("idle");
    oceanRef.current?.reset();
  };

  const handleRelease = () => {
    setRejects((r) => r + 1);
    setCaught(null);
    setPhase("idle");
    oceanRef.current?.reset();
  };

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-blue-950">
      {/* ── Canvas Layer ── */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* ── Fishing Rod HUD (overlay) ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[22%] pointer-events-none">
        {/* Deck planks */}
        <div className="absolute inset-0 bg-gradient-to-b from-amber-800/80 via-amber-900/90 to-amber-950">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-600/60" />
          <div className="absolute top-[20%] left-0 right-0 h-px bg-amber-700/30" />
          <div className="absolute top-[40%] left-0 right-0 h-px bg-amber-700/30" />
          <div className="absolute top-[60%] left-0 right-0 h-px bg-amber-700/30" />
          <div className="absolute top-[80%] left-0 right-0 h-px bg-amber-700/30" />
        </div>

        {/* Rod + Hands */}
        <div className="absolute left-[28%] bottom-[30%]">
          {/* Rod handle */}
          <div
            className="absolute bottom-2 left-4 w-56 h-2 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-500 rounded-full origin-bottom-left transition-transform duration-500"
            style={{ transform: `rotate(${phase === "casting" ? "-35" : "-15"}deg)` }}
          />
          {/* Rod tip eyelet glow */}
          {(phase === "casting" || phase === "waiting" || phase === "biting") && (
            <div className="absolute -top-2 left-52 w-2 h-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50 animate-pulse" />
          )}
          {/* Left hand */}
          <div className="absolute bottom-0 left-6 w-3 h-14 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full origin-bottom -rotate-6" />
          {/* Right hand */}
          <div className="absolute bottom-0 left-16 w-3 h-14 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full origin-bottom rotate-3" />
        </div>

        {/* Deck label */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-amber-500/40 text-xs font-mono tracking-[0.3em] uppercase">
            S.S. Hook It Up
          </p>
        </div>
      </div>

      {/* ── Status Text ── */}
      <div className="absolute top-[42%] left-0 right-0 text-center z-10 pointer-events-none">
        {phase === "waiting" && (
          <p className="text-cyan-300/50 text-lg animate-pulse tracking-wide drop-shadow-lg">
            Waiting for a bite...
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
        <div className="absolute bottom-[24%] left-0 right-0 flex justify-center z-20">
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
        {catches.length > 0 && (
          <div className="bg-deep-sea/70 backdrop-blur-md border border-cyan-800/50 rounded-2xl px-4 py-2 text-xs text-cyan-300/60 shadow-lg">
            {catches.length} caught • {rejects} released
          </div>
        )}
      </div>
    </main>
  );
}
