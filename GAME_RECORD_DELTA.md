# Game Record Delta — ICAN Simulations · Airline (formerly Project SkyForce)

> **Purpose of this document.** This is a hand-off file for the agent
> updating the original HTML reference (`SkyForce_Master_Reference.md` /
> the original master HTML). It covers every gameplay change made in the
> current codebase that touches **Live Sims (L0–L7)**, **Board Scenarios
> (S1–S18)**, **World News & Macro Events**, **Engine rules**, and
> **Doctrines** that affect outcomes. UI / multiplayer-lobby changes are
> NOT in scope here — only things that change the simulation record.
>
> **Source of truth files** (read these alongside this report):
> - `src/data/scenarios.ts` — S1–S18 board scenarios
> - `src/data/world-news.ts` — World news + dynamic host announcements
> - `src/data/doctrines.ts` — Player doctrines
> - `src/components/game/LiveSimForm.tsx` — L0–L7 live-sim definitions
> - `src/lib/engine.ts` — Engine rules + scenario consequence handlers

---

## 1 · Brand & nomenclature

| Was | Now |
|---|---|
| **SkyForce** (product name) | **ICAN Simulations · Airline** (the airline simulation is one of six in the portfolio) |
| L0 "Brand Building" was the marketing pitch | L0 reframed: facilitator-only — no longer scored vs cohort, no cash injection at L0 (was +$80M/+$60M/+$40M/+$20M/$0). Onboarding's 8 player-driven choices replaced the L0 ranking mechanic at the player level. |
| Decade framing "40 quarters · 2015–2024" | Round count is now configurable at create-time (8 / 16 / 24 / **40** default). Calendar mapping retained internally but de-emphasized in marketing. |

> The internal codename `skyforce` is retained in: localStorage keys, save
> snapshot file prefixes, console error tags, code comments. Changing
> these would wipe existing player saves.

---

## 2 · Live Sims (L0–L7)

The full set of 8 live-sim modules and their canonical descriptors live
at `src/components/game/LiveSimForm.tsx:35-95`. **No new live sims have
been added.** Modifications below.

### L0 — Brand Building
**Was (Master HTML):** Q1 2015 cohort live sim. 5-dimension scoring →
ranked cash injection (1st +$80M, 2nd +$60M, 3rd +$40M, 4th +$20M, 5th $0).
Brand Pts multiplier 10× / 7× / 5× / 3× / 2×.

**Now (in code):**
- The cash-injection ladder + Brand Pts multiplier remain in the live-sim
  reference card (LiveSimForm.tsx:35-40) as a facilitator memory aid.
- **Player-side onboarding has REPLACED the cohort-ranked L0 mechanic.**
  Players now go through 9 onboarding steps that drive starting
  position via direct selections rather than a ranked competitive pitch:
  - Airline name + IATA code + tagline
  - Doctrine pick (premium / budget / cargo / global) — see §5
  - **Hub pick with cost-tier deduction**: $300M premium gateway
    (LHR/CDG/JFK/SFO/DXB) / $200M T1 / $100M T2 / $50M T3
  - Market focus, geographic priority, pricing, salary, marketing,
    CSR theme — each a small demand/cost multiplier
- **Starting capital reformulated:** every player gets
  `ONBOARDING_TOTAL_BUDGET_USD = $350M`, less the hub cost above. So a
  T3 hub starts with $300M operating cash, a premium-gateway hub starts
  with $50M operating cash. **No more L0-rank-based cash injection at
  the player level.**
- **L0 Brand Building** is now a facilitator-only mechanic for live
  cohort sessions where the room wants the ranked pitch. The
  facilitator can still score it externally and use the live-sim form
  to push results in via direct cash/brand admin overrides.

### L1 — The Strike
No rule changes. Same flags (`strong_labour_relations` / `weak_labour_relations`).

### L2 — Talent Heist Live (paired with S14)
No rule changes. Bid-cross-reference with S14 still applies.

### L3 — The Whistleblower
No rule changes.

### L4 — The Podium
No rule changes. Verbal commitments still become game obligations; route-obligations system in `engine.ts` enforces them.

### L5 — Project Aurora
No rule changes. Flags still: `integrity_leader` / `maverick`.

### L6 — FIFA Elevator (combined with R3 sealed bid → S10 World Cup)
No rule changes. Flag `global_brand` still gates the S10 winner uplift.

### L7 — Crisis Operations Room
No rule changes.

---

## 3 · Board Scenarios (S1–S18)

All 18 scenarios are still present at the same quarters and severities.
**Two structural changes** affect every scenario:

### 3.1 — Scenario consequence resolution (P1 fix)
**Was:** Plot-twist follow-up consequences (S4 OPEC drop, S15 recession
ends, S16 false alarm cleared, S12 ambassador cleared, S5-B government
deal pays out) were hard-coded in the engine with `if (ctx.quarter === N)`
checks. If a scenario's quarter ever moved, the consequence misfired.

**Now:** Consequences are scenario-relative. Each option's
`OptionEffect.deferred` carries a `lagQuarters?: number` (or absolute
`quarter?: number`). When the player picks an option, `submitDecision`
schedules the deferred consequence at `currentQuarter + lagQuarters`. If
a consequence depends on probability (e.g. S5-B government deal: 70%
chance to pay out at +1Q), the probability resolves at fire time, not at
choice time. Surfaces in `QuarterCloseModal` as a "Consequence fired"
section.

**Specific deferred consequences that are now scenario-relative:**
- **S4 (Oil Gamble)** — OPEC drop at +3Q after the decision quarter
- **S15 (Recession Gamble)** — Recession ends at +5Q after Q27
- **S16 (Moscow Signal)** — False-alarm clearance at +4Q
- **S12 (Brand Grenade)** — Ambassador cleared at +4Q
- **S5-B (Government Lifeline)** — 70% chance +$300M payout at +1Q

