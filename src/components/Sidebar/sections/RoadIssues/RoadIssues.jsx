import React, { useState, useEffect } from "react";
import styles from "./RoadIssues.module.css";
import ComplaintList from "./components/ComplaintList/ComplaintList";
import MiniMap from "./components/MiniMap/MiniMap";
import AddComplaintModal from "./components/AddComplaintModal/AddComplaintModal";
import ComplainEditModal from "./components/ComplainEditModal/ComplainEditModal";

const STORAGE_KEY = "roadIssues_custom";

const RoadIssues = () => {
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
      .then((d) => setMockData(d.complaints || []));
  }, []);

  const allComplaints = [...mockData, ...customData];

  const filtered =
    filter === "Hamısı"
      ? allComplaints
      : allComplaints.filter((c) => c.status === filter);

  const addComplaint = (newItem) => {
    const item = {
      ...newItem,
      id: Date.now(),
      date: new Date().toLocaleDateString("az-AZ"),
      isCustom: true,
    };
    const updated = [...customData, item];
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
    setModalOpen(false);
  };

  const deleteComplaint = (id) => {
    const updated = customData.filter((c) => c.id !== id);
    setCustomData(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (selected?.id === id) setSelected(null);
  };

  const updateComplaint = (id, updatedData) => {
    const updated = customData.map((c) =>
      c.id == id ? { ...c, ...updatedData } : c,
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
            <i className="fa-solid fa-road-barrier"></i>
          </div>
          <div className={styles.new}>
            <p className={styles.headerSub}>
              ümumi {allComplaints.length} şikayət ·{" "}
              {allComplaints.filter((c) => c.status === "Yeni").length} yeni
            </p>
          </div>
        </div>
        <button className={styles.addBtn} onClick={() => setModalOpen(true)}>
          <i className="fa-solid fa-plus" /> Yeni şikayət əlavə edin
        </button>
      </div>

      <div className={styles.body}>
        <ComplaintList
          data={filtered}
          filter={filter}
          onFilter={setFilter}
          selected={selected}
          onSelect={setSelected}
          onDelete={deleteComplaint}
          onEdit={setEditItem}
        />
        <MiniMap
          complaints={allComplaints}
          selected={selected}
          onSelect={setSelected}
        />
      </div>

      {modalOpen && (
        <AddComplaintModal
          onClose={() => setModalOpen(false)}
          onAdd={addComplaint}
        />
      )}
      {editItem && (
        <ComplainEditModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSave={updateComplaint}
        />
      )}
    </div>
  );
};

export default RoadIssues;
