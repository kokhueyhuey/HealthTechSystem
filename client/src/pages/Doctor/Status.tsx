import { useState, useEffect } from "react";
import type { LoginResponse } from "../../services/api";
import type { DoctorAppointmentSummary } from "../../services/appointmentService";
import type { AppointmentStatus } from "../../types/appointment";
import {
  getDoctorAppointments,
  updateAppointmentStatus,
} from "../../services/appointmentService";
import styles from "./Status.module.css";

const STATUSES: AppointmentStatus[] = ["Pending", "InProgress", "Completed", "Cancelled"];

const STATUS_ICONS: Record<AppointmentStatus, string> = {
  Pending: "⏳",
  InProgress: "🔵",
  Completed: "✅",
  Cancelled: "✗",
};

export default function Status({ user }: { user: LoginResponse }) {
  const [appointments, setAppointments] = useState<DoctorAppointmentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  async function load() {
    try {
      const data = await getDoctorAppointments(user.id);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [user.id]);

  async function handleStatus(id: number, newStatus: AppointmentStatus) {
    setUpdating(id);
    setMsg(null);
    try {
      const result = await updateAppointmentStatus(id, user.id, newStatus);
      setMsg("✅ " + result);
      await load();
    } catch (err: any) {
      setMsg("⚠️ " + err.message);
    } finally {
      setUpdating(null);
    }
  }

  const activeAppointments = appointments.filter(
    a => a.status !== "Completed" && a.status !== "Cancelled"
  );
  const pendingCount   = appointments.filter(a => a.status === "Pending").length;
  const inProgressCount = appointments.filter(a => a.status === "InProgress").length;
  const completedCount  = appointments.filter(a => a.status === "Completed").length;

  return (
    <div className={styles.page}>

      <h2 className={styles.pageTitle}>Appointment Status</h2>
      <p className={styles.pageMeta}>
        {new Date().toLocaleDateString("en-MY", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      </p>

      {/* Summary pills */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryPill}>
          <span className={styles.summaryPillCount}>{pendingCount}</span> Pending
        </div>
        <div className={styles.summaryPill}>
          <span className={styles.summaryPillCount}>{inProgressCount}</span> In Progress
        </div>
        <div className={styles.summaryPill}>
          <span className={styles.summaryPillCount}>{completedCount}</span> Done
        </div>
      </div>

      {/* Feedback */}
      {msg && (
        <div className={msg.startsWith("✅") ? styles.successBox : styles.errorBox}>
          {msg}
        </div>
      )}

      {loading && <p className={styles.mutedText}>Loading appointments…</p>}

      {!loading && activeAppointments.length === 0 && (
        <div className={styles.emptyState}>No active appointments for today.</div>
      )}

      {activeAppointments.map(a => (
        <div key={a.id} className={styles.apptCard}>

          <div className={styles.apptHeader}>
            <div className={styles.apptTitle}>{a.patientName}</div>
            <div className={styles.apptId}>#{a.id}</div>
          </div>

          <div className={styles.apptSub}>
            📅{" "}
            {new Date(a.appointmentDate).toLocaleString("en-MY", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {" · "}
            <span className={styles.statusText}>{a.status}</span>
          </div>

          <div className={styles.statusBtnRow}>
            {STATUSES.map(st => (
              <button
                key={st}
                data-status={st}
                className={`${styles.statusBtn} ${a.status === st ? styles.statusBtnActive : ""}`}
                disabled={updating === a.id || a.status === st}
                onClick={() => handleStatus(a.id, st)}
              >
                {updating === a.id && a.status !== st
                  ? <span className={styles.spinnerInline} />
                  : null}
                {STATUS_ICONS[st]} {st}
              </button>
            ))}
          </div>

        </div>
      ))}
    </div>
  );
}