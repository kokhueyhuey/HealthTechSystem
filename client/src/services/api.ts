/*import axios from "axios";
import type { CreatePatientRequest, Patient } from "./types";

const API_URL = "http://localhost:5165/api/patients";

export const getPatients = () => axios.get<Patient[]>(API_URL);

export const createPatient = (data: CreatePatientRequest) =>
  axios.post(API_URL, data); */


const BASE_URL = "http://localhost:5165/api";

//Auth
export interface LoginResponse {
  id: number;
  name: string;
  role: "Patient" | "Doctor" | "Pharmacist";
  email: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "Patient" | "Doctor" | "Pharmacist";
}


// POST /api/user/login
// reads role to redirect to the right dashboard.
export async function loginUser(email: string, password: string, role: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/User/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Login failed.");
  return data;
}

// POST /api/user/register — calls Factory Method Pattern on the backend.
export async function registerUser(payload: RegisterRequest): Promise<{ message: string; role: string; name: string }> {
  const res = await fetch(`${BASE_URL}/User/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed.");
  return data;
}

// Swagger demo 
export async function getFactoryDemo() {
  const res = await fetch(`${BASE_URL}/User/demo`);
  return res.json();
}

// save logged-in user to localStorage so pages can read it.
export function saveSession(user: LoginResponse) {
  localStorage.setItem("healthtech_user", JSON.stringify(user));
}

// read logged-in user from localStorage.
export function getSession(): LoginResponse | null {
  const raw = localStorage.getItem("healthtech_user");
  return raw ? JSON.parse(raw) : null;
}

// clear session on logout.
export function clearSession() {
  localStorage.removeItem("healthtech_user");
}

