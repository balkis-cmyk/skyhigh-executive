# SkyForce — V1 Audit Findings (rolling)

This document tracks every issue / opportunity surfaced during the
multi-pass audit. ✅ = fixed in this branch. 🟡 = noted, deferred.
🔴 = open / urgent.

## A. Math + economics

| # | Finding | Severity | Status |
|---|---|---|---|
| A1 | Depreciation 10× too high — engine never persisted `bookValue`, so every quarter re-deducted cumulative loss from `purchasePrice` | High | ✅ Period-only formula + persist newFleet/newRoutes |
| A2 | Insurance premium shown in Financials but never subtracted from pretax | Medium | ✅ Added to cost formula |
| A3 | Routes that won slot bids sat idle for one quarter (auction resolved AFTER revenue calc) | High | ✅ Reordered: auction + activation BEFORE revenue |
| A4 | Route-level Q profit subtracted only fuel — gave 99% margins that didn't reconcile to team net | High | ✅ Allocated team-level costs by revenue share |
| A5 | Fuel base price $0.18/L was ~25% of real-world; underweighted in cost mix | Medium | ✅ Bumped to $0.55/L |
| A6 | Slot lease anchor $80K/week was ~3× real-world recurring rents | Medium | ✅ Reduced to $30K (T2 anchor) |
| A7 | Cargo routes had no fee control + pricing tier was silently ignored | Medium | ✅ Added cargoRatePerTonne override + tier multiplier |
| A8 | `modern_fleet` flag fired trivially (threshold pre-restructure) | Low | ✅ Bumped from R8 to R21 |
| A9 | `aging_fleet` fired permanently in late game (10Q = half lifespan) | Low | ✅ Bumped to 12Q |
| A10 | Slider cost ranges out of spec — needed Marketing 0–15, Service 1.5–8, Ops 2–10, Office 1.5–7 | Medium | ✅ Per-slider tables |
| A11 | Tournament demand boost was global instead of per-host-city | Medium | ✅ Host city picked at game start, gated to it |
| A12 | Q costs displayed direct-only ($4.9M) while Q profit used allocated cost ($294M) — math didn't reconcile | High | ✅ Both use allocated cost; sub-label shows direct fuel |

## B. UI / UX

| # | Finding | Severity | Status |
|---|---|---|---|
| B1 | World news + scenario labels showed raw round numbers (Q13) instead of calendar (Q1 2018) | Medium | ✅ fmtQuarter everywhere |
| B2 | Aircraft market list was thumbnail-only — no quantity or upgrade preview before commit | Medium | ✅ Click-to-expand cards with hero photo + qty + upgrades + Buy → next |
| B3 | Map: routes were single-line dashed; no real plane motion | Medium | ✅ Animated plane glyphs flying along great-circle arcs + pulse-ring hubs |
| B4 | Cargo lines indistinguishable from passenger | Low | ✅ Cargo amber + yellow plane glyphs |
| B5 | Native `alert()` / `confirm()` calls in Fleet + Admin flows | Medium | ✅ 8 alerts replaced with toasts (confirms/prompts deferred) |
| B6 | Endgame leaderboard had no tiebreaker visibility — two ties looked arbitrary | Medium | ✅ Cash → debt → brand → loyalty surfaced |
| B7 | DemandBreakdown missed cabin condition + customer loyalty multipliers | Medium | ✅ Now shows all 6 multipliers + compound |
| B8 | Pending route reason only shown via toast, never persisted | Medium | ✅ `pendingReason` on Route + shown in route detail |
| B9 | Aircraft market had no capacity/range filters across 40+ entries | Medium | ✅ Filter chips for capacity + range buckets |
| B10 | Routes panel had no sort/filter — only profit-default | Medium | ✅ Filter (All/Pax/Cargo/Losing) + Sort (Profit/Load/Revenue/Fuel) chips |
| B11 | Tournament events required digging through news to find the host | Low | ✅ Persistent banner on Routes + dynamic news + host callout on S10/S11 |
| B12 | PurchaseOrderModal had no preview of cabin attractiveness vs market | Low | ✅ Per-class score preview using engine PRD §6.7 weights |
| B13 | Brand/Loyalty trajectory was numeric-only — no chart | Low | ✅ Sparkline trend chart in Reports → Financials |
| B14 | `/` auto-redirected to /onboarding so visitors never saw the marketing landing | Medium | ✅ Removed redirect; pre-game lobby IS the landing |
| B15 | Landing copy stale: 20 quarters / 100 cities / 21 aircraft | Low | ✅ 40 rounds / 380+ cities / 40+ aircraft from 6 manufacturers |
| B16 | Hub city flat against map — no visual emphasis | Low | ✅ Pulsing concentric rings + bright center beacon |
| B17 | Endgame chart axis labels stuck on 20-round window | Low | ✅ Spans full 40-round campaign with calendar labels |
| B18 | Confirm + prompt still used for retrofit / sell flows | Low | 🟡 Deferred — bigger UX change |
| B19 | Mobile viewport meta missing | Medium | ✅ Added explicit viewport (device-width, themeColor, viewport-fit) |
| B20 | Icon-only buttons without aria-labels (33 buttons in panels, 0 aria-labels) | Medium | 🟡 Deferred — needs combing |

