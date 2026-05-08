import { useEffect, useState } from "react";
import type { LoginResponse } from "../../services/api";
import { bookAppointment } from "../../services/appointmentService";
import { getDoctors } from "../../services/doctorService";

import "./BookAppointment.css";

type Doctor = {
  id: number;
  name: string;
  specialization: string;
};
 
const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
 
export default function BookAppointment({ user }: { user: LoginResponse }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<number>(0);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    getDoctors()
      .then((data) => {
        setDoctors(data);
        if (data.length > 0) setDoctorId(data[0].id);
      })
      .catch(console.error);
  }, []);
 
  async function handleBook() {
    if (!date || !time) {
      setError("Please select a date and time before booking.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const isoDate = new Date(`${date}T${time}:00`).toISOString();
      const result = await bookAppointment(user.id, doctorId, isoDate, notes);
      setSuccess(`Appointment #${result.appointmentId} confirmed`);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }
 
  return (
    <div className="formPage">
      <div className="formCard">
        <h2 className="pageTitle">Book Appointment</h2>
        <p className="pageSub">Select doctor, date and time slot</p>

        {success && <div className="successBox">{success}</div>}
        {error && <div className="errorBox">{error}</div>}

        <label>Doctor</label>
        <select
          className="select"
          value={doctorId}
          onChange={(e) => setDoctorId(Number(e.target.value))}
        >
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.specialization})
            </option>
          ))}
        </select>

        <label>Date</label>
        <input
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <label>Time</label>
        <select
          className="select"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        >
          <option value="">Select</option>
          {TIME_SLOTS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label>Notes</label>
        <input
          className="input"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button
          className="primaryBtn"
          onClick={handleBook}
          disabled={loading}
        >
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </div>
    </div>
  );
}