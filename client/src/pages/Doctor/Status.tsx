// ─────────────────────────────────────────────────────────────────────────────
// USE CASE: Update Appointment Status — Doctor
// Observer Pattern: StatusUpdated → Patient + Doctor + Pharmacist notified
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import type { LoginResponse } from "../../services/api";
import type {
  DoctorAppointmentSummary,
} from "../../services/appointmentService";

import type { AppointmentStatus } from "../../types/appointment";
import {
  getDoctorAppointments,
  updateAppointmentStatus,
} from "../../services/appointmentService";

const STATUSES: AppointmentStatus[] = [
  "Pending",
  "InProgress",
  "Completed",
  "Cancelled",
];

export default function Status({ user }: { user: LoginResponse }) {
  const [appointments, setAppointments] = useState<
    DoctorAppointmentSummary[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);

  // ── Load doctor appointments ─────────────────────────────
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

  useEffect(() => {
    load();
  }, [user.id]);

  // ── Update status ────────────────────────────────────────
  async function handleStatus(
    id: number,
    newStatus: AppointmentStatus
  ) {
    setUpdating(id);
    setMsg(null);

    try {
      const result = await updateAppointmentStatus(
        id,
        user.id,
        newStatus
      );

      setMsg("✅ " + result);
      await load();
    } catch (err: any) {
      setMsg("⚠️ " + err.message);
    } finally {
      setUpdating(null);
    }
  }

  const activeAppointments = appointments.filter(
    (a) => a.status !== "Completed" && a.status !== "Cancelled"
  );

  return (
    <div>
      <h2 className="pageTitle">Update Appointment Status</h2>
      <p className="pageSub">
        Pending → InProgress → Completed (Observer Pattern active)
      </p>

      {/* Message */}
      {msg && (
        <div className={msg.startsWith("✅") ? "successBox" : "errorBox"}>
          {msg}
        </div>
      )}

      {/* Loading */}
      {loading && <p className="mutedText">Loading appointments...</p>}

      {/* Empty state */}
      {!loading && activeAppointments.length === 0 && (
        <div className="emptyState">
          No active appointments found.
        </div>
      )}

      {/* Appointment cards */}
      {activeAppointments.map((a) => (
        <div key={a.id} className="apptCard">
          <div className="apptTitle">
            #{a.id} — {a.patientName}
          </div>

          <div className="apptSub">
            📅{" "}
            {new Date(a.appointmentDate).toLocaleString("en-MY", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {"  "}
            · Current:{" "}
            <strong style={{ color: "#fbbf24" }}>{a.status}</strong>
          </div>

          {/* Status buttons */}
          <div className="statusBtnRow">
            {STATUSES.map((st) => (
              <button
                key={st}
                className={`statusBtn ${
                  a.status === st ? "statusBtnActive" : ""
                }`}
                disabled={updating === a.id || a.status === st}
                onClick={() => handleStatus(a.id, st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}