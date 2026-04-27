import React from "react";
import styles from "./PermitCard.module.css";

const STATUS = {
  Təsdiqləndi: { bg: "#f0fdf4", text: "#16a34a", dot: "#22c55e" },
  Gözləyir: { bg: "#fefce8", text: "#ca8a04", dot: "#eab308" },
  "Rədd edildi": { bg: "#fef2f2", text: "#dc2626", dot: "#ef4444" },
};

const TYPE_ICON = {
  Yaşayış: "fa-solid fa-building",
  Kommersiya: "fa-solid fa-store",
  İnfrastruktur: "fa-solid fa-road",
  Sənaye: "fa-solid fa-industry",
  İctimai: "fa-solid fa-landmark",
};

const PermitCard = ({ item, isSelected, onSelect, onDelete, onEdit }) => {
  const s = STATUS[item.status] ?? {
    bg: "#f3f4f6",
    text: "#374151",
    dot: "#9ca3af",
  };

  const typeIcon = TYPE_ICON[item.type] ?? "fa-solid fa-file-contract";

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

      {item.type && (
        <div className={styles.typeBadge}>
          <i className={typeIcon} /> {item.type}
        </div>
      )}

      <div className={styles.meta}>
        {item.rayon && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-location-dot" /> {item.rayon}
          </span>
        )}
        {item.unvan && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-road" /> {item.unvan}
          </span>
        )}
        {item.muracietci && (
          <span className={styles.metaItem}>
            <i className="fa-solid fa-user-tie" /> {item.muracietci}
          </span>
        )}
        {item.date && (
          <span className={styles.metaItem}>
            <i className="fa-regular fa-calendar" /> {item.date}
          </span>
        )}
      </div>

      {isSelected && (
        <div className={styles.details}>
          {item.mertebe > 0 && (
            <div className={styles.detailItem}>
              <i className="fa-solid fa-layer-group" />
              <span>{item.mertebe} mərtəbə</span>
            </div>
          )}
          {item.sahe && (
            <div className={styles.detailItem}>
              <i className="fa-solid fa-ruler-combined" />
              <span>{item.sahe} m²</span>
            </div>
          )}
          {item.baslangic && (
            <div className={styles.detailItem}>
              <i className="fa-solid fa-calendar-day" />
              <span>
                {item.baslangic} — {item.bitis ?? "?"}
              </span>
            </div>
          )}
        </div>
      )}

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

export default PermitCard;
