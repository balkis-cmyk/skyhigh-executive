/**
 * SkyForce simulation engine. Pure TS, UI-agnostic.
 *
 * Implements PRD §5 (demand, attractiveness, market share, revenue, costs,
 * loyalty, Brand Value), §6 (depreciation), §9 (quarter close orchestration),
 * addendum A3 (staff cost), A15 (taxes).
 *
 * Single-team MVP simplification: when only the player operates a route,
 * market_share = 1.0 capped by demand. Full multi-team attractiveness
 * competition is stubbed for competitor-mock data but the formulas are all
 * in place so when Supabase-backed multi-team lands, only the caller changes.
 */

import { AIRCRAFT_BY_ID } from "@/data/aircraft";
import { CITIES_BY_CODE } from "@/data/cities";
import { SCENARIOS, type OptionEffect, type Scenario } from "@/data/scenarios";
import type {
  City,
  FleetAircraft,
  LoanInstrument,
  PricingTier,
  Route,
  SliderLevel,
  Sliders,
  Team,
} from "@/types/game";

// ─── Distance (Haversine, PRD A1) ──────────────────────────
const EARTH_RADIUS_KM = 6371;
export function haversineKm(a: City, b: City): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const aa =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(aa));
}

export function distanceBetween(origin: string, dest: string): number {
  const a = CITIES_BY_CODE[origin];
  const b = CITIES_BY_CODE[dest];
  if (!a || !b) return 0;
  return haversineKm(a, b);
}

// ─── City demand growth (PRD §5.1) ─────────────────────────
export function cityTourismAtQuarter(city: City, quarter: number): number {
  return city.tourism * Math.pow(1 + city.tourismGrowth / 100 / 4, quarter - 1);
}
export function cityBusinessAtQuarter(city: City, quarter: number): number {
  return city.business * Math.pow(1 + city.businessGrowth / 100 / 4, quarter - 1);
}

// ─── Route demand (PRD §5.2) ───────────────────────────────
export function routeDemandPerDay(
  origin: string,
  dest: string,
  quarter: number,
): { tourism: number; business: number; total: number; amplifier: number } {
  const a = CITIES_BY_CODE[origin];
  const b = CITIES_BY_CODE[dest];
  if (!a || !b) return { tourism: 0, business: 0, total: 0, amplifier: 1 };
  const amplifier = Math.min(a.amplifier, b.amplifier);
  const tourism =
    (cityTourismAtQuarter(a, quarter) + cityTourismAtQuarter(b, quarter)) *
    amplifier;
  const business =
    (cityBusinessAtQuarter(a, quarter) + cityBusinessAtQuarter(b, quarter)) *
    amplifier;
  return { tourism, business, total: tourism + business, amplifier };
}

// ─── Pricing multipliers (PRD §5.5 + §17) ──────────────────
export const PRICE_TIER: Record<PricingTier, number> = {
  budget: 0.8,
  standard: 1.0,
  premium: 1.25,
  ultra: 1.6,
};

/** Base fare per pax by distance band (PRD A11 economy base, blended). */
export function baseFareForDistance(km: number): number {
  if (km < 2000) return 120;
  if (km < 5000) return 350;
  if (km < 10_000) return 650;
  return 950;
}

// ─── Slider levels + impacts (PRD A2 + B1) ─────────────────
export const SLIDER_LABELS: Record<SliderLevel, string> = {
  0: "Very Low",
  1: "Low",
  2: "Standard",
  3: "High",
  4: "Very High",
  5: "Extreme",
};

/** Slider spend as % of revenue (A2). Staff is separate (A3). */
export const SLIDER_PCT_REVENUE: Record<SliderLevel, number> = {
  0: 0,
  1: 0.03,
  2: 0.06,
  3: 0.10,
  4: 0.15,
  5: 0.20,
};

/** Slider effects (per quarter) per category. Pulled from PRD §3.2 + B1. */
export const SLIDER_EFFECTS: Record<
  keyof Sliders,
  Record<SliderLevel, { brandPts: number; loyalty: number; opsPts?: number }>
