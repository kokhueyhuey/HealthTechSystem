import { useEffect, useState } from "react";
import {
  getMedicines,
  getCurrentPatient,
  generatePrescription,
  completeWithoutPrescription,
  getSession,
  type Medicine,
  type CurrentPatient,
  type PrescriptionItemRequest,
} from "../../services/api";

  const currentUser = getSession();
  const doctorId = currentUser?.id;

export default function Prescription() {
  const [patient, setPatient] = useState<CurrentPatient | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const [needMc, setNeedMc] = useState(false);
  const [mcReason, setMcReason] = useState("");
  const [mcDays, setMcDays] = useState(1);

  const [items, setItems] = useState<PrescriptionItemRequest[]>([
    {
      medicineId: 0,
      dosage: "",
      quantity: 1,
      usageInstruction: "",
      preference: "Pill",
    },
  ]);

  useEffect(() => {
    loadPageData();
  }, []);

  async function loadPageData() {
    setLoading(true);

    try {
      if (!doctorId) {
        alert("Doctor session not found.");
        return;
      }

      const currentPatient = await getCurrentPatient(doctorId);
      const medicineList = await getMedicines();

      setPatient(currentPatient);
      setMedicines(medicineList);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateItem(
    index: number,
    field: keyof PrescriptionItemRequest,
    value: string | number
  ) {
    const updated = [...items];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setItems(updated);
  }

  function addMedicineItem() {
    setItems([
      ...items,
      {
        medicineId: 0,
        dosage: "",
        quantity: 1,
        usageInstruction: "",
        preference: "Pill",
      },
    ]);
  }

  function removeMedicineItem(index: number) {
    if (items.length === 1) {
      alert("At least one medicine item is required.");
      return;
    }

    setItems(items.filter((_, i) => i !== index));
  }

  async function handleGeneratePrescription(e: React.FormEvent) {
    e.preventDefault();

    if (!patient) {
      alert("No patient currently in consultation.");
      return;
    }

    const invalidItem = items.some(
      (item) =>
        item.medicineId === 0 ||
        !item.dosage ||
        item.quantity <= 0 ||
        !item.usageInstruction ||
        !item.preference
    );

    if (invalidItem) {
      alert("Please complete all prescription medicine details.");
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

      alert("Prescription generated and sent to pharmacist for approval.");
      await loadPageData();
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleCompleteWithoutPrescription() {
    if (!patient) {
      alert("No patient currently in consultation.");
      return;
    }

    const confirmComplete = window.confirm(
      "Complete consultation without prescription?"
    );

    if (!confirmComplete) return;

    try {
      await completeWithoutPrescription(patient.appointmentId);
      alert("Consultation completed without prescription.");
      setPatient(null);
    } catch (error: any) {
      alert(error.message);
    }
  }

  if (loading) {
    return <p>Loading prescription page...</p>;
  }

  return (
    <div>
      <h2 className="pageTitle">Generate Prescription</h2>

      {!patient ? (
        <div style={styles.card}>
          <h3>No patient currently in consultation</h3>
          <p>Please click “Call Next Patient” from the queue page first.</p>
        </div>
      ) : (
        <>
          <div style={styles.card}>
            <h3>Current Patient</h3>
            <p><strong>Patient Name:</strong> {patient.patientName}</p>
            <p><strong>Appointment ID:</strong> {patient.appointmentId}</p>
            <p><strong>Status:</strong> {patient.status}</p>
          </div>

          <div style={styles.card}>
            <h3>Consultation Decision</h3>
            <p>
              If this patient only comes for body check-up or follow-up and does
              not need medicine, complete consultation without prescription.
            </p>

            <button
              style={styles.completeBtn}
              onClick={handleCompleteWithoutPrescription}
            >
              Complete Without Prescription
            </button>
          </div>

          <form onSubmit={handleGeneratePrescription} style={styles.card}>
            <h3>Prescription Details</h3>

            {items.map((item, index) => (
              <div key={index} style={styles.itemBox}>
                <select
                  style={styles.input}
                  value={item.medicineId}
                  onChange={(e) =>
                    updateItem(index, "medicineId", Number(e.target.value))
                  }
                >
                  <option value={0}>Select Medicine</option>
                  {medicines.map((medicine) => (
                    <option key={medicine.id} value={medicine.id}>
                      {medicine.name} | Stock: {medicine.quantity} | Status:{" "}
                      {medicine.status}
                    </option>
                  ))}
                </select>

                <input
                  style={styles.input}
                  placeholder="Dosage e.g. 1 tablet twice daily"
                  value={item.dosage}
                  onChange={(e) =>
                    updateItem(index, "dosage", e.target.value)
                  }
                />

                <input
                  style={styles.input}
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, "quantity", Number(e.target.value))
                  }
                />

                <select
                  style={styles.input}
                  value={item.preference}
                  onChange={(e) =>
                    updateItem(index, "preference", e.target.value)
                  }
                >
                  <option value="Pill">Pill</option>
                  <option value="Liquid">Liquid</option>
                </select>

                <textarea
                  style={styles.textarea}
                  placeholder="Usage instruction"
                  value={item.usageInstruction}
                  onChange={(e) =>
                    updateItem(index, "usageInstruction", e.target.value)
                  }
                />

                <button
                  type="button"
                  style={styles.removeBtn}
                  onClick={() => removeMedicineItem(index)}
                >
                  Remove Medicine
                </button>
              </div>
            ))}

            <button type="button" style={styles.addBtn} onClick={addMedicineItem}>
              Add Medicine
            </button>

            <div style={styles.mcBox}>
              <label>
                <input
                  type="checkbox"
                  checked={needMc}
                  onChange={(e) => setNeedMc(e.target.checked)}
                />{" "}
                Patient needs MC
              </label>

              {needMc && (
                <>
                  <input
                    style={styles.input}
                    placeholder="MC Reason"
                    value={mcReason}
                    onChange={(e) => setMcReason(e.target.value)}
                  />

                  <input
                    style={styles.input}
                    type="number"
                    placeholder="MC Days"
                    value={mcDays}
                    onChange={(e) => setMcDays(Number(e.target.value))}
                  />
                </>
              )}
            </div>

            <button type="submit" style={styles.submitBtn}>
              Submit Prescription to Pharmacist
            </button>
          </form>
        </>
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
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "16px",
    border: "1px solid #374151",
    borderRadius: "12px",
    marginBottom: "16px",
  },
  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #374151",
  },
  textarea: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #374151",
    minHeight: "80px",
  },
  addBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#2563eb",
    color: "white",
    marginRight: "10px",
    cursor: "pointer",
  },
  removeBtn: {
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    marginTop: "12px",
  },
  completeBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#f59e0b",
    color: "#111827",
    fontWeight: "bold",
    cursor: "pointer",
  },
  mcBox: {
    marginTop: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
};