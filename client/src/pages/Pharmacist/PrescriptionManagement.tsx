import { useEffect, useState } from "react";
import {
  getPendingPrescriptions,
  approvePrescription,
  type Prescription, } from "../../services/api";


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
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    padding: "20px",
    borderRadius: "10px",
    marginBottom: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  itemBox: {
    background: "#f8f9ff",
    padding: "14px",
    borderRadius: "8px",
    marginBottom: "12px",
    border: "1px solid #e5e7eb",
  },
  mcBox: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "12px",
    color: "#92400e",
  },
  approveBtn: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "6px",
    background: "#0d9488",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
    fontFamily: "Inter, sans-serif",
  },
};