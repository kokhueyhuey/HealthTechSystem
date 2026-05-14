import { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getDoctorAppointments } from "../../services/appointmentService";
import type { DoctorAppointmentSummary } from "../../services/appointmentService";

import "./Appointments.css";

export default function Appointments({ user }: { user: LoginResponse }) {
  const today = new Date().toISOString().split("T")[0];

  const [date, setDate] = useState(today);
  const [appointments, setAppointments] = useState<DoctorAppointmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      setAppointments(await getDoctorAppointments(user.id, date));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user.id, date]);

  useEffect(() => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5165/appointmentHub")
    .withAutomaticReconnect()
    .build();

  connection.on(
    "ReceiveAppointmentUpdate",
    (payload: { doctorId: number; eventType: string }) => {

      if (payload.doctorId === user.id) {
        load();
      }
    }
  );

  connection.start().catch(err =>
    console.warn("SignalR connection failed:", err)
  );

  return () => {
    connection.stop();
  };
}, [user.id, date]);

  return (
    <div>
      <h2 className="pageTitle">Today's Appointments</h2>

      <p className="pageSub">
        {new Date().toLocaleDateString()} 
      </p>

      <div className="filterRow">
        <input
          type="date"
          className="input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <button className="primaryBtn" onClick={load}>
          Refresh
        </button>
      </div>

      {loading && <p className="mutedText">Loading…</p>}
      {error && <div className="errorBox">{error}</div>}

      {!loading && appointments.length === 0 && (
        <div className="emptyState">
          No appointments scheduled for this date.
        </div>
      )}

      {appointments.map((a) => (
        <div key={a.id} className="apptRow">
          <div className="apptTime">
            {new Date(a.appointmentDate).toLocaleTimeString("en-MY", {
              timeStyle: "short",
            })}
          </div>

          <div className="apptInfo">
            <div className="apptPatient">{a.patientName}</div>
            {a.notes && <div className="apptNotes">{a.notes}</div>}
          </div>

          <div className={`statusBadge status-${a.status.toLowerCase()}`}>
            {a.status}
          </div>
        </div>
      ))}
    </div>
  );
}