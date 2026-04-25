# SkyForce V2 — Planning Document

> Status: planning. None of this is implemented yet. V1 (the current build)
> is feature-frozen for the workshop release; V2 is the next major pass.

V2 is centered on giving players agency over the **infrastructure layer**:
they no longer just bid for slots at airports somebody else owns — they can
own, develop, and operate airports themselves. This unlocks a second
revenue stream and a strategic moat that compounds across the campaign.

## V1 vs V2 — what changes

| | V1 (today) | V2 (planned) |
|---|---|---|
| Airports | Static — slots are abstract capacity, recurring rent | Owned, developed, operated as assets |
| Revenue | Tickets + cargo + slot leases (paid by airline) | + Airport ground revenue (rent, retail, parking, fuel sales) for owners |
| Strategy | Build the airline | Build the airline AND the network it flies on |
| Win conditions | Airline value | Combined airline + airport portfolio value |
| Scenarios | 18 board-level events | + airport-specific events (PPP deal, expansion vote, runway closure) |
| Map | Routes + hub beacons + planes | + airport-state overlays (owner colors, terminal capacity, runway count) |

## V2 Pillar 1 — Airport ownership

### Acquisition modes
1. **Greenfield licensing.** Bid for an exclusive operator concession on
   an airport that's currently government-run. Auctioned at game start +
   every 8 rounds. Winner pays a one-time concession fee + recurring
   franchise fee per round.
