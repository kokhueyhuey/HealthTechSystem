import { useEffect, useState } from "react";
import {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  type Medicine,
  type MedicineRequest,
} from "../../services/api";

const emptyForm: MedicineRequest = {
  name: "",
  description: "",
  photo: "",
  quantity: 0,
  threshold: 50,
  expiryDate: "",
};

export default function Inventory() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [form, setForm] = useState<MedicineRequest>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadMedicines() {
    setLoading(true);

    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch {
      alert("Failed to load medicines.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMedicines();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]:
        name === "quantity" || name === "threshold"
          ? Number(value)
          : value,
    });
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name || !form.description || !form.expiryDate) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      if (editingId === null) {
        await addMedicine(form);
        alert("Medicine added successfully.");
      } else {
        await updateMedicine(editingId, form);
        alert("Medicine updated successfully.");
      }

      resetForm();
      await loadMedicines();
    } catch {
      alert("Failed to save medicine.");
    }
  }

  function handleEdit(medicine: Medicine) {
    setEditingId(medicine.id);

    setForm({
      name: medicine.name,
      description: medicine.description,
      photo: medicine.photo,
      quantity: medicine.quantity,
      threshold: medicine.threshold,
      expiryDate: medicine.expiryDate.slice(0, 10),
    });
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this medicine?"
    );

    if (!confirmed) return;

    try {
      await deleteMedicine(id);
      alert("Medicine removed successfully.");
      await loadMedicines();
    } catch {
      alert("Failed to delete medicine.");
    }
  }

  return (
    <div>
      <h2 className="pageTitle">Medicine Inventory</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <h3>{editingId ? "Edit Medicine" : "Add Medicine"}</h3>

        <input
          style={styles.input}
          name="name"
          placeholder="Medicine name"
          value={form.name}
          onChange={handleChange}
        />

        <textarea
          style={styles.textarea}
          name="description"
          placeholder="Description / how to use"
          value={form.description}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          name="photo"
          placeholder="Photo URL"
          value={form.photo}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="number"
          name="threshold"
          placeholder="Low stock threshold"
          value={form.threshold}
          onChange={handleChange}
        />

        <input
          style={styles.input}
          type="date"
          name="expiryDate"
          value={form.expiryDate}
          onChange={handleChange}
        />

        <button style={styles.addBtn} type="submit">
          {editingId ? "Update Medicine" : "Add Medicine"}
        </button>

        {editingId && (
          <button style={styles.cancelBtn} type="button" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </form>

      <div style={styles.tableBox}>
        <h3>Medicine List</h3>

        {loading ? (
          <p>Loading medicines...</p>
        ) : medicines.length === 0 ? (
          <p>No medicine records found.</p>
        ) : (
          medicines.map((medicine) => (
            <div key={medicine.id} className="row" style={styles.row}>
              <div>
                <strong>{medicine.name}</strong>
                <p style={styles.desc}>{medicine.description}</p>
                <small>Expiry: {medicine.expiryDate.slice(0, 10)}</small>
              </div>

              <div>Qty: {medicine.quantity}</div>

              <div className="status">{medicine.status}</div>

              <div>
                <button
                  style={styles.editBtn}
                  onClick={() => handleEdit(medicine)}
                >
                  Edit
                </button>

                <button
                  style={styles.deleteBtn}
                  onClick={() => handleDelete(medicine.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    background: "#1f2937",
    padding: "20px",
    borderRadius: "14px",
    marginBottom: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
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
    background: "#f59e0b",
    fontWeight: "bold",
    cursor: "pointer",
  },
  cancelBtn: {
    padding: "12px",
    border: "none",
    borderRadius: "8px",
    background: "#6b7280",
    color: "white",
    cursor: "pointer",
  },
  tableBox: {
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
  editBtn: {
    marginRight: "8px",
    padding: "8px 12px",
    border: "none",
    borderRadius: "8px",
    background: "#3b82f6",
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