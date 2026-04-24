"use client";

import { Badge, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";
import { NEWS_BY_QUARTER, WORLD_NEWS } from "@/data/world-news";
import { useGame } from "@/store/game";
import type { NewsItem } from "@/types/game";

export default function NewsPage() {
  const currentQuarter = useGame((s) => s.currentQuarter);
  const today = NEWS_BY_QUARTER[currentQuarter] ?? [];

  // Show current quarter + next quarter preview (3-quarter forecast stub)
  const forecast = [currentQuarter + 1, currentQuarter + 2]
    .filter((q) => q <= 20)
    .map((q) => ({ q, items: NEWS_BY_QUARTER[q] ?? [] }));

  return (
    <main className="p-6 max-w-4xl mx-auto w-full">
      <header className="mb-6">
        <h1 className="font-display text-[1.75rem] text-ink leading-tight">
          World news · Q{currentQuarter}
        </h1>
        <p className="text-ink-2 text-[0.875rem] mt-1">
          Five headlines this quarter. Impacts apply at quarter close.
        </p>
      </header>

      <div className="space-y-3 mb-10">
        {today.map((item) => <NewsRow key={item.id} item={item} />)}
      </div>

      {forecast.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-[1.25rem] text-ink mb-3">
            Upcoming (next {forecast.length} quarter{forecast.length > 1 ? "s" : ""})
          </h2>
          {forecast.map((f) => (
            <Card key={f.q} className="mb-3">
              <CardHeader>
                <CardTitle>Q{f.q} preview</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="space-y-3 opacity-70">
                  {f.items.slice(0, 3).map((item) => <NewsRow key={item.id} item={item} compact />)}
                </div>
              </CardBody>
            </Card>
          ))}
        </section>
      )}
    </main>
  );
}

function NewsRow({ item, compact = false }: { item: NewsItem; compact?: boolean }) {
  return (
    <div className="flex gap-4 items-start">
      <span className={`${compact ? "text-[1rem]" : "text-[1.25rem]"} text-ink-muted mt-0.5 w-6 text-center`}>
        {item.icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge tone={newsTone(item.impact)}>{item.impact.toUpperCase()}</Badge>
        </div>
        <div className="text-ink font-medium text-[0.9375rem] leading-snug">
          {item.headline}
        </div>
        <div className="text-[0.8125rem] text-ink-muted mt-0.5 leading-relaxed">
          {item.detail}
        </div>
      </div>
    </div>
  );
}

function newsTone(
  impact: NewsItem["impact"],
): "neutral" | "primary" | "accent" | "positive" | "negative" | "warning" | "info" {
  switch (impact) {
    case "tourism": return "accent";
    case "business": return "primary";
    case "cargo": return "positive";
    case "brand": return "info";
    case "fuel": return "warning";
    case "ops": return "negative";
    default: return "neutral";
  }
}
