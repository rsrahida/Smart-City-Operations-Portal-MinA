import React, { useEffect, useRef, useState } from "react";
import styles from "./Map.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

const makeIcon = (emoji, bgColor) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42">
      <ellipse cx="18" cy="40" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
      <path d="M18 2 C9 2 2 9 2 18 C2 27 18 40 18 40 C18 40 34 27 34 18 C34 9 27 2 18 2Z"
            fill="${bgColor}" stroke="white" stroke-width="2"/>
      <text x="18" y="23" text-anchor="middle" font-size="14">${emoji}</text>
    </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const ICONS = {
  complaints: makeIcon("🚧", "#F97316"),
  streetLights: makeIcon("💡", "#EAB308"),
  wastePoints: makeIcon("🗑️", "#22C55E"),
  permits: makeIcon("🏗️", "#3B82F6"),
  trafficIncidents: makeIcon("🚨", "#EF4444"),
};

const LAYER_CONFIG = [
  { key: "complaints", label: "Yol Şikayətləri", icon: "🚧", color: "#F97316" },
  { key: "streetLights", label: "Küçə İşıqları", icon: "💡", color: "#EAB308" },
  {
    key: "wastePoints",
    label: "Tullantı Məntəqələri",
    icon: "🗑️",
    color: "#22C55E",
  },
  { key: "permits", label: "Tikinti İcazələri", icon: "🏗️", color: "#3B82F6" },
  {
    key: "trafficIncidents",
    label: "NQ Hadisələri",
    icon: "🚨",
    color: "#EF4444",
  },
];

const CATEGORY_META = {
  complaints: { label: "Yol Şikayəti", color: "#F97316", bg: "#fff7ed" },
  streetLights: { label: "Küçə İşığı", color: "#EAB308", bg: "#fefce8" },
  wastePoints: { label: "Tullantı Məntəqəsi", color: "#22C55E", bg: "#f0fdf4" },
  permits: { label: "Tikinti İcazəsi", color: "#3B82F6", bg: "#eff6ff" },
  trafficIncidents: {
    label: "Yol-nəqliyyat hadisəsi",
    color: "#EF4444",
    bg: "#fef2f2",
  },
};

const STATUS_COLORS = {
  Yeni: { bg: "#fef3c7", text: "#d97706" },
  İcradadır: { bg: "#dbeafe", text: "#2563eb" },
  "Həll edildi": { bg: "#dcfce7", text: "#16a34a" },
  Aktiv: { bg: "#fee2e2", text: "#dc2626" },
  Təsdiqləndi: { bg: "#dcfce7", text: "#16a34a" },
  Gözləyir: { bg: "#fef3c7", text: "#d97706" },
  "Rədd edildi": { bg: "#fee2e2", text: "#dc2626" },
};

const SEVERITY_COLORS = {
  Yüksək: { bg: "#fee2e2", text: "#dc2626" },
  Orta: { bg: "#fef3c7", text: "#d97706" },
  Aşağı: { bg: "#dcfce7", text: "#16a34a" },
};

const Badge = ({ value, colorMap }) => {
  const c = colorMap[value] ?? { bg: "#f3f4f6", text: "#374151" };
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {value}
    </span>
  );
};

const Field = ({ icon, label, value }) => (
  <div className={styles.field}>
    {icon && <span className={styles.fieldIcon}>{icon}</span>}
    <span className={styles.fieldLabel}>{label}:</span>
    <span className={styles.fieldValue}>{value}</span>
  </div>
);

const PanelContent = ({ item, category }) => {
  if (category === "complaints")
    return (
      <div className={styles.panelFields}>
        <Field label="Rayon" value={item.rayon} />
        <Field
          label="Status"
          value={<Badge value={item.status} colorMap={STATUS_COLORS} />}
        />
        <Field label="Şikayət tarixi" value={item.date ?? "—"} />
      </div>
    );

  if (category === "streetLights")
    return (
      <div className={styles.panelFields}>
        <Field
          label="Status"
          value={<Badge value={item.status} colorMap={STATUS_COLORS} />}
        />
        <Field label="Rayon" value={item.rayon ?? "—"} />
        <Field label="Qeydiyyat tarixi" value={item.date ?? "—"} />
      </div>
    );

  if (category === "wastePoints") {
    const pct = item.dolulug;
    const barColor = pct >= 80 ? "#ef4444" : pct >= 50 ? "#eab308" : "#22c55e";
    const verdict =
      pct >= 80
        ? "🔴 Təcili boşaldılmalıdır"
        : pct >= 50
          ? "🟡 Yaxın zamanda boşaldılsın"
          : "🟢 Normal vəziyyətdədir";
    return (
      <div className={styles.panelFields}>
        <Field icon="🗑️" label="Doluluq faizi" value={`${pct}%`} />
        <div className={styles.progressBg}>
          <div
            className={styles.progressFill}
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
        <Field label="Vəziyyət" value={verdict} />
        <Field label="Son yoxlama" value={item.date ?? "—"} />
      </div>
    );
  }

  if (category === "permits")
    return (
      <div className={styles.panelFields}>
        <Field icon="🏗️" label="Növ" value={item.type ?? "Tikinti"} />
        <Field
          label="Status"
          value={<Badge value={item.status} colorMap={STATUS_COLORS} />}
        />
        <Field label="Müraciətçi" value={item.muracietci ?? "—"} />
        <Field label="Müraciət tarixi" value={item.date ?? "—"} />
      </div>
    );

  if (category === "trafficIncidents")
    return (
      <div className={styles.panelFields}>
        <Field
          label="Şiddət"
          value={<Badge value={item.severity} colorMap={SEVERITY_COLORS} />}
        />
        <Field label="Rayon" value={item.rayon ?? "—"} />
        <Field label="Vaxt" value={item.time ?? "—"} />
        <Field label="Hadisə tarixi" value={item.date ?? "—"} />
      </div>
    );

  return null;
};

