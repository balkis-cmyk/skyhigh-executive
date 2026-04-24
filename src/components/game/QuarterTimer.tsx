"use client";

import { useEffect } from "react";
import { useGame } from "@/store/game";
import { cn } from "@/lib/cn";

/**
 * Tick driver (mounts once inside the canvas). Runs a 1-Hz interval that
 * calls tickQuarterTimer when the timer is active and not paused.
 */
export function QuarterTimerDriver() {
  const tick = useGame((s) => s.tickQuarterTimer);
  useEffect(() => {
    const id = setInterval(() => tick(1), 1000);
    return () => clearInterval(id);
  }, [tick]);
  return null;
}

/** Inline countdown display (for placement in TopBar). */
export function QuarterTimerChip() {
  const seconds = useGame((s) => s.quarterTimerSecondsRemaining);
  const paused = useGame((s) => s.quarterTimerPaused);
  const start = useGame((s) => s.startQuarterTimer);
  const pause = useGame((s) => s.pauseQuarterTimer);
  const resume = useGame((s) => s.resumeQuarterTimer);
  const extend = useGame((s) => s.extendQuarterTimer);

  if (seconds === null) {
    return (
      <button
        onClick={() => start(1800)}
        className="text-[0.6875rem] font-medium px-2 py-1 rounded-md border border-line bg-surface-2 text-ink-2 hover:text-ink"
        title="Start 30m quarter timer"
      >
        Start timer
      </button>
    );
  }

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  const expired = seconds === 0;
  const urgent = seconds > 0 && seconds < 300; // < 5m

  return (
    <div className="flex items-center gap-1">
      <span
        className={cn(
          "tabular font-mono text-[0.875rem] font-semibold px-2 py-1 rounded-md",
          expired
            ? "bg-[var(--negative-soft)] text-negative"
            : urgent
              ? "bg-[var(--warning-soft)] text-warning"
              : paused
                ? "bg-surface-2 text-ink-muted"
                : "bg-surface-2 text-ink",
        )}
        title={paused ? "Paused" : expired ? "Timer expired" : "Time remaining this quarter"}
      >
        {mm}:{ss}
      </span>
      <button
        onClick={paused ? resume : pause}
        className="w-6 h-6 rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink text-[0.6875rem]"
        title={paused ? "Resume" : "Pause"}
      >
        {paused ? "▶" : "❚❚"}
      </button>
      <button
        onClick={() => extend(300)}
        className="w-6 h-6 rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink text-[0.625rem] tabular"
        title="Extend 5 minutes"
      >
        +5
      </button>
    </div>
  );
}
