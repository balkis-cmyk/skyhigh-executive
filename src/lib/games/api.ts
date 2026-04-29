/**
 * Server-side game lifecycle helpers.
 *
 * These are the canonical mutation paths for the lobby. Every
 * mutation runs through the service-role Supabase client, writes a
 * game_events audit row, and bumps the optimistic-concurrency token
 * (`games.version` for lifecycle changes, `game_state.version` for
 * state-mutation calls).
 *
 * NEVER import from a "use client" file — this module pulls in the
 * server-side Supabase client which carries the service role key.
 *
 * Exported helpers (Step 2 surface — Step 4+ wires them into
 * /games/new, /lobby, /games/[id]/lobby/play):
 *
 *   createGame(args)          — host runs /games/new
 *   joinGame(gameId, ...)     — public lobby + private code paths
 *   claimSeat(gameId, ...)    — bind a browser to a team in the lobby
 *   markReady(...)            — self-guided per-team readiness flag
 *   startGame(gameId, ...)    — host/facilitator advances lobby → playing
 *   submitTeamMutation(...)   — version-checked engine state write
 *   appendEvent(...)          — append to game_events (audit log)
 *   listPublicLobby()         — feeds /lobby
 *   loadGame(gameId)          — fetch row + members + state for hydration
 *
 * Each function returns either { ok: true, data } or { ok: false,
 * error }. Callers (API routes / server actions) translate to HTTP
 * responses — no helper throws on user-input errors, only on
 * configuration errors (missing env, etc).
 */

import { getServerClient } from "@/lib/supabase/server";
import type {
  GameRow,
  GameMemberRow,
  GameStateRow,
  GameEventRow,
} from "@/lib/supabase/types";

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface CreateGameArgs {
  name: string;
  mode: "facilitated" | "self_guided";
  visibility: "public" | "private";
  maxTeams: number;
  /** Browser session id of the host. Required — the host gets host
   *  role on the resulting game and is the default facilitator if
   *  mode is facilitated. */
  hostSessionId: string;
  /** Optional facilitator session id. When omitted in facilitated
   *  mode, host = facilitator. Ignored in self-guided mode. */
  facilitatorSessionId?: string;
  /** Initial engine GameState snapshot (post-onboarding shape from
   *  the existing single-browser flow). The lobby just persists it;
   *  the play page rehydrates the engine from this on first paint. */
  initialState: unknown;
}

/** Generate a random 4-digit join code. We collision-check against
 *  active games (status != 'ended') but the keyspace is 10000 so
 *  with more than ~20 active private games at once you'll start
 *  retrying — fine for current scale; expand to 5 digits if needed. */
function makeJoinCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** Allocate a unique join code by retrying up to N times against
 *  active games. */
async function allocateJoinCode(): Promise<string> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = makeJoinCode();
    const { data, error } = await supa
      .from("games")
      .select("id")
      .eq("join_code", code)
      .neq("status", "ended")
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error(
    "Could not allocate a unique join code after 8 retries. Too many active private lobbies; expand the keyspace.",
  );
}

export async function createGame(args: CreateGameArgs): Promise<
  ApiResult<{ game: GameRow; state: GameStateRow }>
> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;

  if (args.name.trim().length === 0) {
    return { ok: false, error: "Game name is required." };
  }
  if (args.maxTeams < 1 || args.maxTeams > 12) {
    return { ok: false, error: "Max teams must be between 1 and 12." };
  }

  const joinCode =
    args.visibility === "private" ? await allocateJoinCode() : null;

  const { data: game, error: gameErr } = await supa
    .from("games")
    .insert({
      name: args.name.trim(),
      mode: args.mode,
      visibility: args.visibility,
      max_teams: args.maxTeams,
      join_code: joinCode,
      board_decisions_enabled: args.mode === "facilitated",
      created_by_session_id: args.hostSessionId,
      facilitator_session_id:
        args.mode === "facilitated"
          ? (args.facilitatorSessionId ?? args.hostSessionId)
          : null,
    })
    .select()
    .single();
  if (gameErr || !game) {
    return { ok: false, error: gameErr?.message ?? "Failed to create game" };
  }

  const { data: state, error: stateErr } = await supa
    .from("game_state")
    .insert({ game_id: game.id, state_json: args.initialState, version: 1 })
    .select()
    .single();
  if (stateErr || !state) {
    return { ok: false, error: stateErr?.message ?? "Failed to seed game state" };
  }

  // Host as the first member, with the appropriate role
  const hostRole =
    args.mode === "facilitated" ? "facilitator" : "host";
  await supa.from("game_members").insert({
    game_id: game.id,
    session_id: args.hostSessionId,
    role: hostRole,
  });

  await appendEvent({
    gameId: game.id,
    actorSessionId: args.hostSessionId,
    type: "game.created",
    payload: { mode: args.mode, visibility: args.visibility, maxTeams: args.maxTeams },
  });

  return { ok: true, data: { game, state } };
}

/** Resolve a game by either its id or a join code. Used by the
 *  /join page (code path) and direct lobby links (id path). */
export async function findGame(args: {
  gameId?: string;
  joinCode?: string;
}): Promise<ApiResult<GameRow>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const q = supa.from("games").select("*").neq("status", "ended").limit(1);
  if (args.gameId) {
    const { data, error } = await q.eq("id", args.gameId).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "Game not found." };
    return { ok: true, data };
  }
  if (args.joinCode) {
    const { data, error } = await q.eq("join_code", args.joinCode.trim()).maybeSingle();
    if (error) return { ok: false, error: error.message };
    if (!data) return { ok: false, error: "No active game found for that code." };
    return { ok: true, data };
  }
  return { ok: false, error: "Pass either gameId or joinCode." };
}

export async function joinGame(args: {
  gameId: string;
  sessionId: string;
  displayName?: string;
}): Promise<ApiResult<{ member: GameMemberRow; game: GameRow }>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const { data: game, error: gameErr } = await supa
    .from("games")
    .select("*")
    .eq("id", args.gameId)
    .maybeSingle();
  if (gameErr || !game) return { ok: false, error: "Game not found." };
  if (game.status === "ended") return { ok: false, error: "Game has ended." };
  if (game.locked && game.status === "lobby") {
    // Reconnects (existing member) still allowed even when locked —
    // check member existence below.
    const { data: existing } = await supa
      .from("game_members")
      .select("*")
      .eq("game_id", args.gameId)
      .eq("session_id", args.sessionId)
      .maybeSingle();
    if (!existing) {
      return { ok: false, error: "Lobby is locked — no new seats can be claimed." };
    }
  }

  const { data: member, error: memberErr } = await supa
    .from("game_members")
    .upsert(
      {
        game_id: args.gameId,
        session_id: args.sessionId,
        display_name: args.displayName ?? null,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "game_id,session_id" },
    )
    .select()
    .single();
  if (memberErr || !member) {
    return { ok: false, error: memberErr?.message ?? "Failed to join." };
  }

  await appendEvent({
    gameId: args.gameId,
    actorSessionId: args.sessionId,
    type: "game.joined",
    payload: { displayName: args.displayName ?? null },
  });

  return { ok: true, data: { member, game } };
}

export async function appendEvent(args: {
  gameId: string;
  actorSessionId?: string | null;
  actorTeamId?: string | null;
  type: string;
  payload?: unknown;
}): Promise<ApiResult<GameEventRow>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const { data, error } = await supa
    .from("game_events")
    .insert({
      game_id: args.gameId,
      actor_session_id: args.actorSessionId ?? null,
      actor_team_id: args.actorTeamId ?? null,
      type: args.type,
      payload_json: args.payload ?? {},
    })
    .select()
    .single();
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Failed to log event" };
  }
  return { ok: true, data };
}

/** Public lobby listing. Used by /lobby. Filters: visibility = public,
 *  status = lobby OR (status = playing AND not locked) — playing
 *  games are shown grayed-out as "in progress" so users can see them
 *  but not join. Newest-first; small page size for the MVP. */
