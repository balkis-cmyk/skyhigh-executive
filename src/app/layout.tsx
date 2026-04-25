import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkyForce — Airline Strategy Simulation",
  description:
    "40-round airline strategy simulation across 2015–2024. Build an airline, survive crises, outmaneuver rivals.",
};

// Explicit viewport so the marketing landing page renders correctly on
// mobile and tablet, and so a desktop-first chrome doesn't push past
// the safe area on phones with notches. Game canvas itself is
// optimized for desktop (1024+) but the landing + onboarding flows
// should still be usable from a phone for sharing/preview.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#143559",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full flex flex-col bg-bg text-ink antialiased overflow-hidden">
        {children}
      </body>
    </html>
  );
}
