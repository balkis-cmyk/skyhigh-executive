// ============================================================
// SkyHigh Executive — Map Engine  (Globe Edition)
// Globe camera state, geo transforms, hit-testing, interaction.
// UI-agnostic: no DOM access. Works with any renderer.
// ============================================================
window.SkyHigh = window.SkyHigh || {};

window.SkyHigh.MapEngine = (() => {
  'use strict';

  // ── GLOBE CAMERA ────────────────────────────────────────────
  // rotation: D3-style [λ, φ, γ]  (longitude offset, -latitude tilt, roll)
  // scale: globe radius in pixels (= "zoom level")
  let _baseRadius = 0;   // set properly on first setDimensions call

  const camera = {
    rotation:       [0, -20, 0],      // current rendered rotation
    targetRotation: [0, -20, 0],      // lerp destination
    scale:          0,                // set on first setDimensions
    targetScale:    0,                // set on first setDimensions
    animating:      false,
  };

  // ── SELECTION STATE ────────────────────────────────────────
  const selection = {
    hoveredAirport:  null,
    hoveredCountry:  null,
    selectedCountry: null,
    originAirport:   null,
    destAirport:     null,
  };

  // ── CANVAS SIZE ────────────────────────────────────────────
  let canvasW = 1200, canvasH = 680;

  // ── PROJECTION BRIDGE ──────────────────────────────────────
  // Renderer sets these after it creates the D3 projection
  let _projectionFn = null;   // (lat, lon) → {x, y, visible}
  let _invertFn     = null;   // (px, py)   → {lat, lon} | null
  let _onSelect     = null;
  let _countryResolver = null;

  // ── LERP HELPERS ───────────────────────────────────────────
  const LERP_SPEED = 0.10;

  function _shortAngle(diff) {
    while (diff >  180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  // ── PUBLIC API ─────────────────────────────────────────────
  const API = {

    // ── SETUP ───────────────────────────────────────────────
    setDimensions(w, h) {
      canvasW = w; canvasH = h;
      const newRadius = Math.min(w, h) * 0.44;
      if (_baseRadius === 0) {
        // First call — initialise everything from actual canvas size
        _baseRadius        = newRadius;
        camera.scale       = newRadius;
        camera.targetScale = newRadius;
      } else if (newRadius > 0) {
        // Subsequent resize — preserve zoom ratio
        const ratio        = camera.scale / _baseRadius;
        const targetRatio  = camera.targetScale / _baseRadius;
        _baseRadius        = newRadius;
        camera.scale       = newRadius * ratio;
        camera.targetScale = newRadius * targetRatio;
      }
    },

    setBaseRadius(r) {
      _baseRadius = r;
    },

    // Called by Renderer to bridge D3 projection math here
    setProjectionFn(fn)  { _projectionFn  = fn; },
    setInvertFn(fn)      { _invertFn      = fn; },

    onSelect(fn)              { _onSelect        = fn; },
    setCountryResolver(fn)    { _countryResolver = fn; },

    // ── CAMERA ACCESSORS ─────────────────────────────────────
    getCamera() {
      return {
        rotation:  [...camera.rotation],
        scale:     camera.scale,
        zoom:      _baseRadius > 0 ? camera.scale / _baseRadius : 1,   // 1.0 = default view
        animating: camera.animating,
        // Compatibility shims for any legacy code still reading mercator fields
        x: 0.5, y: 0.4,
      };
    },

    getSelection() { return { ...selection }; },

    getZoomLevel() {
      const z = camera.scale / _baseRadius;
      if (z < 1.5) return 'L1';
      if (z < 2.5) return 'L2';
      return 'L3';
    },

    // ── PROJECTION ──────────────────────────────────────────
    // Convert lat/lon → canvas pixel {x, y, visible}
    project(lat, lon) {
      if (!_projectionFn) return { x: canvasW / 2, y: canvasH / 2, visible: false };
      return _projectionFn(lat, lon);
    },

    // Convert canvas pixel → {lat, lon} | null
    unproject(px, py) {
      if (!_invertFn) return null;
      return _invertFn(px, py);
    },

    // Marker size  (same logic as before; zoom now = scale/baseRadius)
    markerSize(hubLevel) {
      const base = 3 + hubLevel * 1.2;
      const zoom = _baseRadius > 0 ? camera.scale / _baseRadius : 1;
      if (zoom < 1.5) return base * 0.8;
      if (zoom < 3)   return base * 1.2;
      return base * 1.8;
    },

    // ── TICK (call every frame) ─────────────────────────────
    tick() {
      let dirty = false;

      // Lerp rotation (handle wraparound per axis)
      for (let i = 0; i < 3; i++) {
        const diff = _shortAngle(camera.targetRotation[i] - camera.rotation[i]);
        if (Math.abs(diff) > 0.005) {
          camera.rotation[i] += diff * LERP_SPEED;
          dirty = true;
        } else {
          camera.rotation[i] = camera.targetRotation[i];
        }
      }

      // Lerp scale
      const scaleDiff = camera.targetScale - camera.scale;
      if (Math.abs(scaleDiff) > 0.05) {
        camera.scale += scaleDiff * LERP_SPEED;
        dirty = true;
      } else {
        camera.scale = camera.targetScale;
        if (camera.animating) camera.animating = false;
      }

      return dirty;
    },

    // ── GLOBE DRAG (replaces flat-map pan) ──────────────────
    // dx, dy are screen-pixel deltas from drag
    pan(dx, dy) {
      // Map pixel drag → degree rotation
      // Moving cursor across half the globe diameter = 90° rotation
      const sens = 90 / camera.scale;
      camera.rotation[0]  = (camera.rotation[0] + dx * sens);
      camera.rotation[1]  = Math.max(-80, Math.min(80, camera.rotation[1] - dy * sens));
      // Snap target to current so no lag during drag
      camera.targetRotation[0] = camera.rotation[0];
      camera.targetRotation[1] = camera.rotation[1];
    },

    // ── ZOOM ────────────────────────────────────────────────
    zoomAt(factor, cx, cy) {
      const newScale = Math.max(_baseRadius * 0.65, Math.min(_baseRadius * 6, camera.targetScale * factor));
      camera.targetScale = newScale;
    },

    // ── FLY TO ─────────────────────────────────────────────
    // Called from destination picker — rotates globe to face lat/lon.
    // zoomHint uses the same scale as the old Mercator renderer (1.0 = global,
    // 4.0 = country close-up).  We map that to a globe-scale multiplier.
    flyTo(lat, lon, zoomHint) {
      // Rotate so that (lat, lon) faces the viewer
      camera.targetRotation = [-lon, -lat, 0];
      // Mapping: global view (1.1) → 1.25×radius, close-up (3.8) → 2.5×radius
      const mult = zoomHint ? Math.min(3.8, Math.max(1.0, 0.80 + zoomHint * 0.45)) : 1.8;
      camera.targetScale = _baseRadius * mult;
      camera.animating   = true;
    },

    resetView() {
      camera.targetRotation = [0, -20, 0];
      camera.targetScale    = _baseRadius;
      camera.animating      = true;
    },

    // ── HIT TESTING ────────────────────────────────────────
    getAirportAt(px, py, hitRadius) {
      const radius = hitRadius ?? Math.max(14, 20 / (camera.scale / _baseRadius));
      let nearest = null, minDist = Infinity;
      const zoom = camera.scale / _baseRadius;

      SkyHigh.MAP_DATA.airports.forEach(airport => {
        if (zoom < 1.5 && airport.hubLevel < 3) return;
        if (zoom < 2.5 && airport.hubLevel < 2) return;

        const pos = API.project(airport.lat, airport.lon);
        if (!pos.visible) return;          // behind the globe
        const dist = Math.hypot(pos.x - px, pos.y - py);
        if (dist < radius && dist < minDist) {
          minDist = dist;
          nearest = airport;
        }
      });

      return nearest;
    },

    getCountryAt(px, py) {
      if (!_countryResolver) return null;
      const cf = _countryResolver(px, py);
      if (!cf) return null;
      return { iso: cf.iso, ...cf.info };
    },

    _countryFromAirport(airport) {
      if (!airport?.countryIso) return null;
      const iso  = airport.countryIso;
      const info = SkyHigh.WORLD_COUNTRIES?.[iso] ||
                   { name: `Country #${iso}`, region: 'Unknown', risk: 'MEDIUM', tier: 'MEDIUM', emoji: '🌍' };
      return { iso, ...info };
    },

    // ── INTERACTION HANDLERS ───────────────────────────────
    handlePointerMove(px, py) {
      const airport = API.getAirportAt(px, py);
      const country = airport ? API._countryFromAirport(airport) : API.getCountryAt(px, py);

      let changed = false;
      if (airport?.id !== selection.hoveredAirport?.id) {
        selection.hoveredAirport = airport || null;
        changed = true;
      }
      if (country?.iso !== selection.hoveredCountry?.iso) {
        selection.hoveredCountry = country || null;
        changed = true;
      }
      return changed;
    },

    handleClick(px, py) {
      const airport = API.getAirportAt(px, py);
      if (airport) {
        if (_onSelect) _onSelect('AIRPORT', airport);
        return { type: 'AIRPORT', data: airport };
      }

      const country = API.getCountryAt(px, py);
      if (country) {
        if (_onSelect) _onSelect('COUNTRY', { ...country, clickPx: px, clickPy: py });
        return { type: 'COUNTRY', data: country };
      }

      selection.selectedCountry = null;
      if (_onSelect) _onSelect('DESELECT', null);
      return { type: 'DESELECT' };
    },

    // ── DESTINATION PICKER GLOW ─────────────────────────────
    highlightCountry(iso) {
      selection.selectedCountry = (iso != null) ? { iso } : null;
    },

    clearHighlight() {
      selection.selectedCountry = null;
    },

    // ── ROUTE SELECTION FLOW ───────────────────────────────
    setOriginAirport(airportId) {
      const airport = SkyHigh.GeoUtils.getAirport(airportId);
      if (!airport) return false;
      selection.originAirport = airport;
      selection.destAirport   = null;
      return true;
    },

    setDestAirport(airportId) {
      const airport = SkyHigh.GeoUtils.getAirport(airportId);
      if (!airport) return false;
      if (selection.originAirport?.id === airportId) return false;
      selection.destAirport = airport;
      return true;
    },

    clearRoute() {
      selection.originAirport = null;
      selection.destAirport   = null;
    },

    hasPendingRoute() {
      return !!(selection.originAirport && selection.destAirport);
    },

    // ── LEGACY ARC GEOMETRY (kept for compatibility) ────────
    // New renderer uses D3 geoPath + geoInterpolate directly.
    getArcPoints(lat1, lon1, lat2, lon2) {
      const p1 = API.project(lat1, lon1);
      const p2 = API.project(lat2, lon2);
      const pm = API.project((lat1 + lat2) / 2, (lon1 + lon2) / 2);
      return { p1, p2, cp: pm };
    },

    // ── REGION BOUNDS (crisis overlay) ────────────────────
    getRegionBounds(regionName) {
      const airports = SkyHigh.MAP_DATA.airports.filter(a => {
        const info = SkyHigh.WORLD_COUNTRIES?.[a.countryIso];
        return info && info.region.includes(regionName);
      });
      if (!airports.length) return null;

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      airports.forEach(a => {
        const pos = API.project(a.lat, a.lon);
        if (!pos.visible) return;
        minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x); maxY = Math.max(maxY, pos.y);
      });
      if (minX === Infinity) return null;
      return { x: minX - 20, y: minY - 20, w: maxX - minX + 40, h: maxY - minY + 40 };
    },

    // Legacy shim: old code called degreeToPixels() in a few places
    degreeToPixels() {
      return (camera.scale * Math.PI) / 180;
    },
  };

  return API;
})();