> = {
  staff: {
    0: { brandPts: 0, loyalty: -3, opsPts: -5 },
    1: { brandPts: 0, loyalty: -1, opsPts: -2 },
    2: { brandPts: 0, loyalty: 0, opsPts: 0 },
    3: { brandPts: 0, loyalty: 2, opsPts: 3 },
    4: { brandPts: 0, loyalty: 4, opsPts: 6 },
    5: { brandPts: 5, loyalty: 7, opsPts: 10 },
  },
  marketing: {
    0: { brandPts: -4, loyalty: -2 },
    1: { brandPts: -1, loyalty: -1 },
    2: { brandPts: 0, loyalty: 0 },
    3: { brandPts: 3, loyalty: 1 },
    4: { brandPts: 6, loyalty: 3 },
    5: { brandPts: 10, loyalty: 6 },
  },
  service: {
    0: { brandPts: -4, loyalty: -5 },
    1: { brandPts: -2, loyalty: -2 },
    2: { brandPts: 0, loyalty: 0 },
    3: { brandPts: 3, loyalty: 4 },
    4: { brandPts: 6, loyalty: 7 },
    5: { brandPts: 10, loyalty: 12 },
  },
  rewards: {
    0: { brandPts: 0, loyalty: -5 },
    1: { brandPts: 0, loyalty: 0 },
    2: { brandPts: 0, loyalty: 2 },
    3: { brandPts: 0, loyalty: 5 },
    4: { brandPts: 2, loyalty: 8 },
    5: { brandPts: 4, loyalty: 12 },
  },
  operations: {
    0: { brandPts: -3, loyalty: 0, opsPts: -5 },
    1: { brandPts: -1, loyalty: 0, opsPts: -2 },
    2: { brandPts: 0, loyalty: 0, opsPts: 0 },
    3: { brandPts: 0, loyalty: 0, opsPts: 3 },
    4: { brandPts: 0, loyalty: 0, opsPts: 6 },
    5: { brandPts: 0, loyalty: 0, opsPts: 10 },
  },
};

/** Compounding multiplier (PRD §3.2): 1.0 → 1.2× at 3Q → 1.5× at 6Q. */
export function streakMultiplier(quartersAtLevel: number): number {
  if (quartersAtLevel >= 6) return 1.5;
  if (quartersAtLevel >= 3) return 1.2;
  return 1.0;
}

// ─── Staff cost (A3) ───────────────────────────────────────
export function baselineStaffCostUsd(team: Team): number {
  const fleetSize = team.fleet.filter((f) => f.status === "active").length;
  const activeRoutes = team.routes.filter((r) => r.status === "active").length;
  const hubCount = 1; // secondary hubs not yet modeled
  return (
    fleetSize * 180_000 +
    activeRoutes * 45_000 +
    hubCount * 800_000 +
    2_000_000 // HQ minimum
  );
}

export const STAFF_MULTIPLIER: Record<SliderLevel, number> = {
  0: 0.5, 1: 0.75, 2: 1.0, 3: 1.1, 4: 1.2, 5: 1.5,
};

// ─── Attractiveness + market share (PRD §5.3-5.4) ──────────
export function attractivenessScore(args: {
  priceScore: number;
  brandPts: number;
  loyaltyPct: number;
  serviceScore: number; // 0..100
}): number {
  const brandScore = Math.min(100, args.brandPts / 2);
  return (
    args.priceScore * 0.45 +
    brandScore * 0.25 +
    args.loyaltyPct * 0.20 +
    args.serviceScore * 0.10
  );
}

// Simple service score from sliders (avg of service + gifts-proxy + rewards)
export function serviceScoreFromSliders(s: Sliders): number {
  return ((s.service + s.rewards) / 2 / 5) * 100;
}

// ─── Route quarterly economics ─────────────────────────────
const QUARTER_DAYS = 91;

export interface RouteEconomics {
  distanceKm: number;
  dailyDemand: number;
  dailyCapacity: number;
  occupancy: number;               // 0..1 capped at 0.98
  dailyPax: number;
  ticketPrice: number;
  quarterlyRevenue: number;
  quarterlyFuelCost: number;
  quarterlySlotCost: number;
  quarterlyProfit: number;
}

