import React from "react";
import styles from "./TrafficCard.module.css";

const STATUS = {
  Aktiv: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  "Həll edildi": { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
};

const SEVERITY = {
  Yüksək: {
    bg: "#fef2f2",
    text: "#dc2626",
    icon: "fa-solid fa-circle-exclamation",
  },
  Orta: {
    bg: "#fefce8",
    text: "#ca8a04",
    icon: "fa-solid fa-triangle-exclamation",
  },
  Aşağı: { bg: "#f0fdf4", text: "#16a34a", icon: "fa-solid fa-circle-info" },
};

const getTimeAgo = (date, time) => {
  if (!date || !time) return null;

  const [day, month, year] = date.split(".");
  const [hours, minutes] = time.split(":");

  const past = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes),
    0,
  );

  if (isNaN(past.getTime())) return null;

  const diff = Date.now() - past.getTime();

  if (diff < 0) return "Az əvvəl";

  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (days > 0) return `${days} gün əvvəl`;
  if (hrs > 0) return `${hrs} saat əvvəl`;
  if (mins < 1) return "Az əvvəl";
  return `${mins} dəq əvvəl`;
};

const TrafficCard = ({ item, isSelected, onSelect, onDelete, onEdit }) => {
  const s = STATUS[item.status] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };
  const sev = SEVERITY[item.severity] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    icon: "fa-solid fa-circle-question",
  };
  const timeAgo = getTimeAgo(item.date, item.time);

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

      <div className={styles.severityRow}>
        <span
          className={styles.severityBadge}
          style={{ background: sev.bg, color: sev.text }}
        >
          <i className={sev.icon} /> {item.severity}
        </span>
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
        {item.time && (
          <span className={styles.metaItem}>
            <i className="fa-regular fa-clock" /> {item.time}
          </span>
        )}
        {timeAgo && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-hourglass-half" /> {timeAgo}
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

export default TrafficCard;