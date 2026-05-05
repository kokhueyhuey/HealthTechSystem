import { useState } from "react";
import type { LoginResponse } from "../../services/api";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section = "home" | "inventory" | "alerts" | "queue";

type MedStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Expired";

interface Medicine {
  name: string; qty: number; threshold: number; expiry: string; status: MedStatus;
}

const MEDICINES: Medicine[] = [
  { name: "Paracetamol 500mg", qty: 320, threshold: 50,  expiry: "2027-03-01", status: "In Stock" },
  { name: "Amoxicillin 250mg", qty: 30,  threshold: 50,  expiry: "2026-08-15", status: "Low Stock" },
  { name: "Metformin 500mg",   qty: 0,   threshold: 30,  expiry: "2026-12-01", status: "Out of Stock" },
  { name: "Atorvastatin 20mg", qty: 80,  threshold: 20,  expiry: "2025-11-30", status: "Expired" },
  { name: "Ibuprofen 400mg",   qty: 200, threshold: 40,  expiry: "2027-06-01", status: "In Stock" },
];

export default function PharmacistDashboard({ user, onLogout }: Props) {
  const [active, setActive] = useState<Section>("home");

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={{ ...styles.logoMark, background: "#f59e0b" }}>H</div>
          <span style={styles.brandName}>HealthTech</span>
        </div>

        <div style={styles.userBadge}>
          <div style={{ ...styles.avatar, background: "#f59e0b" }}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user.name}</div>
            <div style={{ ...styles.userRole, color: "#fbbf24" }}>Pharmacist</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: "home",      label: "🏠  Overview" },
            { id: "inventory", label: "📦  Medicine Inventory" },
            { id: "alerts",    label: "🚨  Low Stock Alerts" },
            { id: "queue",     label: "🔔  Queue Management" },
          ].map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(active === item.id ? { background: "rgba(245,158,11,0.15)", color: "#fbbf24" } : {}) }}
              onClick={() => setActive(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={onLogout}>Sign out</button>
      </aside>

      <main style={styles.main}>
        {active === "home"      && <HomeSection name={user.name} setActive={setActive} medicines={MEDICINES} />}
        {active === "inventory" && <InventorySection medicines={MEDICINES} />}
        {active === "alerts"    && <AlertsSection medicines={MEDICINES} />}
        {active === "queue"     && <QueueSection />}
      </main>
    </div>
  );
}

