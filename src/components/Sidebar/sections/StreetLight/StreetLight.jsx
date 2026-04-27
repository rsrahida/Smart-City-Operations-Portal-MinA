import React, { useState, useEffect } from "react";
import styles from "./StreetLight.module.css";
import LightList from "./components/LightList/LightList";
import LightMap from "./components/LightMap/LightMap";
import AddLightModal from "./components/AddLightModal/AddLightModal";
import LightEditModal from "./components/LightEditModal/LightEditModal";

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
    <i className="fa-solid fa-lightbulb fa-2x fa-beat" />
    <span style={{ fontSize: 15, color: "#6b7280" }}>Yüklənir...</span>
  </div>
);

const STORAGE_KEY = "streetLights_custom";

const StreetLight = () => {
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
      .then((d) => setMockData(d.streetLights || []));
    setTimeout(() => setLoading(false), 1000);
  }, []);

  const allLights = [...mockData, ...customData];

  const filtered =
    filter === "Hamısı"
      ? allLights
      : allLights.filter((c) => c.status === filter);

  const addLight = (newItem) => {
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

  const deleteLight = (id) => {
    const updated = customData.filter((c) => c.id !== id);
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const updateLight = (id, updatedData) => {
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
            <i className="fa-solid fa-lightbulb"></i>
          </div>
          <div className={styles.new}>
            <p className={styles.headerSub}>
              ümumi {allLights.length} dirək ·{" "}
              {allLights.filter((c) => c.status === "Sönük").length} sönük
            </p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => setModalOpen(true)}>
          <i className="fa-solid fa-plus" /> Yeni dirək əlavə edin
        </button>
      </div>

      <div className={styles.body}>
        <LightList
          data={filtered}
          filter={filter}
          onFilter={setFilter}
          selected={selected}
          onSelect={setSelected}
          onDelete={deleteLight}
          onEdit={setEditItem}
        />
        <LightMap
          lights={allLights}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {modalOpen && (
        <AddLightModal onClose={() => setModalOpen(false)} onAdd={addLight} />
      )}
      {editItem && (
        <LightEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={updateLight}
        />
      )}
    </div>
  );
};

export default StreetLight;
