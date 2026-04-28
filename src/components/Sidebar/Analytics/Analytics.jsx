import React, { useState, useEffect, useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import styles from "./Analytics.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
);

const STORAGE_KEYS = {
  roads: "roadIssues_custom",
  lights: "streetLights_custom",
  waste: "wasteCollections_custom",
  traffic: "trafficIncidents_custom",
  permits: "constructionPermits_custom",
};

const readCustom = () =>
  Object.fromEntries(
    Object.entries(STORAGE_KEYS).map(([k, sk]) => [
      k,
      JSON.parse(localStorage.getItem(sk) || "[]"),
    ]),
  );

const useAllData = () => {
  const [mock, setMock] = useState(null);
  const [custom, setCustom] = useState(readCustom);

  useEffect(() => {
    fetch("/mockData.json")
      .then((r) => r.json())
      .then(setMock);

    const load = () => setCustom(readCustom());
    window.addEventListener("storage", load);
    const interval = setInterval(load, 2000);

    return () => {
      window.removeEventListener("storage", load);
      clearInterval(interval);
    };
  }, []);

  return { mock, custom };
};

const countBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const v = item[key] ?? "Naməlum";
    acc[v] = (acc[v] || 0) + 1;
    return acc;
  }, {});

const MONTHS = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyn",
  "İyl",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
];

const STATUS_COLORS = {
  Yeni: "#f97316",
  İcradadır: "#3b82f6",
  "Həll edildi": "#22c55e",
  Aktiv: "#f97316",
  "Rədd edildi": "#ef4444",
  Normal: "#22c55e",
  Kritik: "#ef4444",
  Dolu: "#f97316",
  Boş: "#94a3b8",
  İşləyir: "#22c55e",
  Nasaz: "#f97316",
  Sönük: "#ef4444",
  Gözləyir: "#eab308",
  Təsdiqləndi: "#22c55e",
  Yüksək: "#ef4444",
  Aşağı: "#22c55e",
};

const RAYON_COLORS = [
  "#f97316",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#eab308",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const wasteColor = (w) => {
  if (w.status === "Kritik" || w.dolulug >= 80) return "#ef4444";
  if (w.dolulug >= 50) return "#f97316";
  return "#22c55e";
};

const TOOLTIP = {
  backgroundColor: "#1c1008",
  titleColor: "#fef3e8",
  bodyColor: "#fff7ed",
  padding: 10,
  cornerRadius: 8,
  titleFont: { family: "'DM Sans',sans-serif", size: 11 },
  bodyFont: { family: "'DM Sans',sans-serif", size: 11 },
};
const TICK = {
  color: "#a8a29e",
  font: { family: "'DM Sans',sans-serif", size: 10 },
};
const GRID_COLOR = "rgba(249,115,22,0.08)";

const lineOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: TOOLTIP },
  scales: {
    x: {
      grid: { display: false },
      ticks: TICK,
      border: { color: "rgba(249,115,22,0.12)" },
    },
    y: {
      grid: { color: GRID_COLOR },
      ticks: TICK,
      border: { dash: [4, 4], color: "transparent" },
    },
  },
};

const barOpts = (horizontal = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: horizontal ? "y" : "x",
  plugins: { legend: { display: false }, tooltip: TOOLTIP },
  scales: {
    x: {
      grid: { color: horizontal ? GRID_COLOR : "transparent" },
      ticks: {
        ...TICK,
        color: horizontal ? "#78716c" : "#a8a29e",
        autoSkip: false,
        maxRotation: horizontal ? 0 : 35,
      },
      border: { dash: [4, 4], color: "rgba(249,115,22,0.1)" },
    },
    y: {
      grid: { color: horizontal ? "transparent" : GRID_COLOR },
      ticks: TICK,
      border: { dash: [4, 4], color: "rgba(249,115,22,0.1)" },
    },
  },
});

const doughnutOpts = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "70%",
  plugins: { legend: { display: false }, tooltip: TOOLTIP },
};

const TopBar = () => {
  const now = new Date();
  const formatted =
    now.toLocaleDateString("az-AZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) +
    " · " +
    now.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={styles.topBar}>
      <div className={styles.topBarRight}>
        <div className={styles.liveDot} />
        <span className={styles.liveLabel}>Canlı</span>
      </div>
    </div>
  );
};

