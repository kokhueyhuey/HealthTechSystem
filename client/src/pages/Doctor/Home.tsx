import { useNavigate } from "react-router-dom";

export default function Home({ name }: { name: string }) {
  const navigate = useNavigate();
  const cards = [
    { label: "Today's Appointments", icon: "📋", color: "#10b981", desc: "View scheduled patients", id: "appointments" },
    { label: "Update Status", icon: "✏️", color: "#3b82f6", desc: "Mark appointments", id: "status" },
    { label: "Generate Prescription", icon: "💊", color: "#f59e0b", desc: "Write prescriptions", id: "prescription" },
  ];

  return (
    <div>
      <h1 className="pageTitle">Welcome, {name}</h1>
      <p className="pageSub">Here's your clinic dashboard</p>

      <div className="cardGrid">
        {cards.map(c => (
          <div
            key={c.id}
            className="featureCard"
            style={{ borderTop: `3px solid ${c.color}` }}
            onClick={() => navigate(`/doctor/${c.id}`)}
          >
            <div style={{ fontSize: 32 }}>{c.icon}</div>
            <div className="cardTitle">{c.label}</div>
            <div className="cardDesc">{c.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}