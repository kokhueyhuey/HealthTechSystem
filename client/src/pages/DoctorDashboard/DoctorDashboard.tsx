import { useState } from "react";
import type { LoginResponse } from "../../services/api";
import styles from "./DoctorDashboard.module.css";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section = "home" | "appointments" | "status" | "prescription";

export default function DoctorDashboard({ user, onLogout }: Props) {
  const [active, setActive] = useState<Section>("home");

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.logoMark} style={{ background: "#10b981" }}>H</div>
          <span className={styles.brandName}>HealthTech</span>
        </div>

        <div className={styles.userBadge}>
          <div className={styles.avatar} style={{ background: "#10b981" }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userRole}>Doctor</div>
          </div>
        </div>

        <nav className={styles.nav}>
          {[
            { id: "home", label: "🏠  Overview" },
            { id: "appointments", label: "📋  Today's Appointments" },
            { id: "status", label: "✏️  Update Status" },
            { id: "prescription", label: "💊  Generate Prescription" },
          ].map(item => (
            <button
              key={item.id}
              className={`${styles.navBtn} ${active === item.id ? styles.active : ""}`}
              onClick={() => setActive(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className={styles.logoutBtn} onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className={styles.main}>
        {active === "home" && <HomeSection name={user.name} setActive={setActive} />}
        {active === "appointments" && <AppointmentsSection />}
        {active === "status" && <StatusSection />}
        {active === "prescription" && <PrescriptionSection />}
      </main>
    </div>
  );
}

function HomeSection({ name, setActive }: { name: string; setActive: (s: Section) => void }) {
  const cards = [
    { label: "Today's Appointments", icon: "📋", color: "#10b981", desc: "View scheduled patients", id: "appointments" },
    { label: "Update Status", icon: "✏️", color: "#3b82f6", desc: "Mark appointments", id: "status" },
    { label: "Generate Prescription", icon: "💊", color: "#f59e0b", desc: "Write prescriptions", id: "prescription" },
  ];

  return (
    <div>
      <h1 className={styles.pageTitle}>Welcome, {name}</h1>
      <p className={styles.pageSub}>Here's your clinic dashboard</p>

      <div className={styles.cardGrid}>
        {cards.map(c => (
          <div
            key={c.id}
            className={styles.featureCard}
            style={{ borderTop: `3px solid ${c.color}` }}
            onClick={() => setActive(c.id as Section)}
          >
            <div style={{ fontSize: 32 }}>{c.icon}</div>
            <div className={styles.cardTitle}>{c.label}</div>
            <div className={styles.cardDesc}>{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AppointmentsSection() {
  const appts = [
    { time: "09:00 AM", patient: "Alice Tan", reason: "Fever", status: "Pending" },
    { time: "10:00 AM", patient: "Rajan Kumar", reason: "Follow-up", status: "InProgress" },
  ];

  const statusColor: Record<string, string> = {
    Pending: "#fbbf24",
    InProgress: "#60a5fa",
    Completed: "#34d399",
  };

  return (
    <div>
      <h2 className={styles.pageTitle}>Today's Appointments</h2>
      <p className={styles.pageSub}>
        {new Date().toLocaleDateString()}
      </p>

      {appts.map((a, i) => (
        <div key={i} className={styles.apptRow}>
          <div className={styles.apptTime}>{a.time}</div>
          <div style={{ flex: 1 }}>
            <div>{a.patient}</div>
            <div>{a.reason}</div>
          </div>
          <div style={{ color: statusColor[a.status] }}>{a.status}</div>
        </div>
      ))}
    </div>
  );
}

function StatusSection() {
  const [status, setStatus] = useState("InProgress");

  return (
    <div>
      <h2 className={styles.pageTitle}>Update Status</h2>

      <div className={styles.formCard}>
        <div style={{ display: "flex", gap: 10 }}>
          {["Pending", "InProgress", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                flex: 1,
                background: status === s ? "#10b981" : "transparent",
                color: "#fff",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button className={styles.primaryBtn}>Update</button>
      </div>
    </div>
  );
}

function PrescriptionSection() {
  return (
    <div>
      <h2 className={styles.pageTitle}>Prescription</h2>

      <div className={styles.formCard}>
        <input className={styles.input} placeholder="Medicine" />
        <input className={styles.input} placeholder="Dosage" />
        <button className={styles.primaryBtn}>Send</button>
      </div>
    </div>
  );
}