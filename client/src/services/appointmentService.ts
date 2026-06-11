const BASE_URL = "http://localhost:5165/api/appointments";

export type AppointmentStatus =
  | "Pending"
  | "InQueue"
  | "InConsultation"
  | "Completed"
  | "Cancelled";

export interface AppointmentSummary {
  id: number;
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  status: AppointmentStatus;
  notes: string;
}

export interface DoctorAppointmentSummary {
  id: number;
  patientId: number;
  patientName: string;
  appointmentDate: string;
  status: AppointmentStatus;
  notes: string;
}

export interface AffectedAppointment {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  status: AppointmentStatus;
}

export interface Appointment {
  id: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string; 
  status: AppointmentStatus;
}

/* ─────────────────────────────────────────────
   BOOK APPOINTMENT
   Observer Pattern fires in backend
───────────────────────────────────────────── */

export async function bookAppointment(
  patientId: number,
  doctorId: number,
  appointmentDate: string,
  notes?: string
): Promise<{ message: string; appointmentId: number; status: string }> {
  const res = await fetch(`${BASE_URL}/book`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientId,
      doctorId,
      appointmentDate,
      notes,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Booking failed.");

  return data;
}

/* ─────────────────────────────────────────────
   PATIENT VIEW APPOINTMENTS
───────────────────────────────────────────── */

export async function getPatientAppointments(
  patientId: number
): Promise<AppointmentSummary[]> {
  const res = await fetch(`${BASE_URL}/patient/${patientId}`);
  const data = await res.json();

  if (!res.ok) throw new Error("Failed to load appointments.");

  return Array.isArray(data) ? data : [];
}

/* ─────────────────────────────────────────────
   DOCTOR VIEW APPOINTMENTS
───────────────────────────────────────────── */

export async function getDoctorAppointments(
  doctorId: number,
  date?: string
): Promise<DoctorAppointmentSummary[]> {
  const url = date
    ? `${BASE_URL}/doctor/${doctorId}?date=${date}`
    : `${BASE_URL}/doctor/${doctorId}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) throw new Error("Failed to load doctor appointments.");

  return Array.isArray(data) ? data : [];
}

/* ─────────────────────────────────────────────
   CANCEL APPOINTMENT
   role = Patient → 2-hour restriction
   role = Pharmacist → no restriction
───────────────────────────────────────────── */

export async function cancelAppointment(
  id: number,
  role: "Patient" | "Pharmacist"
): Promise<string> {
  const res = await fetch(`${BASE_URL}/${id}/cancel`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Cancel failed.");

  return data.message;
}

/* ─────────────────────────────────────────────
   RESCHEDULE APPOINTMENT
───────────────────────────────────────────── */

export async function rescheduleAppointment(
  id: number,
  newDate: string,
  role: "Patient" | "Pharmacist"
): Promise<string> {
  const res = await fetch(`${BASE_URL}/${id}/reschedule`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newDate, role }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Reschedule failed.");

  return data.message;
}

/* ─────────────────────────────────────────────
   UPDATE STATUS (Doctor only)
───────────────────────────────────────────── */

export async function updateAppointmentStatus(
  id: number,
  doctorId: number,
  newStatus: AppointmentStatus
): Promise<string> {
  const res = await fetch(`${BASE_URL}/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ doctorId, newStatus }),
  });

  const data = await res.json();

  if (!res.ok) throw new Error(data.message || "Status update failed.");

  return data.message;
}

/* ─────────────────────────────────────────────
   PHARMACIST — AFFECTED APPOINTMENTS
   (your use case: doctor unavailable)
───────────────────────────────────────────── */

export async function getAffectedAppointments(
  doctorId: number
): Promise<AffectedAppointment[]> {
  const res = await fetch(`${BASE_URL}/affected/${doctorId}`);
  const data = await res.json();

  if (!res.ok) throw new Error("Failed to load affected appointments.");

  return Array.isArray(data) ? data : [];
}

/* ─────────────────────────────────────────────
   PHARMACIST — GET APPOINTMENTS BY DATE
   (Used for the Queue Check-In Calendar)
───────────────────────────────────────────── */

export async function getAppointmentsByDate(
  date: string,
  token: string
): Promise<Appointment[]> {
  const res = await fetch(`${BASE_URL}/by-date?date=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to load appointments for this date.");
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
// ─────────────────────────────────────────────────────────────────────────────
// ADD THESE to your existing appointmentService.ts
// ─────────────────────────────────────────────────────────────────────────────

// Add this interface alongside the others
export interface AppointmentSearchResult {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone: string; 
  doctorId: number;
  doctorName: string;
  appointmentDate: string;
  status: AppointmentStatus;
  notes: string;
}

// GET /api/appointments/search?q=...
// Search by patient name OR appointment ID
export async function searchAppointments(q?: string, date?: string) {
  const params = new URLSearchParams();
  if (q) params.append("q", q);
  if (date) params.append("date", date);

  const res = await fetch(`${BASE_URL}/search?${params.toString()}`);

  if (!res.ok) {
    throw new Error("Failed to search appointments.");
  }

  return res.json();
}

// POST /api/appointments/walkin
// Walk-in appointment — status goes straight to InQueue
// Observer fires "WalkIn" → all 4 observers including SignalR
export async function createWalkIn(
  patientId: number,
  doctorId: number,
  notes?: string
): Promise<{ message: string; appointmentId: number; status: string }> {
  const res = await fetch(`${BASE_URL}/walkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId, doctorId, notes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Walk-in booking failed.");
  return data;
}