// ─────────────────────────────────────────────────────────────────────────────
// USE CASE: View Daily Appointments — Basic Flow (steps 2–4)
//
// Observer Pattern — DoctorObserver.Update("Booked") was called when the
// patient booked this appointment, which is why it appears here.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import type { LoginResponse } from "../../services/api";
import { getDoctorAppointments } from "../../services/appointmentService";
import type { DoctorAppointmentSummary } from "../../services/appointmentService";


const STATUS_COLOR: Record<string, string> = {
  Pending:    "#fbbf24",
  InProgress: "#60a5fa",
  Completed:  "#34d399",
  Cancelled:  "#f87171",
};

export default function Appointments({ user }: { user: LoginResponse }) {
  const today = new Date().toISOString().split("T")[0];
  const [date,         setDate]         = useState(today);
  const [appointments, setAppointments] = useState<DoctorAppointmentSummary[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      setAppointments(await getDoctorAppointments(user.id, date));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user.id, date]);

  return (
    <div>
      <h2 className="pageTitle">Today's Appointments</h2>
      <p className="pageSub">
        {new Date().toLocaleDateString()} — DoctorObserver was notified when each was booked
      </p>

      <div className="filterRow">
        <input type="date" className="input" value={date}
          onChange={e => setDate(e.target.value)} />
        <button className="primaryBtn" onClick={load}>Refresh</button>
      </div>

      {loading && <p className="mutedText">Loading…</p>}
      {error   && <div className="errorBox">{error}</div>}

      {!loading && appointments.length === 0 && (
        <div className="emptyState">No appointments scheduled for this date.</div>
      )}

      {appointments.map(a => (
        <div key={a.id} className="apptRow">
          <div className="apptTime">
            {new Date(a.appointmentDate).toLocaleTimeString("en-MY", { timeStyle: "short" })}
          </div>
          <div style={{ flex: 1 }}>
            <div className="apptPatient">{a.patientName}</div>
            {a.notes && <div className="apptNotes">{a.notes}</div>}
          </div>
          <div className="statusBadge" style={{ color: STATUS_COLOR[a.status] ?? "#fff" }}>
            {a.status}
          </div>
        </div>
      ))}
    </div>
  );
}