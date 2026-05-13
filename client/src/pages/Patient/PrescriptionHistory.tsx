import { useEffect, useState } from "react";
import {
  getPatientPrescriptionHistory,
  getSession,
  type Prescription,
} from "../../services/api";

export default function PrescriptionHistory() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const user = getSession();

    if (!user) {
      alert("Patient session not found.");
      return;
    }

    setLoading(true);

    try {
      const data = await getPatientPrescriptionHistory(user.id);
      setPrescriptions(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="pageTitle">Prescription History</h2>

      {loading ? (
        <p>Loading prescription history...</p>
      ) : prescriptions.length === 0 ? (
        <div style={styles.card}>
          <p>No prescription history found.</p>
        </div>
      ) : (
        prescriptions.map((prescription) => (
          <div key={prescription.id} style={styles.card}>
            <h3>Prescription #{prescription.id}</h3>

            <p>
              <strong>Date:</strong>{" "}
              {new Date(prescription.createdAt).toLocaleDateString()}
            </p>

            <p>
              <strong>Status:</strong> {prescription.status}
            </p>

            {prescription.needMc && (
              <div style={styles.mcBox}>
                <p><strong>MC:</strong> Yes</p>
                <p><strong>Reason:</strong> {prescription.mcReason}</p>
                <p><strong>Days:</strong> {prescription.mcDays}</p>
              </div>
            )}

            <h4>Medicine Details</h4>

            {prescription.items.map((item) => (
              <div key={item.id} style={styles.itemBox}>
                <p><strong>Medicine:</strong> {item.medicineName}</p>
                <p><strong>Dosage:</strong> {item.dosage}</p>
                <p><strong>Quantity:</strong> {item.quantity}</p>
                <p><strong>Type:</strong> {item.preference}</p>
                <p>
                  <strong>Usage Instruction:</strong>{" "}
                  {item.usageInstruction}
                </p>
              </div>
            ))}
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
};