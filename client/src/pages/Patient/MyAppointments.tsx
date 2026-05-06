// ─────────────────────────────────────────────────────────────────────────────
// USE CASE: View Appointment Status — Basic Flow (steps 2–4)
// USE CASE: Cancel or Reschedule Appointment — Basic Flow (steps 2–6)
//
// Observer Pattern — cancel/reschedule triggers NotifyObservers() on backend:
//   Cancel     → "Cancelled"    → all 3 observers notified
//   Reschedule → "Rescheduled"  → all 3 observers notified
//
// Business rule enforced in AppointmentService (not here):
//   Patient role → 2-hour rule applied before cancel/reschedule is allowed
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import type { LoginResponse } from "../../services/api";
import { getPatientAppointments, cancelAppointment, rescheduleAppointment } from "../../services/appointmentService";
import type{ AppointmentSummary } from "../../services/appointmentService";


const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

const STATUS_COLOR: Record<string, string> = {
  Pending:    "#fbbf24",
  InProgress: "#60a5fa",
  Completed:  "#34d399",
  Cancelled:  "#f87171",
};

export default function MyAppointments({ user }: { user: LoginResponse }) {
  const [appointments,  setAppointments]  = useState<AppointmentSummary[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [actionMsg,     setActionMsg]     = useState<string | null>(null);
  const [rescheduleId,  setRescheduleId]  = useState<number | null>(null);
  const [newDate,       setNewDate]       = useState("");
  const [newTime,       setNewTime]       = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setAppointments(await getPatientAppointments(user.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user.id]);

  async function handleCancel(id: number) {
    setActionLoading(true); setActionMsg(null);
    try {
      // "Patient" role → 2-hour rule enforced in AppointmentService
      // Observer fires: PatientObserver + DoctorObserver + PharmacistObserver
      const msg = await cancelAppointment(id, "Patient");
      setActionMsg("✅ " + msg);
      load();
    } catch (e: any) {
      setActionMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReschedule(id: number) {
    if (!newDate || !newTime) { setActionMsg("⚠️ Please pick a new date and time."); return; }
    setActionLoading(true); setActionMsg(null);
    try {
      const isoDate = new Date(`${newDate}T${newTime}:00`).toISOString();
      // Observer fires "Rescheduled" → all 3 observers notified
      const msg = await rescheduleAppointment(id, isoDate, "Patient");
      setActionMsg("✅ " + msg);
      setRescheduleId(null);
      load();
    } catch (e: any) {
      setActionMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <h2 className="pageTitle">My Appointments</h2>
      <p className="pageSub">
        Cancel or reschedule up to 2 hours before your appointment time
      </p>

      {actionMsg && (
        <div className={actionMsg.startsWith("✅") ? "successBox" : "errorBox"}>
          {actionMsg}
        </div>
      )}

      {loading && <p className="mutedText">Loading appointments…</p>}
      {error   && <div className="errorBox">{error}</div>}

      {!loading && appointments.length === 0 && (
        <div className="emptyState">
          No appointments found. Book one to get started!
        </div>
      )}

      {appointments.map(appt => (
        <div key={appt.id} className="apptCard">
          <div className="apptHeader">
            <div>
              <div className="apptTitle">Appointment #{appt.id}</div>
              <div className="apptSub">
                👨‍⚕️ {appt.doctorName} &nbsp;·&nbsp;
                📅 {new Date(appt.appointmentDate).toLocaleString("en-MY", {
                  dateStyle: "medium", timeStyle: "short",
                })}
              </div>
              {appt.notes && (
                <div className="apptNotes">📝 {appt.notes}</div>
              )}
            </div>
            <span className="statusBadge" style={{ color: STATUS_COLOR[appt.status] ?? "#fff" }}>
              {appt.status}
            </span>
          </div>

          {/* Action buttons — only for active appointments */}
          {appt.status !== "Completed" && appt.status !== "Cancelled" && (
            <div className="apptActions">
              <button className="dangerBtn" disabled={actionLoading}
                onClick={() => handleCancel(appt.id)}>
                Cancel
              </button>
              <button className="secondaryBtn" disabled={actionLoading}
                onClick={() => setRescheduleId(rescheduleId === appt.id ? null : appt.id)}>
                Reschedule
              </button>
            </div>
          )}

          {/* Inline reschedule panel */}
          {rescheduleId === appt.id && (
            <div className="reschedulePanel">
              <p className="label">Choose a new date and time:</p>
              <div className="rescheduleRow">
                <input type="date" className="input"
                  min={new Date().toISOString().split("T")[0]}
                  value={newDate} onChange={e => setNewDate(e.target.value)} />
                <select className="select" value={newTime}
                  onChange={e => setNewTime(e.target.value)}>
                  <option value="">-- time --</option>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="primaryBtn" disabled={actionLoading}
                  onClick={() => handleReschedule(appt.id)}>
                  {actionLoading ? "Saving…" : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}