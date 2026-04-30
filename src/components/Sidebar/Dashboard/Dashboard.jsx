import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  Tag,
  Select,
  Input,
  Button,
  Popconfirm,
  Tabs,
  ConfigProvider,
  Badge,
  Tooltip,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  TimePicker,
  message,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  LockOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import styles from "./Dashboard.module.css";

const THEME = {
  token: {
    colorPrimary: "#f97316",
    colorPrimaryHover: "#ea6b0e",
    colorPrimaryActive: "#dc5c05",
    colorBorder: "rgba(249,115,22,0.2)",
    colorBorderSecondary: "rgba(249,115,22,0.12)",
    borderRadius: 8,
    fontFamily: "'DM Sans', sans-serif",
    colorBgContainer: "#ffffff",
    colorBgElevated: "#ffffff",
    colorText: "#1c1008",
    colorTextSecondary: "#78716c",
    colorTextPlaceholder: "#a8a29e",
    colorFillAlter: "#fdf6ee",
    colorFillSecondary: "#fef3e8",
    controlHeight: 36,
    fontSize: 14,
  },
  components: {
    Table: {
      headerBg: "#fff7ed",
      headerColor: "#92400e",
      rowHoverBg: "#fef9f5",
      borderColor: "rgba(249,115,22,0.1)",
      cellPaddingBlock: 13,
      cellPaddingInline: 16,
    },
    Tabs: {
      inkBarColor: "#f97316",
      itemActiveColor: "#f97316",
      itemSelectedColor: "#f97316",
      itemHoverColor: "#fb923c",
      titleFontSize: 13,
    },
    Select: { optionSelectedBg: "#fff7ed", optionSelectedColor: "#f97316" },
    Input: { activeBorderColor: "#f97316", hoverBorderColor: "#fb923c" },
    Button: {
      defaultBorderColor: "rgba(249,115,22,0.3)",
      defaultColor: "#f97316",
    },
    Modal: { titleFontSize: 15 },
  },
};

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

const saveCustom = (key, arr) => {
  localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(arr));
  window.dispatchEvent(new Event("storage"));
};

const useAllData = () => {
  const [mock, setMock] = useState(null);
  const [custom, setCustom] = useState(readCustom);

  useEffect(() => {
    fetch("/mockData.json")
      .then((r) => r.json())
      .then(setMock);
    const load = () => setCustom(readCustom());
    window.addEventListener("storage", load);
    const iv = setInterval(load, 2000);
    return () => {
      window.removeEventListener("storage", load);
      clearInterval(iv);
    };
  }, []);

  return { mock, custom };
};

const STATUS_META = {
  Yeni: {
    color: "#f97316",
    bg: "#fff7ed",
    icon: <ExclamationCircleOutlined />,
  },
  İcradadır: { color: "#3b82f6", bg: "#eff6ff", icon: <SyncOutlined spin /> },
  "Həll edildi": {
    color: "#22c55e",
    bg: "#f0fdf4",
    icon: <CheckCircleOutlined />,
  },
  Aktiv: {
    color: "#ef4444",
    bg: "#fef2f2",
    icon: <ExclamationCircleOutlined />,
  },
  "Rədd edildi": {
    color: "#ef4444",
    bg: "#fef2f2",
    icon: <CloseCircleOutlined />,
  },
  Gözləyir: { color: "#eab308", bg: "#fefce8", icon: <ClockCircleOutlined /> },
  Təsdiqləndi: {
    color: "#22c55e",
    bg: "#f0fdf4",
    icon: <CheckCircleOutlined />,
  },
  Normal: { color: "#22c55e", bg: "#f0fdf4", icon: <CheckCircleOutlined /> },
  Kritik: {
    color: "#ef4444",
    bg: "#fef2f2",
    icon: <ExclamationCircleOutlined />,
  },
  Nasaz: {
    color: "#f97316",
    bg: "#fff7ed",
    icon: <ExclamationCircleOutlined />,
  },
  Sönük: { color: "#ef4444", bg: "#fef2f2", icon: <CloseCircleOutlined /> },
  İşləyir: { color: "#22c55e", bg: "#f0fdf4", icon: <CheckCircleOutlined /> },
  Dolu: {
    color: "#f97316",
    bg: "#fff7ed",
    icon: <ExclamationCircleOutlined />,
  },
  Boş: { color: "#94a3b8", bg: "#f8fafc", icon: <ClockCircleOutlined /> },
};

