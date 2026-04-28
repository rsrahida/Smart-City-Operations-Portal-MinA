import React, { useEffect, useRef } from "react";
import styles from "./PermitMap.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

const STATUS_COLORS = {
  Təsdiqləndi: [34, 197, 94],
  Gözləyir: [234, 179, 8],
  "Rədd edildi": [239, 68, 68],
};

const buildSvgUrl = (shape, fillColor, strokeColor, size) => {
  const [fr, fg, fb] = fillColor;
  const [sr, sg, sb] = strokeColor;
  const fill = `rgb(${fr},${fg},${fb})`;
  const stroke = `rgb(${sr},${sg},${sb})`;

  let path = "";

  switch (shape) {
    case "home":
      path = `
        <polygon points="16,4 28,14 28,28 20,28 20,20 12,20 12,28 4,28 4,14" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>
        <polyline points="2,15 16,3 30,15" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
      `;
      break;

    case "building":
      path = `
        <rect x="5" y="6" width="22" height="24" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="1"/>
        <rect x="9" y="10" width="4" height="4" fill="${stroke}" opacity="0.5"/>
        <rect x="19" y="10" width="4" height="4" fill="${stroke}" opacity="0.5"/>
        <rect x="9" y="18" width="4" height="4" fill="${stroke}" opacity="0.5"/>
        <rect x="19" y="18" width="4" height="4" fill="${stroke}" opacity="0.5"/>
        <rect x="13" y="22" width="6" height="8" fill="${stroke}" opacity="0.4"/>
      `;
      break;

    case "road":
      path = `
        <rect x="3" y="12" width="26" height="8" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2"/>
        <line x1="16" y1="14" x2="16" y2="18" stroke="white" stroke-width="2" stroke-dasharray="2,2"/>
        <polygon points="22,8 30,16 22,16" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      `;
      break;

    case "factory":
      path = `
        <rect x="4" y="16" width="24" height="14" fill="${fill}" stroke="${stroke}" stroke-width="2" rx="1"/>
        <rect x="8" y="10" width="5" height="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <rect x="17" y="8" width="5" height="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <line x1="8" y1="16" x2="8" y2="10" stroke="${stroke}" stroke-width="1.5"/>
        <line x1="24" y1="16" x2="24" y2="6" stroke="${stroke}" stroke-width="2"/>
      `;
      break;

    case "public":
      path = `
        <rect x="4" y="26" width="24" height="3" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <rect x="4" y="10" width="24" height="3" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <rect x="4" y="4" width="24" height="4" fill="${fill}" stroke="${stroke}" stroke-width="1.5" rx="1"/>
        <rect x="7" y="13" width="3" height="13" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <rect x="14.5" y="13" width="3" height="13" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
        <rect x="22" y="13" width="3" height="13" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
      `;
      break;
    default:
      path = `<circle cx="16" cy="16" r="10" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">${path}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const TYPE_SHAPES = {
  Yaşayış: "home",
  Kommersiya: "building",
  İnfrastruktur: "road",
  Sənaye: "factory",
  İctimai: "public",
};

const LEGEND_ICON_SIZE = 20;
const LEGEND_COLOR = [100, 116, 139];
const LEGEND_STROKE = [51, 65, 85];

const TYPE_LEGEND_URLS = Object.fromEntries(
  Object.entries(TYPE_SHAPES).map(([type, shape]) => [
    type,
    buildSvgUrl(shape, LEGEND_COLOR, LEGEND_STROKE, LEGEND_ICON_SIZE),
  ]),
);

const SIZE_SMALL_URL = buildSvgUrl("home", LEGEND_COLOR, LEGEND_STROKE, 14);
const SIZE_LARGE_URL = buildSvgUrl("building", LEGEND_COLOR, LEGEND_STROKE, 22);

const getIconSize = (mertebe) => {
  const floors = mertebe ?? 0;
  const min = 22;
  const max = 42;
  const maxFloors = 24;
  return Math.round(
    min + (Math.min(floors, maxFloors) / maxFloors) * (max - min),
  );
};

const PermitMap = ({ permits, selected, onSelect }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const layer = new GraphicsLayer();
    layerRef.current = layer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [layer],
    });

    const view = new MapView({
      container: mapRef.current,
      map,
      center: [49.8671, 40.4093],
      zoom: 11,
      popup: { autoOpenEnabled: false },
      ui: { components: ["zoom"] },
    });
    viewRef.current = view;

    view.on("click", async (e) => {
      const hit = await view.hitTest(e);
      const res = hit.results.find(
        (r) => r.graphic?.attributes?.id && r.graphic?.layer === layer,
      );
      if (res) onSelect(res.graphic.attributes);
      else onSelect(null);
    });

    return () => view.destroy();
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    if (!permits || permits.length === 0) return;

    layer.removeAll();

    permits.forEach((item) => {
      const color = STATUS_COLORS[item.status] ?? [156, 163, 175];
      const isSelected = selected?.id === item.id;
      const shape = TYPE_SHAPES[item.type] ?? "default";
      const size = getIconSize(item.mertebe);

      if (isSelected) {
        layer.add(
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
              size: `${size + 18}px`,
            },
            attributes: {},
          }),
        );
      }

      const strokeColor = color.map((c) => Math.max(0, c - 40));
      const url = buildSvgUrl(shape, color, strokeColor, size);

      layer.add(
        new Graphic({
          geometry: { type: "point", longitude: item.lng, latitude: item.lat },
          symbol: {
            type: "picture-marker",
            url,
            width: `${isSelected ? size + 6 : size}px`,
            height: `${isSelected ? size + 6 : size}px`,
          },
          attributes: item,
        }),
      );
    });
  }, [permits, selected]);

  useEffect(() => {
    if (!selected || !viewRef.current) return;
    viewRef.current.goTo(
      { center: [selected.lng, selected.lat], zoom: 14 },
      { duration: 600 },
    );
  }, [selected]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={mapRef} className={styles.map} />

      <div className={styles.legend}>
        <div className={styles.legendSection}>
          {Object.entries(STATUS_COLORS).map(([label, color]) => (
            <div key={label} className={styles.legendItem}>
              <div
                className={styles.legendDot}
                style={{ background: `rgb(${color.join(",")})` }}
              />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className={styles.legendDivider} />
      </div>
    </div>
  );
};

export default PermitMap;
