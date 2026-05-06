import { useNavigate } from "react-router-dom";

export default function Home({ name }: { name: string }) {
  const navigate = useNavigate();

  const cards = [
    { label: "Book Appointment", icon: "📅", color: "#3b82f6", desc: "Schedule a visit with a doctor", id: "book" },
    { label: "My Appointments",  icon: "🗂️", color: "#8b5cf6", desc: "View, cancel or reschedule",    id: "myappointments" },
    { label: "Queue Status",     icon: "🔢", color: "#06b6d4", desc: "Check your real-time queue",     id: "queue" },
    { label: "Prescriptions",    icon: "💊", color: "#10b981", desc: "View your prescription history", id: "prescriptions" },
  ];

  return (
    <div>
      <h1 className="pageTitle">Good day, {name} 👋</h1>
      <p className="pageSub">What would you like to do today?</p>

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