export function slotFeeUsd(tier: 1 | 2 | 3 | 4): number {
  return tier === 1 ? 42_500 : tier === 2 ? 28_500 : tier === 3 ? 15_000 : 7_500;
}

export function computeRouteEconomics(
  team: Team,
  route: Route,
  quarter: number,
  fuelIndex: number,
): RouteEconomics {
  const origin = CITIES_BY_CODE[route.originCode];
  const dest = CITIES_BY_CODE[route.destCode];
  if (!origin || !dest)
    return blankEconomics(route.distanceKm);

  const distanceKm = route.distanceKm || haversineKm(origin, dest);
  const demand = routeDemandPerDay(route.originCode, route.destCode, quarter);

  // Daily capacity = aircraft seats × daily_departures per plane
  const planes = route.aircraftIds
    .map((id) => team.fleet.find((f) => f.id === id))
    .filter((x): x is FleetAircraft => !!x && x.status === "active");
  const seatsPerFlight = planes.reduce((sum, p) => {
    const spec = AIRCRAFT_BY_ID[p.specId];
    if (!spec) return sum;
    return sum + spec.seats.first + spec.seats.business + spec.seats.economy;
  }, 0);
  const dailyCapacity = seatsPerFlight * route.dailyFrequency;

  // Simplified MVP market share: single-team assumption (100% until rivals
  // exist). When rivals exist we compute per-route attractiveness.
  const dailyPax = Math.min(dailyCapacity, demand.total);
  const occupancy =
    dailyCapacity > 0 ? Math.min(0.98, dailyPax / dailyCapacity) : 0;

  // Ticket pricing
  const baseFare = baseFareForDistance(distanceKm);
  const ticketPrice = baseFare * PRICE_TIER[route.pricingTier];

  // Revenue
  const quarterlyRevenue = dailyPax * ticketPrice * QUARTER_DAYS;

  // Fuel
  const fuelPricePerL = (fuelIndex / 100) * 0.18;
  const totalFuelBurnPerFlight = planes.reduce((sum, p) => {
    const spec = AIRCRAFT_BY_ID[p.specId];
    if (!spec) return sum;
    const burn =
      spec.fuelBurnPerKm * (p.ecoUpgrade ? 0.9 : 1.0) * distanceKm;
    return sum + burn;
  }, 0);
  // Apply S4 hedge if flag set
  const hedge = team.flags.has("hedged_12m")
    ? 100 / fuelIndex
    : team.flags.has("hedged_6m")
      ? 100 / fuelIndex
      : team.flags.has("hedged_50_50")
        ? (100 / fuelIndex + 1) / 2
        : 1;
  const quarterlyFuelCost =
    totalFuelBurnPerFlight * fuelPricePerL *
    route.dailyFrequency * QUARTER_DAYS * hedge;

  // Slot fee
  const fee = slotFeeUsd(dest.tier);
  const quarterlySlotCost = fee * route.dailyFrequency * QUARTER_DAYS;

  const quarterlyProfit = quarterlyRevenue - quarterlyFuelCost - quarterlySlotCost;

  return {
    distanceKm,
    dailyDemand: demand.total,
    dailyCapacity,
    occupancy,
    dailyPax,
    ticketPrice,
    quarterlyRevenue,
    quarterlyFuelCost,
    quarterlySlotCost,
    quarterlyProfit,
  };
}

function blankEconomics(distanceKm: number): RouteEconomics {
  return {
    distanceKm,
    dailyDemand: 0,
    dailyCapacity: 0,
    occupancy: 0,
    dailyPax: 0,
    ticketPrice: 0,
    quarterlyRevenue: 0,
    quarterlyFuelCost: 0,
    quarterlySlotCost: 0,
    quarterlyProfit: 0,
  };
}

// ─── Depreciation (PRD §6.4) ───────────────────────────────
export function depreciateBookValue(
  purchasePrice: number,
  quartersSincePurchase: number,
): number {
  const floor = purchasePrice * 0.1;
  const decayed = purchasePrice * Math.pow(0.9875, quartersSincePurchase);
  return Math.max(floor, decayed);
}

