import React from "react";
import styles from "./ComplaintCard.module.css";

const STATUS = {
  Yeni: { bg: "#fff7ed", text: "#ea580c", dot: "#f97316" },
  İcradadır: { bg: "#eff6ff", text: "#2563eb", dot: "#3b82f6" },
  "Həll edildi": { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
};

const ComplaintCard = ({ item, isSelected, onSelect, onDelete, onEdit }) => {
  const s = STATUS[item.status] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <div className={styles.dot} style={{ background: s.dot }} />
        <span className={styles.title}>Problem : {item.title}</span>
        {onEdit && (
          <button
            className={styles.editBtn}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <i className="fa-regular fa-pen-to-square"></i>
          </button>
        )}
        {item.isCustom && (
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Sil"
          >
            <i className="fa-solid fa-trash" />
          </button>
        )}
      </div>

      <div className={styles.meta}>
        <span className={styles.metaItem}>
          <i className="fa-solid fa-location-dot" /> {item.rayon}
        </span>
        <span className={styles.metaItem}>
          <i className="fa-regular fa-calendar" /> {item.date}
        </span>
        {item.unvan && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-road" /> {item.unvan}
          </span>
        )}
      </div>

      <div className={styles.bottom}>
        <span
          className={styles.badge}
          style={{ background: s.bg, color: s.text }}
        >
          {item.status}
        </span>
      </div>

      {isSelected && item.tesvir && (
        <div className={styles.desc}>{item.tesvir}</div>
      )}
    </div>
  );
};

export default ComplaintCard;
