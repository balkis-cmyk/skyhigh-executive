"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { CITIES, CITIES_BY_CODE } from "@/data/cities";
import type { City, Team } from "@/types/game";
import { cn } from "@/lib/cn";

export interface WorldMapProps {
  team: Team;
  /** IATA selected as origin for a new route. */
  selectedOriginCode?: string | null;
  /** City click handler. */
  onCityClick?: (city: City) => void;
  /** City hover tooltip data returned. */
  onCityHover?: (city: City | null) => void;
  className?: string;
}

// Equirectangular projection with aspect-aware scaling.
// Viewport designed for 16:8 wide aspect.
const VIEW_W = 1600;
const VIEW_H = 800;

/** lon/lat → SVG x/y. Works for equirectangular projection. */
function project(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * VIEW_W;
  const y = ((90 - lat) / 180) * VIEW_H;
  return { x, y };
}

/** Great-circle curve between two cities as quadratic bezier (approximation). */
function routeArcPath(a: City, b: City): string {
  const p1 = project(a.lon, a.lat);
  const p2 = project(b.lon, b.lat);
  // Control point above the midpoint, height proportional to chord length
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chord = Math.sqrt(dx * dx + dy * dy);
  const lift = Math.min(140, chord * 0.18);
  // Shift the control toward the poles for realism
  const ctrlX = midX;
  const ctrlY = midY - lift;
  return `M ${p1.x} ${p1.y} Q ${ctrlX} ${ctrlY} ${p2.x} ${p2.y}`;
}

/** Hub/city radius by tier + zoom (we just use a fixed zoom for now). */
function cityRadius(tier: number): number {
  if (tier === 1) return 7;
  if (tier === 2) return 5;
  if (tier === 3) return 3.5;
  return 2.5;
}

