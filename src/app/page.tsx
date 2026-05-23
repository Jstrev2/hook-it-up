"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Match Fish Types ──────────────────────────────────────────────

interface MatchFish {
  id: string;
  name: string;
  emoji: string;
  bio: string;
  size: number;
  speed: number;
  depth: number;
}

const FISH_POOL: MatchFish[] = [
  { id: "clownfish", name: "Nemo", emoji: "🐠", bio: "Just keep swimming... into your DMs", size: 1, speed: 18, depth: 0.15 },
  { id: "goldfish", name: "Goldie", emoji: "🐟", bio: "Short attention span but big heart", size: 1, speed: 20, depth: 0.25 },
  { id: "angelfish", name: "Angel", emoji: "🐠", bio: "Heavenly vibes, loves long swims", size: 2, speed: 14, depth: 0.35 },
  { id: "blowfish", name: "Puffy", emoji: "🐡", bio: "I puff up when I'm nervous (it's cute)", size: 2, speed: 16, depth: 0.4 },
  { id: "tropical", name: "Rio", emoji: "🐠", bio: "Carnival energy 24/7", size: 2, speed: 15, depth: 0.2 },
  { id: "squid", name: "Inky", emoji: "🦑", bio: "Deep thinker, deeper waters", size: 3, speed: 12, depth: 0.55 },
  { id: "dolphin", name: "Flipper", emoji: "🐬", bio: "Always jumping into new adventures", size: 4, speed: 10, depth: 0.65 },
  { id: "turtle", name: "Shelly", emoji: "🐢", bio: "Slow and steady wins the heart", size: 3, speed: 22, depth: 0.7 },
  { id: "whale", name: "Moby", emoji: "🐋", bio: "Big personality, bigger heart", size: 5, speed: 25, depth: 0.8 },
  { id: "shark", name: "Jaws", emoji: "🦈", bio: "Looks scary, actually a softie", size: 5, speed: 8, depth: 0.5 },
  { id: "seahorse", name: "Horus", emoji: "🦑", bio: "Mythical vibes, very loyal", size: 2, speed: 17, depth: 0.3 },
  { id: "jellyfish", name: "Squish", emoji: "🪼", bio: "Go with the flow type", size: 3, speed: 19, depth: 0.6 },
];

// ─── Spawned Fish State ─────────────────────────────────────────────

interface SpawnedFish {
  fish: MatchFish;
  instanceId: string;
  startTime: number;
  direction: "left" | "right";
  y: number;
}

// ─── SVG Boat ────────────────────────────────────────────────────────

