import type { NewsItem } from "@/types/game";

/**
 * 5 headlines per quarter × 20 quarters. Key PRD events are marked with
 * scenario hooks (§8.3). The rest are credible aviation-industry news that
 * contextualize the era and give player agency cues.
 */
function n(
  quarter: number,
  id: string,
  icon: string,
  impact: NewsItem["impact"],
  headline: string,
  detail: string,
): NewsItem {
  return { id: `Q${quarter}-${id}`, quarter, icon, impact, headline, detail };
}

export const WORLD_NEWS: NewsItem[] = [
  // ─── Q1 Brand building era (year 2000) ─────────────────────
  n(1, "A", "✈︎", "none", "Market opening: 100 cities, $150M seed capital", "Your airline is one of 2–10 competing for a 20-quarter window."),
  n(1, "B", "●", "tourism", "Global tourism up 6% year-on-year", "Baseline demand growth for all tier-1 cities."),
  n(1, "C", "$", "fuel", "Fuel index at 100 (baseline)", "Spot price $0.55/L. Hedging markets open."),
  n(1, "D", "◐", "business", "Business travel index flat", "No macro shift expected before Q3."),
  n(1, "E", "☐", "none", "Your hub selection window closes at Q1 board", "Blind bid triggers if multiple teams pick the same hub."),

  // ─── Q2 World Cup bid (S10) ────────────────────────────────
  n(2, "A", "⚽", "brand", "FIFA opens bidding for World Cup official carrier", "Sealed bid + elevator pitch. Winner decided at L6 (Q7)."),
  n(2, "B", "●", "tourism", "Low-cost carriers expanding Europe-Americas", "Tier-1 tourism demand up 4%."),
  n(2, "C", "◑", "business", "Asia-Pacific business growth outpaces rest of world", "BKK, SIN, HKG seeing accelerated demand."),
  n(2, "D", "☐", "cargo", "E-commerce logistics boom", "Cargo tonnage up 12% for tier-1 and tier-2 hubs."),
  n(2, "E", "$", "fuel", "Oil hovers around index 108", "Hedge-market speculation intensifies."),

  // ─── Q3 Fuel spike (S4) ────────────────────────────────────
  n(3, "A", "⚠", "fuel", "Fuel spike: index jumps to 135", "Quarterly fuel costs up 35%. S4 Oil Gamble triggered."),
  n(3, "B", "◐", "tourism", "Mediterranean tourism peaking", "FCO, BCN, ATH demand up 8% this quarter only."),
  n(3, "C", "●", "none", "FIFA Presidential visit at unnamed venue", "No game impact. Hidden clue for L6 Elevator pitch."),
  n(3, "D", "☐", "cargo", "Panama Canal expansion announced", "PTY tier reassessment pending."),
  n(3, "E", "◑", "business", "Silicon Valley hiring surge", "SFO, SAN, SEA business demand +5%."),

  // ─── Q4 Ghost Fleet (S1) ───────────────────────────────────
  n(4, "A", "⚠", "ops", "Regulatory review: maintenance forgery investigated industry-wide", "S1 Ghost Fleet scenario triggered."),
  n(4, "B", "◐", "tourism", "Chinese New Year travel record", "PEK, PVG, HKG tourism up 15% this quarter."),
  n(4, "C", "$", "fuel", "Fuel steadies at index 120", "OPEC signals stabilization."),
  n(4, "D", "●", "brand", "Cabin safety reporting standards tightened", "Brand-exposed airlines face scrutiny."),
  n(4, "E", "☐", "business", "Tech summit in DFW", "Business demand DFW +10% this quarter only."),

  // ─── Q5 Moscow Signal (S16) ────────────────────────────────
  n(5, "A", "⚠", "none", "Intelligence signal: Moscow corridor may close", "S16 Moscow Signal triggered. Lock-in decision."),
  n(5, "B", "◐", "tourism", "Summer travel season opens strong", "Europe tier-1 cities +6% tourism."),
  n(5, "C", "$", "fuel", "Fuel index 118", "Stable."),
  n(5, "D", "☐", "cargo", "Trans-Pacific cargo demand growing", "NRT, LAX, SFO cargo lanes busy."),
  n(5, "E", "●", "ops", "Pilot union wage negotiations open", "L1 Strike expected between Q4-Q5."),

  // ─── Q6 False alarm reveal + Gov lifeline (S5) ─────────────
  n(6, "A", "✓", "tourism", "False alarm: corridor stays open. Summer surge expected", "S16 plot twist revealed. Locked-in teams miss the surge."),
  n(6, "B", "⚠", "brand", "Government lifeline program announced", "S5 Government Lifeline triggered."),
  n(6, "C", "◐", "tourism", "Beach destination bookings up 20%", "Leisure tier-2 cities riding summer wave."),
  n(6, "D", "$", "fuel", "Fuel steady at 115", "Markets calm."),
  n(6, "E", "☐", "business", "Conference circuit resumes post-crisis", "Tier-1 business demand recovering."),

  // ─── Q7 Olympics + L6/L3 ───────────────────────────────────
  n(7, "A", "●", "brand", "Olympic sponsorship window opens", "S11 Olympic Play triggered."),
  n(7, "B", "⚠", "ops", "Whistleblower report surfaces", "L3 Whistleblower live sim between Q7-Q8."),
  n(7, "C", "◑", "business", "Asia-Pacific M&A wave", "HKG, SIN, TPE business demand +8%."),
  n(7, "D", "$", "fuel", "Fuel index 112", "Slight downward pressure."),
  n(7, "E", "☐", "cargo", "Pharmaceutical cargo surge", "Temperature-controlled tonnage rates up 15%."),

  // ─── Q8 War in Corridor (S2) ───────────────────────────────
  n(8, "A", "⚠", "ops", "Geopolitical conflict closes corridor airspace", "S2 War in Corridor triggered."),
  n(8, "B", "◐", "tourism", "Eastern European tourism craters", "PRG, WAW, BUD -20% demand."),
  n(8, "C", "$", "fuel", "Fuel index jumps to 125 on conflict", "Hedge impact now material."),
  n(8, "D", "●", "brand", "Industry consolidation rumors", "Small regional airlines at risk."),
  n(8, "E", "☐", "ops", "Crisis Operations Room live sim", "L7 between Q8-Q9. CMOs + CFOs extracted."),

  // ─── Q9 Recovery + Hungry Neighbour + Cocoa (S7, S18) ──────
  n(9, "A", "✓", "tourism", "Travel recovery index hits 92%", "Baseline demand returning to pre-crisis norms."),
  n(9, "B", "⚠", "business", "Regional competitor enters administration", "S7 Hungry Neighbour triggered."),
  n(9, "C", "⚠", "brand", "Cocoa supply collapses in West Africa", "S18 Cocoa Crisis triggered. Premium cabin costs triple."),
  n(9, "D", "$", "fuel", "Fuel eases to 115", "Post-conflict stabilization."),
  n(9, "E", "◐", "tourism", "Southern hemisphere winter travel window", "SYD, AKL, SCL uptick."),

  // ─── Q10 World Cup begins + Rate Window (S6) + L4 ──────────
  n(10, "A", "⚽", "brand", "World Cup kicks off. Official carrier at 100% load factor", "S10 winner gets Q10+Q11 load-factor override."),
  n(10, "B", "⚠", "none", "Rate window opens: refinancing available", "S6 Rate Window triggered."),
  n(10, "C", "●", "brand", "Media Podium press conference", "L4 live sim between Q10-Q11. CEO commitments logged."),
  n(10, "D", "◐", "tourism", "Host country tourism +40%", "World Cup bounce."),
  n(10, "E", "$", "fuel", "Fuel index 110", "Calm."),

  // ─── Q11 Political Favour (S8) ─────────────────────────────
  n(11, "A", "⚠", "ops", "State requests route subsidies", "S8 Political Favour triggered."),
  n(11, "B", "◐", "tourism", "Winter travel records in Alps region", "ZRH, MUC, VIE benefitting."),
  n(11, "C", "☐", "cargo", "Christmas cargo peak", "Cargo rates +15% for the quarter."),
  n(11, "D", "$", "fuel", "Fuel index 108", "Markets calm post-World Cup."),
  n(11, "E", "●", "brand", "Consumer confidence surveys strong", "Loyalty programs seeing uptick."),

  // ─── Q12 Talent Heist (S14) + L2 ───────────────────────────
  n(12, "A", "⚠", "ops", "Executive poaching wave hits industry", "S14 Talent Heist + L2 simultaneous."),
  n(12, "B", "◑", "business", "Rate hike announced for Q13", "Borrowing costs rising."),
  n(12, "C", "☐", "cargo", "Transpacific cargo rate normalization", "Rates easing back to baseline."),
  n(12, "D", "$", "fuel", "Fuel at 112", "Stable."),
  n(12, "E", "●", "tourism", "Cruise-and-fly packages booming", "MIA, SDQ, SJU seeing paired bookings."),

  // ─── Q13 Flash Deal (S3) + Recession ───────────────────────
  n(13, "A", "⚠", "none", "Recession declared. Consumer demand softens", "Baseline demand -10% industry-wide."),
  n(13, "B", "✈︎", "ops", "Airbus announces Flash Deal: 20 eco-engine units", "S3 Flash Deal. Pool mechanic active."),
  n(13, "C", "◐", "tourism", "Domestic tourism shift", "Short-haul demand relative uptick."),
  n(13, "D", "$", "fuel", "Fuel index 125 on recession-hedge volatility", "Wide spread markets."),
  n(13, "E", "●", "brand", "Project Aurora live sim window", "L5 between Q13-Q14. Hidden agenda mechanic."),

  // ─── Q14 Recession deepens (S15) ───────────────────────────
  n(14, "A", "⚠", "business", "Recession deepens. Business travel -25%", "S15 Recession Gamble triggered."),
  n(14, "B", "◐", "tourism", "Staycation trend dampens international travel", "Tier-1 tourism -8%."),
  n(14, "C", "$", "fuel", "Fuel index 118", "Recession pulls demand down."),
  n(14, "D", "●", "ops", "Union strike activity rising", "Watch for Ops slider exposure."),
  n(14, "E", "☐", "cargo", "Cargo outperforming passenger", "Cargo capacity tight, rates up."),

  // ─── Q15 Digital Gamble (S13) + Olympics (stimulus) ────────
  n(15, "A", "⚠", "ops", "AI platform rollout across industry", "S13 Digital Gamble triggered."),
  n(15, "B", "●", "tourism", "Government stimulus: travel vouchers distributed", "Tier-2 cities see 12% bump."),
  n(15, "C", "◐", "business", "Green recovery programs funded", "Early signal for Q17 Green Ultimatum."),
  n(15, "D", "$", "fuel", "Fuel index 115", "Markets bullish on recovery."),
  n(15, "E", "☐", "brand", "Loyalty program consolidation industry-wide", "Competitor rewards schemes tightening."),

  // ─── Q16 Recession ends + Blue Ocean (S9) ──────────────────
  n(16, "A", "✓", "business", "Recession officially ends", "Baseline demand recovering. S15 twist applies here."),
  n(16, "B", "⚠", "none", "Diplomatic thaw opens new corridor", "S9 Blue Ocean triggered."),
  n(16, "C", "◐", "tourism", "Pent-up demand releasing", "All tier-1 tourism +15% this quarter."),
  n(16, "D", "$", "fuel", "Fuel index 110", "Markets calm."),
  n(16, "E", "●", "cargo", "777X-9 enters service", "Heavy-lift capacity unlocked."),

  // ─── Q17 Green Ultimatum (S17) + Carbon levy ───────────────
  n(17, "A", "⚠", "ops", "Carbon levy takes effect: $45/tonne CO2", "S17 Green Ultimatum triggered."),
  n(17, "B", "●", "brand", "ESG-driven fund flows into aviation", "Green-flagged airlines see institutional interest."),
  n(17, "C", "◐", "tourism", "Sustainable travel premium segment growing", "Affluent tourists favor green carriers."),
  n(17, "D", "$", "fuel", "Fuel index 115", "Stable."),
  n(17, "E", "☐", "business", "Corporate travel ESG reporting mandated", "Business demand shifts toward green carriers."),

  // ─── Q18 Brand Grenade (S12) + Full recovery ───────────────
  n(18, "A", "⚠", "brand", "Ambassador scandal rocks industry", "S12 Brand Grenade triggered."),
  n(18, "B", "✓", "tourism", "Full recovery: tourism index at 108", "Best travel environment in 5 years."),
  n(18, "C", "◐", "business", "M&A cycle peaks", "Dealmaking travel surge."),
  n(18, "D", "$", "fuel", "Fuel index 112", "Calm."),
  n(18, "E", "●", "cargo", "Cargo division valuations peak", "Strategic opportunity for cargo-focused airlines."),

  // ─── Q19 Mature market ─────────────────────────────────────
  n(19, "A", "◐", "tourism", "Travel demand at cyclical peak", "Record tier-1 tourism."),
  n(19, "B", "●", "brand", "Customer loyalty programs renew", "Brand Value component shifts weighting."),
  n(19, "C", "☐", "cargo", "Asia-Europe cargo corridor expanding", "New Blue Ocean routes monetizing."),
  n(19, "D", "$", "fuel", "Fuel index 108", "Post-SAF adoption pressure."),
  n(19, "E", "⚠", "business", "Rate cycle peaks: borrowing costs at 5-year high", "Debt-heavy airlines exposed."),

  // ─── Q20 Final quarter (legacy 20-round PRD endpoint) ─────
  n(20, "A", "◐", "tourism", "Industry rounds out a strong half-decade", "Tier-1 leisure routes near record loads."),
  n(20, "B", "●", "brand", "First analyst coverage ratings of the cycle drop", "Brand-strong airlines pricing in premium."),
  n(20, "C", "$", "fuel", "Fuel index 110", "Hedge book unwinds smoothly."),
  n(20, "D", "☐", "cargo", "End-of-year shipping surge underway", "Cargo-active airlines stack revenue."),
  n(20, "E", "✓", "none", "Boards commission five-year strategic reviews", "Mid-game inflection coming for laggards."),

  // ─── Q21 (Q1 2020) Pre-recession recovery ────────────────
  n(21, "A", "$", "fuel", "Crude rebounds from 2019 lows", "Fuel index drifts toward 115 — modest hedging window."),
  n(21, "B", "◐", "tourism", "Asia-Pacific tourism back near record highs", "BKK, SIN, HKG demand +5%."),
  n(21, "C", "◑", "business", "Western tech IPO calendar strongest in years", "SFO, JFK business demand +6%."),
  n(21, "D", "☐", "cargo", "E-commerce parcels overtake mail at major sorters", "Cargo tonnage +8% across T1-2 hubs."),
  n(21, "E", "●", "ops", "Regulators consult on cabin air filtration standards", "No game effect — standards-work in progress."),

  // ─── Q22 (Q2 2020) — 787 supplier delay event fires ──────
  n(22, "A", "⚠", "ops", "Boeing 787 program hit by composite-supplier dispute", "Existing 787-8 orders pushed two rounds out."),
  n(22, "B", "◐", "tourism", "Long-weekend travel surge across Europe", "T1-2 European cities tourism +3%."),
  n(22, "C", "$", "fuel", "OPEC+ tightens supply marginally", "Index nudges toward 118."),
  n(22, "D", "◑", "business", "Major banks restart international hiring", "LON, FRA, JFK business +4%."),
  n(22, "E", "☐", "ops", "Senior pilot retirement wave begins", "Early signal for the talent squeeze."),

  // ─── Q23 (Q3 2020) — S14 Hydrogen Bet + WC tail ──────────
  n(23, "A", "⚠", "ops", "Hydrogen-airframe consortium opens private fundraise", "S14 Hydrogen Bet decision opens this quarter."),
  n(23, "B", "$", "fuel", "Refinery maintenance season tightens jet fuel", "Index drifts toward 122."),
  n(23, "C", "◐", "tourism", "Cultural-festival season fills regional airports", "Tier-2 European cities tourism +5%."),
  n(23, "D", "☐", "cargo", "Ocean-freight rates jump; shippers turn to air", "Cargo demand resilient in disrupted lanes."),
  n(23, "E", "●", "brand", "Industry brand surveys put service experience at #1 driver", "Loyalty-led airlines compound advantage."),

  // ─── Q24 (Q4 2020) — World Cup tail ──────────────────────
  n(24, "A", "◐", "tourism", "Holiday travel records broken in North America", "JFK, LAX, ORD tourism +6%."),
  n(24, "B", "◑", "business", "Year-end deal-making clogs financial centres", "LON, JFK, HKG business +4%."),
  n(24, "C", "$", "fuel", "Index settles around 115", "Stable winter pricing."),
  n(24, "D", "☐", "cargo", "Christmas e-commerce hits all-time highs", "Cargo +10% T1-2."),
  n(24, "E", "●", "ops", "ICAO publishes new safe-flight guidance for retrofit fleets", "No immediate game effect — review your eco upgrades."),

  // ─── Q25 (Q1 2021) — S3 Saudi Vision Fund ────────────────
  n(25, "A", "⚠", "brand", "Saudi sovereign wealth fund opens aviation tranche", "S3 Vision Fund decision opens — premium positioning at stake."),
  n(25, "B", "◑", "business", "Asia-Pacific business travel back at 2019 peak", "SIN, HKG, BKK +6%."),
  n(25, "C", "$", "fuel", "Crude steady around 112 with mild upside risk", "Mild hedge window."),
  n(25, "D", "◐", "tourism", "Spring-break travel record forecasts", "T1-2 leisure routes capacity-tight."),
  n(25, "E", "☐", "cargo", "Pharmaceutical air-freight contracts oversubscribed", "Cargo carriers can name their price."),

  // ─── Q26 (Q2 2021) Mid-cycle calm ────────────────────────
  n(26, "A", "◑", "business", "Tech earnings season delivers above-consensus", "SFO, SAN, SEA business +5%."),
  n(26, "B", "◐", "tourism", "Mediterranean summer bookings open early", "FCO, BCN, ATH tourism +6%."),
  n(26, "C", "$", "fuel", "Refining margins compress on mild winter inventory", "Index drifts to 110."),
  n(26, "D", "☐", "cargo", "Cross-border e-commerce growth holds at 12%", "Cargo +5% on hub-to-hub."),
  n(26, "E", "⚠", "ops", "Industry-wide audits show mid-life maintenance gaps", "Watch your fleet's deficit and Ops slider."),

  // ─── Q27 (Q3 2021) — S15 Recession Gamble ────────────────
  n(27, "A", "⚠", "tourism", "Recession declared — leisure demand dropping 25%", "S15 Recession Gamble triggered."),
  n(27, "B", "◑", "business", "Corporate travel budgets paused at major banks", "LON, JFK, FRA business -10%."),
  n(27, "C", "$", "fuel", "Demand destruction softens index to 95", "Cheaper ops — but yield falls in lockstep."),
  n(27, "D", "☐", "cargo", "Holiday cargo demand insulated from leisure slump", "Cargo channel hedges the downturn."),
  n(27, "E", "●", "brand", "Consumers reward airlines with strong recession-era ops", "Brand+Loyalty-led carriers compound."),

  // ─── Q28 (Q4 2021) Recession trough → recovery ──────────
  n(28, "A", "◐", "tourism", "Recession bottoms — first leading indicators turn positive", "T1-2 tourism stabilising."),
  n(28, "B", "◑", "business", "M&A deal flow returns to top-quartile", "LON, JFK, HKG business +3%."),
  n(28, "C", "$", "fuel", "Index recovers to 100", "Volatility low; hedging optional."),
  n(28, "D", "☐", "cargo", "Year-end cargo surge holds despite recession", "Cargo strong on hub routes."),
  n(28, "E", "●", "ops", "Brand surveys: pandemic-era operators rewarded", "Loyalty-points compounding for steady performers."),

  // ─── Q29 (Q1 2022) — S13 Digital + Olympics opening ──────
  n(29, "A", "⚠", "ops", "Industry-wide AI-ops platform launches enterprise tier", "S13 Digital Gamble decision opens."),
  n(29, "B", "◐", "tourism", "Olympic broadcasting drives spillover bookings", "Host-city + adjacent airports demand-rich."),
  n(29, "C", "$", "fuel", "Geopolitical tension nudges crude up", "Index toward 110."),
  n(29, "D", "☐", "cargo", "AI-driven sortation cuts cargo turnaround 20%", "Operational tailwind for cargo specialists."),
  n(29, "E", "●", "business", "Global business-travel rebound complete", "Major financial centres at pre-recession baseline."),

  // ─── Q30 (Q2 2022) Post-Olympic flow + capex cycle ──────
  n(30, "A", "◑", "business", "Post-recession capex unleashes tech spending", "SFO, SAN, BLR business +6%."),
  n(30, "B", "◐", "tourism", "Olympic afterglow boosts regional airport traffic", "Host-city tail effect through Q4."),
  n(30, "C", "$", "fuel", "Index 112 — geopolitical premium baked in", "Hedge book worth reviewing."),
  n(30, "D", "☐", "cargo", "Industrial restocking lifts cargo freight rates", "Cargo +7%."),
  n(30, "E", "⚠", "ops", "Average fleet age across the industry crosses 12 quarters", "Aging-fleet flag risk — consider neo/MAX orders."),

  // ─── Q31 (Q3 2022) — S9 Talent Wars ──────────────────────
  n(31, "A", "⚠", "ops", "Pilot poaching wars: $3M signing bonuses become standard", "S9 Talent Wars decision opens."),
  n(31, "B", "◑", "business", "Asian financial hubs expand H1 visas", "SIN, HKG, TYO business +5%."),
  n(31, "C", "◐", "tourism", "Adventure-travel category grows 25% YoY", "Tier-3 emerging routes monetising."),
  n(31, "D", "$", "fuel", "Index drifts back to 105", "Stable; SAF blend mandates whisper."),
  n(31, "E", "☐", "cargo", "Cold-chain pharmaceutical air freight enters new growth phase", "Cargo specialty +12%."),

  // ─── Q32 (Q4 2022) Year-end normality ────────────────────
  n(32, "A", "◑", "business", "Year-end corporate travel matches pre-recession peak", "LON, JFK, HKG business +4%."),
  n(32, "B", "◐", "tourism", "Holiday travel demand records again", "T1-2 tourism +6%."),
  n(32, "C", "$", "fuel", "Index settles at 102", "Hedge unwinds; SAF cost differential mounting."),
  n(32, "D", "☐", "cargo", "E-commerce platforms compress delivery windows", "Cargo speed premium widening."),
  n(32, "E", "●", "brand", "First sustainability index ranks airlines publicly", "S17 Green Ultimatum incoming."),

  // ─── Q33 (Q1 2023) — S17 Green Ultimatum / Carbon Levy ───
  n(33, "A", "⚠", "brand", "EU adopts carbon levy — ICAO follows industry-wide", "S17 Green Ultimatum triggered."),
  n(33, "B", "◑", "business", "Tech earnings beat consensus despite higher rates", "SFO, JFK business +4%."),
  n(33, "C", "$", "fuel", "Carbon adjustment effectively raises fuel cost", "Non-SAF airlines pay the differential."),
  n(33, "D", "◐", "tourism", "Sustainable-tourism marketing surge", "Brand-leaders earn loyalty bumps."),
  n(33, "E", "☐", "cargo", "Cargo leaders adopting SAF blends voluntarily", "Green-ops gain regulatory cover."),

  // ─── Q34 (Q2 2023) Post-levy adjustment ──────────────────
  n(34, "A", "◐", "tourism", "Spring/summer leisure bookings outpace 2022", "T1-2 tourism +5%."),
  n(34, "B", "◑", "business", "Corporate dealmaking in MENA hits decade high", "DXB, RUH, AUH business +8%."),
  n(34, "C", "$", "fuel", "SAF mandates bite: non-green pay premium", "Index effectively 115 for non-SAF carriers."),
  n(34, "D", "☐", "cargo", "Carbon-neutral shipping demand premium emerges", "Cargo green premium captures share."),
  n(34, "E", "●", "brand", "ESG indices reward early adopters", "Brand+loyalty tail effect for green leaders."),

  // ─── Q35 (Q3 2023) — S12 Brand Grenade ───────────────────
  n(35, "A", "⚠", "brand", "Brand ambassador said something unforgivable on air", "S12 Brand Grenade triggered."),
  n(35, "B", "◑", "business", "Asian carrier consolidation: regionals merge", "Competition reshuffles in APAC."),
  n(35, "C", "◐", "tourism", "Niche luxury travel brands take 12% share", "Premium-cabin yields attractive."),
  n(35, "D", "$", "fuel", "Index stable near 105", "Hedge environment quiet."),
  n(35, "E", "☐", "cargo", "Critical-component air freight in robust demand", "Cargo +4%."),

  // ─── Q36 (Q4 2023) Late-game holiday peak ────────────────
  n(36, "A", "◐", "tourism", "Holiday season travel records fall again", "T1-2 tourism +6%."),
  n(36, "B", "◑", "business", "Year-end M&A blockbuster announcements", "LON, JFK +5%."),
  n(36, "C", "$", "fuel", "Index winter dip to 100", "Cheap-ops window for non-SAF carriers."),
  n(36, "D", "☐", "cargo", "Christmas e-commerce sets new highs", "Cargo +10%."),
  n(36, "E", "●", "ops", "Pilot shortage easing as training pipelines refill", "Talent-cost tailwind."),

  // ─── Q37 (Q1 2024) Late-game maturity ────────────────────
  n(37, "A", "◐", "tourism", "Asia-Pacific tourism extends multi-year boom", "BKK, SIN, HKG +6%."),
  n(37, "B", "◑", "business", "Middle-East hubs attract global capital flows", "DXB, RUH +6%."),
  n(37, "C", "$", "fuel", "Index 105; volatility low", "Stable."),
  n(37, "D", "☐", "cargo", "Pharmaceutical air-freight CAGR sustains 8%", "Cargo specialty resilient."),
  n(37, "E", "●", "ops", "Industry-wide fleet renewal accelerates with neo/MAX deliveries", "Eco-fleet demand uplift unlocked."),

  // ─── Q38 (Q2 2024) Olympic-afterglow tail ───────────────
  n(38, "A", "◐", "tourism", "Olympic afterglow drives Mediterranean bookings", "FCO, BCN, ATH tourism +5%."),
  n(38, "B", "◑", "business", "AI-platform vendors drive tech-cluster demand", "SFO, SAN, BLR business +5%."),
  n(38, "C", "$", "fuel", "Index 108", "Mild upside; consider hedging."),
  n(38, "D", "☐", "cargo", "Fast-fashion logistics drives mid-haul cargo", "Cargo +5%."),
  n(38, "E", "●", "brand", "Major airline alliances reshuffle", "Premium-airline flag value heightened."),

  // ─── Q39 (Q3 2024) Late-cycle peak ───────────────────────
  n(39, "A", "◐", "tourism", "End-of-summer leisure peaks across hemispheres", "T1-2 tourism +6%."),
  n(39, "B", "◑", "business", "Year-end deal-flow holds at all-time records", "Major business hubs +4%."),
  n(39, "C", "$", "fuel", "Index 105", "Hedge season closes."),
  n(39, "D", "☐", "cargo", "Cross-border e-commerce up 14%", "Cargo +8%."),
  n(39, "E", "●", "brand", "Investor coverage of aviation at multi-year highs", "Brand-value translating into airline value."),

  // ─── Q40 (Q4 2024) Final round — endgame ─────────────────
  n(40, "A", "⚠", "none", "Final-quarter audits and brand rankings being prepared", "Endgame scoring imminent — brand+loyalty+cash all count."),
  n(40, "B", "◐", "tourism", "Holiday travel breaks more records", "T1-2 tourism +6%."),
  n(40, "C", "◑", "business", "Year-end corporate travel hits new highs", "Major business hubs +5%."),
  n(40, "D", "$", "fuel", "Index 102", "Stable to close."),
  n(40, "E", "✓", "none", "Investor pitch and MVP awards next", "Final scoring after Q40 close."),
];

