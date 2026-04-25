"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import {
  geoNaturalEarth1,
  geoPath,
} from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection } from "geojson";
import type { Topology } from "topojson-specification";
import { CITIES, CITIES_BY_CODE } from "@/data/cities";
import type { City, Team } from "@/types/game";
import { cn } from "@/lib/cn";

/** Hand-picked plausible route pattern per mocked rival hub. */
const RIVAL_ROUTES: Record<string, string[]> = {
  SIN: ["HKG", "BKK", "KUL", "BOM", "SYD", "NRT"],
  LHR: ["JFK", "DXB", "CDG", "FRA", "HKG", "LAX"],
  DXB: ["LHR", "JFK", "NRT", "BOM", "CDG", "JNB"],
  NRT: ["HKG", "SIN", "LAX", "SFO", "ICN", "PVG"],
  CPH: ["ARN", "OSL", "LHR", "JFK", "FRA"],
  JNB: ["LHR", "DXB", "NBO", "CDG"],
  GRU: ["EZE", "MIA", "LIM", "JFK", "CDG"],
  HKG: ["NRT", "SIN", "BKK", "PVG", "SYD", "LAX"],
  ORD: ["JFK", "LAX", "SFO", "LHR", "CDG", "FRA"],
};
import { cityEventImpact } from "@/lib/city-events";
import { useGame } from "@/store/game";

export interface WorldMapProps {
  team: Team;
  /** Rival teams (shown as muted markers + simulated routes per PRD §3.B). */
  rivals?: Team[];
  selectedOriginCode?: string | null;
  onCityClick?: (city: City) => void;
  onCityHover?: (city: City | null) => void;
  onClearSelection?: () => void;
  className?: string;
}

const VIEW_W = 1600;
const VIEW_H = 900;

// Natural Earth projection — flatter, the whole world visible, easy to navigate.
const MIN_SCALE = 180;
const MAX_SCALE = 900;
const DEFAULT_SCALE = 280;

let worldAtlasPromise: Promise<FeatureCollection> | null = null;
function loadWorldAtlas(): Promise<FeatureCollection> {
  if (!worldAtlasPromise) {
    worldAtlasPromise = fetch(
      "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
    )
      .then((r) => r.json())
      .then((topo: Topology) => {
        return feature(
          topo,
          topo.objects.countries,
        ) as unknown as FeatureCollection;
      });
  }
  return worldAtlasPromise;
}

function cityRadius(tier: number, hovered: boolean, scale: number): number {
  const zoomFactor = Math.sqrt(scale / DEFAULT_SCALE);
  // Wider tier spread so size alone reads tier
  const base = (tier === 1 ? 6 : tier === 2 ? 4 : tier === 3 ? 2.5 : 1.75) * zoomFactor;
  return hovered ? base * 1.5 : base;
}

function tierLabel(tier: number): string {
  return `T${tier}`;
}

/** Sample the great-circle between a and b into an SVG polyline path
 *  (filtered to the visible hemisphere). */
function arcPathGreatCircle(
  a: [number, number],
  b: [number, number],
  project: (lonlat: [number, number]) => [number, number] | null,
): string {
  const steps = 48;
  const points: Array<[number, number]> = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lon = a[0] + (b[0] - a[0]) * t;
    const lat = a[1] + (b[1] - a[1]) * t;
    const xy = project([lon, lat]);
    if (xy) points.push(xy);
  }
  if (points.length < 2) return "";
  return (
    "M " + points.map(([x, y]) => `${x} ${y}`).join(" L ")
  );
}

