import { useState } from "react";
import {
  createPatientAccount,
  type CreatePatientRequest,
} from "../../services/patientService";
import "./ManagePatients.css";

const emptyForm: CreatePatientRequest = {
  name: "",
  email: "",
  phoneNumber: "",
  role: "Patient",
  icNumber: "",
  age: 0,
};

export default function ManagePatients() {
  const [form, setForm] = useState<CreatePatientRequest>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

    if (form.icNumber.length < 4) {
      setActionMsg("⚠️ IC number must be at least 4 digits.");
      return;
    }

    setLoading(true);
    setActionMsg(null);

    try {
      const result = await createPatientAccount(form);

      const tempPwd = form.icNumber.slice(-4);

      setActionMsg(
        `✅ Patient created: ${result.name}. Temporary password: ${tempPwd}`
      );

      setForm(emptyForm);
    } catch (err: any) {
      setActionMsg("⚠️ " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pageCenter">
      <div className="cardBox">
        <h2 className="pageTitle">Manage Patients</h2>
        <p className="pageSub">Add new patient accounts</p>

        {actionMsg && (
          <div className="msgBox">{actionMsg}</div>
        )}

        {/* FORM */}
        <form onSubmit={handleCreate} className="formBox">
          <h3 className="formTitle">Add New Patient</h3>

          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            required
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          <input
            placeholder="Phone Number"
            value={form.phoneNumber}
            onChange={(e) =>
              setForm({ ...form, phoneNumber: e.target.value })
            }
            required
          />

          <input
            placeholder="IC Number"
            value={form.icNumber}
            onChange={(e) =>
              setForm({ ...form, icNumber: e.target.value })
            }
            required
          />

          <input
            type="number"
            placeholder="Age"
            value={form.age === 0 ? "" : form.age}
            onChange={(e) =>
              setForm({ ...form, age: Number(e.target.value) })
            }
            required
          />

          <button disabled={loading}>
            {loading ? "Creating..." : "Create Patient"}
          </button>
        </form>
      </div>
    </div>
  );
}