function HomeSection({ name, setActive, medicines }: { name: string; setActive: (s: Section) => void; medicines: Medicine[] }) {
  const lowCount = medicines.filter(m => m.status === "Low Stock" || m.status === "Out of Stock").length;
  const cards = [
    { label: "Medicine Inventory", icon: "📦", color: "#f59e0b", desc: `${medicines.length} medicines tracked`, id: "inventory" },
    { label: "Low Stock Alerts",   icon: "🚨", color: "#ef4444", desc: `${lowCount} items need attention`, id: "alerts" },
    { label: "Queue Management",   icon: "🔔", color: "#8b5cf6", desc: "Call next patient number", id: "queue" },
  ];
  return (
    <div>
      <h1 style={styles.pageTitle}>Welcome, {name} 💊</h1>
      <p style={styles.pageSub}>Pharmacy dashboard — manage stock and patient queue</p>
      {lowCount > 0 && (
        <div style={styles.alertBanner}>
          🚨 {lowCount} medicine(s) require restocking. <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setActive("alerts")}>View alerts →</span>
        </div>
      )}
      <div style={styles.cardGrid}>
        {cards.map(c => (
          <div key={c.id} style={{ ...styles.featureCard, borderTop: `3px solid ${c.color}` }}
            onClick={() => setActive(c.id as Section)}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{c.icon}</div>
            <div style={styles.cardTitle}>{c.label}</div>
            <div style={styles.cardDesc}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InventorySection({ medicines }: { medicines: Medicine[] }) {
  // Status colour map — each colour represents a medicine state.
  const statusStyle: Record<MedStatus, React.CSSProperties> = {
    "In Stock":    { color: "#34d399", background: "rgba(52,211,153,0.1)",  border: "1px solid rgba(52,211,153,0.3)"  },
    "Low Stock":   { color: "#fbbf24", background: "rgba(251,191,36,0.1)",  border: "1px solid rgba(251,191,36,0.3)"  },
    "Out of Stock":{ color: "#f87171", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)" },
    "Expired":     { color: "#a78bfa", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)" },
  };
  return (
    <div>
      <h2 style={styles.pageTitle}>Medicine Inventory</h2>
      <p style={styles.pageSub}>
        State Pattern (Design Pattern 3) will manage these states as separate classes.<br/>
        In Stock → Low Stock → Out of Stock / Expired based on qty and expiry date.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Medicine", "Qty", "Threshold", "Expiry", "Status"].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => (
              <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <td style={styles.td}>{m.name}</td>
                <td style={styles.td}>{m.qty}</td>
                <td style={styles.td}>{m.threshold}</td>
                <td style={styles.td}>{m.expiry}</td>
                <td style={styles.td}>
                  <span style={{ ...styles.statusPill, ...statusStyle[m.status] }}>{m.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AlertsSection({ medicines }: { medicines: Medicine[] }) {
  const alerts = medicines.filter(m => m.status !== "In Stock");
  return (
    <div>
      <h2 style={styles.pageTitle}>Low Stock Alerts</h2>
      <p style={styles.pageSub}>Medicines that need immediate attention</p>
      {alerts.length === 0 ? (
        <div style={styles.successBox}>✅ All medicines are sufficiently stocked.</div>
      ) : (
        alerts.map((m, i) => {
          const isExpired  = m.status === "Expired";
          const isOut      = m.status === "Out of Stock";
          const color      = isExpired ? "#a78bfa" : isOut ? "#f87171" : "#fbbf24";
          return (
            <div key={i} style={{ ...styles.alertCard, borderLeft: `4px solid ${color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: 16 }}>{m.name}</div>
                  <div style={{ color: "#8892a4", fontSize: 13, marginTop: 4 }}>
                    {isExpired  ? `Expired on ${m.expiry}` :
                     isOut      ? "Out of stock — reorder immediately" :
                     `Only ${m.qty} left (threshold: ${m.threshold})`}
                  </div>
                </div>
                <span style={{ color, fontSize: 13, fontWeight: 600 }}>{m.status}</span>
              </div>
              <button style={{ ...styles.restockBtn, color, border: `1px solid ${color}` }}>
                Request Restock
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

function QueueSection() {
  // Queue call number — Observer Pattern push real-time updates here.
  const [current, setCurrent] = useState(9);

  function callNext() { setCurrent(prev => prev + 1); }

  return (
    <div>
      <h2 style={styles.pageTitle}>Queue Management</h2>
      <p style={styles.pageSub}>Call the next patient to the pharmacy counter</p>
      <div style={styles.queueCard}>
        <div style={{ color: "#8892a4", fontSize: 14, marginBottom: 8 }}>Now serving</div>
        <div style={styles.queueNumber}>Q-0{String(current).padStart(2,"0")}</div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "20px 0" }} />
        <button style={styles.callBtn} onClick={callNext}>
          📢 Call Next Patient
        </button>
        <div style={{ marginTop: 16, background: "rgba(139,92,246,0.1)", borderRadius: 10, padding: 12 }}>
          <div style={{ color: "#a78bfa", fontSize: 13 }}>
            🔔 Observer Pattern will broadcast this number to all Patient dashboards in real-time via SignalR when teammates implement it.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout:    { display: "flex", minHeight: "100vh", background: "#0f1117", fontFamily: "'Segoe UI', sans-serif" },
  sidebar:   { width: 240, background: "#13161f", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "28px 16px", gap: 8 },
  sidebarBrand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  logoMark:  { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 },
  brandName: { color: "#fff", fontWeight: 600, fontSize: 16 },
  userBadge: { display: "flex", alignItems: "center", gap: 10, padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 16 },
  avatar:    { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 },
  userName:  { color: "#fff", fontSize: 14, fontWeight: 600 },
  userRole:  { fontSize: 12 },
  nav:       { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navBtn:    { background: "transparent", border: "none", color: "#8892a4", padding: "11px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer", fontSize: 14 },
  logoutBtn: { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 10, padding: 10, cursor: "pointer", fontSize: 14, marginTop: "auto" },
  main:      { flex: 1, padding: "40px 48px", overflowY: "auto" },
  pageTitle: { color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" },
  pageSub:   { color: "#8892a4", fontSize: 14, marginBottom: 28, lineHeight: 1.7 },
  cardGrid:  { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 },
  featureCard:{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, cursor: "pointer" },
  cardTitle: { color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 6 },
  cardDesc:  { color: "#8892a4", fontSize: 13 },
  alertBanner:{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", borderRadius: 12, padding: "12px 18px", fontSize: 14, marginBottom: 24 },
  table:     { width: "100%", borderCollapse: "collapse", background: "rgba(255,255,255,0.02)", borderRadius: 12, overflow: "hidden" },
  th:        { color: "#8892a4", fontSize: 12, fontWeight: 600, padding: "12px 16px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.08)", textTransform: "uppercase", letterSpacing: 0.5 },
  td:        { color: "#c0cad8", fontSize: 14, padding: "14px 16px" },
  statusPill:{ padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  alertCard: { background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "18px 20px", marginBottom: 12, display: "flex", flexDirection: "column", gap: 12 },
  restockBtn:{ background: "transparent", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500, alignSelf: "flex-start" },
  successBox:{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, padding: 24, color: "#34d399", fontSize: 15 },
  queueCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, maxWidth: 400, textAlign: "center" },
  queueNumber:{ fontSize: 64, fontWeight: 800, color: "#f59e0b", letterSpacing: -2 },
  callBtn:   { background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 32px", fontSize: 16, fontWeight: 600, cursor: "pointer", width: "100%" },
};
