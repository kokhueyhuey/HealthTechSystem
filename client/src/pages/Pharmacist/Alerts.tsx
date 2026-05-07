import { useEffect, useState } from "react";
import {
  getMedicines,
  deleteMedicine,
  updateMedicine,
  type Medicine,
  type MedicineRequest,
} from "../../services/api";

export default function Alerts() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadMedicines() {
    setLoading(true);

    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch {
      alert("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, []);

  const alertMedicines = medicines.filter(
    (medicine) =>
      medicine.status === "Low Stock" ||
      medicine.status === "Out of Stock" ||
      medicine.status === "Expired"
  );

  async function handleRestock(medicine: Medicine) {
    const input = prompt("Enter new quantity:");

    if (input === null) return;

    const newQuantity = Number(input);

    if (newQuantity < 0 || isNaN(newQuantity)) {
      alert("Please enter a valid quantity.");
      return;
    }

    const payload: MedicineRequest = {
      name: medicine.name,
      description: medicine.description,
      photo: medicine.photo,
      quantity: newQuantity,
      threshold: medicine.threshold,
      expiryDate: medicine.expiryDate,
    };

    try {
      await updateMedicine(medicine.id, payload);
      alert("Medicine restocked successfully.");
      await loadMedicines();
    } catch {
      alert("Failed to restock medicine.");
    }
  }

  async function handleRemoveExpired(medicine: Medicine) {
    const confirmed = window.confirm(
      `Remove expired medicine: ${medicine.name}?`
    );

    if (!confirmed) return;

    try {
      await deleteMedicine(medicine.id);
      alert("Expired medicine removed.");
      await loadMedicines();
    } catch {
      alert("Failed to remove medicine.");
    }
  }

  return (
    <div>
      <h2 className="pageTitle">Low Stock & Expiry Alerts</h2>

      <div style={styles.summaryBox}>
        <div style={styles.card}>
          <h3>{alertMedicines.length}</h3>
          <p>Total Alerts</p>
        </div>

        <div style={styles.card}>
          <h3>
            {
              medicines.filter((medicine) => medicine.status === "Low Stock")
                .length
            }
          </h3>
          <p>Low Stock</p>
        </div>

        <div style={styles.card}>
          <h3>
            {
              medicines.filter(
                (medicine) => medicine.status === "Out of Stock"
              ).length
            }
          </h3>
          <p>Out of Stock</p>
        </div>

        <div style={styles.card}>
          <h3>
            {
              medicines.filter((medicine) => medicine.status === "Expired")
                .length
            }
          </h3>
          <p>Expired</p>
        </div>
      </div>

      <div style={styles.alertBox}>
        <h3>Alert List</h3>

        {loading ? (
          <p>Loading alerts...</p>
        ) : alertMedicines.length === 0 ? (
          <p>No low stock or expired medicine alerts.</p>
        ) : (
          alertMedicines.map((medicine) => (
            <div key={medicine.id} className="row" style={styles.row}>
              <div>
                <strong>{medicine.name}</strong>
                <p style={styles.desc}>{medicine.description}</p>
                <small>Expiry Date: {medicine.expiryDate.slice(0, 10)}</small>
              </div>

              <div>
                <p>Quantity: {medicine.quantity}</p>
                <p>Threshold: {medicine.threshold}</p>
              </div>

              <div style={getStatusStyle(medicine.status)}>
                {medicine.status}
              </div>

              <div>
                {medicine.status !== "Expired" && (
                  <button
                    style={styles.restockBtn}
                    onClick={() => handleRestock(medicine)}
                  >
                    Restock
                  </button>
                )}

                {medicine.status === "Expired" && (
                  <button
                    style={styles.deleteBtn}
                    onClick={() => handleRemoveExpired(medicine)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getStatusStyle(status: string): React.CSSProperties {
  if (status === "Expired") {
    return {
      ...styles.status,
      background: "#7f1d1d",
      color: "#fecaca",
    };
  }

  if (status === "Out of Stock") {
    return {
      ...styles.status,
      background: "#991b1b",
      color: "#fee2e2",
    };
  }

  return {
    ...styles.status,
    background: "#78350f",
    color: "#fde68a",
  };
}

const styles: Record<string, React.CSSProperties> = {
  summaryBox: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginBottom: "24px",
  },
  card: {
    background: "#1f2937",
    padding: "20px",
    borderRadius: "14px",
    textAlign: "center",
  },
  alertBox: {
    background: "#1f2937",
    padding: "20px",
    borderRadius: "14px",
  },
  row: {
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },
  desc: {
    color: "#9ca3af",
    margin: "4px 0",
  },
  status: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontWeight: "bold",
    textAlign: "center",
  },
  restockBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#ef4444",
    color: "white",
    cursor: "pointer",
  },
};