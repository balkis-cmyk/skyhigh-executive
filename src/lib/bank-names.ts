/**
 * Bank lender name pool for SkyForce loans.
 *
 * Each LoanInstrument gets a deterministic but distinct counterparty
 * name so the Financials panel reads like real airline finance:
 *   "$80M @ 6.2% — First Aviation Trust"
 *   "$120M @ 5.5% — Skyline Capital Partners"
 * instead of three identical "Bank loan" rows.
 *
 * The names are made up (no real institutions) — just plausible names
 * that signal aviation-finance flavour. Mix of stuffy banks, regional
 * trusts, and aviation-specialty lenders so the table looks varied.
 */
export const BANK_LENDERS: ReadonlyArray<string> = [
  "First Aviation Trust",
  "Skyline Capital Partners",
  "Meridian Banking Corp",
  "Atlas Lending Group",
  "Trans-Pacific Credit Union",
  "Aero Finance Holdings",
  "Continental Trust Bank",
  "Horizon Mutual",
  "Cathay Sovereign Bank",
  "Polaris Credit & Trust",
  "Stratus Capital Markets",
  "Heritage Aero Lending",
  "Crossway Banking Group",
  "Ironside Aviation Finance",
  "Beacon Sovereign Bank",
  "Galleon Capital",
  "Zenith Lending Partners",
  "Velocity Aero Credit",
];

/**
 * Pick a bank name that isn't already in use by any of the team's
 * existing loans. Falls back to a numbered "Aviation Lender #N" when
 * the player somehow exceeds the pool size.
 */
export function pickLenderName(
  existingNames: ReadonlyArray<string>,
): string {
  const taken = new Set(existingNames);
  for (const name of BANK_LENDERS) {
    if (!taken.has(name)) return name;
  }
  return `Aviation Lender #${existingNames.length + 1}`;
}

/**
 * Display label for a loan: prefers the persisted lenderName but
 * falls back to a stable identifier if older saves are missing it.
 */
export function loanDisplayName(loan: {
  id: string;
  lenderName?: string;
  source?: "borrowing" | "overdraft-refi";
}): string {
  if (loan.lenderName) return loan.lenderName;
  // Generate a stable suffix from the loan id so it doesn't change
  // across renders. The id format is "loan-<random>", so the last 4
  // chars are random and distinctive.
  const tail = loan.id.slice(-4).toUpperCase();
  return `Bank facility ${tail}`;
}
