import { useState, useEffect } from "react";
import { HubConnectionBuilder } from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import {
  getMedicines,
  getCurrentPatient,
  generatePrescription,
  completeWithoutPrescription,
  type Medicine,
  type CurrentPatient,
  type PrescriptionItemRequest,
} from "../../services/api";
import {
  getQueueState,
  callNextPatient,
  type QueueState,
} from "../../services/queueService";
import styles from "./Consultation.module.css";

const DEFAULT_ITEM: PrescriptionItemRequest = {
  medicineId: 0,
  dosage: "",
  quantity: 1,
  usageInstruction: "",
  preference: "Pill",
};

export default function Consultation({ user }: { user: LoginResponse }) {
  // Queue state
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [queueActionLoading, setQueueActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Patient + medicines
  const [patient, setPatient] = useState<CurrentPatient | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);

  // Prescription form
  const [items, setItems] = useState<PrescriptionItemRequest[]>([{ ...DEFAULT_ITEM }]);
  const [needMc, setNeedMc] = useState(false);
  const [mcReason, setMcReason] = useState("");
  const [mcDays, setMcDays] = useState(1);
  const [formMsg, setFormMsg] = useState<string | null>(null);

  const currentQueuePatient = queueState?.queue.find(e => e.status === "Serving");

  // ── 1. Initial queue load ─────────────────────────────────────────────
  useEffect(() => {
    async function loadQueue() {
      try {
        const data = await getQueueState(user.token);
        setQueueState(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadQueue();
  }, [user.token]);

  // ── 2. SignalR subscription (real-time queue updates) ─────────────────
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

  // ── 3. Initial patient + medicines load ────────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      const [patientResult, medicinesResult] = await Promise.allSettled([
        getCurrentPatient(user.id),
        getMedicines(),
      ]);
      if (patientResult.status === "fulfilled") setPatient(patientResult.value);
      if (medicinesResult.status === "fulfilled") setMedicines(medicinesResult.value);
    }
    loadInitialData();
  }, [user.id]);

  function resetPrescriptionForm() {
    setItems([{ ...DEFAULT_ITEM }]);
    setNeedMc(false);
    setMcReason("");
    setMcDays(1);
    setFormMsg(null);
  }

  async function refreshCurrentPatient() {
    setPatientLoading(true);
    try {
      const current = await getCurrentPatient(user.id);
      setPatient(current);
      resetPrescriptionForm();
    } catch {
      setPatient(null);
    } finally {
      setPatientLoading(false);
    }
  }

  async function handleCallNext() {
    setQueueActionLoading(true);
    setMsg(null);
    try {
      await callNextPatient(user.token, user.id);
      setMsg("✅ Called next patient successfully.");
      await refreshCurrentPatient();
    } catch (err: any) {
      setMsg("⚠️ " + (err.message || "No patients waiting"));
    } finally {
      setQueueActionLoading(false);
    }
  }

  function updateItem(index: number, field: keyof PrescriptionItemRequest, value: string | number) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  }

  function addMedicineItem() {
    setItems([...items, { ...DEFAULT_ITEM }]);
  }

  function removeMedicineItem(index: number) {
    if (items.length === 1) {
      setFormMsg("⚠️ At least one medicine item is required.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  }

  async function handleGeneratePrescription(e: React.FormEvent) {
    e.preventDefault();
    if (!patient) return;

    const invalidItem = items.some(
      item =>
        item.medicineId === 0 ||
        !item.dosage ||
        item.quantity <= 0 ||
        !item.usageInstruction ||
        !item.preference
    );

    if (invalidItem) {
      setFormMsg("⚠️ Please complete all prescription medicine details.");
      return;
    }

    try {
      await generatePrescription({
        appointmentId: patient.appointmentId,
        needMc,
        mcReason: needMc ? mcReason : "",
        mcDays: needMc ? mcDays : 0,
        items,
      });
      setFormMsg("✅ Prescription sent to pharmacist for approval.");
      await refreshCurrentPatient();
    } catch (err: any) {
      setFormMsg("⚠️ " + (err.message || "Failed to generate prescription."));
    }
  }

  async function handleCompleteWithoutPrescription() {
    if (!patient) return;
    if (!window.confirm("Complete consultation without prescription?")) return;

    try {
      await completeWithoutPrescription(patient.appointmentId);
      setPatient(null);
      resetPrescriptionForm();
      setMsg("✅ Consultation completed without prescription.");
    } catch (err: any) {
      setMsg("⚠️ " + (err.message || "Failed to complete consultation."));
    }
  }

  const dateStr = new Date().toLocaleDateString("en-MY", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className={styles.page}>
      <h2 className={styles.pageTitle}>Consultation</h2>
      <p className={styles.pageMeta}>{dateStr}</p>

      {msg && (
        <div className={msg.startsWith("✅") ? styles.successBox : styles.errorBox}>
          {msg}
        </div>
      )}

      {/* ── Queue Control ──────────────────────────────────────── */}
      <div className={styles.queueCard}>
        <h3 className={styles.queueCardTitle}>Live Queue</h3>
        <div className={styles.queueContent}>
          <div className={styles.queueInfo}>
            <div className={styles.nowServing}>
              Now Serving:{" "}
              {queueState && queueState.nowServing > 0
                ? `Q-${String(queueState.nowServing).padStart(3, "0")}`
                : "None"}
            </div>
            <div className={styles.waitingCount}>
              Patients Waiting: {queueState?.waitingCount ?? 0}
            </div>
            {currentQueuePatient && (
              <div className={styles.servingPatient}>
                Serving: {currentQueuePatient.patientName} (Apt #{currentQueuePatient.appointmentId})
              </div>
            )}
          </div>
          <button
            className={styles.callBtn}
            onClick={handleCallNext}
            disabled={queueActionLoading || !queueState || queueState.waitingCount === 0}
          >
            {queueActionLoading ? "Calling..." : "🔔 Call Next Patient"}
          </button>
        </div>
      </div>

      {/* ── Consultation Section ───────────────────────────────── */}
      {patientLoading && (
        <div className={styles.loadingState}>Loading patient...</div>
      )}

      {!patientLoading && !patient && (
        <div className={styles.emptyState}>
          <p>No patient currently in consultation.</p>
          <p>Call the next patient above to begin.</p>
        </div>
      )}

      {!patientLoading && patient && (
        <>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Current Patient</h3>
            <p><strong>Name:</strong> {patient.patientName}</p>
            <p><strong>Appointment ID:</strong> {patient.appointmentId}</p>
            <p><strong>Status:</strong> {patient.status}</p>
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Consultation Decision</h3>
            <p className={styles.decisionText}>
              If this patient only comes for a body check-up or follow-up and does not need medicine,
              complete the consultation without a prescription.
            </p>
            <button className={styles.completeBtn} onClick={handleCompleteWithoutPrescription}>
              Complete Without Prescription
            </button>
          </div>

          <form className={styles.card} onSubmit={handleGeneratePrescription}>
            <h3 className={styles.cardTitle}>Prescription Details</h3>

            {items.map((item, index) => (
              <div key={index} className={styles.itemBox}>
                <select
                  className={styles.select}
                  value={item.medicineId}
                  onChange={e => updateItem(index, "medicineId", Number(e.target.value))}
                >
                  <option value={0}>Select Medicine</option>
                  {medicines.map(med => (
                    <option key={med.id} value={med.id}>
                      {med.name} | Stock: {med.quantity} | Status: {med.status}
                    </option>
                  ))}
                </select>

                <input
                  className={styles.input}
                  placeholder="Dosage e.g. 1 tablet twice daily"
                  value={item.dosage}
                  onChange={e => updateItem(index, "dosage", e.target.value)}
                />

                <input
                  className={styles.input}
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={e => updateItem(index, "quantity", Number(e.target.value))}
                />

                <select
                  className={styles.select}
                  value={item.preference}
                  onChange={e => updateItem(index, "preference", e.target.value)}
                >
                  <option value="Pill">Pill</option>
                  <option value="Liquid">Liquid</option>
                </select>

                <textarea
                  className={styles.textarea}
                  placeholder="Usage instruction"
                  value={item.usageInstruction}
                  onChange={e => updateItem(index, "usageInstruction", e.target.value)}
                />

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => removeMedicineItem(index)}
                >
                  Remove Medicine
                </button>
              </div>
            ))}

            <button type="button" className={styles.addBtn} onClick={addMedicineItem}>
              + Add Medicine
            </button>

            <div className={styles.mcBox}>
              <label className={styles.mcLabel}>
                <input
                  type="checkbox"
                  checked={needMc}
                  onChange={e => setNeedMc(e.target.checked)}
                />
                Patient needs MC
              </label>

              {needMc && (
                <>
                  <input
                    className={styles.input}
                    placeholder="MC Reason"
                    value={mcReason}
                    onChange={e => setMcReason(e.target.value)}
                  />
                  <input
                    className={styles.input}
                    type="number"
                    placeholder="MC Days"
                    value={mcDays}
                    onChange={e => setMcDays(Number(e.target.value))}
                  />
                </>
              )}
            </div>

            {formMsg && (
              <div className={formMsg.startsWith("✅") ? styles.successBox : styles.errorBox}>
                {formMsg}
              </div>
            )}

            <button type="submit" className={styles.submitBtn}>
              Submit Prescription to Pharmacist
            </button>
          </form>
        </>
      )}
    </div>
  );
}
