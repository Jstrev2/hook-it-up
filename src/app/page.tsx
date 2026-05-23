export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
      {/* Hero */}
      <div className="text-center max-w-2xl">
        {/* Logo */}
        <div className="mb-8 animate-bob">
          <span className="text-8xl">🎣</span>
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-4">
          Hook<span className="text-coral"> It </span>Up
        </h1>

        <p className="text-xl md:text-2xl text-cyan-200/80 mb-2">
          Cast your line. Reel in the one. 🐠
        </p>
        <p className="text-sm text-cyan-300/50 mb-12">
          No catfish allowed. We check.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="hook-card px-10 py-4 text-lg font-semibold text-white bg-gradient-to-r from-coral to-orange-500 rounded-full hover:scale-105 transition-transform shadow-lg shadow-coral/30 flex items-center justify-center gap-2">
            🎣 Cast Your Line
          </button>
          <button className="hook-card px-10 py-4 text-lg font-semibold text-cyan-200 border border-cyan-500/50 rounded-full hover:bg-cyan-900/40 transition-colors flex items-center justify-center gap-2">
            🐟 Browse the Sea
          </button>
        </div>

        {/* Trust Badges */}
        <div className="mt-16 flex flex-wrap gap-6 justify-center text-cyan-300/60 text-sm">
          <span className="flex items-center gap-1">🐠 Real Fish Only</span>
          <span>·</span>
          <span className="flex items-center gap-1">🪝 Quality Hooks</span>
          <span>·</span>
          <span className="flex items-center gap-1">🌊 Deep Connections</span>
        </div>
      </div>

      {/* Bottom Fishing Rod */}
      <div className="fixed bottom-0 left-1/4 text-6xl opacity-30 animate-bob hidden md:block">
        🎣
      </div>
      <div className="fixed bottom-10 right-1/4 text-6xl opacity-20 animate-bob hidden md:block">
        🎣
      </div>
    </main>
  );
}
