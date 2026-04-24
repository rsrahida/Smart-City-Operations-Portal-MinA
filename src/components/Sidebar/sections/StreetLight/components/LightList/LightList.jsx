import React from "react";
import styles from "./LightList.module.css";
import LightCard from "../LightCard/LightCard";

const FILTERS = ["Hamısı", "İşləyir", "Nasaz", "Sönük"];

const LightList = ({
  data,
  filter,
  onFilter,
  selected,
  onSelect,
  onDelete,
  onEdit,
}) => {
  return (
    <div className={styles.listPanel}>
      <div className={styles.filters}>
        {FILTERS.map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ""}`}
            onClick={() => onFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {data.length === 0 ? (
          <div className={styles.empty}>
            <i className="fa-solid fa-lightbulb" />
            <p>Dirək tapılmadı</p>
          </div>
        ) : (
          data.map((item) => (
            <LightCard
              key={item.id}
              item={item}
              isSelected={selected?.id === item.id}
              onSelect={() => onSelect(item)}
              onDelete={item.isCustom ? () => onDelete(item.id) : null}
              onEdit={item.isCustom ? () => onEdit(item) : null}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default LightList;
