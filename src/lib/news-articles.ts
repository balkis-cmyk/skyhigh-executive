import type { NewsItem } from "@/types/game";

/**
 * Hypothetical news articles that expand each headline into a 2-3 paragraph
 * read. The flat headline + one-line detail in `world-news.ts` is fine for
 * the ticker, but the player wanted full articles when they click in.
 *
 * The shape:
 *   - dateline: city + bureau (deterministic from the news id)
 *   - byline:   journalist + role (deterministic from the news id)
 *   - body:     a string array of paragraphs. We prefer hand-written
 *     articles for the high-impact PRD scenarios (S1, S2, S5, S10, S15,
 *     S18 etc.) and fall back to a templated body for filler items.
 *
 * No engine logic depends on this module — it's purely cosmetic flavour.
 */

interface Article {
  dateline: string;
  byline: string;
  body: string[];
  /** Optional pull-quote rendered in a callout for variety. */
  quote?: { text: string; attribution: string };
}

const BUREAUS = [
  "Dubai", "London", "New York", "Singapore", "Hong Kong", "Frankfurt",
  "Geneva", "Tokyo", "Doha", "Brussels", "Mumbai", "Sao Paulo",
];

const JOURNALISTS = [
  { name: "Marcus Chen",       role: "Aviation Correspondent" },
  { name: "Priya Iyer",        role: "Aerospace Editor" },
  { name: "Yusuf al-Mansouri", role: "Industry Reporter" },
  { name: "Helena Vargas",     role: "Markets Correspondent" },
  { name: "Daniel Berger",     role: "Senior Aviation Writer" },
  { name: "Anika Patel",       role: "Aerospace Correspondent" },
  { name: "Tariq Hassan",      role: "Senior Industry Reporter" },
  { name: "Sofia Russo",       role: "Aviation Editor" },
];

/** Deterministic hash-based pick from a list. Same news id always maps
 *  to the same byline/bureau, so refreshing doesn't reshuffle. */
function pick<T>(items: T[], id: string, salt = 0): T {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return items[Math.abs(h) % items.length];
}

/** Hand-written articles keyed by news id. Anything not in this map gets
 *  a templated fallback. */
