import React, { useState } from "react";
import styles from "./TrafficEditModal.module.css";

const TrafficEditModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: item?.title ?? "",
    rayon: item?.rayon ?? "",
    unvan: item?.unvan ?? "",
    status: item?.status ?? "Aktiv",
    severity: item?.severity ?? "Orta",
    type: item?.type ?? "Qəza",
    tesvir: item?.tesvir ?? "",
    time: item?.time ?? new Date().toTimeString().slice(0, 5),
  });

  const [errors, setErrors] = useState({});

  const setField = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

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
    onSave(item.id, { ...form });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>
            <i className="fa-solid fa-car-burst" style={{ color: "white" }} />
          </div>
          <div>
            <p className={styles.modalSub}>
              Yol-nəqliyyat hadisəsi məlumatlarını yeniləyin
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
              placeholder="Məs: Nizami küçəsi — avtomobil toqquşması"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
            />
            {errors.title && (
              <span className={styles.error}>{errors.title}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Şiddət</label>
            <div className={styles.statusGroup}>
              {["Yüksək", "Orta", "Aşağı"].map((s) => (
                <button
                  key={s}
                  className={`${styles.statusBtn} ${form.severity === s ? styles.statusActive : ""}`}
                  onClick={() => setField("severity", s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <div className={styles.statusGroup}>
              {["Aktiv", "Həll edildi", "Rədd edildi"].map((s) => (
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
            <label className={styles.label}>Hadisə vaxtı</label>
            <input
              type="time"
              className={styles.input}
              value={form.time}
              onChange={(e) => setField("time", e.target.value)}
            />
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

          <div className={styles.field}>
            <label className={styles.label}>Təsvir</label>
            <textarea
              className={styles.textarea}
              placeholder="Hadisə haqqında ətraflı məlumat..."
              rows={3}
              value={form.tesvir}
              onChange={(e) => setField("tesvir", e.target.value)}
            />
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

export default TrafficEditModal;
