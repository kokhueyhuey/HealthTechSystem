import { useState, useEffect } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import type { DoctorAppointmentSummary } from "../../services/appointmentService";
import type { AppointmentStatus } from "../../types/appointment";
import {
  getDoctorAppointments,
  updateAppointmentStatus,
} from "../../services/appointmentService";

// Import our abstracted Queue logic
import { 
  getQueueState, 
  callNextPatient, 
  type QueueState 
} from "../../services/queueService";

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

  // Queue State
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [queueActionLoading, setQueueActionLoading] = useState(false);

  // ── 1. Load Initial Data ──────────────────────────────────────────────
  async function loadAppointments() {
    try {
      const data = await getDoctorAppointments(user.id);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadInitialQueue() {
    try {
      const data = await getQueueState(user.token);
      setQueueState(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { 
    loadAppointments(); 
    loadInitialQueue();
  }, [user.id, user.token]);

  // ── 2. SignalR Subscription (Real-time updates) ───────────────────────
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`http://localhost:5165/hubs/queue?access_token=${user.token}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveQueueUpdate", (data: QueueState) => {
      setQueueState(data);
      // Auto-refresh appointments in case the backend marked them as completed
      loadAppointments(); 
    });

    connection.start().catch(console.error);
    return () => { connection.stop(); };
  }, [user.token]);

  // ── 3. Handle Status Updates ──────────────────────────────────────────
  async function handleStatus(id: number, newStatus: AppointmentStatus) {
    setUpdating(id);
    setMsg(null);
    try {
      const result = await updateAppointmentStatus(id, user.id, newStatus);
      setMsg("✅ " + result);
      await loadAppointments();
    } catch (err: any) {
      setMsg("⚠️ " + err.message);
    } finally {
      setUpdating(null);
    }
  }

  // ── 4. Handle "Call Next Patient" (Queue Use Case) ───────────────────
  async function handleCallNext() {
    setQueueActionLoading(true);
    setMsg(null);
    try {
      // Pushes the command to the backend Subject, which broadcasts to all Observers
      await callNextPatient(user.token);
      setMsg("✅ Called next patient successfully.");
      
      // Reload appointments to sync any "Completed" status changes
      await loadAppointments();
    } catch (err: any) {
      // Captures the Exception Flow: "Queue is empty"
      setMsg("⚠️ " + (err.message || "No patients waiting"));
    } finally {
      setQueueActionLoading(false);
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

      <h2 className={styles.pageTitle}>Doctor Dashboard</h2>
      <p className={styles.pageMeta}>
        {new Date().toLocaleDateString("en-MY", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      </p>

      {/* ── QUEUE MANAGEMENT SECTION ───────────────────────────────────── */}
      <div className={styles.queueCard} style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #bbf7d0" }}>
        <h3 style={{ marginTop: 0, color: "#166534" }}>Live Queue Control</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              Now Serving: {queueState && queueState.nowServing > 0 ? `Q-${String(queueState.nowServing).padStart(3,"0")}` : "None"}
            </div>
            <div style={{ color: "#15803d" }}>Patients Waiting: {queueState?.waitingCount || 0}</div>
          </div>
          
          <button 
            onClick={handleCallNext} 
            disabled={queueActionLoading || !queueState || queueState.waitingCount === 0}
            style={{ padding: "12px 24px", fontSize: "1.1rem", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
          >
            {queueActionLoading ? "Calling..." : "🔔 Call Next Patient"}
          </button>
        </div>
      </div>

      <h3 className={styles.sectionTitle}>My Appointments</h3>

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