// ─── Interest (PRD §5.7) ───────────────────────────────────
export function effectiveBorrowingRate(team: Team, baseRatePct: number): number {
  const airlineValue = computeAirlineValue(team);
  const debtRatio = airlineValue > 0 ? team.totalDebtUsd / airlineValue : 1;
  let premium = 0.5;
  if (debtRatio >= 0.7) premium = 5.0;
  else if (debtRatio >= 0.5) premium = 3.0;
  else if (debtRatio >= 0.3) premium = 1.5;

  let brandAdj = 0;
  if (team.brandPts > 80) brandAdj = -0.5;
  else if (team.brandPts < 25) brandAdj = 2.0;
  else if (team.brandPts < 50) brandAdj = 1.0;

  return baseRatePct + premium + brandAdj;
}

export function quarterlyInterestUsd(team: Team, baseRatePct: number): number {
  const rate = effectiveBorrowingRate(team, baseRatePct);
  return team.totalDebtUsd * (rate / 100) / 4;
}

export function maxBorrowingUsd(team: Team): number {
  const v = computeAirlineValue(team);
  return Math.max(0, v * 0.6 - team.totalDebtUsd);
}

// ─── Airline Value (= Net Equity, PRD §3.2 + §5.9) ─────────
export function computeAirlineValue(team: Team): number {
  const fleetValue = team.fleet.reduce((s, f) => s + (f.bookValue ?? 0), 0);
  return team.cashUsd + fleetValue - team.totalDebtUsd;
}

// ─── Brand Value (PRD §5.9) ────────────────────────────────
export function computeBrandValue(team: Team): number {
  const cashRatio =
    team.cashUsd + team.totalDebtUsd > 0
      ? team.cashUsd / (team.cashUsd + team.totalDebtUsd)
      : 0.5;
  const airlineValue = computeAirlineValue(team);
  const debtRatioScore =
    100 - Math.min(100, airlineValue > 0 ? (team.totalDebtUsd / airlineValue) * 100 : 100);
  // Revenue growth vs peers not available in single-team — default to 50
  const revGrowth = 50;

  const financialHealth =
    cashRatio * 100 * 0.3 + debtRatioScore * 0.35 + revGrowth * 0.35;

  const brandPtsScore = Math.min(100, team.brandPts / 2);
  const customerLoyalty = team.customerLoyaltyPct;
  let reputationEvents = 100;
  if (team.flags.has("trusted_operator")) reputationEvents += 10;
  if (team.flags.has("green_leader")) reputationEvents += 15;
  if (team.flags.has("people_first")) reputationEvents += 8;
  if (team.flags.has("anti_environment")) reputationEvents -= 15;
  reputationEvents = Math.max(0, Math.min(120, reputationEvents));

  const brandHealth =
    brandPtsScore * 0.4 + customerLoyalty * 0.35 + reputationEvents * 0.25;

  const opsPtsScore = Math.min(100, team.opsPts);
  const activeFleet = team.fleet.filter((f) => f.status === "active");
  const modernFleetCount = activeFleet.filter((f) => {
    const spec = AIRCRAFT_BY_ID[f.specId];
    return spec && spec.unlockQuarter >= 8; // modern family
  }).length;
  const fleetEfficiency =
    activeFleet.length > 0
      ? (modernFleetCount / activeFleet.length) * 100
      : 0;
  const staffCommitment = Math.min(100, team.sliders.staff * 10 + 50);

  const operationsHealth =
    opsPtsScore * 0.4 + fleetEfficiency * 0.35 + staffCommitment * 0.25;

  return (
    financialHealth * 0.35 + brandHealth * 0.5 + operationsHealth * 0.15
  );
}

// ─── Loyalty multiplier (PRD §5.8) ─────────────────────────
export function loyaltyDemandMultiplier(
  loyaltyPct: number,
  positive: boolean,
): number {
  if (loyaltyPct > 80) return positive ? 1.15 : 0.7;
  if (loyaltyPct > 65) return positive ? 1.05 : 0.85;
  if (loyaltyPct > 50) return 1.0;
  if (loyaltyPct > 35) return positive ? 0.85 : 1.2;
  return positive ? 0.7 : 1.4;
}

