"use client";

/**
 * `/` — SkyForce marketing landing page.
 *
 * Three audiences land here:
 *   1. First-time visitors (no saved game) → marketing-grade hero,
 *      doctrine showcase, "how it works" strip, classroom CTA, full
 *      footer.
 *   2. Returning players with a live run (phase != idle) → drop
 *      into GameCanvas straight away. Their TopBar already carries
 *      "End game & start over" so they always have an exit; no need
 *      to bounce them through a chooser.
 *   3. Returning players with a finished run (phase === endgame) →
 *      same canvas mount, the canvas itself routes them to /endgame.
 *
 * The marketing surface is what we'd hand to a board / HR head /
 * facilitator considering SkyForce for a workshop or classroom.
 * Every CTA leads somewhere real (no "coming soon" links).
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Sparkles, Plane, Trophy, MapPin, Wallet, Users,
  Zap, Gem, PackageCheck, Globe2, ClipboardList,
  Calendar, Clock,
} from "lucide-react";
import { useGame } from "@/store/game";
import { GameCanvas } from "@/components/game/GameCanvas";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function Home() {
  const phase = useGame((s) => s.phase);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex-1 min-h-0 bg-slate-50" aria-hidden />;
  }

  // Active or finished run — drop into the canvas. The TopBar's
  // GameMenu has the "End game & start over" path so the player can
  // always escape back to this landing.
  if (
    phase === "playing" ||
    phase === "onboarding" ||
    phase === "quarter-closing" ||
    phase === "endgame"
  ) {
    return <GameCanvas />;
  }

  return <Landing />;
}

// ============================================================================
// Marketing landing
// ============================================================================

function Landing() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-white">
      <MarketingHeader current="home" variant="onDark" />

      <Hero />
      <SocialProof />
      <Features />
      <Doctrines />
      <HowItWorks />
      <FacilitatorBlock />
      <FinalCta />
      <MarketingFooter />
    </div>
  );
}

// ─── Hero ────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white -mt-16 pt-16">
      {/* Backdrop gradients */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-28 lg:pt-28 lg:pb-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-6">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="text-[11px] font-semibold text-cyan-100 uppercase tracking-wider">
              Executive simulation · 2015 → 2024
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.04] mb-6">
            Run a global airline.
            <br />
            <span className="text-cyan-300">For 40 quarters.</span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed mb-10">
            SkyForce is the strategy simulation boards and operating teams use
            to stress-test capital allocation, fleet decisions, and crisis
            response. Open routes across 380+ cities, run a fleet of 40+
            commercial aircraft, navigate 18 board scenarios — and survive a
            decade of fuel shocks, recessions, and rival expansion.
          </p>

          <div className="flex items-center gap-3 flex-wrap mb-4">
            {/* Single primary CTA — every entry path lives inside the
                /lobby (browse public games, enter a private code, or
                hit Create game). No more 6-card non-MECE picker. */}
            <Link
              href="/lobby"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#00C2CB] text-white text-sm font-semibold rounded-full hover:bg-[#00a9b1] transition-colors shadow-[0_8px_30px_-8px_rgba(0,194,203,0.5)]"
            >
              Join game <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-6 py-3 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/5 transition-colors"
            >
              How it works
            </Link>
          </div>
          <div className="mb-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Already have an account?{" "}
              <span className="underline underline-offset-2">Sign in</span>
            </Link>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Stat icon={<Calendar className="w-3.5 h-3.5" />} label="40 rounds · 10 years" />
            <Stat icon={<MapPin className="w-3.5 h-3.5" />} label="380+ cities" />
            <Stat icon={<Plane className="w-3.5 h-3.5" />} label="40+ aircraft" />
            <Stat icon={<ClipboardList className="w-3.5 h-3.5" />} label="18 board scenarios" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400">
      <span className="text-cyan-400">{icon}</span>
      {label}
    </span>
  );
}

