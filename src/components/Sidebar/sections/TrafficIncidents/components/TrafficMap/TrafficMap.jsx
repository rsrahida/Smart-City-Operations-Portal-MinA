import React, { useEffect, useRef } from "react";
import styles from "./TrafficMap.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

const SEVERITY_COLORS = {
  Yüksək: [239, 68, 68],
  Orta: [234, 179, 8],
  Aşağı: [34, 197, 94],
};

const TrafficMap = ({ traffics, selected, onSelect }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const trafficLayerRef = useRef(null);

  useEffect(() => {
    const layer = new GraphicsLayer();
    trafficLayerRef.current = layer;

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
    const layer = trafficLayerRef.current;
    if (!layer) return;
    if (!traffics || traffics.length === 0) return;
    layer.removeAll();

    traffics.forEach((item) => {
      const color = SEVERITY_COLORS[item.severity] ?? [156, 163, 175];
      const isSelected = selected?.id === item.id;

      layer.add(
        new Graphic({
          geometry: { type: "point", longitude: item.lng, latitude: item.lat },
          symbol: {
            type: "simple-marker",
            color,
            outline: {
              color: [255, 255, 255],
              width: isSelected ? 3 : 1.5,
            },
            size: isSelected ? "20px" : "12px",
          },
          attributes: item,
        }),
      );
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

      <div className={styles.legend}>
        {Object.entries(SEVERITY_COLORS).map(([label, color]) => (
          <div key={label} className={styles.legendItem}>
            <div
              className={styles.legendDot}
              style={{ background: `rgb(${color.join(",")})` }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficMap;