// ─── Apply an option effect ────────────────────────────────
export function applyOptionEffect(team: Team, effect: OptionEffect): Team {
  const next: Team = {
    ...team,
    cashUsd: team.cashUsd + (effect.cash ?? 0),
    brandPts: Math.max(0, team.brandPts + (effect.brandPts ?? 0)),
    opsPts: Math.max(0, team.opsPts + (effect.opsPts ?? 0)),
    customerLoyaltyPct: clamp(
      0, 100,
      team.customerLoyaltyPct + (effect.loyaltyDelta ?? 0),
    ),
    flags: new Set(team.flags),
  };
  if (effect.setFlags) {
    for (const f of effect.setFlags) next.flags.add(f);
  }
  return next;
}

export function clamp(lo: number, hi: number, n: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Quarter close orchestration (PRD §9) ──────────────────
export interface QuarterCloseResult {
  quarter: number;
  revenue: number;
  fuelCost: number;
  slotCost: number;
  staffCost: number;
  otherSliderCost: number;
  maintenanceCost: number;
  depreciation: number;
  interest: number;
  tax: number;
  netProfit: number;
  newCashUsd: number;
  newBrandPts: number;
  newOpsPts: number;
  newLoyalty: number;
  newBrandValue: number;
  routeBreakdown: Array<{
    routeId: string;
    revenue: number;
    fuelCost: number;
    slotCost: number;
    profit: number;
    occupancy: number;
  }>;
  notes: string[];
}

export interface QuarterCloseContext {
  baseInterestRatePct: number;
  fuelIndex: number;
  quarter: number;
}

export function runQuarterClose(
  team: Team,
  ctx: QuarterCloseContext,
): QuarterCloseResult {
  const notes: string[] = [];
  let next: Team = { ...team, flags: new Set(team.flags) };

  // Route economics
  const routeBreakdown: QuarterCloseResult["routeBreakdown"] = [];
  let revenue = 0;
  let fuelCost = 0;
  let slotCost = 0;
  for (const r of next.routes.filter((r) => r.status === "active")) {
    const econ = computeRouteEconomics(next, r, ctx.quarter, ctx.fuelIndex);
    revenue += econ.quarterlyRevenue;
    fuelCost += econ.quarterlyFuelCost;
    slotCost += econ.quarterlySlotCost;
    routeBreakdown.push({
      routeId: r.id,
      revenue: econ.quarterlyRevenue,
      fuelCost: econ.quarterlyFuelCost,
      slotCost: econ.quarterlySlotCost,
      profit: econ.quarterlyProfit,
      occupancy: econ.occupancy,
    });
    // Stamp route economics so UI can display
    r.avgOccupancy = econ.occupancy;
    r.quarterlyRevenue = econ.quarterlyRevenue;
    r.quarterlyFuelCost = econ.quarterlyFuelCost;
    r.quarterlySlotCost = econ.quarterlySlotCost;
  }

  // Staff cost (A3)
  const staffBase = baselineStaffCostUsd(next);
  const staffCost = staffBase * STAFF_MULTIPLIER[next.sliders.staff];

  // Other sliders as % of revenue (A2)
  const sliderPctKeys: (keyof Sliders)[] = [
    "marketing", "service", "rewards", "operations",
  ];
  const otherSliderCost = sliderPctKeys.reduce(
    (sum, k) => sum + revenue * SLIDER_PCT_REVENUE[next.sliders[k]], 0);

  // Maintenance — naive: active fleet × $500k. Adds aging_fleet penalty.
  let maintenanceCost = next.fleet.filter((f) => f.status === "active").length *
    500_000;
  if (next.flags.has("aging_fleet")) maintenanceCost += 15_000_000;

  // Depreciation
  let depreciation = 0;
  next.fleet = next.fleet.map((f) => {
    if (f.acquisitionType !== "buy") return f;
    const qSince = Math.max(0, ctx.quarter - f.purchaseQuarter);
    const newBook = depreciateBookValue(f.purchasePrice, qSince + 1);
    const prev = f.bookValue ?? f.purchasePrice;
    const delta = Math.max(0, prev - newBook);
    depreciation += delta;
    return { ...f, bookValue: newBook };
  });

  // Interest
  const interest = quarterlyInterestUsd(next, ctx.baseInterestRatePct);

  // Pre-tax profit
  const pretax =
    revenue - fuelCost - slotCost - staffCost - otherSliderCost -
    maintenanceCost - depreciation - interest;

  // Tax (A15): 20% on positive pretax
  const tax = pretax > 0 ? pretax * 0.2 : 0;
  const netProfit = pretax - tax;
  const newCashUsd = next.cashUsd + netProfit;

  // Slider → brand / loyalty / ops pts per-quarter
  const sliderKeys: (keyof Sliders)[] = [
    "staff", "marketing", "service", "rewards", "operations",
  ];
  let brandDelta = 0;
  let loyaltyDelta = 0;
  let opsDelta = 0;
  for (const k of sliderKeys) {
    const level = next.sliders[k];
    const streak = next.sliderStreaks[k];
    const mult = streak.level === level
      ? streakMultiplier(streak.quarters + 1)
      : 1.0;
    const e = SLIDER_EFFECTS[k][level];
    brandDelta += (e.brandPts ?? 0) * mult;
    loyaltyDelta += (e.loyalty ?? 0) * mult;
    opsDelta += (e.opsPts ?? 0) * mult;
    next.sliderStreaks[k] =
      streak.level === level
        ? { level, quarters: streak.quarters + 1 }
        : { level, quarters: 1 };
  }

  const newBrandPts = Math.max(0, next.brandPts + brandDelta);
  const newOpsPts = Math.max(0, next.opsPts + opsDelta);
  // Loyalty drifts toward 50 slightly, plus slider delta
  const drift = (50 - next.customerLoyaltyPct) * 0.03;
  const newLoyalty = clamp(
    0, 100, next.customerLoyaltyPct + loyaltyDelta + drift,
  );

  // Update team state for Brand Value calc
  next.cashUsd = newCashUsd;
  next.brandPts = newBrandPts;
  next.opsPts = newOpsPts;
  next.customerLoyaltyPct = newLoyalty;

  const newBrandValue = computeBrandValue(next);

  notes.push(`Revenue: $${(revenue / 1e6).toFixed(1)}M across ${routeBreakdown.length} routes`);
  notes.push(`Fuel index ${ctx.fuelIndex} → ${(fuelCost / 1e6).toFixed(1)}M fuel cost`);
  if (tax > 0) notes.push(`Tax: ${(tax / 1e6).toFixed(1)}M (20% on $${(pretax / 1e6).toFixed(1)}M pretax)`);
  if (interest > 0) notes.push(`Interest on debt: $${(interest / 1e6).toFixed(1)}M`);

  return {
    quarter: ctx.quarter,
    revenue,
    fuelCost,
    slotCost,
    staffCost,
    otherSliderCost,
    maintenanceCost,
    depreciation,
    interest,
    tax,
    netProfit,
    newCashUsd,
    newBrandPts,
    newOpsPts,
    newLoyalty,
    newBrandValue,
    routeBreakdown,
    notes,
  };
}

// ─── Scenarios this quarter ────────────────────────────────
export function scenariosForQuarter(quarter: number): Scenario[] {
  return SCENARIOS.filter((s) => s.quarter === quarter);
}

// ─── Helpers for UI ────────────────────────────────────────
export function fleetSeatTotal(fleet: FleetAircraft[]): number {
  return fleet
    .filter((f) => f.status === "active")
    .reduce((sum, f) => {
      const spec = AIRCRAFT_BY_ID[f.specId];
      if (!spec) return sum;
      return sum + spec.seats.first + spec.seats.business + spec.seats.economy;
    }, 0);
}

export function fleetCount(fleet: FleetAircraft[]): number {
  return fleet.filter((f) => f.status === "active").length;
}
