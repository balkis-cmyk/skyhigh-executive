"use client";

import { useRouter } from "next/navigation";
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import { fmtMoney, fmtPct } from "@/lib/format";
import { useGame, selectPlayer } from "@/store/game";

export function QuarterCloseModal() {
  const s = useGame();
  const router = useRouter();
  const player = selectPlayer(s);
  const open = s.phase === "quarter-closing" && !!s.lastCloseResult;
  const result = s.lastCloseResult;

  function continueNext() {
    if (!result) return;
    s.advanceToNext();
    if (s.currentQuarter >= 20) router.push("/endgame");
  }

  if (!result || !player) return null;

  return (
    <Modal open={open} onClose={() => { /* force continue */ }}>
      <ModalHeader>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-[0.6875rem] uppercase tracking-wider text-accent">
            Q{result.quarter} · Quarter closed
          </span>
        </div>
        <h2 className="font-display text-[1.75rem] text-ink leading-tight">
          {result.netProfit >= 0 ? "A profitable quarter." : "A tough quarter."}
        </h2>
      </ModalHeader>
      <ModalBody className="space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Revenue" value={fmtMoney(result.revenue)} tone="positive" />
          <Stat
            label="Costs"
            value={fmtMoney(
              result.fuelCost + result.slotCost + result.staffCost +
              result.otherSliderCost + result.maintenanceCost +
              result.depreciation + result.interest + result.tax,
            )}
            tone="negative"
          />
          <Stat
            label="Net profit"
            value={fmtMoney(result.netProfit)}
            tone={result.netProfit >= 0 ? "positive" : "negative"}
          />
        </div>

        <div className="rounded-md border border-line overflow-hidden">
          <table className="w-full text-[0.8125rem]">
            <tbody>
              <Row k="Fuel cost" v={fmtMoney(result.fuelCost)} />
              <Row k="Slot fees" v={fmtMoney(result.slotCost)} />
              <Row k="Staff" v={fmtMoney(result.staffCost)} />
              <Row k="Other slider spend" v={fmtMoney(result.otherSliderCost)} />
              <Row k="Maintenance" v={fmtMoney(result.maintenanceCost)} />
              <Row k="Depreciation" v={fmtMoney(result.depreciation)} />
              <Row k="Debt interest" v={fmtMoney(result.interest)} />
              {result.rcfInterest > 0 && <Row k="RCF interest (2× base)" v={fmtMoney(result.rcfInterest)} />}
              <Row k="Passenger tax ($16/pax)" v={fmtMoney(result.passengerTax)} />
              <Row k="Fuel excise (8%)" v={fmtMoney(result.fuelExcise)} />
              {result.carbonLevy > 0 && <Row k="Carbon levy" v={fmtMoney(result.carbonLevy)} />}
              <Row k="Corporate tax (20% on pretax)" v={fmtMoney(result.tax)} />
            </tbody>
          </table>
        </div>

        {result.newRcfBalance > 0 && (
          <div className="text-[0.8125rem] rounded-md border border-[var(--warning-soft)] bg-[var(--warning-soft)] text-warning px-3 py-2">
            Revolving Credit Facility drawn: <span className="tabular font-mono font-semibold">{fmtMoney(result.newRcfBalance)}</span>. Interest 2× base rate applies next quarter.
          </div>
        )}

        {result.triggeredEvents.length > 0 && (
          <div>
            <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">
              Deferred events resolved
            </div>
            <div className="space-y-1.5">
              {result.triggeredEvents.map((e) => (
                <div
                  key={e.id}
                  className={`rounded-md border px-3 py-2 text-[0.8125rem] ${
                    e.outcome === "triggered"
                      ? "border-[var(--negative-soft)] bg-[var(--negative-soft)]"
                      : "border-[var(--positive-soft)] bg-[var(--positive-soft)]"
                  }`}
                >
                  <span className="font-mono text-primary mr-2">{e.scenario}</span>
                  {e.note}
                  <span
                    className={`ml-2 font-semibold ${
                      e.outcome === "triggered" ? "text-negative" : "text-positive"
                    }`}
                  >
                    · {e.outcome === "triggered" ? "triggered" : "missed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {result.notes.length > 0 && (
          <div className="text-[0.75rem] text-ink-muted space-y-0.5">
            {result.notes.map((n, i) => <div key={i}>· {n}</div>)}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          <Mini label="Brand Value" value={result.newBrandValue.toFixed(1)} />
          <Mini label="Brand pts" value={result.newBrandPts.toFixed(0)} />
          <Mini label="Loyalty" value={fmtPct(result.newLoyalty, 0)} />
          <Mini label="Ops pts" value={result.newOpsPts.toFixed(0)} />
        </div>

        {result.routeBreakdown.length > 0 && (
          <div>
            <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">
              Route breakdown
            </div>
            <div className="rounded-md border border-line overflow-hidden">
              <table className="w-full text-[0.8125rem]">
                <thead>
                  <tr className="bg-surface-2">
                    <th className="text-left font-semibold text-ink-muted uppercase tracking-wider text-[0.625rem] py-2 px-3">Route</th>
                    <th className="text-right font-semibold text-ink-muted uppercase tracking-wider text-[0.625rem] py-2 px-3">Load</th>
                    <th className="text-right font-semibold text-ink-muted uppercase tracking-wider text-[0.625rem] py-2 px-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {result.routeBreakdown.map((r) => {
                    const route = player.routes.find((x) => x.id === r.routeId);
                    return (
                      <tr key={r.routeId} className="border-t border-line">
                        <td className="py-2 px-3 text-ink font-mono">
                          {route ? `${route.originCode} → ${route.destCode}` : r.routeId}
                        </td>
                        <td className="py-2 px-3 text-right tabular">
                          {fmtPct(r.occupancy * 100, 0)}
                        </td>
                        <td className={`py-2 px-3 text-right tabular font-medium ${r.profit >= 0 ? "text-positive" : "text-negative"}`}>
                          {fmtMoney(r.profit)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={continueNext}>
          {result.quarter >= 20 ? "See endgame →" : "Continue to next quarter →"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "positive" | "negative" }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.6875rem] uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <span className={`tabular font-display text-[1.375rem] leading-none mt-1 ${tone === "positive" ? "text-positive" : "text-negative"}`}>
        {value}
      </span>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-surface p-3">
      <div className="text-[0.625rem] uppercase tracking-wider text-ink-muted">
        {label}
      </div>
      <div className="tabular font-display text-[1.125rem] text-ink mt-1 leading-none">
        {value}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr className="border-b border-line last:border-0">
      <td className="py-2 px-3 text-ink-2">{k}</td>
      <td className="py-2 px-3 text-right tabular font-mono text-ink">{v}</td>
    </tr>
  );
}
