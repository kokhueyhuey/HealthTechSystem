import { useState } from "react";
import type { LoginResponse } from "./api";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section = "home" | "appointments" | "status" | "prescription";

export default function DoctorDashboard({ user, onLogout }: Props) {
  const [active, setActive] = useState<Section>("home");

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={{ ...styles.logoMark, background: "#10b981" }}>H</div>
          <span style={styles.brandName}>HealthTech</span>
        </div>

        <div style={styles.userBadge}>
          <div style={{ ...styles.avatar, background: "#10b981" }}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user.name}</div>
            <div style={{ ...styles.userRole, color: "#34d399" }}>Doctor</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: "home",         label: "🏠  Overview" },
            { id: "appointments", label: "📋  Today's Appointments" },
            { id: "status",       label: "✏️  Update Status" },
            { id: "prescription", label: "💊  Generate Prescription" },
          ].map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(active === item.id ? { background: "rgba(16,185,129,0.15)", color: "#34d399" } : {}) }}
              onClick={() => setActive(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={onLogout}>Sign out</button>
      </aside>

      <main style={styles.main}>
        {active === "home"         && <HomeSection name={user.name} setActive={setActive} />}
        {active === "appointments" && <AppointmentsSection />}
        {active === "status"       && <StatusSection />}
        {active === "prescription" && <PrescriptionSection />}
      </main>
    </div>
  );
}

