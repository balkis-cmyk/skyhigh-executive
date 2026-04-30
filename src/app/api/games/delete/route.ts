/**
 * POST /api/games/delete — facilitator or host deletes a game.
 * Only the creator (created_by_session_id) or facilitator
 * (facilitator_session_id) may delete. Game must be in lobby or
 * ended — active games cannot be deleted mid-play.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { gameId, sessionId } = await req.json();
    if (!gameId || !sessionId) {
      return NextResponse.json({ error: "gameId and sessionId required." }, { status: 400 });
    }

    const supa = getServerClient();

    // Load the game to verify ownership
    const { data: game, error: loadErr } = await supa
      .from("games")
      .select("id, status, created_by_session_id, facilitator_session_id")
      .eq("id", gameId)
      .single() as { data: { id: string; status: string; created_by_session_id: string; facilitator_session_id: string | null } | null; error: unknown };

    if (loadErr || !game) {
      return NextResponse.json({ error: "Game not found." }, { status: 404 });
    }

    const isOwner =
      sessionId === game.created_by_session_id ||
      sessionId === game.facilitator_session_id;

    if (!isOwner) {
      return NextResponse.json({ error: "Not authorised to delete this game." }, { status: 403 });
    }

    if (game.status === "playing") {
      return NextResponse.json(
        { error: "Cannot delete a game that is currently in progress." },
        { status: 400 },
      );
    }

    // Delete members first (FK constraint), then state, then game
    await supa.from("game_members").delete().eq("game_id", gameId);
    await supa.from("game_state").delete().eq("game_id", gameId);
    await supa.from("game_events").delete().eq("game_id", gameId);
    const { error: delErr } = await supa.from("games").delete().eq("id", gameId);

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
