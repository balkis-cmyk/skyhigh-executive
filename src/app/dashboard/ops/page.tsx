"use client";

import { Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { SLIDER_LABELS, SLIDER_PCT_REVENUE, SLIDER_EFFECTS } from "@/lib/engine";
import { useGame, selectPlayer } from "@/store/game";
import { fmtPct } from "@/lib/format";
import type { SliderLevel, Sliders } from "@/types/game";
import { cn } from "@/lib/cn";
import { SCENARIOS_BY_QUARTER } from "@/data/scenarios";
import Link from "next/link";

const SLIDER_LIST: Array<{ key: keyof Sliders; label: string; sub: string }> = [
  { key: "staff", label: "Staff & Training", sub: "Cabin, pilots, ground, training" },
  { key: "marketing", label: "Marketing", sub: "Campaigns, PR, partnerships" },
  { key: "service", label: "In-Flight Service", sub: "Food, gifts, amenities, cabin" },
  { key: "rewards", label: "Rewards Program", sub: "Loyalty tiers, partner redemptions" },
  { key: "operations", label: "Operations", sub: "Maintenance, fleet engineering" },
];

export default function OpsPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const setSliders = useGame((g) => g.setSliders);

  if (!player) return null;

  const pendingDecisions = (SCENARIOS_BY_QUARTER[s.currentQuarter] ?? []).filter(
    (sc) => !player.decisions.some((d) => d.scenarioId === sc.id && d.quarter === s.currentQuarter),
  );

  function commit() {
    if (pendingDecisions.length > 0) {
      if (!confirm(`${pendingDecisions.length} board decision${pendingDecisions.length > 1 ? "s" : ""} still open. Close the quarter anyway?`)) return;
    }
    s.closeQuarter();
  }

  return (
    <main className="p-6 max-w-5xl mx-auto w-full">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.75rem] text-ink leading-tight">Quarterly ops</h1>
          <p className="text-ink-2 text-[0.875rem] mt-1">
            Set spend levels for Q{s.currentQuarter}. Effects compound every 3 and 6 quarters at the same level.
          </p>
        </div>
        <Button variant="primary" onClick={commit}>
          Close quarter →
        </Button>
      </header>

      <div className="space-y-4">
        {SLIDER_LIST.map(({ key, label, sub }) => {
          const level = player.sliders[key];
          const pctRev = SLIDER_PCT_REVENUE[level];
          const e = SLIDER_EFFECTS[key][level];
          const streak = player.sliderStreaks[key];
          return (
            <Card key={key}>
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="font-semibold text-ink text-[1rem]">{label}</div>
                    <div className="text-[0.8125rem] text-ink-muted">{sub}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-[1.5rem] text-ink leading-none">
                      {SLIDER_LABELS[level]}
                    </div>
                    <div className="text-[0.75rem] text-ink-muted tabular mt-0.5">
                      {key === "staff"
                        ? `×${[0.5, 0.75, 1.0, 1.1, 1.2, 1.5][level]} staff multiplier`
                        : `${(pctRev * 100).toFixed(0)}% of revenue`}
                    </div>
                  </div>
                </div>

                <div className="flex gap-1.5 mb-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setSliders({ [key]: i as SliderLevel })}
                      className={cn(
                        "flex-1 h-10 rounded-md text-[0.75rem] font-medium transition-colors",
                        i === level
                          ? "bg-primary text-primary-fg"
                          : "bg-surface-2 text-ink-2 hover:bg-surface-hover",
                      )}
                    >
                      {SLIDER_LABELS[i as SliderLevel].split(" ")[0]}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.75rem] text-ink-2">
                  <span>Brand <span className={e.brandPts >= 0 ? "text-positive" : "text-negative"}>{e.brandPts >= 0 ? "+" : ""}{e.brandPts}/Q</span></span>
                  <span>Loyalty <span className={e.loyalty >= 0 ? "text-positive" : "text-negative"}>{e.loyalty >= 0 ? "+" : ""}{e.loyalty}%/Q</span></span>
                  {e.opsPts !== undefined && (
                    <span>Ops <span className={e.opsPts >= 0 ? "text-positive" : "text-negative"}>{e.opsPts >= 0 ? "+" : ""}{e.opsPts}/Q</span></span>
                  )}
                  {streak.level === level && streak.quarters > 0 && (
                    <span className="text-accent">Streak {streak.quarters}Q → {streak.quarters >= 6 ? "1.5×" : streak.quarters >= 3 ? "1.2×" : "1.0×"}</span>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {pendingDecisions.length > 0 && (
        <Card className="mt-6 border-accent">
          <CardHeader>
            <CardTitle>{pendingDecisions.length} board decision{pendingDecisions.length > 1 ? "s" : ""} still open</CardTitle>
          </CardHeader>
          <CardBody>
            <p className="text-ink-2 text-[0.875rem] mb-3">
              Submit scenarios in <Link href="/dashboard/decisions" className="underline text-ink">Board decisions</Link>. Timeout will auto-submit the worst option.
            </p>
            <ul className="space-y-1 text-[0.8125rem] text-ink-2">
              {pendingDecisions.map((sc) => (
                <li key={sc.id}>
                  <span className="font-mono text-primary mr-2">{sc.id}</span>
                  {sc.title}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
    </main>
  );
}
