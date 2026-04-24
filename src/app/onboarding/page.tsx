"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES } from "@/data/cities";
import { DOCTRINES } from "@/data/doctrines";
import { fmtMoney } from "@/lib/format";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { useGame } from "@/store/game";
import { cn } from "@/lib/cn";
import type { DoctrineId } from "@/types/game";

const TIER1_HUBS = CITIES
  .filter((c) => c.tier === 1)
  .sort((a, b) => a.name.localeCompare(b.name));

export default function Onboarding() {
  const router = useRouter();
  const startNewGame = useGame((s) => s.startNewGame);

  const [step, setStep] = useState(0);
  const [airlineName, setAirlineName] = useState("");
  const [code, setCode] = useState("");
  const [doctrine, setDoctrine] = useState<DoctrineId>("premium-service");
  const [hubCode, setHubCode] = useState("LHR");
  const [teamCount, setTeamCount] = useState(5);

  const canAdvance =
    (step === 0 && airlineName.trim().length > 2 && code.trim().length >= 2) ||
    (step === 1) ||
    (step === 2) ||
    (step === 3);

  function finish() {
    startNewGame({
      airlineName: airlineName.trim(),
      code: code.trim().toUpperCase(),
      doctrine,
      hubCode,
      teamCount,
    });
    router.push("/dashboard");
  }

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-8 py-5 border-b border-line flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl text-ink">SkyForce</span>
          <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
            Q1 Brand Building
          </span>
        </div>
        <div className="text-[0.75rem] text-ink-muted tabular">
          Step {step + 1} of 4
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-3xl">
          {/* Progress rule */}
          <div className="flex gap-2 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-0.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-line",
                )}
              />
            ))}
          </div>

          {step === 0 && (
            <Step title="Name your airline" sub="Who are you? Your board is watching from Q2.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Airline name">
                  <Input
                    value={airlineName}
                    onChange={(e) => setAirlineName(e.target.value)}
                    placeholder="e.g. Meridian Air"
                    autoFocus
                  />
                </Field>
                <Field label="IATA code (2–3 letters)">
                  <Input
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))
                    }
                    placeholder="e.g. MRD"
                  />
                </Field>
              </div>
              <p className="text-ink-muted text-[0.8125rem] mt-4">
                Tip: Your code appears on the leaderboard and in route tables. Pick something memorable.
              </p>
            </Step>
          )}

          {step === 1 && (
            <Step title="Choose your doctrine" sub="Shapes bonuses across the entire simulation. Cannot change.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DOCTRINES.map((d) => {
                  const active = doctrine === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setDoctrine(d.id)}
                      className={cn(
                        "text-left rounded-lg border p-5 transition-all",
                        active
                          ? "border-primary bg-[rgba(20,53,94,0.04)] shadow-[var(--shadow-1)]"
                          : "border-line hover:border-line-strong hover:bg-surface-hover",
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-display text-[1.5rem] text-primary">
                          {d.icon}
                        </span>
                        <span className="font-semibold text-ink">{d.name}</span>
                      </div>
                      <p className="italic text-ink-2 text-[0.8125rem] mb-3">&ldquo;{d.tagline}&rdquo;</p>
                      <p className="text-ink-2 text-[0.875rem] leading-relaxed mb-3">
                        {d.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.effects.map((e) => (
                          <Badge key={e} tone={active ? "primary" : "neutral"}>
                            {e}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {step === 2 && (
            <Step
              title="Pick your hub"
              sub={`Tier-1 airports only. Hub terminal fees apply every quarter.`}
            >
              <Card>
                <CardBody className="max-h-96 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-2 p-3">
                  {TIER1_HUBS.map((city) => {
                    const active = hubCode === city.code;
                    return (
                      <button
                        key={city.code}
                        onClick={() => setHubCode(city.code)}
                        className={cn(
                          "flex items-center justify-between rounded-md border px-3 py-2 text-left transition-colors",
                          active
                            ? "border-primary bg-[rgba(20,53,94,0.04)]"
                            : "border-line hover:bg-surface-hover",
                        )}
                      >
                        <div>
                          <div className="font-medium text-ink text-[0.9375rem]">
                            {city.name}
                          </div>
                          <div className="text-[0.75rem] text-ink-muted">
                            {city.regionName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[0.8125rem] text-primary">
                            {city.code}
                          </div>
                          <div className="text-[0.6875rem] text-ink-muted tabular">
                            ×{city.amplifier.toFixed(1)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardBody>
              </Card>
            </Step>
          )}

          {step === 3 && (
            <Step title="Confirm and launch" sub="You'll start Q2 with $150M cash and 2× A320s.">
              <Card>
                <CardBody>
                  <Row k="Airline" v={`${airlineName} (${code})`} />
                  <Row k="Doctrine" v={DOCTRINES.find((d) => d.id === doctrine)?.name ?? ""} />
                  <Row
                    k="Hub"
                    v={`${CITIES.find((c) => c.code === hubCode)?.name} · ${hubCode}`}
                  />
                  <Row k="Seed capital" v={fmtMoney(150_000_000)} />
                  <Row k="Starting fleet" v="2× Airbus A320" />
                </CardBody>
              </Card>
              <div className="mt-5">
                <Field label="Number of teams in simulation">
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={2}
                      max={10}
                      value={teamCount}
                      onChange={(e) => setTeamCount(parseInt(e.target.value, 10))}
                      className="flex-1 accent-primary"
                    />
                    <span className="tabular font-mono text-ink text-[0.9375rem] w-6 text-right">
                      {teamCount}
                    </span>
                  </div>
                </Field>
              </div>
            </Step>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}
            >
              ← {step === 0 ? "Back to landing" : "Back"}
            </Button>
            {step < 3 ? (
              <Button
                variant="primary"
                disabled={!canAdvance}
                onClick={() => setStep(step + 1)}
              >
                Continue →
              </Button>
            ) : (
              <Button variant="primary" onClick={finish}>
                Launch airline →
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Step({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="font-display text-4xl text-ink leading-tight mb-2">{title}</h1>
      <p className="text-ink-2 text-[0.9375rem] mb-8">{sub}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-line last:border-0">
      <span className="text-[0.8125rem] uppercase tracking-wider text-ink-muted">{k}</span>
      <span className="text-ink font-medium">{v}</span>
    </div>
  );
}
