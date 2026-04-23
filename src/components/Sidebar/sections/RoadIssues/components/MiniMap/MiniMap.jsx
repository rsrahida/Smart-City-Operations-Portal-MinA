import React, { useEffect, useRef } from "react";
import styles from "./MiniMap.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

const STATUS_COLORS = {
  Yeni: [249, 115, 22],
  İcradadır: [59, 130, 246],
  "Həll edildi": [34, 197, 94],
};

const MiniMap = ({ complaints, selected, onSelect }) => {
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
      const res = hit.results.find((r) => r.graphic?.attributes?.id);
      if (res) onSelect(res.graphic.attributes);
      else onSelect(null);
    });

    return () => view.destroy();
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.removeAll();

    complaints.forEach((item) => {
      const color = STATUS_COLORS[item.status] ?? [156, 163, 175];
      const isSelected = selected?.id === item.id;

      layer.add(
        new Graphic({
          geometry: { type: "point", longitude: item.lng, latitude: item.lat },
          symbol: {
            type: "simple-marker",
            color,
            outline: {
              color: isSelected ? [255, 255, 255] : [255, 255, 255],
              width: isSelected ? 3 : 1.5,
            },
            size: isSelected ? "18px" : "12px",
          },
          attributes: item,
        }),
      );
    });
  }, [complaints, selected]);

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
    </div>
  );
};

export default MiniMap;
