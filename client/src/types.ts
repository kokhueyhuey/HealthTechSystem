export interface BaseUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  role: "Patient" | "Doctor" | "Pharmacist";
  createdAt: string; // ISO date string from the API
}

export interface Patient extends BaseUser {
  role: "Patient";
  age: number;
  icNumber: string;
  allergies: string;
  bloodType: string;
}

export interface Doctor extends BaseUser {
  role: "Doctor";
  specialization: string;
  licenseNumber: string;
  workSchedule: string;
  consultationFee: number;
}

export interface Pharmacist extends BaseUser {
  role: "Pharmacist";
  pharmacistLicenseNumber: string;
  staffId: string;
  shiftSchedule: string;
  canApproveInventory: boolean;
}

export type AnyUser = Patient | Doctor | Pharmacist;

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: "Patient" | "Doctor" | "Pharmacist";
}

export interface CreatePatientRequest {
  name: string;
  age: number;
}