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
  const avatarScale = useSpring(visible ? 1 : 0, { stiffness: 220, damping: 22, mass: 1 });
  const cardY = useSpring(visible ? 1 : 0, { stiffness: 200, damping: 24, mass: 1 });

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

  const translateY = (1 - cardY) * window.innerHeight * 0.15;
  const scale = 0.92 + progress * 0.08;
  const opacity = progress;

  return (
    <div
      className="absolute inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none"
      style={{ opacity }}
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-cyan-950/98 to-teal-950/95 pointer-events-auto"
        style={{
          opacity: Math.min(1, progress * 2),
          backdropFilter: `blur(${progress * 20}px)`,
          WebkitBackdropFilter: `blur(${progress * 20}px)`,
        }}
      />

      {/* Card container — mobile full-width, desktop max-w-md */}
      <div
        className="w-full max-w-md mx-auto pointer-events-auto"
        style={{
          transform: `translateY(${translateY}px) scale(${scale})`,
          opacity: Math.min(1, progress * 1.5),
        }}
      >
        {/* Card body */}
        <div className="mx-4 sm:mx-0 bg-gradient-to-b from-slate-900/90 to-cyan-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Hero section — avatar + name + stats */}
          <div className="relative pt-8 pb-6 flex flex-col items-center bg-gradient-to-b from-white/5 to-transparent">
            {/* Avatar with glow ring */}
            <div className="relative mb-5">
              {/* Outer glow */}
              <div
                className="absolute -inset-2 rounded-full opacity-50 blur-md transition-opacity"
                style={{ backgroundColor: profile.color }}
              />
              {/* Avatar circle */}
              <div
                className="relative w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl"
                style={{
                  backgroundColor: profile.color,
                  transform: `scale(${avatarScale})`,
                }}
              >
                {profile.initials}
              </div>
            </div>

            {/* Name + age */}
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1">
              {profile.name}
              <span className="text-base sm:text-lg font-normal text-white/60 ml-2">{profile.age}</span>
            </h2>

            {/* Tagline */}
            <p className="text-sm text-white/50 italic px-6 text-center leading-relaxed">
              {profile.tagline}
            </p>

            {/* Stars */}
            <div className="flex gap-1 mt-3">
              {Array.from({ length: profile.rarity }).map((_, i) => (
                <span
                  key={i}
                  className="text-base"
                  style={{
                    transform: `scale(${starSprings[i]})`,
                    opacity: starSprings[i],
                    filter: `drop-shadow(0 0 3px rgba(250,204,21,0.5))`,
                  }}
                >
                  ⭐
                </span>
              ))}
            </div>
          </div>

          {/* Bio section */}
          <div className="px-6 pb-6">
            <p
              className="text-white/70 text-sm leading-relaxed text-center"
              style={{ opacity: Math.min(1, Math.max(0, (progress - 0.15) * 3)) }}
            >
              {profile.bio}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/5" />

          {/* Actions — full-width mobile buttons */}
          <div
            className="flex gap-3 p-4"
            style={{ opacity: Math.min(1, Math.max(0, (progress - 0.25) * 3)) }}
          >
            <button
              onClick={onRelease}
              className="flex-1 py-4 rounded-2xl border border-white/10 text-white/60 font-semibold active:scale-95 active:bg-red-500/10 transition-all text-base"
              style={{ minHeight: 52 }}
            >
              🎣 Release
            </button>
            <button
              onClick={onKeep}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-coral to-orange-500 text-white font-bold active:scale-95 shadow-lg shadow-coral/25 transition-all text-base"
              style={{ minHeight: 52 }}
            >
              ❤️ Keep
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
