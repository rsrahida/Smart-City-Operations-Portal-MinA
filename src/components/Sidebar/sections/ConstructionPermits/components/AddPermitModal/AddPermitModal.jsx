import React, { useState, useEffect, useRef } from "react";
import styles from "./AddPermitModal.module.css";
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

const TYPE_OPTIONS = [
  "Yaşayış",
  "Kommersiya",
  "İnfrastruktur",
  "Sənaye",
  "İctimai",
];

const reverseGeocode = async (lat, lng) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
  );
  const data = await res.json();
  const parts = data.display_name?.split(",") ?? [];
  return { unvan: parts[0]?.trim() ?? "", rayon: parts[1]?.trim() ?? "" };
};

const searchAddress = async (query) => {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " Bakı Azərbaycan")}&format=json&limit=5`,
    { headers: { "Accept-Language": "az" } },
  );
  return await res.json();
};

const AddPermitModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({
    title: "",
    rayon: "",
    unvan: "",
    status: "Gözləyir",
    type: "Yaşayış",
    muracietci: "",
    mertebe: "",
    sahe: "",
    baslangic: "",
    bitis: "",
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
    if (!form.muracietci.trim()) e.muracietci = "Müraciətçi daxil edin";
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
      mertebe: Number(form.mertebe) || 0,
      sahe: Number(form.sahe) || 0,
    });
  };

  const locationSet = form.lat && form.lng;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>🏗️</div>
          <div>
            <p className={styles.modalSub}>
              Tikinti icazəsi haqqında məlumat daxil edin
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
              placeholder="Məs: Nizami küçəsi — Yaşayış binası"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
            {errors.title && (
              <span className={styles.error}>{errors.title}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Tikinti növü</label>
              <div className={styles.typeGroup}>
                {TYPE_OPTIONS.map((t) => (
                  <button
                    key={t}
                    className={`${styles.typeBtn} ${form.type === t ? styles.typeActive : ""}`}
                    onClick={() => setField("type", t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <div className={styles.statusGroup}>
                {["Gözləyir", "Təsdiqləndi", "Rədd edildi"].map((s) => (
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
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Müraciətçi *</label>
            <input
              className={`${styles.input} ${errors.muracietci ? styles.inputError : ""}`}
              placeholder="Şirkət və ya şəxs adı"
              value={form.muracietci}
              onChange={(e) => setField("muracietci", e.target.value)}
            />
            {errors.muracietci && (
              <span className={styles.error}>{errors.muracietci}</span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Mərtəbə sayı</label>
              <input
                type="number"
                className={styles.input}
                placeholder="Məs: 12"
                value={form.mertebe}
                onChange={(e) => setField("mertebe", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Sahə (m²)</label>
              <input
                type="number"
                className={styles.input}
                placeholder="Məs: 4200"
                value={form.sahe}
                onChange={(e) => setField("sahe", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Başlanğıc tarixi</label>
              <input
                type="date"
                className={styles.input}
                value={form.baslangic}
                onChange={(e) => setField("baslangic", e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Bitmə tarixi</label>
              <input
                type="date"
                className={styles.input}
                value={form.bitis}
                onChange={(e) => setField("bitis", e.target.value)}
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
                    <div className={styles.coordPreview}>✅ Məkan alındı</div>
                  )}
                  {gpsStatus === "error" && (
                    <div className={styles.gpsError}>
                      ❌ Məkan alına bilmədi. Brauzer icazəsini yoxlayın.
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

export default AddPermitModal;
