"use client";

import { MapPin, MousePointer2, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { CITIES_BY_CODE } from "@/data/cities";

export interface MapCommandHudProps {
  origin: string | null;
  dest: string | null;
  /**
   * When true, collapse to a tiny pill so the player can still glance the
   * legend but it doesn't compete with an open side panel.
   */
  compact?: boolean;
}

/**
 * Bottom-right "command HUD" that scaffolds the route-launch flow as
 * a numbered checklist + a quick reference for keyboard / mouse
 * shortcuts on the map.
 *
 * Why this exists: pre-onboarded players were clicking around the
 * map looking for a "create route" button. The launch bar already
 * hints once you've started, but stage 0 (no origin yet) was an
 * empty state with no callout. The HUD makes the discovery path
 * always-visible without crowding the map.
 *
 * Positioning: bottom-right, above any potential bottom chrome.
 * Stays out of the way of NavRail (left), TopBar (top), Panel (right
 * inset when open), and RouteLaunchBar (top-center).
 */
export function MapCommandHud({ origin, dest, compact }: MapCommandHudProps) {
  const o = origin ? CITIES_BY_CODE[origin] : null;
  const d = dest ? CITIES_BY_CODE[dest] : null;

  // Step status — used to highlight the active step.
  const stage: 1 | 2 | 3 = !o ? 1 : !d ? 2 : 3;

  if (compact) {
    return (
      <div
        className={cn(
          "pointer-events-none fixed bottom-4 right-4 z-[1090]",
          "rounded-md border border-line bg-surface/90 backdrop-blur-md",
          "px-2.5 py-1.5 shadow-[var(--shadow-2)]",
        )}
      >
        <div className="flex items-center gap-1.5 text-[0.6875rem] text-ink-muted">
          <MousePointer2 size={10} />
          <span>Step {stage}/3</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed bottom-4 right-4 z-[1090]",
        "w-[16.5rem] rounded-lg border border-line bg-surface/95 backdrop-blur-md",
        "shadow-[var(--shadow-3)]",
      )}
    >
      <div className="px-3 py-2 border-b border-line/60 flex items-center gap-1.5">
        <MousePointer2 size={11} className="text-ink-muted" />
        <span className="text-[0.6875rem] uppercase tracking-wider text-ink-muted">
          Map controls
        </span>
      </div>

      <ol className="px-3 py-2 space-y-1.5">
        <Step
          n={1}
          active={stage === 1}
          done={stage > 1}
          label="Click any city to set origin"
          detail={o ? `${o.code} · ${o.name}` : null}
        />
        <Step
          n={2}
          active={stage === 2}
          done={stage > 2}
          label={
            stage >= 2
              ? "Click another city for destination"
              : "Then pick a destination"
          }
          detail={d ? `${d.code} · ${d.name}` : null}
        />
        <Step
          n={3}
          active={stage === 3}
          done={false}
          label={
            stage === 3
              ? "Pick mode + Launch in the bar above"
              : "Toggle pax/cargo, then launch"
          }
        />
      </ol>

      <div className="px-3 py-2 border-t border-line/60">
        <div className="flex items-start gap-1.5 text-[0.6875rem] text-ink-muted leading-snug">
          <Info size={10} className="mt-0.5 shrink-0" />
          <div>
            <span className="text-ink-2">Double-click</span> a city for
            airport details · <span className="text-ink-2">Click ocean</span>
            {" "}to clear selection
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  active,
  done,
  label,
  detail,
}: {
  n: number;
  active: boolean;
  done: boolean;
  label: string;
  detail?: string | null;
}) {
  return (
    <li className="flex items-start gap-2">
      <div
        className={cn(
          "shrink-0 w-4 h-4 rounded-full text-[0.625rem] font-semibold tabular flex items-center justify-center mt-0.5",
          done
            ? "bg-positive/20 text-positive"
            : active
            ? "bg-primary text-primary-fg"
            : "bg-surface-2 text-ink-muted",
        )}
      >
        {done ? "✓" : n}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            "text-[0.75rem] leading-tight",
            active ? "text-ink font-medium" : done ? "text-ink-2" : "text-ink-muted",
          )}
        >
          {label}
        </div>
        {detail && (
          <div className="text-[0.6875rem] text-ink-muted leading-tight mt-0.5 flex items-center gap-1 truncate">
            <MapPin size={9} className="shrink-0" />
            <span className="truncate">{detail}</span>
          </div>
        )}
      </div>
    </li>
  );
}
