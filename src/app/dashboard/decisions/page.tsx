"use client";

import { useState } from "react";
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { SCENARIOS, SCENARIOS_BY_QUARTER, type ScenarioOption } from "@/data/scenarios";
import { useGame, selectPlayer } from "@/store/game";
import { cn } from "@/lib/cn";

export default function DecisionsPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const submit = useGame((g) => g.submitDecision);

  if (!player) return null;

  const currentScenarios = SCENARIOS_BY_QUARTER[s.currentQuarter] ?? [];
  const pastDecisions = player.decisions;

  return (
    <main className="p-6 max-w-5xl mx-auto w-full">
      <header className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display text-[1.75rem] text-ink leading-tight">Board decisions</h1>
          <p className="text-ink-2 text-[0.875rem] mt-1">
            Scenarios are final once submitted. Timeout auto-submits the worst option.
          </p>
        </div>
      </header>

      {currentScenarios.length === 0 ? (
        <Card><CardBody className="text-ink-muted text-[0.875rem]">
          No board decision this quarter. Watch the <a className="underline" href="/dashboard/news">world news</a> for what is coming.
        </CardBody></Card>
      ) : (
        <div className="space-y-4">
          {currentScenarios.map((sc) => {
            const submitted = player.decisions.find(
              (d) => d.scenarioId === sc.id && d.quarter === s.currentQuarter,
            );
            return (
              <ScenarioCard
                key={sc.id}
                scenario={sc}
                submittedOptionId={submitted?.optionId ?? null}
                onSubmit={(optionId) => submit({ scenarioId: sc.id, optionId: optionId as "A" | "B" | "C" | "D" | "E" })}
              />
            );
          })}
        </div>
      )}

      {pastDecisions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-[1.25rem] text-ink mb-3">Past decisions</h2>
          <Card><CardBody className="p-0">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="bg-surface-2 border-b border-line">
                  <th className="text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Quarter</th>
                  <th className="text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Scenario</th>
                  <th className="text-left px-3 py-2 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Your choice</th>
                </tr>
              </thead>
              <tbody>
                {pastDecisions.map((d) => {
                  const sc = SCENARIOS.find((x) => x.id === d.scenarioId);
                  if (!sc) return null;
                  const opt = sc.options.find((o) => o.id === d.optionId);
                  return (
                    <tr key={`${d.scenarioId}-${d.quarter}`} className="border-b border-line last:border-0">
                      <td className="px-3 py-2 font-mono tabular">Q{d.quarter}</td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-primary mr-1.5">{sc.id}</span>
                        {sc.title}
                      </td>
                      <td className="px-3 py-2 text-ink-2">
                        <span className="font-mono text-accent mr-1.5">{d.optionId}</span>
                        {opt?.label}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardBody></Card>
        </section>
      )}
    </main>
  );
}

function ScenarioCard({
  scenario,
  submittedOptionId,
  onSubmit,
}: {
  scenario: (typeof SCENARIOS)[number];
  submittedOptionId: string | null;
  onSubmit: (optionId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const locked = !!submittedOptionId;

  const severityTone =
    scenario.severity === "CATASTROPHIC" || scenario.severity === "HIGH"
      ? "negative"
      : scenario.severity === "MEDIUM"
        ? "warning"
        : "neutral";

  return (
    <Card elevated>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Badge tone={severityTone}>Severity · {scenario.severity}</Badge>
          <span className="font-mono text-[0.75rem] text-primary">{scenario.id}</span>
          <span className="text-[0.6875rem] uppercase tracking-wider text-ink-muted">
            Q{scenario.quarter} · {scenario.timeLimitMinutes}m limit
          </span>
        </div>
        {locked && <Badge tone="primary">Submitted</Badge>}
      </CardHeader>
      <CardBody className="space-y-4">
        <h3 className="font-display text-[1.625rem] text-ink leading-tight">
          {scenario.title}
        </h3>
        <p className="italic text-ink-2 text-[0.9375rem] leading-relaxed">
          {scenario.teaser}
        </p>
        <p className="text-ink-2 text-[0.9375rem] leading-relaxed">{scenario.context}</p>

        <div className="space-y-2">
          {scenario.options.map((opt) => {
            const isSelected = locked ? opt.id === submittedOptionId : opt.id === selected;
            return (
              <button
                key={opt.id}
                onClick={() => !locked && setSelected(opt.id)}
                disabled={locked}
                className={cn(
                  "w-full text-left rounded-md border px-4 py-3 transition-all",
                  isSelected
                    ? "border-primary bg-[rgba(20,53,94,0.04)]"
                    : "border-line hover:bg-surface-hover",
                  locked && !isSelected && "opacity-50",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-[0.875rem] text-accent shrink-0 w-5 mt-0.5">
                    {opt.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink">{opt.label}</div>
                    <div className="text-[0.875rem] text-ink-2 mt-0.5 leading-relaxed">
                      {opt.description}
                    </div>
                    {opt.effectTags && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {opt.effectTags.map((t) => (
                          <Badge key={t} tone="neutral">{t}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {!locked && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-[0.8125rem] text-ink-muted">
              {selected ? `Option ${selected} selected` : "Pick an option to submit"}
            </span>
            <Button
              variant="primary"
              disabled={!selected}
              onClick={() => selected && onSubmit(selected)}
            >
              Submit decision
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
