"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Match Types ────────────────────────────────────────────────────

interface Match {
  id: string;
  name: string;
  emoji: string;
  bio: string;
  size: number; // 1-5 rarity
  tagline: string;
}

const MATCH_POOL: Match[] = [
  { id: "clownfish", name: "Nemo", emoji: "🐠", bio: "Adventurous, loyal, loves exploring new reefs. Looking for someone to share anemones with.", size: 1, tagline: "Just keep swimming" },
  { id: "goldfish", name: "Goldie", emoji: "🐟", bio: "Short attention span but a huge heart. Forgets arguments in 3 seconds flat.", size: 1, tagline: "Wait, what were we talking about?" },
  { id: "angelfish", name: "Angel", emoji: "🐠", bio: "Heavenly vibes. Loves sunrise swims, coral gardens, and deep conversations under the moonlight.", size: 2, tagline: "Too good for this ocean" },
  { id: "blowfish", name: "Puffy", emoji: "🐡", bio: "I puff up when I'm nervous (it's cute, I promise). Soft interior, spiky exterior.", size: 2, tagline: "Don't poke me" },
  { id: "tropical", name: "Rio", emoji: "🐠", bio: "Carnival energy 24/7. If you can't handle the bubbles, stay out of the reef.", size: 2, tagline: "Party in the kelp forest" },
  { id: "squid", name: "Inky", emoji: "🦑", bio: "Deep thinker, deeper waters. Writes poetry in ink. Prefers dark, quiet depths.", size: 3, tagline: "Mysterious and ink-redible" },
  { id: "dolphin", name: "Flipper", emoji: "🐬", bio: "Always jumping into new adventures. Highly intelligent, loves to play, clicks when happy.", size: 4, tagline: "Echo-locating my soulmate" },
  { id: "turtle", name: "Shelly", emoji: "🐢", bio: "Slow and steady wins the heart. 150 years old but young at shell.", size: 3, tagline: "Worth the wait" },
  { id: "whale", name: "Moby", emoji: "🐋", bio: "Big personality, bigger heart. Sings love songs that travel across oceans.", size: 5, tagline: "Deep and meaningful" },
  { id: "shark", name: "Jaws", emoji: "🦈", bio: "Looks scary, actually a softie. Top of the food chain but bottom when it comes to cuddles.", size: 5, tagline: "I don't bite (much)" },
  { id: "seahorse", name: "Horus", emoji: "🦑", bio: "Mythical vibes, very loyal. Pairs for life. Carries the relationship on his back.", size: 3, tagline: "Ride or dive" },
  { id: "jellyfish", name: "Squish", emoji: "🪼", bio: "Go-with-the-flow type. Bioluminescent personality — literally glows at parties.", size: 3, tagline: "Just drifting through" },
  { id: "mermaid", name: "Marina", emoji: "🧜‍♀️", bio: "Half human, all heart. Sings songs that sailors can't resist. Collects shipwreck treasures.", size: 5, tagline: "Surface level isn't my thing" },
];

// ─── Main Page ───────────────────────────────────────────────────────

