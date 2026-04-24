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
  if (dolulug >= 80) return "20px";
  if (dolulug >= 50) return "15px";
  return "11px";
};

const WasteMap = ({ wastePoints, selected, onSelect }) => {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const wasteLayerRef = useRef(null);
  const pulseLayerRef = useRef(null);
  const animFrameRef = useRef(null);
  const animStartRef = useRef(null);

  const criticalPointsRef = useRef([]);

  useEffect(() => {
    const wasteLayer = new GraphicsLayer();
    const pulseLayer = new GraphicsLayer();
    wasteLayerRef.current = wasteLayer;
    pulseLayerRef.current = pulseLayer;

    const map = new Map({
      basemap: "streets-navigation-vector",
      layers: [pulseLayer, wasteLayer],
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
      if (res) {
        onSelect(res.graphic.attributes);
      } else {
        onSelect(null);
      }
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
                  outline: {
                    color: [239, 68, 68, opacity * 1.5],
                    width: 1.5,
                  },
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
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const layer = wasteLayerRef.current;
    if (!layer) return;
    if (!wastePoints || wastePoints.length === 0) return;

    layer.removeAll();

    criticalPointsRef.current = wastePoints
      .filter((item) => item.dolulug >= 80)
      .map((item) => ({ lng: item.lng, lat: item.lat }));

    wastePoints.forEach((item) => {
      const color = getDolulugColor(item.dolulug);
      const isSelected = selected?.id === item.id;
      const size = isSelected ? "24px" : getDolulugSize(item.dolulug);

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
            size,
          },
          attributes: item,
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
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ background: "rgb(239,68,68)" }}
          />
          <span>Kritik</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ background: "rgb(234,179,8)" }}
          />
          <span>Orta</span>
        </div>
        <div className={styles.legendItem}>
          <div
            className={styles.legendDot}
            style={{ background: "rgb(34,197,94)" }}
          />
          <span>Normal</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendPulse} />
          <span>Təcili boşaltmadır</span>
        </div>
      </div>
    </div>
  );
};

export default WasteMap;