const STATUS_OPTIONS = {
  roads: ["Yeni", "İcradadır", "Həll edildi"],
  traffic: ["Aktiv", "Həll edildi", "Rədd edildi"],
  lights: ["İşləyir", "Nasaz", "Sönük"],
  waste: ["Normal", "Dolu", "Kritik", "Boş"],
  permits: ["Gözləyir", "Təsdiqləndi", "Rədd edildi"],
};

const SEVERITY_OPTIONS = ["Yüksək", "Orta", "Aşağı"];
const WASTE_NOV = ["Ümumi", "Plastik", "Üzvi", "Kağız", "Şüşə", "Metal"];
const PERMIT_TYPES = [
  "Yaşayış",
  "Kommersiya",
  "İnfrastruktur",
  "Sənaye",
  "İctimai",
];

const StatusTag = ({ status }) => {
  const m = STATUS_META[status] ?? {
    color: "#94a3b8",
    bg: "#f8fafc",
    icon: null,
  };
  return (
    <Tag
      icon={m.icon}
      style={{
        color: m.color,
        background: m.bg,
        border: `1px solid ${m.color}30`,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        width: 130,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        textAlign: "center",
        padding: "2px 0",
        margin: 0,
      }}
    >
      {status}
    </Tag>
  );
};

const SeverityTag = ({ v }) => {
  const c = v === "Yüksək" ? "#ef4444" : v === "Orta" ? "#f97316" : "#22c55e";
  return (
    <Tag
      style={{
        color: c,
        background: c + "15",
        border: `1px solid ${c}30`,
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        width: 80,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2px 0",
        margin: 0,
      }}
    >
      {v}
    </Tag>
  );
};

