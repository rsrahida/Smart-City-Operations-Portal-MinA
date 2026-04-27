import React from "react";
import styles from "./TrafficList.module.css";
import TrafficCard from "../TrafficCard/TrafficCard";

const FILTERS = ["Hamısı", "Həll edildi", "Aktiv", "Rədd edildi"];

const TrafficList = ({
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
          <div className={styles.empty}></div>
        ) : (
          data.map((item) => (
            <TrafficCard
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

export default TrafficList;