export function WorldMap({
  team,
  rivals,
  selectedOriginCode,
  onCityClick,
  onCityHover,
  onClearSelection,
  className,
}: WorldMapProps) {
  const [atlas, setAtlas] = useState<FeatureCollection | null>(null);
  const [hoverCode, setHoverCode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [bbox, setBbox] = useState<DOMRect | null>(null);
  const currentQuarter = useGame((s) => s.currentQuarter);

  // Projection state: translate offset (px, py) in screen pixels + scale
  const [translate, setTranslate] = useState<[number, number]>([VIEW_W / 2, VIEW_H / 2]);
  const [scale, setScale] = useState<number>(DEFAULT_SCALE);

  // Dragging state
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startTranslate: [number, number];
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    loadWorldAtlas().then(setAtlas).catch(() => setAtlas(null));
  }, []);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    setBbox(el.getBoundingClientRect());
    const obs = new ResizeObserver(() => setBbox(el.getBoundingClientRect()));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Moving dots use native <animateMotion> — no React tick required.
  // Respect reduced-motion preference by toggling once on mount.
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const projection = useMemo(() => {
    return geoNaturalEarth1()
      .translate(translate)
      .scale(scale);
  }, [scale, translate]);

  const path = useMemo(() => geoPath(projection), [projection]);

  /** Project a lonlat to screen; returns null if on the far side. */
  const project = useCallback(
    (lonlat: [number, number]): [number, number] | null => {
      const xy = projection(lonlat);
      if (!xy) return null;
      return xy as [number, number];
    },
    [projection],
  );

  const activeRoutes = useMemo(
    () => team.routes.filter((r) => r.status === "active"),
    [team.routes],
  );
  const ownDestCodes = useMemo(() => {
    const set = new Set<string>();
    for (const r of activeRoutes) {
      set.add(r.originCode);
      set.add(r.destCode);
    }
    return set;
  }, [activeRoutes]);

  // Sum daily flights per city across all active routes — used for labels.
  const dailyFlightsByCity = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of activeRoutes) {
      map[r.originCode] = (map[r.originCode] ?? 0) + r.dailyFrequency;
      map[r.destCode] = (map[r.destCode] ?? 0) + r.dailyFrequency;
    }
    return map;
  }, [activeRoutes]);

  // Sphere + graticule paths (d3-geo handles visibility via clipAngle)
  const spherePath = useMemo(() => path({ type: "Sphere" } as Parameters<typeof path>[0]) ?? "", [path]);
  const graticulePaths = useMemo(() => {
    const lines: string[] = [];
    // Parallels every 30°
    for (const lat of [-60, -30, 0, 30, 60]) {
      const coords: Array<[number, number]> = [];
      for (let lon = -180; lon <= 180; lon += 2) coords.push([lon, lat]);
      const d = path({ type: "LineString", coordinates: coords } as unknown as Parameters<typeof path>[0]);
      if (d) lines.push(d);
    }
    // Meridians every 30°
    for (let lon = -180; lon <= 180; lon += 30) {
      const coords: Array<[number, number]> = [];
      for (let lat = -90; lat <= 90; lat += 2) coords.push([lon, lat]);
      const d = path({ type: "LineString", coordinates: coords } as unknown as Parameters<typeof path>[0]);
      if (d) lines.push(d);
    }
    return lines;
  }, [path]);

  // Pointer handlers for drag-to-pan
  const onPointerDown = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTranslate: translate,
      moved: false,
    };
  }, [translate]);

  const onPointerMove = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) d.moved = true;
    if (d.moved) {
      // Convert screen px to SVG viewBox px (assume rect matches)
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const sx = VIEW_W / rect.width;
      const sy = VIEW_H / rect.height;
      setTranslate([d.startTranslate[0] + dx * sx, d.startTranslate[1] + dy * sy]);
    }
  }, []);

  const onPointerUp = useCallback((e: ReactPointerEvent<SVGSVGElement>) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    dragRef.current = null;
  }, []);

  const onWheel = useCallback((e: ReactWheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s * factor)));
  }, []);

  // Reset to a sensible view (double-click)
  const resetView = useCallback(() => {
    setTranslate([VIEW_W / 2, VIEW_H / 2]);
    setScale(DEFAULT_SCALE);
  }, []);

  // Natural Earth shows the whole world — all cities "visible" from projection POV
  const isVisible = useCallback(
    (_lon: number, _lat: number): boolean => {
      return true;
    },
    [],
  );

  return (
    <div
      className={cn(
        "relative w-full h-full bg-[var(--map-ocean)] overflow-hidden select-none",
        className,
      )}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={resetView}
      >
        {/* Globe sphere backdrop — subtle ocean depth gradient */}
        <defs>
          <radialGradient id="globe-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--map-ocean)" />
            <stop offset="85%" stopColor="var(--map-ocean-deep)" />
            <stop offset="100%" stopColor="var(--map-ocean-deep)" stopOpacity="0.85" />
          </radialGradient>
          {/* Land gradient: slight tone shift across the globe for depth */}
          <radialGradient id="land-tone" cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#e5d6b0" />
            <stop offset="100%" stopColor="var(--map-land)" />
          </radialGradient>
          {/* Glow shadow under coastlines for subtle depth */}
          <filter id="coastline-soft" x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        <path d={spherePath} fill="url(#globe-glow)" stroke="var(--map-ocean-deep)" strokeWidth="0.6" strokeOpacity="0.5" />

        {/* Graticule */}
        <g stroke="#8aa1b2" strokeWidth="0.3" fill="none" opacity="0.22">
          {graticulePaths.map((d, i) => (
            <path key={i} d={d} strokeDasharray="2 5" />
          ))}
        </g>

        {/* Countries: coastline shadow layer + land fill + border */}
        {atlas && (
          <g>
            {/* Soft coastline shadow to give subtle depth between land and water */}
            <g filter="url(#coastline-soft)" opacity="0.35">
              {atlas.features.map((f, i) => {
                const d: string = path(f as Parameters<typeof path>[0]) ?? "";
                if (!d) return null;
                return (
                  <path
                    key={`shadow-${i}`}
                    d={d}
                    fill="none"
                    stroke="var(--map-line)"
                    strokeWidth="2.5"
                  />
                );
              })}
            </g>
            {/* Land fill */}
            {atlas.features.map((f, i) => {
              const d: string = path(f as Parameters<typeof path>[0]) ?? "";
              if (!d) return null;
              return (
                <path
                  key={i}
                  d={d}
                  fill="url(#land-tone)"
                  stroke="var(--map-line)"
                  strokeWidth="0.5"
                  strokeOpacity="0.65"
                />
              );
            })}
          </g>
        )}

        {/* Rival routes (muted, behind own routes per PRD §3.B) */}
        {rivals && rivals.length > 0 && (
          <g fill="none" strokeLinecap="round" opacity="0.5">
            {rivals.flatMap((rv) => {
              const destinations = RIVAL_ROUTES[rv.hubCode] ?? [];
              const hub = CITIES_BY_CODE[rv.hubCode];
              if (!hub) return [];
              return destinations.flatMap((destCode) => {
                const d = CITIES_BY_CODE[destCode];
                if (!d) return [];
                const path = arcPathGreatCircle(
                  [hub.lon, hub.lat],
                  [d.lon, d.lat],
                  project,
                );
                if (!path) return [];
                return (
                  <path
                    key={`${rv.id}-${destCode}`}
                    d={path}
                    stroke={rv.color}
                    strokeWidth={0.9 * Math.sqrt(scale / DEFAULT_SCALE)}
                    strokeOpacity="0.35"
                    strokeDasharray="2 4"
                  />
                );
              });
            })}
          </g>
        )}

        {/* Rival hub markers */}
        {rivals && rivals.length > 0 && (
          <g>
            {rivals.map((rv) => {
              const hub = CITIES_BY_CODE[rv.hubCode];
              if (!hub || !isVisible(hub.lon, hub.lat)) return null;
              const xy = project([hub.lon, hub.lat]);
              if (!xy) return null;
              const r = 4 * Math.sqrt(scale / DEFAULT_SCALE);
              return (
                <g key={`rival-hub-${rv.id}`} transform={`translate(${xy[0]},${xy[1]})`}>
                  <circle r={r * 2.5} fill="none" stroke={rv.color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 2" />
                  <circle r={r} fill={rv.color} stroke="var(--surface)" strokeWidth="1.2" opacity="0.7" />
                </g>
              );
            })}
          </g>
        )}

        {/* Route arcs + animated plane icons (native SVG, no React re-renders) */}
        <g fill="none" strokeLinecap="round">
          {activeRoutes.map((r, i) => {
            const a = CITIES_BY_CODE[r.originCode];
            const b = CITIES_BY_CODE[r.destCode];
            if (!a || !b) return null;
            const profitable = r.avgOccupancy > 0.7;
            const losing = r.avgOccupancy > 0 && r.avgOccupancy < 0.5;
            const color = profitable
              ? "var(--positive)"
              : losing
                ? "var(--negative)"
                : team.color;
            const d = arcPathGreatCircle(
              [a.lon, a.lat],
              [b.lon, b.lat],
              project,
            );
            if (!d) return null;
            const duration = `${10 + (i % 5) * 1.2}s`; // staggered
            // Plane SVG path (centered at origin, nose up at y=-5 — animateMotion
            // with rotate="auto" handles pointing along the arc)
            const planeScale = 0.5 * Math.sqrt(scale / DEFAULT_SCALE);
            return (
              <g key={r.id}>
                <path
                  d={d}
                  stroke={color}
                  strokeWidth={1.75 * Math.sqrt(scale / DEFAULT_SCALE)}
                  strokeOpacity="0.55"
                />
                <g>
                  {/* Tiny plane icon — simple airfoil silhouette */}
                  <g transform={`scale(${planeScale})`}>
                    <path
                      d="M 0,-10 L 2,-3 L 14,0 L 2,3 L 1,8 L 5,11 L 0,10 L -5,11 L -1,8 L -2,3 L -14,0 L -2,-3 Z"
                      fill={color}
                      stroke="var(--surface)"
                      strokeWidth="1"
                    />
                  </g>
                  {!reducedMotion && (
                    <animateMotion
                      dur={duration}
                      repeatCount="indefinite"
                      rotate="auto"
                      path={d}
                    />
                  )}
                </g>
              </g>
            );
          })}
          {/* Preview arc */}
          {selectedOriginCode && hoverCode && (() => {
            const a = CITIES_BY_CODE[selectedOriginCode];
            const b = CITIES_BY_CODE[hoverCode];
            if (!a || !b) return null;
            const d = arcPathGreatCircle(
              [a.lon, a.lat],
              [b.lon, b.lat],
              project,
            );
            return (
              <path
                d={d}
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
            if (!isVisible(c.lon, c.lat)) return null;
            const xy = project([c.lon, c.lat]);
            if (!xy) return null;
            const [x, y] = xy;
            const isHub = c.code === team.hubCode;
            const isSecondaryHub = team.secondaryHubCodes?.includes(c.code) ?? false;
            const isSelected = c.code === selectedOriginCode;
            const connected = ownDestCodes.has(c.code);
            const isHovered = hoverCode === c.code;
            const r = cityRadius(c.tier, isHovered, scale);
            const showLabel =
              isHub || isSecondaryHub || c.tier === 1 || isHovered ||
              (c.tier === 2 && scale > DEFAULT_SCALE * 1.3);
            return (
              <g
                key={c.code}
                transform={`translate(${x},${y})`}
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoverCode(c.code);
                  onCityHover?.(c);
                }}
                onMouseLeave={() => {
                  setHoverCode(null);
                  onCityHover?.(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragRef.current?.moved) return; // suppress click after drag
                  onCityClick?.(c);
                }}
              >
                <circle r={14} fill="transparent" />

                {/* HUB — unique, unmistakable: wedge-badge with HUB label */}
                {isHub && (
                  <>
                    <circle className="hub-pulse" fill="none" stroke={team.color} strokeWidth="2" />
                    <circle r={r + 6} fill="none" stroke={team.color} strokeWidth="1.5" opacity="0.45" />
                    <circle r={r + 3} fill="var(--surface)" stroke={team.color} strokeWidth="2.5" />
                  </>
                )}

                {/* Secondary hub — smaller version with dashed outer ring */}
                {isSecondaryHub && (
                  <circle r={r + 4} fill="none" stroke={team.color} strokeWidth="1.5" strokeDasharray="2 2" opacity="0.95" />
                )}

                {isSelected && (
                  <>
                    <circle className="city-select-pulse" fill="none" stroke="var(--accent)" strokeWidth="2" />
                    <circle r={Math.max(8, r + 6)} fill="none" stroke="var(--accent)" strokeWidth="2" />
                  </>
                )}

                {/* City dot — always a circle; size = tier, colour = network status */}
                <circle
                  r={isHub ? r * 0.85 : r}
                  fill={
                    isHub
                      ? team.color
                      : isSecondaryHub
                        ? team.color
                        : connected
                          ? team.color
                          : "var(--ink-2)"
                  }
                  opacity={isHub || isSecondaryHub ? 1 : connected ? 0.95 : 0.5}
                  stroke="var(--surface)"
                  strokeWidth={isHub ? 0.8 : 1.1}
                />

                {/* HUB badge label */}
                {isHub && (
                  <g transform={`translate(0,${-r - 12})`}>
                    <rect
                      x={-14} y={-6} width={28} height={12} rx={2}
                      fill={team.color}
                    />
                    <text
                      y={3}
                      textAnchor="middle"
                      fontSize={8}
                      fontWeight={700}
                      letterSpacing="0.15em"
                      fontFamily="var(--font-sans)"
                      fill="var(--surface)"
                    >
                      HUB
                    </text>
                  </g>
                )}

                {/* Secondary hub badge */}
                {isSecondaryHub && (
                  <g transform={`translate(0,${-r - 11})`}>
                    <rect
                      x={-16} y={-5.5} width={32} height={11} rx={2}
                      fill="var(--surface)"
                      stroke={team.color}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                    <text
                      y={3}
                      textAnchor="middle"
                      fontSize={7.5}
                      fontWeight={700}
                      letterSpacing="0.1em"
                      fontFamily="var(--font-sans)"
                      fill={team.color}
                    >
                      HUB·2
                    </text>
                  </g>
                )}

                {/* City name label for hub, secondary hub, and network cities.
                    Unconnected cities: small IATA code only on hover or tier-1. */}
                {(isHub || isSecondaryHub || connected) ? (
                  <g transform={`translate(0,${isHub || isSecondaryHub ? r + 14 : r + 6})`}>
                    <text
                      textAnchor="middle"
                      fontSize={isHub ? 11 : 10}
                      fontWeight={700}
                      fontFamily="var(--font-sans)"
                      fill={isHub || isSecondaryHub ? team.color : "var(--ink)"}
                      style={{
                        paintOrder: "stroke",
                        stroke: "var(--bg)",
                        strokeWidth: 3.5,
                      }}
                    >
                      {c.name}
                    </text>
                    {/* Daily flight count for network cities */}
                    {(dailyFlightsByCity[c.code] ?? 0) > 0 && (
                      <text
                        y={11}
                        textAnchor="middle"
                        fontSize={8.5}
                        fontWeight={600}
                        fontFamily="var(--font-mono)"
                        fill={team.color}
                        style={{
                          paintOrder: "stroke",
                          stroke: "var(--bg)",
                          strokeWidth: 3,
                        }}
                      >
                        {dailyFlightsByCity[c.code]}/day
                      </text>
                    )}
                  </g>
                ) : showLabel ? (
                  <text
                    y={-r - 5}
                    textAnchor="middle"
                    fontSize={c.tier === 1 ? 9.5 : c.tier === 2 ? 8.5 : 7.5}
                    fontWeight={500}
                    fontFamily="var(--font-mono)"
                    fill="var(--ink-muted)"
                    opacity={0.75}
                    style={{
                      paintOrder: "stroke",
                      stroke: "var(--bg)",
                      strokeWidth: 3,
                    }}
                  >
                    {c.code}
                  </text>
                ) : null}
              </g>
            );
          })}
        </g>

        {/* Loading placeholder */}
        {!atlas && (
          <text
            x={VIEW_W / 2}
            y={VIEW_H / 2}
            textAnchor="middle"
            fontSize={14}
            fontFamily="var(--font-sans)"
            fill="var(--ink-muted)"
          >
            Loading world atlas…
          </text>
        )}
      </svg>

      {/* Hover tooltip (ephemeral, suppressed when an origin is pinned) */}
      {!selectedOriginCode && hoverCode && bbox && (() => {
        const c = CITIES_BY_CODE[hoverCode];
        if (!c) return null;
        if (!isVisible(c.lon, c.lat)) return null;
        const xy = project([c.lon, c.lat]);
        if (!xy) return null;
        const screenX = (xy[0] / VIEW_W) * bbox.width;
        const screenY = (xy[1] / VIEW_H) * bbox.height;
        const evt = cityEventImpact(c.code, currentQuarter);
        return (
          <div
            className="pointer-events-none absolute z-20 rounded-md border border-line bg-surface/95 backdrop-blur px-3 py-2 shadow-[var(--shadow-2)] min-w-[200px]"
            style={{ left: screenX + 14, top: screenY - 40 }}
          >
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="font-semibold text-ink text-[0.875rem]">{c.name}</div>
                <div className="text-[0.6875rem] text-ink-muted">
                  {c.regionName} · Lvl {c.tier}
                </div>
              </div>
              <div className="font-mono text-[0.8125rem] text-primary">{c.code}</div>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-line grid grid-cols-2 gap-1 text-[0.6875rem]">
              <span className="text-ink-muted">Tourism</span>
              <span className="tabular font-mono text-right text-ink">{c.tourism}/day</span>
              <span className="text-ink-muted">Business</span>
              <span className="tabular font-mono text-right text-ink">{c.business}/day</span>
              <span className="text-ink-muted">Event</span>
              <span className={`tabular font-mono text-right ${evt.pct > 0 ? "text-positive" : evt.pct < 0 ? "text-negative" : "text-ink-muted"}`}>
                {evt.pct === 0 ? "—" : `${evt.pct > 0 ? "+" : ""}${evt.pct}%`}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Pinned origin card — persists until destination picked or cleared */}
      {selectedOriginCode && bbox && (() => {
        const c = CITIES_BY_CODE[selectedOriginCode];
        if (!c) return null;
        if (!isVisible(c.lon, c.lat)) return null;
        const xy = project([c.lon, c.lat]);
        if (!xy) return null;
        const screenX = (xy[0] / VIEW_W) * bbox.width;
        const screenY = (xy[1] / VIEW_H) * bbox.height;
        // Place card to the right of the dot; if near the right edge, flip to the left
        const flip = screenX > bbox.width - 280;
        return (
          <div
            className="absolute z-30 rounded-lg border border-line bg-surface/98 backdrop-blur-md px-4 py-3 shadow-[0_16px_40px_-12px_rgba(16,37,63,0.25)] w-[260px]"
            style={{
              left: flip ? screenX - 280 : screenX + 18,
              top: Math.max(6, Math.min(bbox.height - 220, screenY - 40)),
              animation: "city-card-in 160ms var(--ease-out-quart)",
            }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <div className="font-display text-[1.125rem] text-ink leading-tight truncate">
                  {c.name}
                </div>
                <div className="text-[0.6875rem] text-ink-muted mt-0.5">
                  {c.regionName} · Lvl {c.tier}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[0.8125rem] font-semibold text-primary">
                  {c.code}
                </span>
                <button
                  onClick={() => onClearSelection?.()}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-ink-2 hover:bg-surface-hover hover:text-ink"
                  aria-label="Clear origin"
                >
                  ×
                </button>
              </div>
            </div>

            {(() => {
              const evt = cityEventImpact(c.code, currentQuarter);
              return (
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[0.6875rem] py-2 border-y border-line">
                  <span className="text-ink-muted">Tourism</span>
                  <span className="tabular font-mono text-right text-ink">{c.tourism}/day</span>
                  <span className="text-ink-muted">Business</span>
                  <span className="tabular font-mono text-right text-ink">{c.business}/day</span>
                  <span className="text-ink-muted">Event</span>
                  <span
                    className={`tabular font-mono text-right ${evt.pct > 0 ? "text-positive" : evt.pct < 0 ? "text-negative" : "text-ink-muted"}`}
                    title={evt.items.map((x) => x.headline).join(" · ") || undefined}
                  >
                    {evt.pct === 0 ? "—" : `${evt.pct > 0 ? "+" : ""}${evt.pct}%`}
                  </span>
                  <span className="text-ink-muted">Annual growth</span>
                  <span className="tabular font-mono text-right text-ink">
                    T{c.tourismGrowth >= 0 ? "+" : ""}{c.tourismGrowth.toFixed(1)}% · B{c.businessGrowth >= 0 ? "+" : ""}{c.businessGrowth.toFixed(1)}%
                  </span>
                </div>
              );
            })()}

            {c.character && (
              <p className="text-[0.75rem] text-ink-2 italic leading-snug mt-2">
                {c.character}
              </p>
            )}

            <div className="mt-3 pt-2 border-t border-line flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[0.6875rem] font-medium text-accent">
                <span className="w-2 h-2 rounded-full bg-accent" />
                Origin selected
              </span>
              <span className="text-[0.6875rem] text-ink-muted">
                Click a destination city →
              </span>
            </div>
          </div>
        );
      })()}

      {/* Controls hint + legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-md border border-line bg-surface/90 backdrop-blur px-3 py-2 text-[0.75rem]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: team.color }} />
          <span className="text-ink font-medium">Hub</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm opacity-80" style={{ background: team.color }} />
          <span className="text-ink-2">Connected</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-ink-2 opacity-55" />
          <span className="text-ink-2">T1</span>
          <span className="w-2 h-2 rounded-full bg-ink-2 opacity-55 ml-1" />
          <span className="text-ink-2">T2</span>
          <span className="w-1.5 h-1.5 rounded-full bg-ink-2 opacity-55 ml-1" />
          <span className="text-ink-2">T3/T4</span>
        </span>
        <span className="hidden lg:inline text-ink-muted border-l border-line pl-3">
          Drag to rotate · scroll to zoom · double-click to reset
        </span>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1 rounded-md border border-line bg-surface/90 backdrop-blur p-1">
        <button
          onClick={() => setScale((s) => Math.min(MAX_SCALE, s * 1.25))}
          className="w-8 h-8 rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink flex items-center justify-center"
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={() => setScale((s) => Math.max(MIN_SCALE, s / 1.25))}
          className="w-8 h-8 rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink flex items-center justify-center"
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={resetView}
          className="w-8 h-8 rounded-md text-ink-2 hover:bg-surface-hover hover:text-ink flex items-center justify-center text-[0.75rem]"
          aria-label="Reset view"
          title="Reset view"
        >
          ⌂
        </button>
      </div>
    </div>
  );
}