const DolulugBar = ({ v }) => {
  if (v == null) return <span style={{ color: "#a8a29e" }}>—</span>;
  const c = v >= 80 ? "#ef4444" : v >= 50 ? "#f97316" : "#22c55e";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "#f1f5f9",
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${v}%`,
            height: "100%",
            background: c,
            borderRadius: 99,
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color: c, minWidth: 36 }}>
        {v}%
      </span>
    </div>
  );
};

const TABS = [
  {
    key: "traffic",
    label: "Trafik Hadisələri",
    icon: "fa-solid fa-car-burst",
    color: "#ef4444",
  },
  {
    key: "roads",
    label: "Yol Problemləri",
    icon: "fa-solid fa-road-barrier",
    color: "#f97316",
  },

  {
    key: "lights",
    label: "Küçə İşıqları",
    icon: "fa-solid fa-lightbulb",
    color: "#eab308",
  },
  {
    key: "waste",
    label: "Tullantı Məntəqələri",
    icon: "fa-solid fa-trash-can",
    color: "#a855f7",
  },
  {
    key: "permits",
    label: "Tikinti İcazələri",
    icon: "fa-solid fa-file-contract",
    color: "#06b6d4",
  },
];

const EditModal = ({ open, record, tabKey, onClose, onSave }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (record && open) {
      const vals = { ...record };
      if (vals.date) vals.date = dayjs(vals.date, ["DD.MM.YYYY", "YYYY-MM-DD"]);
      if (vals.baslangic)
        vals.baslangic = dayjs(vals.baslangic, ["DD.MM.YYYY", "YYYY-MM-DD"]);
      if (vals.bitis)
        vals.bitis = dayjs(vals.bitis, ["DD.MM.YYYY", "YYYY-MM-DD"]);
      if (vals.time) vals.time = dayjs(vals.time, "HH:mm");
      form.setFieldsValue(vals);
    }
  }, [record, open, form]);

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      const toDate = (d, fmt = "DD.MM.YYYY") =>
        d ? dayjs(d).format(fmt) : null;
      const updated = {
        ...record,
        ...vals,
        date: toDate(vals.date),
        baslangic: vals.baslangic ? toDate(vals.baslangic) : record.baslangic,
        bitis: vals.bitis ? toDate(vals.bitis) : record.bitis,
        time: vals.time ? dayjs(vals.time).format("HH:mm") : record.time,
      };
      onSave(updated);
    } catch (_) {}
  };

  const labelStyle = { fontSize: 12, fontWeight: 600, color: "#78716c" };
  const fi = (name, label, node, rules) => (
    <Form.Item
      name={name}
      label={<span style={labelStyle}>{label}</span>}
      rules={rules}
      style={{ marginBottom: 10 }}
    >
      {node}
    </Form.Item>
  );

  const commonFields = (
    <>
      {fi("title", "Başlıq", <Input />, [
        { required: true, message: "Başlıq daxil edin" },
      ])}
      {fi("rayon", "Rayon", <Input />)}
      {fi("unvan", "Ünvan", <Input />)}
      {fi(
        "status",
        "Status",
        <Select
          options={STATUS_OPTIONS[tabKey]?.map((s) => ({
            value: s,
            label: <StatusTag status={s} />,
          }))}
        />,
        [{ required: true }],
      )}
      {fi(
        "date",
        "Tarix",
        <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />,
      )}
    </>
  );

  const extraFields = {
    roads: <>{fi("tesvir", "Təsvir", <Input.TextArea rows={2} />)}</>,
    traffic: (
      <>
        {fi(
          "severity",
          "Ciddilik",
          <Select
            options={SEVERITY_OPTIONS.map((s) => ({
              value: s,
              label: <SeverityTag v={s} />,
            }))}
          />,
        )}
        {fi("type", "Növ", <Input />)}
        {fi(
          "time",
          "Vaxt",
          <TimePicker format="HH:mm" style={{ width: "100%" }} />,
        )}
        {fi("tesvir", "Təsvir", <Input.TextArea rows={2} />)}
      </>
    ),
    lights: <>{fi("tesvir", "Təsvir", <Input.TextArea rows={2} />)}</>,
    waste: (
      <>
        {fi(
          "növ",
          "Növ",
          <Select options={WASTE_NOV.map((s) => ({ value: s, label: s }))} />,
        )}
        {fi(
          "dolulug",
          "Dolululuq (%)",
          <InputNumber min={0} max={100} style={{ width: "100%" }} />,
        )}
        {fi("toplamaVaxti", "Toplama vaxtı", <Input />)}
      </>
    ),
    permits: (
      <>
        {fi(
          "type",
          "Növ",
          <Select
            options={PERMIT_TYPES.map((s) => ({ value: s, label: s }))}
          />,
        )}
        {fi("muracietci", "Müraciətçi", <Input />)}
        {fi(
          "mertebe",
          "Mərtəbə sayı",
          <InputNumber min={0} style={{ width: "100%" }} />,
        )}
        {fi(
          "sahe",
          "Sahə (m²)",
          <InputNumber min={0} style={{ width: "100%" }} />,
        )}
        {fi(
          "baslangic",
          "Başlanğıc",
          <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />,
        )}
        {fi(
          "bitis",
          "Bitmə tarixi",
          <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} />,
        )}
      </>
    ),
  };

  return (
    <Modal
      open={open}
      title={
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
          }}
        >
          <EditOutlined style={{ color: "#f97316", marginRight: 8 }} />
          Redaktə et
        </span>
      }
      onOk={handleOk}
      onCancel={onClose}
      okText="Yadda saxla"
      cancelText="Ləğv et"
      okButtonProps={{
        style: { background: "#f97316", borderColor: "#f97316" },
      }}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {commonFields}
        {extraFields[tabKey]}
      </Form>
    </Modal>
  );
};

const EllipsisCell = ({ value, width, fontSize = 13.5, color = "#78716c" }) => {
  if (!value) return <span style={{ color: "#d1d5db" }}>—</span>;
  return (
    <Tooltip title={value} placement="topLeft" mouseEnterDelay={0.3}>
      <div
        style={{
          maxWidth: width || "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          fontSize,
          color,
          cursor: "default",
        }}
      >
        {value}
      </div>
    </Tooltip>
  );
};

const buildColumns = (tabKey, onEdit, onDelete) => {
  const actionCol = {
    title: "Əməliyyat",
    key: "actions",
    width: 110,
    fixed: "right",
    render: (_, record) => {
      const isCustom = !!record.isCustom;
      return (
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <Tooltip title="Xəritədə gör">
            <Button
              size="small"
              type="text"
              icon={
                <i
                  className="fa-solid fa-location-dot"
                  style={{ fontSize: 12, color: "#f97316" }}
                />
              }
              style={{ padding: "3px 7px" }}
              onClick={() => {
                if (record.lat && record.lng)
                  window.open(
                    `https://maps.google.com/?q=${record.lat},${record.lng}`,
                    "_blank",
                  );
              }}
            />
          </Tooltip>

          <Tooltip
            title={
              isCustom
                ? "Redaktə et"
                : "Yalnız öz əlavələrinizi redaktə edə bilərsiniz"
            }
          >
            <Button
              size="small"
              type="text"
              icon={
                isCustom ? (
                  <EditOutlined style={{ fontSize: 12, color: "#3b82f6" }} />
                ) : (
                  <LockOutlined style={{ fontSize: 12, color: "#d1d5db" }} />
                )
              }
              style={{ padding: "3px 7px" }}
              disabled={!isCustom}
              onClick={() => isCustom && onEdit(record)}
            />
          </Tooltip>

          {isCustom ? (
            <Popconfirm
              title="Bu qeydi silmək istəyirsiniz?"
              description="Əməliyyat geri alına bilməz."
              onConfirm={() => onDelete(record.id)}
              okText="Sil"
              cancelText="Ləğv et"
              okButtonProps={{ danger: true, size: "small" }}
              cancelButtonProps={{ size: "small" }}
            >
              <Tooltip title="Sil">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined style={{ fontSize: 12 }} />}
                  style={{ padding: "3px 7px" }}
                />
              </Tooltip>
            </Popconfirm>
          ) : (
            <Tooltip title="Yalnız öz əlavələrinizi silə bilərsiniz">
              <Button
                size="small"
                type="text"
                disabled
                icon={
                  <LockOutlined style={{ fontSize: 12, color: "#d1d5db" }} />
                }
                style={{ padding: "3px 7px" }}
              />
            </Tooltip>
          )}
        </div>
      );
    },
  };

  const numCol = {
    title: "#",
    key: "index",
    width: 50,
    render: (_, __, i) => (
      <span style={{ color: "#a8a29e", fontSize: 12 }}>{i + 1}</span>
    ),
  };

  const titleCol = {
    title: "Başlıq",
    dataIndex: "title",
    key: "title",
    width: 220,
    render: (v, r) => (
      <div>
        <Tooltip title={v} placement="topLeft" mouseEnterDelay={0.3}>
          <div
            style={{
              fontWeight: 600,
              color: "#1c1008",
              fontSize: 13.5,
              maxWidth: 200,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              cursor: "default",
            }}
          >
            {v}
          </div>
        </Tooltip>
        {r.isCustom && (
          <span
            style={{
              fontSize: 10,
              color: "#f97316",
              background: "#fff7ed",
              border: "1px solid #f9731630",
              borderRadius: 99,
              padding: "0 7px",
              marginTop: 3,
              display: "inline-block",
            }}
          >
            Yeni əlavə
          </span>
        )}
      </div>
    ),
  };

  const rayonCol = {
    title: "Rayon",
    dataIndex: "rayon",
    key: "rayon",
    width: 145,
    render: (v) => (
      <span style={{ fontSize: 13, color: "#78716c" }}>{v || "—"}</span>
    ),
  };

  const unvanCol = {
    title: "Ünvan",
    dataIndex: "unvan",
    key: "unvan",
    width: 200,
    render: (v) => <EllipsisCell value={v} width={180} fontSize={13} />,
  };

  const statusCol = () => ({
    title: "Status",
    dataIndex: "status",
    key: "status",
    width: 155,
    render: (status) => <StatusTag status={status} />,
  });

  const dateCol = () => ({
    title: "Tarix",
    dataIndex: "date",
    key: "date",
    width: 115,
    render: (v) => (
      <span style={{ fontSize: 12.5, color: "#a8a29e" }}>{v || "—"}</span>
    ),
  });

  const txt = (v) => (
    <span style={{ fontSize: 13, color: "#78716c" }}>{v || "—"}</span>
  );
  const dim = (v) => (
    <span style={{ fontSize: 12.5, color: "#a8a29e" }}>{v || "—"}</span>
  );

  const tesvCol = {
    title: "Təsvir",
    dataIndex: "tesvir",
    key: "tesvir",
    width: 240,
    render: (v) => <EllipsisCell value={v} width={220} fontSize={13} />,
  };

  const MAP = {
    roads: [
      numCol,
      titleCol,
      rayonCol,
      unvanCol,
      tesvCol,
      statusCol(),
      dateCol(),
      actionCol,
    ],
    traffic: [
      numCol,
      titleCol,
      rayonCol,
      unvanCol,
      {
        title: "Ciddilik",
        dataIndex: "severity",
        key: "severity",
        width: 105,
        render: (v) =>
          v ? (
            <SeverityTag v={v} />
          ) : (
            <span style={{ color: "#d1d5db" }}>—</span>
          ),
      },
      {
        title: "Növ",
        dataIndex: "type",
        key: "type",
        width: 110,
        render: txt,
      },
      {
        title: "Vaxt",
        dataIndex: "time",
        key: "time",
        width: 80,
        render: dim,
      },
      tesvCol,
      statusCol(),
      dateCol(),
      actionCol,
    ],
    lights: [
      numCol,
      titleCol,
      rayonCol,
      unvanCol,
      tesvCol,
      statusCol(),
      dateCol(),
      actionCol,
    ],
    waste: [
      numCol,
      titleCol,
      rayonCol,
      unvanCol,
      {
        title: "Növ",
        dataIndex: "növ",
        key: "nov",
        width: 100,
        render: txt,
      },
      {
        title: "Dolululuq",
        dataIndex: "dolulug",
        key: "dolulug",
        width: 155,
        render: (v) => <DolulugBar v={v} />,
      },
      {
        title: "Toplama vaxtı",
        dataIndex: "toplamaVaxti",
        key: "toplamaVaxti",
        width: 190,
        render: (v) => (
          <EllipsisCell value={v} width={170} fontSize={12.5} color="#a8a29e" />
        ),
      },
      statusCol(),
      dateCol(),
      actionCol,
    ],
    permits: [
      numCol,
      titleCol,
      rayonCol,
      unvanCol,
      {
        title: "Növ",
        dataIndex: "type",
        key: "type",
        width: 120,
        render: txt,
      },
      {
        title: "Müraciətçi",
        dataIndex: "muracietci",
        key: "muracietci",
        width: 170,
        render: (v) => <EllipsisCell value={v} width={150} fontSize={13} />,
      },
      {
        title: "Mərtəbə",
        dataIndex: "mertebe",
        key: "mertebe",
        width: 90,
        render: (v) => (
          <span style={{ fontSize: 13, color: "#a8a29e" }}>
            {v > 0 ? v : "—"}
          </span>
        ),
      },
      {
        title: "Sahə (m²)",
        dataIndex: "sahe",
        key: "sahe",
        width: 105,
        render: (v) => (
          <span style={{ fontSize: 13, color: "#a8a29e" }}>
            {v ? v.toLocaleString() : "—"}
          </span>
        ),
      },
      {
        title: "Başlanğıc",
        dataIndex: "baslangic",
        key: "baslangic",
        width: 110,
        render: dim,
      },
      {
        title: "Bitmə tarixi",
        dataIndex: "bitis",
        key: "bitis",
        width: 120,
        render: dim,
      },
      statusCol(),
      dateCol(),
      actionCol,
    ],
  };

  return MAP[tabKey] || [];
};

