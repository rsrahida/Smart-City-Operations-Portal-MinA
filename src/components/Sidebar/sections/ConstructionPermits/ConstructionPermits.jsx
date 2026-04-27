import React, { useState, useEffect } from "react";
import styles from "./ConstructionPermits.module.css";
import PermitList from "./components/PermitList/PermitList";
import PermitMap from "./components/PermitMap/PermitMap";
import AddPermitModal from "./components/AddPermitModal/AddPermitModal";
import PermitEditModal from "./components/PermitEditModal/PermitEditModal";

const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      gap: 16,
      color: "#f97316",
    }}
  >
    <i className="fa-solid fa-helmet-safety fa-2x fa-beat" />
    <span style={{ fontSize: 15, color: "#6b7280" }}>Yüklənir...</span>
  </div>
);

const STORAGE_KEY = "constructionPermits_custom";

const ConstructionPermits = () => {
  const [loading, setLoading] = useState(true);
  const [mockData, setMockData] = useState([]);
  const [customData, setCustomData] = useState(() =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
  );
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState("Hamısı");
  const [editItem, setEditItem] = useState(null);

  useEffect(() => {
    fetch("/mockData.json")
      .then((r) => r.json())
      .then((d) => setMockData(d.permits || []));
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const allPermits = [...mockData, ...customData];

  const filtered =
    filter === "Hamısı"
      ? allPermits
      : allPermits.filter((c) => c.status === filter);

  const addPermit = (newItem) => {
    const item = {
      ...newItem,
      id: Date.now(),
      date: new Date().toLocaleDateString("az-AZ"),
      isCustom: true,
    };
    const updated = [...customData, item];
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setModalOpen(false);
  };

  const deletePermit = (id) => {
    const updated = customData.filter((c) => c.id !== id);
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const updatePermit = (id, updatedData) => {
    const updated = customData.map((c) =>
      c.id === id ? { ...c, ...updatedData } : c,
    );
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditItem(null);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <i className="fa-solid fa-helmet-safety"></i>
          </div>
          <div className={styles.new}>
            <p className={styles.headerSub}>
              ümumi {allPermits.length} tikinti icazəsi ·{" "}
              {allPermits.filter((c) => c.status === "Gözləyir").length}{" "}
              gözləyir
            </p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => setModalOpen(true)}>
          <i className="fa-solid fa-plus" /> Yeni icazə əlavə edin
        </button>
      </div>

      <div className={styles.body}>
        <PermitList
          data={filtered}
          filter={filter}
          onFilter={setFilter}
          selected={selected}
          onSelect={setSelected}
          onDelete={deletePermit}
          onEdit={setEditItem}
        />
        <PermitMap
          permits={allPermits}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {modalOpen && (
        <AddPermitModal onClose={() => setModalOpen(false)} onAdd={addPermit} />
      )}
      {editItem && (
        <PermitEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={updatePermit}
        />
      )}
    </div>
  );
};

export default ConstructionPermits;
