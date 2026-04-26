"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, CardBody, Input } from "@/components/ui";
import { useGame, selectPlayer } from "@/store/game";
import { AdminPanel } from "@/components/panels/AdminPanel";
import { fmtMoney, fmtQuarter } from "@/lib/format";
import { computeAirlineValue, brandRating, fleetCount } from "@/lib/engine";
import { cn } from "@/lib/cn";
import { ArrowLeft, Plane, Users, Settings2, Trophy, Key, Mic, Save, Download, Upload, RotateCcw, Trash2, Lock, Unlock } from "lucide-react";
import {
  listSnapshots,
  exportSnapshotJson,
  importSnapshotJson,
  type SnapshotMeta,
} from "@/lib/snapshots";
import { toast } from "@/store/toasts";
import { LiveSimForm } from "@/components/game/LiveSimForm";
import type { Team } from "@/types/game";

/**
 * Facilitator console — separate from the player UI.
 *
 * In production this would be auth-gated as a distinct role and would
 * communicate with player sessions via a backend. In this single-player
 * demo it shares the same Zustand store: switching the active team
 * pivots the game store's `playerTeamId` so the facilitator can see
 * each airline's view in isolation. A clear "Currently viewing"
 * indicator and a TEAM_SWITCHER warn the user that this is a host
 * tool, not a player surface.
 */