2. **Privatisation tenders.** Specific tier-2 / tier-3 airports come up
   for sale via scenario events ("Government commits to selling
   regional gateway"). Sealed-bid auction, top bid + bid quality wins.
3. **Hostile / minority stakes.** Buy a minority stake (10–49%) in
   another player's owned airport via the secondary market. Earns
   pro-rata revenue but no operating control.
4. **Construction.** Build a new airport in a city that doesn't have
   one (very expensive, multi-round build, 10–25% of game-end value
   on a tier-1 build).

### Ownership states per airport
- `state-owned` — default, neutral, accepts all bidders for slots.
- `concession` — operator owns the operating rights for X rounds.
- `private-owned` — sold permanently. Only the owner can lease slots
  to other airlines.
- `joint-venture` — multiple owners with weighted votes.

## V2 Pillar 2 — Airport development

Owners can invest cash to expand the airport's capability, which raises
both their own ground revenue AND the slot capacity available to all
airlines flying there. Tradeoff: the owner profits from leasing those
slots, so adding capacity grows the rentable inventory.

### Development tracks
1. **Runway.** Add runway → +N slots/year capacity tick.
2. **Terminal capacity.** Increases the per-slot daily passenger throughput
   ceiling — relevant when load factors hit the cap.
3. **Cargo apron.** Unlocks dedicated cargo slots at this airport.
4. **Premium piers.** Adds a "premium experience" multiplier — airlines
   flying from this airport get a tiny brand uplift; the owner charges
   a premium-pier surcharge to those airlines.
5. **Fuel farm.** Operator earns a margin on fuel sold to airlines
   flying through.
6. **Ground services hub.** Reduces airline turn-time → small load
   factor bonus, owner books the service revenue.

### Build pipeline
- Each track has a per-tier cost ladder (T1 build = ~5× T3 build).
- 1–3 round build time, partial work shows as "under construction"
  on the map.
- Partial completion still earns a fraction of the projected revenue.

## V2 Pillar 3 — Airport revenue

Owner P&L per airport per quarter:
```
+ Slot leases × 13 weeks (revenue from airlines)
+ Premium pier surcharges (passenger volume × small fee)
+ Fuel-farm margin (fuel sold × markup)
+ Retail / parking / lounge fees (passengers × $/pax)
+ Cargo apron revenue (tonnes × $/tonne)
- Airport opex (staff, maintenance, security)
- Concession / franchise fees (if not outright owned)
- Capex amortisation
- Property tax / regulatory fees
```

Expected outcome: a well-developed tier-1 airport in a busy hub city
should compete with a mid-fleet airline for net profit per round, but
with much lower volatility (no fuel, no fare competition).

## V2 Pillar 4 — Strategic interactions

This is where it gets interesting:
- An airline that owns its own hub has a **structural edge** on home
  routes — they pay slot rents to themselves, not to a rival.
- An airline that owns a **rival's hub** can squeeze them on slot
  prices (within reason — cap at 3× government default to keep it
  game-balanced, not punitive).
- Concession-period mechanics: the more you invest in development,
  the worse the loss when the concession expires.
- Acquiring **strategic chokepoint airports** (DXB, SIN, LHR, JFK)
  becomes a multiplayer kingmaker move.

## V2 Pillar 5 — UI surfaces

New screens / panels:
- **Airport Portfolio panel.** List of owned/concession airports,
  their dev state, projected revenue, ownership %.
- **Airport Detail modal.** Per-airport P&L, dev tracks, lease pricing,
  events log.
- **Map overlays.** Toggle "Show airport ownership" — colors each
  airport by its owner team. "Show terminal capacity" — heat-map
  fullness. "Show under-construction" — pulsing build markers.
- **Slot Lease screen.** Owners set their lease price (within the
  cap); other airlines see prices when bidding.
- **Airport Auctions panel.** Upcoming greenfield concessions +
  privatisation tenders + minority-stake offers.

## V2 Pillar 6 — Scenarios specific to airports

New event types:
- "Airport runway closed for 2 rounds — major maintenance"
- "Privatisation referendum at JFK — bid in by R<n> or be locked out"
- "Eminent domain — government buys back T2 airport at fair value"
- "Strike at DXB ground services — passenger throughput -25% for 1Q"
- "Premium-pier completion — owner +brand, all airlines +uplift"

## V2 Pillar 7 — Engine implications

- New types: `Airport`, `AirportOwnership`, `AirportDevState`
- `runQuarterClose` extended to compute per-airport P&L for owners
- New persistence section for airports (immutable IDs match cities)
- Endgame valuation now includes net airport portfolio value
- AI bots need an airport-acquisition layer (do they bid? develop?)

## V2 development plan (rough)

### Phase 1 — Foundations (2–3 weeks)
- New types + persistence migration (airport state per city)
- Airport ownership defaults: every airport starts state-owned
- Engine pass: airport opex line, slot revenue routes through
  owner instead of vanishing into the ether
- AdminPanel: facilitator can manually assign ownership for testing

### Phase 2 — Acquisition (1–2 weeks)
- Greenfield concession auction at game start
- Privatisation event scaffolding (no UI yet, just engine logic)
- Player can buy/lease airports manually via admin override

### Phase 3 — Development (2–3 weeks)
- 6 dev tracks with per-track engine effects
- Build pipeline + UI for in-progress builds
- Per-airport P&L in Reports

### Phase 4 — Map + portfolio UI (1–2 weeks)
- Airport ownership overlay
- Airport Portfolio panel + detail modal
- Player-set lease prices

### Phase 5 — AI + scenarios (1–2 weeks)
- AI bots compete for airport ownership
- 5–8 airport-specific scenarios

### Phase 6 — Endgame + polish (1 week)
- Combined airline + airport valuation in endgame
- Tiebreakers extended (airport count, dev investment, etc)
- Balance pass: are tier-1 airport ROIs balanced against mid-fleet
  airlines?

## Open questions for V2

1. Is V2 single-airline-multi-airport, or do we want multi-airline
   conglomerates? (Recommendation: single-airline, multi-airport for
   now — simpler to balance.)
2. Do owned airports affect the slot auction at all, or are auctions
   replaced entirely by lease-pricing?
3. Should there be regulatory limits on how many airports one team
   can own? (Probably yes — anti-monopoly cap.)
4. How much of V2 ships in the next workshop, vs feeling V1 is "done"
   and V2 is a separate cohort feature?

## Out of scope for V2

- Multi-tenant airport ownership beyond simple JV (no complex shareholder
  voting)
- Real-estate development around airports (cargo zones, etc beyond fuel
  farm)
- Domestic-vs-international airport split (treat all as one)
- Airline alliances (separate V3 feature)
