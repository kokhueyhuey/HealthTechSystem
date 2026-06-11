import type { RegisterRequest } from "./api";

const BASE_URL = "http://localhost:5165/api/User";
const PATIENT_URL = "http://localhost:5165/api/Patients";


export interface CreatePatientRequest extends RegisterRequest {
  icNumber: string;
  age: number;
}

export interface PatientRecord {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  icNumber: string;
  age: number;
  bloodType: string;
  allergies: string;
}

export async function createPatientAccount(
  payload: CreatePatientRequest
): Promise<{ message: string; id: number; role: string; name: string }> {
  const res = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      role: "Patient",
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to create patient.");
  }

  return data;
}

export async function searchPatients(query?: string): Promise<PatientRecord[]> {
  const url = query
    ? `${PATIENT_URL}?search=${encodeURIComponent(query)}`
    : PATIENT_URL;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to load patients.");
  }
  return res.json();
}
 
export interface PatientPrescriptionItem {
  id: number;
  medicineName: string;
  dosage: string;
  quantity: number;
  preference: string;
  usageInstruction: string;
}
 
export interface PatientPrescription {
  id: number;
  appointmentId: number;
  status: string;
  needMc: boolean;
  mcReason: string;
  mcDays: number;
  createdAt: string;
  items: PatientPrescriptionItem[];
}
 
export interface PatientDetails {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  icNumber: string;
  age: number;
  bloodType: string;
  allergies: string;

  prescriptions: PatientPrescription[];

  totalVisits: number;
  totalPrescriptions: number;
  lastVisit: string | null;
}
 
// GET /api/patients/{id}/details
export async function getPatientDetails(id: number): Promise<PatientDetails> {
  const res = await fetch(`http://localhost:5165/api/patients/${id}/details`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load patient details.");
  return data;
}