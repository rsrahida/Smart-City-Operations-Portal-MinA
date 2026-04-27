import React from "react";
import styles from "./LightCard.module.css";

const STATUS = {
  İşləyir: { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  Nasaz: { bg: "#fefce8", text: "#ca8a04", dot: "#eab308" },
  Sönük: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
};

const LightCard = ({ item, isSelected, onSelect, onDelete, onEdit }) => {
  const s = STATUS[item.status] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };

  const isDisabled = !item.isCustom;

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <div className={styles.dot} style={{ background: s.dot }} />
        <span className={styles.title}>{item.title}</span>

        <button
          className={`${styles.editBtn} ${isDisabled ? styles.btnDisabled : ""}`}
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onEdit?.();
          }}
          title={isDisabled ? "Redaktə edilə bilməz" : "Redaktə et"}
        >
          <i className="fa-regular fa-pen-to-square" />
        </button>

        <button
          className={`${styles.deleteBtn} ${isDisabled ? styles.btnDisabled : ""}`}
          disabled={isDisabled}
          onClick={(e) => {
            e.stopPropagation();
            if (!isDisabled) onDelete?.();
          }}
          title={isDisabled ? "Silinə bilməz" : "Sil"}
        >
          <i className="fa-solid fa-trash" />
        </button>
      </div>

      <div className={styles.meta}>
        {item.rayon && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-location-dot" /> {item.rayon}
          </span>
        )}
        <span className={styles.metaItem}>
          <i className="fa-regular fa-calendar" /> {item.date}
        </span>
      </div>

      <div className={styles.bottom}>
        <span
          className={styles.badge}
          style={{ background: s.bg, color: s.text }}
        >
          {item.status}
        </span>
      </div>
    </div>
  );
};

export default LightCard;
