"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES } from "@/data/cities";
import { DOCTRINES } from "@/data/doctrines";
import { fmtMoney } from "@/lib/format";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { useGame } from "@/store/game";
import { cn } from "@/lib/cn";
import type { DoctrineId, Team } from "@/types/game";

const TIER1_HUBS = CITIES
  .filter((c) => c.tier === 1)
  .sort((a, b) => a.name.localeCompare(b.name));

const STEP_COUNT = 9;

type MarketFocus = Team["marketFocus"];
type GeographicPriority = Team["geographicPriority"];
type PricingPhilosophy = Team["pricingPhilosophy"];
type SalaryPhilosophy = Team["salaryPhilosophy"];
type MarketingLevel = Team["marketingLevel"];
type CsrTheme = Team["csrTheme"];

export default function Onboarding() {
  const router = useRouter();
  const startNewGame = useGame((s) => s.startNewGame);

  const [step, setStep] = useState(0);
  // Step 1
  const [airlineName, setAirlineName] = useState("");
  const [code, setCode] = useState("");
  const [tagline, setTagline] = useState("");
  // Step 2
  const [doctrine, setDoctrine] = useState<DoctrineId>("premium-service");
  // Step 3
  const [hubCode, setHubCode] = useState("LHR");
  // Step 4
  const [marketFocus, setMarketFocus] = useState<MarketFocus>("balanced");
  const [geoPriority, setGeoPriority] = useState<GeographicPriority>("global");
  // Step 5
  const [pricing, setPricing] = useState<PricingPhilosophy>("standard");
  // Step 6
  const [salary, setSalary] = useState<SalaryPhilosophy>("at");
  // Step 7
  const [marketing, setMarketing] = useState<MarketingLevel>("medium");
  // Step 8
  const [csr, setCsr] = useState<CsrTheme>("none");
  // Step 9
  const [teamCount, setTeamCount] = useState(5);
  const [presentationRank, setPresentationRank] = useState<1 | 2 | 3 | 4 | 5>(3);

  const canAdvance =
    (step === 0 && airlineName.trim().length > 2 && code.trim().length >= 2) ||
    (step >= 1 && step <= STEP_COUNT - 1);

  function finish() {
    startNewGame({
      airlineName: airlineName.trim(),
      code: code.trim().toUpperCase(),
      doctrine,
      hubCode,
      teamCount,
      tagline: tagline.trim(),
      marketFocus,
      geographicPriority: geoPriority,
      pricingPhilosophy: pricing,
      salaryPhilosophy: salary,
      marketingLevel: marketing,
      csrTheme: csr,
      l0Rank: presentationRank,
    });
    router.push("/");
  }

  return (
    <main className="flex-1 flex flex-col">
      <header className="px-8 py-5 border-b border-line flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl text-ink">SkyForce</span>
          <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
            Q1 Brand Building · L0
          </span>
        </div>
        <div className="text-[0.75rem] text-ink-muted tabular">
          Step {step + 1} of {STEP_COUNT}
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-3xl">
          <div className="flex gap-1.5 mb-10">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
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
            <Step title="Name your airline" sub="Who you are. Tagline goes on every boarding pass.">
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
                <div className="md:col-span-2">
                  <Field label="Tagline (optional)">
                    <Input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="e.g. Cross continents, keep promises."
                    />
                  </Field>
                </div>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step title="Choose your doctrine" sub="Shapes bonuses across the entire simulation. Permanent.">
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
                      <p className="italic text-ink-2 text-[0.8125rem] mb-3">
                        &ldquo;{d.tagline}&rdquo;
                      </p>
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
            <Step title="Pick your hub" sub="Tier-1 airports. +18% attractiveness on all routes through this airport.">
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
                          <div className="font-medium text-ink text-[0.9375rem]">{city.name}</div>
                          <div className="text-[0.75rem] text-ink-muted">{city.regionName}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-[0.8125rem] text-primary">{city.code}</div>
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
            <Step title="Strategy declaration" sub="Your market focus and geographic priority.">
              <div className="space-y-6">
                <div>
                  <SubLabel>Market focus</SubLabel>
                  <div className="grid grid-cols-3 gap-2">
                    {(["passenger", "balanced", "cargo"] as MarketFocus[]).map((m) => (
                      <PillButton
                        key={m}
                        active={marketFocus === m}
                        onClick={() => setMarketFocus(m)}
                      >
                        <div className="font-medium capitalize">{m}</div>
                        <div className="text-[0.6875rem] text-ink-muted mt-0.5">
                          {m === "passenger" ? "People first" : m === "cargo" ? "Logistics engine" : "Diversified book"}
                        </div>
                      </PillButton>
                    ))}
                  </div>
                </div>
                <div>
                  <SubLabel>Geographic priority</SubLabel>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {(["north-america", "europe", "asia-pacific", "middle-east", "global"] as GeographicPriority[]).map((g) => (
                      <PillButton
                        key={g}
                        active={geoPriority === g}
                        onClick={() => setGeoPriority(g)}
                      >
                        <div className="font-medium text-[0.8125rem] capitalize">
                          {g.replace("-", " ")}
                        </div>
                      </PillButton>
                    ))}
                  </div>
                </div>
              </div>
            </Step>
          )}

          {step === 4 && (
            <Step title="Pricing philosophy" sub="Sets your default pricing tier. Per-route overrides still work.">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  { v: "budget",   lbl: "Budget",          sub: "−20% fares, volume play" },
                  { v: "standard", lbl: "Standard",        sub: "Market rate" },
                  { v: "premium",  lbl: "Premium",         sub: "+25% fares, lower volume" },
                  { v: "ultra",    lbl: "Ultra-premium",   sub: "+60% fares, luxury routes" },
                ] as const).map((p) => (
                  <PillButton
                    key={p.v}
                    active={pricing === p.v}
                    onClick={() => setPricing(p.v)}
                  >
                    <div className="font-medium">{p.lbl}</div>
                    <div className="text-[0.6875rem] text-ink-muted mt-0.5">{p.sub}</div>
                  </PillButton>
                ))}
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step title="Salary philosophy" sub="Sets your initial Staff slider. Affects loyalty + strike risk.">
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "below", lbl: "Below market",  sub: "−25% wages · risk" },
                  { v: "at",    lbl: "At market",     sub: "Baseline" },
                  { v: "above", lbl: "Above market",  sub: "+10% wages · stability" },
                ] as const).map((p) => (
                  <PillButton
                    key={p.v}
                    active={salary === p.v}
                    onClick={() => setSalary(p.v)}
                  >
                    <div className="font-medium">{p.lbl}</div>
                    <div className="text-[0.6875rem] text-ink-muted mt-0.5">{p.sub}</div>
                  </PillButton>
                ))}
              </div>
            </Step>
          )}

          {step === 6 && (
            <Step title="Marketing budget" sub="Initial Marketing slider. Brand Pts grow faster with higher spend.">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  { v: "low",        lbl: "Low",         sub: "3% of revenue" },
                  { v: "medium",     lbl: "Medium",      sub: "6% of revenue" },
                  { v: "high",       lbl: "High",        sub: "10% of revenue" },
                  { v: "aggressive", lbl: "Aggressive",  sub: "15% of revenue" },
                ] as const).map((p) => (
                  <PillButton
                    key={p.v}
                    active={marketing === p.v}
                    onClick={() => setMarketing(p.v)}
                  >
                    <div className="font-medium">{p.lbl}</div>
                    <div className="text-[0.6875rem] text-ink-muted mt-0.5">{p.sub}</div>
                  </PillButton>
                ))}
              </div>
            </Step>
          )}

          {step === 7 && (
            <Step title="CSR theme" sub="Your corporate social responsibility story. Flavor + end-game tints.">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {([
                  { v: "environment", lbl: "Environment", sub: "SAF, offsets, green story" },
                  { v: "community",   lbl: "Community",   sub: "Regional access, equity" },
                  { v: "employees",   lbl: "Employees",   sub: "People-first investment" },
                  { v: "none",        lbl: "None",        sub: "Pure business focus" },
                ] as const).map((p) => (
                  <PillButton
                    key={p.v}
                    active={csr === p.v}
                    onClick={() => setCsr(p.v)}
                  >
                    <div className="font-medium">{p.lbl}</div>
                    <div className="text-[0.6875rem] text-ink-muted mt-0.5">{p.sub}</div>
                  </PillButton>
                ))}
              </div>
            </Step>
          )}

          {step === 8 && (
            <Step title="Final board review" sub="L0 presentation outcome + simulation scale.">
              <Card className="mb-5">
                <CardBody>
                  <Row k="Airline" v={`${airlineName} (${code})${tagline ? ` · "${tagline}"` : ""}`} />
                  <Row k="Doctrine" v={DOCTRINES.find((d) => d.id === doctrine)?.name ?? ""} />
                  <Row k="Hub" v={`${CITIES.find((c) => c.code === hubCode)?.name} · ${hubCode}`} />
                  <Row k="Market focus" v={marketFocus} />
                  <Row k="Geography" v={geoPriority.replace("-", " ")} />
                  <Row k="Pricing" v={pricing} />
                  <Row k="Salary policy" v={salary} />
                  <Row k="Marketing" v={marketing} />
                  <Row k="CSR theme" v={csr} />
                </CardBody>
              </Card>

              <div className="mb-5">
                <SubLabel>L0 Brand Building — presentation rank</SubLabel>
                <div className="grid grid-cols-5 gap-1.5">
                  {([1, 2, 3, 4, 5] as const).map((r) => {
                    const injections = ["+$80M", "+$60M", "+$40M", "+$20M", "$0"];
                    return (
                      <PillButton
                        key={r}
                        active={presentationRank === r}
                        onClick={() => setPresentationRank(r)}
                      >
                        <div className="font-display text-[1.125rem]">{r}<span className="text-[0.625rem] text-ink-muted ml-1">
                          {r === 1 ? "st" : r === 2 ? "nd" : r === 3 ? "rd" : "th"}
                        </span></div>
                        <div className="text-[0.6875rem] text-ink-muted mt-0.5">{injections[r - 1]}</div>
                      </PillButton>
                    );
                  })}
                </div>
                <div className="text-[0.6875rem] text-ink-muted mt-2">
                  Rank by facilitator judgement of your Q1 presentation. In a live SkyForce session, this is set by the scoring panel; set it honestly here to calibrate your Q2 start.
                </div>
              </div>

              <div>
                <SubLabel>Number of teams in simulation</SubLabel>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={10}
                    value={teamCount}
                    onChange={(e) => setTeamCount(parseInt(e.target.value, 10))}
                    className="flex-1 accent-primary"
                  />
                  <span className="tabular font-mono text-ink text-[0.9375rem] w-6 text-right">{teamCount}</span>
                </div>
              </div>

              <div className="mt-6 text-[0.75rem] text-ink-muted">
                Starting capital: {fmtMoney(150_000_000)} seed +{" "}
                {presentationRank === 1 ? "$80M" : presentationRank === 2 ? "$60M"
                  : presentationRank === 3 ? "$40M" : presentationRank === 4 ? "$20M" : "$0"} L0 injection · 2× A320s
              </div>
            </Step>
          )}

          <div className="flex items-center justify-between mt-10">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}
            >
              ← {step === 0 ? "Back to landing" : "Back"}
            </Button>
            {step < STEP_COUNT - 1 ? (
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
  title, sub, children,
}: {
  title: string; sub: string; children: React.ReactNode;
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

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">
      {children}
    </div>
  );
}

function PillButton({
  active, onClick, children,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left rounded-md border px-3 py-2.5 transition-colors text-[0.8125rem]",
        active
          ? "border-primary bg-[rgba(20,53,94,0.06)] text-ink font-medium"
          : "border-line text-ink-2 hover:bg-surface-hover",
      )}
    >
      {children}
    </button>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between py-2 border-b border-line last:border-0">
      <span className="text-[0.8125rem] uppercase tracking-wider text-ink-muted">{k}</span>
      <span className="text-ink font-medium capitalize text-right truncate max-w-[60%]">{v}</span>
    </div>
  );
}
