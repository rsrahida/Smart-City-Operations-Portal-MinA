import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./TrafficMap.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import Point from "@arcgis/core/geometry/Point";

const SEVERITY_CONFIG = {
  Yüksək: {
    color: [239, 68, 68],
    pulseColor: "rgba(239,68,68,0.35)",
    bufferColor: [239, 68, 68, 0.12],
    bufferOutline: [239, 68, 68, 0.5],
    bufferMeters: 400,
    size: "22px",
    symbol: (isSelected) => ({
      type: "text",
      color: [239, 68, 68],
      haloColor: [255, 255, 255],
      haloSize: isSelected ? "3px" : "2px",
      text: "▲",
      font: { size: isSelected ? 22 : 16, weight: "bold" },
    }),
  },
  Orta: {
    color: [234, 179, 8],
    pulseColor: "rgba(234,179,8,0.3)",
    bufferColor: [234, 179, 8, 0.1],
    bufferOutline: [234, 179, 8, 0.45],
    bufferMeters: 250,
    size: "16px",
    symbol: (isSelected) => ({
      type: "simple-marker",
      color: [234, 179, 8],
      outline: { color: [255, 255, 255], width: isSelected ? 3 : 1.5 },
      size: isSelected ? "20px" : "14px",
    }),
  },
  Aşağı: {
    color: [34, 197, 94],
    pulseColor: "rgba(34,197,94,0.25)",
    bufferColor: [34, 197, 94, 0.08],
    bufferOutline: [34, 197, 94, 0.4],
    bufferMeters: 120,
    size: "12px",
    symbol: (isSelected) => ({
      type: "simple-marker",
      color: [34, 197, 94],
      outline: { color: [255, 255, 255], width: isSelected ? 2.5 : 1 },
      size: isSelected ? "16px" : "10px",
    }),
  },
};

const STATUS_LABELS = {
  Aktiv: { bg: "#fef2f2", color: "#dc2626" },
  "Həll edildi": { bg: "#f0fdf4", color: "#16a34a" },
  "Rədd edildi": { bg: "#f3f4f6", color: "#6b7280" },
};

const PulseOverlay = ({ view, traffics, selected }) => {
  const [positions, setPositions] = useState([]);
  const rafRef = useRef(null);

  const update = useCallback(() => {
    if (!view || !view.ready) return;
    const pts = traffics
      .filter((t) => t.status === "Aktiv")
      .map((t) => {
        const screen = view.toScreen(
          new Point({ longitude: t.lng, latitude: t.lat }),
        );
        return { id: t.id, x: screen.x, y: screen.y, severity: t.severity };
      });
    setPositions(pts);
    rafRef.current = requestAnimationFrame(update);
  }, [view, traffics]);

  useEffect(() => {
    if (!view) return;
    const handle = view.watch("stationary", () => {
      rafRef.current = requestAnimationFrame(update);
    });
    rafRef.current = requestAnimationFrame(update);
    return () => {
      handle.remove();
      cancelAnimationFrame(rafRef.current);
    };
  }, [view, update]);

  return (
    <>
      {positions.map((p) => {
        const cfg = SEVERITY_CONFIG[p.severity] ?? SEVERITY_CONFIG["Aşağı"];
        const isSel = selected?.id === p.id;
        return (
          <div
            key={p.id}
            className={styles.pulse}
            style={{
              left: p.x,
              top: p.y,
              "--pulse-color": cfg.pulseColor,
              "--pulse-size": isSel ? "48px" : "36px",
            }}
          />
        );
      })}
    </>
  );
};

const MapTooltip = ({ item, screenPos }) => {
  if (!item || !screenPos) return null;
  const statusStyle = STATUS_LABELS[item.status] ?? {
    bg: "#f3f4f6",
    color: "#374151",
  };
  const cfg = SEVERITY_CONFIG[item.severity];
  const [r, g, b] = cfg?.color ?? [156, 163, 175];

  return (
    <div
      className={styles.tooltip}
      style={{ left: screenPos.x + 16, top: screenPos.y - 12 }}
    >
      <div className={styles.tooltipHeader}>
        <span
          className={styles.tooltipSev}
          style={{ color: `rgb(${r},${g},${b})` }}
        >
          {item.severity === "Yüksək" ? "▲" : "●"} {item.severity}
        </span>
        <span
          className={styles.tooltipStatus}
          style={{ background: statusStyle.bg, color: statusStyle.color }}
        >
          {item.status}
        </span>
      </div>
      <div className={styles.tooltipTitle}>{item.title}</div>
      <div className={styles.tooltipMeta}>
        <span>
          <i className="fa-solid fa-location-dot" /> {item.rayon}
        </span>
        <span>
          <i className="fa-regular fa-clock" /> {item.time}
        </span>
      </div>
      {item.tesvir && <div className={styles.tooltipDesc}>{item.tesvir}</div>}
    </div>
  );
};

