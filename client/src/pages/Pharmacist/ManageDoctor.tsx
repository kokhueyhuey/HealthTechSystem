import { useEffect, useState } from "react";
import { adminCreateDoctor, adminDeleteDoctor, type RegisterRequest } from "../../services/api";
import { getDoctors } from "../../services/doctorService";
import type { Doctor } from "../../types/types";

const emptyForm: RegisterRequest = {
  name: "",
  email: "",
  password: "",
  phoneNumber: "",
  role: "Doctor", 
};

export default function ManageDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<RegisterRequest>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function loadDoctors() {
    try {
      const data = await getDoctors();
      setDoctors(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setActionMsg(null);

    try {
      await adminCreateDoctor(form);
      setActionMsg("✅ Doctor created successfully.");
      setForm(emptyForm); 
      loadDoctors();      
    } catch (err: any) {
      setActionMsg("⚠️ " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Are you sure you want to completely remove Dr. ${name}?`)) return;

    setActionMsg(null);
    try {
      await adminDeleteDoctor(id);
      setActionMsg(`✅ Dr. ${name} removed.`);
      loadDoctors();
    } catch (err: any) {
      setActionMsg("⚠️ " + err.message);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <h2 className="pageTitle">Manage Doctors</h2>
      <p className="pageSub">Add new doctors to the system or remove existing ones.</p>

      {actionMsg && (
        <div style={{ padding: 16, borderRadius: 8, marginBottom: 20, background: actionMsg.includes("✅") ? "#f0fdf4" : "#fef2f2", color: actionMsg.includes("✅") ? "#166534" : "#dc2626", border: `1px solid ${actionMsg.includes("✅") ? "#bbf7d0" : "#fecaca"}` }}>
          {actionMsg}
        </div>
      )}

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} style={{ background: "#ffffff", border: "1px solid #e5e7eb", padding: 24, borderRadius: 12, display: "flex", flexDirection: "column", gap: 12, maxWidth: 500, marginBottom: 30, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3>Add New Doctor</h3>

        <input style={styles.input} placeholder="Full Name (e.g. Dr. John Doe)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        <input style={styles.input} type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
        <input style={styles.input} placeholder="Phone Number" value={form.phoneNumber} onChange={e => setForm({...form, phoneNumber: e.target.value})} required />
        <input style={styles.input} type="password" placeholder="Temporary Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />

        <button style={styles.btn} type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Doctor Account"}
        </button>
      </form>

      {/* DOCTOR LIST */}
      <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", padding: 24, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <h3>Current Doctors</h3>
        {doctors.length === 0 ? <p>No doctors found.</p> : (
          doctors.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e5e7eb" }}>
              <div>
                <strong>{d.name}</strong> <span style={{ color: "#64748b", fontSize: 12 }}>({d.specialization})</span>
                <div style={{ fontSize: 13, color: "#64748b" }}>{d.email} | {d.phoneNumber}</div>
              </div>
              <button onClick={() => handleDelete(d.id, d.name)} style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  input: { background: "#ffffff", border: "1px solid #e5e7eb", color: "#121c2a", padding: 12, borderRadius: 8, fontSize: 14, fontFamily: "Inter, sans-serif", outline: "none" },
  btn: { background: "#0d9488", color: "#fff", border: "none", padding: 12, borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 14, fontFamily: "Inter, sans-serif" },
};