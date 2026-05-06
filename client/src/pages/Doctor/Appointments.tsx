export default function Appointments() {
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
      <h2 className="pageTitle">Today's Appointments</h2>
      <p className="pageSub">{new Date().toLocaleDateString()}</p>

      {appts.map((a, i) => (
        <div key={i} className="apptRow">
          <div className="apptTime">{a.time}</div>
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