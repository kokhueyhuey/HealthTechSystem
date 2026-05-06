import { useEffect, useState } from "react";
import { getDoctors } from "../../services/doctorService";
import {
  getAffectedAppointments,
  cancelAppointment,
  rescheduleAppointment,
  type AffectedAppointment,
} from "../../services/appointmentService";

type Doctor = {
  id: number;
  name: string;
  specialization: string;
};

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];

export default function ManageAppointments() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");

  const [appointments, setAppointments] = useState<AffectedAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ Load doctors
  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch(err => console.error(err));
  }, []);

  // ✅ Search appointments
  async function handleSearch() {
    if (!doctorId) {
      setMsg("⚠️ Please select a doctor.");
      return;
    }

    setLoading(true);
    setMsg(null);

    try {
      const data = await getAffectedAppointments(Number(doctorId));
      setAppointments(data);

      if (data.length === 0) {
        setMsg("No appointments found for this doctor.");
      }
    } catch (e: any) {
      setMsg("⚠️ " + e.message);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Cancel
  async function handleCancel(id: number) {
    setActionLoading(true);
    setMsg(null);

    try {
      const result = await cancelAppointment(id, "Pharmacist");
      setMsg("✅ " + result);

      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (e: any) {
      setMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // ✅ Reschedule
  async function handleReschedule(id: number) {
    if (!newDate || !newTime) {
      setMsg("⚠️ Select new date & time.");
      return;
    }

    setActionLoading(true);
    setMsg(null);

    try {
      const iso = new Date(`${newDate}T${newTime}:00`).toISOString();

      const result = await rescheduleAppointment(id, iso, "Pharmacist");
      setMsg("✅ " + result);

      setRescheduleId(null);
      handleSearch(); // refresh
    } catch (e: any) {
      setMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <h2>Manage Appointments</h2>

      <p>
        Doctor informed pharmacist about unavailability. Select doctor and manage affected appointments.
      </p>

      {/* Doctor Dropdown */}
      <select value={doctorId} onChange={e => setDoctorId(e.target.value)}>
        <option value="">-- Select Doctor --</option>
        {doctors.map(d => (
          <option key={d.id} value={d.id}>
            {d.name} ({d.specialization})
          </option>
        ))}
      </select>

      <button onClick={handleSearch} disabled={loading}>
        {loading ? "Loading..." : "Load Appointments"}
      </button>

      {msg && <p>{msg}</p>}

      {/* Appointment List */}
      {appointments.map(a => (
        <div key={a.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
          <p><b>Appointment #{a.id}</b></p>
          <p>Patient: {a.patientName}</p>
          <p>Phone: {a.patientPhone}</p>
          <p>
            Date: {new Date(a.appointmentDate).toLocaleString("en-MY")}
          </p>

          <button onClick={() => handleCancel(a.id)} disabled={actionLoading}>
            Cancel
          </button>

          <button onClick={() => setRescheduleId(a.id)}>
            Reschedule
          </button>

          {/* Reschedule panel */}
          {rescheduleId === a.id && (
            <div style={{ marginTop: 10 }}>
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
              />

              <select value={newTime} onChange={e => setNewTime(e.target.value)}>
                <option value="">Time</option>
                {TIME_SLOTS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <button onClick={() => handleReschedule(a.id)}>
                Confirm
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}