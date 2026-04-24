"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { QuarterCloseModal } from "@/components/game/QuarterCloseModal";
import { useGame } from "@/store/game";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const phase = useGame((s) => s.phase);
  const playerTeamId = useGame((s) => s.playerTeamId);

  // Wait for Zustand persist rehydration before deciding to redirect
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (phase === "idle" || !playerTeamId) {
      router.replace("/onboarding");
    } else if (phase === "endgame") {
      router.replace("/endgame");
    }
  }, [hydrated, phase, playerTeamId, router]);

  if (!hydrated || phase === "idle" || !playerTeamId) {
    return (
      <main className="flex-1 flex items-center justify-center text-ink-muted">
        Loading…
      </main>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <div className="flex-1 min-w-0 overflow-auto">{children}</div>
      </div>
      <QuarterCloseModal />
    </div>
  );
}
