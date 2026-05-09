import { useState, useEffect, useCallback } from "react";
import type { LoginResponse } from "../../services/api";
import styles from "./Queue.module.css";

// ── Types ──────────────────────────────────────────────────────────────
type AppointmentStatus = "Pending" | "InProgress" | "Completed" | "Cancelled";

type Appointment = {
  id: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string; // ISO
  status: AppointmentStatus;
};

type QueueEntry = {
  queueEntryId: number;
  ticketNumber: number;
  patientId: number;
  appointmentId: number;
  status: "Waiting" | "Serving" | "Completed" | "Skipped";
};

type QueueState = {
  nowServing: number;
  lastIssued: number;
  waitingCount: number;
  queue: QueueEntry[];
};

// ── Helpers ────────────────────────────────────────────────────────────
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS   = ["January","February","March","April","May","June",
                  "July","August","September","October","November","December"];

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function toISODate(d: Date) { return toDateKey(d); }

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  Pending:    styles.statusPending,
  InProgress: styles.statusInProgress,
  Completed:  styles.statusCompleted,
  Cancelled:  styles.statusCancelled,
};

// ── Component ──────────────────────────────────────────────────────────
export default function PharmacistQueue({ user }: { user: LoginResponse }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calendar state
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected,  setSelected]  = useState<Date>(new Date(today));

  // Data state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queueState,   setQueueState]   = useState<QueueState | null>(null);
  const [apptLoading,  setApptLoading]  = useState(false);
  const [enqueuingId,  setEnqueuingId]  = useState<number | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // IDs already in the queue (to disable their buttons)
  const enqueuedApptIds = new Set(queueState?.queue.map(e => e.appointmentId) ?? []);

  // ── Fetch appointments for selected date ─────────────────────────────
  const loadAppointments = useCallback(async (date: Date) => {
    setApptLoading(true);
    setMsg(null);
    try {
      const iso = toISODate(date);
      const res = await fetch(`/api/appointments/by-date?date=${iso}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setAppointments(await res.json());
    } catch (e: any) {
      setMsg({ text: e.message ?? "Failed to load appointments", ok: false });
    } finally {
      setApptLoading(false);
    }
  }, [user.token]);

  // ── Fetch current queue state ─────────────────────────────────────────
  const loadQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/queue", {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      if (res.ok) setQueueState(await res.json());
    } catch (e) { console.error(e); }
  }, [user.token]);

  useEffect(() => {
    loadAppointments(selected);
    loadQueue();
  }, []);

  // Reload appointments whenever selected date changes
  useEffect(() => {
    loadAppointments(selected);
  }, [selected]);

  // ── Enter Queue ────────────────────────────────────────────────────────
  async function handleEnqueue(appt: Appointment) {
    setEnqueuingId(appt.id);
    setMsg(null);
    try {
      const res = await fetch("/api/queue/enqueue", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: appt.id,
          patientId: appt.id,        // replace with real patientId if available on the type
          patientName: appt.patientName,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const entry: QueueEntry = await res.json();
      setMsg({ text: `✓ ${appt.patientName} added — Ticket #${entry.ticketNumber}`, ok: true });
      await loadQueue();
    } catch (e: any) {
      setMsg({ text: e.message ?? "Failed to enqueue patient", ok: false });
    } finally {
      setEnqueuingId(null);
    }
  }

  // ── Calendar helpers ──────────────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  // Build calendar grid (always 6 rows × 7 cols)
  function buildCalendarDays() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }

  const calCells    = buildCalendarDays();
  const selectedKey = toDateKey(selected);
  const todayKey    = toDateKey(today);

  // ── Derived stats for the selected date ────────────────────────────────
  const total      = appointments.length;
  const pending    = appointments.filter(a => a.status === "Pending").length;
  const inProgress = appointments.filter(a => a.status === "InProgress").length;
  const inQueueCount = appointments.filter(a => enqueuedApptIds.has(a.id)).length;

  const isToday = selectedKey === todayKey;
  const selectedLabel = selected.toLocaleDateString("en-MY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className={styles.page}>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.roleBadge}>Pharmacist · Queue Management</div>
          <h2 className={styles.pageTitle}>Patient Check-In</h2>
        </div>
        <div className={styles.liveChip}>
          <span className={styles.liveDot} />
          Live Queue
        </div>
      </div>

      {/* ── Toast ────────────────────────────────────────────────────── */}
      {msg && (
        <div className={`${styles.toast} ${msg.ok ? styles.toastSuccess : styles.toastError}`}>
          {msg.text}
        </div>
      )}

      {/* ── Calendar ─────────────────────────────────────────────────── */}
      <div className={styles.calendarSection}>
        <div className={styles.calendarHeader}>
          <button className={styles.calNavBtn} onClick={prevMonth}>‹</button>
          <span className={styles.calMonthLabel}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button className={styles.calNavBtn} onClick={nextMonth}>›</button>
        </div>

        {/* Weekday row */}
        <div className={styles.calWeekRow}>
          {WEEKDAYS.map(d => (
            <div key={d} className={styles.calWeekDay}>{d}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className={styles.calGrid}>
          {calCells.map((day, idx) => {
            if (!day) return <div key={idx} className={styles.calDayEmpty} />;

            const cellDate = new Date(viewYear, viewMonth, day);
            const cellKey  = toDateKey(cellDate);
            const isSel    = cellKey === selectedKey;
            const isT      = cellKey === todayKey;

            return (
              <button
                key={idx}
                className={[
                  styles.calDay,
                  isSel ? styles.calDaySelected : "",
                  isT   ? styles.calDayToday    : "",
                ].join(" ")}
                onClick={() => setSelected(cellDate)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Selected date label ──────────────────────────────────────── */}
      <div className={styles.dateLabel}>
        📅 Appointments for{" "}
        <span className={styles.dateLabelStrong}>
          {isToday ? "Today" : selectedLabel}
        </span>
        {!isToday && <span> — {selectedLabel}</span>}
      </div>

      {/* ── Stats bar ────────────────────────────────────────────────── */}
      <div className={styles.statsBar}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{total}</div>
          <div className={styles.statLabel}>Scheduled</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{pending}</div>
          <div className={styles.statLabel}>Pending</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{inProgress}</div>
          <div className={styles.statLabel}>In Progress</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{inQueueCount}</div>
          <div className={styles.statLabel}>In Queue</div>
        </div>
      </div>

      {/* ── Appointment list ─────────────────────────────────────────── */}
      <div className={styles.sectionTitle}>Appointments</div>

      <div className={styles.apptList}>
        {apptLoading && (
          <div className={styles.loadingRow}>
            Loading appointments…
          </div>
        )}

        {!apptLoading && appointments.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <div className={styles.emptyText}>No appointments scheduled for this date.</div>
          </div>
        )}

        {!apptLoading && appointments.map((appt, idx) => {
          const alreadyQueued = enqueuedApptIds.has(appt.id);
          const isEnqueuing   = enqueuingId === appt.id;
          const apptTime      = new Date(appt.appointmentDate).toLocaleTimeString("en-MY", {
            hour: "2-digit", minute: "2-digit",
          });
          const canEnqueue = appt.status !== "Completed" && appt.status !== "Cancelled";

          return (
            <div
              key={appt.id}
              className={`${styles.apptCard} ${alreadyQueued ? styles.inQueue : ""}`}
              style={{ animationDelay: `${0.05 + idx * 0.04}s` }}
            >
              {/* Ticket / queue number badge */}
              <div className={styles.ticketBadge}>
                {alreadyQueued ? (
                  <>
                    <div className={styles.ticketBadgeNum}>
                      {String(
                        queueState?.queue.find(e => e.appointmentId === appt.id)?.ticketNumber ?? 0
                      ).padStart(3, "0")}
                    </div>
                    <div className={styles.ticketBadgeLabel}>Queue</div>
                  </>
                ) : (
                  <>
                    <div className={styles.ticketBadgeNum} style={{ color: "#1e3830" }}>
                      #{appt.id}
                    </div>
                    <div className={styles.ticketBadgeLabel}>Appt</div>
                  </>
                )}
              </div>

              {/* Patient info */}
              <div className={styles.apptInfo}>
                <div className={styles.apptName}>{appt.patientName}</div>
                <div className={styles.apptMeta}>
                  <span className={styles.apptTime}>{apptTime}</span>
                  <span className={styles.apptDoctor}>Dr. {appt.doctorName}</span>
                  {appt.patientPhone && <span>{appt.patientPhone}</span>}
                </div>
              </div>

              {/* Status pill */}
              <div className={`${styles.statusPill} ${STATUS_CLASS[appt.status]}`}>
                {appt.status}
              </div>

              {/* Enter Queue button */}
              {alreadyQueued ? (
                <div className={`${styles.btnEnqueue} ${styles.btnEnqueued}`}>
                  ✓ In Queue
                </div>
              ) : (
                <button
                  className={styles.btnEnqueue}
                  disabled={!canEnqueue || isEnqueuing || !!enqueuingId}
                  onClick={() => handleEnqueue(appt)}
                >
                  {isEnqueuing
                    ? <><span className={styles.spinner} /> Adding…</>
                    : <>+ Enter Queue</>}
                </button>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}