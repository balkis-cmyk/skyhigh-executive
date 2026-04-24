"use client";

import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { useGame, selectPlayer } from "@/store/game";
import { fmtMoney, fmtPct } from "@/lib/format";
import { CITIES_BY_CODE } from "@/data/cities";
import { AIRCRAFT_BY_ID } from "@/data/aircraft";

export default function RoutesPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const closeRoute = useGame((g) => g.closeRoute);
  if (!player) return null;

  const active = player.routes.filter((r) => r.status === "active");

  return (
    <main className="p-6 max-w-7xl mx-auto w-full">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.75rem] text-ink leading-tight">Routes</h1>
          <p className="text-ink-2 text-[0.875rem] mt-1">{active.length} routes flying</p>
        </div>
        <Link href="/dashboard/map">
          <Button variant="primary">Open new route →</Button>
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Active network</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {active.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-[0.875rem]">
              No routes yet. Open your first route from the world map.
            </div>
          ) : (
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <Th>Route</Th>
                  <Th>Aircraft</Th>
                  <Th className="text-right">Daily freq</Th>
                  <Th>Pricing</Th>
                  <Th className="text-right">Q revenue</Th>
                  <Th className="text-right">Q profit</Th>
                  <Th className="text-right">Load</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {active.map((r) => {
                  const origin = CITIES_BY_CODE[r.originCode];
                  const dest = CITIES_BY_CODE[r.destCode];
                  const profit = r.quarterlyRevenue - r.quarterlyFuelCost - r.quarterlySlotCost;
                  const planes = r.aircraftIds
                    .map((id) => player.fleet.find((f) => f.id === id))
                    .filter(Boolean);
                  const specs = planes
                    .map((p) => p && AIRCRAFT_BY_ID[p.specId]?.name)
                    .filter(Boolean)
                    .join(", ");
                  return (
                    <tr key={r.id} className="border-b border-line last:border-0 hover:bg-surface-hover">
                      <Td>
                        <div className="font-medium text-ink font-mono">
                          {r.originCode} → {r.destCode}
                        </div>
                        <div className="text-[0.6875rem] text-ink-muted tabular">
                          {origin?.name} · {dest?.name} · {Math.round(r.distanceKm)} km
                        </div>
                      </Td>
                      <Td><span className="text-[0.8125rem] text-ink-2">{specs}</span></Td>
                      <Td className="text-right tabular font-mono">{r.dailyFrequency}</Td>
                      <Td><Badge tone="neutral">{r.pricingTier}</Badge></Td>
                      <Td className="text-right tabular font-mono">{fmtMoney(r.quarterlyRevenue)}</Td>
                      <Td className={`text-right tabular font-mono font-medium ${profit >= 0 ? "text-positive" : "text-negative"}`}>
                        {fmtMoney(profit)}
                      </Td>
                      <Td className="text-right tabular font-mono">
                        <span className={r.avgOccupancy > 0.7 ? "text-positive" : r.avgOccupancy < 0.5 ? "text-negative" : "text-ink"}>
                          {fmtPct(r.avgOccupancy * 100, 0)}
                        </span>
                      </Td>
                      <Td>
                        <button
                          className="text-[0.75rem] text-negative hover:underline"
                          onClick={() => closeRoute(r.id)}
                        >
                          Close
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </main>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted ${className ?? ""}`}>
      {children}
    </th>
  );
}
function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className ?? ""}`}>{children}</td>;
}
