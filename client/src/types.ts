export interface Patient {
  id: number;
  name: string;
  age: number;
}

export interface CreatePatientRequest {
  name: string;
  age: number;
}