import { useEffect, useRef, useState, useCallback } from "react";

const MAPILLARY_TOKEN =
  "MLY|35215931484717139|54aed95a3cc2fa8e945efe0fabe59287";
const STORAGE_KEY = "smart_poles_data";

const L_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const L_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const MLY_CSS = "https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.css";
const MLY_JS = "https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

function loadLink(href) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    document.head.appendChild(l);
  }
}

async function geocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "az,en" } },
    );
    const d = await r.json();
    return d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

async function findNearbyImage(lat, lng) {
  try {
    const r = await fetch(
      `https://graph.mapillary.com/images?access_token=${MAPILLARY_TOKEN}&fields=id,geometry` +
        `&bbox=${lng - 0.001},${lat - 0.001},${lng + 0.001},${lat + 0.001}&limit=1`,
    );
    const d = await r.json();
    if (d.data?.length > 0) return d.data[0];
    const r2 = await fetch(
      `https://graph.mapillary.com/images?access_token=${MAPILLARY_TOKEN}&fields=id,geometry` +
        `&bbox=${lng - 0.003},${lat - 0.003},${lng + 0.003},${lat + 0.003}&limit=1`,
    );
    const d2 = await r2.json();
    return d2.data?.[0] || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// localStorage helpers
// ─────────────────────────────────────────────
function persistLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { poles: d.poles || [], report: d.report || [] };
    }
  } catch {}
  return { poles: [], report: [] };
}

function persistSave(poles, report) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ poles, report }));
  } catch {}
}