// ─── Social proof strip ──────────────────────────────────────
function SocialProof() {
  return (
    <section className="border-b border-slate-100 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-8">
          Built for the people who decide where the airline flies
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 text-slate-500">
          {[
            "Boards & C-suite",
            "Strategy teams",
            "Aviation MBAs",
            "Ops leadership",
            "Family-office reviews",
            "Cohort training",
          ].map((segment, i) => (
            <div key={segment} className="flex items-center gap-x-10">
              <span className="text-sm font-medium tracking-wide">{segment}</span>
              {i < 5 && <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────
function Features() {
  return (
    <section id="features" className="relative py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3">
            What you control
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
            Every lever a real airline pulls.
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Not a board game. A complete operating model — fleet, network,
            pricing, slots, cabin demand, fuel hedging, debt, sliders, and
            board-level decisions — all running on the same engine you'd
            review at a real strategy offsite.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Plane className="w-5 h-5" />}
            accent="cyan"
            title="Fleet & cabin design"
            description="Buy or lease across 40+ aircraft families. Custom cabin layouts. Engine upgrades, eco retrofits, fuselage coatings. Aircraft retire on schedule."
          />
          <FeatureCard
            icon={<MapPin className="w-5 h-5" />}
            accent="violet"
            title="Network & slot auctions"
            description="Open routes across 380+ cities. Bid against rivals at scarce airports. Per-class fares, frequency caps tied to physics-real schedules."
          />
          <FeatureCard
            icon={<Wallet className="w-5 h-5" />}
            accent="emerald"
            title="Finance & debt"
            description="Term loans, revolving credit, lease residuals. Fuel hedging. Dividend recap. Tax-loss carry-forward. Watch cash like a CFO."
          />
          <FeatureCard
            icon={<Users className="w-5 h-5" />}
            accent="amber"
            title="People & ops sliders"
            description="Six operational dials — staff, marketing, service, rewards, ops, customer service. Each shapes payroll, brand, and loyalty curves."
          />
          <FeatureCard
            icon={<ClipboardList className="w-5 h-5" />}
            accent="violet"
            title="Board scenarios"
            description="18 quarterly board decisions: cyber breach, fuel hedging, government deals, alliance offers. Locked-in choices ripple for years."
          />
          <FeatureCard
            icon={<Trophy className="w-5 h-5" />}
            accent="cyan"
            title="Endgame scoring"
            description="Airline value at Q40 = brand × ops × loyalty × cash position. Comeback bonuses, debt-stress callouts, legacy title earned."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon, accent, title, description,
}: {
  icon: React.ReactNode;
  accent: "cyan" | "violet" | "emerald" | "amber";
  title: string;
  description: string;
}) {
  const ring = {
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
  }[accent];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-slate-300 transition-colors">
      <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ring-4 mb-4 ${ring}`}>
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Doctrines showcase ─────────────────────────────────────
function Doctrines() {
  const items = [
    {
      Icon: Zap,
      accent: "amber",
      name: "Budget Airline",
      tagline: "Fast turns, lean costs, wider reach.",
      desc: "Build around access and efficiency. Reach price-sensitive travelers across Tier 2 + Tier 3. Downturns hit harder.",
    },
    {
      Icon: Gem,
      accent: "violet",
      name: "Premium Airline",
      tagline: "Protect yield and loyalty.",
      desc: "Compete on service, brand, cabin quality. Price above the market and recover loyalty faster — pay for it in payroll.",
    },
    {
      Icon: PackageCheck,
      accent: "emerald",
      name: "Cargo Dominance",
      tagline: "Make the network move freight.",
      desc: "Use every connection as a logistics corridor. Cargo capacity and turnarounds compound across linked cities.",
    },
    {
      Icon: Globe2,
      accent: "cyan",
      name: "Global Network",
      tagline: "Connectivity compounds demand.",
      desc: "Grow a connected international system. Pax demand rises across linked cities; mixed fleet brands cost more to maintain.",
    },
  ] as const;
  const ring: Record<typeof items[number]["accent"], string> = {
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    violet: "bg-violet-50 text-violet-700 ring-violet-100",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-100",
  };
  return (
    <section id="doctrines" className="relative bg-slate-50 border-y border-slate-100 py-24 lg:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3">
            Pick a strategy
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
            Four doctrines.
            <br />
            <span className="text-slate-500">Pick one. Live with it.</span>
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed">
            Your doctrine sets the multipliers that follow you through every
            quarter — not a flavor pick, a strategic commitment.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          {items.map((d) => {
            const Icon = d.Icon;
            return (
              <div
                key={d.name}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-12 h-12 rounded-xl ring-4 flex items-center justify-center ${ring[d.accent]}`}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 mb-0.5">
                      {d.name}
                    </h3>
                    <p className="text-xs italic text-slate-500 mb-2">
                      &ldquo;{d.tagline}&rdquo;
                    </p>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {d.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── How it works ────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how" className="relative py-24 lg:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="max-w-xl mb-12">
          <p className="text-xs font-semibold text-cyan-600 uppercase tracking-widest mb-3">
            The quarterly loop
          </p>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
            How a quarter plays.
          </h2>
        </div>
        <ol className="space-y-6">
          <Step n={1} title="Open and price routes" desc="Drop a pin on the map. Pick aircraft. Set per-class fares. Bid for slots if you're short. The launch flow checks physics-real frequency caps for every spec." />
          <Step n={2} title="Tune the ops sliders" desc="Six dials shape payroll, brand, loyalty, and cost discipline. Each tick has a real downstream effect — a quarter at customer-service 5 lifts loyalty but blows up payroll." />
          <Step n={3} title="Resolve any board scenarios" desc="Some quarters carry a boardroom decision. Cyber breach response. Hedge timing. Government deals. Each option is a real trade-off — one outcome wins this quarter, costs next." />
          <Step n={4} title="Click Next Quarter" desc="The engine settles fuel, demand, cargo, fares, costs, payroll, debt service, brand drift, milestones — and then writes the digest." />
          <Step n={5} title="Read the digest, adapt" desc="Quarter close shows what happened: route P&Ls, milestones earned, decision consequences fired, scenario aftermath. Then you walk into the next quarter." />
        </ol>
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

// ─── Facilitator block ──────────────────────────────────────
function FacilitatorBlock() {
  return (
    <section id="facilitators" className="relative py-24 lg:py-32 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <div className="rounded-3xl bg-slate-950 text-white p-10 md:p-14 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <p className="text-xs font-semibold text-violet-300 uppercase tracking-widest mb-3">
              For facilitators
            </p>
            <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-4 leading-tight">
              Run a classroom or boardroom workshop.
            </h2>
            <p className="text-base text-slate-400 max-w-2xl mb-8 leading-relaxed">
              Generate a 4-digit join code, share it with the room, watch teams
              claim seats from their own laptops. Switch the active view, force
              quarter-close, push live admin overrides, review the audit log —
              all from one console.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/facilitator"
                className="inline-flex items-center gap-2 px-5 py-3 bg-white text-slate-900 text-sm font-semibold rounded-full hover:bg-slate-100 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Open the facilitator console
              </Link>
              <a
                href="mailto:hello@icanmena.com?subject=SkyForce%20cohort%20licensing"
                className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Talk to ICAN about cohort licensing →
              </a>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 pt-8 border-t border-slate-800">
              <FacilitatorStat label="Per cohort" value="6 teams" />
              <FacilitatorStat label="Session length" value="2-4 hrs" />
              <FacilitatorStat label="Decisions" value="18 boardroom" />
              <FacilitatorStat label="Setup" value={<><Clock className="inline w-3 h-3 mr-1 align-baseline" />5 min</>} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FacilitatorStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">{label}</div>
      <div className="text-lg font-display font-bold text-white">{value}</div>
    </div>
  );
}

// ─── Final CTA ───────────────────────────────────────────────
function FinalCta() {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-white to-cyan-50/40">
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-4 leading-[1.1]">
          Ready to take the controls?
        </h2>
        <p className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
          One door in. Browse open games, drop in with a code, or start your
          own — solo, with friends, or with a facilitator.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/lobby"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#00C2CB] text-white text-sm font-semibold rounded-full hover:bg-[#00a9b1] transition-colors shadow-[0_8px_30px_-8px_rgba(0,194,203,0.5)]"
          >
            Join game
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            Sign in to save progress →
          </Link>
        </div>
      </div>
    </section>
  );
}
