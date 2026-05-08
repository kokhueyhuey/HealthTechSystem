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
  token: string;
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



export interface Medicine {
  id: number;
  name: string;
  description: string;
  photo: string;
  quantity: number;
  threshold: number;
  expiryDate: string;
  status: string;
}

export interface MedicineRequest {
  name: string;
  description: string;
  photo: string;
  quantity: number;
  threshold: number;
  expiryDate: string;
}

export async function getMedicines(): Promise<Medicine[]> {
  const response = await fetch(`${BASE_URL}/Medicines`);

  if (!response.ok) {
    throw new Error("Failed to fetch medicines");
  }

  return response.json();
}

export async function addMedicine(
  medicine: MedicineRequest
): Promise<Medicine> {
  const response = await fetch(`${BASE_URL}/Medicines`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medicine),
  });

  if (!response.ok) {
    throw new Error("Failed to add medicine");
  }

  return response.json();
}

export async function updateMedicine(
  id: number,
  medicine: MedicineRequest
): Promise<Medicine> {
  const response = await fetch(`${BASE_URL}/Medicines/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(medicine),
  });

  if (!response.ok) {
    throw new Error("Failed to update medicine");
  }

  return response.json();
}

export async function deleteMedicine(id: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/Medicines/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete medicine");
  }
}