export default function FacilitatorPage() {
  const s = useGame();
  const player = selectPlayer(s);
  const setActiveTeam = useGame((g) => g.setActiveTeam);

  const [section, setSection] = useState<"teams" | "admin" | "leaderboard" | "session" | "livesims" | "saves">("session");

  return (
    <main className="flex-1 flex flex-col bg-surface-2/30">
      <header className="px-8 py-4 border-b border-line bg-surface flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <Link href="/" className="text-ink-muted hover:text-ink flex items-center gap-1.5 text-[0.8125rem]">
            <ArrowLeft size={13} /> Back to game
          </Link>
          <span className="text-line">·</span>
          <span className="font-display text-xl text-ink">Facilitator</span>
          <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-ink-muted">
            {fmtQuarter(s.currentQuarter)} · {s.teams.length} team{s.teams.length === 1 ? "" : "s"}
          </span>
        </div>
        {player && (
          <div className="flex items-center gap-2 text-[0.75rem]">
            <span className="text-ink-muted">Viewing as:</span>
            <span
              className="inline-block w-6 h-6 rounded-md flex items-center justify-center font-mono text-[0.625rem] font-semibold text-primary-fg"
              style={{ background: player.color }}
            >
              {player.code}
            </span>
            <span className="font-medium text-ink">{player.name}</span>
          </div>
        )}
      </header>

      <div className="flex-1 flex">
        {/* Sidebar nav */}
        <nav className="w-52 border-r border-line bg-surface flex flex-col py-4 gap-1 px-2 shrink-0">
          <NavItem
            active={section === "session"}
            onClick={() => setSection("session")}
            Icon={Key}
            label="Session"
            sub="Code & seats"
          />
          <NavItem
            active={section === "teams"}
            onClick={() => setSection("teams")}
            Icon={Users}
            label="Teams"
            sub={`${s.teams.length} active`}
          />
          <NavItem
            active={section === "leaderboard"}
            onClick={() => setSection("leaderboard")}
            Icon={Trophy}
            label="Leaderboard"
            sub="Live rankings"
          />
          <NavItem
            active={section === "livesims"}
            onClick={() => setSection("livesims")}
            Icon={Mic}
            label="Live sims"
            sub="L0–L7 outcomes"
          />
          <NavItem
            active={section === "saves"}
            onClick={() => setSection("saves")}
            Icon={Save}
            label="Saves"
            sub="Snapshots & restore"
          />
          <NavItem
            active={section === "admin"}
            onClick={() => setSection("admin")}
            Icon={Settings2}
            label="Game state"
            sub="Quarter, fuel, teams"
          />
        </nav>

        {/* Main */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {section === "session" && <SessionView />}
          {section === "teams" && s.teams.length > 0 && (
            <TeamsView
              teams={s.teams}
              activeId={s.playerTeamId}
              onSelectTeam={(id) => setActiveTeam(id)}
            />
          )}
          {section === "teams" && s.teams.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-ink-2 text-[0.875rem]">
                  No teams yet. Start a session in the Session tab to invite players.
                </p>
              </CardBody>
            </Card>
          )}
          {section === "leaderboard" && (
            <LeaderboardView teams={s.teams} />
          )}
          {section === "livesims" && s.teams.length > 0 && (
            <Card>
              <CardBody>
                <LiveSimForm teams={s.teams} />
              </CardBody>
            </Card>
          )}
          {section === "livesims" && s.teams.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-ink-2 text-[0.875rem]">
                  Live-sim outcomes apply to existing teams. Start a session first.
                </p>
              </CardBody>
            </Card>
          )}
          {section === "saves" && <SavesView />}
          {section === "admin" && s.teams.length > 0 && (
            <Card>
              <CardBody>
                <AdminPanel />
              </CardBody>
            </Card>
          )}
          {section === "admin" && s.teams.length === 0 && (
            <Card>
              <CardBody>
                <p className="text-ink-2 text-[0.875rem]">
                  Game-state admin requires an active simulation. Start a session first.
                </p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

function SessionView() {
  const sessionCode = useGame((s) => s.sessionCode);
  const sessionLocked = useGame((s) => s.sessionLocked);
  const sessionSlots = useGame((s) => s.sessionSlots);
  const startSession = useGame((s) => s.startFacilitatedSession);
  const setSessionLocked = useGame((s) => s.setSessionLocked);
  const rebroadcastSessionCode = useGame((s) => s.rebroadcastSessionCode);
  const [seatCount, setSeatCount] = useState(5);

  const claimed = sessionSlots.filter((x) => x.claimed).length;
  const total = sessionSlots.length;

  return (
    <div className="space-y-4 max-w-2xl">
      <header>
        <h1 className="font-display text-[1.75rem] text-ink mb-1">Facilitated session</h1>
        <p className="text-ink-2 text-[0.9375rem] leading-relaxed">
          Generate a 4-digit join code, share it with the players in the
          room, and watch them claim seats as they enter the simulation
          on their own devices via <span className="font-mono">/join</span>.
        </p>
      </header>

      {!sessionCode ? (
        <Card>
          <CardBody>
            <h2 className="font-display text-[1.25rem] text-ink mb-3">Start a new session</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-1.5">
                  Number of teams
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSeatCount(Math.max(2, seatCount - 1))}
                    className="w-9 h-9 rounded-md border border-line hover:bg-surface-hover text-[1.125rem] font-semibold disabled:opacity-40"
                    disabled={seatCount <= 2}
                  >
                    −
                  </button>
                  <span className="tabular font-mono text-[1.5rem] text-ink font-bold w-14 text-center">
                    {seatCount}
                  </span>
                  <button
                    onClick={() => setSeatCount(Math.min(10, seatCount + 1))}
                    className="w-9 h-9 rounded-md border border-line hover:bg-surface-hover text-[1.125rem] font-semibold disabled:opacity-40"
                    disabled={seatCount >= 10}
                  >
                    +
                  </button>
                  <span className="text-[0.75rem] text-ink-muted ml-2">
                    Between 2 and 10 players
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => startSession(seatCount)}
                >
                  Generate session code →
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="font-display text-[1.25rem] text-ink">Session active</h2>
              <Badge tone="positive">{claimed}/{total} seats claimed</Badge>
            </div>

            <div className="rounded-lg border-2 border-primary bg-[rgba(20,53,94,0.04)] p-6 text-center mb-4">
              <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-2">
                Share this code
              </div>
              <div className="font-mono tabular text-[3.5rem] text-ink leading-none font-bold tracking-[0.4em] mb-2">
                {sessionCode}
              </div>
              <div className="text-[0.8125rem] text-ink-muted">
                Players visit{" "}
                <span className="font-mono text-ink">/join</span>{" "}
                and enter this code along with their company name and hub.
              </div>
            </div>

            {/* Session controls — lock toggle + reissue. Locked sessions
                still allow reconnects (a player whose computer dropped
                can rejoin by entering their original company name) but
                refuse new seat claims. */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Button
                variant={sessionLocked ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSessionLocked(!sessionLocked)}
              >
                {sessionLocked ? <Lock size={13} className="mr-1.5" /> : <Unlock size={13} className="mr-1.5" />}
                {sessionLocked ? "Session locked" : "Lock session"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => rebroadcastSessionCode()}
                title="Generate a new join code. Existing players keep their teams; new players use the new code."
              >
                Reissue code
              </Button>
              <span className="text-[0.6875rem] text-ink-muted leading-relaxed flex-1 min-w-[180px]">
                {sessionLocked
                  ? "Locked — only existing players can reconnect (by their original company name)."
                  : "Unlocked — new players can claim any open seat. Lock once your cohort is in to prevent strays."}
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="text-[0.6875rem] uppercase tracking-wider text-ink-muted font-semibold mb-2">
                Seats
              </div>
              {sessionSlots.map((seat, i) => (
                <div
                  key={seat.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2 text-[0.875rem]",
                    seat.claimed
                      ? "border-positive/40 bg-[var(--positive-soft)]/40"
                      : "border-dashed border-line",
                  )}
                >
                  <span className="font-mono text-ink-muted w-8 tabular text-center text-[0.75rem]">
                    #{i + 1}
                  </span>
                  {seat.claimed ? (
                    <span className="text-ink font-medium flex-1">
                      {seat.companyName}
                    </span>
                  ) : (
                    <span className="text-ink-muted italic flex-1">Awaiting player…</span>
                  )}
                  {seat.claimed && <Badge tone="positive">Joined</Badge>}
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function NavItem({
  active, onClick, Icon, label, sub,
}: {
  active: boolean;
  onClick: () => void;
  Icon: typeof Users;
  label: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg flex items-start gap-3 px-3 py-2.5 text-left transition-colors",
        active
          ? "bg-primary text-primary-fg"
          : "text-ink-2 hover:bg-surface-hover hover:text-ink",
      )}
    >
      <Icon size={16} strokeWidth={1.75} className="shrink-0 mt-0.5" />
      <div>
        <div className="font-medium text-[0.875rem] leading-tight">{label}</div>
        <div className={cn(
          "text-[0.6875rem] mt-0.5",
          active ? "text-primary-fg/80" : "text-ink-muted",
        )}>
          {sub}
        </div>
      </div>
    </button>
  );
}

function TeamsView({
  teams, activeId, onSelectTeam,
}: {
  teams: Team[];
  activeId: string | null;
  onSelectTeam: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-[1.75rem] text-ink mb-1">Teams</h1>
        <p className="text-ink-2 text-[0.875rem] leading-relaxed max-w-[60ch]">
          Switch the active view between teams. The selected airline becomes
          the &ldquo;player&rdquo; in the main game UI; the facilitator toggle
          here lets you flip through each airline&apos;s state without
          disturbing their session.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {teams.map((t) => {
          const isActive = t.id === activeId;
          const av = computeAirlineValue(t);
          const br = brandRating(t);
          const activeRoutes = t.routes.filter((r) => r.status === "active").length;
          const pendingRoutes = t.routes.filter((r) => r.status === "pending").length;
          return (
            <button
              key={t.id}
              onClick={() => onSelectTeam(t.id)}
              className={cn(
                "rounded-lg border bg-surface p-4 text-left transition-all",
                isActive
                  ? "border-primary shadow-[var(--shadow-2)] ring-2 ring-primary/20"
                  : "border-line hover:bg-surface-hover hover:border-line",
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <span
                  className="inline-block w-10 h-10 rounded-md flex items-center justify-center font-mono text-[0.75rem] font-semibold text-primary-fg shrink-0"
                  style={{ background: t.color }}
                >
                  {t.code}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-display text-[1.0625rem] text-ink leading-tight truncate">
                      {t.name}
                    </span>
                    {isActive && <Badge tone="primary">Active</Badge>}
                    {t.isPlayer && <Badge tone="accent">Player</Badge>}
                  </div>
                  <div className="text-[0.75rem] text-ink-muted font-mono">
                    Hub {t.hubCode} · {t.doctrine}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[0.8125rem]">
                <Row k="Cash" v={fmtMoney(t.cashUsd)} />
                <Row k="Debt" v={fmtMoney(t.totalDebtUsd)} />
                <Row k="Airline value" v={fmtMoney(av)} bold />
                <Row k="Brand rating" v={br.grade} />
                <Row k="Routes" v={`${activeRoutes}${pendingRoutes ? ` (+${pendingRoutes} pending)` : ""}`} />
                <Row k="Fleet" v={`${fleetCount(t.fleet)} aircraft`} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardView({ teams }: { teams: Team[] }) {
  const ranked = [...teams].sort(
    (a, b) => computeAirlineValue(b) - computeAirlineValue(a),
  );
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-[1.75rem] text-ink mb-1">Leaderboard</h1>
        <p className="text-ink-2 text-[0.875rem] leading-relaxed">
          Real-time ranking by Airline Value. Updated each quarter close.
        </p>
      </header>
      <Card>
        <CardBody>
          <table className="w-full text-[0.875rem]">
            <thead>
              <tr className="border-b border-line">
                <th className="text-left py-2 px-3 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">#</th>
                <th className="text-left py-2 px-3 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Team</th>
                <th className="text-right py-2 px-3 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Airline value</th>
                <th className="text-right py-2 px-3 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted">Brand</th>
                <th className="text-right py-2 px-3 text-[0.625rem] uppercase tracking-wider font-semibold text-ink-muted"><Plane size={11} className="inline" /></th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((t, i) => (
                <tr key={t.id} className="border-b border-line last:border-0 hover:bg-surface-hover">
                  <td className="py-2 px-3 font-mono text-ink-muted tabular">{i + 1}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-5 h-5 rounded flex items-center justify-center font-mono text-[0.5625rem] font-semibold text-primary-fg shrink-0" style={{ background: t.color }}>
                        {t.code}
                      </span>
                      <span className="font-medium text-ink">{t.name}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right tabular font-mono text-ink">{fmtMoney(computeAirlineValue(t))}</td>
                  <td className="py-2 px-3 text-right tabular font-mono text-ink">{brandRating(t).grade}</td>
                  <td className="py-2 px-3 text-right tabular font-mono text-ink-muted">{fleetCount(t.fleet)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ k, v, bold = false }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-ink-muted text-[0.6875rem] uppercase tracking-wider">{k}</span>
      <span className={cn("tabular font-mono", bold ? "text-ink font-semibold" : "text-ink-2")}>{v}</span>
    </div>
  );
}

/**
 * Quarter-snapshot facilitator surface.
 *
 * Lists every snapshot in localStorage (auto-saved at the start of each
 * round, plus any manual saves) and exposes Restore / Export / Import /
 * Delete. Restore replaces the live game state with the snapshot's
 * payload; Export downloads the JSON for archival; Import lets the
 * facilitator load a previously-exported JSON, useful if the localStorage
 * was wiped or the cohort moved to a new machine.
 */
function SavesView() {
  const saveQuarterSnapshot = useGame((s) => s.saveQuarterSnapshot);
  const restoreQuarterSnapshot = useGame((s) => s.restoreQuarterSnapshot);
  const deleteQuarterSnapshot = useGame((s) => s.deleteQuarterSnapshot);
  const currentQuarter = useGame((s) => s.currentQuarter);
  const phase = useGame((s) => s.phase);

  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>(() => listSnapshots());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function refresh() {
    setSnapshots(listSnapshots());
  }

  function handleManualSave() {
    saveQuarterSnapshot();
    toast.accent("Snapshot saved", `Game saved at ${fmtQuarter(currentQuarter)}.`);
    refresh();
  }

  function handleRestore(id: string) {
    setPendingId(id);
    const r = restoreQuarterSnapshot(id);
    setPendingId(null);
    if (!r.ok) {
      toast.negative("Restore failed", r.error ?? "Unknown error.");
    } else {
      refresh();
      setConfirmRestoreId(null);
    }
  }

  function handleDelete(id: string) {
    deleteQuarterSnapshot(id);
    refresh();
    toast.info("Snapshot deleted", "Removed from local storage.");
  }

  function handleExport(id: string) {
    const json = exportSnapshotJson(id);
    if (!json) {
      toast.negative("Export failed", "Snapshot couldn't be read from storage.");
      return;
    }
    const meta = snapshots.find((s) => s.id === id);
    const filename = `skyforce-${meta?.quarterLabel?.replace(/\s+/g, "-").toLowerCase() ?? id}.json`;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.accent("Snapshot exported", filename);
  }

  function handleImport(file: File) {
    file.text().then((text) => {
      const r = importSnapshotJson(text);
      if (!r.ok) {
        toast.negative("Import failed", r.error);
        return;
      }
      refresh();
      toast.accent("Snapshot imported", r.meta.quarterLabel);
    });
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <header>
        <h1 className="font-display text-[1.75rem] text-ink mb-1">Game saves</h1>
        <p className="text-ink-2 text-[0.9375rem] leading-relaxed">
          One snapshot per round, auto-saved when each round begins. Use
          <span className="font-medium text-ink"> Restore</span> to roll the
          game back to that exact moment — useful for re-syncing a cohort
          after a disconnection or replaying a critical decision.
        </p>
      </header>

      <Card>
        <CardBody>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSave}
              disabled={phase === "idle"}
            >
              <Save size={13} className="mr-1.5" />
              Save current state
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={13} className="mr-1.5" />
              Import JSON
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImport(f);
                e.target.value = "";
              }}
            />
            <span className="text-[0.6875rem] text-ink-muted ml-auto">
              {snapshots.length} snapshot{snapshots.length === 1 ? "" : "s"}
            </span>
          </div>

          {snapshots.length === 0 ? (
            <div className="text-[0.875rem] text-ink-muted italic py-8 text-center rounded-md border border-dashed border-line">
              No snapshots yet. They auto-save at the start of each round, or
              click <strong className="text-ink">Save current state</strong> above
              to take one now.
            </div>
          ) : (
            <div className="space-y-1.5">
              {snapshots.map((m) => (
                <div
                  key={m.id}
                  className="rounded-md border border-line p-3 flex items-center gap-3 hover:bg-surface-hover"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[0.8125rem] text-ink font-semibold">
                        {m.quarterLabel}
                      </span>
                      <span className="text-[0.6875rem] text-ink-muted">
                        Round {m.quarter}/40
                      </span>
                      {m.quarter === currentQuarter && (
                        <Badge tone="primary">Current</Badge>
                      )}
                    </div>
                    <div className="text-[0.75rem] text-ink-muted mt-0.5 truncate">
                      {m.label}
                    </div>
                    <div className="text-[0.625rem] text-ink-muted/70 mt-0.5">
                      Saved {new Date(m.savedAt).toLocaleString()} · {m.teamCount} team{m.teamCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setConfirmRestoreId(m.id)}
                      disabled={pendingId === m.id}
                      className="px-2 py-1 rounded-md border border-line text-[0.75rem] hover:bg-[var(--accent-soft)] hover:border-accent flex items-center gap-1 disabled:opacity-50"
                      title="Restore this snapshot — replaces live game state"
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                    <button
                      onClick={() => handleExport(m.id)}
                      className="px-2 py-1 rounded-md border border-line text-[0.75rem] hover:bg-surface-hover flex items-center gap-1"
                      title="Download this snapshot as JSON"
                    >
                      <Download size={11} /> Export
                    </button>
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="px-2 py-1 rounded-md border border-line text-[0.75rem] hover:bg-[var(--negative-soft)] hover:border-negative flex items-center gap-1 text-ink-muted hover:text-negative"
                      title="Delete this snapshot"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <p className="text-[0.75rem] text-ink-muted leading-relaxed">
        Snapshots live in your browser&apos;s local storage. To move a save
        between machines, export it as JSON and import it on the new
        machine. The schema is versioned — saves from incompatible builds
        are rejected at import time.
      </p>

      {/* Restore confirmation modal — restoring a snapshot is destructive
          (replaces the live game state) so we make the player confirm. */}
      {confirmRestoreId && (() => {
        const meta = snapshots.find((m) => m.id === confirmRestoreId);
        if (!meta) return null;
        return (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setConfirmRestoreId(null)}
          >
            <div
              className="rounded-lg bg-surface border border-line shadow-2xl p-5 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-[1.25rem] text-ink mb-2">
                Restore {meta.quarterLabel}?
              </h3>
              <p className="text-[0.875rem] text-ink-2 leading-relaxed mb-4">
                This replaces the current game state with the snapshot taken at{" "}
                <strong className="text-ink">{meta.quarterLabel}</strong>.
                Every team rolls back to where they were at the start of that
                round. Subsequent rounds are wiped from the live state but
                their snapshots stay in this list.
              </p>
              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmRestoreId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleRestore(meta.id)}
                  disabled={pendingId === meta.id}
                >
                  Restore game
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
