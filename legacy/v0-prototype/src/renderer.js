// ============================================================
// SkyHigh Executive — Globe Renderer  (3-D Edition)
// Draws an orthographic globe using D3 geo + HTML5 Canvas 2D.
// Countries sit at their real positions — zero distortion.
// Rotating to a destination is a smooth sphere animation.
// ============================================================
window.SkyHigh = window.SkyHigh || {};

window.SkyHigh.Renderer = (() => {
  'use strict';

  let canvas, ctx;
  let countryFeatures = [];   // [{iso, name, info, feature}]
  let animFrame  = null;
  let t          = 0;
  let homeCountryIso = null;

  // D3 geo objects (initialised in _initGlobe)
  let _proj    = null;   // d3.geoOrthographic instance
  let _path    = null;   // d3.geoPath(projection, ctx)
  let _graticule = null; // GeoJSON for lat/lon grid lines
  let _gratStep  = 30;   // current graticule step in degrees

  // FX state
  const floatingDeltas = [];
  let crisisMode = false, crisisIntensity = 0;

  // ── PUBLIC API ─────────────────────────────────────────────
  const API = {

    // ── INIT ──────────────────────────────────────────────────
    async init(canvasEl) {
      canvas = canvasEl;
      ctx    = canvas.getContext('2d');
      API.resize();
      window.addEventListener('resize', API.resize);

      _initGlobe();          // create D3 projection + path generator

      try {
        const resp = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const topo = await resp.json();
        _buildCountryFeatures(topo);
      } catch (e) {
        console.warn('[Globe] Could not load world atlas:', e);
      }

      API.startLoop();
    },

    // ── RESIZE ─────────────────────────────────────────────────
    resize() {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const W = canvas.width, H = canvas.height;
      const radius = Math.min(W, H) * 0.44;

      SkyHigh.MapEngine.setDimensions(W, H);
      SkyHigh.MapEngine.setBaseRadius(radius);

      if (_proj) {
        _proj.translate([W / 2, H / 2]).scale(radius);
        _bridgeToEngine();
      }
    },

    setHomeCountry(iso) {
      homeCountryIso = iso ? parseInt(iso) : null;
    },

    spawnDelta(amount, screenX, screenY) {
      floatingDeltas.push({
        amount, x: screenX, y: screenY,
        alpha: 1, life: 90,
        dy: -(1.2 + Math.random() * 0.8),
        positive: amount >= 0,
      });
    },

    setCrisisMode(active) {
      crisisMode = active;
      if (active) crisisIntensity = 0.01;
    },

    // ── START / STOP LOOP ──────────────────────────────────────
    startLoop() {
      let lastGratStep = -1;

      function loop() {
        const dirty = SkyHigh.MapEngine.tick();

        if (_proj) {
          const cam = SkyHigh.MapEngine.getCamera();
          const W = canvas.width, H = canvas.height;
          _proj.rotate(cam.rotation).scale(cam.scale).translate([W / 2, H / 2]);

          // Rebuild graticule if zoom level changed bucket
          const step = cam.zoom > 3 ? 10 : cam.zoom > 1.5 ? 20 : 30;
          if (step !== lastGratStep) {
            _graticule  = d3.geoGraticule().step([step, step])();
            lastGratStep = step;
          }
        }

        API.draw();
        t++;
        animFrame = requestAnimationFrame(loop);
      }
      loop();
    },

    stopLoop() {
      if (animFrame) cancelAnimationFrame(animFrame);
    },

    // ── COUNTRY HIT TEST (called from MapEngine via resolver) ─
    getCountryAtPoint(px, py) {
      if (!_proj || !countryFeatures.length) return null;
      const coords = _proj.invert([px, py]);
      if (!coords) return null;  // click outside globe circle
      const [lon, lat] = coords;
      // Back-hemisphere guard: lat/lon round-trips through invert are always "visible"
      // but geoContains handles occlusion correctly for orthographic.
      for (let i = countryFeatures.length - 1; i >= 0; i--) {
        const cf = countryFeatures[i];
        try {
          if (d3.geoContains(cf.feature, [lon, lat])) return cf;
        } catch (_) { /* malformed geometry */ }
      }
      return null;
    },

    // ── MAIN DRAW ──────────────────────────────────────────────
    draw() {
      if (!_proj || !_path) return;
      const W   = canvas.width, H = canvas.height;
      const T   = SkyHigh.TOKENS.color;
      const sel = SkyHigh.MapEngine.getSelection();
      const state = SkyHigh.CoreSim?.getState?.();
      const cam = SkyHigh.MapEngine.getCamera();

      ctx.clearRect(0, 0, W, H);

      // 1. Starfield background
      _drawBackground(W, H);

      // 2. Atmosphere halo (outside the globe)
      _drawAtmosphereHalo(cam.scale);

      // 3. Ocean sphere (base fill)
      _drawOceanSphere(cam.scale);

      // 4. Lat/lon graticule
      _drawGraticule();

      // 5. Country polygons
      _drawCountries(T, sel);

      // 6. NPC background traffic
      if (state) {
        _drawNpcRoutes(T);
        _drawRoutes(state, T);
      }

      // 7. Route selection helpers
      if (sel.originAirport && !sel.destAirport)
        _drawPulse(sel.originAirport, T.primary, t);
      if (sel.originAirport && sel.destAirport)
        _drawPendingArc(sel.originAirport, sel.destAirport, T);

      // 8. Airport markers
      _drawAirports(T, sel, state, cam.zoom);

      // 9. Globe limb / 3-D edge highlight
      _drawLimb(cam.scale);

      // 10. Crisis FX
      if (crisisMode) {
        crisisIntensity = Math.min(1, crisisIntensity + 0.02);
        _drawCrisisOverlay(W, H, T);
      } else {
        crisisIntensity = Math.max(0, crisisIntensity - 0.03);
        if (crisisIntensity > 0) _drawCrisisOverlay(W, H, T);
      }

      // 11. Floating cash deltas
      _drawFloatingDeltas(T);
    },
  };

  // ──────────────────────────────────────────────────────────
  //  PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────

  function _initGlobe() {
    if (!window.d3) { console.error('[Globe] D3 not loaded'); return; }
    const W = canvas.width, H = canvas.height;
    const radius = Math.min(W, H) * 0.44;

    _proj = d3.geoOrthographic()
      .scale(radius)
      .translate([W / 2, H / 2])
      .rotate([0, -20, 0])
      .clipAngle(90)
      .precision(0.5);

    _path = d3.geoPath().projection(_proj).context(ctx);

    _graticule = d3.geoGraticule().step([30, 30])();

    _bridgeToEngine();
  }

  // Wire D3 projection → MapEngine so it can answer project() calls
  function _bridgeToEngine() {
    const W = canvas.width, H = canvas.height;

    SkyHigh.MapEngine.setProjectionFn((lat, lon) => {
      const coords = _proj([lon, lat]);
      if (!coords) return { x: W / 2, y: H / 2, visible: false };
      return { x: coords[0], y: coords[1], visible: true };
    });

    SkyHigh.MapEngine.setInvertFn((px, py) => {
      const coords = _proj.invert([px, py]);
      if (!coords) return null;
      return { lon: coords[0], lat: coords[1] };
    });

    SkyHigh.MapEngine.setCountryResolver((px, py) => API.getCountryAtPoint(px, py));
  }

  function _buildCountryFeatures(topo) {
    if (!window.topojson) return;
    const collection = topojson.feature(topo, topo.objects.countries);
    countryFeatures = collection.features
      .filter(f => parseInt(f.id) !== 10)  // no Antarctica
      .map(feature => {
        const iso  = parseInt(feature.id);
        const info = SkyHigh.WORLD_COUNTRIES?.[iso] ||
                     { name: `Country #${iso}`, region: 'Unknown', risk: 'MEDIUM', tier: 'MEDIUM', emoji: '🌍' };
        return { iso, name: info.name, info, feature };
      });
  }

  // Generate N+1 great-circle interpolation points for a route line
  function _gcPoints(lon1, lat1, lon2, lat2, n) {
    const interp = d3.geoInterpolate([lon1, lat1], [lon2, lat2]);
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(interp(i / n));
    return pts;
  }

  // ── LAYER DRAWS ────────────────────────────────────────────

  function _drawBackground(W, H) {
    const grad = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H/2, Math.max(W,H) * 0.7);
    grad.addColorStop(0,   '#050A12');
    grad.addColorStop(0.6, '#03060D');
    grad.addColorStop(1,   '#010206');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Subtle star field
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    // Use a seeded pseudo-random so stars don't flicker
    const seeds = [
      [0.08,0.12],[0.22,0.05],[0.35,0.18],[0.48,0.03],[0.61,0.09],
      [0.74,0.15],[0.87,0.07],[0.93,0.20],[0.05,0.30],[0.17,0.40],
      [0.29,0.28],[0.42,0.38],[0.55,0.25],[0.68,0.35],[0.80,0.22],
      [0.91,0.32],[0.12,0.55],[0.25,0.62],[0.38,0.50],[0.51,0.60],
      [0.64,0.48],[0.77,0.58],[0.89,0.45],[0.03,0.70],[0.15,0.80],
      [0.28,0.68],[0.41,0.78],[0.54,0.65],[0.67,0.75],[0.79,0.62],
      [0.92,0.72],[0.08,0.88],[0.21,0.92],[0.34,0.85],[0.47,0.95],
      [0.60,0.82],[0.73,0.90],[0.86,0.83],[0.98,0.10],[0.10,0.48],
    ];
    seeds.forEach(([sx, sy]) => {
      const x = sx * W, y = sy * H;
      // Check outside globe
      const cx = W/2, cy = H/2, r = Math.min(W,H) * 0.44 + 12;
      if (Math.hypot(x-cx, y-cy) > r) {
        const sz = 0.6 + (sx * 3.7 % 1.0) * 1.2;
        ctx.beginPath();
        ctx.arc(x, y, sz, 0, Math.PI*2);
        ctx.fill();
      }
    });
  }

  function _drawAtmosphereHalo(radius) {
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;
    const inner = radius * 0.97;
    const outer = radius * 1.12;

    const grad = ctx.createRadialGradient(cx, cy, inner, cx, cy, outer);
    grad.addColorStop(0,    'rgba(60,140,255,0.28)');
    grad.addColorStop(0.35, 'rgba(40,100,220,0.14)');
    grad.addColorStop(0.70, 'rgba(20, 60,180,0.06)');
    grad.addColorStop(1,    'transparent');

    ctx.beginPath();
    ctx.arc(cx, cy, outer, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function _drawOceanSphere(radius) {
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;

    // Lit from upper-left: highlight offset
    const hx = cx - radius * 0.32;
    const hy = cy - radius * 0.32;

    const grad = ctx.createRadialGradient(hx, hy, 0, cx, cy, radius);
    grad.addColorStop(0,    '#1E3F60');
    grad.addColorStop(0.25, '#122A45');
    grad.addColorStop(0.55, '#0C1E35');
    grad.addColorStop(0.80, '#091628');
    grad.addColorStop(1,    '#060F1E');

    ctx.save();
    ctx.beginPath();
    _path({ type: 'Sphere' });
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  function _drawGraticule() {
    if (!_graticule) return;
    ctx.save();
    ctx.beginPath();
    _path(_graticule);
    ctx.strokeStyle = 'rgba(255,255,255,0.045)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Equator slightly brighter
    const eqPts = [];
    for (let lon = -180; lon <= 180; lon += 3) eqPts.push([lon, 0]);
    ctx.beginPath();
    _path({ type: 'LineString', coordinates: eqPts });
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  function _drawCountries(T, sel) {
    const selectedIso = sel.selectedCountry?.iso || null;
    const hoveredIso  = sel.hoveredCountry?.iso  || null;
    const accent      = T.accent   || '#E8920A';   // amber
    const primary     = T.primary  || '#1A5FAE';   // blue

    ctx.save();

    // First pass: fill + stroke all countries
    countryFeatures.forEach(cf => {
      const isHome     = cf.iso === homeCountryIso;
      const isSelected = cf.iso === selectedIso;
      const isHovered  = cf.iso === hoveredIso;

      // Fill: use token colors, accent tint for interactive states
      let fill = T.mapLand || '#DDE8D4';
      if (isHome)     fill = T.mapLandHover  || '#C8DBC0';
      if (isHovered)  fill = T.mapLandSelect || '#B8CEB0';
      if (isSelected) fill = T.mapLandSelect || '#B8CEB0';

      ctx.beginPath();
      _path(cf.feature);
      ctx.fillStyle = fill;
      ctx.fill();

      ctx.strokeStyle = isSelected ? accent :
                        isHovered  ? `${accent}99` :
                        isHome     ? `${accent}55` :
                        T.mapBorder || 'rgba(80,130,100,0.30)';
      ctx.lineWidth = isSelected || isHovered ? 1.4 : 0.4;
      ctx.stroke();
    });

    // Second pass: glowing primary-coloured outline on selected country
    if (selectedIso) {
      const cf = countryFeatures.find(c => c.iso === selectedIso);
      if (cf) {
        ctx.beginPath();
        _path(cf.feature);
        ctx.strokeStyle = primary;
        ctx.lineWidth   = 2.5;
        ctx.shadowColor = primary;
        ctx.shadowBlur  = 16;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    }

    ctx.restore();
  }

  function _drawNpcRoutes(T) {
    if (!SkyHigh.MAP_DATA?.npcRoutes) return;
    ctx.save();

    SkyHigh.MAP_DATA.npcRoutes.forEach(([oId, dId], idx) => {
      const o = SkyHigh.GeoUtils.getAirport(oId);
      const d = SkyHigh.GeoUtils.getAirport(dId);
      if (!o || !d) return;

      const line = { type: 'LineString', coordinates: _gcPoints(o.lon, o.lat, d.lon, d.lat, 32) };

      ctx.beginPath();
      _path(line);
      ctx.strokeStyle = 'rgba(58,90,106,0.30)';
      ctx.lineWidth   = 0.9;
      ctx.setLineDash([]);
      ctx.stroke();

      // Animated dot
      const tt   = ((t * 0.15 + idx * 19) % 100) / 100;
      const interp = d3.geoInterpolate([o.lon, o.lat], [d.lon, d.lat]);
      const pt     = interp(tt);
      const pos    = _proj(pt);
      if (pos) {
        ctx.beginPath();
        ctx.arc(pos[0], pos[1], 1.4, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(70,120,155,0.55)';
        ctx.fill();
      }
    });

    ctx.restore();
  }

  function _drawRoutes(state, T) {
    if (!state?.routes) return;
    ctx.save();

    state.routes.forEach(route => {
      const o = SkyHigh.GeoUtils.getAirport(route.originId);
      const d = SkyHigh.GeoUtils.getAirport(route.destId);
      if (!o || !d) return;

      const profitable = route.lastProfit > 0;
      const loss       = route.lastProfit < 0;
      const tt         = ((t * 0.5) % 100) / 100;
      const line       = { type: 'LineString', coordinates: _gcPoints(o.lon, o.lat, d.lon, d.lat, 64) };

      // Wide glow
      ctx.beginPath();
      _path(line);
      ctx.strokeStyle = profitable ? 'rgba(200,147,58,0.20)' :
                        loss       ? 'rgba(231,76,60,0.14)'  : 'rgba(90,84,72,0.18)';
      ctx.lineWidth = 7;
      if (profitable) { ctx.shadowColor = T.primary; ctx.shadowBlur = 14; }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Core line
      ctx.beginPath();
      _path(line);
      ctx.strokeStyle = profitable ? T.primary   :
                        loss       ? T.routeLoss : T.routeIdle;
      ctx.lineWidth   = profitable ? 2.5 : 1.5;
      ctx.setLineDash([]);
      ctx.stroke();

      // Moving dot (only on profitable / loss routes)
      if (profitable || loss) {
        const interp = d3.geoInterpolate([o.lon, o.lat], [d.lon, d.lat]);
        const pos    = _proj(interp(tt));
        if (pos) {
          ctx.beginPath();
          ctx.arc(pos[0], pos[1], profitable ? 3.5 : 2, 0, Math.PI*2);
          ctx.fillStyle   = profitable ? T.accent   : T.routeLoss;
          ctx.shadowColor = profitable ? T.accent   : T.routeLoss;
          ctx.shadowBlur  = profitable ? 10 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });

    ctx.setLineDash([]);
    ctx.restore();
  }

  function _drawPendingArc(origin, dest, T) {
    const dashOffset = -(t * 0.5) % 20;
    const line = {
      type: 'LineString',
      coordinates: _gcPoints(origin.lon, origin.lat, dest.lon, dest.lat, 64),
    };

    ctx.save();
    ctx.beginPath();
    _path(line);
    ctx.strokeStyle    = T.primary;
    ctx.lineWidth      = 2;
    ctx.setLineDash([8, 6]);
    ctx.lineDashOffset = dashOffset;
    ctx.shadowColor    = T.primary;
    ctx.shadowBlur     = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);
    ctx.restore();

    _drawPulse(origin, T.primary, t);
    _drawPulse(dest,   T.accent,  t + 20);
  }

  function _drawPulse(airport, color, clock) {
    const pos   = _proj([airport.lon, airport.lat]);
    if (!pos) return;
    const pulse = (Math.sin(clock * 0.08) + 1) / 2;
    const r     = 8 + pulse * 8;
    const hex   = Math.round((0.6 - pulse * 0.4) * 255).toString(16).padStart(2, '0');
    ctx.save();
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], r, 0, Math.PI*2);
    ctx.strokeStyle = color + hex;
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
  }

  function _drawAirports(T, sel, state, zoom) {
    ctx.save();

    SkyHigh.MAP_DATA.airports.forEach(airport => {
      if (zoom < 1.2 && airport.hubLevel < 4) return;
      if (zoom < 2   && airport.hubLevel < 3) return;

      const pos = _proj([airport.lon, airport.lat]);
      if (!pos) return;  // behind globe

      const [sx, sy] = pos;
      if (sx < -30 || sx > canvas.width + 30 || sy < -30 || sy > canvas.height + 30) return;

      const size = SkyHigh.MapEngine.markerSize(airport.hubLevel);

      const isOrigin = sel.originAirport?.id === airport.id;
      const isDest   = sel.destAirport?.id   === airport.id;
      const isHover  = sel.hoveredAirport?.id === airport.id;
      const hasRoute = state?.routes?.some(r => r.originId === airport.id || r.destId === airport.id);
      const isHub    = state?.hubAirportId === airport.id;

      const markerColor = isOrigin ? T.primary  :
                          isDest   ? T.accent   :
                          isHub    ? T.accent   :
                          hasRoute ? T.success  :
                          isHover  ? T.textPrimary : '#6A8A7A';

      // Soft halo for key airports
      if (isHover || isOrigin || isDest || isHub) {
        ctx.beginPath();
        ctx.arc(sx, sy, size + 6, 0, Math.PI*2);
        ctx.fillStyle = (isOrigin || isHub) ? T.primaryGlow : T.accentSoft;
        ctx.fill();
      }

      // Marker shape
      if (airport.hubLevel >= 4) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(Math.PI / 4);
        if (isHub) { ctx.shadowColor = T.accent; ctx.shadowBlur = 12; }
        ctx.fillStyle = markerColor;
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.shadowBlur = 0;
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI*2);
        ctx.fillStyle = markerColor;
        ctx.fill();
      }

      // Ring for mega-hubs
      if (airport.hubLevel === 5) {
        ctx.beginPath();
        ctx.arc(sx, sy, size + 3, 0, Math.PI*2);
        ctx.strokeStyle = markerColor + '80';
        ctx.lineWidth   = 1.5;
        ctx.stroke();
      }

      // Labels
      if (zoom >= 2.5 || (zoom >= 1.5 && airport.hubLevel >= 4)) {
        ctx.fillStyle  = T.textPrimary;
        ctx.font       = `bold ${Math.round(9 + zoom * 1.5)}px ${SkyHigh.TOKENS.font.data}`;
        ctx.textAlign  = 'center';
        ctx.fillText(airport.id, sx, sy - size - 5);
      } else if (zoom >= 1.0 && airport.hubLevel === 5) {
        ctx.fillStyle  = T.textPrimary + 'AA';
        ctx.font       = `9px ${SkyHigh.TOKENS.font.data}`;
        ctx.textAlign  = 'center';
        ctx.fillText(airport.id, sx, sy - size - 4);
      }

      // Route count badge
      if (hasRoute && zoom >= 1.5) {
        const routeCount = state?.routes?.filter(r => r.originId === airport.id || r.destId === airport.id).length || 0;
        if (routeCount > 0) {
          const bx = sx + size + 2, by = sy - size - 2, br = 6;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI*2);
          ctx.fillStyle = 'rgba(46,204,113,0.90)';
          ctx.fill();
          ctx.fillStyle = '#08080F';
          ctx.font      = `bold 7px ${SkyHigh.TOKENS.font.data}`;
          ctx.textAlign = 'center';
          ctx.fillText(String(routeCount), bx, by + 2.5);
        }
      }
    });

    ctx.restore();
  }

  // 3-D "limb" — the bright highlight + dark rim that makes it look spherical
  function _drawLimb(radius) {
    const W = canvas.width, H = canvas.height;
    const cx = W/2, cy = H/2;

    // Specular highlight (upper-left quadrant)
    const spec = ctx.createRadialGradient(
      cx - radius * 0.38, cy - radius * 0.38, 0,
      cx - radius * 0.20, cy - radius * 0.20, radius * 0.85,
    );
    spec.addColorStop(0,    'rgba(255,255,255,0.055)');
    spec.addColorStop(0.4,  'rgba(255,255,255,0.015)');
    spec.addColorStop(1,    'transparent');
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.fillStyle = spec;
    ctx.fill();

    // Dark rim (terminator shadow on opposite side)
    const rim = ctx.createRadialGradient(cx, cy, radius * 0.84, cx, cy, radius * 1.01);
    rim.addColorStop(0,    'transparent');
    rim.addColorStop(0.55, 'rgba(8,16,30,0.18)');
    rim.addColorStop(0.85, 'rgba(4, 10,22,0.50)');
    rim.addColorStop(1,    'rgba(2,  6,16,0.72)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.01, 0, Math.PI*2);
    ctx.fillStyle = rim;
    ctx.fill();

    // Blue atmosphere ring on the edge
    const atm = ctx.createRadialGradient(cx, cy, radius * 0.92, cx, cy, radius * 1.025);
    atm.addColorStop(0,   'transparent');
    atm.addColorStop(0.5, 'rgba(50,120,220,0.12)');
    atm.addColorStop(1,   'rgba(30, 80,180,0.24)');
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.025, 0, Math.PI*2);
    ctx.fillStyle = atm;
    ctx.fill();

    // Clean circle outline
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(70,130,220,0.28)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  function _drawCrisisOverlay(W, H, T) {
    const pulse  = (Math.sin(t * 0.05) + 1) / 2;
    const grad   = ctx.createRadialGradient(W/2, H/2, H*0.3, W/2, H/2, Math.max(W,H)*0.8);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, `rgba(192,57,43,${crisisIntensity * 0.35 + pulse * 0.1})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const edgeW = 8 + pulse * 6;
    ctx.strokeStyle = `rgba(231,76,60,${crisisIntensity * 0.7 + pulse * 0.2})`;
    ctx.lineWidth   = edgeW;
    ctx.strokeRect(edgeW/2, edgeW/2, W - edgeW, H - edgeW);

    if (crisisIntensity > 0.5) {
      const alpha = Math.min(1, (crisisIntensity - 0.5) * 2);
      ctx.fillStyle  = `rgba(231,76,60,${alpha * 0.15})`;
      ctx.font       = `bold 120px ${SkyHigh.TOKENS.font.display}`;
      ctx.textAlign  = 'center';
      ctx.fillText('CRISIS', W/2, H/2 + 60);
    }
  }

  function _drawFloatingDeltas(T) {
    for (let i = floatingDeltas.length - 1; i >= 0; i--) {
      const d = floatingDeltas[i];
      d.y   += d.dy;
      d.life--;
      d.alpha = d.life / 90;
      if (d.life <= 0) { floatingDeltas.splice(i, 1); continue; }

      const color  = d.positive ? T.success : T.danger;
      const prefix = d.positive ? '+' : '';
      const text   = `${prefix}$${Math.abs(d.amount) >= 1e6
        ? (d.amount / 1e6).toFixed(1) + 'M'
        : Math.abs(d.amount).toLocaleString()}`;

      ctx.save();
      ctx.globalAlpha  = d.alpha;
      ctx.font         = `bold 16px ${SkyHigh.TOKENS.font.data}`;
      ctx.fillStyle    = color;
      ctx.textAlign    = 'center';
      ctx.shadowColor  = color;
      ctx.shadowBlur   = 8;
      ctx.fillText(text, d.x, d.y);
      ctx.shadowBlur   = 0;
      ctx.restore();
    }
  }

  return API;
})();
