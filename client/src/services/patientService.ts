import type { Patient, CreatePatientRequest } from "../types/types";

const PATIENTS_URL = "http://localhost:5165/api/patients";

export async function getPatients(): Promise<Patient[]> {
  const res = await fetch(PATIENTS_URL);
  if (!res.ok) throw new Error("Failed to load patients");
  return res.json();
}

export async function createPatient(body: CreatePatientRequest): Promise<void> {
  await fetch(PATIENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}