const ARTICLES: Record<string, string[]> = {
  // Q1 — opening
  "Q1-A": [
    "DUBAI — A new generation of carriers is preparing to enter what analysts are calling the most contested five-year window in commercial aviation since deregulation.",
    "Each operator begins with $150 million in seed capital, hub rights at one of ten primary international airports, and a 20-quarter clock to build a sustainable balance sheet, an attractive brand, and a route network that can absorb the inevitable shocks coming.",
    "Industry watchers say the survivors will be defined less by their fleet plans and more by the discipline of their first three quarters. \"You can recover from a bad route,\" says one senior consultant. \"You almost never recover from a bad balance sheet decision in Q3.\"",
  ],

  // Q3 — Fuel spike
  "Q3-A": [
    "GENEVA — Brent crude jumped 35% overnight on a confluence of supply disruptions and weaker-than-expected refinery output, sending the global jet fuel index to 135 from a baseline of 100.",
    "Carriers without active hedging programs are facing an immediate squeeze on quarterly margins. Industry analysts estimate the average wide-body operator will see fuel-cost-as-a-share-of-revenue rise from roughly 22% to over 30% if the spike persists into the next reporting cycle.",
    "Boards across the sector are convening on an emergency basis to evaluate hedge ladders, route mothballing, and capacity rationalization. Several CEOs declined to comment publicly, citing live trading windows.",
  ],

  // Q4 — Ghost Fleet
  "Q4-A": [
    "LONDON — Civil aviation regulators have launched a coordinated, industry-wide review of maintenance documentation following whistleblower reports of forged sign-offs at multiple operators.",
    "The investigation focuses on wide-body aircraft serviced by third-party heavy-maintenance vendors over the past 18 months. Investigators are reportedly cross-referencing engineer signatures against payroll records — a technique that has already turned up irregularities at one carrier.",
    "Boards are weighing the calculus of self-disclosure versus quiet remediation. \"Self-reporting is expensive in the short term,\" said one former regulator. \"It is rarely as expensive as the alternative when the regulator finds it independently.\"",
  ],

  // Q6 — Government Lifeline
  "Q6-B": [
    "DOHA — Treasury officials confirmed today the launch of a $300 million-per-recipient post-crisis recovery program, available to qualifying carriers who agree to specified route obligations and a two-quarter freeze on involuntary staff reductions.",
    "The strings attached are non-trivial. Recipients will be required to operate three thin domestic routes at quarterly losses estimated at $5 million each, accept a non-voting government observer on the board, and waive the right to participate in the next capital-equipment subsidy round.",
    "Critics of the program argue it perpetuates capacity imbalances and shields under-performing operators from market discipline. Treasury counters that the alternative — visible carrier failures during a recovery — would damage broader consumer confidence.",
  ],

  // Q8 — War in Corridor
  "Q8-A": [
    "BRUSSELS — A geopolitical escalation has resulted in the immediate closure of airspace over a critical mid-continent corridor, affecting an estimated $400 million in quarterly revenue across the sector.",
    "Operators have hours, not days, to make routing decisions. Re-routing extends flight times by 90–180 minutes per leg and burns 15–25% additional fuel; suspending the routes entirely risks losing slot rights at the affected airports. A handful of carriers are betting that emergency-insurance riders are cheaper than either.",
    "Insurance underwriters have already moved premiums up 4× on overflight policies for the region, with one syndicate withdrawing coverage altogether.",
  ],

  // Q9 — Cocoa Crisis
  "Q9-C": [
    "ABIDJAN — A cascade of disease outbreak, drought, and a smaller-than-expected mid-crop has led to a near-collapse in the West African cocoa harvest. Spot prices for cocoa beans have tripled in the last eight weeks.",
    "The downstream effect on aviation is concentrated, but unusually emotional. Premium-cabin chocolate amenities — the small ritual of warm chocolate after dinner service — have become a quiet differentiator on long-haul, with frequent business travellers now identifying it explicitly as a reason they choose certain carriers.",
    "Boards are split between absorbing the cost (estimated $4M annual to a typical wide-body operator), dropping the program, or rebranding the moment as a values-led ethical-sourcing announcement. Brand specialists warn against the third option absent genuine sourcing changes — \"the audience for greenwashing is more sophisticated than it was a decade ago.\"",
  ],

  // Q10 — World Cup
  "Q10-A": [
    "RIO DE JANEIRO — The official-carrier of the World Cup tournament saw load factors hit 100% on the opening weekend, with airport authorities reporting the busiest single-day departure volumes on record at the host country's primary international hub.",
    "The bid winner gets a two-quarter load-factor override on tournament-relevant routes — effectively a guaranteed 100% load on inbound legs to the host country regardless of pricing strategy. Industry analysts estimate the financial uplift at $40-60M per qualifying route over the period.",
    "Losing bidders are watching closely. The same calendar window also captures the Olympics bidding cycle, which several CMOs have flagged as their make-or-break sponsorship play of the simulation.",
  ],

  // Q14 — Recession Gamble
  "Q14-A": [
    "FRANKFURT — Forward-looking demand indicators dropped sharply this morning across leisure, business, and cargo segments, with the consensus 12-month forecast revised down by 6 percentage points.",
    "Boards are now choosing between four well-rehearsed responses: deep involuntary redundancy (typically saving 50% of two quarters of payroll), temporary measures like furloughs and hiring freezes (around 25%), holding the team intact, or counter-cyclical investment that bets on rivals retreating.",
    "The brand and loyalty cost of mass redundancy is significant and durable; the cash relief is immediate. \"You can rebuild a P&L in two quarters,\" said one retired CEO consulted on the wave. \"You cannot rebuild employer brand in less than five.\"",
  ],

  // Q9 — Hungry Neighbour
  "Q9-B": [
    "JAKARTA — A regional competitor with $200M in outstanding obligations entered formal administration this morning, opening a window for adjacent carriers to acquire viable route rights, slot pairs, and aircraft on accelerated terms.",
    "The administrator is accepting bids in three lots: a wide-body fleet block, a narrow-body fleet block, and a slot-rights package for two tier-2 cities. Industry sources expect competitive bidding for the slot-rights lot in particular.",
    "Boards considering bids are being warned that the asset prices on the surface frequently understate the working-capital and fleet-integration costs that follow.",
  ],

  // Q5 — Moscow Signal
  "Q5-A": [
    "WARSAW — Multiple intelligence channels are now reporting elevated signal traffic suggesting the Moscow corridor — one of the world's most heavily-trafficked east-west commercial overflight zones — may close to commercial aviation within 60 to 90 days.",
    "The signal has not been independently confirmed by national aviation authorities. Some analysts are urging caution. \"There is a long history of intelligence leaks that did not materialize,\" notes one regional risk specialist. \"Locking in expensive contingency capacity on every weak signal is a real way to bleed margin.\"",
    "Boards are weighing the cost of pre-emptive re-routing — measured in tens of millions of dollars over a year — against the catastrophic operational cost of a sudden closure.",
  ],
};

const FALLBACK_OPENERS = [
  "Industry observers are watching closely as",
  "Sector analysts say",
  "Aviation desks across major capitals are reporting that",
  "The latest market readings indicate that",
  "Boardroom briefings this week center on the news that",
];

const FALLBACK_MIDDLES = [
  "Carriers with strong balance-sheet positioning are expected to absorb the development with minimal disruption, while leveraged operators may face working-capital pressure if the trend persists into the next reporting cycle.",
  "Reactions across the sector have been measured but cautious, with several CEOs noting privately that the second-order effects often matter more than the headline.",
  "Analysts caution that early reactions may overshoot the underlying signal; the prudent move is typically to hold position and re-evaluate at quarter close.",
  "Hedging desks reported elevated volume on the news, particularly around fuel and FX exposure for carriers with multi-currency revenue.",
];

const FALLBACK_CLOSERS = [
  "Whether boards adjust strategy or hold pat will be visible at the next reporting cycle.",
  "The story is developing and is likely to draw further commentary from regulators in the coming weeks.",
  "For now, operators are watching, modelling, and waiting for confirmation.",
  "The next two quarters will determine whether this becomes a footnote or a turning point.",
];

export function getArticle(item: NewsItem): Article {
  const dateline = pick(BUREAUS, item.id);
  const journo = pick(JOURNALISTS, item.id, 7);
  const byline = `${journo.name}, ${journo.role}`;

  let body = ARTICLES[item.id];
  if (!body) {
    // Fallback: generate a 3-paragraph templated piece around headline + detail.
    body = [
      `${pick(FALLBACK_OPENERS, item.id, 11)} ${item.headline.toLowerCase()}.`,
      `${item.detail} ${pick(FALLBACK_MIDDLES, item.id, 13)}`,
      pick(FALLBACK_CLOSERS, item.id, 17),
    ];
  }

  return { dateline, byline, body };
}
