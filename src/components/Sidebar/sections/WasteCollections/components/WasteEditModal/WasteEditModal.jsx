import React, { useState } from "react";
import styles from "./WasteEditModal.module.css";

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

const WasteEditModal = ({ item, onClose, onSave }) => {
  const parseToplamaVaxti = (str = "") => {
    const parts = str.split(" ");
    const saat = parts[parts.length - 1] ?? "09:00";
    const gun = parts.slice(0, parts.length - 1).join(" ") || "Hər Çərşənbə";
    return { gun, saat };
  };

  const { gun: initGun, saat: initSaat } = parseToplamaVaxti(
    item?.toplamaVaxti,
  );

  const [form, setForm] = useState({
    title: item?.title ?? "",
    rayon: item?.rayon ?? "",
    unvan: item?.unvan ?? "",
    status: item?.status ?? "Normal",
    növ: item?.növ ?? "Ümumi",
    dolulug: item?.dolulug ?? 0,
    toplamaGun: initGun,
    toplamaSaat: initSaat,
  });

  const [errors, setErrors] = useState({});

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const barColor =
    form.dolulug >= 80 ? "#ef4444" : form.dolulug >= 50 ? "#eab308" : "#22c55e";

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Başlıq daxil edin";
    if (!form.rayon.trim()) e.rayon = "Rayon daxil edin";
    if (!form.unvan.trim()) e.unvan = "Ünvan daxil edin";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onSave(item.id, {
      ...form,
      toplamaVaxti: `${form.toplamaGun} ${form.toplamaSaat}`,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>🗑️</div>
          <div>
            <p className={styles.modalSub}>
              Tullantı məntəqəsi məlumatlarını yeniləyin
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
            <i className="fa-solid fa-floppy-disk" /> Saxla
          </button>
        </div>
      </div>
    </div>
  );
};

export default WasteEditModal;
