import { useState, useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getDoctorAppointments } from "../../services/appointmentService";
import type { DoctorAppointmentSummary } from "../../services/appointmentService";
import { getUnavailabilities, createUnavailability, deleteUnavailability, type DoctorUnavailability } from "../../services/appointmentService";

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

  const [showUnavailModal, setShowUnavailModal] = useState(false);
  const [unavailabilities, setUnavailabilities] = useState<DoctorUnavailability[]>([]);
  const [unavailDate, setUnavailDate]           = useState("");
  const [unavailStart, setUnavailStart]         = useState<number>(9);
  const [unavailEnd, setUnavailEnd]             = useState<number>(10);
  const [unavailReason, setUnavailReason]       = useState("");
  const [unavailMsg, setUnavailMsg]             = useState<string | null>(null);
  const [doctorWorkHours, setDoctorWorkHours]   = useState({ start: 9, end: 19 });

  useEffect(() => {
    getUnavailabilities(user.id).then(setUnavailabilities).catch(console.error);
    // get doctor's own work hours for the hour selects
    fetch(`http://localhost:5165/api/doctors/${user.id}`)
      .then(r => r.json())
      .then(d => setDoctorWorkHours({
        start: parseInt(d.workStartTime.split(":")[0]),
        end:   parseInt(d.workEndTime.split(":")[0])
      }));
  }, [user.id]);

  async function handleSaveUnavailability() {
    if (!unavailDate || unavailStart >= unavailEnd) {
      setUnavailMsg("Please select a valid date and time range."); return;
    }
    try {
      const result = await createUnavailability(user.id, unavailDate, unavailStart, unavailEnd, unavailReason);
      setUnavailMsg(result.warning ?? result.message);
      getUnavailabilities(user.id).then(setUnavailabilities);
      setUnavailDate(""); setUnavailReason("");
    } catch (e: any) { setUnavailMsg(e.message); }
  }

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

        <button className="searchBtn" onClick={() => setShowUnavailModal(true)}>
          Mark Unavailability
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

      {showUnavailModal && (
          <div className="modal-overlay" onClick={() => setShowUnavailModal(false)}>
            <div className="standard-modal" onClick={e => e.stopPropagation()}>
              <h3>Mark Unavailability</h3>

              {unavailMsg && <p className="unavail-msg">{unavailMsg}</p>}

              <label>Date</label>
              <input type="date" className="searchInput"
                min={new Date().toISOString().split("T")[0]}
                value={unavailDate} onChange={e => setUnavailDate(e.target.value)} />

              <label>From (hour)</label>
              <select className="searchInput" value={unavailStart}
                onChange={e => setUnavailStart(Number(e.target.value))}>
                {Array.from({ length: doctorWorkHours.end - doctorWorkHours.start }, (_, i) => {
                  const h = doctorWorkHours.start + i;
                  return <option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>;
                })}
              </select>

              <label>To (hour)</label>
              <select className="searchInput" value={unavailEnd}
                onChange={e => setUnavailEnd(Number(e.target.value))}>
                {Array.from({ length: doctorWorkHours.end - doctorWorkHours.start }, (_, i) => {
                  const h = doctorWorkHours.start + i + 1;
                  return <option key={h} value={h}>{String(h).padStart(2,"0")}:00</option>;
                })}
              </select>

              <label>Reason</label>
              <input className="searchInput" placeholder="e.g. Medical conference"
                value={unavailReason} onChange={e => setUnavailReason(e.target.value)} />

              <div style={{ marginTop: "1rem" }}>
                <h4>Current unavailabilities</h4>
                {unavailabilities.length === 0 && <p>None set.</p>}
                {unavailabilities.map(u => (
                  <div key={u.id} className="unavail-row">
                    <span>{u.date} · {u.startTime}–{u.endTime}</span>
                    {u.reason && <span className="unavail-reason"> — {u.reason}</span>}
                    <button className="action-btn danger" onClick={async () => {
                      await deleteUnavailability(u.id);
                      getUnavailabilities(user.id).then(setUnavailabilities);
                    }}>Remove</button>
                  </div>
                ))}
              </div>

              <div className="modal-actions" style={{ marginTop: "1.5rem" }}>
                <button className="dismiss-btn" onClick={() => { setShowUnavailModal(false); setUnavailMsg(null); }}>Close</button>
                <button className="confirm-btn" onClick={handleSaveUnavailability}>Save</button>
              </div>
            </div>
          </div>
        )}

    </div>
  );
}