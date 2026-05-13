import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getDoctors } from "../../services/doctorService";
import {
  getAffectedAppointments,
  cancelAppointment,
  rescheduleAppointment,
  type AffectedAppointment,
} from "../../services/appointmentService";

import { enqueuePatient } from "../../services/queueService";

type Doctor = {
  id: number;
  name: string;
  specialization: string;
};

const TIME_SLOTS = ["09:00","10:00","11:00","14:00","15:00","16:00","17:00","18:00","19:00",];

export default function ManageAppointments({
  user,
}: {
  user: LoginResponse;
}) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorId, setDoctorId] = useState<string>("");

  const [appointments, setAppointments] = useState<AffectedAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [rescheduleId, setRescheduleId] = useState<number | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const [enqueuingId, setEnqueuingId] = useState<number | null>(null);

  useEffect(() => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl("http://localhost:5165/appointmentHub")
    .withAutomaticReconnect()
    .build();

  connection.on(
    "ReceiveAppointmentUpdate",
    () => {

      if (doctorId) {
        handleSearch();
      }
    }
  );

  connection.start().catch(err =>
    console.warn("SignalR connection failed:", err)
  );

  return () => {
    connection.stop();
  };
}, [doctorId]);

  // LOCAL TODAY (Malaysia timezone safe)
  const today = new Date();

  const localToday =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  // Load doctors
  useEffect(() => {
    getDoctors()
      .then(setDoctors)
      .catch((err) => console.error(err));
  }, []);

  //Search appointments
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

  // Cancel
  async function handleCancel(id: number) {
    setActionLoading(true);
    setMsg(null);

    try {
      const result = await cancelAppointment(id, "Pharmacist");

      setMsg("✅ " + result);

      setAppointments((prev) => prev.filter((a) => a.id !== id));
    } catch (e: any) {
      setMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Reschedule
  async function handleReschedule(id: number) {
    if (!newDate || !newTime) {
      setMsg("⚠️ Select new date & time.");
      return;
    }

    setActionLoading(true);
    setMsg(null);

    try {
      // DO NOT USE toISOString()
      const localDateTime = `${newDate}T${newTime}:00`;

      const result = await rescheduleAppointment(
        id,
        localDateTime,
        "Pharmacist"
      );

      setMsg("✅ " + result);

      setRescheduleId(null);

      setNewDate("");
      setNewTime("");

      handleSearch();
    } catch (e: any) {
      setMsg("⚠️ " + e.message);
    } finally {
      setActionLoading(false);
    }
  }

  // Add to Queue
  async function handleEnqueue(appt: AffectedAppointment) {
    setEnqueuingId(appt.id);
    setMsg(null);

    try {
      const entry = await enqueuePatient(
        user.token,
        appt.id,
        appt.patientId,
        appt.patientName
      );

      setMsg(
        `✅ ${appt.patientName} added to Queue — Ticket #${entry.ticketNumber}`
      );
    } catch (e: any) {
      setMsg("⚠️ " + (e.message || "Failed to enqueue patient"));
    } finally {
      setEnqueuingId(null);
    }
  }

  return (
    <div>
      <h2>Manage Appointments</h2>

      <p>
        Doctor informed pharmacist about unavailability. Select doctor and
        manage affected appointments.
      </p>

      {/* Doctor Dropdown */}
      <select
        value={doctorId}
        onChange={(e) => setDoctorId(e.target.value)}
      >
        <option value="">-- Select Doctor --</option>

        {doctors.map((d) => (
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
      {appointments.map((a) => (
        <div
          key={a.id}
          style={{
            border: "1px solid #ccc",
            padding: 10,
            marginTop: 10,
          }}
        >
          <p>
            <b>Appointment #{a.id}</b>
          </p>

          <p>Patient: {a.patientName}</p>

          <p>Phone: {a.patientPhone}</p>

          <p>
            Date:
            {" "}
            {new Date(a.appointmentDate).toLocaleString("en-MY", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>

          <button
            onClick={() => handleCancel(a.id)}
            disabled={actionLoading || enqueuingId !== null}
          >
            Cancel
          </button>

          <button
            onClick={() => setRescheduleId(a.id)}
            disabled={actionLoading || enqueuingId !== null}
            style={{ marginLeft: "5px" }}
          >
            Reschedule
          </button>

          <button
            onClick={() => handleEnqueue(a)}
            disabled={actionLoading || enqueuingId === a.id}
            style={{
              marginLeft: "5px",
              backgroundColor: "#34d399",
              color: "black",
            }}
          >
            {enqueuingId === a.id ? "Adding..." : "Enter Queue"}
          </button>

          {/* Reschedule Panel */}
          {rescheduleId === a.id && (
            <div style={{ marginTop: 10 }}>
              <input
                type="date"
                min={localToday}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />

              <select
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              >
                <option value="">Time</option>

                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <button onClick={() => handleReschedule(a.id)}>
                {actionLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}