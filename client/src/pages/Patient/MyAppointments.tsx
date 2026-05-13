import { useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import type { AppointmentSummary } from "../../services/appointmentService";
import { getPatientAppointments, cancelAppointment, rescheduleAppointment } from "../../services/appointmentService";

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const STATUS_COLOR: Record<string, string> = {
  Pending:        "#fbbf24",
  InQueue:        "#a78bfa",
  InConsultation: "#60a5fa",
  Completed:      "#34d399",
  Cancelled:      "#f87171",
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

  const load = useCallback(async () => {
    try {
      setAppointments(await getPatientAppointments(user.id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  // Initial load
  useEffect(() => { load(); }, [load]);

  // ── SignalR — real-time auto-refresh ───────────────────────────────────
  // OBSERVER PATTERN (frontend side):
  //   When SignalRAppointmentObserver fires on the backend, it pushes
  //   "ReceiveAppointmentUpdate" here. We check if it involves this patient
  //   and refresh the list automatically.
  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5165/appointmentHub")
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveAppointmentUpdate", (payload: { patientId: number; eventType: string }) => {
      // Only refresh if this event involves the current patient
      if (payload.patientId === user.id) {
        load();
      }
    });

    connection.start().catch(err =>
      console.warn("Appointment SignalR connection failed:", err)
    );

    return () => { connection.stop(); };
  }, [user.id, load]);
  // ────────────────────────────────────────────────────────────────────────

  async function handleCancel(id: number) {
    setActionLoading(true); setActionMsg(null);
    try {
      // "Patient" role → 2-hour rule enforced in AppointmentService
      // On success: backend fires NotifyObservers → SignalR pushes → list refreshes
      const msg = await cancelAppointment(id, "Patient");
      setActionMsg("✅ " + msg);
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
      const localDateTime = `${newDate}T${newTime}:00`; // no UTC conversion — same fix as BookAppointment
      const msg = await rescheduleAppointment(id, localDateTime, "Patient");
      setActionMsg("✅ " + msg);
      setRescheduleId(null);
    } catch (e: any) {
      setActionMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // These statuses cannot be modified by the patient
  const lockedStatuses = ["Completed", "Cancelled", "InQueue", "InConsultation"];

  return (
    <div>
      <h2 className="pageTitle">My Appointments</h2>
      <p className="pageSub">
        Cancel or reschedule up to 2 hours before your appointment.
        This page auto-updates via SignalR when status changes.
      </p>

      {actionMsg && (
        <div className={actionMsg.startsWith("✅") ? "successBox" : "errorBox"}>
          {actionMsg}
        </div>
      )}

      {loading && <p className="mutedText">Loading appointments…</p>}
      {error   && <div className="errorBox">{error}</div>}

      {!loading && appointments.length === 0 && (
        <div className="emptyState">No appointments found. Book one to get started!</div>
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
              {appt.notes && <div className="apptNotes">📝 {appt.notes}</div>}
            </div>
            <span
              className="statusBadge"
              style={{ color: STATUS_COLOR[appt.status] ?? "#fff" }}
            >
              {appt.status}
            </span>
          </div>

          {/* Actions only for modifiable statuses */}
          {!lockedStatuses.includes(appt.status) && (
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