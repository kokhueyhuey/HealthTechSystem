import { useNavigate } from "react-router-dom";

export default function Home({ name }: { name: string }) {
  const navigate = useNavigate();

  const cards = [
    { label: "Book Appointment", icon: "📅", color: "#3b82f6", desc: "Schedule a visit", id: "book" },
    { label: "Queue Status", icon: "🔢", color: "#8b5cf6", desc: "Check queue", id: "queue" },
    { label: "Prescriptions", icon: "💊", color: "#10b981", desc: "View history", id: "prescriptions" },
  ];

  return (
    <div>
      <h1 className="pageTitle">Good day, {name} 👋</h1>

      <div className="cardGrid twoCol">
        {cards.map(c => (
          <div
            key={c.id}
            className="featureCard"
            style={{ borderTop: `3px solid ${c.color}` }}
            onClick={() => navigate(`/patient/${c.id}`)}
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