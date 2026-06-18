import { useState, useEffect } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getQueueState, type QueueState } from "../../services/queueService";
import styles from "./QueueStatus.module.css";

export default function QueueStatus({ user }: { user: LoginResponse }) {
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [myTicket, setMyTicket] = useState<number | null>(null);
  const [loading, setLoading] = useState(true); // <-- Added a loading state
  
  const [now, setNow] = useState(new Date());

  // 1. Live Clock Tick 
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // 2. Initial HTTP GET 
  useEffect(() => {
    async function loadInitialQueue() {
      try {
        const data = await getQueueState(user.token);
        setQueueState(data);
        
        // Only grab the ticket if it is NOT Completed and NOT Skipped.
        // This ensures if they log back in after finishing, myTicket stays null.
        const activeTicket = data?.queue?.find(
          (e) => e.patientId === user.id && e.status !== "Completed" && e.status !== "Skipped"
        );
        
        if (activeTicket) {
          setMyTicket(activeTicket.ticketNumber);
        } else {
          setMyTicket(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false); // Done loading!
      }
    }
    loadInitialQueue();
  }, [user.id, user.token]);

  // 3. SignalR subscription 
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`http://localhost:5165/hubs/queue?access_token=${user.token}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveQueueUpdate", (data: QueueState) => {
      setQueueState(data);
      setNow(new Date()); 
    });

    connection.start().catch(console.error);
    return () => { connection.stop(); };
  }, [user.token]);

  // 4. Derived State & Math 
  const isMyTurn = queueState && myTicket ? queueState.nowServing === myTicket : false;

  // Two ways a patient can be "done":
  //   1. Normal path: another patient was called next — nowServing > myTicket.
  //   2. Last-patient path: no next patient existed, so nowServing resets to 0
  //      but the queue entry itself is marked "Completed" by the backend.
  //      Check the entry directly so the patient still sees "Thanks for visiting!".
  //
  //   NOTE: We MUST also match ticketNumber here. Matching patientId alone would
  //   catch completed entries from previous visits and wrongly show the "thanks"
  //   message the moment a returning patient gets a new ticket.
  const isCompleted = queueState && myTicket
    ? queueState.nowServing > myTicket
      || queueState.queue.some(
          (e) => e.patientId === user.id && e.ticketNumber === myTicket && e.status === "Completed"
        )
    : false;

  // Count patients who are either still Waiting OR currently being Served
  // and have a lower ticket number than mine.
  // "Serving" must be included: when Patient A transitions from Waiting → Serving
  // they are still occupying the consultation slot ahead of Patient B.
  // Excluding them (only checking "Waiting") would incorrectly show 0 ahead
  // and 100% progress for B while A is mid-consultation.
  const aheadCount = myTicket && queueState
    ? queueState.queue.filter(
        (e) =>
          (e.status === "Waiting" || e.status === "Serving") &&
          e.ticketNumber < myTicket
      ).length
    : 0;

  let waitMins = 0;
  if (myTicket && queueState && aheadCount > 0) {
    const minutesPerSlot = queueState.minutesPerSlot ?? 5;

    const lastUpdated = new Date(queueState.lastUpdatedUtc);
    const elapsedMins = Math.floor((now.getTime() - lastUpdated.getTime()) / 60000);

    // +1 for the patient currently being served who still has time remaining
    const calculatedWait = ((aheadCount + 1) * minutesPerSlot) - elapsedMins;
    const minimumWait = aheadCount * minutesPerSlot;

    waitMins = Math.max(minimumWait, calculatedWait);
  }

  // Progress = how far through the queue this patient is.
  // (total waiting when checked in is hard to know retroactively, so use
  // aheadCount == 0 as 100 %, and scale down linearly as more wait ahead.)
  const progressPct = myTicket && queueState
    ? aheadCount === 0
      ? 100
      : Math.min(99, Math.round(((myTicket - aheadCount) / myTicket) * 100))
    : 0;

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className={styles.pageTitle}>Queue Status</h2>
            <p className={styles.pageSubtitle}>Your real-time position in today's queue</p>
          </div>
          
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#1e3830" }}>
              {now.toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}
            </div>
            <div className={styles.liveChip} style={{ marginTop: "4px" }}>
              <span className={styles.liveDot} />
              Live
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className={styles.mutedText}>Loading your queue status...</p>
      ) : !myTicket ? (
        
        /*  Empty State (Not Checked In Yet) */
        <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginTop: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👋</div>
          <h3 style={{ color: '#0f172a', margin: '0 0 12px 0', fontSize: '1.5rem' }}>Welcome to the Clinic</h3>
          <p style={{ color: '#475569', margin: 0, fontSize: '1.1rem', lineHeight: '1.6' }}>
            You do not have an active queue number yet. <br/>
            <strong>Please check in with the Pharmacist at the front desk</strong> to get your queue number.
          </p>
        </div>

      ) : (

        /* CONDITIONAL UI: Completed vs Waiting  */
        <>
          <div className={styles.ticketCard}>
            <div className={styles.ticketEyebrow}>Your Ticket</div>
            <div className={styles.ticketNumber}>
              {`Q-${String(myTicket).padStart(3, "0")}`}
            </div>
            <div className={styles.ticketLabel}>Keep this page open for live updates</div>
          </div>

          {isCompleted ? (
            
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', marginTop: '24px' }}>
              <h3 style={{ color: '#166534', margin: '0 0 12px 0', fontSize: '1.5rem' }}>🎉 Thanks for visiting!</h3>
              <p style={{ color: '#15803d', margin: 0, fontSize: '1.1rem' }}>
                Your consultation is complete. Please proceed to the pharmacy if you have a prescription. Have a great day!
              </p>
            </div>

          ) : (
            
            <>
              <div className={styles.statusRow}>
                <div className={styles.statusBox}>
                  <div className={styles.statusBoxValue}>
                    {queueState ? `Q-${String(queueState.nowServing).padStart(3,"0")}` : "—"}
                  </div>
                  <div className={styles.statusBoxLabel}>Now Serving</div>
                </div>
                <div className={styles.statusBox}>
                  <div className={styles.statusBoxValue}>
                    {myTicket && queueState ? aheadCount : "—"}
                  </div>
                  <div className={styles.statusBoxLabel}>Ahead of You</div>
                </div>
              </div>

              <div className={styles.waitCard}>
                <span className={styles.waitLabel}>Estimated wait time</span>
                <span className={styles.waitValue}>{waitMins} min{waitMins !== 1 ? "s" : ""}</span>
              </div>

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

              {isMyTurn && (
                <div className={styles.alertBanner}>
                  <div className={styles.alertTitle}>🔔 It's Your Turn!</div>
                  <div className={styles.alertSub}>Please proceed to the consultation room now.</div>
                </div>
              )}
            </>
          )}
        </>
      )}

    </div>
  );
}