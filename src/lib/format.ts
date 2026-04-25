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

/** In-game date — each quarter advances ~4 real-world months from a 2025
 *  baseline. Returns "Mar 2026" style. */
export function fmtQuarter(q: number): string {
  const monthsSinceStart = (q - 1) * 4;
  const baseYear = 2025;
  const baseMonth = 0; // January
  const totalMonth = baseMonth + monthsSinceStart;
  const year = baseYear + Math.floor(totalMonth / 12);
  const monthIdx = totalMonth % 12;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[monthIdx]} ${year}`;
}

/** Short tag — "Round X of 20" replaces the prior "Q5 of 20". */
export function fmtQuarterShort(q: number): string {
  return `Round ${q} of 20`;
}
