import { useState } from "react";
import type { LoginResponse } from "../../services/api";
import type { Patient } from "../../types/types";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
  patients: Patient[];
  onAddPatient: (name: string, age: number) => Promise<void>;
}

type Section = "home" | "book" | "queue" | "prescriptions" | "patientList";

export default function PatientDashboard({ user, onLogout, patients, onAddPatient }: Props) {
  const [active, setActive] = useState<Section>("home");

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={{ ...styles.logoMark, background: "#3b82f6" }}>H</div>
          <span style={styles.brandName}>HealthTech</span>
        </div>

        <div style={styles.userBadge}>
          <div style={styles.avatar}>{user.name[0].toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{user.name}</div>
            <div style={styles.userRole}>Patient</div>
          </div>
        </div>

        <nav style={styles.nav}>
          {[
            { id: "home",          label: "🏠  Overview" },
            { id: "book",          label: "📅  Book Appointment" },
            { id: "queue",         label: "🔢  Queue Status" },
            { id: "prescriptions", label: "💊  Prescriptions" },
            { id: "patientList",   label: "👥  All Patients" },
          ].map(item => (
            <button
              key={item.id}
              style={{ ...styles.navBtn, ...(active === item.id ? styles.navBtnActive : {}) }}
              onClick={() => setActive(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button style={styles.logoutBtn} onClick={onLogout}>Sign out</button>
      </aside>

      <main style={styles.main}>
        {active === "home"          && <HomeSection name={user.name} setActive={setActive} />}
        {active === "book"          && <BookSection onAddPatient={onAddPatient} userName={user.name} />}
        {active === "queue"         && <QueueSection />}
        {active === "prescriptions" && <PrescriptionsSection />}
        {active === "patientList"   && <PatientListSection patients={patients} />}
      </main>
    </div>
  );
}

function HomeSection({ name, setActive }: { name: string; setActive: (s: Section) => void }) {
  const cards = [
    { label: "Book Appointment", icon: "📅", color: "#3b82f6", desc: "Schedule a visit with a doctor", id: "book" },
    { label: "Queue Status",     icon: "🔢", color: "#8b5cf6", desc: "Check your current queue number", id: "queue" },
    { label: "Prescriptions",    icon: "💊", color: "#10b981", desc: "View your prescription history", id: "prescriptions" },
    { label: "All Patients",     icon: "👥", color: "#f59e0b", desc: "Live patient list via SignalR", id: "patientList" },
  ];
  return (
    <div>
      <h1 style={styles.pageTitle}>Good day, {name} 👋</h1>
      <p style={styles.pageSub}>What would you like to do today?</p>
      <div style={{ ...styles.cardGrid, gridTemplateColumns: "repeat(2, 1fr)" }}>
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

function BookSection({ onAddPatient, userName }: { onAddPatient: (name: string, age: number) => Promise<void>; userName: string }) {
  const [doctor, setDoctor] = useState("Dr. Lee Wei");
  const [date, setDate]     = useState("");
  const [time, setTime]     = useState("");
  const [age, setAge]       = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  async function handleBook() {
    if (!date || !time || !age) { setError("Please fill in all fields."); return; }
    setError("");
    setLoading(true);
    try {
      await onAddPatient(userName, Number(age));
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Book Appointment</h2>
      <p style={styles.pageSub}>Choose a doctor and time slot</p>
      {done ? (
        <div style={styles.successBox}>
          ✅ Appointment request sent for {doctor} on {date} at {time}.<br />
          <span style={{ color: "#8892a4", fontSize: 13 }}>
            Your patient record has been created. SignalR will update the live list.
          </span>
        </div>
      ) : (
        <div style={styles.formCard}>
          <label style={styles.label}>Select Doctor</label>
          <select style={styles.select} value={doctor} onChange={e => setDoctor(e.target.value)}>
            <option>Dr. Lee Wei — General Practice</option>
            <option>Dr. Ahmad — Cardiology</option>
            <option>Dr. Priya — Paediatrics</option>
          </select>

          <label style={styles.label}>Your Age</label>
          <input style={styles.input} type="number" placeholder="e.g. 28" value={age} onChange={e => setAge(e.target.value)} />

          <label style={styles.label}>Date</label>
          <input style={styles.input} type="date" value={date} onChange={e => setDate(e.target.value)} />

          <label style={styles.label}>Time</label>
          <select style={styles.select} value={time} onChange={e => setTime(e.target.value)}>
            <option value="">-- select --</option>
            <option>09:00 AM</option><option>10:00 AM</option>
            <option>11:00 AM</option><option>02:00 PM</option>
            <option>03:00 PM</option><option>04:00 PM</option>
          </select>

          {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}

          <button style={styles.primaryBtn} onClick={handleBook} disabled={loading}>
            {loading ? "Confirming…" : "Confirm Booking"}
          </button>
        </div>
      )}
    </div>
  );
}

function QueueSection() {
  return (
    <div>
      <h2 style={styles.pageTitle}>Queue Status</h2>
      <p style={styles.pageSub}>Real-time updates via SignalR (Observer Pattern)</p>
      <div style={styles.queueCard}>
        <div style={styles.queueNumber}>Q-014</div>
        <div style={styles.queueLabel}>Your queue number</div>
        <div style={styles.queueSeparator} />
        <div style={{ color: "#8892a4", fontSize: 14 }}>Currently serving</div>
        <div style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>Q-009</div>
        <div style={styles.queueSeparator} />
        <div style={{ color: "#fbbf24", fontSize: 14 }}>⏱ Estimated wait: ~25 minutes</div>
        <div style={{ marginTop: 16, background: "rgba(59,130,246,0.1)", borderRadius: 10, padding: 12 }}>
          <div style={{ color: "#60a5fa", fontSize: 13 }}>
            🔔 Observer Pattern will push live updates here via SignalR.
          </div>
        </div>
      </div>
    </div>
  );
}

function PrescriptionsSection() {
  const prescriptions = [
    { date: "2026-04-20", doctor: "Dr. Lee Wei", medicine: "Paracetamol 500mg", qty: "10 tablets", status: "Dispensed" },
    { date: "2026-03-15", doctor: "Dr. Ahmad",   medicine: "Amoxicillin 250mg",  qty: "14 capsules", status: "Dispensed" },
  ];
  return (
    <div>
      <h2 style={styles.pageTitle}>Prescription History</h2>
      <p style={styles.pageSub}>Your past prescriptions from clinic visits</p>
      {prescriptions.map((p, i) => (
        <div key={i} style={styles.prescriptionRow}>
          <div>
            <div style={{ color: "#fff", fontWeight: 600 }}>{p.medicine}</div>
            <div style={{ color: "#8892a4", fontSize: 13 }}>{p.doctor} · {p.date}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#c0cad8", fontSize: 13 }}>{p.qty}</div>
            <div style={{ color: "#34d399", fontSize: 12, fontWeight: 500 }}>{p.status}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PatientListSection({ patients }: { patients: Patient[] }) {
  return (
    <div>
      <h2 style={styles.pageTitle}>Live Patient List</h2>
      <p style={styles.pageSub}>
        Updated in real-time via SignalR (ReceivePatientUpdate) + GET /api/patients
      </p>
      {patients.length === 0 ? (
        <div style={{ color: "#8892a4", fontSize: 14 }}>No patients registered yet.</div>
      ) : (
        patients.map((p) => (
          <div key={p.id} style={styles.prescriptionRow}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600 }}>{p.name}</div>
              <div style={{ color: "#8892a4", fontSize: 13 }}>Patient ID: {p.id}</div>
            </div>
            <div style={{ color: "#60a5fa", fontSize: 14, fontWeight: 600 }}>Age {p.age}</div>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout:       { display: "flex", minHeight: "100vh", background: "#0f1117", fontFamily: "'Segoe UI', sans-serif" },
  sidebar:      { width: 240, background: "#13161f", borderRight: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", padding: "28px 16px", gap: 8 },
  sidebarBrand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  logoMark:     { width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 },
  brandName:    { color: "#fff", fontWeight: 600, fontSize: 16 },
  userBadge:    { display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 16 },
  avatar:       { width: 36, height: 36, borderRadius: "50%", background: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 16 },
  userName:     { color: "#fff", fontSize: 14, fontWeight: 600 },
  userRole:     { color: "#60a5fa", fontSize: 12 },
  nav:          { display: "flex", flexDirection: "column", gap: 4, flex: 1 },
  navBtn:       { background: "transparent", border: "none", color: "#8892a4", padding: "11px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer", fontSize: 14 },
  navBtnActive: { background: "rgba(59,130,246,0.15)", color: "#60a5fa" },
  logoutBtn:    { background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", borderRadius: 10, padding: "10px", cursor: "pointer", fontSize: 14, marginTop: "auto" },
  main:         { flex: 1, padding: "40px 48px", overflowY: "auto" },
  pageTitle:    { color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" },
  pageSub:      { color: "#8892a4", fontSize: 14, marginBottom: 28 },
  cardGrid:     { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 },
  featureCard:  { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 24, cursor: "pointer" },
  cardTitle:    { color: "#fff", fontWeight: 600, fontSize: 16, marginBottom: 6 },
  cardDesc:     { color: "#8892a4", fontSize: 13 },
  formCard:     { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 28, maxWidth: 480, display: "flex", flexDirection: "column", gap: 12 },
  label:        { color: "#c0cad8", fontSize: 13, fontWeight: 500 },
  input:        { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none" },
  select:       { background: "#1e2535", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none" },
  primaryBtn:   { background: "linear-gradient(135deg,#3b82f6,#06b6d4)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  successBox:   { background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 14, padding: 24, color: "#34d399", fontSize: 15, lineHeight: 1.8 },
  queueCard:    { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 32, maxWidth: 360, textAlign: "center" },
  queueNumber:  { fontSize: 64, fontWeight: 800, color: "#3b82f6", letterSpacing: -2 },
  queueLabel:   { color: "#8892a4", fontSize: 14, marginTop: 4, marginBottom: 20 },
  queueSeparator: { height: 1, background: "rgba(255,255,255,0.07)", margin: "16px 0" },
  prescriptionRow: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px 20px", marginBottom: 10 },
};