### 3.2 — Bot scenario picks
Each bot difficulty has predefined scenario picks
(`src/lib/ai-bots.ts:60-114`). These are still defined but **not yet
wired into the quarter-close path** (`botPickScenarioOption` exists but
isn't imported by the store). This is a known follow-up; for now bots
take no scenario action, which means rivals' brand/cash drift purely
from the procedural revenue model. **Update HTML accordingly: bots are
not yet playing scenarios.**

### Scenario-specific notes worth recording

- **S5 (Government Lifeline)** — Option B: "Take partial gov deal" now
  carries an explicit deferred event (was missing in master). 70%
  chance of $300M cash injection +1Q after the choice; 30% the deal
  walks away. Surfaces in QuarterClose.
- **S8 (Political Favour)** — Both options A (full) and B (partial)
  now apply `timedModifier` blocks lasting 8Q (full) / 8Q (partial),
  giving slot/cash benefits over time rather than a one-shot effect.
- **S9 (Blue Ocean)** — Three options (first-mover, deepen, split)
  each apply distinct 6-8Q `timedModifier` shapes.
- **S13 (Digital Gamble)** — Four options each apply distinct 8Q
  `timedModifier` shapes (full / phased / reskill / aging-operations).
- **S10 (World Cup Bet)** + **S11 (Olympic Play)** — Resolution now
  gated on dynamic host city picked at game-start (random tier-1/2
  city, never a player or rival hub). Demand uplift applies ONLY to
  routes touching the host city. S10 winner (`global_brand`) gets a
  sealed-100% load through the main rounds; S11 winner
  (`premium_airline`) gets a sealed-100% load on Olympic-host routes.

---

## 4 · World News & Macro Events

Master HTML has the static news catalogue (around 220 events). **No
events have been added or deleted.** Three behavioural changes:

### 4.1 — Per-quarter category modifiers
Each `NewsItem` now ships a structured `modifiers: { city, category,
pct, rounds }[]` array. A tourism shock no longer pushes business
demand; a cargo shock no longer pushes passenger demand. Demand floor
clamps prevent any stack of negative modifiers from driving demand to
zero — minimum 15% of baseline for passenger, 25% for cargo.

### 4.2 — Dynamic host-city announcements
World Cup (rounds 19–24) and Olympics (rounds 29–32) now produce
host-city news items dynamically based on the random host code picked
at game-init (`worldCupHostCode`, `olympicHostCode` in `GameState`).
These are produced by `dynamicHostNews(quarter, hostCode, hostCode,
cityNameLookup)` at the news-feed render boundary — they're not stored
in the static catalogue.

### 4.3 — Travel-index pulses + fuel-shock hints
`NewsItem.travelIndex` (optional) now overrides the global Travel Index
multiplier at that quarter (averaged across multiple overrides at the
same quarter). `NewsItem.fuelIndexAtBaseline` (optional) hints the
expected fuel index after a shock for player-facing dashboards. Both
were partially in master; the engine now reads them consistently.

### 4.4 — Cargo seasonality
Q4 cargo demand bumped +18%, Q1 cargo demand cut −10%. Was previously
flat year-round; the holiday-peak / post-holiday shape now mirrors real
freight cycles. Affects S18 Cocoa Crisis cargo flows + general cargo
revenue line.

---

## 5 · Doctrines

The four doctrines in `src/data/doctrines.ts` (Budget Airline / Premium
Airline / Cargo Dominance / Global Network) are unchanged in identity.
**Three changes:**

### 5.1 — Effect-tag wording
Tags rewritten qualitative. The master listed numerical magnitudes
(e.g. "+20% T2/T3 demand pool", "−30% crisis impact"). The player UI
now shows directional language only ("Higher demand from secondary
markets", "Lower crisis impact"). The numerical magnitudes still live
in the engine constants — they're just hidden from the player so the
card reads as a strategic choice, not a min-max optimization puzzle.

### 5.2 — Icons
Doctrine cards now use Lucide icons (Zap / Gem / PackageCheck / Globe2)
in tinted ring tiles instead of the legacy Unicode glyphs (↘ / ★ / ☐ / ◉).
No mechanical impact — purely visual.

### 5.3 — `safety-first` doctrine retained as alias
The legacy `safety-first` DoctrineId still resolves to `global-network`
multipliers via `DOCTRINE_BY_ID["safety-first"]`. Old saves with that
doctrine selected continue to work.

---

## 6 · Engine rule changes that affect record / scoring

### 6.1 — Per-class cabin demand pools (Wave 3.2)
**Was:** OD demand was a single pool. Pax distributed across cabins by
seat-mix ratio. One load factor across all classes.

**Now:** Each OD has class-specific demand pools driven by distance:
- short-haul (<1500km): 1% first / 12% bus / 87% econ
- domestic (<4000km): 2% first / 16% bus / 82% econ
- medium (<8000km): 4% first / 22% bus / 74% econ
- long-haul (≥8000km): 6% first / 28% bus / 66% econ
- T1↔T1 OD pairs get a 1.20× lift on premium classes (capped 10% / 40%)

Each class has its own capacity clamp + yield-management lift. **A
long-haul widebody with too many first-class seats will leave the
front empty under low demand — was previously magic-filled.**

### 6.2 — Cargo belly + freighter shared OD pool (Wave 3.2)
**Was:** Belly cargo on passenger jets and a dedicated freighter on the
same OD each took independent shares of cargo demand → up to 130% of
pool double-count.

**Now:** When both modes serve the same OD, freighter takes 70% (full
pallets), belly takes 30% (parcels/mail). Total = 100% of pool. No
double-count.

### 6.3 — Payroll baseline rebuild (Wave 3.1)
Old payroll formula targeted ~0.5% of revenue (vs real airlines'
18-25%). New 7-factor formula targets **18% of revenue ±5% guardrail**
at steady state. Factors:
1. Hub overhead ($4M primary + $1.5M per secondary)
2. Aircraft tier-weighted ($2.4M × 0.45 / 0.95 / 1.7 for regional /
   narrow / wide; cargo 0.6 / 0.95 / 1.3 by tonnage)
3. Route ops ($250K pax + $200K cargo + $12K per weekly flight)
4. Pax-volume staffing ($6.50/pax served at 80% planning load)
5. Cargo handling ($90/tonne at 80% planning load)
6. Variety overhead (+5% per unique aircraft type past 3, capped 20%)
7. Cross-slider multipliers (service heavy [0.85→1.50], marketing
   light [0.96→1.13], customer-service medium [0.93→1.22])
- Floor: $1.5M/Q early-game

### 6.4 — Fuel baseline (Wave 3.1)
Fuel baseline moved from $0.65/L → **$0.85/L** (upper end of
real-world Jet A1 band 2015-2024). Fuel-shock scenarios scale from
this baseline — S4 (Oil Gamble) and any news-driven fuel shocks now
hit harder in absolute USD.

### 6.5 — Rivals' hybrid economics (Wave 3.3)
**Was:** Rival revenue was pure procedural — doctrine baseline × brand
× maturity × noise. Decoupled from player network.

**Now:** Rival revenue couples to the player's network state:
- **Direct OD overlap** (rival flies same OD as player) → up to −10%
  per fully overlapped network
- **Endpoint-only overlap** (rival touches a player city) → up to −4%
- **Hub-slot dominance** (player holds slots at rival's hub) → up to
  −12% at full player share
- Capped at −22% combined so a player-everywhere strategy can't zero a
  rival's revenue
- **The player's `competitorPressure` factor** in route economics is
  the symmetric inverse: rivals at OD endpoints reduce the player's
  effective demand on the route.

### 6.6 — Per-flight overcount fixes
Fuel burn, cargo tonnes, and passenger seats were previously summed
across all aircraft on a route, then multiplied by daily frequency —
double-counting. **Now averaged per flight before multiplying**, which
is exact for homogeneous fleets and a reasonable approximation for
mixed. Affects fuel-cost line, cargo revenue, pax revenue.

### 6.7 — Per-route P0 fixes (in production)
- Slot auction state persisted correctly across early + late auction
  phases (was being clobbered)
- Route-launch submit button no longer stuck when slot bids are needed
- Aircraft assignment list sorted in-range first
- Map arcs flattened (0.4 great-circle/rhumb blend) + antimeridian
  unwrap (LAX→SYD glitch fixed)
- Route closure preserves history (status flips to "closed", aircraft
  removed) instead of disappearing the row

### 6.8 — Cabin-condition penalty
Per-aircraft `satisfactionPct` now applies a route-level demand penalty
on the worst-condition aircraft assigned. <30 sat = 8% demand penalty,
<50 = 4% penalty, ≥80 = 2% bonus. **Cabin amenities** (WiFi / premium
seating / entertainment / food service) add virtual satisfaction
bumps that stack on top.

---

## 7 · Onboarding-derived multipliers

The 8 onboarding picks (replacing the L0 mechanic at the player level)
each apply small engine multipliers:

| Pick | Effect |
|---|---|
| Doctrine | Sets primary engine multiplier set (see §5) |
| Hub | Sets primary city + 50 free hub slots + 30 free slots at 5 popular dests |
| Market focus = passenger | +5% pax demand |
| Market focus = cargo | +15% cargo demand bonus |
| Geographic priority match | +8% demand on routes inside priority region |
| CSR theme = community | +3% demand on tier-2/3 OD pairs (small "local goodwill" effect) |
| Marketing level | Marketing slider initial position (low / medium / high / aggressive) |
| Salary philosophy | Staff slider initial position (below / at / above market) |
| Pricing philosophy | Default pricing tier on first route |

---

## 8 · Scoring & endgame

### 8.1 — Airline value formula
`computeAirlineValue` = brand × ops × loyalty × cash position. Unchanged
in shape. The endgame screen now also surfaces:

- **Comeback bonus highlight** — biggest peak-to-trough cash recovery
  if ≥ $50M
- **Debt stress callout** — peak debt-to-airline-value ratio if ≥ 50%
- **Cash crisis callout** — any quarter with cash below −$50M
- **Legacy title** by final brand value band (Legend / Architect /
  Operator / Survivor / Cautionary Tale / Grounded)

### 8.2 — Endgame card multipliers (PRD G9)
Resolved awards apply `airlineValueMult` multiplicatively to the
final airline value. List of awards is in `resolveEndgameAwards`.

### 8.3 — Decisions retrospective
Endgame screen shows every board decision the player made, the option
picked, the alternatives, and the consequences that fired. Scoped to
the player only — not cohort-wide.

---

## 9 · What's NOT in this report

These items DON'T affect the game record / HTML reference and are
intentionally omitted:
- Multiplayer lobby surface, auth, /games/[id]/lobby waiting room
- Marketing pages (/, /about, /simulations, /privacy, /terms)
- Map UX (city cards, click halos, arc flattening visuals)
- Doctrine icons + cards visual treatment
- Brand rename to "ICAN Simulations"
- Sign-in / sign-up flow

---

## 10 · TL;DR for the HTML-update agent

The big-six items to reflect in the Master HTML reference:

1. **L0 player-side mechanic replaced** — the cohort-ranked Brand
   Building pitch is now facilitator-only. Players get 9 onboarding
   steps + hub-cost-tier starting cash ($350M − hub price = operating
   cash). Live-sim L0 ladder retained as facilitator memory aid only.

2. **Hub pricing tiers** — Premium gateways (LHR/CDG/JFK/SFO/DXB) cost
   $300M, Tier 1 cost $200M, Tier 2 cost $100M, Tier 3 cost $50M.
   Deducted from $350M starting budget.

3. **Plot-twist scheduling rebuilt** — S4 OPEC drop, S15 recession end,
   S16 false alarm, S12 ambassador cleared, S5-B 70% gov deal — all
   now scenario-relative `lagQuarters` deferred events. If you move
   any scenario's quarter, the consequence moves with it.

4. **Per-class cabin demand pools** — record the distance-band shares
   (1/12/87 short-haul → 6/28/66 long-haul) and the T1↔T1 1.20× lift
   on premium classes. Replaces the old single-pool model.

5. **Cargo belly/freighter 70/30 shared pool** — ends the 130%-of-pool
   double-count when both modes serve the same OD.

6. **Rivals' hybrid economics** — rivals' revenue now responds to
   player network presence (direct OD overlap −10%, endpoint −4%,
   hub-slot dominance −12%, combined cap −22%). Plus fuel baseline
   bumped to $0.85/L and payroll target reformulated to 18% ±5% of
   revenue.

Plus: cargo Q4 +18% / Q1 −10% seasonality, World Cup / Olympics dynamic
host city, demand floors at 15% / 25%, satisfaction-driven cabin
penalties, per-flight overcount fixes on fuel/cargo/seats.

Bots playing scenarios is **not yet wired** — record this as "phase 2"
for the master if helpful.