const PANEL_WIDTH = 280;

const refreshLayer = (layer, mockData, storageKey, iconUrl, category) => {
  const custom = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const all = [...mockData, ...custom];
  layer.removeAll();
  all.forEach((item) => {
    layer.add(
      new Graphic({
        geometry: { type: "point", longitude: item.lng, latitude: item.lat },
        symbol: {
          type: "picture-marker",
          url: iconUrl,
          width: "32px",
          height: "38px",
        },
        attributes: { ...item, _category: category },
      }),
    );
  });
};

const MapComponent = ({ onMapReady }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const layersRef = useRef({});

  const mockComplaintsRef = useRef([]);
  const mockStreetLightsRef = useRef([]);
  const mockWasteRef = useRef([]);
  const mockPermitsRef = useRef([]);
  const mockTrafficRef = useRef([]);

  const [selected, setSelected] = useState(null);
  const [visibleLayers, setVisibleLayers] = useState({
    complaints: true,
    streetLights: true,
    wastePoints: true,
    permits: true,
    trafficIncidents: true,
  });

  useEffect(() => {
    const initMap = async () => {
      const res = await fetch("/mockData.json");
      const data = await res.json();

      mockComplaintsRef.current = data.complaints || [];
      mockStreetLightsRef.current = data.streetLights || [];
      mockWasteRef.current = data.wastePoints || [];
      mockPermitsRef.current = data.permits || [];
      mockTrafficRef.current = data.trafficIncidents || [];

      const customComplaints = JSON.parse(
        localStorage.getItem("roadIssues_custom") || "[]",
      );
      const customLights = JSON.parse(
        localStorage.getItem("streetLights_custom") || "[]",
      );
      const customWaste = JSON.parse(
        localStorage.getItem("wasteCollections_custom") || "[]",
      );
      const customPermits = JSON.parse(
        localStorage.getItem("constructionPermits_custom") || "[]",
      );
      const customTraffic = JSON.parse(
        localStorage.getItem("trafficIncidents_custom") || "[]",
      );

      const complaintsLayer = new GraphicsLayer({ title: "Şikayətlər" });
      const streetLightsLayer = new GraphicsLayer({ title: "Küçə İşıqları" });
      const wasteLayer = new GraphicsLayer({ title: "Tullantı" });
      const permitsLayer = new GraphicsLayer({ title: "Tikinti İcazələri" });
      const trafficLayer = new GraphicsLayer({ title: "NQ Hadisələri" });

      layersRef.current = {
        complaints: complaintsLayer,
        streetLights: streetLightsLayer,
        wastePoints: wasteLayer,
        permits: permitsLayer,
        trafficIncidents: trafficLayer,
      };

      const addMarkers = (layer, arr, iconUrl, category) => {
        arr.forEach((item) => {
          layer.add(
            new Graphic({
              geometry: {
                type: "point",
                longitude: item.lng,
                latitude: item.lat,
              },
              symbol: {
                type: "picture-marker",
                url: iconUrl,
                width: "32px",
                height: "38px",
              },
              attributes: { ...item, _category: category },
            }),
          );
        });
      };

      addMarkers(
        complaintsLayer,
        [...mockComplaintsRef.current, ...customComplaints],
        ICONS.complaints,
        "complaints",
      );
      addMarkers(
        streetLightsLayer,
        [...mockStreetLightsRef.current, ...customLights],
        ICONS.streetLights,
        "streetLights",
      );
      addMarkers(
        wasteLayer,
        [...mockWasteRef.current, ...customWaste],
        ICONS.wastePoints,
        "wastePoints",
      );
      addMarkers(
        permitsLayer,
        [...mockPermitsRef.current, ...customPermits],
        ICONS.permits,
        "permits",
      );
      addMarkers(
        trafficLayer,
        [...mockTrafficRef.current, ...customTraffic],
        ICONS.trafficIncidents,
        "trafficIncidents",
      );

      const map = new Map({
        basemap: "streets-navigation-vector",
        layers: [
          complaintsLayer,
          streetLightsLayer,
          wasteLayer,
          permitsLayer,
          trafficLayer,
        ],
      });

      const view = new MapView({
        container: mapRef.current,
        map,
        center: [49.8671, 40.4093],
        zoom: 12,
        popup: { autoOpenEnabled: false },
      });
      viewRef.current = view;

      view.when(() => {
        setTimeout(() => {
          if (onMapReady) onMapReady();
        }, 2000);
      });

      view.on("click", async (event) => {
        const hit = await view.hitTest(event);
        const result = hit.results.find(
          (r) => r.graphic?.attributes?._category,
        );

        if (result) {
          const attrs = result.graphic.attributes;
          const screen = view.toScreen(result.graphic.geometry);
          const mapWidth = mapRef.current?.offsetWidth ?? window.innerWidth;
          const clampedX = Math.min(
            Math.max(screen.x - PANEL_WIDTH / 2, 8),
            mapWidth - PANEL_WIDTH - 8,
          );

          setSelected({
            item: attrs,
            category: attrs._category,
            x: clampedX,
            y: screen.y,
          });
        } else {
          setSelected(null);
        }
      });
    };

    initMap();

    const onComplaintsStorage = () =>
      refreshLayer(
        layersRef.current.complaints,
        mockComplaintsRef.current,
        "roadIssues_custom",
        ICONS.complaints,
        "complaints",
      );
    const onLightsStorage = () =>
      refreshLayer(
        layersRef.current.streetLights,
        mockStreetLightsRef.current,
        "streetLights_custom",
        ICONS.streetLights,
        "streetLights",
      );
    const onWasteStorage = () =>
      refreshLayer(
        layersRef.current.wastePoints,
        mockWasteRef.current,
        "wasteCollections_custom",
        ICONS.wastePoints,
        "wastePoints",
      );
    const onPermitsStorage = () =>
      refreshLayer(
        layersRef.current.permits,
        mockPermitsRef.current,
        "constructionPermits_custom",
        ICONS.permits,
        "permits",
      );
    const onTrafficStorage = () =>
      refreshLayer(
        layersRef.current.trafficIncidents,
        mockTrafficRef.current,
        "trafficIncidents_custom",
        ICONS.trafficIncidents,
        "trafficIncidents",
      );

    window.addEventListener("storage", onComplaintsStorage);
    window.addEventListener("storage", onLightsStorage);
    window.addEventListener("storage", onWasteStorage);
    window.addEventListener("storage", onPermitsStorage);
    window.addEventListener("storage", onTrafficStorage);

    return () => {
      viewRef.current?.destroy();
      window.removeEventListener("storage", onComplaintsStorage);
      window.removeEventListener("storage", onLightsStorage);
      window.removeEventListener("storage", onWasteStorage);
      window.removeEventListener("storage", onPermitsStorage);
      window.removeEventListener("storage", onTrafficStorage);
    };
  }, []);

  const toggleLayer = (key) => {
    setVisibleLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (layersRef.current[key]) {
        layersRef.current[key].visible = next[key];
      }
      if (selected?.category === key && next[key] === false) {
        setSelected(null);
      }
      return next;
    });
  };

  const meta = selected ? CATEGORY_META[selected.category] : null;

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapRef} className={styles.mapContainer} />

      {selected && (
        <div
          className={styles.panel}
          style={{
            left: selected.x,
            top: selected.y,
            transform: "translateY(calc(-100% - 44px))",
            borderTop: `4px solid ${meta.color}`,
          }}
        >
          <div className={styles.panelHeader} style={{ background: meta.bg }}>
            <div>
              <div
                className={styles.panelCategory}
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
              <div className={styles.panelTitle}>{selected.item.title}</div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => setSelected(null)}
            >
              ✕
            </button>
          </div>

          <PanelContent item={selected.item} category={selected.category} />
          <div className={styles.arrow} />
        </div>
      )}

      <div className={styles.layerControl}>
        {LAYER_CONFIG.map(({ key, label, icon, color }) => {
          const isActive = visibleLayers[key];
          return (
            <button
              key={key}
              className={`${styles.layerBtn} ${isActive ? styles.layerBtnActive : styles.layerBtnInactive}`}
              style={
                isActive ? { borderColor: color, background: `${color}15` } : {}
              }
              onClick={() => toggleLayer(key)}
            >
              <span className={styles.layerBtnIcon}>{icon}</span>
              <span className={styles.layerBtnLabel}>{label}</span>
              <span
                className={styles.layerBtnDot}
                style={{ background: isActive ? color : "#d1d5db" }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MapComponent;
