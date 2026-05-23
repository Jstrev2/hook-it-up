import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hook It Up 🎣",
  description: "The only dating app where you reel in the one",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-gradient-to-b from-blue-950 via-cyan-950 to-teal-950">
        {/* Animated fishies in the background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
          <span className="absolute top-[10%] animate-floatLeft text-4xl">🐟</span>
          <span className="absolute top-[25%] animate-floatRight text-3xl">🐠</span>
          <span className="absolute top-[40%] animate-floatLeft text-5xl">🐡</span>
          <span className="absolute top-[55%] animate-floatRight text-2xl">🐟</span>
          <span className="absolute top-[70%] animate-floatLeft text-4xl">🐠</span>
          <span className="absolute top-[85%] animate-floatRight text-3xl">🦈</span>
          <span className="absolute top-[15%] animate-floatLeft text-xl">🐙</span>
          <span className="absolute top-[60%] animate-floatLeft text-3xl">🐟</span>
        </div>
        {children}
      </body>
    </html>
  );
}
