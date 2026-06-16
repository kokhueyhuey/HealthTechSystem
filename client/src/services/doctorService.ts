import type { Doctor } from "../types/types";

const BASE_URL = "http://localhost:5165/api/doctors";

export async function getDoctors(): Promise<Doctor[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed to fetch doctors");
  return res.json();
}

export async function getDoctorById(id: number): Promise<Doctor> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Doctor not found");
  return res.json();
}

export function parseHour(timeSpan: string): number {
  return parseInt(timeSpan.split(":")[0], 10);
}