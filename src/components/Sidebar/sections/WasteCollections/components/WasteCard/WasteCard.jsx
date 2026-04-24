import React, { useState, useEffect } from "react";
import styles from "./WasteCard.module.css";

const STATUS = {
  Kritik: { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
  Normal: { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  Boş: { bg: "#f3f4f6", text: "#6b7280", dot: "#9ca3af" },
};

const NOV_ICON = {
  Ümumi: "fa-solid fa-trash-can",
  Plastik: "fa-solid fa-bottle-water",
  Üzvi: "fa-solid fa-leaf",
  Kağız: "fa-solid fa-newspaper",
};

const DAYS = {
  "Bazar ertəsi": 1,
  "Çərşənbə axşamı": 2,
  Çərşənbə: 3,
  "Cümə axşamı": 4,
  Cümə: 5,
  Şənbə: 6,
  Bazar: 0,
};

const getNextCollection = (toplamaVaxti) => {
  if (!toplamaVaxti) return null;

  const match = toplamaVaxti.match(/(\S+(?:\s\S+)?)\s+(\d{2}:\d{2})/);
  if (!match) return null;

  const [, gunRaw, saat] = match;
  const gun = gunRaw.replace(/^Hər\s*/i, "").trim();
  const targetDay = DAYS[gun];
  if (targetDay === undefined) return null;

  const [hours, minutes] = saat.split(":").map(Number);
  const now = new Date();
  const next = new Date();

  next.setHours(hours, minutes, 0, 0);

  let diff = targetDay - now.getDay();
  if (diff < 0 || (diff === 0 && now >= next)) diff += 7;
  next.setDate(now.getDate() + diff);

  return next;
};

const useCountdown = (targetDate) => {
  const calc = () => {
    if (!targetDate) return null;
    const diff = targetDate - new Date();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const [time, setTime] = useState(calc);

  useEffect(() => {
    if (!targetDate) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return time;
};

const WasteCard = ({ item, isSelected, onSelect, onDelete, onEdit }) => {
  const s = STATUS[item.status] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };

  const barColor =
    item.dolulug >= 80 ? "#ef4444" : item.dolulug >= 50 ? "#eab308" : "#22c55e";

  const nextDate = getNextCollection(item.toplamaVaxti);
  const countdown = useCountdown(nextDate);

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onSelect}
    >
      <div className={styles.top}>
        <div className={styles.dot} style={{ background: s.dot }} />
        <span className={styles.title}>{item.title}</span>

        {onEdit && (
          <button
            className={styles.editBtn}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <i className="fa-regular fa-pen-to-square" />
          </button>
        )}
        {onDelete && (
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <i className="fa-solid fa-trash" />
          </button>
        )}
      </div>

      <div className={styles.progressRow}>
        <input
          type="range"
          min="0"
          max="100"
          value={item.dolulug}
          readOnly
          className={styles.progressRange}
          style={{
            background: `linear-gradient(to right, ${barColor} ${item.dolulug}%, #e5e7eb ${item.dolulug}%)`,
          }}
        />
        <span className={styles.progressPct} style={{ color: barColor }}>
          {item.dolulug}%
        </span>
      </div>

      <div className={styles.meta}>
        {item.rayon && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-location-dot" /> {item.rayon}
          </span>
        )}
        {item.növ && (
          <span className={styles.metaItem}>
            <i className={NOV_ICON[item.növ] ?? "fa-solid fa-box"} /> {item.növ}
          </span>
        )}
        {item.toplamaVaxti && (
          <span className={styles.metaItem}>
            <i className="fa-regular fa-clock" /> {item.toplamaVaxti}
          </span>
        )}
      </div>

      {countdown && (
        <div className={styles.countdown}>
          <span className={styles.countdownLabel}>
            <i className="fa-solid fa-hourglass-half" /> Növbəti yığım vaxtı:
          </span>
          <div className={styles.countdownBlocks}>
            {countdown.days > 0 && (
              <span className={styles.cdBlock}>
                <b>{countdown.days}</b>
                <small>gün</small>
              </span>
            )}
            <span className={styles.cdBlock}>
              <b>{String(countdown.hours).padStart(2, "0")}</b>
              <small>saat</small>
            </span>
            <span className={styles.cdBlock}>
              <b>{String(countdown.minutes).padStart(2, "0")}</b>
              <small>dəq</small>
            </span>
            <span className={styles.cdBlock}>
              <b>{String(countdown.seconds).padStart(2, "0")}</b>
              <small>san</small>
            </span>
          </div>
        </div>
      )}

      <div className={styles.bottom}>
        <span
          className={styles.badge}
          style={{ background: s.bg, color: s.text }}
        >
          {item.status}
        </span>
        <span className={styles.date}>
          <i className="fa-regular fa-calendar-check" />
          <span className={styles.dateLabel}>Son yığım</span>
          {item.date}
        </span>
      </div>
    </div>
  );
};

export default WasteCard;
