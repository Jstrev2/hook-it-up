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
      <body className="bg-blue-950 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
