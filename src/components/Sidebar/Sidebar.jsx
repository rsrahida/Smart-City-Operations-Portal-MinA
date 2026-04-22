import React, { useState } from "react";
import styles from "./Sidebar.module.css";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/", icon: "fa-solid fa-map-location-dot", label: "Canlı Xəritə" },
  { to: "/dashboard", icon: "fa-solid fa-chart-pie", label: "Admin Panel" },
  { to: "/analytics", icon: "fa-solid fa-chart-line", label: "Analitika" },
  {
    to: "/roadissues",
    icon: "fa-solid fa-road-barrier",
    label: "Yol Problemləri",
  },
  { to: "/streetlight", icon: "fa-solid fa-lightbulb", label: "Küçə İşıqları" },
  {
    to: "/wastecollections",
    icon: "fa-solid fa-trash-can",
    label: "Tullantı Məntəqələri",
  },
  {
    to: "/trafficincidents",
    icon: "fa-solid fa-car-burst",
    label: "NQ Hadisələri",
  },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <div className={styles.sidebarHeader}>
        <div
          className={styles.sidebarLoqo}
          onClick={() => collapsed && setCollapsed(false)}
        >
          <i className="fa-solid fa-city"></i>
        </div>
        <div className={styles.titleBlock}>
          <div className={styles.title}>SmartCity</div>
          <div className={styles.titleSub}>Ops Portal · Bakı</div>
        </div>
        <button
          className={styles.toggleButton}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          <i className="fa-solid fa-bars"></i>
        </button>
      </div>

      <div className={styles.sections}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ""}`
            }
          >
            <div className={styles.navIcon}>
              <i className={item.icon}></i>
            </div>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
