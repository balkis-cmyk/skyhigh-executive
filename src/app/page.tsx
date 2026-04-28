"use client";

/**
 * `/` — game entry surface.
 *
 * Behavior:
 *   - phase === "idle" (no saved game) → render GameCanvas, which
 *     shows the existing pre-game lobby ("Begin Q1 brand building").
 *   - phase === "playing" / "onboarding" / "quarter-closing" → there's
 *     a saved run. Show a "Continue" / "End game & start over" picker
 *     so the player isn't silently dropped into mid-quarter state with
 *     no exit. Continuing renders the canvas as before.
 *   - phase === "endgame" → show a resume-or-reset picker that links
 *     to the final-scoring page; prevents the dead-end where players
 *     who finished a run keep getting bounced into the canvas with no
 *     visible way to start over.
 *
 * Why this exists: the persisted Zustand store reloads whatever
 * mid-game state the player last left, and the canvas itself has no
 * "Exit / start over" affordance from the entry route. Players who
 * finished a game and tried to revisit `/` were getting dropped at
 * Q33 of an old run with no path forward. Reset wiring also lives
 * inside the running game (TopBar → kebab → "End game & start over"),
 * so the player can always escape from anywhere.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Play, RotateCcw, Trophy } from "lucide-react";
import { useGame, selectPlayer } from "@/store/game";
import { GameCanvas } from "@/components/game/GameCanvas";
import { Button } from "@/components/ui";
import { fmtMoney, fmtQuarter, TOTAL_GAME_ROUNDS } from "@/lib/format";

export default function Home() {
  const phase = useGame((s) => s.phase);
  const currentQuarter = useGame((s) => s.currentQuarter);
  const player = useGame(selectPlayer);
  const resetGame = useGame((g) => g.resetGame);
  const router = useRouter();

  // Hydration gate — wait one client paint so the persisted store
  // is loaded before deciding which surface to render. Without this
  // the picker briefly flashes for returning players.
  const [hydrated, setHydrated] = useState(false);
  // After the user clicks "Continue", skip the chooser and render
  // the canvas directly. Lives in component state because there's
  // no `/play` route (yet); the canvas is mounted at this URL.
  const [continued, setContinued] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return <div className="flex-1 bg-surface" aria-hidden />;
  }

  // No saved game — let GameCanvas's existing pre-game UI handle
  // the empty state. It already shows "Begin Q1 brand building" /
  // "Play demo round" buttons.
  if (phase === "idle") {
    return <GameCanvas />;
  }

  // Endgame — show a finished-run picker. Direct link to the
  // /endgame page (final scoring) so players can re-read the
  // standings, plus an explicit reset.
  if (phase === "endgame") {
    return (
      <ResumeChooser
        kind="endgame"
        currentQuarter={currentQuarter}
        playerName={player?.name ?? null}
        playerCash={player?.cashUsd ?? 0}
        onContinue={() => router.push("/endgame")}
        onReset={() => {
          resetGame();
          // After reset, phase flips to idle so the next render lands
          // on the GameCanvas pre-game UI naturally — no nav needed.
        }}
      />
    );
  }

  // Live game — render the chooser by default, render the canvas
  // once the user clicks Continue. The TopBar's GameMenu has an
  // "End game & start over" item so the player can also escape
  // from inside the running canvas.
  if (continued) {
    return <GameCanvas />;
  }

  return (
    <ResumeChooser
      kind="playing"
      currentQuarter={currentQuarter}
      playerName={player?.name ?? null}
      playerCash={player?.cashUsd ?? 0}
      onContinue={() => setContinued(true)}
      onReset={() => {
        resetGame();
        // phase flips to idle; next render shows GameCanvas pre-game UI.
      }}
    />
  );
}

function ResumeChooser({
  kind, currentQuarter, playerName, playerCash, onContinue, onReset,
}: {
  kind: "playing" | "endgame";
  currentQuarter: number;
  playerName: string | null;
  playerCash: number;
  onContinue: () => void;
  onReset: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <main className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-accent font-bold mb-3 text-center">
          SkyForce
        </p>
        <h1 className="font-display text-3xl md:text-4xl text-ink leading-tight mb-2 text-center">
          {kind === "endgame"
            ? "Your last run finished."
            : "You have a game in progress."}
        </h1>
        <p className="text-ink-2 text-[0.9375rem] leading-relaxed text-center mb-8">
          {kind === "endgame"
            ? "View the final scoring screen to see how it ended, or wipe the saved run and start a new game."
            : `Pick up where you left off, or end this run and start fresh.`}
        </p>

        {/* Saved-run summary card */}
        {playerName && (
          <div className="rounded-xl border border-line bg-surface p-5 mb-6">
            <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2">
              Saved run
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <div className="min-w-0">
                <div className="font-display text-lg text-ink truncate">
                  {playerName}
                </div>
                <div className="text-[0.8125rem] text-ink-muted">
                  {fmtQuarter(currentQuarter)} · Quarter {currentQuarter} of{" "}
                  {TOTAL_GAME_ROUNDS}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono tabular text-base font-semibold text-ink">
                  {fmtMoney(playerCash)}
                </div>
                <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted">
                  Cash on hand
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Primary action — Continue (or View results) */}
        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full justify-center"
            onClick={onContinue}
          >
            {kind === "endgame" ? (
              <>
                <Trophy size={16} className="mr-2" />
                View final scoring
              </>
            ) : (
              <>
                <Play size={16} className="mr-2" />
                Continue game
              </>
            )}
            <ArrowRight size={16} className="ml-2" />
          </Button>

          {/* Secondary action — End game & start over */}
          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="w-full text-center text-[0.875rem] text-ink-muted hover:text-ink py-2 transition-colors"
            >
              End game & start over
            </button>
          ) : (
            <div className="rounded-lg border border-warning/40 bg-warning/5 p-4">
              <p className="text-[0.875rem] text-ink mb-3 text-center">
                This wipes the saved run. There&rsquo;s no undo.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={onReset}>
                  <RotateCcw size={13} className="mr-1.5" />
                  Yes, end & restart
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Other entry options */}
        <div className="mt-10 pt-6 border-t border-line text-center">
          <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted mb-2.5">
            Or jump elsewhere
          </div>
          <div className="flex items-center justify-center gap-4 text-[0.8125rem]">
            <Link href="/onboarding" className="text-ink-2 hover:text-ink">
              New solo game
            </Link>
            <span className="text-ink-muted">·</span>
            <Link href="/facilitator" className="text-ink-2 hover:text-ink">
              Facilitator console
            </Link>
            <span className="text-ink-muted">·</span>
            <Link href="/join" className="text-ink-2 hover:text-ink">
              Join with code
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
