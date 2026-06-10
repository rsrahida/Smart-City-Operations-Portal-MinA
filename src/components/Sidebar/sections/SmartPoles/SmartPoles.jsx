import { useEffect, useRef, useState, useCallback } from "react";

const MAPILLARY_TOKEN =
  "MLY|35215931484717139|54aed95a3cc2fa8e945efe0fabe59287";
const STORAGE_KEY = "smart_poles_data_v2";

const L_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const L_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const MLY_CSS = "https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.css";
const MLY_JS = "https://unpkg.com/mapillary-js@4.1.2/dist/mapillary.js";

const OBJECT_TYPES = {
  pole: {
    id: "pole",
    label: "İşıq dirəyi",
    emoji: "",
    color: "#bb5d00",
    colorLight: "#fff7ed",
    colorBorder: "#fed7aa",
    markerColor: "#bb5d00",
    markerGradient: "linear-gradient(145deg,#bb5d00,#d97706)",
    svgPath: `<line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M8 6 Q12 1 16 6"/>
              <circle cx="12" cy="5.5" r="2" fill="#fff"/>`,
  },
  traffic: {
    id: "traffic",
    label: "İşıqfor",
    emoji: "",
    color: "#16a34a",
    colorLight: "#f0fdf4",
    colorBorder: "#bbf7d0",
    markerColor: "#16a34a",
    markerGradient: "linear-gradient(145deg,#16a34a,#22c55e)",
    svgPath: `<rect x="8" y="2" width="8" height="20" rx="2"/>
              <circle cx="12" cy="7" r="2" fill="#ef4444"/>
              <circle cx="12" cy="12" r="2" fill="#facc15"/>
              <circle cx="12" cy="17" r="2" fill="#22c55e"/>`,
  },
  sign: {
    id: "sign",
    label: "Yol nişanı",
    emoji: "",
    color: "#1d4ed8",
    colorLight: "#eff6ff",
    colorBorder: "#bfdbfe",
    markerColor: "#1d4ed8",
    markerGradient: "linear-gradient(145deg,#1d4ed8,#3b82f6)",
    svgPath: `<rect x="3" y="4" width="18" height="11" rx="2"/>
              <line x1="12" y1="15" x2="12" y2="22"/>
              <line x1="9" y1="22" x2="15" y2="22"/>`,
  },
  camera: {
    id: "camera",
    label: "Kamera ",
    emoji: "",
    color: "#7c3aed",
    colorLight: "#faf5ff",
    colorBorder: "#ddd6fe",
    markerColor: "#7c3aed",
    markerGradient: "linear-gradient(145deg,#7c3aed,#a78bfa)",
    svgPath: `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/>
              <circle cx="12" cy="13" r="3"/>`,
  },
};

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

function persistLoad() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { objects: d.objects || [], report: d.report || [] };
    }
  } catch {}
  return { objects: [], report: [] };
}
function persistSave(objects, report) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ objects, report }));
  } catch {}
}

function buildMarkerHTML(typeId, size = 34) {
  const t = OBJECT_TYPES[typeId] || OBJECT_TYPES.pole;
  return `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:${size}px;height:${size}px;border-radius:50%;
      background:${t.markerGradient};border:2.5px solid #fff;
      box-shadow:0 3px 12px ${t.markerColor}66;
      display:flex;align-items:center;justify-content:center;">
      <svg width="${Math.round(size * 0.47)}" height="${Math.round(size * 0.47)}" viewBox="0 0 24 24" fill="none"
        stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        ${t.svgPath}
      </svg>
    </div>
    <div style="width:2px;height:8px;background:${t.markerColor};opacity:.6;"></div>
  </div>`;
}

function TypeIcon({ typeId, size = 16, color = "#fff" }) {
  const s = {
    fill: "none",
    stroke: color,
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (typeId === "pole")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={s}>
        <line x1="12" y1="2" x2="12" y2="22" />
        <path d="M8 6 Q12 1 16 6" />
        <circle cx="12" cy="5.5" r="2" fill={color} stroke="none" />
      </svg>
    );
  if (typeId === "traffic")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={s}>
        <rect x="8" y="2" width="8" height="20" rx="2" />
        <circle cx="12" cy="7" r="2" fill="#ef4444" stroke="none" />
        <circle cx="12" cy="12" r="2" fill="#facc15" stroke="none" />
        <circle cx="12" cy="17" r="2" fill="#22c55e" stroke="none" />
      </svg>
    );
  if (typeId === "sign")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={s}>
        <rect x="3" y="4" width="18" height="11" rx="2" />
        <line x1="12" y1="15" x2="12" y2="22" />
        <line x1="9" y1="22" x2="15" y2="22" />
      </svg>
    );
  if (typeId === "camera")
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={s}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
    );
  return null;
}