export function WorldMap({
  team,
  selectedOriginCode,
  onCityClick,
  onCityHover,
  className,
}: WorldMapProps) {
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const hub = CITIES_BY_CODE[team.hubCode];
  const activeRoutes = team.routes.filter((r) => r.status === "active");

  // Destination cities (cities connected to own routes) for ring styling
  const ownDestCodes = useMemo(() => {
    const set = new Set<string>();
    for (const r of activeRoutes) {
      set.add(r.originCode);
      set.add(r.destCode);
    }
    return set;
  }, [activeRoutes]);

  // Track viewport size for tooltip positioning
  const [bbox, setBbox] = useState<DOMRect | null>(null);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    setBbox(el.getBoundingClientRect());
    const obs = new ResizeObserver(() => setBbox(el.getBoundingClientRect()));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className={cn("relative w-full h-full bg-[var(--map-ocean)] overflow-hidden rounded-lg border border-line", className)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid: lat/lon lines every 30° */}
        <g stroke="var(--map-line)" strokeWidth="1" opacity="0.3">
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = project(0, lat).y;
            return <line key={`lat-${lat}`} x1={0} y1={y} x2={VIEW_W} y2={y} strokeDasharray={lat === 0 ? "0" : "2 4"} />;
          })}
          {[-150, -120, -90, -60, -30, 30, 60, 90, 120, 150].map((lon) => {
            const x = project(lon, 0).x;
            return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={VIEW_H} strokeDasharray="2 4" />;
          })}
          {/* Prime meridian + equator stronger */}
          <line x1={project(0, 0).x} y1={0} x2={project(0, 0).x} y2={VIEW_H} />
        </g>

        {/* Continental land-mass hint: big soft blobs under the cities
             using convex-hull-like city clusters. Minimal, editorial. */}
        <g fill="var(--map-land)" opacity="0.55">
          {/* rough continent boxes (approximate, for aesthetic grounding) */}
          <ellipse cx={project(-95, 40).x} cy={project(-95, 40).y} rx={160} ry={110} />  {/* N America */}
          <ellipse cx={project(-60, -15).x} cy={project(-60, -15).y} rx={90} ry={130} />   {/* S America */}
          <ellipse cx={project(15, 50).x} cy={project(15, 50).y} rx={120} ry={60} />       {/* Europe */}
          <ellipse cx={project(20, 0).x} cy={project(20, 0).y} rx={120} ry={140} />        {/* Africa */}
          <ellipse cx={project(55, 25).x} cy={project(55, 25).y} rx={90} ry={80} />        {/* Middle East */}
          <ellipse cx={project(105, 30).x} cy={project(105, 30).y} rx={150} ry={110} />    {/* Asia */}
          <ellipse cx={project(135, -25).x} cy={project(135, -25).y} rx={100} ry={50} />   {/* Australia */}
        </g>

        {/* Route arcs */}
        <g fill="none" strokeLinecap="round">
          {activeRoutes.map((r) => {
            const origin = CITIES_BY_CODE[r.originCode];
            const dest = CITIES_BY_CODE[r.destCode];
            if (!origin || !dest) return null;
            const profitable = r.avgOccupancy > 0.7;
            const losing = r.avgOccupancy > 0 && r.avgOccupancy < 0.5;
            const color = profitable
              ? "var(--positive)"
              : losing
                ? "var(--negative)"
                : team.color;
            return (
              <path
                key={r.id}
                d={routeArcPath(origin, dest)}
                stroke={color}
                strokeWidth="2"
                strokeOpacity="0.75"
              />
            );
          })}
          {/* Preview arc from selected origin to hover */}
          {selectedOriginCode && hover && (() => {
            const a = CITIES_BY_CODE[selectedOriginCode];
            const b = CITIES_BY_CODE[hover.code];
            if (!a || !b) return null;
            return (
              <path
                d={routeArcPath(a, b)}
                stroke="var(--accent)"
                strokeWidth="2"
                strokeDasharray="4 6"
                strokeOpacity="0.9"
              />
            );
          })()}
        </g>

        {/* Cities */}
        <g>
          {CITIES.map((c) => {
            const p = project(c.lon, c.lat);
            const isHub = c.code === team.hubCode;
            const isSelected = c.code === selectedOriginCode;
            const connected = ownDestCodes.has(c.code);
            const isHovered = hover?.code === c.code;
            const r = cityRadius(c.tier) * (isHovered ? 1.4 : 1);
            return (
              <g
                key={c.code}
                transform={`translate(${p.x},${p.y})`}
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHover({ code: c.code, x: p.x, y: p.y });
                  onCityHover?.(c);
                }}
                onMouseLeave={() => {
                  setHover(null);
                  onCityHover?.(null);
                }}
                onClick={() => onCityClick?.(c)}
              >
                {isHub && (
                  <circle r={14} fill="none" stroke="var(--primary)" strokeWidth="2" opacity="0.5" />
                )}
                {isSelected && (
                  <circle r={12} fill="none" stroke="var(--accent)" strokeWidth="2" />
                )}
                <circle
                  r={r}
                  fill={isHub ? "var(--primary)" : connected ? team.color : "var(--ink-muted)"}
                  stroke="var(--surface)"
                  strokeWidth="1.5"
                />
                {(isHub || c.tier === 1 || isHovered) && (
                  <text
                    y={-r - 6}
                    textAnchor="middle"
                    fontSize={c.tier === 1 ? 11 : 10}
                    fontWeight={600}
                    fontFamily="var(--font-mono)"
                    fill={isHub ? "var(--primary)" : "var(--ink)"}
                    style={{ paintOrder: "stroke", stroke: "var(--bg)", strokeWidth: 3 }}
                  >
                    {c.code}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip */}
      {hover && bbox && (() => {
        const c = CITIES_BY_CODE[hover.code];
        if (!c) return null;
        // Project into screen space
        const p = project(c.lon, c.lat);
        const screenX = (p.x / VIEW_W) * bbox.width;
        const screenY = (p.y / VIEW_H) * bbox.height;
        return (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-line bg-surface/95 backdrop-blur px-3 py-2 shadow-[var(--shadow-2)] min-w-[180px]"
            style={{ left: screenX + 14, top: screenY - 40 }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="font-semibold text-ink text-[0.875rem]">{c.name}</div>
                <div className="text-[0.6875rem] text-ink-muted">{c.regionName} · Tier {c.tier}</div>
              </div>
              <div className="font-mono text-[0.8125rem] text-primary">{c.code}</div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-line grid grid-cols-2 gap-1 text-[0.6875rem]">
              <span className="text-ink-muted">Tourism</span>
              <span className="tabular font-mono text-right text-ink">{c.tourism}/day</span>
              <span className="text-ink-muted">Business</span>
              <span className="tabular font-mono text-right text-ink">{c.business}/day</span>
              <span className="text-ink-muted">Amplifier</span>
              <span className="tabular font-mono text-right text-ink">×{c.amplifier.toFixed(1)}</span>
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-md border border-line bg-surface/90 backdrop-blur px-3 py-2 text-[0.75rem]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-primary" /> Your hub
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: team.color }} /> Your routes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-ink-muted" /> 100 cities
        </span>
      </div>
    </div>
  );
}
