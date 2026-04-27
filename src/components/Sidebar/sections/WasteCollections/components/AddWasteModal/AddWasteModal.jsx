import React, { useState, useEffect, useRef } from "react";
import styles from "./AddWasteModal.module.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

const LOCATION_TABS = [
  {
    key: "search",
    icon: "fa-solid fa-magnifying-glass",
    label: "Ünvanla axtar",
  },
  { key: "coords", icon: "fa-solid fa-crosshairs", label: "Koordinat" },
  { key: "map", icon: "fa-solid fa-map-location-dot", label: "Xəritədən seç" },
  { key: "gps", icon: "fa-solid fa-location-dot", label: "Cari məkan" },
];

const NOV_OPTIONS = ["Ümumi", "Plastik", "Üzvi", "Kağız"];

const TOPLAMA_GUNLERI = [
  "Hər Bazar ertəsi",
  "Hər Çərşənbə axşamı",
  "Hər Çərşənbə",
  "Hər Cümə axşamı",
  "Hər Cümə",
  "Hər Şənbə",
  "Hər Bazar",
];

const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
  );
  const data = await res.json();
  const parts = data.display_name?.split(",") ?? [];
  return {
    unvan: parts[0]?.trim() ?? "",
    rayon: parts[1]?.trim() ?? "",
  };
};

