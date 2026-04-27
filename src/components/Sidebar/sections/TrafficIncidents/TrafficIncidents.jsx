import React, { useEffect, useState } from "react";
import styles from "./TrafficIncidents.module.css";
import TrafficList from "./components/TrafficList/TrafficList";
import TrafficMap from "./components/TrafficMap/TrafficMap";
import AddTrafficModal from "./components/AddTrafficModal/AddTrafficModal";
import TrafficEditModal from "./components/TrafficEditModal/TrafficEditModal";

const STORAGE_KEY = "trafficIncidents_custom";

const TrafficIncidents = () => {
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
      .then((d) => setMockData(d.trafficIncidents || []));
  }, []);

  const allTraffics = [...mockData, ...customData];

  const filtered =
    filter === "Hamısı"
      ? allTraffics
      : allTraffics.filter((c) => c.status === filter);

  const addTrafic = (newItem) => {
    const item = {
      ...newItem,
      id: Date.now(),
      isCustom: true,
    };
    const updated = [...customData, item];
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    setModalOpen(false);
  };

  const deleteTraffic = (id) => {
    const updated = customData.filter((c) => c.id !== id);
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const updateTraffic = (id, updatedData) => {
    const updated = customData.map((c) =>
      c.id === id ? { ...c, ...updatedData } : c,
    );
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setEditItem(null);
  };
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <i className="fa-solid fa-car-burst"></i>
          </div>
          <div className={styles.new}>
            <p className={styles.headerSub}>
              ümumi {allTraffics.length} nol-nəqliyyat hadisəsi ·{" "}
              {allTraffics.filter((c) => c.status === "Aktiv").length} aktiv
            </p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => setModalOpen(true)}>
          <i className="fa-solid fa-plus" /> Yeni şikayət əlavə edin
        </button>
      </div>
      <div className={styles.body}>
        <TrafficList
          data={filtered}
          filter={filter}
          onFilter={setFilter}
          selected={selected}
          onSelect={setSelected}
          onDelete={deleteTraffic}
          onEdit={setEditItem}
        />
        <TrafficMap
          traffics={allTraffics}
          selected={selected}
          onSelect={setSelected}
        />
      </div>
      {modalOpen && (
        <AddTrafficModal
          onClose={() => setModalOpen(false)}
          onAdd={addTrafic}
        />
      )}

      {editItem && (
        <TrafficEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={updateTraffic}
        />
      )}
    </div>
  );
};

export default TrafficIncidents;