const KpiCard = ({
  icon,
  label,
  value,
  aktiv,
  hell,
  color,
  active,
  onClick,
}) => (
  <div
    className={`${styles.kpiCard} ${active ? styles.kpiCardActive : ""}`}
    onClick={onClick}
  >
    <div className={styles.kpiAccent} style={{ background: color }} />
    <div className={styles.kpiIconRow} style={{ color }}>
      <i className={icon} style={{ fontSize: 13, color }} />
      {label}
    </div>
    <div className={styles.kpiValue} style={{ color }}>
      {value}
    </div>
    <div className={styles.kpiSub}>
      <span style={{ color, fontWeight: 600 }}>{aktiv}</span> aktiv
    </div>
  </div>
);

const LineChartCard = ({ items, title, color, dateKey = "date" }) => {
  const monthly = {};
  items.forEach((item) => {
    const raw = item[dateKey] || item.date || "";
    const parts = raw.split(/[.\-/]/);
    if (parts.length >= 2) {
      const m = parseInt(parts[1], 10) - 1;
      if (m >= 0 && m < 12) monthly[m] = (monthly[m] || 0) + 1;
    }
  });
  const values = MONTHS.map((_, i) => monthly[i] || 0);

  return (
    <div>
      <div className={styles.secTitle}>Aylıq Dinamika</div>
      <div className={styles.chartCard}>
        <div className={styles.chartCardTitle}>
          Hadisə sayı — 2026
          <span className={styles.chartCardSub}>{title}</span>
        </div>
        <div style={{ position: "relative", height: 180 }}>
          <Line
            data={{
              labels: MONTHS,
              datasets: [
                {
                  data: values,
                  borderColor: color,
                  backgroundColor: color + "18",
                  borderWidth: 2.5,
                  pointBackgroundColor: color,
                  pointBorderColor: "#fff",
                  pointBorderWidth: 1.5,
                  pointRadius: 3,
                  pointHoverRadius: 5,
                  fill: true,
                  tension: 0.4,
                },
              ],
            }}
            options={lineOpts}
          />
        </div>
      </div>
    </div>
  );
};

const BarChartCard = ({ data, title, horizontal = false }) => {
  const entries = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => v);
  const colors = labels.map((_, i) => RAYON_COLORS[i % RAYON_COLORS.length]);
  const h = horizontal ? Math.max(entries.length * 36 + 50, 160) : 180;

  return (
    <div>
      <div className={styles.secTitle}>Rayonlar üzrə paylanma</div>
      <div className={styles.chartCard}>
        <div className={styles.chartCardTitle}>
          Ən yüksək rayonlar
          <span className={styles.chartCardSub}>{title}</span>
        </div>
        <div style={{ position: "relative", height: h }}>
          <Bar
            data={{
              labels,
              datasets: [
                {
                  data: values,
                  backgroundColor: colors.map((c) => c + "bb"),
                  hoverBackgroundColor: colors,
                  borderRadius: 6,
                  borderSkipped: false,
                },
              ],
            }}
            options={barOpts(horizontal)}
          />
        </div>
      </div>
    </div>
  );
};