type Phase = "idle" | "casting" | "waiting" | "biting" | "revealed";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [caught, setCaught] = useState<Match | null>(null);
  const [bobberX, setBobberX] = useState(50);
  const [bobberY, setBobberY] = useState(40);
  const [score, setScore] = useState(0);
  const [catches, setCatches] = useState<Match[]>([]);
  const [rejectCount, setRejectCount] = useState(0);

  const handleCast = () => {
    if (phase !== "idle") return;
    setPhase("casting");

    // Random landing spot
    const targetX = 25 + Math.random() * 50;
    const targetY = 20 + Math.random() * 40;

    // Animate bobber out
    let steps = 0;
    const totalSteps = 20;
    const startX = 50;
    const startY = 40;
    const interval = setInterval(() => {
      steps++;
      const t = steps / totalSteps;
      const ease = 1 - Math.pow(1 - t, 3); // ease out
      setBobberX(startX + (targetX - startX) * ease);
      setBobberY(startY + (targetY - startY) * ease);
      if (steps >= totalSteps) {
        clearInterval(interval);
        setPhase("waiting");

        // Random wait 2-5 seconds then bite
        const waitTime = 2000 + Math.random() * 3000;
        setTimeout(() => {
          setPhase("biting");

          // Pick a random catch
          setTimeout(() => {
            const match = MATCH_POOL[Math.floor(Math.random() * MATCH_POOL.length)];
            setCaught(match);
            setPhase("revealed");
            setScore((s) => s + match.size);
            setCatches((prev) => [...prev, match]);
          }, 1200);
        }, waitTime);
      }
    }, 30);
  };

  const handleRelease = () => {
    setCaught(null);
    setPhase("idle");
    setBobberX(50);
    setBobberY(40);
    setRejectCount((r) => r + 1);
  };

  const handleKeep = () => {
    setCaught(null);
    setPhase("idle");
    setBobberX(50);
    setBobberY(40);
  };

  return (
    <main className="h-screen w-screen overflow-hidden relative bg-gradient-to-b from-blue-950 via-cyan-950 to-teal-950">
      {/* ─── OCEAN SCENE ──────────────────────────────────── */}

      {/* Sky gradient top */}
      <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-indigo-900/40 to-transparent" />

      {/* Stars */}
      <div className="absolute top-0 left-0 right-0 h-[20%] opacity-30">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div className="absolute top-[8%] left-[20%] w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 opacity-60 shadow-lg shadow-amber-100/20" />

      {/* Ocean waves — layered */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%]">
        {/* Far waves */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-cyan-600/40 to-transparent animate-[wave_8s_ease-in-out_infinite]" />
        <div className="absolute top-[4%] left-0 right-0 h-2 bg-gradient-to-b from-cyan-500/30 to-transparent animate-[wave_6s_ease-in-out_infinite_1s]" />
        {/* Mid waves */}
        <div className="absolute top-[15%] left-0 right-0 h-4 bg-gradient-to-b from-cyan-600/50 to-transparent animate-[wave_7s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[22%] left-0 right-0 h-3 bg-gradient-to-b from-blue-500/30 to-transparent animate-[wave_9s_ease-in-out_infinite_2s]" />
        {/* Near waves */}
        <div className="absolute top-[35%] left-0 right-0 h-5 bg-gradient-to-b from-cyan-500/60 to-blue-800/30 animate-[wave_5s_ease-in-out_infinite]" />
        <div className="absolute top-[50%] left-0 right-0 h-4 bg-gradient-to-b from-cyan-400/40 to-blue-900/40 animate-[wave_6s_ease-in-out_infinite_3s]" />
      </div>

      {/* ─── BOAT DECK (first person) ──────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-b from-amber-800/80 via-amber-900/90 to-amber-950">
        {/* Deck planks */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-600/60" />
        <div className="absolute top-[20%] left-0 right-0 h-px bg-amber-700/30" />
        <div className="absolute top-[40%] left-0 right-0 h-px bg-amber-700/30" />
        <div className="absolute top-[60%] left-0 right-0 h-px bg-amber-700/30" />
        <div className="absolute top-[80%] left-0 right-0 h-px bg-amber-700/30" />

        {/* Hands/arms holding rod — first person */}
        <div className="absolute left-[30%] top-[10%] w-32">
          {/* Left arm */}
          <div className="absolute bottom-0 left-0 w-3 h-16 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full origin-bottom -rotate-12" />
          {/* Rod */}
          <div className="absolute bottom-4 left-8 w-64 h-1.5 bg-gradient-to-r from-amber-900 via-amber-700 to-amber-500 rounded-full origin-left transition-transform duration-500"
            style={{ transform: `rotate(${phase === "idle" ? "-15" : phase === "casting" ? "-35" : "-20"}deg)` }}
          />
          {/* Right arm */}
          <div className="absolute bottom-0 left-14 w-3 h-16 bg-gradient-to-b from-amber-700 to-amber-800 rounded-full origin-bottom rotate-6" />
        </div>

        {/* Rod tip eyelet glow */}
        {phase !== "idle" && (
          <div
            className="absolute w-2 h-2 rounded-full bg-cyan-300 shadow-lg shadow-cyan-400/50 transition-all duration-1000"
            style={{ left: `${bobberX}%`, top: `${15 + (100 - bobberY) * 0.1}%` }}
          />
        )}

        {/* Deck label */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <p className="text-amber-500/40 text-xs font-mono tracking-[0.3em] uppercase">
            S.S. Hook It Up
          </p>
        </div>
      </div>

      {/* ─── FISHING LINE (when cast) ─────────────────────── */}
      {phase !== "idle" && (
        <svg className="absolute inset-0 pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            x1="35"
            y1="78"
            x2={bobberX}
            y2={bobberY}
            stroke="rgba(165,243,252,0.5)"
            strokeWidth="0.15"
            strokeDasharray={phase === "casting" ? "1 0.5" : phase === "biting" ? "1 0.3" : "1 1"}
          />
        </svg>
      )}

      {/* ─── BOBBER ──────────────────────────────────────── */}
      {phase !== "idle" && (
        <div
          className="absolute z-30 transition-all duration-100"
          style={{
            left: `${bobberX}%`,
            top: `${bobberY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className={`flex flex-col items-center ${phase === "biting" ? "animate-[bobFast_0.3s_ease-in-out_infinite]" : "animate-[bobSlow_2s_ease-in-out_infinite]"}`}>
            {/* Bobber top */}
            <div className="w-4 h-3 rounded-t-full bg-red-500 shadow-md" />
            <div className="w-4 h-3 bg-white border-x border-cyan-300" />
            <div className="w-4 h-3 rounded-b-full bg-red-500 shadow-md" />
            {/* Ripples */}
            {phase === "waiting" && (
              <div className="absolute -inset-4">
                <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
              </div>
            )}
            {phase === "biting" && (
              <div className="absolute -inset-6">
                <div className="absolute inset-0 rounded-full border-2 border-coral/40 animate-ping" />
                <div className="absolute inset-0 rounded-full border border-coral/60 animate-ping [animation-delay:0.3s]" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── STATUS TEXT ─────────────────────────────────── */}
      <div className="absolute top-[45%] left-0 right-0 text-center z-10 pointer-events-none">
        {phase === "waiting" && (
          <p className="text-cyan-300/50 text-lg animate-pulse tracking-wide">
            Waiting for a bite...
          </p>
        )}
        {phase === "biting" && (
          <p className="text-coral font-bold text-2xl animate-bob tracking-wide">
            🎣 Something's on the line!
          </p>
        )}
      </div>

      {/* ─── PROFILE CARD REVEAL ──────────────────────────── */}
      {phase === "revealed" && caught && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-b from-blue-950/90 via-cyan-950/95 to-teal-950/95 backdrop-blur-sm animate-[slideUp_0.5s_ease-out]">
          <div className="w-full max-w-md bg-gradient-to-b from-blue-900/80 to-cyan-950/90 backdrop-blur-xl border border-cyan-700/40 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-900/50">
            {/* Fish emoji hero */}
            <div className="pt-10 pb-6 flex flex-col items-center bg-gradient-to-b from-coral/10 to-transparent">
              <div className="text-7xl animate-bob mb-4 drop-shadow-lg">{caught.emoji}</div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {caught.name}
              </h2>
              <p className="text-cyan-300/60 text-sm mt-1 italic">{caught.tagline}</p>
              {/* Stars */}
              <div className="flex gap-1 mt-3">
                {Array.from({ length: caught.size }).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">⭐</span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div className="px-8 py-6">
              <p className="text-cyan-200/80 text-center leading-relaxed">{caught.bio}</p>
            </div>

            {/* Actions */}
            <div className="px-8 pb-8 flex gap-4">
              <button
                onClick={handleRelease}
                className="flex-1 py-4 rounded-2xl border border-red-500/40 text-red-300 font-semibold hover:bg-red-500/10 transition-all active:scale-95 text-lg"
              >
                🎣 Release
              </button>
              <button
                onClick={handleKeep}
                className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-coral to-orange-500 text-white font-bold hover:scale-105 transition-all active:scale-95 shadow-lg shadow-coral/30 text-lg"
              >
                ❤️ Keep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CAST BUTTON ─────────────────────────────────── */}
      {phase === "idle" && (
        <div className="absolute bottom-[25%] left-0 right-0 flex justify-center z-30">
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

      {/* ─── CATCH COUNT ─────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-40 flex flex-col gap-2">
        <div className="hook-card px-4 py-2 flex items-center gap-2 text-sm">
          <span>🐟</span>
          <span className="font-bold text-coral">{score}</span>
          <span className="text-cyan-300/60">points</span>
        </div>
        {catches.length > 0 && (
          <div className="hook-card px-4 py-2 text-xs text-cyan-300/60">
            {catches.length} caught • {rejectCount} released
          </div>
        )}
      </div>
    </main>
  );
}
