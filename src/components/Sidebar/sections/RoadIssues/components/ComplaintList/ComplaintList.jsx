import React from "react";
import styles from "./ComplaintList.module.css";
import ComplaintCard from "../ComplaintCard/ComplaintCard";

const FILTERS = ["Hamısı", "Yeni", "İcradadır", "Həll edildi"];

const ComplaintList = ({
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
            <ComplaintCard
              key={item.id}
              item={item}
              isSelected={selected?.id === item.id}
              onSelect={() => onSelect(item)}
              onDelete={() => onDelete(item.id)}
              onEdit={() => onEdit(item)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ComplaintList;