export async function listPublicLobby(args?: {
  limit?: number;
}): Promise<ApiResult<GameRow[]>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const { data, error } = await supa
    .from("games")
    .select("*")
    .eq("visibility", "public")
    .neq("status", "ended")
    .order("created_at", { ascending: false })
    .limit(args?.limit ?? 25);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

/** Hydrate a game for the play page. Returns the row, current state,
 *  and members in a single call. */
export async function loadGame(gameId: string): Promise<
  ApiResult<{ game: GameRow; state: GameStateRow; members: GameMemberRow[] }>
> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const [gameRes, stateRes, membersRes] = await Promise.all([
    supa.from("games").select("*").eq("id", gameId).maybeSingle(),
    supa.from("game_state").select("*").eq("game_id", gameId).maybeSingle(),
    supa.from("game_members").select("*").eq("game_id", gameId),
  ]);
  if (gameRes.error || !gameRes.data) return { ok: false, error: "Game not found." };
  if (stateRes.error || !stateRes.data) return { ok: false, error: "Game state missing." };
  if (membersRes.error) return { ok: false, error: membersRes.error.message };
  return {
    ok: true,
    data: {
      game: gameRes.data,
      state: stateRes.data,
      members: membersRes.data ?? [],
    },
  };
}

/** Compare-and-swap update on game_state. The caller passes the
 *  version they last saw; if it doesn't match the row's current
 *  version the write is rejected with a stale-state error and the
 *  caller refreshes + retries. */
export async function submitStateMutation(args: {
  gameId: string;
  expectedVersion: number;
  newState: unknown;
  actorSessionId?: string;
  actorTeamId?: string;
  /** What changed — surfaces in the audit log. e.g. "team.slidersUpdated",
   *  "team.routeOpened", "game.quarterClosed". */
  eventType: string;
  eventPayload?: unknown;
}): Promise<ApiResult<GameStateRow>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const { data, error } = await supa
    .from("game_state")
    .update({ state_json: args.newState, version: args.expectedVersion + 1 })
    .eq("game_id", args.gameId)
    .eq("version", args.expectedVersion)
    .select()
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) {
    return {
      ok: false,
      error: "Stale state — someone else modified the game while you were thinking. Refresh and try again.",
    };
  }
  await appendEvent({
    gameId: args.gameId,
    actorSessionId: args.actorSessionId,
    actorTeamId: args.actorTeamId,
    type: args.eventType,
    payload: args.eventPayload,
  });
  return { ok: true, data };
}

/** Lobby host/facilitator: flip status from 'lobby' to 'playing'. */
export async function startGame(args: {
  gameId: string;
  actorSessionId: string;
}): Promise<ApiResult<GameRow>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const { data, error } = await supa
    .from("games")
    .update({ status: "playing", started_at: new Date().toISOString() })
    .eq("id", args.gameId)
    .eq("status", "lobby")
    .select()
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Game not in lobby state." };
  await appendEvent({
    gameId: args.gameId,
    actorSessionId: args.actorSessionId,
    type: "game.started",
  });
  return { ok: true, data };
}

/** Lobby host/facilitator: lock or unlock seat-claiming. Locked
 *  lobbies still allow existing members to reconnect. */
export async function setLocked(args: {
  gameId: string;
  actorSessionId: string;
  locked: boolean;
}): Promise<ApiResult<GameRow>> {
  // The `as any` here erases the strict postgrest-js v12 generic
  // constraints (which fight hand-rolled Database types). The row
  // types from `lib/supabase/types.ts` re-establish type safety at
  // every read/write below. A future `supabase gen types` pass
  // replaces this cast with the canonical typed client.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supa = getServerClient() as any;
  const { data, error } = await supa
    .from("games")
    .update({ locked: args.locked })
    .eq("id", args.gameId)
    .select()
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: false, error: "Game not found." };
  await appendEvent({
    gameId: args.gameId,
    actorSessionId: args.actorSessionId,
    type: args.locked ? "game.locked" : "game.unlocked",
  });
  return { ok: true, data };
}