// ─────────────────────────────────────────────
// Styles (injected once)
// ─────────────────────────────────────────────
const CSS = `
  .sp-root { display:flex; flex-direction:column; height:100vh; font-family:system-ui,sans-serif; background:#f8fafc; }

  /* HEADER */
  .sp-header {
    display:flex; align-items:center; gap:14px;
    padding:0 20px; height:56px;
    background:#fff; border-bottom:1px solid #e2e8f0;
    flex-shrink:0; z-index:10;
  }
  .sp-hbrand { display:flex; align-items:center; gap:10px; }
  .sp-hlogo {
    width:34px; height:34px; border-radius:10px;
    background:linear-gradient(145deg,#1e293b,#334155);
    display:flex; align-items:center; justify-content:center;
  }
  .sp-htitle { font-size:15px; font-weight:700; color:#0f172a; letter-spacing:-.3px; }
  .sp-hbadge {
    font-size:11px; padding:2px 9px; border-radius:20px;
    background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0;
  }
  .sp-hcenter { flex:1; display:flex; justify-content:center; }
  .sp-hhint { font-size:12.5px; color:#94a3b8; display:flex; align-items:center; gap:6px; }
  .sp-hhint-dot { width:6px; height:6px; border-radius:50%; background:#38bdf8; flex-shrink:0; }
  .sp-hselected { font-size:12.5px; color:#22c55e; display:flex; align-items:center; gap:6px; font-weight:500; }
  .sp-hselected-dot { width:7px; height:7px; border-radius:50%; background:#22c55e; animation:sp-pulse .8s ease-in-out infinite alternate; }
  .sp-hgeocoding { font-size:12.5px; color:#64748b; display:flex; align-items:center; gap:8px; }
  .sp-hdragging { font-size:12.5px; color:#f59e0b; font-weight:500; }
  .sp-hright { display:flex; align-items:center; gap:12px; }
  .sp-hstats { display:flex; align-items:center; gap:10px; }
  .sp-hstat { display:flex; flex-direction:column; align-items:center; }
  .sp-hstat-n { font-size:16px; font-weight:700; color:#0f172a; line-height:1; }
  .sp-hstat-l { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:.5px; }
  .sp-hstat-div { width:1px; height:28px; background:#e2e8f0; }
  .sp-saved-ind {
    font-size:11px; color:#22c55e; display:flex; align-items:center; gap:4px;
    opacity:0; transition:opacity .3s;
  }
  .sp-saved-ind.visible { opacity:1; }
  .sp-clear-btn {
    font-size:12px; padding:5px 12px; border-radius:8px;
    border:1px solid #fca5a5; color:#ef4444; background:transparent; cursor:pointer;
    transition:background .15s;
  }
  .sp-clear-btn:hover { background:#fef2f2; }

  /* BODY */
  .sp-body { display:flex; flex:1; overflow:hidden; }

  /* MAP */
  .sp-map-col { position:relative; flex:0 0 62%; }
  .sp-map { width:100%; height:100%; }
  .sp-map-hint {
    position:absolute; bottom:16px; left:50%; transform:translateX(-50%);
    background:rgba(255,255,255,.9); backdrop-filter:blur(8px);
    border:1px solid #e2e8f0; border-radius:20px;
    padding:6px 14px; font-size:12px; color:#475569;
    pointer-events:none; display:flex; align-items:center; gap:5px;
    box-shadow:0 2px 8px rgba(0,0,0,.08);
  }
  .sp-drag-overlay {
    position:absolute; inset:0; background:rgba(56,189,248,.08);
    display:flex; align-items:center; justify-content:center; pointer-events:none;
  }
  .sp-drag-card {
    background:rgba(255,255,255,.95); border:2px dashed #38bdf8;
    border-radius:16px; padding:16px 28px; font-size:14px; color:#0369a1;
    font-weight:600; display:flex; align-items:center; gap:10px;
  }
  .sp-drag-pulse {
    width:10px; height:10px; border-radius:50%; background:#38bdf8;
    animation:sp-pulse .6s ease-in-out infinite alternate;
  }
  .sp-geocoding-bar {
    position:absolute; top:12px; left:50%; transform:translateX(-50%); z-index:1000;
    background:#fff; border:1px solid #e2e8f0; border-radius:20px;
    padding:6px 14px; font-size:12px; color:#64748b;
    display:flex; align-items:center; gap:8px;
    box-shadow:0 2px 8px rgba(0,0,0,.1);
  }

  /* PANEL */
  .sp-panel {
    display:flex; flex-direction:column; flex:1;
    background:#fff; border-left:1px solid #e2e8f0; overflow:hidden;
  }

  /* SV SECTION */
  .sp-sv-section { flex:1; display:flex; flex-direction:column; overflow:hidden; border-bottom:1px solid #e2e8f0; }

  .sp-sv-placeholder {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:100%; gap:10px; padding:24px; color:#94a3b8;
  }
  .sp-sv-placeholder-icon {
    width:52px; height:52px; border-radius:16px; background:#f8fafc;
    border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center;
  }
  .sp-sv-placeholder-text { font-size:13px; color:#64748b; text-align:center; line-height:1.6; }
  .sp-sv-placeholder-sub { font-size:11px; color:#94a3b8; }

  .sp-sv-header {
    display:flex; align-items:flex-start; justify-content:space-between;
    padding:12px 14px 10px; border-bottom:1px solid #f1f5f9; flex-shrink:0;
  }
  .sp-sv-header-info { flex:1; min-width:0; }
  .sp-sv-badge {
    font-size:10px; font-weight:600; padding:2px 8px; border-radius:20px; letter-spacing:.3px;
    background:#dbeafe; color:#1d4ed8; display:inline-block; margin-bottom:4px;
  }
  .sp-sv-badge.no-img { background:#fef9c3; color:#854d0e; }
  .sp-sv-address { font-size:12px; color:#475569; line-height:1.4; padding-right:8px; }
  .sp-sv-coord { font-size:11px; color:#94a3b8; margin-top:2px; font-family:monospace; }
  .sp-sv-coord-live { color:#22c55e; font-weight:600; }
  .sp-coord-pulse { animation:sp-pulse .8s ease-in-out infinite alternate; }
  .sp-sv-close-btn {
    width:26px; height:26px; border-radius:7px; border:1px solid #e2e8f0;
    background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:#64748b; flex-shrink:0; transition:background .15s;
  }
  .sp-sv-close-btn:hover { background:#f8fafc; }

  .sp-sv-body { flex:1; position:relative; overflow:hidden; }
  .sp-mly-viewer { width:100%; height:100%; }

  .sp-viewer-click-hint {
    position:absolute; bottom:52px; left:0; right:0; text-align:center;
    pointer-events:none;
  }
  .sp-viewer-click-hint span {
    font-size:11px; padding:5px 12px; border-radius:20px;
    background:rgba(15,23,42,.65); color:#fff;
    display:inline-flex; align-items:center; gap:5px;
  }
  .sp-selected-coord-badge {
    position:absolute; bottom:52px; left:50%; transform:translateX(-50%);
    background:rgba(15,23,42,.7); color:#fff; border-radius:20px;
    padding:4px 12px; font-size:11px; font-family:monospace;
    display:flex; align-items:center; gap:6px; pointer-events:none;
  }
  .sp-selected-dot { width:6px; height:6px; border-radius:50%; background:#4ade80; animation:sp-pulse .8s ease-in-out infinite alternate; }

  .sp-sv-footer-overlay { position:absolute; bottom:0; left:0; right:0; padding:8px 10px; }
  .sp-add-btn {
    width:100%; padding:9px 14px; border-radius:10px;
    border:1px solid #e2e8f0; background:#f8fafc;
    color:#334155; font-size:13px; cursor:pointer;
    display:flex; align-items:center; justify-content:center; gap:7px;
    transition:all .18s; font-weight:500;
  }
  .sp-add-btn:hover { background:#f1f5f9; }
  .sp-add-btn.ready {
    background:#dcfce7; border-color:#86efac; color:#15803d;
  }
  .sp-add-btn.ready:hover { background:#d1fae5; }
  .sp-added-success {
    width:100%; padding:9px; border-radius:10px; background:#dcfce7;
    color:#15803d; font-size:13px; font-weight:600;
    display:flex; align-items:center; justify-content:center; gap:7px;
  }

  .sp-no-image-box {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:100%; gap:10px; padding:24px; color:#94a3b8;
  }
  .sp-no-image-box p { font-size:13px; color:#64748b; text-align:center; }
  .sp-no-image-sub { font-size:11px; color:#94a3b8; }
  .sp-add-btn-ghost {
    font-size:12px; padding:7px 16px; border-radius:8px;
    border:1px solid #e2e8f0; background:#fff; color:#64748b; cursor:pointer;
    display:flex; align-items:center; gap:6px; margin-top:4px;
    transition:background .15s;
  }
  .sp-add-btn-ghost:hover { background:#f8fafc; }

  /* REPORT */
  .sp-report-section { flex:0 0 220px; display:flex; flex-direction:column; overflow:hidden; }
  .sp-report-top {
    display:flex; align-items:center; justify-content:space-between;
    padding:10px 14px; border-bottom:1px solid #f1f5f9; flex-shrink:0;
  }
  .sp-report-title { font-size:12px; font-weight:600; color:#334155; display:flex; align-items:center; gap:6px; }
  .sp-report-badge {
    font-size:10px; padding:1px 7px; border-radius:20px;
    background:#f1f5f9; color:#64748b; border:1px solid #e2e8f0;
  }
  .sp-feed { flex:1; overflow-y:auto; padding:8px; }
  .sp-feed-empty {
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    height:100%; gap:8px; color:#cbd5e1;
  }
  .sp-feed-empty p { font-size:12px; }
  .sp-feed-card {
    padding:9px 10px; border-radius:10px; border:1px solid #f1f5f9;
    background:#fff; margin-bottom:7px;
    box-shadow:0 1px 3px rgba(0,0,0,.04);
  }
  .sp-feed-card-top { display:flex; align-items:center; gap:6px; margin-bottom:3px; }
  .sp-feed-dot { width:6px; height:6px; border-radius:50%; background:#38bdf8; flex-shrink:0; }
  .sp-feed-dot.orange { background:#f59e0b; }
  .sp-feed-action { font-size:11px; color:#64748b; flex:1; }
  .sp-feed-time { font-size:10px; color:#94a3b8; }
  .sp-feed-label { font-size:12px; font-weight:600; color:#1e293b; margin-bottom:2px; }
  .sp-feed-addr { font-size:10px; color:#64748b; display:flex; align-items:flex-start; gap:4px; line-height:1.4; }
  .sp-feed-coord { font-size:10px; color:#94a3b8; font-family:monospace; margin-top:2px; }
  .sp-feed-source-badge {
    font-size:10px; padding:1px 7px; border-radius:20px;
    background:#fef3c7; color:#92400e; margin-top:4px; display:inline-block;
  }

  /* Spinner */
  .sp-spinner {
    width:13px; height:13px; border-radius:50%;
    border:2px solid #e2e8f0; border-top-color:#38bdf8;
    animation:sp-spin .7s linear infinite;
  }

  @keyframes sp-spin { to { transform:rotate(360deg); } }
  @keyframes sp-pulse { from { opacity:.4; } to { opacity:1; } }

  /* Leaflet tooltip */
  .sp-tooltip { font-size:11px; padding:5px 8px; border-radius:6px; }
`;