const DonutCard = ({ data, title }) => {
  const entries = Object.entries(data);
  const labels = entries.map(([k]) => k);
  const values = entries.map(([, v]) => v);
  const colors = labels.map(
    (l, i) => STATUS_COLORS[l] ?? RAYON_COLORS[i % RAYON_COLORS.length],
  );
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className={styles.secTitle}>Status bölgüsü</div>
      <div className={styles.chartCard}>
        <div className={styles.chartCardTitle}>
          Paylanma
          <span className={styles.chartCardSub}>{title}</span>
        </div>
        <div style={{ position: "relative", height: 150 }}>
          <Doughnut
            data={{
              labels,
              datasets: [
                {
                  data: values,
                  backgroundColor: colors,
                  borderWidth: 3,
                  borderColor: "#ffffff",
                  hoverOffset: 4,
                },
              ],
            }}
            options={doughnutOpts}
          />
        </div>
        <div>
          {entries.map(([label, val], i) => {
            const pct = Math.round((val / total) * 100);
            return (
              <div key={label} className={styles.legendRow}>
                <div
                  className={styles.legendDot}
                  style={{ background: colors[i] }}
                />
                <span className={styles.legendLabel}>{label}</span>
                <div className={styles.legendBarBg}>
                  <div
                    className={styles.legendBarFill}
                    style={{ width: `${pct}%`, background: colors[i] }}
                  />
                </div>
                <span className={styles.legendVal}>{val}</span>
                <span className={styles.legendPct}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const StatGrid = ({ total, aktiv, hell, thisMonth, color }) => {
  const items = [
    { label: "Ümumi", val: total, color },
    { label: "Aktiv", val: aktiv, color: "#f97316" },
    { label: "Həll edildi", val: hell, color: "#22c55e" },
    { label: "Bu ay", val: thisMonth, color: "#3b82f6" },
  ];
  return (
    <div>
      <div className={styles.secTitle}>Ümumi göstəricilər</div>
      <div className={styles.statGrid}>
        {items.map((s) => (
          <div key={s.label} className={styles.statMini}>
            <div className={styles.statMiniLabel}>{s.label}</div>
            <div className={styles.statMiniVal} style={{ color: s.color }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimelineCard = ({ items }) => (
  <div>
    <div className={styles.secTitle}>Son hadisələr</div>
    <div className={styles.chartCard}>
      {[...items]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5)
        .map((item, i) => {
          const color = STATUS_COLORS[item.status] ?? "#94a3b8";
          return (
            <div key={item.id ?? i} className={styles.timelineItem}>
              <div className={styles.tlDot} style={{ background: color }} />
              <div className={styles.tlBody}>
                <div className={styles.tlTitle}>{item.title}</div>
                <div className={styles.tlMeta}>
                  {item.rayon} · {item.date}
                  {item.time ? ` · ${item.time}` : ""}
                </div>
                <span
                  className={styles.badge}
                  style={{ background: color + "18", color }}
                >
                  {item.status}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  </div>
);

const WasteFillCard = ({ wastePoints }) => {
  const sorted = [...wastePoints]
    .sort((a, b) => (b.dolulug ?? 0) - (a.dolulug ?? 0))
    .slice(0, 6);

  return (
    <div>
      <div className={styles.secTitle}>Tullantı dolululuğu</div>
      <div className={styles.chartCard}>
        <div className={styles.chartCardTitle}>
          Kritik məntəqələr
          <span className={styles.chartCardSub}>dolulug %</span>
        </div>
        {sorted.map((w) => {
          const color = wasteColor(w);
          const pct = w.dolulug ?? (w.status === "Kritik" ? 100 : 0);
          return (
            <div key={w.id} className={styles.fillItem}>
              <div className={styles.fillHead}>
                <span className={styles.fillName}>{w.title}</span>
                <span className={styles.fillPct} style={{ color }}>
                  {w.dolulug != null ? `${w.dolulug}%` : w.status}
                </span>
              </div>
              <div className={styles.fillTrack}>
                <div
                  className={styles.fillBar}
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BottomStrip = ({ roads, traffic, waste, lights, permits }) => {
  const activeTraffic = traffic.filter((t) => t.status === "Aktiv").length;
  const criticalWaste = waste.filter(
    (w) => w.dolulug >= 80 || w.status === "Kritik",
  ).length;
  const nasazLights = lights.filter((l) => l.status !== "İşləyir").length;
  const pendingPermits = permits.filter((p) => p.status === "Gözləyir").length;
  const resolvedRoads = roads.filter((r) => r.status === "Həll edildi").length;

  const items = [
    {
      label: "Aktiv hadisə",
      val: activeTraffic + criticalWaste + nasazLights,
      color: "#f97316",
    },
    { label: "Kritik tullantı", val: criticalWaste, color: "#ef4444" },
    { label: "Nasaz işıq", val: nasazLights, color: "#eab308" },
    { label: "Gözləyən icazə", val: pendingPermits, color: "#eab308" },
    { label: "Həll edildi", val: resolvedRoads, color: "#22c55e" },
  ];

  return (
    <div className={styles.bottomStrip}>
      {items.map((b) => (
        <div key={b.label} className={styles.bsItem}>
          <div className={styles.bsDot} style={{ background: b.color }} />
          <span>{b.label}:</span>
          <span className={styles.bsVal} style={{ color: b.color }}>
            {b.val}
          </span>
        </div>
      ))}
    </div>
  );
};

const getTabs = (data) => {
  const { roads, lights, waste, traffic, permits } = data;
  return [
    {
      key: "roads",
      icon: "fa-solid fa-road-barrier",
      label: "Yol Problemləri",
      color: "#f97316",
      items: roads,
      aktiv: roads.filter((r) => r.status === "İcradadır").length,
      hell: roads.filter((r) => r.status === "Həll edildi").length,
      dateKey: "date",
    },
    {
      key: "traffic",
      icon: "fa-solid fa-car-burst",
      label: "Trafik Hadisələri",
      color: "#ef4444",
      items: traffic,
      aktiv: traffic.filter((t) => t.status === "Aktiv").length,
      hell: traffic.filter((t) => t.status !== "Aktiv").length,
      dateKey: "date",
    },
    {
      key: "lights",
      icon: "fa-solid fa-lightbulb",
      label: "Küçə İşıqları",
      color: "#eab308",
      items: lights,
      aktiv: lights.filter((l) => l.status !== "İşləyir").length,
      hell: lights.filter((l) => l.status === "İşləyir").length,
      dateKey: "date",
    },
    {
      key: "waste",
      icon: "fa-solid fa-trash-can",
      label: "Tullantı Məntəqəsi",
      color: "#a855f7",
      items: waste,
      aktiv: waste.filter((w) => w.dolulug >= 80 || w.status === "Kritik")
        .length,
      hell: waste.filter((w) => w.status === "Normal").length,
      dateKey: "date",
    },
    {
      key: "permits",
      icon: "fa-solid fa-file-contract",
      label: "Tikinti İcazəsi",
      color: "#06b6d4",
      items: permits,
      aktiv: permits.filter((p) => p.status === "Gözləyir").length,
      hell: permits.filter((p) => p.status === "Təsdiqləndi").length,
      dateKey: "tarix",
    },
  ];
};

const Analytics = () => {
  const { mock, custom } = useAllData();
  const [activeKey, setActiveKey] = useState("roads");

  const data = useMemo(() => {
    if (!mock) return null;
    return {
      roads: [...(mock.complaints || []), ...(custom.roads || [])],
      lights: [...(mock.streetLights || []), ...(custom.lights || [])],
      waste: [...(mock.wastePoints || []), ...(custom.waste || [])],
      traffic: [...(mock.trafficIncidents || []), ...(custom.traffic || [])],
      permits: [...(mock.permits || []), ...(custom.permits || [])],
    };
  }, [mock, custom]);

  if (!data)
    return (
      <div className={styles.analyticsWrapper}>
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin fa-xl" />
          <span>Yüklənir...</span>
        </div>
      </div>
    );

  const tabs = getTabs(data);
  const active = tabs.find((t) => t.key === activeKey) || tabs[0];

  const thisMonth = (() => {
    const now = new Date();
    return active.items.filter((item) => {
      const raw = item[active.dateKey] || item.date || "";
      const parts = raw.split(/[.\-/]/);
      return parts.length >= 2 && parseInt(parts[1], 10) - 1 === now.getMonth();
    }).length;
  })();

  const statusData = countBy(active.items, "status");
  const rayonData = countBy(active.items, "rayon");

  return (
    <div className={styles.analyticsWrapper}>
      <TopBar />
      <div className={styles.kpiRow}>
        {tabs.map((tab) => (
          <KpiCard
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            value={tab.items.length}
            aktiv={tab.aktiv}
            hell={tab.hell}
            color={tab.color}
            active={activeKey === tab.key}
            onClick={() => setActiveKey(tab.key)}
          />
        ))}
      </div>
      <div className={styles.mainGrid}>
        <div className={styles.leftCol}>
          <LineChartCard
            items={active.items}
            title={active.label}
            color={active.color}
            dateKey={active.dateKey}
          />
          <BarChartCard data={rayonData} title={active.label} horizontal />
          <TimelineCard items={active.items} />
        </div>
        <div className={styles.rightCol}>
          <DonutCard data={statusData} title={active.label} />
          <StatGrid
            total={active.items.length}
            aktiv={active.aktiv}
            hell={active.hell}
            thisMonth={thisMonth}
            color={active.color}
          />
          <WasteFillCard wastePoints={data.waste} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
