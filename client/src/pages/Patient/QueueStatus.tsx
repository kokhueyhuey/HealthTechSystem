import { useState, useEffect } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getQueueState, type QueueState } from "../../services/queueService";
import styles from "./QueueStatus.module.css";

export default function QueueStatus({ user }: { user: LoginResponse }) {
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [myTicket, setMyTicket] = useState<number | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  // ── 1. Initial HTTP GET (Abstracted!) ──────────────────────────────────
  useEffect(() => {
    async function loadInitialQueue() {
      try {
        const data = await getQueueState(user.token);
        setQueueState(data);
        
        // Safe check using optional chaining (?.) to prevent crashes
        const me = data?.queue?.find((e) => e.patientId === user.id);
        if (me) setMyTicket(me.ticketNumber);
      } catch (err) {
        console.error(err);
      }
    }
    loadInitialQueue();
  }, [user.id, user.token]);

  // ── 2. SignalR subscription (Push Model) ───────────────────────────────
  useEffect(() => {
    // Note: Pointing to the specific queue hub, not the notification hub!
    const connection = new HubConnectionBuilder()
      .withUrl(`http://localhost:5165/hubs/queue?access_token=${user.token}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveQueueUpdate", (data: QueueState) => {
      setQueueState(data);
      if (myTicket && data.nowServing === myTicket) setIsMyTurn(true);
    });

    connection.start().catch(console.error);
    return () => { connection.stop(); };
  }, [myTicket, user.token]);

  const waitMins = myTicket && queueState
    ? Math.max(0, (myTicket - queueState.nowServing) * (queueState.minutesPerSlot ?? 5))
    : 0;

  const progressPct = queueState && myTicket
    ? Math.min(100, Math.round((queueState.nowServing / myTicket) * 100))
    : 0;

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.pageTitle}>Queue Status</h2>
        <p className={styles.pageSubtitle}>Your real-time position in today's queue</p>
        <div className={styles.liveChip}>
          <span className={styles.liveDot} />
          Live
        </div>
      </div>

      {/* Your ticket */}
      <div className={styles.ticketCard}>
        <div className={styles.ticketEyebrow}>Your Ticket</div>
        <div className={styles.ticketNumber}>
          {myTicket ? `Q-${String(myTicket).padStart(3, "0")}` : "—"}
        </div>
        <div className={styles.ticketLabel}>Keep this page open for live updates</div>
      </div>

      {/* Now serving / Ahead of you */}
      <div className={styles.statusRow}>
        <div className={styles.statusBox}>
          <div className={styles.statusBoxValue}>
            {queueState ? `Q-${String(queueState.nowServing).padStart(3,"0")}` : "—"}
          </div>
          <div className={styles.statusBoxLabel}>Now Serving</div>
        </div>
        <div className={styles.statusBox}>
          <div className={styles.statusBoxValue}>
            {myTicket && queueState
              ? Math.max(0, myTicket - queueState.nowServing)
              : "—"}
          </div>
          <div className={styles.statusBoxLabel}>Ahead of You</div>
        </div>
      </div>

      {/* Estimated wait */}
      <div className={styles.waitCard}>
        <span className={styles.waitLabel}>Estimated wait time</span>
        <span className={styles.waitValue}>{waitMins} min{waitMins !== 1 ? "s" : ""}</span>
      </div>

      {/* Progress bar */}
      {myTicket && (
        <div className={styles.positionBar}>
          <div className={styles.positionBarLabel}>
            <span>Queue progress</span>
            <span>{progressPct}%</span>
          </div>
          <div className={styles.positionBarTrack}>
            <div className={styles.positionBarFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {/* It's your turn alert */}
      {isMyTurn && (
        <div className={styles.alertBanner}>
          <div className={styles.alertTitle}>🔔 It's Your Turn!</div>
          <div className={styles.alertSub}>Please proceed to the consultation room now.</div>
        </div>
      )}

    </div>
  );
}