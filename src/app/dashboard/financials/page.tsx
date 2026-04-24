"use client";

import { useState } from "react";
import { Button, Card, CardBody, CardHeader, CardTitle, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui";
import { useGame, selectPlayer } from "@/store/game";
import { fmtMoney } from "@/lib/format";
import { computeAirlineValue, effectiveBorrowingRate, maxBorrowingUsd } from "@/lib/engine";

export default function FinancialsPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [borrowAmount, setBorrowAmount] = useState(50_000_000);
  const [error, setError] = useState<string | null>(null);

  if (!player) return null;

  const airlineValue = computeAirlineValue(player);
  const debtRatio = airlineValue > 0 ? (player.totalDebtUsd / airlineValue) * 100 : 0;
  const rate = effectiveBorrowingRate(player, s.baseInterestRatePct);
  const maxBorrow = maxBorrowingUsd(player);

  const last = player.financialsByQuarter.at(-1);

  function confirmBorrow() {
    if (borrowAmount > maxBorrow) {
      setError(`Max borrowing is ${fmtMoney(maxBorrow)}`);
      return;
    }
    if (borrowAmount < 1_000_000) {
      setError("Minimum $1M");
      return;
    }
    const r = s.borrowCapital(borrowAmount);
    if (!r.ok) {
      setError(r.error ?? "Unknown error");
      return;
    }
    setBorrowOpen(false);
    setError(null);
  }

  return (
    <main className="p-6 max-w-7xl mx-auto w-full">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.75rem] text-ink leading-tight">Financials</h1>
          <p className="text-ink-2 text-[0.875rem] mt-1">
            P&amp;L, balance sheet, borrowing
          </p>
        </div>
        <Button variant="primary" onClick={() => setBorrowOpen(true)}>
          Borrow capital →
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Balance sheet</CardTitle></CardHeader>
          <CardBody className="space-y-1.5">
            <Row k="Cash" v={fmtMoney(player.cashUsd)} />
            <Row k="Fleet book value" v={fmtMoney(player.fleet.reduce((s, f) => s + f.bookValue, 0))} />
            <Row k="Total debt" v={fmtMoney(player.totalDebtUsd)} tone="neg" />
            <Row k="Airline value" v={fmtMoney(airlineValue)} bold />
            <Row k="Debt ratio" v={`${debtRatio.toFixed(1)}%`} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Borrowing</CardTitle></CardHeader>
          <CardBody className="space-y-1.5">
            <Row k="Base rate" v={`${s.baseInterestRatePct.toFixed(1)}%`} />
            <Row k="Your effective rate" v={`${rate.toFixed(2)}%`} bold />
            <Row k="Max borrowing" v={fmtMoney(maxBorrow)} />
            <Row k="Active loans" v={`${player.loans.length}`} />
            {player.loans.length > 0 && (
              <div className="mt-3 pt-3 border-t border-line space-y-1.5">
                {player.loans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between text-[0.8125rem]">
                    <span className="text-ink-muted">Loan Q{loan.originQuarter}</span>
                    <span className="tabular font-mono text-ink">
                      {fmtMoney(loan.remainingPrincipal)} @ {loan.ratePct.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Last quarter</CardTitle></CardHeader>
          <CardBody className="space-y-1.5">
            {last ? (
              <>
                <Row k="Revenue" v={fmtMoney(last.revenue)} tone="pos" />
                <Row k="Costs" v={fmtMoney(last.costs)} tone="neg" />
                <Row k="Net profit" v={fmtMoney(last.netProfit)} tone={last.netProfit >= 0 ? "pos" : "neg"} bold />
                <Row k="Brand value" v={last.brandValue.toFixed(1)} />
                <Row k="Loyalty" v={`${last.loyalty.toFixed(0)}%`} />
              </>
            ) : (
              <div className="text-ink-muted text-[0.875rem]">
                No quarter closed yet. Submit Q{s.currentQuarter} via <a className="underline" href="/dashboard/ops">Ops form</a>.
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {player.financialsByQuarter.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Quarterly history</CardTitle></CardHeader>
          <CardBody className="p-0 overflow-auto">
            <table className="w-full text-[0.8125rem]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <Th>Q</Th>
                  <Th className="text-right">Revenue</Th>
                  <Th className="text-right">Costs</Th>
                  <Th className="text-right">Net profit</Th>
                  <Th className="text-right">Cash</Th>
                  <Th className="text-right">Debt</Th>
                  <Th className="text-right">Brand</Th>
                  <Th className="text-right">Loyalty</Th>
                </tr>
              </thead>
              <tbody>
                {player.financialsByQuarter.map((q) => (
                  <tr key={q.quarter} className="border-b border-line last:border-0">
                    <Td className="font-mono">Q{q.quarter}</Td>
                    <Td className="text-right tabular font-mono">{fmtMoney(q.revenue)}</Td>
                    <Td className="text-right tabular font-mono">{fmtMoney(q.costs)}</Td>
                    <Td className={`text-right tabular font-mono font-medium ${q.netProfit >= 0 ? "text-positive" : "text-negative"}`}>
                      {fmtMoney(q.netProfit)}
                    </Td>
                    <Td className="text-right tabular font-mono">{fmtMoney(q.cash)}</Td>
                    <Td className="text-right tabular font-mono">{fmtMoney(q.debt)}</Td>
                    <Td className="text-right tabular font-mono">{q.brandValue.toFixed(1)}</Td>
                    <Td className="text-right tabular font-mono">{q.loyalty.toFixed(0)}%</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      <Modal open={borrowOpen} onClose={() => { setBorrowOpen(false); setError(null); }}>
        <ModalHeader>
          <h2 className="font-display text-[1.5rem] text-ink">Borrow capital</h2>
          <p className="text-ink-muted text-[0.8125rem] mt-1">
            Effective rate <span className="tabular font-mono text-ink">{rate.toFixed(2)}%</span> · Max <span className="tabular font-mono text-ink">{fmtMoney(maxBorrow)}</span>
          </p>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <div>
            <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">Amount</div>
            <Input
              type="number"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(parseInt(e.target.value, 10) || 0)}
              placeholder="50000000"
            />
            <div className="text-[0.75rem] text-ink-muted mt-1">
              = {fmtMoney(borrowAmount)}
            </div>
          </div>
          <div className="rounded-md border border-line bg-surface-2 p-3 space-y-1 text-[0.8125rem]">
            <Row k="Quarterly interest" v={fmtMoney(borrowAmount * (rate / 100) / 4)} />
            <Row k="After borrowing" v={`Debt ${fmtMoney(player.totalDebtUsd + borrowAmount)}`} />
          </div>
          {error && <div className="text-negative text-[0.875rem]">{error}</div>}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => { setBorrowOpen(false); setError(null); }}>Cancel</Button>
          <Button variant="primary" onClick={confirmBorrow}>Confirm borrow</Button>
        </ModalFooter>
      </Modal>
    </main>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted ${className ?? ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-top ${className ?? ""}`}>{children}</td>;
}
function Row({ k, v, tone, bold }: { k: string; v: string; tone?: "pos" | "neg"; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[0.8125rem] text-ink-muted">{k}</span>
      <span className={`tabular font-mono ${tone === "pos" ? "text-positive" : tone === "neg" ? "text-negative" : "text-ink"} ${bold ? "font-semibold" : ""}`}>
        {v}
      </span>
    </div>
  );
}
