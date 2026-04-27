import React, { useState } from "react";
import styles from "./PermitEditModal.module.css";

const TYPE_OPTIONS = [
  "Yaşayış",
  "Kommersiya",
  "İnfrastruktur",
  "Sənaye",
  "İctimai",
];

const PermitEditModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: item.title ?? "",
    rayon: item.rayon ?? "",
    unvan: item.unvan ?? "",
    status: item.status ?? "Gözləyir",
    type: item.type ?? "Yaşayış",
    muracietci: item.muracietci ?? "",
    mertebe: item.mertebe ?? "",
    sahe: item.sahe ?? "",
    baslangic: item.baslangic ?? "",
    bitis: item.bitis ?? "",
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
    if (!form.muracietci.trim()) e.muracietci = "Müraciətçi daxil edin";
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
      mertebe: Number(form.mertebe) || 0,
      sahe: Number(form.sahe) || 0,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>🏗️</div>
          <div>
            <p className={styles.modalSub}>Məlumatları yeniləyin</p>
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
              placeholder="Başlıq"
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
              <label className={styles.label}>Rayon *</label>
              <input
                className={`${styles.input} ${errors.rayon ? styles.inputError : ""}`}
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
                value={form.unvan}
                onChange={(e) => setField("unvan", e.target.value)}
              />
              {errors.unvan && (
                <span className={styles.error}>{errors.unvan}</span>
              )}
            </div>
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

export default PermitEditModal;