const DataTable = ({ tabKey, items, color, onDelete, onEdit }) => {
  const [search, setSearch] = useState("");
  const [filterRayon, setFilterRayon] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);

  const rayonList = useMemo(
    () => [...new Set(items.map((i) => i.rayon).filter(Boolean))].sort(),
    [items],
  );

  const filtered = useMemo(
    () =>
      items.filter((item) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          item.title?.toLowerCase().includes(q) ||
          item.rayon?.toLowerCase().includes(q) ||
          item.unvan?.toLowerCase().includes(q);
        const matchRayon = !filterRayon || item.rayon === filterRayon;
        const matchStatus = !filterStatus || item.status === filterStatus;
        return matchSearch && matchRayon && matchStatus;
      }),
    [items, search, filterRayon, filterStatus],
  );

  const columns = useMemo(
    () => buildColumns(tabKey, onEdit, onDelete),
    [tabKey, onEdit, onDelete],
  );

  return (
    <div className={styles.tableWrap}>
      <div className={styles.filterRow}>
        <div className={styles.filterItem}>
          <Input
            prefix={
              <SearchOutlined style={{ color: "#a8a29e", fontSize: 13 }} />
            }
            placeholder="Başlıq, rayon, ünvan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%" }}
            allowClear
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder="Rayon"
            allowClear
            style={{ width: "100%" }}
            value={filterRayon}
            onChange={setFilterRayon}
            options={rayonList.map((r) => ({ value: r, label: r }))}
          />
        </div>
        <div className={styles.filterItem}>
          <Select
            placeholder="Status"
            allowClear
            style={{ width: "100%" }}
            value={filterStatus}
            onChange={setFilterStatus}
            options={STATUS_OPTIONS[tabKey].map((s) => ({
              value: s,
              label: <StatusTag status={s} />,
            }))}
          />
        </div>
        <Tooltip title="Filterləri sıfırla">
          <Button
            size="middle"
            type={search || filterRayon || filterStatus ? "primary" : "default"}
            icon={
              <i className="fa-solid fa-rotate-left" style={{ fontSize: 13 }} />
            }
            disabled={!search && !filterRayon && !filterStatus}
            onClick={() => {
              setSearch("");
              setFilterRayon(null);
              setFilterStatus(null);
            }}
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: search || filterRayon || filterStatus ? 1 : 0.35,
            }}
          />
        </Tooltip>
        <div className={styles.tableCount}>
          <span style={{ color }}>{filtered.length}</span>
          <span style={{ color: "#d1d5db", margin: "0 3px" }}>/</span>
          <span>{items.length}</span>
          {items.filter((i) => i.isCustom).length > 0 && (
            <span
              style={{
                marginLeft: 8,
                color: "#f97316",
                fontSize: 11,
                fontWeight: 600,
                background: "#fff7ed",
                border: "1px solid #f9731625",
                borderRadius: 99,
                padding: "1px 8px",
              }}
            >
              +{items.filter((i) => i.isCustom).length}
            </span>
          )}
        </div>
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey={(r) => r.id}
        size="middle"
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          style: { marginTop: 0, marginBottom: 0 },
        }}
        scroll={{ x: "max-content" }}
        rowClassName={(r) => (r.isCustom ? styles.customRow : "")}
        locale={{ emptyText: "Məlumat tapılmadı" }}
      />
    </div>
  );
};
const Dashboard = () => {
  const { mock, custom } = useAllData();
  const [activeTab, setActiveTab] = useState("traffic");
  const [editRecord, setEditRecord] = useState(null);
  const [editTabKey, setEditTabKey] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();

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

  const handleEdit = (tabKey, record) => {
    setEditTabKey(tabKey);
    setEditRecord(record);
  };

  const handleSave = (updated) => {
    const arr = JSON.parse(
      localStorage.getItem(STORAGE_KEYS[editTabKey]) || "[]",
    );
    const idx = arr.findIndex((r) => r.id === updated.id);
    if (idx !== -1) {
      arr[idx] = { ...arr[idx], ...updated };
      saveCustom(editTabKey, arr);
      messageApi.success("Qeyd uğurla yeniləndi");
    }
    setEditRecord(null);
  };

  const handleDelete = (tabKey, id) => {
    const arr = JSON.parse(localStorage.getItem(STORAGE_KEYS[tabKey]) || "[]");
    saveCustom(
      tabKey,
      arr.filter((r) => r.id !== id),
    );
    messageApi.success("Qeyd silindi");
  };

  if (!data)
    return (
      <div className={styles.dashWrapper}>
        <div className={styles.loading}>
          <i className="fa-solid fa-spinner fa-spin fa-xl" />
          <span>Yüklənir...</span>
        </div>
      </div>
    );

  const tabItems = TABS.map((tab) => ({
    key: tab.key,
    label: (
      <span className={styles.tabLabel}>
        <i className={tab.icon} style={{ color: "#f97316", fontSize: 13 }} />
        {tab.label}
        <Badge
          count={data[tab.key]?.length}
          style={{
            backgroundColor:
              activeTab === tab.key ? "#f97316" : "rgba(249,115,22,0.12)",
            color: activeTab === tab.key ? "#fff" : "#f97316",
            fontSize: 10,
            fontWeight: 700,
            boxShadow: "none",
            minWidth: 20,
            height: 20,
            lineHeight: "20px",
          }}
        />
      </span>
    ),
    children: (
      <DataTable
        tabKey={tab.key}
        items={data[tab.key] || []}
        color={tab.color}
        onDelete={(id) => handleDelete(tab.key, id)}
        onEdit={(record) => handleEdit(tab.key, record)}
      />
    ),
  }));

  return (
    <ConfigProvider theme={THEME}>
      {contextHolder}
      <div className={styles.dashWrapper}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <i className="fa-solid fa-chart-pie" />
            </div>
            <div>
              <div className={styles.headerSub}>
                Bütün dataların idarə edilməsi paneli
              </div>
            </div>
          </div>
          <div className={styles.headerRight}></div>
        </div>
        <div className={styles.tableSection}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className={styles.tabs}
            tabBarStyle={{
              marginBottom: 0,
              padding: 0,
              background: "#fff",
              borderBottom: "1.5px solid rgba(249,115,22,0.1)",
            }}
          />
        </div>
      </div>
      <EditModal
        open={!!editRecord}
        record={editRecord}
        tabKey={editTabKey}
        onClose={() => setEditRecord(null)}
        onSave={handleSave}
      />
    </ConfigProvider>
  );
};

export default Dashboard;
