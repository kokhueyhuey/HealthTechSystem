import { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getDoctorAppointments } from "../../services/appointmentService";
import type { DoctorAppointmentSummary } from "../../services/appointmentService";

import "./Appointments.css";

function fmtTimeOnly(str: string) {
  return new Date(str).toLocaleTimeString("en-MY", { timeStyle: "short" });
}

function fmtFriendlyDate(dateStr: string) {
  const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateStr).toLocaleDateString("en-MY", options);
}

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

    connection.start().catch((err) =>
      console.warn("SignalR connection failed:", err)
    );

    return () => {
      connection.stop();
    };
  }, [user.id, date]);

  return (
    <div className="pageContainer">
      
      {/* ── HEADER ── */}
      <h2 className="pageTitle">Daily Schedule</h2>
      <p className="pageSub">{fmtFriendlyDate(date)}</p>

      {/* ── SEARCH & FILTER ── */}
      <div className="searchRow">
        <input
          type="date"
          className="searchInput"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="searchBtn" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="errorBox">⚠️ {error}</div>}

      {/* ── DATA TABLE ── */}
      <div className="tableContainer">
        <table className="dataTable">
          <thead>
            <tr>
              <th>Time</th>
              <th>Appt ID</th>
              <th>Patient Name</th>
              <th>Notes</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="emptyState">
                  <div className="loadingRow">
                    <div className="spinner"></div> Loading appointments...
                  </div>
                </td>
              </tr>
            )}

            {!loading && appointments.length === 0 && !error && (
              <tr>
                <td colSpan={5} className="emptyState">
                  No appointments scheduled for this date.
                </td>
              </tr>
            )}

            {!loading && appointments.map((a) => (
              <tr key={a.id} className={a.status === 'Cancelled' ? 'cancelledRow' : ''}>
                <td className="timeCell">{fmtTimeOnly(a.appointmentDate)}</td>
                <td className="idCell">#{a.id}</td>
                <td className="patientCell">
                  <div className="patientName">{a.patientName}</div>
                </td>
                <td className="notesCell">
                  {a.notes ? a.notes : <span className="emptyNotes">No notes provided</span>}
                </td>
                <td>
                  <span className={`statusBadge status-${a.status}`}>
                    {a.status === "InConsultation" ? "In Consult" : a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}