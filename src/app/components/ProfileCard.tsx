"use client";

import { useEffect, useRef, useState } from "react";
import type { ProfileData } from "../data/profiles";

// ─── Spring Physics ─────────────────────────────────────────────────

interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

function useSpring(target: number, config: SpringConfig = { stiffness: 180, damping: 26, mass: 1 }) {
  const [value, setValue] = useState(0);
  const valueRef = useRef(0);
  const velocityRef = useRef(0);
  const frameRef = useRef<number>(0);
  const targetRef = useRef(target);
  targetRef.current = target;
  valueRef.current = value;

  useEffect(() => {
    const animate = () => {
      const current = valueRef.current;
      const force = (targetRef.current - current) * config.stiffness;
      const accel = force / config.mass;
      velocityRef.current = (velocityRef.current + accel * 0.016) * (1 - config.damping * 0.016);
      const next = current + velocityRef.current * 0.016;

      if (Math.abs(next - targetRef.current) < 0.001 && Math.abs(velocityRef.current) < 0.01) {
        setValue(targetRef.current);
        velocityRef.current = 0;
        return;
      }

      setValue(next);
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target]);

  return value;
}

// ─── Profile Card ───────────────────────────────────────────────────

interface ProfileCardProps {
  profile: ProfileData;
  visible: boolean;
  onKeep: () => void;
  onRelease: () => void;
}

export default function ProfileCard({ profile, visible, onKeep, onRelease }: ProfileCardProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const targetProgress = visible ? 1 : 0;
  const progress = useSpring(targetProgress);
  const star0 = useSpring(visible ? 1 : 0, { stiffness: 200, damping: 20, mass: 1 });
  const star1 = useSpring(visible ? 1 : 0, { stiffness: 200, damping: 20, mass: 1 });
  const star2 = useSpring(visible ? 1 : 0, { stiffness: 200, damping: 20, mass: 1 });
  const star3 = useSpring(visible ? 1 : 0, { stiffness: 200, damping: 20, mass: 1 });
  const star4 = useSpring(visible ? 1 : 0, { stiffness: 200, damping: 20, mass: 1 });
  const starSprings = [star0, star1, star2, star3, star4];

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
    } else {
      const t = setTimeout(() => setShouldRender(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!shouldRender) return null;

  const y = (1 - progress) * 120;
  const scale = 0.8 + progress * 0.2;
  const opacity = progress;
  const cardOpacity = Math.min(1, progress * 1.5);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      style={{ opacity }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-blue-950/90 via-cyan-950/95 to-teal-950/95 pointer-events-auto"
        style={{ opacity: Math.min(1, progress * 2), backdropFilter: `blur(${progress * 12}px)` }}
      />

      <div
        className="w-full max-w-md pointer-events-auto"
        style={{
          transform: `translateY(${y}px) scale(${scale})`,
          opacity: cardOpacity,
          transition: "none",
        }}
      >
        <div className="bg-gradient-to-b from-blue-900/80 to-cyan-950/90 backdrop-blur-xl border border-cyan-700/40 rounded-3xl overflow-hidden shadow-2xl shadow-cyan-900/50">
          {/* Hero section */}
          <div
            className="pt-10 pb-6 flex flex-col items-center bg-gradient-to-b from-coral/10 to-transparent"
            style={{
              transform: `scale(${0.5 + progress * 0.5})`,
              opacity: Math.min(1, progress * 2),
            }}
          >
            {/* Initials avatar */}
            <div
              className="mb-4 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-xl"
              style={{
                width: 80,
                height: 80,
                backgroundColor: profile.color,
                transform: `translateY(${(1 - progress) * -60}px)`,
                boxShadow: `0 0 30px ${profile.color}44`,
              }}
            >
              {profile.initials}
            </div>

            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {profile.name}
              <span className="text-cyan-300/60 text-lg font-normal ml-2">{profile.age}</span>
            </h2>
            <p className="text-cyan-300/60 text-sm mt-1 italic">{profile.tagline}</p>

            {/* Stars — staggered */}
            <div className="flex gap-1 mt-3">
              {Array.from({ length: profile.rarity }).map((_, i) => (
                <span
                  key={i}
                  className="text-yellow-400 text-lg"
                  style={{
                    transform: `scale(${starSprings[i]})`,
                    opacity: starSprings[i],
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="px-8 py-6" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.15) * 3)) }}>
            <p className="text-cyan-200/80 text-center leading-relaxed">{profile.bio}</p>
          </div>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-4" style={{ opacity: Math.min(1, Math.max(0, (progress - 0.25) * 3)) }}>
            <button
              onClick={onRelease}
              className="flex-1 py-4 rounded-2xl border border-red-500/40 text-red-300 font-semibold hover:bg-red-500/10 transition-all active:scale-95 text-lg"
            >
              🎣 Release
            </button>
            <button
              onClick={onKeep}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-coral to-orange-500 text-white font-bold hover:scale-105 transition-all active:scale-95 shadow-lg shadow-coral/30 text-lg"
            >
              ❤️ Keep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
