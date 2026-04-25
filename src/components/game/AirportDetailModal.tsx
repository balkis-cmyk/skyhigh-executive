"use client";

import { useMemo } from "react";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import { useGame, selectPlayer } from "@/store/game";
import { CITIES_BY_CODE } from "@/data/cities";
import { fmtMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { City } from "@/types/game";
import { Plane, Crown, MapPin } from "lucide-react";

/**
 * Airport detail popup — opened when the player double-clicks a city on
 * the map. Shows:
 *  - Headline: city name, IATA, region, tier
 *  - Slot supply: pool available + your held + airport's home hub airline
 *  - Per-airline breakdown: every team's slot count + which one is the
 *    home hub airline
 *  - Player's slot utilization: held vs used (e.g. 14/30)
 *  - Routes touching this airport (player's only — rivals' confidential)
 *  - V2 placeholder for airport investment value
 */
export function AirportDetailModal({
  city, onClose,
}: {
  city: City | null;
  onClose: () => void;
}) {
  const s = useGame();
  const player = selectPlayer(s);

  const data = useMemo(() => {
    if (!city) return null;
    const airportSlots = s.airportSlots?.[city.code];
    const pool = airportSlots?.available ?? 0;
    const nextOpening = airportSlots?.nextOpening ?? 0;

    // Per-team breakdown
    const breakdown = s.teams.map((t) => {
      const held = t.airportLeases?.[city.code]?.slots ?? 0;
      const usedAtCode = t.routes
        .filter((r) =>
          (r.status === "active" || r.status === "suspended" || r.status === "pending") &&
          (r.originCode === city.code || r.destCode === city.code),
        )
        .reduce((sum, r) => sum + r.dailyFrequency * 7, 0);
      const isHomeHub = t.hubCode === city.code;
      const isSecondaryHub = t.secondaryHubCodes?.includes(city.code) ?? false;
      return { team: t, held, used: usedAtCode, isHomeHub, isSecondaryHub };
    });

    const homeHubTeam = breakdown.find((b) => b.isHomeHub);
    const totalHeldByAllTeams = breakdown.reduce((sum, b) => sum + b.held, 0);
    return { pool, nextOpening, breakdown, homeHubTeam, totalHeldByAllTeams };
  }, [city, s]);

  if (!city || !data) return null;

  const isOpen = !!city;
  const playerEntry = data.breakdown.find((b) => b.team.id === s.playerTeamId);

  const tierLabel: Record<number, string> = {
    1: "Tier 1 — Major hub",
    2: "Tier 2 — Regional",
    3: "Tier 3 — Secondary",
    4: "Tier 4 — Tertiary",
  };

  return (
    <Modal open={isOpen} onClose={onClose} className="w-[min(680px,calc(100vw-2rem))]">
      <ModalHeader>
        <div className="flex items-center gap-2 mb-1.5">
          <Badge tone="accent">Airport</Badge>
          {data.homeHubTeam && (
            <Badge tone="primary">
              <Crown size={11} className="mr-1" />
              Home hub: {data.homeHubTeam.team.name}
            </Badge>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <h2 className="font-display text-[1.5rem] text-ink leading-tight font-mono">
            {city.code}
          </h2>
          <span className="font-display text-[1.125rem] text-ink-2">{city.name}</span>
        </div>
        <div className="text-ink-muted text-[0.8125rem] mt-1 flex items-center gap-1.5">
          <MapPin size={11} /> {city.regionName} · {tierLabel[city.tier] ?? `Tier ${city.tier}`}
        </div>
      </ModalHeader>

      <ModalBody className="space-y-4 max-h-[60vh] overflow-auto">
        {/* Player's slot utilization */}
        {playerEntry && (
          <section>
            <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-2">
              Your position
            </div>
            <div className="rounded-md border border-primary bg-[rgba(20,53,94,0.04)] p-3">
              <div className="flex items-baseline justify-between gap-3 mb-1.5">
                <span className="text-[0.8125rem] text-ink-2">Slots used / held</span>
                <span className="font-mono tabular text-ink font-bold text-[1.25rem]">
                  {playerEntry.used}<span className="text-ink-muted">/{playerEntry.held}</span>
                </span>
              </div>
              <div className="h-1.5 rounded bg-line overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded",
                    playerEntry.held === 0
                      ? "bg-line"
                      : playerEntry.used / playerEntry.held > 0.9
                        ? "bg-warning"
                        : "bg-primary",
                  )}
                  style={{
                    width: `${Math.min(100, (playerEntry.used / Math.max(1, playerEntry.held)) * 100)}%`,
                  }}
                />
              </div>
              {playerEntry.held - playerEntry.used > 0 ? (
                <div className="text-[0.6875rem] text-ink-muted mt-2">
                  {playerEntry.held - playerEntry.used} slots free at this airport — you can add
                  routes touching {city.code} without bidding for new slots.
                </div>
              ) : (
                <div className="text-[0.6875rem] text-warning mt-2">
                  Fully utilized. Bid for more slots in the Slot Market to expand here.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Airport pool */}
        <section>
          <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-2">
            Airport supply
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat
              label="Pool open now"
              value={data.pool.toLocaleString()}
              hint="Available to bid"
            />
            <Stat
              label="Next opening"
              value={data.nextOpening.toLocaleString()}
              hint="At year tick"
            />
            <Stat
              label="All teams hold"
              value={data.totalHeldByAllTeams.toLocaleString()}
              hint="Across the field"
            />
          </div>
        </section>

        {/* Per-team breakdown */}
        <section>
          <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-2">
            Airline footprint at {city.code}
          </div>
          <div className="rounded-md border border-line overflow-hidden">
            <table className="w-full text-[0.8125rem]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <th className="text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Airline</th>
                  <th className="text-right px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Slots held</th>
                  <th className="text-right px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Used</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdown
                  .filter((b) => b.held > 0 || b.isHomeHub || b.isSecondaryHub)
                  .sort((a, b) => b.held - a.held)
                  .map((b) => (
                    <tr
                      key={b.team.id}
                      className={cn(
                        "border-b border-line last:border-0",
                        b.team.id === s.playerTeamId && "bg-[rgba(20,53,94,0.04)]",
                      )}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-5 h-5 rounded flex items-center justify-center font-mono text-[0.5625rem] font-semibold text-primary-fg shrink-0"
                            style={{ background: b.team.color }}
                          >
                            {b.team.code}
                          </span>
                          <span className="text-ink truncate font-medium">
                            {b.team.name}
                          </span>
                          {b.team.id === player?.id && <Badge tone="primary">You</Badge>}
                          {b.isHomeHub && (
                            <Badge tone="accent">
                              <Crown size={10} className="mr-0.5" /> Home
                            </Badge>
                          )}
                          {b.isSecondaryHub && <Badge tone="info">Secondary</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right tabular font-mono text-ink">
                        {b.held > 0 ? b.held.toLocaleString() : <span className="text-ink-muted">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular font-mono">
                        {b.team.id === s.playerTeamId ? (
                          <span className="text-ink">{b.used.toLocaleString()}</span>
                        ) : (
                          <span className="text-ink-muted text-[0.6875rem] italic">private</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data.breakdown.every((b) => b.held === 0 && !b.isHomeHub) && (
            <div className="text-[0.75rem] text-ink-muted italic mt-2">
              No airline currently operates at {city.code}.
            </div>
          )}
        </section>

        {/* Routes touching this airport (player's only) */}
        {playerEntry && (() => {
          const playerRoutes = playerEntry.team.routes.filter(
            (r) =>
              (r.status === "active" || r.status === "suspended" || r.status === "pending") &&
              (r.originCode === city.code || r.destCode === city.code),
          );
          if (playerRoutes.length === 0) return null;
          return (
            <section>
              <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-2">
                Your routes touching {city.code} · {playerRoutes.length}
              </div>
              <div className="space-y-1">
                {playerRoutes.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-baseline justify-between rounded-md border border-line bg-surface-2/40 px-3 py-1.5 text-[0.8125rem]"
                  >
                    <span className="font-mono text-ink">
                      {r.originCode} → {r.destCode}
                    </span>
                    <div className="flex items-baseline gap-3 text-[0.75rem]">
                      <span className="tabular text-ink-muted">
                        {r.dailyFrequency * 7}/wk
                      </span>
                      <Badge
                        tone={
                          r.status === "pending" ? "warning" :
                          r.status === "suspended" ? "warning" : "positive"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })()}

        {/* V2 placeholder — airport investment / ownership */}
        <section>
          <div className="rounded-md border border-dashed border-line bg-surface-2/30 px-3 py-2.5 text-[0.75rem] text-ink-muted leading-relaxed">
            <strong className="text-ink-2">V2 — Airport investments.</strong> Future
            iteration will let you co-invest in airport infrastructure
            (terminals, lounges, ground handling). Returns scale with the
            airport&apos;s tier-driven revenue base. Not active in this
            simulation window.
          </div>
        </section>
      </ModalBody>

      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}

function Stat({
  label, value, hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-2.5">
      <div className="text-[0.625rem] uppercase tracking-wider text-ink-muted font-semibold">
        {label}
      </div>
      <div className="font-display text-[1.25rem] text-ink mt-0.5 tabular">
        {value}
      </div>
      {hint && (
        <div className="text-[0.6875rem] text-ink-muted mt-0.5">{hint}</div>
      )}
    </div>
  );
}