const CSS = `
  @import url("https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap");

  .sp-root { display:flex;flex-direction:column;height:100vh;font-family:"DM Sans",system-ui,sans-serif;background:#fffbf5;overflow:hidden; }

  /* Header */
  .sp-header { display:flex;align-items:center;gap:14px;padding:0 28px;height:65px;background:#bb5d00;box-shadow:0 4px 24px rgba(187,93,0,.28);flex-shrink:0;z-index:10; }
  .sp-hbrand { display:flex;align-items:center;gap:10px; }
  .sp-hlogo { width:34px;height:34px;border-radius:9px;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.15);flex-shrink:0; }
  .sp-htitle { font-size:17px;font-weight:800;color:#fff; }
  .sp-hcenter { flex:1;display:flex;justify-content:center; }
  .sp-hhint { font-size:12.5px;color:rgba(255,255,255,.75);display:flex;align-items:center;gap:6px; }
  .sp-hhint-dot { width:6px;height:6px;border-radius:50%;background:#fbbf24;flex-shrink:0; }
  .sp-hselected { font-size:12.5px;color:#fff;display:flex;align-items:center;gap:6px;font-weight:600; }
  .sp-hselected-dot { width:7px;height:7px;border-radius:50%;background:#fbbf24;animation:sp-pulse .8s ease-in-out infinite alternate; }
  .sp-hgeocoding { font-size:12.5px;color:rgba(255,255,255,.8);display:flex;align-items:center;gap:8px; }
  .sp-hdragging { font-size:12.5px;color:#fbbf24;font-weight:600; }
  .sp-hright { display:flex;align-items:center;gap:12px; }
  .sp-saved-ind { font-size:11px;color:#fbbf24;display:flex;align-items:center;gap:4px;font-weight:600;opacity:0;transition:opacity .3s; }
  .sp-saved-ind.visible { opacity:1; }
  .sp-clear-btn { font-size:12px;padding:8px 16px;border-radius:10px;border:1px solid rgba(255,255,255,.35);color:#fff;background:rgba(255,255,255,.15);cursor:pointer;transition:background .15s;font-weight:600; }
  .sp-clear-btn:hover { background:rgba(255,255,255,.25); }

  /* Body */
  .sp-body { display:flex;flex:1;overflow:hidden; }
  .sp-map-col { position:relative;flex:0 0 50%;width:50%; }
  .sp-map { width:100%;height:100%; }
  .sp-map-hint { position:absolute;bottom:16px;left:50%;transform:translateX(-50%);background:rgba(255,251,245,.94);backdrop-filter:blur(8px);border:1px solid #fed7aa;border-radius:20px;padding:6px 14px;font-size:12px;color:#bb5d00;pointer-events:none;display:flex;align-items:center;gap:5px;box-shadow:0 2px 12px rgba(187,93,0,.12);font-weight:500; }
  .sp-drag-overlay { position:absolute;inset:0;background:rgba(187,93,0,.06);display:flex;align-items:center;justify-content:center;pointer-events:none; }
  .sp-drag-card { background:rgba(255,251,245,.97);border:2px dashed #f59e0b;border-radius:16px;padding:16px 28px;font-size:14px;color:#92400e;font-weight:600;display:flex;align-items:center;gap:10px; }
  .sp-drag-pulse { width:10px;height:10px;border-radius:50%;background:#f59e0b;animation:sp-pulse .6s ease-in-out infinite alternate; }

  /* Right panel */
  .sp-panel { display:flex;flex-direction:column;flex:0 0 50%;width:50%;background:#fffbf5;border-left:2px solid #fed7aa;overflow:hidden; }

  /* Viewer section */
  .sp-sv-section { flex:1;display:flex;flex-direction:column;overflow:hidden;border-bottom:1px solid #fed7aa; }
  .sp-sv-placeholder { display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;padding:24px; }
  .sp-sv-placeholder-icon { width:56px;height:56px;border-radius:16px;background:#fff7ed;border:1.5px solid #fed7aa;display:flex;align-items:center;justify-content:center; }
  .sp-sv-placeholder-text { font-size:13px;color:#78350f;text-align:center;line-height:1.6;font-weight:500; }
  .sp-sv-placeholder-sub { font-size:11px;color:#b45309;opacity:.7; }

  .sp-sv-header { display:flex;align-items:flex-start;justify-content:space-between;padding:12px 14px 10px;border-bottom:1px solid #fde8cb;background:#fff7ed;flex-shrink:0; }
  .sp-sv-header-info { flex:1;min-width:0; }
  .sp-sv-address { font-size:12px;color:#78350f;line-height:1.4;padding-right:8px; }
  .sp-sv-coord { font-size:11px;color:#b45309;margin-top:2px;font-family:monospace;opacity:.8; }
  .sp-sv-close-btn { width:26px;height:26px;border-radius:7px;border:1px solid #fed7aa;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#bb5d00;flex-shrink:0;transition:background .15s; }
  .sp-sv-close-btn:hover { background:#fff7ed; }

  .sp-sv-body { flex:1;position:relative;overflow:hidden; }
  .sp-mly-viewer { width:100%;height:100%; }

  /* Object type picker */
  .sp-type-picker { position:absolute;bottom:0;left:0;right:0;z-index:200;padding:10px 10px 8px;background:linear-gradient(to top,rgba(255,251,245,1) 70%,transparent);display:flex;flex-direction:column;gap:8px; }
  .sp-type-picker-label { font-size:11px;font-weight:700;color:#78350f;letter-spacing:.4px;text-transform:uppercase;padding:0 2px; }
  .sp-type-row { display:flex;gap:6px; }

  .sp-type-btn {
    flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;
    padding:8px 4px 7px;border-radius:11px;border:1.5px solid #fde8cb;
    background:#fff;cursor:pointer;transition:all .15s;font-family:"DM Sans",sans-serif;
  }
  .sp-type-btn:hover { border-color:#f59e0b;background:#fffbf5;transform:translateY(-1px);box-shadow:0 4px 14px rgba(0,0,0,.08); }
  .sp-type-btn.active { border-width:2px;box-shadow:0 4px 16px rgba(0,0,0,.12);transform:translateY(-1px); }
  .sp-type-btn-icon { width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center; }
  .sp-type-btn-label { font-size:10px;font-weight:600;color:#78350f;text-align:center;line-height:1.2; }

  /* Action bar */
  .sp-action-bar { display:flex;gap:6px;align-items:center; }
  .sp-add-btn { flex:1;padding:10px 14px;border-radius:10px;border:1px solid #fed7aa;background:#fff7ed;color:#bb5d00;font-family:"DM Sans",sans-serif;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .18s;font-weight:600; }
  .sp-add-btn:hover { background:#ffedd5;border-color:#f59e0b; }
  .sp-confirm-btn { padding:10px 16px;border-radius:10px;border:1.5px solid #16a34a;background:#16a34a;color:#fff;font-family:"DM Sans",sans-serif;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:all .18s;font-weight:700;white-space:nowrap; }
  .sp-confirm-btn:hover { background:#15803d; }
  .sp-confirm-btn:disabled { opacity:.45;cursor:not-allowed; }

  .sp-added-success { width:100%;padding:10px;border-radius:10px;background:#fff7ed;color:#bb5d00;font-family:"DM Sans",sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid #fed7aa; }

  /* Pending strip */
  .sp-pending-strip { padding:6px 10px;background:#fffbf5;border-top:1px solid #fde8cb;display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-height:36px; }
  .sp-pending-label { font-size:10px;color:#b45309;font-weight:700;text-transform:uppercase;letter-spacing:.4px;flex-shrink:0; }
  .sp-pending-chip { display:flex;align-items:center;gap:5px;padding:3px 8px 3px 6px;border-radius:20px;font-size:11px;font-weight:600;cursor:pointer;transition:opacity .15s; }
  .sp-pending-chip:hover { opacity:.75; }
  .sp-pending-chip-x { font-size:12px;line-height:1;margin-left:2px; }
  .sp-pending-empty { font-size:11px;color:#b45309;opacity:.5; }

  /* Viewer click hint */
  .sp-viewer-click-hint { position:absolute;bottom:160px;left:0;right:0;text-align:center;pointer-events:none; }
  .sp-viewer-click-hint span { font-size:11px;padding:5px 12px;border-radius:20px;background:rgba(187,93,0,.75);color:#fff;display:inline-flex;align-items:center;gap:5px;font-weight:500; }

  /* Viewer pole markers */
  .sp-viewer-obj-marker { position:absolute;pointer-events:none;z-index:100;display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);animation:sp-marker-drop .22s cubic-bezier(.34,1.56,.64,1); }
  .sp-viewer-obj-head { width:34px;height:34px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 0 5px rgba(0,0,0,.1),0 4px 14px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center; }
  .sp-viewer-obj-stem { width:2px;height:8px;opacity:.75; }

  /* No image */
  .sp-no-image-box { display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;padding:24px;color:#b45309; }
  .sp-no-image-box p { font-size:13px;color:#78350f;text-align:center; }
  .sp-no-image-sub { font-size:11px;color:#b45309;opacity:.7; }

  /* Feed section */
  .sp-report-section { flex:0 0 230px;display:flex;flex-direction:column;overflow:hidden;background:#fffbf5; }
  .sp-report-top { display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #fde8cb;background:#fff7ed;flex-shrink:0; }
  .sp-report-title { font-size:12px;font-weight:700;color:#78350f;display:flex;align-items:center;gap:6px; }
  .sp-report-badge { font-size:10px;padding:1px 7px;border-radius:20px;background:#fff7ed;color:#bb5d00;border:1px solid #fed7aa;font-weight:700; }

  .sp-feed { flex:1;overflow-y:auto;padding:8px; }
  .sp-feed::-webkit-scrollbar { width:3px; }
  .sp-feed::-webkit-scrollbar-thumb { background:#fed7aa;border-radius:99px; }
  .sp-feed-empty { display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px; }
  .sp-feed-empty p { font-size:12px;color:#b45309;opacity:.6; }
  .sp-feed-card { padding:9px 10px;border-radius:10px;border:1px solid #fde8cb;background:#fff;margin-bottom:7px;box-shadow:0 1px 4px rgba(187,93,0,.06);transition:border-color .15s,box-shadow .15s; }
  .sp-feed-card:hover { border-color:#f59e0b;box-shadow:0 3px 10px rgba(187,93,0,.1); }
  .sp-feed-card-top { display:flex;align-items:center;gap:6px;margin-bottom:3px; }
  .sp-feed-type-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
  .sp-feed-action { font-size:11px;color:#78350f;flex:1; }
  .sp-feed-time { font-size:10px;color:#b45309;opacity:.6; }
  .sp-feed-label { font-size:12px;font-weight:700;color:#1e293b;margin-bottom:2px; }
  .sp-feed-addr { font-size:10px;color:#78350f;display:flex;align-items:flex-start;gap:4px;line-height:1.4;opacity:.75; }
  .sp-feed-coord { font-size:10px;color:#b45309;font-family:monospace;margin-top:2px;opacity:.6; }

  /* Modal */
  .sp-modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:9000;display:flex;align-items:center;justify-content:center; }
  .sp-modal { background:#fff;border-radius:16px;padding:28px 24px 20px;max-width:340px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.2); }
  .sp-modal h3 { font-size:15px;font-weight:700;color:#1e293b;margin:0 0 16px; }
  .sp-modal-actions { display:flex;gap:8px; }
  .sp-modal-cancel { flex:1;padding:10px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-family:"DM Sans",sans-serif;font-size:13px;cursor:pointer;font-weight:600; }
  .sp-modal-confirm { flex:1;padding:10px;border-radius:10px;border:none;background:#ef4444;color:#fff;font-family:"DM Sans",sans-serif;font-size:13px;cursor:pointer;font-weight:700; }

  /* Peg preview */
  .sp-peg-preview { position:absolute;pointer-events:none;z-index:3000;transform:translate(-50%,-130%);transition:left .05s,top .05s; }
  .sp-peg-preview-inner { background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.35);border:2.5px solid #fbbf24;width:140px; }
  .sp-peg-preview-img { width:140px;height:88px;object-fit:cover;display:block;background:#1e293b; }
  .sp-peg-preview-img-placeholder { width:140px;height:88px;background:linear-gradient(135deg,#1e293b,#334155);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:rgba(255,255,255,.5);font-size:11px; }
  .sp-peg-preview-footer { padding:5px 8px;font-size:10px;color:#78350f;font-weight:600;background:#fff7ed;display:flex;align-items:center;gap:4px; }
  .sp-peg-preview-dot { width:5px;height:5px;border-radius:50%;background:#22c55e;flex-shrink:0; }
  .sp-peg-preview-dot.no { background:#ef4444; }
  .sp-peg-preview-arrow { position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid #fbbf24; }

  .sp-spinner { width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:#fff;animation:sp-spin .7s linear infinite; }
  .sp-tooltip { font-size:11px;padding:5px 8px;border-radius:6px; }

  @keyframes sp-spin { to { transform:rotate(360deg); } }
  @keyframes sp-pulse { from { opacity:.4; } to { opacity:1; } }
  @keyframes sp-marker-drop {
    from { opacity:0;transform:translate(-50%,-120%) scale(.7); }
    to   { opacity:1;transform:translate(-50%,-100%) scale(1); }
  }
`;