function BoatSVG({ rodAngle }: { rodAngle: number }) {
  const rodTipX = 140 + Math.cos((rodAngle * Math.PI) / 180) * 100;
  const rodTipY = 20 + Math.sin((rodAngle * Math.PI) / 180) * 100;

  return (
    <svg
      viewBox="0 0 300 160"
      className="w-full max-w-[300px] h-auto mx-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Water surface behind boat */}
      <ellipse cx="150" cy="125" rx="130" ry="8" fill="rgba(34,211,238,0.15)" />

      {/* Boat hull */}
      <path
        d="M40 115 Q50 145 150 145 Q250 145 260 115 Z"
        fill="#8B6914"
        stroke="#6B4F12"
        strokeWidth="2"
      />
      {/* Hull plank lines */}
      <path d="M50 125 Q150 138 250 125" fill="none" stroke="#6B4F12" strokeWidth="1" opacity="0.5" />
      <path d="M45 135 Q150 148 255 135" fill="none" stroke="#6B4F12" strokeWidth="1" opacity="0.5" />

      {/* Boat rim */}
      <path
        d="M40 115 Q55 105 150 105 Q245 105 260 115"
        fill="#A0782C"
        stroke="#6B4F12"
        strokeWidth="2"
      />

      {/* Fisher body */}
      <circle cx="120" cy="85" r="10" fill="#F5C6A0" />
      {/* Fisher hat */}
      <ellipse cx="120" cy="72" rx="14" ry="5" fill="#5C4033" />
      <rect x="114" y="72" width="12" height="6" rx="2" fill="#5C4033" />
      {/* Fisher body */}
      <rect x="113" y="95" width="14" height="18" rx="3" fill="#3B7DD8" />
      {/* Fisher arms */}
      <line x1="113" y1="100" x2="105" y2="110" stroke="#F5C6A0" strokeWidth="3" strokeLinecap="round" />
      <line x1="127" y1="100" x2="135" y2="105" stroke="#F5C6A0" strokeWidth="3" strokeLinecap="round" />

      {/* Fishing rod */}
      <line
        x1="105"
        y1="110"
        x2={rodTipX}
        y2={rodTipY}
        stroke="#8B6914"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Rod handle */}
      <line x1="100" y1="113" x2="105" y2="110" stroke="#5C4033" strokeWidth="4" strokeLinecap="round" />

      {/* Line from rod tip into water */}
      {rodAngle > 15 && (
        <line
          x1={rodTipX}
          y1={rodTipY}
          x2={rodTipX + 15}
          y2={rodTipY + 120}
          stroke="rgba(34,211,238,0.5)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}

// ─── Fish Card ────────────────────────────────────────────────

function FishCard({ fish, glow, onClick }: { fish: MatchFish; glow?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 bg-deep-sea/80 backdrop-blur-sm border rounded-2xl px-4 py-3 hover:scale-105 transition-all cursor-pointer min-w-[200px] ${
        glow
          ? "border-coral/60 shadow-lg shadow-coral/20 animate-pulse"
          : "border-cyan-800/40 hover:border-cyan-500/60"
      }`}
    >
      <span className="text-3xl">{fish.emoji}</span>
      <div className="text-left min-w-0">
        <p className="font-semibold text-white text-sm truncate">
          {fish.name}
          {Array.from({ length: fish.size }).map((_, i) => (
            <span key={i} className="text-yellow-400 ml-0.5 text-[10px]">⭐</span>
          ))}
        </p>
        <p className="text-xs text-cyan-300/60 truncate">{fish.bio}</p>
      </div>
    </button>
  );
}

// ─── Main Page ───────────────────────────────────────────

export default function Home() {
  const [lineState, setLineState] = useState<"idle" | "casting" | "reeling">("idle");
  const [rodAngle, setRodAngle] = useState(12);
  const [fishes, setFishes] = useState<SpawnedFish[]>([]);
  const [caughtFish, setCaughtFish] = useState<MatchFish | null>(null);
  const [score, setScore] = useState(0);
  const [glowingFishId, setGlowingFishId] = useState<string | null>(null);

  const spawnFish = useCallback(() => {
    const fish = FISH_POOL[Math.floor(Math.random() * FISH_POOL.length)];
    const direction = Math.random() > 0.5 ? "left" : "right";
    const y = fish.depth * 70 + 10;
    const instanceId = `${fish.id}-${Date.now()}-${Math.random()}`;
    setFishes((prev) => [...prev, { fish, instanceId, startTime: Date.now(), direction, y }]);
    setTimeout(() => {
      setFishes((prev) => prev.filter((f) => f.instanceId !== instanceId));
    }, fish.speed * 1000 + 2000);
  }, []);

  useEffect(() => {
    const interval = setInterval(spawnFish, 3000);
    spawnFish();
    return () => clearInterval(interval);
  }, [spawnFish]);

  const handleCast = () => {
    if (lineState !== "idle") return;
    setLineState("casting");
    setCaughtFish(null);
    setRodAngle(55);

    setTimeout(() => {
      const hookDepth = 0.3 + Math.random() * 0.4;
      const nearby = fishes.find((f) => Math.abs(f.fish.depth - hookDepth) < 0.12);

      if (nearby && Math.random() > 0.2) {
        setGlowingFishId(nearby.instanceId);
        setCaughtFish(nearby.fish);

        setTimeout(() => {
          setLineState("reeling");
          setRodAngle(12);
          setScore((s) => s + nearby.fish.size);
          setGlowingFishId(null);
          setFishes((prev) => prev.filter((f) => f.instanceId !== nearby.instanceId));
          setTimeout(() => setLineState("idle"), 800);
        }, 1500);
      } else {
        setCaughtFish(null);
        setTimeout(() => {
          setLineState("reeling");
          setRodAngle(12);
          setTimeout(() => setLineState("idle"), 800);
        }, 1500);
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen flex flex-col relative z-10 overflow-hidden">
      {/* Boat */}
      <div className="pt-2 px-4">
        <BoatSVG rodAngle={rodAngle} />
      </div>

      {/* Fishing zone */}
      <div className="flex-1 relative mx-4 mt-0 mb-4 rounded-3xl border border-cyan-800/30 bg-gradient-to-b from-blue-950/50 via-cyan-950/60 to-teal-950/70 backdrop-blur-sm overflow-hidden min-h-[450px]">
        {/* Depth markers */}
        <div className="absolute top-4 left-4 text-[10px] text-cyan-700/40 font-mono">5m</div>
        <div className="absolute top-24 left-4 text-[10px] text-cyan-700/40 font-mono">20m</div>
        <div className="absolute top-44 left-4 text-[10px] text-cyan-700/40 font-mono">50m</div>
        <div className="absolute bottom-24 left-4 text-[10px] text-cyan-700/40 font-mono">100m</div>
        <div className="absolute bottom-4 left-4 text-[10px] text-cyan-700/40 font-mono">200m 🌊</div>

        {/* Fish swimming */}
        {fishes.map((sf) => {
          const elapsed = (Date.now() - sf.startTime) / 1000;
          const totalTime = sf.fish.speed;
          const progress = Math.min(elapsed / totalTime, 1);
          const xPos = sf.direction === "right" ? progress * 100 : (1 - progress) * 100;

          return (
            <div
              key={sf.instanceId}
              className="absolute"
              style={{
                top: `${sf.y}%`,
                left: `${xPos}%`,
                transform: sf.direction === "left" ? "scaleX(-1)" : undefined,
              }}
            >
              <FishCard fish={sf.fish} glow={glowingFishId === sf.instanceId} onClick={() => {}} />
            </div>
          );
        })}

        {fishes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-cyan-500/30 text-lg animate-pulse">
              🐟 Fish incoming... 🐠
            </p>
          </div>
        )}
      </div>

      {/* Cast Button */}
      <div className="px-4 pb-6 flex flex-col items-center gap-2">
        {caughtFish ? (
          <div className="text-center animate-bob mb-2">
            <p className="text-2xl">{caughtFish.emoji}</p>
            <p className="text-lg font-bold text-coral">You caught {caughtFish.name}!</p>
            <p className="text-sm text-cyan-300/60">{caughtFish.bio}</p>
            <p className="text-xs text-yellow-400 mt-1">
              +{caughtFish.size} {caughtFish.size === 1 ? "point" : "points"}
            </p>
          </div>
        ) : lineState === "reeling" ? (
          <p className="text-cyan-400/50 animate-pulse">Reeling in...</p>
        ) : lineState === "casting" ? (
          <p className="text-cyan-400/50 animate-pulse">Line&apos;s in the water...</p>
        ) : null}

        <button
          onClick={handleCast}
          disabled={lineState !== "idle"}
          className="hook-card px-12 py-5 text-xl font-bold text-white bg-gradient-to-r from-coral to-orange-500 rounded-full hover:scale-105 transition-all shadow-lg shadow-coral/30 flex items-center gap-3 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          <span className="text-2xl">🎣</span>
          Cast Your Line
          <span className="text-2xl">🎣</span>
        </button>
      </div>

      {/* Score */}
      {score > 0 && (
        <div className="fixed top-4 right-4 hook-card px-4 py-2 flex items-center gap-2 text-sm z-30">
          <span>🐟</span>
          <span className="font-bold text-coral">{score}</span>
          <span className="text-cyan-300/60">points</span>
        </div>
      )}
    </main>
  );
}
