import { useState, useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import type { AppointmentSummary } from "../../services/appointmentService";
import { getPatientAppointments, cancelAppointment, rescheduleAppointment, generateTimeSlots, getBookedSlots, getUnavailableSlots } from "../../services/appointmentService";
import { getDoctors, parseHour } from "../../services/doctorService";
import type { Doctor } from "../../types/types";

import styles from "./MyAppointments.module.css";

// Per-status: badge text color + background only (accent bar removed)
const STATUS_META: Record<string, { color: string; bg: string }> = {
  Pending:        { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  InQueue:        { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  InConsultation: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  Completed:      { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  Cancelled:      { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const STATUS_LABEL: Record<string, string> = {
  Pending:        "Pending",
  InQueue:        "In Queue",
  InConsultation: "In Consultation",
  Completed:      "Completed",
  Cancelled:      "Cancelled",
};

// SVG icon helpers (no external package) 
function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}

function FileTextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14,2 14,8 20,8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function RotateCcwIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 4 1 10 7 10"/>
      <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

function ChevronUpIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12" y2="16.01"/>
    </svg>
  );
}


export default function MyAppointments({ user }: { user: LoginResponse }) {
  const [appointments,  setAppointments]  = useState<AppointmentSummary[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [actionMsg,     setActionMsg]     = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState(true);
  const [rescheduleId,  setRescheduleId]  = useState<number | null>(null);
  const [newDate,       setNewDate]       = useState("");
  const [newTime,       setNewTime]       = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => { getDoctors().then(setDoctors).catch(console.error); }, []);

  useEffect(() => {
    if (!rescheduleId || !newDate) { setAvailableSlots([]); return; }

    const appt = appointments.find(a => a.id === rescheduleId);
    if (!appt) return;

    const doctor = doctors.find(d => d.id === appt.doctorId);
    if (!doctor) return;

    const allSlots = generateTimeSlots(parseHour(doctor.workStartTime), parseHour(doctor.workEndTime));

    const fetchSlots = async () => {
      try {
        const [bookedSlots, unavailableSlots] = await Promise.all([
          getBookedSlots(appt.doctorId, newDate),
          getUnavailableSlots(appt.doctorId, newDate),
        ]);
        
        const blocked = new Set([...bookedSlots, ...unavailableSlots]);

        // Get original date and time to handle same-day rescheduling correctly
        const originalDateObj = new Date(appt.appointmentDate);
        const originalDateStr = `${originalDateObj.getFullYear()}-${String(originalDateObj.getMonth()+1).padStart(2,"0")}-${String(originalDateObj.getDate()).padStart(2,"0")}`;
        const currentSlot = originalDateObj.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false });

        setAvailableSlots(allSlots.filter(s => {
          if (blocked.has(s)) {
            // Unblock only if it's the exact same day AND the exact current time slot
            if (newDate === originalDateStr && s === currentSlot) {
              return true; 
            }
            return false; 
          }
          return true;
        }));

        setNewTime("");
      } catch (err) {
        console.error(err);
      }
    };

    fetchSlots();
  }, [rescheduleId, newDate, appointments, doctors]);
  
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

  // SignalR — real-time auto-refresh 
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
      setActionMsg(msg); setActionSuccess(true);
    } catch (e: any) {
      setActionMsg(e.message); setActionSuccess(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReschedule(id: number) {
    if (!newDate || !newTime) {
      setActionMsg("Please pick a new date and time."); setActionSuccess(false);
      return;
    }
    setActionLoading(true); setActionMsg(null);
    try {
      const localDateTime = `${newDate}T${newTime}:00`; // no UTC conversion — same fix as BookAppointment
      const msg = await rescheduleAppointment(id, localDateTime, "Patient");
      setActionMsg(msg); setActionSuccess(true);
      setRescheduleId(null);
      setNewDate(""); setNewTime("");
    } catch (e: any) {
      setActionMsg(e.message); setActionSuccess(false);
    } finally {
      setActionLoading(false);
    }
  }

  function toggleReschedule(id: number) {
    if (rescheduleId === id) {
      setRescheduleId(null);
      setNewDate(""); setNewTime(""); setAvailableSlots([]);  
    } else {
      setRescheduleId(id);
      setNewDate(""); setNewTime(""); setAvailableSlots([]);  
    } 
  }

  // These statuses cannot be modified by the patient
  const lockedStatuses = ["Completed", "Cancelled", "InQueue", "InConsultation"];

  return (
    <div className={styles.page}>

      {/* Page header  */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>My Appointments</h2>
        <p className={styles.pageSub}>
          Cancel or reschedule up to 2 hours before your appointment.
        </p>
      </div>

      {/* Toast notification */}
      {actionMsg && (
        <div className={`${styles.toast} ${actionSuccess ? styles.toastSuccess : styles.toastError}`}>
          {actionSuccess ? <CheckCircleIcon /> : <AlertIcon />}
          {actionMsg}
        </div>
      )}

      {/* Error from initial load */}
      {error && (
        <div className={`${styles.toast} ${styles.toastError}`}>
          <AlertIcon />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.loadingRow}>
          <div className={styles.spinner} />
          Loading appointments…
        </div>
      )}

      {/* Empty state  */}
      {!loading && appointments.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
          <h3 className={styles.emptyTitle}>No appointments yet</h3>
          <p className={styles.emptySub}>
            You don't have any appointments on record.<br />
            Head over to <strong>Book Appointment</strong> to get started.
          </p>
        </div>
      )}

      {/* Appointment list */}
      {!loading && appointments.length > 0 && (
        <div className={styles.list}>
          {appointments.map((appt, idx) => {
            const meta = STATUS_META[appt.status] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.12)" };
            const isRescheduleOpen = rescheduleId === appt.id;

            return (
              <div
                key={appt.id}
                className={styles.card}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={styles.cardBody}>

                  {/* Top row: doctor name + status badge */}
                  <div className={styles.cardTop}>
                    <div className={styles.apptMeta}>
                      <span className={styles.apptIndex}>Appt #{appt.id}</span>
                      <span className={styles.doctorName}>{appt.doctorName}</span>
                    </div>

                    <span
                      className={styles.badge}
                      style={{ color: meta.color, background: meta.bg }}
                    >
                      <span
                        className={styles.badgeDot}
                        style={{ background: meta.color }}
                      />
                      {STATUS_LABEL[appt.status] ?? appt.status}
                    </span>
                  </div>

                  {/* Date & time */}
                  <div className={styles.infoRow}>
                    <span className={styles.infoIcon}><CalendarIcon /></span>
                    {new Date(appt.appointmentDate).toLocaleString("en-MY", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>

                  {/* Notes (if any) */}
                  {appt.notes && (
                    <div className={styles.notesRow}>
                      <span className={styles.infoIcon}><FileTextIcon /></span>
                      {appt.notes}
                    </div>
                  )}

                  {/* Action buttons (only for modifiable statuses) */}
                  {!lockedStatuses.includes(appt.status) && (
                    <div className={styles.actions}>
                      <button
                        className={styles.btnCancel}
                        disabled={actionLoading}
                        onClick={() => handleCancel(appt.id)}
                      >
                        <XIcon /> Cancel
                      </button>
                      <button
                        className={`${styles.btnReschedule} ${isRescheduleOpen ? styles.btnRescheduleActive : ""}`}
                        disabled={actionLoading}
                        onClick={() => toggleReschedule(appt.id)}
                      >
                        <RotateCcwIcon />
                        Reschedule
                        {isRescheduleOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </button>
                    </div>
                  )}

                  {/* Reschedule panel */}
                  {isRescheduleOpen && (
                    <div className={styles.reschedulePanel}>
                      <div className={styles.reschedulePanelLabel}>Choose a new date & time</div>
                      <div className={styles.rescheduleGrid}>
                        <input
                          type="date"
                          className={styles.inputField}
                          min={new Date().toISOString().split("T")[0]}
                          value={newDate}
                          onChange={e => setNewDate(e.target.value)}
                        />
                        <select
                          className={styles.selectField}
                          value={newTime}
                          onChange={e => setNewTime(e.target.value)}
                        >
                          <option value="">— time —</option>
                          {availableSlots.length === 0 && newDate
                            ? <option disabled>No slots available</option>
                            : availableSlots.map(t => <option key={t} value={t}>{t}</option>)
                          }
                        </select>
                        <button
                          className={styles.btnConfirm}
                          disabled={actionLoading || !newDate || !newTime}
                          onClick={() => handleReschedule(appt.id)}
                        >
                          {actionLoading ? "Saving…" : <><CheckIcon /> Confirm</>}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