function injectCSS() {
  if (document.getElementById("smart-poles-css-v2")) return;
  const style = document.createElement("style");
  style.id = "smart-poles-css-v2";
  style.textContent = CSS;
  document.head.appendChild(style);
}

export default function SmartPoles() {
  const mapDivRef = useRef(null);
  const mlyDivRef = useRef(null);
  const mapRef = useRef(null);
  const mlyRef = useRef(null);
  const markersRef = useRef([]);
  const pegRef = useRef(null);
  const dzRef = useRef(null);
  const clickMarkerRef = useRef(null);
  const pegPreviewElRef = useRef(null);
  const pegPreviewStatusRef = useRef(null);
  const previewFetchTimerRef = useRef(null);
  const previewMapMarkersRef = useRef([]);

  const init = persistLoad();

  const [objects, setObjects] = useState(init.objects);
  const [report, setReport] = useState(init.report);
  const [pending, setPending] = useState([]);
  const [svPos, setSvPos] = useState(null);
  const [showSV, setShowSV] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [noImage, setNoImage] = useState(false);
  const [selectedType, setSelectedType] = useState("pole");
  const [confirmedAnim, setConfirmedAnim] = useState(false);
  const [savedAnim, setSavedAnim] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const objectsRef = useRef(objects);
  const reportRef = useRef(report);
  useEffect(() => {
    objectsRef.current = objects;
  }, [objects]);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);

  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    setSavedAnim(true);
    const t = setTimeout(() => setSavedAnim(false), 1600);
    return () => clearTimeout(t);
  }, [objects, report]);

  useEffect(() => {
    injectCSS();
  }, []);

  const ensurePegPreview = useCallback((container) => {
    if (pegPreviewElRef.current) return pegPreviewElRef.current;
    const el = document.createElement("div");
    el.className = "sp-peg-preview";
    el.style.display = "none";
    el.innerHTML = `
      <div class="sp-peg-preview-inner">
        <div class="sp-peg-preview-img-placeholder" id="sp-prev-placeholder">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>Axtarılır...</span>
        </div>
        <img class="sp-peg-preview-img" id="sp-prev-img" style="display:none" alt=""/>
        <div class="sp-peg-preview-footer">
          <span class="sp-peg-preview-dot" id="sp-prev-dot"></span>
          <span id="sp-prev-status">Yoxlanır...</span>
        </div>
      </div>
      <div class="sp-peg-preview-arrow"></div>`;
    container.appendChild(el);
    pegPreviewElRef.current = el;
    pegPreviewStatusRef.current = {
      placeholder: el.querySelector("#sp-prev-placeholder"),
      img: el.querySelector("#sp-prev-img"),
      dot: el.querySelector("#sp-prev-dot"),
      status: el.querySelector("#sp-prev-status"),
    };
    return el;
  }, []);

  const hidePegPreview = useCallback(() => {
    if (pegPreviewElRef.current) pegPreviewElRef.current.style.display = "none";
    if (previewFetchTimerRef.current)
      clearTimeout(previewFetchTimerRef.current);
  }, []);

  const updatePegPreviewImage = useCallback(async (lat, lng) => {
    if (!pegPreviewStatusRef.current) return;
    const s = pegPreviewStatusRef.current;
    s.placeholder.style.display = "flex";
    s.img.style.display = "none";
    s.dot.className = "sp-peg-preview-dot";
    s.status.textContent = "Görüntü axtarılır...";
    try {
      const img = await findNearbyImage(lat, lng);
      if (
        !pegPreviewElRef.current ||
        pegPreviewElRef.current.style.display === "none"
      )
        return;
      if (img?.id) {
        const res = await fetch(
          `https://graph.mapillary.com/${img.id}?access_token=${MAPILLARY_TOKEN}&fields=thumb_256_url,thumb_original_url`,
        );
        const data = await res.json();
        const thumbUrl = data.thumb_256_url || data.thumb_original_url;
        if (thumbUrl && pegPreviewElRef.current.style.display !== "none") {
          s.img.src = thumbUrl;
          s.img.onload = () => {
            s.placeholder.style.display = "none";
            s.img.style.display = "block";
          };
          s.img.onerror = () => {
            s.placeholder.style.display = "flex";
            s.img.style.display = "none";
            s.placeholder.querySelector("span").textContent =
              "Görüntü yüklənmədi";
          };
        }
        s.dot.className = "sp-peg-preview-dot";
        s.status.textContent = "Küçə görüntüsü var";
      } else {
        s.placeholder.style.display = "flex";
        s.placeholder.querySelector("span").textContent = "Görüntü yoxdur";
        s.img.style.display = "none";
        s.dot.className = "sp-peg-preview-dot no";
        s.status.textContent = "Bu ərazidə görüntü yoxdur";
      }
    } catch {
      if (pegPreviewStatusRef.current) {
        s.dot.className = "sp-peg-preview-dot no";
        s.status.textContent = "Xəta baş verdi";
      }
    }
  }, []);

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
        {
          attribution: "© OpenStreetMap © CARTO",
          maxZoom: 19,
        },
      ).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;

      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        const originLat = lat;
        const originLng = lng;

        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
          clickMarkerRef.current = null;
        }
        previewMapMarkersRef.current.forEach((m) => m.remove());
        previewMapMarkersRef.current = [];

        const clickIcon = L.divIcon({
          className: "",
          html: `<div style="width:32px;height:32px;border-radius:50%;
            background:linear-gradient(145deg,#f59e0b,#bb5d00);border:3px solid #fff;
            box-shadow:0 0 0 8px rgba(187,93,0,.18),0 4px 16px rgba(187,93,0,.35);
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
        setPending([]);
        const [address, img] = await Promise.all([
          geocode(lat, lng),
          findNearbyImage(lat, lng),
        ]);
        setGeocoding(false);

        if (!img) {
          setNoImage(true);
          setSvPos({ lat, lng, originLat, originLng, address, imageId: null });
        } else {
          setSvPos({
            lat,
            lng,
            originLat,
            originLng,
            address,
            imageId: img.id,
          });
        }
        setShowSV(true);
      });

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

      peg.on("dragstart", () => {
        setDragging(true);
        const pos = peg.getLatLng();
        const containerPt = map.latLngToContainerPoint(pos);
        const el = ensurePegPreview(mapDivRef.current);
        el.style.display = "block";
        el.style.left = containerPt.x + "px";
        el.style.top = containerPt.y + "px";
        updatePegPreviewImage(pos.lat, pos.lng);
      });
      peg.on("drag", () => {
        const ll = peg.getLatLng();
        if (dzRef.current) {
          dzRef.current.setLatLng(ll);
        } else {
          dzRef.current = L.circleMarker(ll, {
            radius: 18,
            color: "#bb5d00",
            fillColor: "#bb5d00",
            fillOpacity: 0.15,
            weight: 2,
            dashArray: "5 3",
          }).addTo(map);
        }
        const cp = map.latLngToContainerPoint(ll);
        if (pegPreviewElRef.current) {
          pegPreviewElRef.current.style.left = cp.x + "px";
          pegPreviewElRef.current.style.top = cp.y + "px";
        }
        if (previewFetchTimerRef.current)
          clearTimeout(previewFetchTimerRef.current);
        previewFetchTimerRef.current = setTimeout(
          () => updatePegPreviewImage(ll.lat, ll.lng),
          400,
        );
      });
      peg.on("dragend", async () => {
        setDragging(false);
        hidePegPreview();
        if (dzRef.current) {
          dzRef.current.remove();
          dzRef.current = null;
        }
        const { lat, lng } = peg.getLatLng();
        const originLat = lat;
        const originLng = lng;
        setGeocoding(true);
        setNoImage(false);
        setPending([]);
        const [address, img] = await Promise.all([
          geocode(lat, lng),
          findNearbyImage(lat, lng),
        ]);
        setGeocoding(false);
        if (!img) {
          setNoImage(true);
          setSvPos({ lat, lng, originLat, originLng, address, imageId: null });
        } else {
          setSvPos({
            lat,
            lng,
            originLat,
            originLng,
            address,
            imageId: img.id,
          });
        }
        setShowSV(true);
        peg.setLatLng(getPegPos());
      });
      map.on("moveend zoomend", () => pegRef.current?.setLatLng(getPegPos()));
    })();
    return () => {
      dead = true;
    };
  }, [ensurePegPreview, hidePegPreview, updatePegPreviewImage]);

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

      let camLatLng = {
        lat: svPos.originLat ?? svPos.lat,
        lng: svPos.originLng ?? svPos.lng,
      };
      viewer.on("image", (evt) => {
        try {
          const img = evt.image;
          if (img?.lngLat) {
            camLatLng = { lat: img.lngLat.lat, lng: img.lngLat.lng };
          }
        } catch {}
      });

      viewer.on("click", async (event) => {
        if (!mlyDivRef.current) return;
        const rect = mlyDivRef.current.getBoundingClientRect();
        const px = event?.originalEvent
          ? event.originalEvent.clientX - rect.left
          : rect.width / 2;
        const py = event?.originalEvent
          ? event.originalEvent.clientY - rect.top
          : rect.height / 2;

        let itemLat = camLatLng.lat;
        let itemLng = camLatLng.lng;

        try {
          const pov = await viewer.getPointOfView();

          const normX = rect.width > 0 ? (px / rect.width) * 2 - 1 : 0;
          const normY = rect.height > 0 ? (py / rect.height) * 2 - 1 : 0;

          const hFov = 90;
          const vFov = 60;
          const bearingDeg = (pov.bearing + normX * (hFov / 2) + 360) % 360;
          const horizY = 0.3;
          const relY = normY - horizY;

          let distM;
          if (relY <= 0) {
            const t = Math.max(0.01, -relY);
            distM = 50 + t * 150;
          } else {
            const t = Math.min(1, relY / 0.7);
            distM = 50 - t * 49;
          }

          const bearingRad = (bearingDeg * Math.PI) / 180;
          const dLat = (distM * Math.cos(bearingRad)) / 111320;
          const dLng =
            (distM * Math.sin(bearingRad)) /
            (111320 * Math.cos((camLatLng.lat * Math.PI) / 180));

          itemLat = camLatLng.lat + dLat;
          itemLng = camLatLng.lng + dLng;
        } catch {}

        const currentType = selectedTypeRef.current;
        const newId = Date.now() + Math.random();

        setPending((prev) => [
          ...prev,
          {
            id: newId,
            typeId: currentType,
            lat: itemLat,
            lng: itemLng,
            pixel: { x: px, y: py },
          },
        ]);

        if (mapRef.current && window.L) {
          const L = window.L;
          const pIcon = L.divIcon({
            className: "",
            html: buildMarkerHTML(currentType, 30),
            iconSize: [30, 40],
            iconAnchor: [15, 40],
          });
          const m = L.marker([itemLat, itemLng], {
            icon: pIcon,
            zIndexOffset: 1500,
          }).addTo(mapRef.current);
          m._pendingId = newId;
          previewMapMarkersRef.current.push(m);
          mapRef.current.setView([itemLat, itemLng], 18, { animate: true });
        }
      });
    })();
    return () => {
      dead = true;
    };
  }, [showSV, svPos?.imageId]);

  const svPosRef = useRef(svPos);
  useEffect(() => {
    svPosRef.current = svPos;
  }, [svPos]);

  const selectedTypeRef = useRef(selectedType);
  useEffect(() => {
    selectedTypeRef.current = selectedType;
  }, [selectedType]);

  const renderObjectMarkers = useCallback((objList) => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    objList.forEach((obj) => {
      const icon = L.divIcon({
        className: "",
        html: buildMarkerHTML(obj.typeId, 34),
        iconSize: [34, 44],
        iconAnchor: [17, 44],
      });
      const m = L.marker([obj.lat, obj.lng], { icon })
        .addTo(map)
        .bindTooltip(
          `<b>${obj.label}</b><br/><small>${(obj.address || "").slice(0, 50)}</small>`,
          { direction: "top", offset: [0, -46], className: "sp-tooltip" },
        );
      markersRef.current.push(m);
    });
  }, []);

  useEffect(() => {
    renderObjectMarkers(objects);
  }, [objects, renderObjectMarkers]);

  const confirmPending = useCallback(async () => {
    if (!pending.length || !svPos) return;
    const address =
      svPos.address ||
      (await geocode(
        svPos.originLat ?? svPos.lat,
        svPos.originLng ?? svPos.lng,
      ));

    const newObjects = pending.map((p, i) => {
      const t = OBJECT_TYPES[p.typeId];
      const countOfType = objectsRef.current.filter(
        (o) => o.typeId === p.typeId,
      ).length;
      return {
        id: p.id,
        typeId: p.typeId,
        lat: p.lat,
        lng: p.lng,
        label: `${t.label} ${countOfType + i + 1}`,
        address,
        source: "viewer",
      };
    });

    const newEntries = newObjects.map((obj) => ({
      time: new Date().toLocaleTimeString("az-AZ"),
      ...obj,
      lat: obj.lat.toFixed(6),
      lng: obj.lng.toFixed(6),
      action: `360° görüntüdən əlavə edildi`,
    }));

    setObjects((prev) => {
      const next = [...prev, ...newObjects];
      persistSave(next, [...newEntries, ...reportRef.current]);
      return next;
    });
    setReport((prev) => [...newEntries, ...prev]);
    setPending([]);
    setConfirmedAnim(true);
    setTimeout(() => setConfirmedAnim(false), 2200);

    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
    previewMapMarkersRef.current.forEach((m) => m.remove());
    previewMapMarkersRef.current = [];
    const flyTarget = newObjects[0] || svPos;
    mapRef.current?.flyTo([flyTarget.lat, flyTarget.lng], 18, { duration: 1 });
  }, [pending, svPos]);

  const removePending = useCallback((id) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
    const idx = previewMapMarkersRef.current.findIndex(
      (m) => m._pendingId === id,
    );
    if (idx !== -1) {
      previewMapMarkersRef.current[idx].remove();
      previewMapMarkersRef.current.splice(idx, 1);
    }
  }, []);

  const closeSV = useCallback(() => {
    setShowSV(false);
    setNoImage(false);
    setPending([]);
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }
    previewMapMarkersRef.current.forEach((m) => m.remove());
    previewMapMarkersRef.current = [];
    if (mlyRef.current) {
      try {
        mlyRef.current.remove();
      } catch {}
      mlyRef.current = null;
    }
  }, []);

  const confirmClear = () => {
    setObjects([]);
    setReport([]);
    persistSave([], []);
    closeSV();
    setShowConfirm(false);
  };

  return (
    <div className="sp-root">
      <header className="sp-header">
        <div className="sp-hbrand">
          <div className="sp-hlogo">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#bb5d00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.5" fill="#bb5d00" />
            </svg>
          </div>
          <span className="sp-htitle">
            Şəhər infrastrukturunun xəritələşdirilməsi
          </span>
        </div>

        <div className="sp-hcenter">
          {geocoding ? (
            <span className="sp-hgeocoding">
              <div className="sp-spinner" />
              Görüntü axtarılır...
            </span>
          ) : dragging ? (
            <span className="sp-hdragging">
              Dirək əlavə etmə istədiyiniz yerə buraxın
            </span>
          ) : pending.length > 0 ? (
            <span className="sp-hselected">
              <span className="sp-hselected-dot" />
              {pending.length} obyekt seçildi — "Təsdiq et" düyməsinə basın
            </span>
          ) : (
            <span className="sp-hhint">
              <span className="sp-hhint-dot" />
              Xəritəyə klik → növ seçin → görüntüdə yeri işarələyin → təsdiq
              edin
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
          <button className="sp-clear-btn" onClick={() => setShowConfirm(true)}>
            Hamısını təmizlə
          </button>
        </div>
      </header>

      <div className="sp-body">
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
            Küçəyə klik edin və ya sarı markeri sürükləyin
          </div>
          {dragging && (
            <div className="sp-drag-overlay">
              <div className="sp-drag-card">
                <div className="sp-drag-pulse" />
                360° görüntü olan ərazilərə buraxın
              </div>
            </div>
          )}
        </div>

        <div className="sp-panel">
          <div className="sp-sv-section">
            {!showSV || !svPos ? (
              <div className="sp-sv-placeholder">
                <div className="sp-sv-placeholder-icon">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#bb5d00"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <p className="sp-sv-placeholder-text">
                  Xəritədə küçəyə klik edin
                  <br />
                  360° görüntü açılacaq
                </p>
                <div className="sp-sv-placeholder-sub">
                  Növ seçin → görüntüdə yeri işarələyin → təsdiq edin
                </div>
              </div>
            ) : (
              <>
                <div className="sp-sv-header">
                  <div className="sp-sv-header-info">
                    <p className="sp-sv-address">{svPos.address}</p>
                    <p className="sp-sv-coord">
                      {(svPos.originLat ?? svPos.lat).toFixed(6)},{" "}
                      {(svPos.originLng ?? svPos.lng).toFixed(6)}
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

                <div className="sp-sv-body">
                  {svPos.imageId ? (
                    <>
                      <div ref={mlyDivRef} className="sp-mly-viewer" />

                      {pending.map((p) => {
                        const t = OBJECT_TYPES[p.typeId];
                        return (
                          <div
                            key={p.id}
                            className="sp-viewer-obj-marker"
                            style={{ left: p.pixel.x, top: p.pixel.y }}
                          >
                            <div
                              className="sp-viewer-obj-head"
                              style={{ background: t.markerGradient }}
                            >
                              <TypeIcon
                                typeId={p.typeId}
                                size={16}
                                color="#fff"
                              />
                            </div>
                            <div
                              className="sp-viewer-obj-stem"
                              style={{ background: t.markerColor }}
                            />
                          </div>
                        );
                      })}

                      {pending.length === 0 && (
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
                            Görüntüdə obyekt yerləşdirmək istədiyiniz yerə klik
                            edin
                          </span>
                        </div>
                      )}

                      <div className="sp-type-picker">
                        <div className="sp-type-row">
                          {Object.values(OBJECT_TYPES).map((t) => (
                            <button
                              key={t.id}
                              className={`sp-type-btn ${selectedType === t.id ? "active" : ""}`}
                              style={
                                selectedType === t.id
                                  ? {
                                      borderColor: t.markerColor,
                                      background: t.colorLight,
                                    }
                                  : {}
                              }
                              onClick={() => setSelectedType(t.id)}
                            >
                              <div
                                className="sp-type-btn-icon"
                                style={{
                                  background: t.colorLight,
                                  border: `1.5px solid ${t.colorBorder}`,
                                }}
                              >
                                <TypeIcon
                                  typeId={t.id}
                                  size={18}
                                  color={t.markerColor}
                                />
                              </div>
                              <span
                                className="sp-type-btn-label"
                                style={{
                                  color:
                                    selectedType === t.id
                                      ? t.markerColor
                                      : undefined,
                                }}
                              >
                                {t.label}
                              </span>
                            </button>
                          ))}
                        </div>

                        <div className="sp-action-bar">
                          {confirmedAnim ? (
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
                              {pending.length > 1
                                ? `${pending.length} obyekt əlavə edildi!`
                                : "Obyekt əlavə edildi!"}
                            </div>
                          ) : (
                            <>
                              <button
                                className="sp-add-btn"
                                style={{ flex: "1" }}
                                disabled
                                title="Görüntüdə yerə klik edərək obyekt əlavə edin"
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
                                Görüntüdə yer seçin
                              </button>
                              <button
                                className="sp-confirm-btn"
                                disabled={pending.length === 0}
                                onClick={confirmPending}
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
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Təsdiq edin{" "}
                                {pending.length > 0
                                  ? `(${pending.length})`
                                  : ""}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="sp-no-image-box">
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#bb5d00"
                        strokeWidth="1.5"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="3" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p>Küçə görüntüsü yoxdur</p>
                      <small className="sp-no-image-sub">
                        Yaxın başqa bir yerə klik edin
                      </small>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Feed */}
          <div className="sp-report-section">
            <div className="sp-report-top">
              <span className="sp-report-title">Əlavə olunanlar :</span>
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
                    stroke="#fed7aa"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>Əlavə olunmuş obyekt yoxdur</p>
                </div>
              ) : (
                report.map((r, i) => {
                  const t = OBJECT_TYPES[r.typeId] || OBJECT_TYPES.pole;
                  return (
                    <div key={i} className="sp-feed-card">
                      <div className="sp-feed-card-top">
                        <div
                          className="sp-feed-type-dot"
                          style={{ background: t.markerColor }}
                        />
                        <span className="sp-feed-action">
                          {t.emoji} {t.label}
                        </span>
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
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <div className="sp-modal-backdrop">
          <div className="sp-modal">
            <h3>Bütün obyektləri silmək istəyirsiniz?</h3>
            <div className="sp-modal-actions">
              <button
                className="sp-modal-cancel"
                onClick={() => setShowConfirm(false)}
              >
                Ləğv et
              </button>
              <button className="sp-modal-confirm" onClick={confirmClear}>
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