const TrafficMap = ({ traffics, selected, onSelect }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const markerLayerRef = useRef(null);
  const bufferLayerRef = useRef(null);

  const [viewReady, setViewReady] = useState(false);
  const [hovered, setHovered] = useState(null);
  const [hoverScreen, setHoverScreen] = useState(null);

  useEffect(() => {
    const bufferLayer = new GraphicsLayer({ id: "buffers" });
    const markerLayer = new GraphicsLayer({ id: "markers" });
    bufferLayerRef.current = bufferLayer;
    markerLayerRef.current = markerLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [bufferLayer, markerLayer],
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

    view.when(() => setViewReady(true));

    view.on("click", async (e) => {
      const hit = await view.hitTest(e);
      const res = hit.results.find(
        (r) => r.graphic?.attributes?.id && r.graphic?.layer === markerLayer,
      );
      if (res) onSelect(res.graphic.attributes);
      else onSelect(null);
    });

    view.on("pointer-move", async (e) => {
      const hit = await view.hitTest(e);
      const res = hit.results.find(
        (r) => r.graphic?.attributes?.id && r.graphic?.layer === markerLayer,
      );
      if (res) {
        setHovered(res.graphic.attributes);
        setHoverScreen({ x: e.x, y: e.y });
      } else {
        setHovered(null);
        setHoverScreen(null);
      }
    });

    return () => view.destroy();
  }, []);

  useEffect(() => {
    const markerLayer = markerLayerRef.current;
    const bufferLayer = bufferLayerRef.current;
    if (!markerLayer || !bufferLayer) return;

    markerLayer.removeAll();
    bufferLayer.removeAll();

    traffics.forEach((item) => {
      const cfg = SEVERITY_CONFIG[item.severity] ?? SEVERITY_CONFIG["Aşağı"];
      const isSelected = selected?.id === item.id;
      const isActive = item.status === "Aktiv";

      markerLayer.add(
        new Graphic({
          geometry: {
            type: "point",
            longitude: item.lng,
            latitude: item.lat,
          },
          symbol: cfg.symbol(isSelected),
          attributes: item,
        }),
      );

      if (isActive) {
        const pt = new Point({
          longitude: item.lng,
          latitude: item.lat,
          spatialReference: { wkid: 4326 },
        });

        try {
          const buffered = geometryEngine.geodesicBuffer(
            pt,
            cfg.bufferMeters,
            "meters",
          );
          if (buffered) {
            const [br, bg, bb, ba] = cfg.bufferColor;
            const [or, og, ob, oa] = cfg.bufferOutline;
            bufferLayer.add(
              new Graphic({
                geometry: buffered,
                symbol: {
                  type: "simple-fill",
                  color: [br, bg, bb, ba * 255],
                  outline: {
                    color: [or, og, ob, oa * 255],
                    width: isSelected ? 2 : 1,
                    style: "dash",
                  },
                },
              }),
            );
          }
        } catch (_) {}
      }
    });
  }, [traffics, selected]);

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

      {viewReady && viewRef.current && (
        <div className={styles.pulseContainer}>
          <PulseOverlay
            view={viewRef.current}
            traffics={traffics}
            selected={selected}
          />
        </div>
      )}

      {hovered && hoverScreen && (
        <MapTooltip item={hovered} screenPos={hoverScreen} />
      )}

      <div className={styles.legend}>
        {Object.entries(SEVERITY_CONFIG).map(([label, cfg]) => {
          const [r, g, b] = cfg.color;
          return (
            <div key={label} className={styles.legendItem}>
              <span
                className={styles.legendIcon}
                style={{ color: `rgb(${r},${g},${b})` }}
              >
                {label === "Yüksək" ? "▲" : "●"}
              </span>
              <span>{label}</span>
            </div>
          );
        })}
        <div className={styles.legendDivider} />

        <div className={styles.legendHint}>
          <span className={styles.legendBuffer} /> Təsir zonası
        </div>
      </div>
    </div>
  );
};

export default TrafficMap;