function injectCSS() {
  if (document.getElementById("smart-poles-css")) return;
  const style = document.createElement("style");
  style.id = "smart-poles-css";
  style.textContent = CSS;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function SmartPoles() {
  const mapDivRef = useRef(null);
  const mlyDivRef = useRef(null);
  const mapRef = useRef(null);
  const mlyRef = useRef(null);
  const markersRef = useRef([]);
  const pegRef = useRef(null);
  const dzRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const previewMarkerRef = useRef(null);

  // Load initial state from localStorage
  const init = persistLoad();

  const [poles, setPoles] = useState(init.poles);
  const [report, setReport] = useState(init.report);
  const [svPos, setSvPos] = useState(null);
  const [showSV, setShowSV] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [noImage, setNoImage] = useState(false);
  const [clickedOnViewer, setClickedOnViewer] = useState(null);
  const [addedAnim, setAddedAnim] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);

  // Keep refs up-to-date for event handlers
  const polesRef = useRef(poles);
  const reportRef = useRef(report);
  useEffect(() => {
    polesRef.current = poles;
  }, [poles]);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  // Persist whenever poles/report change (skip initial mount)
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    persistSave(poles, report);
    setSavedAnim(true);
    const t = setTimeout(() => setSavedAnim(false), 1600);
    return () => clearTimeout(t);
  }, [poles, report]);

  // Inject CSS once
  useEffect(() => {
    injectCSS();
  }, []);

  // ── MAP INIT ──────────────────────────────────
  useEffect(() => {
    let dead = false;
    (async () => {
      loadLink(L_CSS);
      await loadScript(L_JS);
      if (dead || !mapDivRef.current || mapRef.current) return;
      const L = window.L;

      const map = L.map(mapDivRef.current, { zoomControl: false }).setView(
        [40.369, 49.84],
        16,
      );

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", maxZoom: 19 },
      ).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;

      // Map click → open Mapillary
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
          clickMarkerRef.current = null;
        }
        if (previewMarkerRef.current) {
          previewMarkerRef.current.remove();
          previewMarkerRef.current = null;
        }

        const clickIcon = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:50%;
            background:linear-gradient(145deg,#38bdf8,#0ea5e9);border:3px solid #fff;
            box-shadow:0 0 0 8px rgba(56,189,248,0.18),0 4px 16px rgba(56,189,248,0.35);
            display:flex;align-items:center;justify-content:center;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg></div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        clickMarkerRef.current = L.marker([lat, lng], {
          icon: clickIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        setGeocoding(true);
        setShowSV(false);
        setNoImage(false);
        setClickedOnViewer(null);

        const [address, img] = await Promise.all([
          geocode(lat, lng),
          findNearbyImage(lat, lng),
        ]);
        setGeocoding(false);

        if (!img) {
          setNoImage(true);
          setSvPos({ lat, lng, address, imageId: null });
        } else {
          setSvPos({ lat, lng, address, imageId: img.id });
        }
        setShowSV(true);
      });

      // ── Pegman ──
      const getPegPos = () => {
        const b = map.getBounds();
        const sw = map.latLngToContainerPoint(b.getSouthWest());
        return map.containerPointToLatLng([sw.x + 70, sw.y - 90]);
      };

      const pegIcon = L.divIcon({
        className: "",
        html: `<div style="width:44px;height:44px;border-radius:50%;
          background:linear-gradient(145deg,#facc15,#f59e0b);border:3px solid #fff;
          box-shadow:0 4px 16px rgba(250,204,21,.45);
          display:flex;align-items:center;justify-content:center;cursor:grab;user-select:none;"
          onmouseover="this.style.transform='scale(1.1)'"
          onmouseout="this.style.transform='scale(1)'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#1e293b"/>
          </svg></div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      const peg = L.marker(getPegPos(), {
        icon: pegIcon,
        draggable: true,
        zIndexOffset: 2000,
      }).addTo(map);
      pegRef.current = peg;

      peg.on("dragstart", () => setDragging(true));
      peg.on("drag", () => {
        const ll = peg.getLatLng();
        if (dzRef.current) {
          dzRef.current.setLatLng(ll);
        } else {
          dzRef.current = L.circleMarker(ll, {
            radius: 18,
            color: "#38bdf8",
            fillColor: "#38bdf8",
            fillOpacity: 0.15,
            weight: 2,
            dashArray: "5 3",
          }).addTo(map);
        }
      });
      peg.on("dragend", async () => {
        setDragging(false);
        if (dzRef.current) {
          dzRef.current.remove();
          dzRef.current = null;
        }
        const { lat, lng } = peg.getLatLng();
        setGeocoding(true);
        setNoImage(false);
        setClickedOnViewer(null);
        const [address, img] = await Promise.all([
          geocode(lat, lng),
          findNearbyImage(lat, lng),
        ]);
        setGeocoding(false);
        if (!img) {
          setNoImage(true);
          setSvPos({ lat, lng, address, imageId: null });
        } else {
          setSvPos({ lat, lng, address, imageId: img.id });
        }
        setShowSV(true);
        peg.setLatLng(getPegPos());
      });

      map.on("moveend zoomend", () => pegRef.current?.setLatLng(getPegPos()));
    })();
    return () => {
      dead = true;
    };
  }, []);

  // ── Restore saved pole markers on map init ──
  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    renderPoleMarkers(poles);
  });

  // ── MAPILLARY VIEWER ──────────────────────────
  useEffect(() => {
    if (!showSV || !svPos?.imageId || !mlyDivRef.current) return;
    let dead = false;
    (async () => {
      loadLink(MLY_CSS);
      await loadScript(MLY_JS);
      if (dead || !mlyDivRef.current) return;

      const { Viewer } = window.mapillary;
      if (mlyRef.current) {
        try {
          mlyRef.current.remove();
        } catch {}
        mlyRef.current = null;
      }
      mlyDivRef.current.innerHTML = "";

      const viewer = new Viewer({
        accessToken: MAPILLARY_TOKEN,
        container: mlyDivRef.current,
        imageId: svPos.imageId,
        component: { cover: false, sequence: true, direction: true },
      });
      mlyRef.current = viewer;

      // Click on viewer → get real-world coords
      viewer.on("click", (event) => {
        if (!event?.lngLat) return;
        const lat = event.lngLat.lat;
        const lng = event.lngLat.lng;
        setClickedOnViewer({ lat, lng });

        if (mapRef.current && window.L) {
          const L = window.L;
          if (previewMarkerRef.current) {
            previewMarkerRef.current.remove();
            previewMarkerRef.current = null;
          }

          const pIcon = L.divIcon({
            className: "",
            html: `<div style="display:flex;flex-direction:column;align-items:center;">
              <div style="width:30px;height:30px;border-radius:50%;
                background:linear-gradient(145deg,#f59e0b,#d97706);
                border:2.5px solid #fff;
                box-shadow:0 0 0 6px rgba(245,158,11,0.2),0 3px 12px rgba(245,158,11,0.4);
                display:flex;align-items:center;justify-content:center;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
                  <line x1="12" y1="2" x2="12" y2="22"/>
                  <path d="M8 6 Q12 1 16 6"/>
                  <circle cx="12" cy="5.5" r="2" fill="#fff"/>
                </svg></div>
              <div style="width:2px;height:6px;background:#f59e0b;opacity:.7;"></div>
            </div>`,
            iconSize: [30, 38],
            iconAnchor: [15, 38],
          });
          previewMarkerRef.current = L.marker([lat, lng], {
            icon: pIcon,
            zIndexOffset: 1500,
          }).addTo(mapRef.current);
          mapRef.current.flyTo([lat, lng], 18, { duration: 0.7 });
        }
      });
    })();
    return () => {
      dead = true;
    };
  }, [showSV, svPos?.imageId]);

  // ── RENDER POLE MARKERS ───────────────────────
  const renderPoleMarkers = useCallback((poleList) => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    poleList.forEach((pole) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="width:34px;height:34px;border-radius:50%;
            background:linear-gradient(145deg,#22c55e,#16a34a);
            border:2.5px solid #fff;box-shadow:0 3px 12px rgba(34,197,94,.45);
            display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M8 6 Q12 1 16 6"/>
              <circle cx="12" cy="5.5" r="2" fill="#fff"/>
            </svg></div>
          <div style="width:2px;height:8px;background:#22c55e;opacity:.6;"></div>
        </div>`,
        iconSize: [34, 44],
        iconAnchor: [17, 44],
      });
      const m = L.marker([pole.lat, pole.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<b>${pole.label}</b><br/><small>${(pole.address || "").slice(0, 50)}</small>`,
          { direction: "top", offset: [0, -46], className: "sp-tooltip" },
        );
      markersRef.current.push(m);
    });
  }, []);

  useEffect(() => {
    renderPoleMarkers(poles);
  }, [poles, renderPoleMarkers]);

  // ── ADD POLE ──────────────────────────────────
  const addPole = useCallback(async () => {
    const pos =
      clickedOnViewer || (svPos ? { lat: svPos.lat, lng: svPos.lng } : null);
    if (!pos) return;

    const exists = polesRef.current.some(
      (p) =>
        Math.abs(p.lat - pos.lat) < 0.00005 &&
        Math.abs(p.lng - pos.lng) < 0.00005,
    );
    if (exists) return;

    const address = svPos?.address || (await geocode(pos.lat, pos.lng));
    const fromViewer = !!clickedOnViewer;

    const pole = {
      id: Date.now(),
      lat: pos.lat,
      lng: pos.lng,
      label: `Dirək #${polesRef.current.length + 1}`,
      address,
      source: fromViewer ? "viewer" : "map",
    };

    const entry = {
      time: new Date().toLocaleTimeString("az-AZ"),
      ...pole,
      lat: pos.lat.toFixed(6),
      lng: pos.lng.toFixed(6),
      action: fromViewer
        ? "360° görüntüdən əlavə edildi"
        : "Xəritədən əlavə edildi",
    };

    setPoles((prev) => {
      const next = [...prev, pole];
      persistSave(next, [entry, ...reportRef.current]);
      return next;
    });
    setReport((prev) => {
      const next = [entry, ...prev];
      return next;
    });

    // Clean up markers
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }

    mapRef.current?.flyTo([pos.lat, pos.lng], 18, { duration: 1 });
    setAddedAnim(true);
    setClickedOnViewer(null);
    setTimeout(() => setAddedAnim(false), 2200);
  }, [clickedOnViewer, svPos]);

  // ── CLEAR ALL ─────────────────────────────────
  const clearAll = useCallback(() => {
    if (!window.confirm("Bütün dirəkləri silmək istəyirsiniz?")) return;
    setPoles([]);
    setReport([]);
    persistSave([], []);
    closeSV();
  }, []);

  // ── CLOSE VIEWER ──────────────────────────────
  const closeSV = useCallback(() => {
    setShowSV(false);
    setClickedOnViewer(null);
    setNoImage(false);
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
    if (previewMarkerRef.current) {
      previewMarkerRef.current.remove();
      previewMarkerRef.current = null;
    }
    if (mlyRef.current) {
      try {
        mlyRef.current.remove();
      } catch {}
      mlyRef.current = null;
    }
  }, []);

  // ── RENDER ────────────────────────────────────
  return (
    <div className="sp-root">
      {/* ── HEADER ── */}
      <header className="sp-header">
        <div className="sp-hbrand">
          <div className="sp-hlogo">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" />
              <path d="M8 6 Q12 1 16 6" />
              <circle cx="12" cy="5.5" r="2" fill="#e2e8f0" />
            </svg>
          </div>
          <span className="sp-htitle">Smart Poles</span>
          <div className="sp-hbadge">{poles.length} dirək</div>
        </div>

        <div className="sp-hcenter">
          {geocoding ? (
            <span className="sp-hgeocoding">
              <div className="sp-spinner" />
              Görüntü axtarılır...
            </span>
          ) : dragging ? (
            <span className="sp-hdragging">📍 İstədiyin yerə burax</span>
          ) : clickedOnViewer ? (
            <span className="sp-hselected">
              <span className="sp-hselected-dot" />
              Yer seçildi — indi dirək əlavə et
            </span>
          ) : (
            <span className="sp-hhint">
              <span className="sp-hhint-dot" />
              Xəritəyə klik → görüntüdə yer seç → dirək əlavə et
            </span>
          )}
        </div>

        <div className="sp-hright">
          <span className={`sp-saved-ind ${savedAnim ? "visible" : ""}`}>
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Saxlanıldı
          </span>

          <div className="sp-hstats">
            <div className="sp-hstat">
              <span className="sp-hstat-n">{poles.length}</span>
              <span className="sp-hstat-l">Dirək</span>
            </div>
            <div className="sp-hstat-div" />
            <div className="sp-hstat">
              <span className="sp-hstat-n">{report.length}</span>
              <span className="sp-hstat-l">Əməliyyat</span>
            </div>
          </div>

          <button className="sp-clear-btn" onClick={clearAll}>
            Sıfırla
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="sp-body">
        {/* MAP */}
        <div className="sp-map-col">
          <div ref={mapDivRef} className="sp-map" />

          <div className="sp-map-hint">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            </svg>
            Küçəyə klik et və ya sarı marker sürükle
          </div>

          {geocoding && (
            <div className="sp-geocoding-bar">
              <div className="sp-spinner" />
              Görüntü axtarılır...
            </div>
          )}

          {dragging && (
            <div className="sp-drag-overlay">
              <div className="sp-drag-card">
                <div className="sp-drag-pulse" />
                360° görüntü üçün buraxın
              </div>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="sp-panel">
          {/* Street View Section */}
          <div className="sp-sv-section">
            {!showSV || !svPos ? (
              <div className="sp-sv-placeholder">
                <div className="sp-sv-placeholder-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <p className="sp-sv-placeholder-text">
                  Xəritədə küçəyə klik et
                  <br />
                  360° görüntü açılacaq
                </p>
                <div className="sp-sv-placeholder-sub">
                  Görüntüdə yer seç → dirək əlavə et
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sp-sv-header">
                  <div className="sp-sv-header-info">
                    <div
                      className={`sp-sv-badge ${svPos.imageId ? "" : "no-img"}`}
                    >
                      {svPos.imageId ? "Mapillary 360°" : "Görüntü yoxdur"}
                    </div>
                    <p className="sp-sv-address">{svPos.address}</p>
                    <p className="sp-sv-coord">
                      {clickedOnViewer ? (
                        <span className="sp-sv-coord-live">
                          <span className="sp-coord-pulse">● </span>
                          {clickedOnViewer.lat.toFixed(6)},{" "}
                          {clickedOnViewer.lng.toFixed(6)}
                        </span>
                      ) : (
                        `${svPos.lat.toFixed(6)}, ${svPos.lng.toFixed(6)}`
                      )}
                    </p>
                  </div>
                  <button className="sp-sv-close-btn" onClick={closeSV}>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <div className="sp-sv-body">
                  {svPos.imageId ? (
                    <>
                      <div ref={mlyDivRef} className="sp-mly-viewer" />

                      {!clickedOnViewer && (
                        <div className="sp-viewer-click-hint">
                          <span>
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <circle cx="12" cy="12" r="3" />
                              <line x1="12" y1="2" x2="12" y2="6" />
                              <line x1="12" y1="18" x2="12" y2="22" />
                              <line x1="2" y1="12" x2="6" y2="12" />
                              <line x1="18" y1="12" x2="22" y2="12" />
                            </svg>
                            Görüntüdə yerə klik et
                          </span>
                        </div>
                      )}

                      {clickedOnViewer && (
                        <div className="sp-selected-coord-badge">
                          <span className="sp-selected-dot" />
                          {clickedOnViewer.lat.toFixed(5)},{" "}
                          {clickedOnViewer.lng.toFixed(5)}
                        </div>
                      )}

                      <div className="sp-sv-footer-overlay">
                        {addedAnim ? (
                          <div className="sp-added-success">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Dirək əlavə edildi!
                          </div>
                        ) : (
                          <button
                            className={`sp-add-btn ${clickedOnViewer ? "ready" : ""}`}
                            onClick={addPole}
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            >
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            {clickedOnViewer
                              ? "Seçilmiş yerə dirək əlavə et"
                              : "Bu yerə dirək əlavə et"}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="sp-no-image-box">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p>Bu ərazidə Mapillary görüntüsü yoxdur</p>
                      <small className="sp-no-image-sub">
                        Yaxın başqa bir yerə klik edin
                      </small>
                      <button className="sp-add-btn-ghost" onClick={addPole}>
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        >
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Görüntüsüz dirək əlavə et
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Report Section */}
          <div className="sp-report-section">
            <div className="sp-report-top">
              <div className="sp-report-title">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
                Hesabat
              </div>
              {report.length > 0 && (
                <span className="sp-report-badge">{report.length}</span>
              )}
            </div>

            <div className="sp-feed">
              {report.length === 0 ? (
                <div className="sp-feed-empty">
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>Hələ əməliyyat yoxdur</p>
                </div>
              ) : (
                report.map((r, i) => (
                  <div key={i} className="sp-feed-card">
                    <div className="sp-feed-card-top">
                      <div
                        className={`sp-feed-dot ${r.source === "viewer" ? "orange" : ""}`}
                      />
                      <span className="sp-feed-action">{r.action}</span>
                      <span className="sp-feed-time">{r.time}</span>
                    </div>
                    <p className="sp-feed-label">{r.label}</p>
                    <p className="sp-feed-addr">
                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      </svg>
                      {r.address}
                    </p>
                    <p className="sp-feed-coord">
                      {r.lat}, {r.lng}
                    </p>
                    {r.source === "viewer" && (
                      <span className="sp-feed-source-badge">
                        360° görüntüdən
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
