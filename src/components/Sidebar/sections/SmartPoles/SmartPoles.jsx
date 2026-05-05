import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./SmartPoles.module.css";

const L_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const L_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadScript(src) {
  return new Promise(r => {
    if (document.querySelector(`script[src="${src}"]`)) return r();
    const s = document.createElement("script"); s.src = src; s.onload = r;
    document.head.appendChild(s);
  });
}
function loadLink(href) {
  if (!document.querySelector(`link[href="${href}"]`)) {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href;
    document.head.appendChild(l);
  }
}

async function geocode(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "az,en" } }
    );
    const d = await r.json();
    return d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
}

function svUrl(lat, lng) {
  return `https://www.google.com/maps?q=&layer=c&cbll=${lat},${lng}&cbp=12,0,0,0,0&output=svembed`;
}

export default function SmartPoles() {
  const mapDivRef  = useRef(null);
  const mapRef     = useRef(null);
  const markersRef = useRef([]);
  const pegRef     = useRef(null);
  const dzRef      = useRef(null);
  const clickMarkerRef = useRef(null); // müvəqqəti klik markeri

  const [poles,      setPoles]      = useState([]);
  const [svPos,      setSvPos]      = useState(null);
  const [showSV,     setShowSV]     = useState(false);
  const [dragging,   setDragging]   = useState(false);
  const [geocoding,  setGeocoding]  = useState(false);
  const [report,     setReport]     = useState([]);
  const [clickMode,  setClickMode]  = useState(true); // xəritə klik rejimi default açıq
  const [addedAnim,  setAddedAnim]  = useState(false);

  /* ── MAP INIT ── */
  useEffect(() => {
    let dead = false;
    (async () => {
      loadLink(L_CSS);
      await loadScript(L_JS);
      if (dead || !mapDivRef.current || mapRef.current) return;
      const L = window.L;

      const map = L.map(mapDivRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([40.3690, 49.8400], 16);

      const carto = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO", maxZoom: 19, crossOrigin: true }
      );
      carto.addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);
      mapRef.current = map;

      /* ── XƏRİTƏYƏ KLİK → Street View + dirək preview ── */
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;

        // Əvvəlki müvəqqəti markeri sil
        if (clickMarkerRef.current) {
          clickMarkerRef.current.remove();
          clickMarkerRef.current = null;
        }

        // Müvəqqəti "seçilmiş yer" markeri göstər
        const previewIcon = L.divIcon({
          className: "",
          html: `<div style="
            width:36px;height:36px;border-radius:50%;
            background:linear-gradient(145deg,#38bdf8,#0ea5e9);
            border:3px solid #fff;
            box-shadow:0 0 0 6px rgba(56,189,248,0.25), 0 4px 16px rgba(56,189,248,0.5);
            display:flex;align-items:center;justify-content:center;
            animation: pulseIn 0.3s ease;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>`,
          iconSize: [36, 36], iconAnchor: [18, 18],
        });

        const tmpMarker = L.marker([lat, lng], { icon: previewIcon, zIndexOffset: 1000 }).addTo(map);
        clickMarkerRef.current = tmpMarker;

        // Geocode + Street View aç
        setGeocoding(true);
        setShowSV(false);
        const address = await geocode(lat, lng);
        setGeocoding(false);
        setSvPos({ lat, lng, address });
        setShowSV(true);
      });

      /* ── PEGMAN ── */
      const pegIcon = L.divIcon({
        className: "",
        html: `<div id="pegman" title="Sürüklə" style="
          width:44px;height:44px;border-radius:50%;
          background:linear-gradient(145deg,#facc15,#f59e0b);
          border:3px solid #fff;
          box-shadow:0 4px 16px rgba(250,204,21,.5);
          display:flex;align-items:center;justify-content:center;
          cursor:grab;transition:transform .15s,box-shadow .15s;
          user-select:none;"
          onmouseover="this.style.transform='scale(1.1)';this.style.boxShadow='0 6px 24px rgba(250,204,21,.7)'"
          onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 16px rgba(250,204,21,.5)'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e293b" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="#1e293b"/>
          </svg>
        </div>`,
        iconSize: [44, 44], iconAnchor: [22, 22],
      });

      const getPegStartPos = () => {
        const b = map.getBounds();
        const sw = map.latLngToContainerPoint(b.getSouthWest());
        return map.containerPointToLatLng([sw.x + 70, sw.y - 90]);
      };

      const peg = L.marker(getPegStartPos(), {
        icon: pegIcon, draggable: true, zIndexOffset: 2000,
      }).addTo(map);
      pegRef.current = peg;

      peg.on("dragstart", () => {
        setDragging(true);
        map.getContainer().style.cursor = "grabbing";
      });

      peg.on("drag", () => {
        const ll = peg.getLatLng();
        if (dzRef.current) dzRef.current.setLatLng(ll);
        else {
          dzRef.current = L.circleMarker(ll, {
            radius: 18, color: "#38bdf8", fillColor: "#38bdf8",
            fillOpacity: .2, weight: 2, dashArray: "5 3",
          }).addTo(map);
        }
      });

      peg.on("dragend", async () => {
        setDragging(false);
        map.getContainer().style.cursor = "";
        if (dzRef.current) { dzRef.current.remove(); dzRef.current = null; }
        const { lat, lng } = peg.getLatLng();
        setGeocoding(true);
        const address = await geocode(lat, lng);
        setGeocoding(false);
        setSvPos({ lat, lng, address });
        setShowSV(true);
        peg.setLatLng(getPegStartPos());
      });

      map.on("moveend zoomend", () => {
        if (pegRef.current) pegRef.current.setLatLng(getPegStartPos());
      });
    })();
    return () => { dead = true; };
  }, []);

  /* ── POLE MARKERLƏRİ ── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.L) return;
    const L = window.L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    poles.forEach((pole) => {
      const icon = L.divIcon({
        className: "",
        html: `<div style="display:flex;flex-direction:column;align-items:center;">
          <div style="
            width:34px;height:34px;border-radius:50%;
            background:linear-gradient(145deg,#22c55e,#16a34a);
            border:2.5px solid #fff;
            box-shadow:0 3px 12px rgba(34,197,94,.5);
            display:flex;align-items:center;justify-content:center;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="#fff" stroke-width="2.5" stroke-linecap="round">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M8 6 Q12 1 16 6"/>
              <circle cx="12" cy="5.5" r="2" fill="#fff"/>
            </svg>
          </div>
          <div style="width:2px;height:8px;background:#22c55e;opacity:.6;"></div>
        </div>`,
        iconSize: [34, 44], iconAnchor: [17, 44],
      });
      const m = L.marker([pole.lat, pole.lng], { icon })
        .addTo(map)
        .bindTooltip(`<b>${pole.label}</b><br/><small>${pole.address.slice(0,40)}...</small>`, {
          direction: "top", offset: [0, -46], className: "sp-tooltip"
        });
      markersRef.current.push(m);
    });
  }, [poles]);

  /* ── DİRƏK ƏLAVƏ ET ── */
  const addPole = useCallback(() => {
    if (!svPos) return;

    // Eyni koordinata təkrar əlavəni önlə
    const exists = poles.some(
      p => Math.abs(p.lat - svPos.lat) < 0.00005 && Math.abs(p.lng - svPos.lng) < 0.00005
    );
    if (exists) return;

    const pole = {
      id: Date.now(),
      lat: svPos.lat, lng: svPos.lng,
      label: `Dirək #${poles.length + 1}`,
      address: svPos.address,
    };
    setPoles(p => [...p, pole]);
    setReport(r => [{
      time: new Date().toLocaleTimeString("az-AZ"),
      ...pole, lat: svPos.lat.toFixed(6), lng: svPos.lng.toFixed(6),
      action: "İşıq dirəyi əlavə edildi",
    }, ...r]);

    // Müvəqqəti mavi markeri sil (artıq yaşıl marker gələcək)
    if (clickMarkerRef.current) {
      clickMarkerRef.current.remove();
      clickMarkerRef.current = null;
    }

    mapRef.current?.flyTo([svPos.lat, svPos.lng], 18, { duration: 1 });

    // Uğur animasiyası
    setAddedAnim(true);
    setTimeout(() => setAddedAnim(false), 2000);
  }, [svPos, poles]);

  /* ══════════════════════════════════════════════════════════════════ */
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.hBrand}>
          <div className={styles.hLogo}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="2" x2="12" y2="22"/>
              <path d="M8 6 Q12 1 16 6"/>
              <circle cx="12" cy="5.5" r="2" fill="#0f172a"/>
            </svg>
          </div>
          <span className={styles.hTitle}>Smart Poles</span>
          <div className={styles.hBadge}>{poles.length} dirək</div>
        </div>

        <div className={styles.hCenter}>
          {geocoding
            ? <span className={styles.hGeocoding}><span className={styles.spinner}/> Ünvan tapılır...</span>
            : dragging
            ? <span className={styles.hDragging}>📍 İstədiyin yerə burax</span>
            : <span className={styles.hHint}>
                <span className={styles.hClickDot}/>
                Xəritəyə klik et → Street View aç → Dirək əlavə et
              </span>
          }
        </div>

        <div className={styles.hStats}>
          <div className={styles.hStat}>
            <span className={styles.hStatN}>{poles.length}</span>
            <span className={styles.hStatL}>Dirək</span>
          </div>
          <div className={styles.hStatDiv}/>
          <div className={styles.hStat}>
            <span className={styles.hStatN}>{report.length}</span>
            <span className={styles.hStatL}>Əməliyyat</span>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* MAP */}
        <div className={styles.mapCol}>
          <div ref={mapDivRef} className={`${styles.map} ${styles.mapClickMode}`}/>

          {/* Klik rejimi hint */}
          <div className={styles.mapHint}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
            Küçəyə klik et
          </div>

          {dragging && (
            <div className={styles.dragOverlay}>
              <div className={styles.dragCard}>
                <div className={styles.dragPulse}/>
                Street View üçün buraxın
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.panel}>

          {/* SV section */}
          <div className={styles.svSection}>
            {showSV && svPos ? (
              <>
                <div className={styles.svHeader}>
                  <div className={styles.svHeaderInfo}>
                    <div className={styles.svBadge}>Street View</div>
                    <p className={styles.svAddress}>{svPos.address}</p>
                    <p className={styles.svCoord}>{svPos.lat.toFixed(6)}, {svPos.lng.toFixed(6)}</p>
                  </div>
                  <button className={styles.svCloseBtn} onClick={() => {
                    setShowSV(false);
                    if (clickMarkerRef.current) {
                      clickMarkerRef.current.remove();
                      clickMarkerRef.current = null;
                    }
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div className={styles.svBody}>
                  <iframe
                    key={`${svPos.lat}-${svPos.lng}`}
                    title="Street View"
                    className={styles.svIframe}
                    src={svUrl(svPos.lat, svPos.lng)}
                    allowFullScreen loading="eager"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <div className={styles.svFooterOverlay}>
                    {addedAnim ? (
                      <div className={styles.addedSuccess}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Dirək əlavə edildi!
                      </div>
                    ) : (
                      <button className={styles.addBtn} onClick={addPole}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Bu yerə işıq dirəyi əlavə et
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className={styles.svPlaceholder}>
                <div className={styles.svPlaceholderIcon}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    <circle cx="12" cy="9" r="2.5"/>
                  </svg>
                </div>
                <p className={styles.svPlaceholderText}>
                  Xəritədə istənilən yola<br/>və ya küçəyə klik et
                </p>
                <div className={styles.svPlaceholderSub}>Street View avtomatik açılacaq</div>
              </div>
            )}
          </div>

          {/* REPORT section */}
          <div className={styles.reportSection}>
            <div className={styles.reportTop}>
              <div className={styles.reportTitle}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                Hesabat
              </div>
              {report.length > 0 && (
                <span className={styles.reportBadge}>{report.length}</span>
              )}
            </div>

            <div className={styles.feed}>
              {report.length === 0 ? (
                <div className={styles.feedEmpty}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p>Hələ əməliyyat yoxdur</p>
                </div>
              ) : report.map((r, i) => (
                <div key={i} className={styles.feedCard}>
                  <div className={styles.feedCardTop}>
                    <div className={styles.feedDot}/>
                    <span className={styles.feedAction}>{r.action}</span>
                    <span className={styles.feedTime}>{r.time}</span>
                  </div>
                  <p className={styles.feedLabel}>{r.label}</p>
                  <p className={styles.feedAddr}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                    </svg>
                    {r.address}
                  </p>
                  <p className={styles.feedCoord}>{r.lat}, {r.lng}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}