import React, { useEffect, useRef } from "react";
import styles from "./WasteMap.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

const getDolulugColor = (dolulug) => {
  if (dolulug >= 80) return [239, 68, 68];
  if (dolulug >= 50) return [234, 179, 8];
  return [34, 197, 94];
};

const getDolulugSize = (dolulug) => {
  if (dolulug >= 80) return 22;
  if (dolulug >= 50) return 16;
  return 12;
};

const buildNovSvg = (nov, fillColor) => {
  const [r, g, b] = fillColor;
  const fill = `rgb(${r},${g},${b})`;
  const dark = `rgb(${Math.max(0, r - 50)},${Math.max(0, g - 50)},${Math.max(0, b - 50)})`;

  let inner = "";

  switch (nov) {
    case "Ümumi":
      inner = `
        <rect x="8" y="12" width="16" height="16" rx="2" fill="${fill}" stroke="${dark}" stroke-width="2"/>
        <rect x="6" y="8" width="20" height="5" rx="1.5" fill="${fill}" stroke="${dark}" stroke-width="2"/>
        <line x1="16" y1="8" x2="16" y2="4" stroke="${dark}" stroke-width="2" stroke-linecap="round"/>
        <line x1="12" y1="16" x2="12" y2="24" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="16" y1="16" x2="16" y2="24" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="20" y1="16" x2="20" y2="24" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
      `;
      break;

    case "Plastik":
      inner = `
        <path d="M16 5 L20 11 H17 L17 16 H15 L15 11 H12 Z" fill="${fill}" stroke="${dark}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M23 13 L26 19 L23 19 L20 24 L18 22 L21 17 H19 Z" fill="${fill}" stroke="${dark}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M9 13 L6 19 L9 19 L12 24 L14 22 L11 17 H13 Z" fill="${fill}" stroke="${dark}" stroke-width="1.2" stroke-linejoin="round"/>
      `;
      break;

    case "Üzvi":
      inner = `
        <path d="M16 6 C10 6 6 11 8 18 C10 24 16 26 20 22 C26 16 24 6 16 6 Z" fill="${fill}" stroke="${dark}" stroke-width="2"/>
        <line x1="16" y1="26" x2="16" y2="14" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="16" y1="20" x2="12" y2="16" stroke="${dark}" stroke-width="1.2" stroke-linecap="round"/>
        <line x1="16" y1="17" x2="20" y2="13" stroke="${dark}" stroke-width="1.2" stroke-linecap="round"/>
      `;
      break;

    case "Kağız":
      inner = `
        <rect x="8" y="5" width="16" height="22" rx="2" fill="${fill}" stroke="${dark}" stroke-width="2"/>
        <line x1="11" y1="11" x2="21" y2="11" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="11" y1="15" x2="21" y2="15" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
        <line x1="11" y1="19" x2="17" y2="19" stroke="${dark}" stroke-width="1.5" stroke-linecap="round"/>
      `;
      break;

    default:
      inner = `<circle cx="16" cy="16" r="10" fill="${fill}" stroke="${dark}" stroke-width="2"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${inner}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const LEGEND_COLOR = [100, 116, 139];
const NOV_TYPES = ["Ümumi", "Plastik", "Üzvi", "Kağız"];
const NOV_LABELS = {
  Ümumi: "Ümumi",
  Plastik: "Plastik",
  Üzvi: "Üzvi",
  Kağız: "Kağız",
};

const LEGEND_SVG_URLS = Object.fromEntries(
  NOV_TYPES.map((nov) => [nov, buildNovSvg(nov, LEGEND_COLOR)]),
);

const WasteMap = ({ wastePoints, selected, onSelect }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const wasteLayerRef = useRef(null);
  const labelLayerRef = useRef(null);
  const pulseLayerRef = useRef(null);
  const animFrameRef = useRef(null);
  const animStartRef = useRef(null);
  const criticalPointsRef = useRef([]);

  useEffect(() => {
    const pulseLayer = new GraphicsLayer();
    const wasteLayer = new GraphicsLayer();
    const labelLayer = new GraphicsLayer();

    pulseLayerRef.current = pulseLayer;
    wasteLayerRef.current = wasteLayer;
    labelLayerRef.current = labelLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [pulseLayer, wasteLayer, labelLayer],
    });

    const view = new MapView({
      container: mapRef.current,
      map,
      center: [49.8671, 40.4093],
      zoom: 12,
      popup: { autoOpenEnabled: false },
      ui: { components: ["zoom"] },
    });
    viewRef.current = view;

    view.on("click", async (e) => {
      const hit = await view.hitTest(e);
      const res = hit.results.find(
        (r) => r.graphic?.attributes?.id && r.graphic?.layer === wasteLayer,
      );
      if (res) onSelect(res.graphic.attributes);
      else onSelect(null);
    });

    const animate = (timestamp) => {
      if (!animStartRef.current) animStartRef.current = timestamp;
      const t = timestamp - animStartRef.current;
      const pulse = pulseLayerRef.current;
      const points = criticalPointsRef.current;

      if (pulse && points.length > 0) {
        pulse.removeAll();
        points.forEach(({ lng, lat }) => {
          [0, 0.33, 0.66].forEach((phaseOffset) => {
            const phase = (t / 3600 + phaseOffset) % 1;
            const sinVal = Math.sin(phase * Math.PI);
            const size = 20 + sinVal * 50;
            const opacity = 0.3 * (1 - sinVal);
            pulse.add(
              new Graphic({
                geometry: { type: "point", longitude: lng, latitude: lat },
                symbol: {
                  type: "simple-marker",
                  color: [239, 68, 68, opacity],
                  outline: { color: [239, 68, 68, opacity * 1.5], width: 1.5 },
                  size: `${Math.round(size)}px`,
                },
              }),
            );
          });
        });
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      view.destroy();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  useEffect(() => {
    const wasteLayer = wasteLayerRef.current;
    const labelLayer = labelLayerRef.current;
    if (!wasteLayer || !labelLayer) return;
    if (!wastePoints || wastePoints.length === 0) return;

    wasteLayer.removeAll();
    labelLayer.removeAll();

    criticalPointsRef.current = wastePoints
      .filter((item) => item.dolulug >= 80)
      .map((item) => ({ lng: item.lng, lat: item.lat }));

    wastePoints.forEach((item) => {
      const color = getDolulugColor(item.dolulug);
      const isSelected = selected?.id === item.id;
      const markerSize = isSelected ? 26 : getDolulugSize(item.dolulug);

      if (isSelected) {
        wasteLayer.add(
          new Graphic({
            geometry: {
              type: "point",
              longitude: item.lng,
              latitude: item.lat,
            },
            symbol: {
              type: "simple-marker",
              color: [...color, 35],
              outline: { color: [...color, 180], width: 2 },
              size: `${markerSize + 14}px`,
            },
            attributes: {},
          }),
        );
      }

      const iconUrl = buildNovSvg(item.növ, color);
      wasteLayer.add(
        new Graphic({
          geometry: { type: "point", longitude: item.lng, latitude: item.lat },
          symbol: {
            type: "picture-marker",
            url: iconUrl,
            width: `${markerSize}px`,
            height: `${markerSize}px`,
          },
          attributes: item,
        }),
      );

      const [lr, lg, lb] = color;
      labelLayer.add(
        new Graphic({
          geometry: { type: "point", longitude: item.lng, latitude: item.lat },
          symbol: {
            type: "text",
            text: `%${item.dolulug}`,
            color: [lr, lg, lb],
            haloColor: [255, 255, 255],
            haloSize: "2px",
            font: {
              size: isSelected ? 11 : 9,
              weight: "bold",
            },
            yoffset: markerSize / 1.6,
          },
          attributes: {},
        }),
      );
    });
  }, [wastePoints, selected]);

  useEffect(() => {
    if (!selected || !viewRef.current) return;
    viewRef.current.goTo(
      { center: [selected.lng, selected.lat], zoom: 15 },
      { duration: 600 },
    );
  }, [selected]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapRef} className={styles.map} />

      <div className={styles.legend}>
        {/* Dolulug rəngləri */}
        <div className={styles.legendSection}>
          {[
            { label: "Kritik (≥80%)", color: "rgb(239,68,68)" },
            { label: "Orta (50–79%)", color: "rgb(234,179,8)" },
            { label: "Normal (<50%)", color: "rgb(34,197,94)" },
          ].map(({ label, color }) => (
            <div key={label} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.legendDivider} />
      </div>
    </div>
  );
};

export default WasteMap;
