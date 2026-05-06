import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  const cards = [
    { label: "Manage Appointments",   icon: "📋", color: "#f59e0b", desc: "Handle doctor unavailability — reschedule or cancel on behalf of patients", id: "manage" },
    { label: "Medicine Inventory",    icon: "📦", color: "#10b981", desc: "Add, update and monitor medicine stock levels", id: "inventory" },
    { label: "Alerts",                icon: "🚨", color: "#ef4444", desc: "Low stock and expiry date alerts", id: "alerts" },
    { label: "Queue",                 icon: "🔔", color: "#8b5cf6", desc: "Patient check-in and queue management", id: "queue" },
  ];

  return (
    <div>
      <h1 className="pageTitle">Pharmacist Overview</h1>
      <p className="pageSub">Manage appointments, inventory, alerts and queue</p>

      <div className="cardGrid twoCol">
        {cards.map(c => (
          <div
            key={c.id}
            className="featureCard"
            style={{ borderTop: `3px solid ${c.color}` }}
            onClick={() => navigate(`/pharmacist/${c.id}`)}
          >
            <div className="icon">{c.icon}</div>
            <div className="cardTitle">{c.label}</div>
            <div className="cardDesc">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}