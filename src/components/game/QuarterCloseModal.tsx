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
              <Row k="Interest" v={fmtMoney(result.interest)} />
              <Row k="Tax (20% on pretax)" v={fmtMoney(result.tax)} />
            </tbody>
          </table>
        </div>

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
