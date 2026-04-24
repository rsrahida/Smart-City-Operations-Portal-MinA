import React, { useEffect, useRef } from "react";
import styles from "./LightMap.module.css";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";
import * as geometryEngine from "@arcgis/core/geometry/operators/geodesicBufferOperator";
import Point from "@arcgis/core/geometry/Point";

const STATUS_COLORS = {
  İşləyir: [34, 197, 94],
  Nasaz: [234, 179, 8],
  Sönük: [239, 68, 68],
};

const LightMap = ({ lights, selected, onSelect }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);

  const lightLayerRef = useRef(null);

  const bufferLayerRef = useRef(null);

  useEffect(() => {
    const lightLayer = new GraphicsLayer();
    const bufferLayer = new GraphicsLayer();
    lightLayerRef.current = lightLayer;
    bufferLayerRef.current = bufferLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [bufferLayer, lightLayer],
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
        (r) => r.graphic?.attributes?.id && r.graphic?.layer === lightLayer,
      );
      if (res) {
        onSelect(res.graphic.attributes);
      } else {
        onSelect(null);
        bufferLayer.removeAll();
      }
    });

    return () => view.destroy();
  }, []);

  useEffect(() => {
    const layer = lightLayerRef.current;
    if (!layer) return;
    layer.removeAll();

    lights.forEach((item) => {
      const color = STATUS_COLORS[item.status] ?? [156, 163, 175];
      const isSelected = selected?.id === item.id;

      layer.add(
        new Graphic({
          geometry: {
            type: "point",
            longitude: item.lng,
            latitude: item.lat,
          },
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
  }, [lights, selected]);

  useEffect(() => {
    if (!selected || !viewRef.current) return;

    viewRef.current.goTo(
      { center: [selected.lng, selected.lat], zoom: 15 },
      { duration: 600 },
    );

    bufferLayerRef.current?.removeAll();

    if (selected.status === "Sönük") {
      drawBuffer(selected);
    }
  }, [selected]);

  const drawBuffer = async (light) => {
    const bufferLayer = bufferLayerRef.current;
    if (!bufferLayer) return;

    await geometryEngine.load();

    const point = new Point({
      longitude: light.lng,
      latitude: light.lat,
      spatialReference: { wkid: 4326 },
    });

    const buffered = geometryEngine.execute(point, 150, "meters");

    bufferLayer.add(
      new Graphic({
        geometry: buffered,
        symbol: {
          type: "simple-fill",
          color: [30, 10, 10, 0.45],
          outline: {
            color: [180, 20, 20, 0.9],
            width: 2.5,
            style: "dash",
          },
        },
      }),
    );
  };

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

        <div className={styles.legendItem}>
          <div className={styles.legendBuffer} />
          <span>Qaranlıq zona</span>
        </div>
      </div>
    </div>
  );
};

export default LightMap;
