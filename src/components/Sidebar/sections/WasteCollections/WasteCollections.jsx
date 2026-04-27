import React, { useEffect, useState } from "react";
import styles from "./WasteCollections.module.css";
import WasteList from "./components/WasteList/WasteList";
import WasteMap from "./components/WasteMap/WasteMap";
import AddWasteModal from "./components/AddWasteModal/AddWasteModal";
import WasteEditModal from "./components/WasteEditModal/WasteEditModal";

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
    <i className="fa-solid fa-trash-can fa-2x fa-beat" />
    <span style={{ fontSize: 15, color: "#6b7280" }}>Yüklənir...</span>
  </div>
);

const STORAGE_KEY = "wasteCollections_custom";

const WasteCollections = () => {
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
      .then((d) => setMockData(d.wastePoints || []));
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const allWaste = [...mockData, ...customData];

  const filtered =
    filter === "Hamısı"
      ? allWaste
      : allWaste.filter((c) => c.status === filter);

  const addWaste = (newItem) => {
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

  const deleteWaste = (id) => {
    const updated = customData.filter((c) => c.id !== id);
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const updateWaste = (id, updatedData) => {
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
            <i className="fa-solid fa-trash-can"></i>
          </div>
          <div className={styles.new}>
            <p className={styles.headerSub}>
              ümumi {allWaste.length} tullantı məntəqəsi ·{" "}
              {allWaste.filter((c) => c.status === "Kritik").length} kritik
              məntəqə
            </p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => setModalOpen(true)}>
          <i className="fa-solid fa-plus" /> Yeni tullantı məntəqəsi əlavə edin
        </button>
      </div>

      <div className={styles.body}>
        <WasteList
          data={filtered}
          filter={filter}
          onFilter={setFilter}
          selected={selected}
          onSelect={setSelected}
          onDelete={deleteWaste}
          onEdit={setEditItem}
        />
        <WasteMap
          wastePoints={allWaste}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {modalOpen && (
        <AddWasteModal onClose={() => setModalOpen(false)} onAdd={addWaste} />
      )}
      {editItem && (
        <WasteEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={updateWaste}
        />
      )}
    </div>
  );
};

export default WasteCollections;