export const NEWS_BY_QUARTER: Record<number, NewsItem[]> = WORLD_NEWS.reduce(
  (acc, item) => {
    (acc[item.quarter] ??= []).push(item);
    return acc;
  },
  {} as Record<number, NewsItem[]>,
);

/**
 * Dynamic host-city headlines. The World Cup and Olympic host cities
 * are randomized per-game (tier 1-2, never a player or rival hub), so
 * they can't live in the static WORLD_NEWS array. This helper returns
 * any host-related headline that should fire for the given quarter.
 *
 * Schedule:
 *   - World Cup host announcement: round 3 (S10 round)
 *   - World Cup tournament window: rounds 19-22 main, 23-24 tail
 *   - Olympic host announcement: round 13 (S11 round)
 *   - Olympic tournament window: rounds 29-32
 */
export function dynamicHostNews(
  quarter: number,
  worldCupHostCode: string | null | undefined,
  olympicHostCode: string | null | undefined,
  cityNameLookup: (code: string) => string | undefined,
): NewsItem[] {
  const out: NewsItem[] = [];

  // World Cup
  if (worldCupHostCode) {
    const wcCity = cityNameLookup(worldCupHostCode) ?? worldCupHostCode;
    if (quarter === 3) {
      out.push({
        id: `Q${quarter}-WC-HOST-ANNOUNCED`,
        quarter,
        icon: "⚽",
        impact: "tourism",
        headline: `FIFA names ${wcCity} as official World Cup host city`,
        detail: `Routes touching ${wcCity} (${worldCupHostCode}) will see heavy demand surges in rounds 19-24. S10 sealed-bid carrier auction opens this quarter.`,
      });
    }
    if (quarter === 19) {
      out.push({
        id: `Q${quarter}-WC-OPENING`,
        quarter,
        icon: "⚽",
        impact: "tourism",
        headline: `World Cup opening week — ${wcCity} airports overwhelmed`,
        detail: `Demand on routes touching ${wcCity} (${worldCupHostCode}) is locked at near-full loads through Q4 of this year. Slot leases at the host city are at premium prices.`,
      });
    }
    if (quarter === 23) {
      out.push({
        id: `Q${quarter}-WC-FINALS`,
        quarter,
        icon: "⚽",
        impact: "tourism",
        headline: `World Cup quarterfinals → final stretch in ${wcCity}`,
        detail: `Tail-end uplift on ${wcCity} (${worldCupHostCode}) routes — +50% above your pre-tournament baseline if you held capacity through the group stage.`,
      });
    }
  }

  // Olympics
  if (olympicHostCode) {
    const olCity = cityNameLookup(olympicHostCode) ?? olympicHostCode;
    if (quarter === 13) {
      out.push({
        id: `Q${quarter}-OL-HOST-ANNOUNCED`,
        quarter,
        icon: "🏅",
        impact: "tourism",
        headline: `IOC confirms ${olCity} for the upcoming Summer Olympics`,
        detail: `Demand surge expected on ${olCity} (${olympicHostCode}) routes through the rounds 29-32 window. S11 Olympic Play sponsorship slots open this quarter.`,
      });
    }
    if (quarter === 29) {
      out.push({
        id: `Q${quarter}-OL-OPENING`,
        quarter,
        icon: "🏅",
        impact: "tourism",
        headline: `Olympic torch lit in ${olCity}`,
        detail: `Routes touching ${olCity} (${olympicHostCode}) ride the surge through the Games. Official airline partners get a 95% sealed load floor.`,
      });
    }
  }

  return out;
}
