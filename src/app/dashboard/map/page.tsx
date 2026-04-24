"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import { WorldMap } from "@/components/game/WorldMap";
import { useGame, selectPlayer } from "@/store/game";
import type { City, FleetAircraft, PricingTier } from "@/types/game";
import { AIRCRAFT_BY_ID } from "@/data/aircraft";
import { distanceBetween } from "@/lib/engine";
import { fmtMoney } from "@/lib/format";

export default function MapPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const openRoute = useGame((g) => g.openRoute);

  const [origin, setOrigin] = useState<string | null>(null);
  const [dest, setDest] = useState<string | null>(null);
  const [freq, setFreq] = useState(1);
  const [tier, setTier] = useState<PricingTier>("standard");
  const [selectedPlaneIds, setSelectedPlaneIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!player) return null;

  function handleCityClick(c: City) {
    setError(null);
    if (!origin) {
      setOrigin(c.code);
      return;
    }
    if (origin && !dest && c.code !== origin) {
      setDest(c.code);
      // Pre-fill aircraft selection with first idle plane that can reach
      const dist = distanceBetween(origin, c.code);
      const idle = player!.fleet.find((f) =>
        f.status === "active" && !f.routeId &&
        AIRCRAFT_BY_ID[f.specId] && AIRCRAFT_BY_ID[f.specId].rangeKm >= dist,
      );
      setSelectedPlaneIds(idle ? [idle.id] : []);
      return;
    }
    // Clicked a third city — restart
    setOrigin(c.code);
    setDest(null);
    setSelectedPlaneIds([]);
  }

  function confirmRoute() {
    if (!origin || !dest) return;
    const r = openRoute({
      originCode: origin,
      destCode: dest,
      aircraftIds: selectedPlaneIds,
      dailyFrequency: freq,
      pricingTier: tier,
    });
    if (!r.ok) {
      setError(r.error ?? "Unknown error");
      return;
    }
    setOrigin(null);
    setDest(null);
    setSelectedPlaneIds([]);
    setError(null);
  }

  const dist = origin && dest ? distanceBetween(origin, dest) : 0;

  // Idle planes that could fly this route
  const idlePlanes = player.fleet.filter(
    (f) => f.status === "active" && !f.routeId,
  );

  return (
    <main className="p-6 h-full flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-[1.75rem] text-ink leading-tight">World map</h1>
          <p className="text-ink-2 text-[0.875rem] mt-1">
            {origin && !dest
              ? "Pick destination city to preview route."
              : origin && dest
                ? "Configure route and confirm below."
                : "Click any city to begin routing — or open your hub to inspect."}
          </p>
        </div>
        {(origin || dest) && (
          <Button variant="ghost" size="sm" onClick={() => { setOrigin(null); setDest(null); setSelectedPlaneIds([]); setError(null); }}>
            Cancel routing
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-[560px]">
        <WorldMap
          team={player}
          selectedOriginCode={origin}
          onCityClick={handleCityClick}
        />
      </div>

      {/* Route setup modal */}
      <Modal
        open={!!(origin && dest)}
        onClose={() => {
          setOrigin(null); setDest(null); setSelectedPlaneIds([]); setError(null);
        }}
      >
        <ModalHeader>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge tone="accent">New route</Badge>
          </div>
          <h2 className="font-display text-[1.5rem] text-ink leading-tight">
            {origin} → {dest}
          </h2>
          <div className="text-ink-muted text-[0.8125rem] mt-1 tabular font-mono">
            {Math.round(dist).toLocaleString()} km
          </div>
        </ModalHeader>
        <ModalBody className="space-y-5">
          <div>
            <Label>Pricing tier</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["budget", "standard", "premium", "ultra"] as PricingTier[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={`rounded-md border px-3 py-2 text-[0.8125rem] capitalize transition-colors ${
                    tier === t
                      ? "border-primary bg-[rgba(20,53,94,0.06)] text-ink font-medium"
                      : "border-line text-ink-2 hover:bg-surface-hover"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Daily frequency</Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={freq}
                onChange={(e) => setFreq(parseInt(e.target.value, 10))}
                className="flex-1 accent-primary"
              />
              <span className="tabular font-mono text-ink text-[0.9375rem] w-10 text-right">
                {freq}/day
              </span>
            </div>
          </div>

          <div>
            <Label>Assign aircraft (idle fleet)</Label>
            {idlePlanes.length === 0 ? (
              <Card>
                <CardBody className="text-[0.8125rem] text-ink-muted">
                  No idle aircraft. Order or reassign planes in <a href="/dashboard/fleet" className="underline text-ink-2">Fleet</a>.
                </CardBody>
              </Card>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-auto">
                {idlePlanes.map((p) => {
                  const spec = AIRCRAFT_BY_ID[p.specId];
                  if (!spec) return null;
                  const canReach = spec.rangeKm >= dist;
                  const selected = selectedPlaneIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer ${
                        selected
                          ? "border-primary bg-[rgba(20,53,94,0.04)]"
                          : canReach
                            ? "border-line hover:bg-surface-hover"
                            : "border-line opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={!canReach}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPlaneIds([...selectedPlaneIds, p.id]);
                          else setSelectedPlaneIds(selectedPlaneIds.filter((x) => x !== p.id));
                        }}
                        className="accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-ink text-[0.875rem]">{spec.name}</div>
                        <div className="text-[0.6875rem] text-ink-muted font-mono">
                          Range {spec.rangeKm.toLocaleString()} km · {spec.seats.first + spec.seats.business + spec.seats.economy} seats
                        </div>
                      </div>
                      {!canReach && <Badge tone="negative">Out of range</Badge>}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {error && (
            <div className="text-negative text-[0.875rem] rounded-md border border-[var(--negative-soft)] bg-[var(--negative-soft)] px-3 py-2">
              {error}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setOrigin(null); setDest(null); setSelectedPlaneIds([]); setError(null); }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={selectedPlaneIds.length === 0}
            onClick={confirmRoute}
          >
            Open route →
          </Button>
        </ModalFooter>
      </Modal>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">
      {children}
    </div>
  );
}
