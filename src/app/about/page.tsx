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
                Executive simulations by ICAN MENA
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-slate-900 mb-6 leading-[1.05]">
              The simulation
              <br />
              <span className="text-slate-500">senior leaders actually use.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
              ICAN MENA builds executive simulations for boards and operating
              teams that need a strategy lab — not a board game. Each
              simulation models the operating reality of one industry.
              SkyForce, our airline product, is the first to ship; Banking,
              Hospitality, Agriculture, Real Estate, and Healthcare are next.
            </p>
          </div>
        </section>

        {/* How it works */}
        <Section
          id="how"
          eyebrow="How a round plays"
          heading="Five steps. Same rhythm in every simulation."
          accent="cyan"
        >
          <ol className="space-y-6 mt-8">
            <Step n={1} title="Make industry decisions" desc="In SkyForce: pick cities, aircraft, fares, slot bids. In Banking: write loans, set capital ratios. In Hospitality: pick property mix and rate. Each simulation models its sector's real moves." />
            <Step n={2} title="Tune the ops sliders" desc="Six universal dials shape payroll, brand, loyalty, and cost discipline. Each tick has a real downstream effect — service at 5 lifts loyalty but blows up payroll." />
            <Step n={3} title="Resolve any board scenarios" desc="Some rounds ship a boardroom decision. Cyber breach. Hedge timing. Government deals. Each option is a real trade-off — one outcome wins this round, costs next." />
            <Step n={4} title="Advance the round" desc="The engine settles markets, demand, costs, debt service, brand drift, milestones — and writes the executive digest." />
            <Step n={5} title="Read, adapt, repeat" desc="Round close shows what happened. Then you walk into the next round." />
          </ol>
        </Section>

        {/* Features */}
        <Section
          id="features"
          eyebrow="Inside SkyForce — our airline simulation"
          heading="Every lever the executive actually pulls."
          accent="violet"
          tone="dim"
        >
          <div className="grid md:grid-cols-2 gap-x-10 gap-y-6 mt-8">
            {[
              { icon: <Plane />, title: "Fleet & cabin", text: "Buy or lease across many aircraft families. Custom cabin layouts. Engine retrofits, eco upgrades, fuselage coatings." },
              { icon: <MapPin />, title: "Network & slots", text: "Hundreds of cities. Bid against rivals at scarce airports. Per-class fares with physics-real schedule caps." },
              { icon: <Wallet />, title: "Finance", text: "Term loans, RCF, lease residuals, fuel hedging. Tax-loss carry-forward. CFO-grade cash discipline." },
              { icon: <Users />, title: "People & ops", text: "Six dials — staff, marketing, service, rewards, ops, customer service. Brand and loyalty curves follow." },
              { icon: <ClipboardList />, title: "Board scenarios", text: "Boardroom decisions ripple for rounds. Locked-in choices reshape strategy mid-game." },
              { icon: <Trophy />, title: "Endgame scoring", text: "Airline value at the final round = brand × ops × loyalty × cash. Comeback bonuses, debt-stress callouts, legacy title earned." },
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

        {/* For Game Masters */}
        <Section
          id="facilitators"
          eyebrow="For Game Masters"
          heading="Run an executive workshop."
          accent="amber"
          tone="dim"
        >
          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div>
              <p className="text-base text-slate-600 leading-relaxed mb-4">
                Create a private game, share the 4-digit code, watch teams
                claim seats from their own laptops. Switch the active view,
                force the round close, push live admin overrides, review the
                audit log — all from one console. The Game Master role is
                optional and exclusive: at most one per game.
              </p>
              <Link
                href="/games/new"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-slate-700"
              >
                Create a session <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="space-y-2.5">
              {[
                "4-digit join code, lockable lobby, reissue support",
                "Per-team view switching for live coaching moments",
                "Force-close + reopen the round with full audit log",
                "Game Master role is optional and exclusive (max 1 per game)",
                "Cohort licensing available — email info@icanmena.com",
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
              { q: "How long is a session?", a: "Configurable. Hosts set the round count at create time (8/16/24/40). Solo learners often play short sessions; cohort workshops run 2-4 hours with discussion between rounds." },
              { q: "Can I save and resume?", a: "Yes. Solo runs persist in your browser; signing in saves them across devices. Multiplayer state lives server-side and reconnects on refresh." },
              { q: "Is there a tutorial?", a: "The first solo run walks you through brand-building (doctrine, hub, sliders). The map HUD explains route picking step-by-step until you've launched a route." },
              { q: "Can I review past decisions?", a: "Yes. The endgame screen shows every board decision you made, the alternatives, and the consequences that fired in later rounds." },
              { q: "Does it work on mobile?", a: "Onboarding and marketing pages do. The game canvas itself is desktop-first (1024px+). Cohort sessions work better with a laptop or tablet at minimum." },
              { q: "What other simulations are coming?", a: <>Banking, Hospitality, Agriculture, Real Estate, and Healthcare — built on the same engine and round loop, with industry-specific decisions inside each round. Email <a className="text-cyan-700 underline" href="mailto:info@icanmena.com">info@icanmena.com</a> if you want early access to a specific industry.</> },
              { q: "Who built it?", a: <>The simulations are products of <a className="text-cyan-700 underline" href="https://www.icanmena.com" target="_blank" rel="noreferrer">ICAN MENA</a>, the consulting firm based in Dubai. We use them ourselves with our boards.</> },
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
