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
    <div>
      <h2 className="pageTitle">Manage Doctors</h2>
      <p className="pageSub">Add new doctors to the system or remove existing ones.</p>

      {actionMsg && (
        <div style={{ padding: 16, borderRadius: 8, marginBottom: 20, background: actionMsg.includes("✅") ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: actionMsg.includes("✅") ? "#34d399" : "#f87171" }}>
          {actionMsg}
        </div>
      )}

      {/* CREATE FORM */}
      <form onSubmit={handleCreate} style={{ background: "rgba(255,255,255,0.05)", padding: 24, borderRadius: 12, display: "flex", flexDirection: "column", gap: 12, maxWidth: 500, marginBottom: 30 }}>
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
      <div style={{ background: "rgba(255,255,255,0.05)", padding: 24, borderRadius: 12 }}>
        <h3>Current Doctors</h3>
        {doctors.length === 0 ? <p>No doctors found.</p> : (
          doctors.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <strong>{d.name}</strong> <span style={{ color: "#8892a4", fontSize: 12 }}>({d.specialization})</span>
                <div style={{ fontSize: 13, color: "#8892a4" }}>{d.email} | {d.phoneNumber}</div>
              </div>
              <button onClick={() => handleDelete(d.id, d.name)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer" }}>
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
  input: { background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: 12, borderRadius: 8 },
  btn: { background: "#3b82f6", color: "#fff", border: "none", padding: 12, borderRadius: 8, fontWeight: "bold", cursor: "pointer" }
};