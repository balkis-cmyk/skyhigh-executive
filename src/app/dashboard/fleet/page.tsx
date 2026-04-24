"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import { AIRCRAFT, AIRCRAFT_BY_ID } from "@/data/aircraft";
import { useGame, selectPlayer } from "@/store/game";
import { fmtMoney } from "@/lib/format";
import type { AircraftSpec } from "@/types/game";

export default function FleetPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const [buyOpen, setBuyOpen] = useState(false);
  const [ordering, setOrdering] = useState<{ specId: string; type: "buy" | "lease" } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!player) return null;

  const available = AIRCRAFT.filter((a) => a.unlockQuarter <= s.currentQuarter);

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
    <main className="p-6 max-w-7xl mx-auto w-full">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.75rem] text-ink leading-tight">Fleet</h1>
          <p className="text-ink-2 text-[0.875rem] mt-1">
            {player.fleet.length} aircraft · {player.fleet.filter((f) => f.status === "active").length} active
          </p>
        </div>
        <Button variant="primary" onClick={() => setBuyOpen(true)}>
          Order aircraft →
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Owned & leased</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {player.fleet.length === 0 ? (
            <div className="p-8 text-center text-ink-muted text-[0.875rem]">
              Your fleet is empty. Order your first aircraft to begin flying routes.
            </div>
          ) : (
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <Th>Aircraft</Th>
                  <Th>Status</Th>
                  <Th>Acquired</Th>
                  <Th>Book value</Th>
                  <Th>Range</Th>
                  <Th>Seats</Th>
                  <Th>Eco</Th>
                  <Th>Route</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {player.fleet.map((f) => {
                  const spec = AIRCRAFT_BY_ID[f.specId];
                  if (!spec) return null;
                  const route = player.routes.find((r) => r.id === f.routeId);
                  return (
                    <tr key={f.id} className="border-b border-line last:border-0 hover:bg-surface-hover">
                      <Td>
                        <div className="font-medium text-ink">{spec.name}</div>
                        <div className="text-[0.6875rem] text-ink-muted font-mono">{f.id.slice(-6)}</div>
                      </Td>
                      <Td>
                        <Badge tone={f.status === "active" ? "positive" : f.status === "ordered" ? "warning" : "neutral"}>
                          {f.status}
                        </Badge>
                      </Td>
                      <Td><span className="tabular">Q{f.purchaseQuarter} · {f.acquisitionType}</span></Td>
                      <Td><span className="tabular font-mono">{fmtMoney(f.bookValue)}</span></Td>
                      <Td><span className="tabular font-mono">{spec.rangeKm.toLocaleString()} km</span></Td>
                      <Td><span className="tabular font-mono">{spec.seats.first + spec.seats.business + spec.seats.economy}</span></Td>
                      <Td>
                        {f.ecoUpgrade ? (
                          <Badge tone="positive">Upgraded</Badge>
                        ) : (
                          <button
                            className="text-[0.75rem] text-ink-2 hover:text-accent underline"
                            onClick={() => {
                              const r = s.addEcoUpgrade(f.id);
                              if (!r.ok) alert(r.error ?? "Upgrade failed");
                            }}
                          >
                            +{fmtMoney(spec.ecoUpgradeUsd)}
                          </button>
                        )}
                      </Td>
                      <Td>
                        {route ? (
                          <span className="font-mono text-[0.75rem]">{route.originCode}→{route.destCode}</span>
                        ) : (
                          <span className="text-ink-muted text-[0.75rem]">Idle</span>
                        )}
                      </Td>
                      <Td>
                        <button
                          className="text-[0.75rem] text-negative hover:underline"
                          onClick={() => s.decommissionAircraft(f.id)}
                        >
                          Retire
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

      {/* Aircraft market modal */}
      <Modal open={buyOpen} onClose={() => { setBuyOpen(false); setError(null); }} className="w-[48rem]">
        <ModalHeader>
          <h2 className="font-display text-[1.5rem] text-ink">Aircraft market</h2>
          <p className="text-ink-muted text-[0.8125rem] mt-1">
            {available.length} types available at Q{s.currentQuarter} · new types unlock by quarter
          </p>
        </ModalHeader>
        <ModalBody className="max-h-[28rem] overflow-auto space-y-2 p-4">
          {available.map((a) => (
            <div key={a.id} className="rounded-md border border-line p-3 flex items-start gap-3 hover:bg-surface-hover">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ink text-[0.9375rem]">{a.name}</span>
                  <Badge tone={a.family === "cargo" ? "warning" : "neutral"}>{a.family}</Badge>
                </div>
                <div className="text-[0.75rem] text-ink-muted mt-0.5 font-mono tabular">
                  {a.seats.first + a.seats.business + a.seats.economy} seats ({a.seats.first}F/{a.seats.business}C/{a.seats.economy}Y) · {a.rangeKm.toLocaleString()} km · {a.fuelBurnPerKm} L/km
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

      {/* Confirm order */}
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
    </main>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th className="text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">
      {children}
    </th>
  );
}
function Td({ children }: { children?: React.ReactNode }) {
  return <td className="px-3 py-2 align-top">{children}</td>;
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-line last:border-0">
      <span className="text-[0.8125rem] uppercase tracking-wider text-ink-muted">{k}</span>
      <span className="text-ink tabular">{v}</span>
    </div>
  );
}
