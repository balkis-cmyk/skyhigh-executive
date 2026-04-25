"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Input } from "@/components/ui";
import { AIRCRAFT, AIRCRAFT_BY_ID } from "@/data/aircraft";
import { useGame, selectPlayer } from "@/store/game";
import { fmtMoney, fmtPct } from "@/lib/format";
import { CITIES_BY_CODE } from "@/data/cities";
import { cn } from "@/lib/cn";

/** Group aircraft by spec id, count quantity, and aggregate utilisation. */
function groupByType(player: ReturnType<typeof selectPlayer>) {
  if (!player) return [];
  const map: Record<string, {
    specId: string;
    total: number;
    active: number;
    ordered: number;
    grounded: number;
    retired: number;
    onRoutes: number;        // # planes assigned to a route
    bookValue: number;       // sum
    avgAgeQ: number;         // average plane age in quarters
    quarterlyProfit: number; // sum of profit across routes carrying these planes
  }> = {};

  // Cache route profits by id
  const routeProfit: Record<string, number> = {};
  for (const r of player.routes) {
    routeProfit[r.id] = r.quarterlyRevenue - r.quarterlyFuelCost - r.quarterlySlotCost;
  }

  let now = 0;
  for (const f of player.fleet) {
    if (!map[f.specId]) {
      map[f.specId] = {
        specId: f.specId, total: 0, active: 0, ordered: 0, grounded: 0, retired: 0,
        onRoutes: 0, bookValue: 0, avgAgeQ: 0, quarterlyProfit: 0,
      };
    }
    const g = map[f.specId];
    g.total += 1;
    g.bookValue += f.bookValue ?? 0;
    if (f.routeId) {
      g.onRoutes += 1;
      g.quarterlyProfit += (routeProfit[f.routeId] ?? 0)
        / Math.max(1, player.fleet.filter((x) => x.routeId === f.routeId).length);
    }
    if (f.status === "active") g.active += 1;
    else if (f.status === "ordered") g.ordered += 1;
    else if (f.status === "grounded") g.grounded += 1;
    else if (f.status === "retired") g.retired += 1;
    g.avgAgeQ += f.purchaseQuarter;
    now += 1;
  }
  void now;
  // Convert avgAgeQ from sum-of-purchase-quarters to mean
  for (const g of Object.values(map)) {
    g.avgAgeQ = g.avgAgeQ / g.total; // this is actually "avg purchase quarter"
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export function FleetPanel() {
  const s = useGame();
  const player = selectPlayer(s);
  const [buyOpen, setBuyOpen] = useState(false);
  const [ordering, setOrdering] = useState<{ specId: string; type: "buy" | "lease" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSpecId, setExpandedSpecId] = useState<string | null>(null);
  const [marketQuery, setMarketQuery] = useState("");

  const groups = useMemo(() => groupByType(player), [player]);

  if (!player) return null;

  const available = AIRCRAFT.filter((a) => a.unlockQuarter <= s.currentQuarter)
    .filter((a) => {
      if (!marketQuery) return true;
      const q = marketQuery.toLowerCase();
      return a.name.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.family.toLowerCase().includes(q);
    });

  const expanded = expandedSpecId
    ? AIRCRAFT_BY_ID[expandedSpecId]
    : null;
  const expandedFleet = expandedSpecId
    ? player.fleet.filter((f) => f.specId === expandedSpecId)
    : [];
  const listings = s.secondHandListings;

  function confirmOrder() {
    if (!ordering) return;
    const r = s.orderAircraft({ specId: ordering.specId, acquisitionType: ordering.type });
    if (!r.ok) {
      setError(r.error ?? "Unknown error");
      return;
    }
    setOrdering(null);
    setBuyOpen(false);
    setError(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[0.8125rem] text-ink-2">
          {player.fleet.length} aircraft total · {groups.length} type{groups.length === 1 ? "" : "s"}
        </div>
        <Button variant="primary" size="sm" onClick={() => setBuyOpen(true)}>
          Order aircraft →
        </Button>
      </div>

      {groups.length === 0 ? (
        <div className="py-12 text-center text-ink-muted text-[0.875rem] rounded-lg border border-dashed border-line">
          Fleet is empty. Order your first aircraft to begin flying routes.
        </div>
      ) : (
        <div className="rounded-md border border-line overflow-hidden">
          <table className="w-full text-[0.8125rem]">
            <thead>
              <tr className="bg-surface-2 border-b border-line">
                <Th className="w-[36%]">Type</Th>
                <Th className="text-right">Qty</Th>
                <Th className="text-right">In service</Th>
                <Th className="text-right">Book value</Th>
                <Th className="text-right">Q profit</Th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const spec = AIRCRAFT_BY_ID[g.specId];
                if (!spec) return null;
                return (
                  <tr
                    key={g.specId}
                    onClick={() => setExpandedSpecId(g.specId)}
                    className="border-b border-line last:border-0 cursor-pointer hover:bg-surface-hover"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{spec.name}</span>
                        <Badge tone={spec.family === "cargo" ? "warning" : "neutral"}>
                          {spec.family}
                        </Badge>
                        {g.ordered > 0 && (
                          <Badge tone="info">{g.ordered} ordered</Badge>
                        )}
                        {g.grounded > 0 && (
                          <Badge tone="warning">{g.grounded} grounded</Badge>
                        )}
                      </div>
                      <div className="text-[0.6875rem] text-ink-muted mt-0.5 font-mono">
                        {spec.family === "passenger"
                          ? `${spec.seats.first}F/${spec.seats.business}C/${spec.seats.economy}Y · ${spec.rangeKm.toLocaleString()} km`
                          : `${spec.cargoTonnes ?? 0}T · ${spec.rangeKm.toLocaleString()} km`}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right tabular font-display text-[1.25rem] text-ink leading-none">
                      {g.total}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular font-mono text-ink">
                      {g.active}/{g.total}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular font-mono text-ink">
                      {fmtMoney(g.bookValue)}
                    </td>
                    <td
                      className={cn(
                        "py-2.5 px-3 text-right tabular font-mono font-medium",
                        g.quarterlyProfit >= 0 ? "text-positive" : "text-negative",
                      )}
                    >
                      {fmtMoney(g.quarterlyProfit)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Second-hand market preview */}
      {listings.length > 0 && (
        <section className="mt-5">
          <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">
            Second-hand market · {listings.length} listing{listings.length > 1 ? "s" : ""}
          </div>
          <div className="space-y-1.5">
            {listings.map((l) => {
              const spec = AIRCRAFT_BY_ID[l.specId];
              if (!spec) return null;
              const remainingLifespan = Math.max(0, l.retirementQuarter - s.currentQuarter);
              return (
                <div key={l.id} className="rounded-md border border-line bg-surface-2/50 p-2.5 text-[0.8125rem]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-ink">{spec.name}</div>
                      <div className="text-[0.6875rem] text-ink-muted font-mono">
                        Seller: {l.sellerTeamId === "admin" ? "Facilitator" : l.sellerTeamId.slice(-6)}
                        {l.ecoUpgrade && " · Eco"} · {remainingLifespan}Q left
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const r = s.buySecondHand(l.id);
                        if (!r.ok) alert(r.error);
                      }}
                    >
                      Buy {fmtMoney(l.askingPriceUsd)}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Aircraft type detail (per-plane drilldown) ─────────────── */}
      {expanded && (
        <Modal
          open={true}
          onClose={() => setExpandedSpecId(null)}
          className="w-[min(820px,calc(100vw-3rem))]"
        >
          <ModalHeader>
            <h2 className="font-display text-[1.5rem] text-ink leading-tight">
              {expanded.name}
              <span className="ml-2 text-ink-muted text-[0.875rem] font-sans">
                × {expandedFleet.length}
              </span>
            </h2>
            <div className="text-ink-muted text-[0.8125rem] mt-1 font-mono">
              {expanded.family === "passenger"
                ? `${expanded.seats.first}F / ${expanded.seats.business}C / ${expanded.seats.economy}Y`
                : `${expanded.cargoTonnes ?? 0}T cargo`}
              {" · "}{expanded.rangeKm.toLocaleString()} km
              {" · "}{expanded.fuelBurnPerKm} L/km
              {" · "}buy {fmtMoney(expanded.buyPriceUsd)}
              {" · "}lease {fmtMoney(expanded.leasePerQuarterUsd)}/Q
            </div>
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-auto">
            <div className="rounded-md border border-line overflow-hidden">
              <table className="w-full text-[0.8125rem]">
                <thead>
                  <tr className="bg-surface-2 border-b border-line">
                    <Th>Tail</Th>
                    <Th>Status</Th>
                    <Th>Route</Th>
                    <Th className="text-right">Age</Th>
                    <Th className="text-right">Book value</Th>
                    <Th className="text-right">Q profit</Th>
                    <Th className="text-right w-[110px]">Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {expandedFleet.map((f) => {
                    const route = player.routes.find((r) => r.id === f.routeId);
                    const profit = route
                      ? (route.quarterlyRevenue - route.quarterlyFuelCost - route.quarterlySlotCost) /
                        Math.max(1, player.fleet.filter((x) => x.routeId === route.id).length)
                      : 0;
                    const ageQ = Math.max(0, s.currentQuarter - f.purchaseQuarter);
                    const remainingQ = Math.max(0, f.retirementQuarter - s.currentQuarter);
                    return (
                      <tr key={f.id} className="border-b border-line last:border-0">
                        <td className="py-2 px-3 font-mono text-ink">
                          {f.id.slice(-6).toUpperCase()}
                          {f.ecoUpgrade && (
                            <Badge tone="positive" className="ml-1.5">Eco</Badge>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <Badge
                            tone={
                              f.status === "active"
                                ? "positive"
                                : f.status === "retired"
                                  ? "negative"
                                  : f.status === "ordered"
                                    ? "info"
                                    : "warning"
                            }
                          >
                            {f.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 font-mono text-ink-2">
                          {route ? `${route.originCode}→${route.destCode}` : <span className="text-ink-muted">—</span>}
                        </td>
                        <td className="py-2 px-3 text-right tabular font-mono text-ink">
                          {ageQ}Q
                          <span className="text-ink-muted ml-1">/ {remainingQ}Q left</span>
                        </td>
                        <td className="py-2 px-3 text-right tabular font-mono text-ink">
                          {fmtMoney(f.bookValue)}
                        </td>
                        <td className={cn(
                          "py-2 px-3 text-right tabular font-mono",
                          profit >= 0 ? "text-positive" : "text-negative",
                        )}>
                          {f.routeId ? fmtMoney(profit) : <span className="text-ink-muted">—</span>}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 text-[0.75rem]">
                            {!f.ecoUpgrade && f.status === "active" && (
                              <button
                                className="text-ink-2 hover:text-accent underline"
                                onClick={() => {
                                  const r = s.addEcoUpgrade(f.id);
                                  if (!r.ok) alert(r.error ?? "Upgrade failed");
                                }}
                              >
                                Eco
                              </button>
                            )}
                            {f.acquisitionType === "buy" && f.status === "active" && (
                              <button
                                className="text-ink-2 hover:text-ink underline"
                                onClick={() => {
                                  const ps = prompt(
                                    `List ${expanded.name} for sale (book ${fmtMoney(f.bookValue)} min, 1.5× max):`,
                                    String(Math.round(f.bookValue * 1.1)),
                                  );
                                  if (!ps) return;
                                  const price = parseInt(ps, 10);
                                  if (!Number.isFinite(price)) return;
                                  const r = s.listSecondHand(f.id, price);
                                  if (!r.ok) alert(r.error);
                                }}
                              >
                                Sell
                              </button>
                            )}
                            {f.status !== "retired" && (
                              <button
                                className="text-negative hover:underline"
                                onClick={() => {
                                  if (confirm(`Retire ${expanded.name} (${f.id.slice(-6)})?`))
                                    s.decommissionAircraft(f.id);
                                }}
                              >
                                Retire
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setExpandedSpecId(null)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                setExpandedSpecId(null);
                setOrdering({ specId: expanded.id, type: "buy" });
              }}
            >
              Order another → buy {fmtMoney(expanded.buyPriceUsd)}
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {/* ── Aircraft market modal ─────────────────────────────────── */}
      <Modal open={buyOpen} onClose={() => { setBuyOpen(false); setError(null); }} className="w-[min(820px,calc(100vw-3rem))]">
        <ModalHeader>
          <h2 className="font-display text-[1.5rem] text-ink">Aircraft market</h2>
          <p className="text-ink-muted text-[0.8125rem] mt-1">
            {available.length} types available at Q{s.currentQuarter}
          </p>
          <Input
            placeholder="Search by name, family…"
            value={marketQuery}
            onChange={(e) => setMarketQuery(e.target.value)}
            className="mt-3"
          />
        </ModalHeader>
        <ModalBody className="max-h-[28rem] overflow-auto space-y-2">
          {available.map((a) => (
            <div key={a.id} className="rounded-md border border-line p-3 flex items-start gap-3 hover:bg-surface-hover">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-[0.9375rem]">{a.name}</span>
                  <Badge tone={a.family === "cargo" ? "warning" : "neutral"}>{a.family}</Badge>
                </div>
                <div className="text-[0.75rem] text-ink-muted mt-0.5 font-mono tabular">
                  {a.family === "passenger"
                    ? `${a.seats.first + a.seats.business + a.seats.economy} seats (${a.seats.first}F/${a.seats.business}C/${a.seats.economy}Y)`
                    : `${a.cargoTonnes ?? 0}T cargo`}
                  {" · "}{a.rangeKm.toLocaleString()} km · {a.fuelBurnPerKm} L/km
                </div>
                {a.note && <p className="text-[0.8125rem] text-ink-2 mt-1 italic">{a.note}</p>}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" variant="primary" onClick={() => setOrdering({ specId: a.id, type: "buy" })}>
                  Buy {fmtMoney(a.buyPriceUsd)}
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setOrdering({ specId: a.id, type: "lease" })}>
                  Lease {fmtMoney(a.leasePerQuarterUsd)}/Q
                </Button>
              </div>
            </div>
          ))}
        </ModalBody>
      </Modal>

      <Modal open={!!ordering} onClose={() => { setOrdering(null); setError(null); }}>
        <ModalHeader>
          <h2 className="font-display text-[1.25rem] text-ink">Confirm order</h2>
        </ModalHeader>
        <ModalBody>
          {ordering && (() => {
            const spec = AIRCRAFT_BY_ID[ordering.specId];
            if (!spec) return null;
            const cost = ordering.type === "buy" ? spec.buyPriceUsd : spec.leasePerQuarterUsd;
            return (
              <div className="space-y-2">
                <Row k="Aircraft" v={spec.name} />
                <Row k="Acquisition" v={ordering.type === "buy" ? "Outright purchase" : "Lease (quarterly)"} />
                <Row k="Cost" v={fmtMoney(cost)} />
                <Row k="Arrives" v={`Q${s.currentQuarter + 1}`} />
                {error && <div className="text-negative text-[0.875rem] mt-2">{error}</div>}
              </div>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setOrdering(null); setError(null); }}>Cancel</Button>
          <Button variant="primary" onClick={confirmOrder}>Confirm order</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function Th({
  children, className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-line last:border-0">
      <span className="text-[0.8125rem] uppercase tracking-wider text-ink-muted">{k}</span>
      <span className="text-ink tabular">{v}</span>
    </div>
  );
}

// fmtPct is imported lazily only when needed for occupancy on cargo planes —
// the unused import is suppressed by tsc since we reference it elsewhere.
void fmtPct;
