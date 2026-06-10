import { useState, useEffect } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";

// Import our abstracted Queue logic
import { 
  getQueueState, 
  callNextPatient, 
  type QueueState 
} from "../../services/queueService";

import styles from "./Status.module.css";

export default function Status({ user }: { user: LoginResponse }) {
  const [msg, setMsg] = useState<string | null>(null);

  // Queue State
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [queueActionLoading, setQueueActionLoading] = useState(false);

  const currentPatient = queueState?.queue.find(e => e.status === "Serving");

  // ── 1. Load Initial Queue Data ────────────────────────────────────────
  useEffect(() => { 
    async function loadInitialQueue() {
      try {
        const data = await getQueueState(user.token);
        setQueueState(data);
      } catch (err) {
        console.error(err);
      }
    }
    
    loadInitialQueue();
  }, [user.token]);

  // ── 2. SignalR Subscription (Real-time updates) ───────────────────────
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`http://localhost:5165/hubs/queue?access_token=${user.token}`)
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveQueueUpdate", (data: QueueState) => {
      setQueueState(data);
    });

    connection.start().catch(console.error);
    return () => { connection.stop(); };
  }, [user.token]);

  // ── 3. Handle "Call Next Patient" (Queue Use Case) ───────────────────
  async function handleCallNext() {
    setQueueActionLoading(true);
    setMsg(null);
    try {
      // Pushes the command to the backend Subject, which broadcasts to all Observers
      await callNextPatient(user.token);
      setMsg("✅ Called next patient successfully.");
    } catch (err: any) {
      // Captures the Exception Flow: "Queue is empty"
      setMsg("⚠️ " + (err.message || "No patients waiting"));
    } finally {
      setQueueActionLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      <h2 className={styles.pageTitle}>Doctor Dashboard</h2>
      <p className={styles.pageMeta}>
        {new Date().toLocaleDateString("en-MY", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      </p>

      {/* Feedback Message */}
      {msg && (
        <div className={msg.startsWith("✅") ? styles.successBox : styles.errorBox} style={{ marginBottom: "20px" }}>
          {msg}
        </div>
      )}

      {/* ── QUEUE MANAGEMENT SECTION ───────────────────────────────────── */}
      <div className={styles.queueCard} style={{ backgroundColor: "#f0fdf4", padding: "20px", borderRadius: "10px", marginBottom: "20px", border: "1px solid #bbf7d0" }}>
        <h3 style={{ marginTop: 0, color: "#166534" }}>Live Queue Control</h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              Now Serving: {queueState && queueState.nowServing > 0 ? `Q-${String(queueState.nowServing).padStart(3,"0")}` : "None"}
            </div>
            <div style={{ color: "#15803d" }}>Patients Waiting: {queueState?.waitingCount || 0}</div>
            {currentPatient && (
              <div style={{ marginTop: 10, color: "#166534" }}>
                Serving Patient: {currentPatient.patientName} (Apt #{currentPatient.appointmentId})
              </div>
            )}
          </div>
          
          <button 
            onClick={handleCallNext} 
            disabled={queueActionLoading || !queueState || queueState.waitingCount === 0}
            style={{ padding: "12px 24px", fontSize: "1.1rem", backgroundColor: "#22c55e", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", opacity: (queueActionLoading || !queueState || queueState.waitingCount === 0) ? 0.6 : 1 }}
          >
            {queueActionLoading ? "Calling..." : "🔔 Call Next Patient"}
          </button>
        </div>
      </div>

    </div>
  );
}