import { useState, useEffect } from "react";
import type { LoginResponse } from "../../services/api";
import styles from "./Queue.module.css";

type QueueEntry = {
  queueEntryId: number;
  ticketNumber: number;
  patientName: string;
  status: "Waiting" | "Serving" | "Completed" | "Skipped";
  checkedInAt: string;
};

type QueueState = {
  nowServing: number;
  lastIssued: number;
  waitingCount: number;
  queue: QueueEntry[];
};

const API = (path: string, token: string, method = "GET") =>
  fetch(`/api/queue${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  }).then(r => r.json());

export default function Queue({ user }: { user: LoginResponse }) {
  const [state, setState] = useState<QueueState | null>(null);
  const [loading, setLoading] = useState(false);
  const [bumping, setBumping] = useState(false);

  async function loadQueue() {
    const data = await API("", user.token);
    setState(data);
  }

  useEffect(() => { loadQueue(); }, []);

  async function handleCallNext() {
    setLoading(true);
    setBumping(true);
    try {
      const data = await API("/next", user.token, "POST");
      setState(data);
      setTimeout(() => setBumping(false), 400);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      const data = await API("/skip", user.token, "POST");
      setState(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const data = await API("/complete", user.token, "POST");
      setState(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const todayStr = new Date().toLocaleDateString("en-MY", { weekday:"long", day:"numeric", month:"long" });
  const activeQueue = state?.queue.filter(e => e.status !== "Completed" && e.status !== "Skipped") ?? [];
  const completedToday = state?.queue.filter(e => e.status === "Completed").length ?? 0;

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.pageTitle}>Queue Management</div>
          <div className={styles.pageSub}>Doctor Dashboard</div>
        </div>
        <div className={styles.sessionBadge}>{todayStr}</div>
      </div>

      {/* Main counter */}
      <div className={styles.counterCard}>
        <div className={styles.counterLeft}>
          <div className={styles.counterEyebrow}>Now Serving</div>
          <div className={`${styles.counterNum} ${bumping ? styles.bump : ""}`}>
            {state ? String(state.nowServing).padStart(3, "0") : "—"}
          </div>
          <div className={styles.counterSub}>
            {state?.waitingCount ?? 0} patient(s) waiting
          </div>
        </div>

        <div className={styles.callBtn}>
          <button
            className={styles.btnNext}
            onClick={handleCallNext}
            disabled={loading || (state?.waitingCount ?? 0) === 0}
            title="Call Next Patient"
          >
            ›
          </button>
          <span className={styles.btnNextLabel}>Call Next</span>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{state?.waitingCount ?? 0}</div>
          <div className={styles.statLabel}>Waiting</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{completedToday}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={styles.statBox}>
          <div className={styles.statValue}>{state?.lastIssued ?? 0}</div>
          <div className={styles.statLabel}>Total Issued</div>
        </div>
      </div>

      {/* Queue list */}
      <div className={styles.queueSection}>
        <div className={styles.sectionTitle}>Active Queue</div>
        <div className={styles.queueList}>
          {activeQueue.length === 0 && (
            <div style={{ color:"#1e3a5f", fontSize:13, padding:"16px 0" }}>
              No patients in queue.
            </div>
          )}
          {activeQueue.map(entry => (
            <div
              key={entry.queueEntryId}
              className={`${styles.queueRow} ${entry.status === "Serving" ? styles.serving : ""}`}
            >
              <span className={styles.queueRowNum}>
                {String(entry.ticketNumber).padStart(3,"0")}
              </span>
              <span className={styles.queueRowName}>{entry.patientName}</span>
              <span className={styles.queueRowTime}>
                {new Date(entry.checkedInAt).toLocaleTimeString("en-MY", { timeStyle:"short" })}
              </span>
              <span className={`${styles.statusPill} ${styles[entry.status.toLowerCase()]}`}>
                {entry.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actionRow}>
        <button className={styles.btnAction} onClick={handleComplete} disabled={loading}>
          ✓ Mark Complete
        </button>
        <button className={`${styles.btnAction} ${styles.danger}`} onClick={handleSkip} disabled={loading}>
          ✗ Skip Patient
        </button>
      </div>

    </div>
  );
}