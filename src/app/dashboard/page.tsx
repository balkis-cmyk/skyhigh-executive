"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Metric } from "@/components/ui";
import { fmtMoney, fmtPct } from "@/lib/format";
import { useGame, selectPlayer } from "@/store/game";
import { SCENARIOS_BY_QUARTER } from "@/data/scenarios";
import { NEWS_BY_QUARTER } from "@/data/world-news";
import { computeAirlineValue, fleetCount } from "@/lib/engine";
import { DOCTRINE_BY_ID } from "@/data/doctrines";

export default function Overview() {
  const s = useGame();
  const player = selectPlayer(s);
  if (!player) return null;

  const airlineValue = computeAirlineValue(player);
  const activeRoutes = player.routes.filter((r) => r.status === "active");
  const totalRevenueLast = player.financialsByQuarter.at(-1)?.revenue ?? 0;
  const prevRevenue = player.financialsByQuarter.at(-2)?.revenue ?? 0;
  const revenueDelta = prevRevenue > 0 ? ((totalRevenueLast - prevRevenue) / prevRevenue) * 100 : 0;

  const pendingDecisions = (SCENARIOS_BY_QUARTER[s.currentQuarter] ?? []).filter(
    (sc) => !player.decisions.some((d) => d.scenarioId === sc.id && d.quarter === s.currentQuarter),
  );
  const todayNews = NEWS_BY_QUARTER[s.currentQuarter] ?? [];

  return (
    <main className="p-6 max-w-7xl mx-auto w-full">
      {/* Heading + next action */}
      <header className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-[2rem] text-ink leading-tight">
            {player.name}
          </h1>
          <p className="text-ink-2 text-[0.9375rem] mt-1">
            {DOCTRINE_BY_ID[player.doctrine].name} · Hub {player.hubCode}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingDecisions.length > 0 && (
            <Link href="/dashboard/decisions">
              <Button variant="accent">
                {pendingDecisions.length} board decision{pendingDecisions.length > 1 ? "s" : ""} open →
              </Button>
            </Link>
          )}
          <Link href="/dashboard/ops">
            <Button variant="primary">Submit quarter →</Button>
          </Link>
        </div>
      </header>

      {/* Four panels per PRD §3.2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Financial health</CardTitle>
            <Badge tone="neutral">Q{s.currentQuarter}</Badge>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-5">
            <Metric label="Cash" value={fmtMoney(player.cashUsd)} />
            <Metric label="Debt" value={fmtMoney(player.totalDebtUsd)} />
            <Metric label="Revenue last Q" value={fmtMoney(totalRevenueLast)}
              delta={revenueDelta !== 0 ? { value: revenueDelta, format: (n) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%` } : undefined} />
            <Metric label="Airline value" value={fmtMoney(airlineValue)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand health</CardTitle>
            <Badge tone="accent">{player.brandValue.toFixed(1)}</Badge>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-5">
            <Metric label="Brand pts" value={player.brandPts.toFixed(0)} />
            <Metric label="Loyalty" value={fmtPct(player.customerLoyaltyPct, 0)} />
            <Metric label="Brand value" value={player.brandValue.toFixed(1)} />
            <Metric label="Ops pts" value={player.opsPts.toFixed(0)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations</CardTitle>
            <Badge tone="neutral">{fleetCount(player.fleet)} planes</Badge>
          </CardHeader>
          <CardBody className="grid grid-cols-2 gap-5">
            <Metric label="Fleet size" value={fleetCount(player.fleet)} />
            <Metric label="Routes active" value={activeRoutes.length} />
            <Metric
              label="Avg occupancy"
              value={fmtPct(
                activeRoutes.length > 0
                  ? (activeRoutes.reduce((s, r) => s + r.avgOccupancy, 0) / activeRoutes.length) * 100
                  : 0,
                0,
              )}
            />
            <Metric label="Ops pts" value={player.opsPts.toFixed(0)} />
          </CardBody>
        </Card>
      </div>

      {/* World news + pending actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>World news · Q{s.currentQuarter}</CardTitle>
            <Link href="/dashboard/news" className="text-[0.8125rem] text-ink-muted hover:text-ink">
              View all →
            </Link>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {todayNews.slice(0, 4).map((n) => (
                <div key={n.id} className="flex gap-3 items-start">
                  <span className="text-[1.125rem] text-ink-muted mt-0.5">{n.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge tone={newsTone(n.impact)}>{n.impact.toUpperCase()}</Badge>
                    </div>
                    <div className="text-[0.875rem] text-ink font-medium leading-snug">{n.headline}</div>
                    <div className="text-[0.8125rem] text-ink-muted mt-0.5">{n.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending actions</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="space-y-2.5 text-[0.875rem]">
              <Task done={pendingDecisions.length === 0}
                label={pendingDecisions.length === 0
                  ? "Board decisions submitted"
                  : `${pendingDecisions.length} board decision${pendingDecisions.length > 1 ? "s" : ""} pending`} />
              <Task done={false} label="Review quarterly ops sliders" />
              <Task done={activeRoutes.length > 0} label={
                activeRoutes.length === 0 ? "Open your first route" : `${activeRoutes.length} routes active`
              } />
              <Task done={fleetCount(player.fleet) > 0} label={
                fleetCount(player.fleet) === 0 ? "Order aircraft" : `${fleetCount(player.fleet)} aircraft in service`
              } />
            </ul>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}

function newsTone(impact: string): "neutral" | "primary" | "accent" | "positive" | "negative" | "warning" | "info" {
  switch (impact) {
    case "tourism": return "accent";
    case "business": return "primary";
    case "cargo": return "positive";
    case "brand": return "info";
    case "fuel": return "warning";
    case "ops": return "negative";
    default: return "neutral";
  }
}

function Task({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`font-mono text-[0.75rem] mt-0.5 ${done ? "text-positive" : "text-accent"}`}>
        {done ? "✓" : "○"}
      </span>
      <span className={done ? "text-ink-muted line-through" : "text-ink"}>{label}</span>
    </li>
  );
}
