/**
 * Cross-module id factory.
 *
 * The Zustand store has had its own private `mkId` since the
 * single-browser solo days; this module pulls that helper out so
 * the team-factory + future server API routes can share the same
 * id shape without coupling to the store.
 *
 * Format: `<prefix>-<8-char-base36-random>` — e.g. `team-3xk9zq2a`.
 * Stable across the codebase; persisted to game_state JSON; matches
 * the legacy ids in saved games so a re-keying migration isn't
 * needed.
 *
 * NOT cryptographically random. The lobby system uses
 * `crypto.randomUUID()` for browser session ids and a server-side
 * uuid for game_state.game_id; this helper is for human-friendly
 * domain ids (teams, routes, aircraft, contracts) where the
 * collision risk inside a single game's keyspace is negligible.
 */

export function mkId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
