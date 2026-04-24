"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { useGame } from "@/store/game";
import { fmtMoney } from "@/lib/format";

export default function AdminPage() {
  const s = useGame();
  const router = useRouter();

  return (
    <main className="flex-1 px-8 py-10 max-w-4xl mx-auto w-full">
      <header className="mb-8">
        <Badge tone="warning">Admin · single-team MVP</Badge>
        <h1 className="font-display text-[2.5rem] text-ink leading-tight mt-3">Facilitator controls</h1>
        <p className="text-ink-2 text-[0.9375rem] mt-2 max-w-[60ch]">
          Full PRD §10 admin portal (quarter open/close, scenario overrides, live sim outcome entry,
          market admin, team overrides, audit log) requires Supabase backing. For the single-team
          demo these controls cover: reset, advance quarter, inspect state.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader><CardTitle>Game state</CardTitle></CardHeader>
          <CardBody className="text-[0.875rem] space-y-1.5">
            <Row k="Phase" v={s.phase} />
            <Row k="Current quarter" v={`Q${s.currentQuarter} / 20`} />
            <Row k="Fuel index" v={s.fuelIndex.toFixed(0)} />
            <Row k="Base rate" v={`${s.baseInterestRatePct.toFixed(1)}%`} />
            <Row k="Teams" v={`${s.teams.length}`} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick actions</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              → Open team dashboard
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                if (confirm("This wipes all game state. Continue?")) {
                  s.resetGame();
                  router.push("/");
                }
              }}
            >
              Reset simulation
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Teams</CardTitle></CardHeader>
        <CardBody className="p-0">
          {s.teams.length === 0 ? (
            <div className="px-4 py-6 text-ink-muted text-[0.875rem]">
              No simulation active. <Link href="/onboarding" className="underline">Start one</Link>.
            </div>
          ) : (
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <Th>Airline</Th><Th>Hub</Th><Th className="text-right">Cash</Th>
                  <Th className="text-right">Brand Value</Th><Th className="text-right">Loyalty</Th><Th>Role</Th>
                </tr>
              </thead>
              <tbody>
                {s.teams.map((t) => (
                  <tr key={t.id} className="border-b border-line last:border-0">
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-5 h-5 rounded flex items-center justify-center font-mono text-[0.625rem] text-primary-fg" style={{background: t.color}}>
                          {t.code}
                        </span>
                        {t.name}
                      </div>
                    </Td>
                    <Td className="font-mono">{t.hubCode}</Td>
                    <Td className="text-right tabular font-mono">{fmtMoney(t.cashUsd)}</Td>
                    <Td className="text-right tabular font-mono">{t.brandValue.toFixed(1)}</Td>
                    <Td className="text-right tabular font-mono">{t.customerLoyaltyPct.toFixed(0)}%</Td>
                    <Td>{t.isPlayer ? <Badge tone="primary">Player</Badge> : <Badge tone="neutral">Rival</Badge>}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </main>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted ${className ?? ""}`}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle ${className ?? ""}`}>{children}</td>;
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-ink-muted">{k}</span>
      <span className="tabular font-mono text-ink">{v}</span>
    </div>
  );
}
