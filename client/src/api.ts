import axios from "axios";
import type { CreatePatientRequest, Patient } from "./types";

const API_URL = "http://localhost:5165/api/patients";

export const getPatients = () => axios.get<Patient[]>(API_URL);

export const createPatient = (data: CreatePatientRequest) =>
  axios.post(API_URL, data);