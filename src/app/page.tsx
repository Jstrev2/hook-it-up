"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Match Fish Types ──────────────────────────────────────────────

interface MatchFish {
  id: string;
  name: string;
  emoji: string;
  bio: string;
  size: number; // 1-5, bigger = rarer
  speed: number; // seconds to cross screen
  depth: number; // vertical position 0-1
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

// ─── Boat ───────────────────────────────────────────────────────────

function Boat({ casting }: { casting: boolean }) {
  return (
    <div className="relative w-full flex justify-center">
      {/* Water surface */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-cyan-300/60 to-transparent" />

      {/* Boat */}
      <div className={`relative transition-transform duration-300 ${casting ? "translate-y-1" : "animate-bob"}`}>
        {/* Fisher */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
          <div className="text-3xl">🧑‍🎣</div>
        </div>

        {/* Rod */}
        <div
          className={`absolute -top-6 left-10 w-24 h-1 origin-bottom-left transition-transform duration-500 ${
            casting ? "rotate-45" : "rotate-12"
          }`}
        >
          <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-700 rounded" />
        </div>

        {/* Boat body */}
        <pre className="text-4xl md:text-5xl leading-none text-amber-100 select-none">
          {"   ⛵"}
        </pre>
        <pre className="text-4xl md:text-5xl leading-none text-amber-200 -mt-1 select-none">
          {"  ⛵⛵"}
        </pre>
        <p className="text-xs text-cyan-300/60 text-center mt-1 font-medium tracking-widest uppercase">
          Your Boat
        </p>
      </div>
    </div>
  );
}

// ─── Fishing Line + Hook ─────────────────────────────────────────────

function FishingLine({
  state,
  lineLength,
}: {
  state: "idle" | "casting" | "reeling";
  lineLength: number;
}) {
  if (state === "idle") return null;

  const reelClass = state === "casting" ? "animate-[reelDown_1.5s_ease-in_forwards]" : "animate-[reelUp_0.8s_ease-out_forwards]";

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      {/* Line */}
      <div className="mx-auto w-0.5 bg-cyan-300/60 rounded" style={{ height: `${lineLength * 0.7}px` }}>
        {/* Hook at bottom */}
        <div className={`absolute -bottom-6 left-1/2 -translate-x-1/2 text-2xl ${reelClass}`}>
          🪝
        </div>
      </div>
    </div>
  );
}

// ─── Match Fish Card ────────────────────────────────────────────────

function FishCard({
  fish,
  onClick,
  glow,
}: {
  fish: MatchFish;
  onClick: () => void;
  glow?: boolean;
}) {
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

// ─── Main Hook It Up Page ───────────────────────────────────────────

export default function Home() {
  const [lineState, setLineState] = useState<"idle" | "casting" | "reeling">("idle");
  const [lineLength, setLineLength] = useState(0);
  const [fishes, setFishes] = useState<SpawnedFish[]>([]);
  const [caughtFish, setCaughtFish] = useState<MatchFish | null>(null);
  const [score, setScore] = useState(0);
  const [glowingFishId, setGlowingFishId] = useState<string | null>(null);

  // Spawn fish periodically
  const spawnFish = useCallback(() => {
    const fish = FISH_POOL[Math.floor(Math.random() * FISH_POOL.length)];
    const direction = Math.random() > 0.5 ? "left" : "right";
    const y = fish.depth * 70 + 10; // 10-80% of zone
    const instanceId = `${fish.id}-${Date.now()}-${Math.random()}`;

    setFishes((prev) => [...prev, { fish, instanceId, startTime: Date.now(), direction, y }]);

    // Cleanup old fish
    setTimeout(() => {
      setFishes((prev) => prev.filter((f) => f.instanceId !== instanceId));
    }, fish.speed * 1000 + 2000);
  }, []);

  useEffect(() => {
    const interval = setInterval(spawnFish, 3000);
    spawnFish(); // spawn first one immediately
    return () => clearInterval(interval);
  }, [spawnFish]);

  // Cast the line
  const handleCast = () => {
    if (lineState !== "idle") return;
    setLineState("casting");
    setCaughtFish(null);

    // Animate line going down
    const maxLength = 400 + Math.random() * 200;
    setLineLength(maxLength);

    // Find fish near the hook after cast completes
    setTimeout(() => {
      // Find a fish roughly in the right depth zone
      const hookDepth = 0.3 + Math.random() * 0.4; // where hook lands
      const nearby = fishes.find((f) => Math.abs(f.fish.depth - hookDepth) < 0.12);

      if (nearby && Math.random() > 0.2) {
        // Caught something!
        setGlowingFishId(nearby.instanceId);
        setCaughtFish(nearby.fish);

        setTimeout(() => {
          setLineState("reeling");
          setLineLength(0);
          setScore((s) => s + nearby.fish.size);
          setGlowingFishId(null);

          // Remove caught fish from pool
          setFishes((prev) => prev.filter((f) => f.instanceId !== nearby.instanceId));

          setTimeout(() => {
            setLineState("idle");
          }, 800);
        }, 1500);
      } else {
        // Didn't catch anything
        setCaughtFish(null);
        setTimeout(() => {
          setLineState("reeling");
          setLineLength(0);
          setTimeout(() => {
            setLineState("idle");
          }, 800);
        }, 1500);
      }
    }, 1500);
  };

  return (
    <main className="min-h-screen flex flex-col relative z-10 overflow-hidden">
      {/* Boat */}
      <div className="pt-6 px-4">
        <Boat casting={lineState !== "idle"} />
      </div>

      {/* Fishing zone */}
      <div className="flex-1 relative mx-4 mt-2 mb-4 rounded-3xl border border-cyan-800/30 bg-gradient-to-b from-blue-950/50 via-cyan-950/60 to-teal-950/70 backdrop-blur-sm overflow-hidden min-h-[500px]">
        {/* Depth markers */}
        <div className="absolute top-8 left-4 text-[10px] text-cyan-700/40 font-mono">5m</div>
        <div className="absolute top-32 left-4 text-[10px] text-cyan-700/40 font-mono">20m</div>
        <div className="absolute top-56 left-4 text-[10px] text-cyan-700/40 font-mono">50m</div>
        <div className="absolute bottom-32 left-4 text-[10px] text-cyan-700/40 font-mono">100m</div>
        <div className="absolute bottom-8 left-4 text-[10px] text-cyan-700/40 font-mono">200m 🌊</div>

        {/* Line + Hook */}
        <FishingLine state={lineState} lineLength={lineLength} />

        {/* Fish swimming */}
        {fishes.map((sf) => {
          const elapsed = (Date.now() - sf.startTime) / 1000;
          const totalTime = sf.fish.speed;
          const progress = Math.min(elapsed / totalTime, 1);
          const xPos = sf.direction === "right" ? progress * 100 : (1 - progress) * 100;

          return (
            <div
              key={sf.instanceId}
              className="absolute transition-transform"
              style={{
                top: `${sf.y}%`,
                left: `${xPos}%`,
                transform: sf.direction === "left" ? "scaleX(-1)" : "",
              }}
            >
              <FishCard
                fish={sf.fish}
                glow={glowingFishId === sf.instanceId}
                onClick={() => {}}
              />
            </div>
          );
        })}

        {/* Empty state */}
        {fishes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-cyan-500/30 text-lg animate-pulse">Fish incoming...</p>
          </div>
        )}
      </div>

      {/* Cast Button */}
      <div className="px-4 pb-6 flex flex-col items-center gap-2">
        {caughtFish ? (
          <div className="text-center animate-bob mb-2">
            <p className="text-2xl">{caughtFish.emoji}</p>
            <p className="text-lg font-bold text-coral">
              You caught {caughtFish.name}!
            </p>
            <p className="text-sm text-cyan-300/60">{caughtFish.bio}</p>
            <p className="text-xs text-yellow-400 mt-1">
              +{caughtFish.size} {caughtFish.size === 1 ? "point" : "points"}
            </p>
          </div>
        ) : lineState === "reeling" ? (
          <p className="text-cyan-400/50 animate-pulse">Reeling in...</p>
        ) : lineState === "casting" ? (
          <p className="text-cyan-400/50 animate-pulse">Line's in the water...</p>
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
