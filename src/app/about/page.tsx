"use client";

/**
 * /about — long-form marketing page that drills past the landing
 * hero. Anchored sections (#how, #features, #doctrines, #faq,
 * #facilitators) so footer links from other pages resolve.
 */

import Link from "next/link";
import {
  ArrowRight, Sparkles, Plane, ClipboardList, Calendar,
  CheckCircle2, MapPin, Users, Trophy, Wallet,
} from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function AboutPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
      <MarketingHeader current="about" />

      <main>
        {/* Hero */}
        <section className="relative bg-white border-b border-slate-100">
          <div className="max-w-4xl mx-auto px-6 py-20 lg:py-24 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-100 mb-6">
              <Sparkles className="w-3 h-3 text-cyan-600" />
              <span className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider">
                About SkyForce
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-900 mb-6 leading-[1.05]">
              The simulation
              <br />
              <span className="text-slate-500">consultancies actually use.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              SkyForce was built by ICAN MENA for boards and operating teams
              that need a strategy lab — not a board game. Capital allocation,
              fleet decisions, crisis response, all running on the same
              quarter-by-quarter loop.
            </p>
          </div>
        </section>

        {/* How it works */}
        <Section
          id="how"
          eyebrow="How a quarter plays"
          heading="Five steps. Two-to-three minutes after the first one."
          accent="cyan"
        >
          <ol className="space-y-6 mt-8">
            <Step n={1} title="Open and price routes" desc="Click your departure city, click your destination, pick aircraft, set per-class fares. Bid for slots if the airport's full. The launch flow checks physics-real frequency caps for every spec." />
            <Step n={2} title="Tune the ops sliders" desc="Six dials shape payroll, brand, loyalty, and cost discipline. Each tick has a real downstream effect — service at 5 lifts loyalty but blows up payroll." />
            <Step n={3} title="Resolve any board scenarios" desc="Some quarters ship a boardroom decision. Cyber breach. Hedge timing. Government deals. Each option is a real trade-off — one outcome wins this quarter, costs next." />
            <Step n={4} title="Click Next Quarter" desc="The engine settles fuel, demand, cargo, fares, costs, payroll, debt service, brand drift, milestones — and writes the digest." />
            <Step n={5} title="Read, adapt, repeat" desc="Quarter close shows what happened. Then you walk into the next quarter." />
          </ol>
        </Section>

        {/* Features */}
        <Section
          id="features"
          eyebrow="What you control"
          heading="Every lever a real airline pulls."
          accent="violet"
          tone="dim"
        >
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 mt-8">
            {[
              { icon: <Plane />, title: "Fleet & cabin", text: "40+ aircraft families. Custom cabin layouts. Engine retrofits, eco upgrades, fuselage coatings." },
              { icon: <MapPin />, title: "Network & slots", text: "380+ cities. Bid against rivals at scarce airports. Per-class fares with physics-real schedule caps." },
              { icon: <Wallet />, title: "Finance", text: "Term loans, RCF, lease residuals, fuel hedging. Tax-loss carry-forward. CFO-grade cash discipline." },
              { icon: <Users />, title: "People & ops", text: "Six dials — staff, marketing, service, rewards, ops, customer service. Brand and loyalty curves follow." },
              { icon: <ClipboardList />, title: "Board scenarios", text: "18 quarterly decisions ripple for years. Locked-in choices reshape strategy mid-game." },
              { icon: <Trophy />, title: "Endgame scoring", text: "Airline value at Q40 = brand × ops × loyalty × cash. Comeback bonuses, debt-stress callouts, legacy title." },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-violet-50 ring-4 ring-violet-100 text-violet-700 flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Doctrines */}
        <Section
          id="doctrines"
          eyebrow="Pick a strategy"
          heading="Four doctrines. Pick one. Live with it."
          accent="emerald"
        >
          <div className="grid md:grid-cols-2 gap-5 mt-8">
            {[
              { name: "Budget Airline", desc: "Build around access and efficiency. Reach price-sensitive travelers. Downturns hit harder." },
              { name: "Premium Airline", desc: "Compete on service, brand, cabin quality. Price above market. Pay for it in payroll." },
              { name: "Cargo Dominance", desc: "Use every connection as a logistics corridor. Cargo capacity compounds." },
              { name: "Global Network", desc: "Grow a connected international system. Mixed fleet brands cost more to maintain." },
            ].map((d) => (
              <div key={d.name} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-base font-semibold text-slate-900 mb-1.5">{d.name}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* For facilitators */}
        <Section
          id="facilitators"
          eyebrow="For facilitators"
          heading="Run a workshop or classroom session."
          accent="amber"
          tone="dim"
        >
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <p className="text-base text-slate-600 leading-relaxed mb-4">
                Generate a 4-digit code, share it with the room, watch teams
                claim seats from their own laptops. Switch the active view,
                force quarter-close, push live admin overrides, review the
                audit log — all from one console.
              </p>
              <Link
                href="/facilitator"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-slate-700"
              >
                Open the facilitator console <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="space-y-2.5">
              {[
                "4-digit join code, lockable lobby, reissue support",
                "Per-team view switching for live coaching moments",
                "Force-close + reopen quarter with full audit log",
                "Live sims for L0–L7 outcomes during the run",
                "Cohort licensing available — email hello@icanmena.com",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  {line}
                </li>
              ))}
            </ul>
          </div>
        </Section>

        {/* FAQ */}
        <Section
          id="faq"
          eyebrow="Common questions"
          heading="FAQ."
          accent="cyan"
        >
          <dl className="mt-8 grid md:grid-cols-2 gap-x-10 gap-y-7">
            {[
              { q: "How long is a session?", a: "Solo: 30 min for the first quarter, 2-3 min per quarter after. Cohort sessions usually run 2-4 hours and cover 8-12 quarters with discussion between rounds." },
              { q: "Can I save and resume?", a: "Yes. Solo runs persist in your browser; quarter snapshots can be exported as JSON. Multiplayer state lives server-side and reconnects on refresh." },
              { q: "Is there a tutorial?", a: "The first solo run walks you through Q1 brand-building. The map HUD explains route picking step-by-step until you've launched a route." },
              { q: "Can I review past decisions?", a: "Yes. The endgame screen shows every board decision you made, the alternatives, and the consequences that fired in later quarters." },
              { q: "Does it work on mobile?", a: "Onboarding and marketing pages do. The game canvas itself is desktop-first (1024px+). Mobile cohort sessions work better with a tablet at minimum." },
              { q: "Who built it?", a: <>SkyForce is a product of <a className="text-cyan-700 underline" href="https://www.icanmena.com" target="_blank" rel="noreferrer">ICAN MENA</a>, the consulting firm based in Dubai. We use it ourselves with our boards.</> },
            ].map((row) => (
              <div key={row.q}>
                <dt className="text-base font-semibold text-slate-900 mb-2">{row.q}</dt>
                <dd className="text-sm text-slate-500 leading-relaxed">{row.a}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* Final CTA */}
        <section className="relative py-20 bg-gradient-to-b from-white to-cyan-50/40">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Take the controls.
            </h2>
            <p className="text-base text-slate-500 mb-8">
              Solo run starts at /onboarding. No setup, no signup.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors"
              >
                Play solo <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/lobby"
                className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Browse public lobby →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}

function Section({
  id, eyebrow, heading, accent, tone, children,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  accent: "cyan" | "violet" | "emerald" | "amber";
  tone?: "dim";
  children: React.ReactNode;
}) {
  const accentText = {
    cyan: "text-cyan-600",
    violet: "text-violet-600",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }[accent];
  return (
    <section
      id={id}
      className={
        "scroll-mt-24 py-20 lg:py-24 border-b border-slate-100 last:border-b-0 " +
        (tone === "dim" ? "bg-slate-50/60" : "bg-white")
      }
    >
      <div className="max-w-5xl mx-auto px-6">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-3 ${accentText}`}>
          {eyebrow}
        </p>
        <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 tracking-tight leading-tight">
          {heading}
        </h2>
        {children}
      </div>
    </section>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="flex items-start gap-5">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-slate-900 text-white font-mono text-sm font-bold tabular flex items-center justify-center">
        {n}
      </div>
      <div className="flex-1 min-w-0 pt-1.5">
        <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}