## C. State + persistence

| # | Finding | Severity | Status |
|---|---|---|---|
| C1 | "+$900M debug cash grant" still firing on rehydrate for Meridian Air | High | ✅ Removed |
| C2 | New Route fields (cargoRatePerTonne, pendingReason, quarterlyAllocatedCost) needed migration backfill | Medium | ✅ Backfilled `?? null` in onRehydrateStorage |
| C3 | World Cup / Olympic host codes needed to backfill on existing saves | Medium | ✅ Picker runs in onRehydrateStorage when missing |
| C4 | Stale `routeId` references in fleet entries (route deleted, plane still pointed) | Low | ✅ Already swept in onRehydrateStorage |
| C5 | Bots' rival hub collision check only deduplicates with player, not other rivals | Low | 🟡 Real-world MOCK_COMPETITOR_NAMES are unique by design |

## D. Game balance + content

| # | Finding | Severity | Status |
|---|---|---|---|
| D1 | News content empty for rounds 21–40 (40-round restructure left them blank) | High | ✅ 100 headlines covering 2020–2024 era |
| D2 | News at q=2–20 still references PRD-Q numbers for scenarios that shifted | Low | 🟡 Flavor only; left for content pass |
| D3 | AI bots picked the cheapest aircraft → monoculture fleets | Medium | ✅ Diversification scoring + regional preference |
| D4 | Missing 1990s commercial jets (737-300/-400/-500, 777-200) | Medium | ✅ Added |
| D5 | Missing brands: ATR, Embraer (gen 2+), Bombardier, COMAC | Medium | ✅ CRJ-900, Dash-8-400, E190, E195-E2, ATR-72-600, C919, A330-300, B777-300ER, B747-8 added |
| D6 | Four broken plane image folders | Low | 🟡 User fixing externally |
| D7 | S10 / S11 sponsorship options unclear / cryptic | Medium | ✅ Rewritten in plain English |

## E. Security

| # | Finding | Severity | Status |
|---|---|---|---|
| E1 | `dangerouslySetInnerHTML` / `innerHTML` / `eval` usage | n/a | None found |
| E2 | `team.color` interpolated into Leaflet divIcon HTML; could break out if user-controlled | Low | 🟡 `team.color` is from a fixed palette, not user input — defensible |
| E3 | `localStorage` exposes full game state (incl. team names, custom airline name) | Low | 🟡 Single-player game; no PII; acceptable |
| E4 | No CSRF / XSS surfaces — all-static Next.js app, no API | n/a | OK |

## F. Outstanding / V2 candidates

These are out of scope for V1 polish but planned for V2:
- Airport ownership / development / purchasing (see V2-PLAN.md)
- Confirm/prompt → modal replacement (B18)
- Comprehensive a11y pass (B20)
- News at q=2–20 scenario references (D2)
- Multi-tenant / real backend (Supabase)
- Endgame PDF/PPT export