function HomeSection({ name, setActive }: { name: string; setActive: (s: Section) => void }) {
  const cards = [
    { label: "Today's Appointments", icon: "📋", color: "#10b981", desc: "View scheduled patients", id: "appointments" },
    { label: "Update Status",         icon: "✏️", color: "#3b82f6", desc: "Mark appointments in progress or done", id: "status" },
    { label: "Generate Prescription", icon: "💊", color: "#f59e0b", desc: "Write prescriptions for patients", id: "prescription" },
  ];
  return (
    <div>
      <h1 style={styles.pageTitle}>Welcome, {name} 👨‍⚕️</h1>
      <p style={styles.pageSub}>Here's your clinic dashboard for today</p>
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

function AppointmentsSection() {
  // Placeholder appointments — fetch from GET /api/Appointments
  const appts = [
    { time: "09:00 AM", patient: "Alice Tan",  reason: "Fever & cough",    status: "Pending" },
    { time: "10:00 AM", patient: "Rajan Kumar", reason: "Follow-up",        status: "InProgress" },
    { time: "11:00 AM", patient: "Mei Ling",   reason: "Blood pressure",    status: "Pending" },
    { time: "02:00 PM", patient: "Hafiz Aziz", reason: "Annual checkup",    status: "Completed" },
  ];
  const statusColor: Record<string, string> = {
    Pending: "#fbbf24", InProgress: "#60a5fa", Completed: "#34d399"
  };
  return (
    <div>
      <h2 style={styles.pageTitle}>Today's Appointments</h2>
      <p style={styles.pageSub}>{new Date().toLocaleDateString("en-MY", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}</p>
      {appts.map((a, i) => (
        <div key={i} style={styles.apptRow}>
          <div style={styles.apptTime}>{a.time}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 600 }}>{a.patient}</div>
            <div style={{ color: "#8892a4", fontSize: 13 }}>{a.reason}</div>
          </div>
          <div style={{ color: statusColor[a.status], fontSize: 13, fontWeight: 500 }}>{a.status}</div>
        </div>
      ))}
    </div>
  );
}

function StatusSection() {
  const [selected, setSelected] = useState("Alice Tan");
  const [status, setStatus]     = useState("InProgress");
  const [done, setDone]         = useState(false);

  return (
    <div>
      <h2 style={styles.pageTitle}>Update Appointment Status</h2>
      <p style={styles.pageSub}>Change the status for a patient's appointment</p>
      {done ? (
        <div style={styles.successBox}>✅ Status updated to <strong>{status}</strong> for {selected}.</div>
      ) : (
        <div style={styles.formCard}>
          <label style={styles.label}>Patient</label>
          <select style={styles.select} value={selected} onChange={e => setSelected(e.target.value)}>
            <option>Alice Tan</option>
            <option>Rajan Kumar</option>
            <option>Mei Ling</option>
          </select>

          <label style={styles.label}>New Status</label>
          <div style={{ display: "flex", gap: 10 }}>
            {["Pending","InProgress","Completed"].map(s => (
              <button key={s}
                onClick={() => setStatus(s)}
                style={{ flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: status === s ? 600 : 400,
                  background: status === s ? "#10b981" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${status === s ? "#10b981" : "rgba(255,255,255,0.12)"}`,
                  color: status === s ? "#fff" : "#8892a4" }}>
                {s}
              </button>
            ))}
          </div>
          <button style={{ ...styles.primaryBtn, background: "#10b981" }} onClick={() => setDone(true)}>
            Update Status
          </button>
        </div>
      )}
    </div>
  );
}

function PrescriptionSection() {
  const [patient, setPatient]   = useState("Alice Tan");
  const [medicine, setMedicine] = useState("");
  const [dosage, setDosage]     = useState("");
  const [notes, setNotes]       = useState("");
  const [done, setDone]         = useState(false);

  return (
    <div>
      <h2 style={styles.pageTitle}>Generate Prescription</h2>
      <p style={styles.pageSub}>Write a digital prescription for a patient</p>
      {done ? (
        <div style={styles.successBox}>
          ✅ Prescription sent to pharmacy for {patient}.<br />
          <strong>{medicine}</strong> — {dosage}<br />
          <span style={{ color: "#8892a4", fontSize: 13 }}>Notes: {notes || "None"}</span>
        </div>
      ) : (
        <div style={styles.formCard}>
          <label style={styles.label}>Patient</label>
          <select style={styles.select} value={patient} onChange={e => setPatient(e.target.value)}>
            <option>Alice Tan</option><option>Rajan Kumar</option><option>Mei Ling</option>
          </select>

          <label style={styles.label}>Medicine</label>
          <input style={styles.input} placeholder="e.g. Paracetamol 500mg" value={medicine} onChange={e => setMedicine(e.target.value)} />

          <label style={styles.label}>Dosage / Instructions</label>
          <input style={styles.input} placeholder="e.g. 1 tablet 3x daily after meals" value={dosage} onChange={e => setDosage(e.target.value)} />

          <label style={styles.label}>Additional Notes</label>
          <input style={styles.input} placeholder="Optional notes for pharmacist" value={notes} onChange={e => setNotes(e.target.value)} />

          <button style={{ ...styles.primaryBtn, background: "#f59e0b" }}
            onClick={() => medicine && dosage && setDone(true)}>
            Send to Pharmacy
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout:   { display: "flex", minHeight: "100vh", background: "#0f1117", fontFamily: "'Segoe UI', sans-serif" },
  sidebar:  { width: 240, background: "#13161f", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "28px 16px", gap: 8 },
  sidebarBrand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  logoMark: { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 },
  brandName:{ color: "#fff", fontWeight: 600, fontSize: 16 },
  userBadge:{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 16 },
  avatar:   { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 },
  userName: { color: "#fff", fontSize: 14, fontWeight: 600 },
  userRole: { fontSize: 12 },
  nav:      { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navBtn:   { background: "transparent", border: "none", color: "#8892a4", padding: "11px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer", fontSize: 14 },
  logoutBtn:{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 14, marginTop: "auto" },
  main:     { flex: 1, padding: "40px 48px" },
  pageTitle:{ color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" },
  pageSub:  { color: "#8892a4", fontSize: 14, marginBottom: 28 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  featureCard:{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, cursor: "pointer" },
  cardTitle:{ color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 6 },
  cardDesc: { color: "#8892a4", fontSize: 13 },
  apptRow:  { display: "flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 10 },
  apptTime: { color: "#60a5fa", fontSize: 13, fontWeight: 600, minWidth: 80 },
  formCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, maxWidth: 480, display: "flex", flexDirection: "column", gap: 12 },
  label:    { color: "#c0cad8", fontSize: 13, fontWeight: 500 },
  input:    { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none" },
  select:   { background: "#1e2535", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none" },
  primaryBtn:{ color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  successBox:{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, padding: 24, color: "#34d399", fontSize: 15, lineHeight: 2 },
};
