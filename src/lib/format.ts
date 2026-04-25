/** Format a USD value. Abbreviates at $1M and $1B. */
export function fmtMoney(n: number, opts?: { decimals?: number; compact?: boolean }): string {
  const sign = n < 0 ? "−" : "";
  const abs = Math.abs(n);
  const d = opts?.decimals ?? 1;
  const compact = opts?.compact ?? true;
  if (!compact) {
    return `${sign}$${abs.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(d)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(d)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(d)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function fmtPct(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)}%`;
}

export function fmtDelta(n: number, decimals = 1): string {
  if (n === 0) return "0";
  return n > 0 ? `+${n.toFixed(decimals)}` : `−${Math.abs(n).toFixed(decimals)}`;
}

/**
 * In-game calendar.
 *
 * Game runs 40 rounds covering 10 calendar years (2015 → end of 2024).
 * Each round = 1 real calendar quarter. Round 1 = Q1 2015,
 * Round 4 = Q4 2015, Round 40 = Q4 2024.
 *
 * Aircraft release timeline is INDEPENDENTLY compressed: aircraft EIS
 * year E in the real world maps to game round via a 2:1 compression
 * anchored at real-2000 = game-Q1-2015. This lets the player experience
 * the 2000–2026 aviation product cycle (A380 EIS 2007 → ~round 13,
 * 787-9 EIS 2014 → ~round 29) within the 10 calendar years of game time.
 * See gameQuarterFromYear below.
 */
export const TOTAL_GAME_ROUNDS = 40;
const GAME_START_YEAR = 2015;

export function fmtQuarter(q: number): string {
  const idx = Math.max(0, q - 1);
  const year = GAME_START_YEAR + Math.floor(idx / 4);
  const quarterOfYear = (idx % 4) + 1;
  return `Q${quarterOfYear} ${year}`;
}

/** Short tag — "Round X of 40". */
export function fmtQuarterShort(q: number): string {
  return `Round ${q} of ${TOTAL_GAME_ROUNDS}`;
}

/**
 * Convert a real-world EIS year (e.g. 2007 for the A380) to the GAME
 * round at which the aircraft becomes available.
 *
 * Mapping: 2:1 compression. Real year 2000 = Round 1 (Q1 2015).
 * Real year 2002 = Round 5 (Q1 2016). Real year 2026 = Round 53,
 * which is clamped back to 40 (last game round) — late aircraft
 * unlock right at the end of the simulation.
 *
 * Implementation:
 *   yearsFrom2000 = year - 2000
 *   gameYearsFromStart = yearsFrom2000 / 2     (compression)
 *   round = floor(gameYearsFromStart) * 4 + 1
 */
export function gameQuarterFromYear(year: number): number {
  if (year <= 2000) return 1;
  const yearsFromAnchor = year - 2000;
  const gameYearsFromStart = yearsFromAnchor / 2;
  const round = Math.floor(gameYearsFromStart) * 4 + 1;
  return Math.max(1, Math.min(TOTAL_GAME_ROUNDS, round));
}
