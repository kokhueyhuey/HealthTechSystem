import { useEffect, useState } from "react";
import {
  getPendingPrescriptions,
  approvePrescription,
  type Prescription,
} from "../../services/api";
import Appointments from "../Doctor/Appointments";


export default function PrescriptionManagement() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPendingPrescriptions();
  }, []);

  async function loadPendingPrescriptions() {
    setLoading(true);

    try {
      const data = await getPendingPrescriptions();
      setPrescriptions(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    const confirmed = window.confirm("Approve this prescription?");

    if (!confirmed) return;

    try {
        await approvePrescription(id);

        setPrescriptions((prev) =>
        prev.filter((prescription) => prescription.id !== id)
        );

        alert("Prescription approved successfully.");
    } catch (error: any) {
        alert(error.message);
    }
    }

  return (
    <div>
      <h2 className="pageTitle">Prescription Management</h2>

      {loading ? (
        <p>Loading pending prescriptions...</p>
      ) : prescriptions.length === 0 ? (
        <div style={styles.card}>
          <p>No pending prescriptions.</p>
        </div>
      ) : (
        prescriptions.map((prescription) => (
          <div key={prescription.id} style={styles.card}>
            <h3>Prescription #{prescription.id}</h3>
            <h3>Appointment #{prescription.appointmentId}</h3>

            <p><strong>Patient:</strong> {prescription.patientName}</p>
            <p><strong>Status:</strong> {prescription.status}</p>

            {prescription.needMc && (
              <div style={styles.mcBox}>
                <p><strong>MC Required:</strong> Yes</p>
                <p><strong>Reason:</strong> {prescription.mcReason}</p>
                <p><strong>Days:</strong> {prescription.mcDays}</p>
              </div>
            )}

            <h4>Medicine Items</h4>

            {prescription.items.map((item) => (
              <div key={item.id} style={styles.itemBox}>
                <p><strong>Medicine:</strong> {item.medicineName}</p>
                <p><strong>Dosage:</strong> {item.dosage}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Preference:</strong> {item.preference}</p>
                <p><strong>Usage Instruction:</strong> {item.usageInstruction}</p>
              </div>
            ))}

            <button
              style={styles.approveBtn}
              onClick={() => handleApprove(prescription.id)}
            >
              Approve Prescription
            </button>
          </div>
        ))
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: "#1f2937",
    padding: "20px",
    borderRadius: "14px",
    marginBottom: "20px",
  },
  itemBox: {
    background: "#111827",
    padding: "14px",
    borderRadius: "10px",
    marginBottom: "12px",
    border: "1px solid #374151",
  },
  mcBox: {
    background: "#78350f",
    padding: "12px",
    borderRadius: "10px",
    marginBottom: "12px",
  },
  approveBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};