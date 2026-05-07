import { useEffect, useState } from "react";
import type { LoginResponse } from "../../services/api";
import { bookAppointment } from "../../services/appointmentService";
import { getDoctors } from "../../services/doctorService";
import styles from "./BookAppointment.module.css";
 
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
      .catch((err) => console.error(err));
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
    <div className={styles.page}>
      <div className={styles.card}>
 
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>Book Appointment</h2>
          <p className={styles.subtitle}>Schedule a consultation with your preferred doctor</p>
        </div>
        <div className={styles.divider} />
 
        {/* Form */}
        <div className={styles.form}>
 
          {/* Alerts */}
          {success && (
            <div className={`${styles.alert} ${styles.alertSuccess}`}>
              <span className={styles.alertIcon}>✓</span>
              {success}
              <span className={styles.badge}>Confirmed</span>
            </div>
          )}
          {error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <span className={styles.alertIcon}>!</span>
              {error}
            </div>
          )}
 
          {/* Doctor */}
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Doctor</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={doctorId}
                onChange={(e) => setDoctorId(Number(e.target.value))}
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialization}
                  </option>
                ))}
              </select>
            </div>
          </div>
 
          {/* Date */}
          <div className={styles.field}>
            <label className={styles.label}>Date</label>
            <input
              type="date"
              className={styles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
 
          {/* Time */}
          <div className={styles.field}>
            <label className={styles.label}>Time</label>
            <div className={styles.selectWrapper}>
              <select
                className={styles.select}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                <option value="">Select a slot</option>
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
 
          {/* Notes */}
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label className={styles.label}>Notes</label>
            <textarea
              className={styles.textarea}
              placeholder="Describe your symptoms or reason for visit…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
 
          {/* Submit */}
          <div className={styles.actions}>
            <button className={styles.btn} onClick={handleBook} disabled={loading}>
              <span className={styles.btnInner}>
                {loading && <span className={styles.spinner} />}
                {loading ? "Booking…" : "Book Appointment"}
              </span>
            </button>
          </div>
 
        </div>
      </div>
    </div>
  );
}