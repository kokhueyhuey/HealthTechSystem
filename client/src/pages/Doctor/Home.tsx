import { useNavigate } from "react-router-dom";

export default function Home({ name }: { name: string }) {
  const navigate = useNavigate();

  const cards = [
    { label: "Today's Appointments", icon: "📋", color: "#10b981", desc: "View your patient schedule for today", id: "appointments" },
    { label: "Consultation",          icon: "🩺", color: "#3b82f6", desc: "Call patients and manage prescriptions", id: "consultation" },
    { label: "Patient Records",      icon: "👤", color: "#f59e0b", desc: "View and manage patient profiles and history", id: "patients" },
  ];

  return (
    <div>
      <h1 className="pageTitle">Good day, {name} 👋</h1>
      <p className="pageSub">Doctor portal — manage your schedule and patients</p>

      <div className="cardGrid threeCol">
        {cards.map(c => (
          <div
            key={c.id}
            className="featureCard"
            style={{ borderTop: `3px solid ${c.color}` }}
            onClick={() => navigate(`/doctor/${c.id}`)}
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