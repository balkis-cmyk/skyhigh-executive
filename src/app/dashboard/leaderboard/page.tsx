"use client";

import { Badge, Card, CardBody } from "@/components/ui";
import { useGame } from "@/store/game";
import { fmtMoney, fmtPct } from "@/lib/format";
import { fleetCount } from "@/lib/engine";

export default function LeaderboardPage() {
  const s = useGame();
  const ranked = [...s.teams].sort((a, b) => b.brandValue - a.brandValue);

  return (
    <main className="p-6 max-w-5xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="font-display text-[1.75rem] text-ink leading-tight">Leaderboard</h1>
        <p className="text-ink-2 text-[0.875rem] mt-1">
          Ranked by Brand Value. Competitors' financial details are hidden — rank + BV only.
        </p>
      </header>

      <Card>
        <CardBody className="p-0">
          <table className="w-full text-[0.875rem]">
            <thead>
              <tr className="bg-surface-2 border-b border-line">
                <Th>#</Th>
                <Th>Airline</Th>
                <Th>Hub</Th>
                <Th className="text-right">Brand value</Th>
                <Th className="text-right">Routes</Th>
                <Th className="text-right">Fleet</Th>
                <Th className="text-right">Loyalty</Th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t, i) => {
                const isPlayer = t.isPlayer;
                return (
                  <tr
                    key={t.id}
                    className={`border-b border-line last:border-0 ${isPlayer ? "bg-[rgba(20,53,94,0.04)]" : ""}`}
                  >
                    <Td className="font-mono text-ink-muted">{i + 1}</Td>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="inline-block w-6 h-6 rounded flex items-center justify-center font-mono text-[0.625rem] font-semibold text-primary-fg"
                          style={{ background: t.color }}
                        >
                          {t.code}
                        </span>
                        <span className={`${isPlayer ? "font-semibold text-ink" : "text-ink-2"}`}>
                          {t.name}
                        </span>
                        {isPlayer && <Badge tone="primary">You</Badge>}
                      </div>
                    </Td>
                    <Td className="font-mono text-[0.8125rem] text-ink-muted">{t.hubCode}</Td>
                    <Td className="text-right tabular font-display text-[1rem] text-ink">
                      {t.brandValue.toFixed(1)}
                    </Td>
                    <Td className="text-right tabular font-mono">
                      {isPlayer ? t.routes.filter((r) => r.status === "active").length : "—"}
                    </Td>
                    <Td className="text-right tabular font-mono">
                      {isPlayer ? fleetCount(t.fleet) : "—"}
                    </Td>
                    <Td className="text-right tabular font-mono">
                      {isPlayer ? fmtPct(t.customerLoyaltyPct, 0) : "—"}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </main>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-3 py-3 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted ${className ?? ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-middle ${className ?? ""}`}>{children}</td>;
}
