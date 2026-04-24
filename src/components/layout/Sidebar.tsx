"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGame, selectPlayer } from "@/store/game";
import { SCENARIOS_BY_QUARTER } from "@/data/scenarios";
import { NEWS_BY_QUARTER } from "@/data/world-news";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard",             label: "Overview",     icon: "◎" },
  { href: "/dashboard/map",         label: "World map",    icon: "◉" },
  { href: "/dashboard/fleet",       label: "Fleet",        icon: "✈" },
  { href: "/dashboard/routes",      label: "Routes",       icon: "↗" },
  { href: "/dashboard/financials",  label: "Financials",   icon: "$" },
  { href: "/dashboard/ops",         label: "Ops form",     icon: "▦" },
  { href: "/dashboard/decisions",   label: "Decisions",    icon: "⬡" },
  { href: "/dashboard/news",        label: "World news",   icon: "☐" },
  { href: "/dashboard/leaderboard", label: "Leaderboard",  icon: "≡" },
];

export function Sidebar() {
  const pathname = usePathname();
  const s = useGame();
  const player = selectPlayer(s);
  const decisionsOpen =
    SCENARIOS_BY_QUARTER[s.currentQuarter]?.filter((sc) =>
      !player?.decisions.some(
        (d) => d.scenarioId === sc.id && d.quarter === s.currentQuarter,
      ),
    ) ?? [];
  const newsCount = NEWS_BY_QUARTER[s.currentQuarter]?.length ?? 0;

  return (
    <aside className="w-52 shrink-0 border-r border-line bg-surface/50">
      <nav className="sticky top-16 p-3 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          const badge =
            item.href === "/dashboard/decisions" && decisionsOpen.length > 0
              ? decisionsOpen.length
              : item.href === "/dashboard/news"
                ? newsCount
                : null;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between gap-2 rounded-md px-3 py-2",
                "text-[0.875rem] transition-colors",
                active
                  ? "bg-[rgba(20,53,94,0.08)] text-ink font-semibold"
                  : "text-ink-2 hover:bg-surface-hover hover:text-ink",
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "font-mono text-[0.875rem] w-4 text-center",
                    active ? "text-accent" : "text-ink-muted",
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </span>
              {badge !== null && badge > 0 && (
                <span className="tabular font-mono text-[0.6875rem] text-ink-muted">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-auto pt-6 pb-3 text-[0.6875rem] text-ink-muted border-t border-line mt-6">
        <div>Fuel idx <span className="tabular font-mono text-ink">{s.fuelIndex.toFixed(0)}</span></div>
        <div>Base rate <span className="tabular font-mono text-ink">{s.baseInterestRatePct.toFixed(1)}%</span></div>
      </div>
    </aside>
  );
}