const searchAddress = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " Bakı Azərbaycan")}&format=json&limit=5`,
    { headers: { "Accept-Language": "az" } },
  );
  return await res.json();
};

const AddWasteModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    title: "",
    rayon: "",
    unvan: "",
    status: "Normal",
    növ: "Ümumi",
    dolulug: 0,
    toplamaGun: "Hər Çərşənbə",
    toplamaSaat: "09:00",
    lat: null,
    lng: null,
  });

  const [errors, setErrors] = useState({});
  const [locTab, setLocTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [coordLat, setCoordLat] = useState("");
  const [coordLng, setCoordLng] = useState("");
  const [gpsStatus, setGpsStatus] = useState("idle");
  const [mapCoords, setMapCoords] = useState(null);

  const debounceRef = useRef(null);
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const layerRef = useRef(null);

  const barColor =
    form.dolulug >= 80 ? "#ef4444" : form.dolulug >= 50 ? "#eab308" : "#22c55e";

  useEffect(() => {
    if (locTab !== "map") return;

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
      zoom: 12,
      popup: { autoOpenEnabled: false },
      ui: { components: ["zoom"] },
    });
    viewRef.current = view;

    view.on("click", (e) => {
      const { latitude, longitude } = e.mapPoint;
      layer.removeAll();
      layer.add(
        new Graphic({
          geometry: { type: "point", longitude, latitude },
          symbol: {
            type: "simple-marker",
            color: [249, 115, 22],
            outline: { color: [255, 255, 255], width: 2 },
            size: "14px",
          },
        }),
      );
      setMapCoords({
        lat: parseFloat(latitude.toFixed(6)),
        lng: parseFloat(longitude.toFixed(6)),
      });
    });

    return () => view.destroy();
  }, [locTab]);

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const selectSearchResult = (r) => {
    const parts = r.display_name.split(",");
    setForm((p) => ({
      ...p,
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      unvan: parts[0]?.trim() ?? "",
      rayon: parts[1]?.trim() ?? "",
    }));
    setSearchResults([]);
    setSearchQuery(parts[0]?.trim() ?? "");
    setErrors((p) => ({
      ...p,
      location: undefined,
      unvan: undefined,
      rayon: undefined,
    }));
  };

  const applyCoords = () => {
    const lat = parseFloat(coordLat);
    const lng = parseFloat(coordLng);
    if (isNaN(lat) || isNaN(lng)) return;
    setForm((p) => ({ ...p, lat, lng }));
    setErrors((p) => ({ ...p, location: undefined }));
  };

  const applyMapCoords = async () => {
    if (!mapCoords) return;
    const { unvan, rayon } = await reverseGeocode(mapCoords.lat, mapCoords.lng);
    setForm((p) => ({
      ...p,
      lat: mapCoords.lat,
      lng: mapCoords.lng,
      unvan,
      rayon,
    }));
    setErrors((p) => ({
      ...p,
      location: undefined,
      unvan: undefined,
      rayon: undefined,
    }));
  };

  const getGps = () => {
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const { unvan, rayon } = await reverseGeocode(latitude, longitude);
        setForm((p) => ({ ...p, lat: latitude, lng: longitude, unvan, rayon }));
        setGpsStatus("done");
        setErrors((p) => ({
          ...p,
          location: undefined,
          unvan: undefined,
          rayon: undefined,
        }));
      },
      () => setGpsStatus("error"),
    );
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Başlıq daxil edin";
    if (!form.rayon.trim()) e.rayon = "Rayon daxil edin";
    if (!form.unvan.trim()) e.unvan = "Ünvan daxil edin";
    if (!form.lat || !form.lng) e.location = "Məkan seçin";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onAdd({
      ...form,

      toplamaVaxti: `${form.toplamaGun} ${form.toplamaSaat}`,
    });
  };

  const locationSet = form.lat && form.lng;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}><i className="fa-solid fa-trash-can" style={{ color: "white" }}></i></div>
          <div>
            <p className={styles.modalSub}>
              Tullantı məntəqəsi haqqında məlumat daxil edin
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Başlıq *</label>
            <input
              className={`${styles.input} ${errors.title ? styles.inputError : ""}`}
              placeholder="Məs: Konteyner-6 — Nərimanov"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
            {errors.title && (
              <span className={styles.error}>{errors.title}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Tullantı növü</label>
              <div className={styles.novGroup}>
                {NOV_OPTIONS.map((n) => (
                  <button
                    key={n}
                    className={`${styles.novBtn} ${form.növ === n ? styles.novActive : ""}`}
                    onClick={() => setField("növ", n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

         
          </div>
   <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <div className={styles.statusGroup}>
                {["Normal", "Kritik", "Boş"].map((s) => (
                  <button
                    key={s}
                    className={`${styles.statusBtn} ${form.status === s ? styles.statusActive : ""}`}
                    onClick={() => setField("status", s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          <div className={styles.field}>
            <label className={styles.label}>
              Doluluq səviyyəsi —{" "}
              <span style={{ color: barColor, fontWeight: 700 }}>
                {form.dolulug}%
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={form.dolulug}
              onChange={(e) => setField("dolulug", Number(e.target.value))}
              className={styles.slider}
              style={{
                background: `linear-gradient(to right, ${barColor} ${form.dolulug}%, #e5e7eb ${form.dolulug}%)`,
              }}
            />
            <div className={styles.sliderLabels}>
              <span>0%</span>
              <span style={{ color: "#22c55e" }}>Normal</span>
              <span style={{ color: "#eab308" }}>Orta</span>
              <span style={{ color: "#ef4444" }}>Kritik</span>
              <span>100%</span>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Toplama vaxtı</label>
            <div className={styles.row}>
              <select
                className={styles.select}
                value={form.toplamaGun}
                onChange={(e) => setField("toplamaGun", e.target.value)}
              >
                {TOPLAMA_GUNLERI.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <input
                type="time"
                className={styles.input}
                value={form.toplamaSaat}
                onChange={(e) => setField("toplamaSaat", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Məkan *</label>
            <div className={styles.locTabs}>
              {LOCATION_TABS.map((t) => (
                <button
                  key={t.key}
                  className={`${styles.locTab} ${locTab === t.key ? styles.locTabActive : ""}`}
                  onClick={() => setLocTab(t.key)}
                >
                  <i className={t.icon} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>

            <div className={styles.locContent}>
              {locTab === "search" && (
                <div>
                  <div className={styles.searchRow}>
                    <input
                      className={styles.searchinput}
                      placeholder="Küçə, yer adı axtar..."
                      value={searchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSearchQuery(val);
                        clearTimeout(debounceRef.current);
                        if (val.trim().length < 2) {
                          setSearchResults([]);
                          setSearching(false);
                          return;
                        }
                        setSearching(true);
                        debounceRef.current = setTimeout(async () => {
                          const results = await searchAddress(val);
                          setSearchResults(results);
                          setSearching(false);
                        }, 400);
                      }}
                    />
                    <button className={styles.searchBtn} disabled>
                      {searching ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                      ) : (
                        <i
                          className="fa-solid fa-magnifying-glass"
                          style={{ opacity: 0.4 }}
                        />
                      )}
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className={styles.searchResults}>
                      {searchResults.map((r, i) => (
                        <div
                          key={i}
                          className={styles.searchResult}
                          onClick={() => selectSearchResult(r)}
                        >
                          <i
                            className="fa-solid fa-location-dot"
                            style={{ color: "#f97316" }}
                          />
                          <span>{r.display_name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {locTab === "coords" && (
                <div>
                  <div className={styles.coordRow}>
                    <div className={styles.field}>
                      <label className={styles.label}>Enlik (Lat)</label>
                      <input
                        className={styles.input}
                        placeholder="40.4093"
                        value={coordLat}
                        onChange={(e) => setCoordLat(e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label}>Uzunluq (Lng)</label>
                      <input
                        className={styles.input}
                        placeholder="49.8671"
                        value={coordLng}
                        onChange={(e) => setCoordLng(e.target.value)}
                      />
                    </div>
                  </div>
                  <button className={styles.applyBtn} onClick={applyCoords}>
                    <i className="fa-solid fa-check" /> Tətbiq et
                  </button>
                  {locationSet && locTab === "coords" && (
                    <div className={styles.coordPreview}>
                      Seçilmiş koordinatlar: {form.lat?.toFixed(4)},{" "}
                      {form.lng?.toFixed(4)}
                    </div>
                  )}
                  <p
                    style={{
                      fontSize: 11,
                      color: "#9c8880",
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    Koordinat metodunda rayon və ünvanı aşağıda əl ilə daxil
                    edin
                  </p>
                </div>
              )}

              {locTab === "map" && (
                <div>
                  <p className={styles.mapHint}>
                    <i className="fa-solid fa-hand-pointer" /> Xəritəyə
                    klikləyərək məkan seçin
                  </p>
                  <div ref={mapRef} className={styles.miniMap} />
                  {mapCoords && (
                    <div className={styles.mapCoordsRow}>
                      <span className={styles.coordPreview}>
                        📍 {mapCoords.lat}, {mapCoords.lng}
                      </span>
                      <button
                        className={styles.applyBtnn}
                        onClick={applyMapCoords}
                      >
                        <i className="fa-solid fa-check" /> Tətbiq et
                      </button>
                    </div>
                  )}
                </div>
              )}

              {locTab === "gps" && (
                <div className={styles.gpsTab}>
                  {gpsStatus === "idle" && (
                    <button className={styles.gpsBtn} onClick={getGps}>
                      <i className="fa-solid fa-location-dot" /> Cari məkanı al
                    </button>
                  )}
                  {gpsStatus === "loading" && (
                    <div className={styles.gpsInfo}>
                      <i className="fa-solid fa-spinner fa-spin" /> Məkan
                      alınır...
                    </div>
                  )}
                  {gpsStatus === "done" && (
                    <div className={styles.coordPreview}>Məkan alındı</div>
                  )}
                  {gpsStatus === "error" && (
                    <div className={styles.gpsError}>
                      Məkan alına bilmədi. Brauzer icazəsini yoxlayın.
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.location && (
              <span className={styles.error}>{errors.location}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Rayon *</label>
              <input
                className={`${styles.input} ${errors.rayon ? styles.inputError : ""}`}
                placeholder="Rayon adını daxil edin"
                value={form.rayon}
                onChange={(e) => setField("rayon", e.target.value)}
              />
              {errors.rayon && (
                <span className={styles.error}>{errors.rayon}</span>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Ünvan *</label>
              <input
                className={`${styles.input} ${errors.unvan ? styles.inputError : ""}`}
                placeholder="Ünvanı daxil edin"
                value={form.unvan}
                onChange={(e) => setField("unvan", e.target.value)}
              />
              {errors.unvan && (
                <span className={styles.error}>{errors.unvan}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Ləğv et
          </button>
          <button className={styles.submitBtn} onClick={submit}>
            <i className="fa-solid fa-plus" /> Əlavə et
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddWasteModal;
