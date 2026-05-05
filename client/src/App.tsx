import { useEffect, useState, useCallback } from "react";
import LoginPage           from "./pages/LoginPage/Loginpage";    
import RegisterPage        from "./pages/RegisterPage/RegisterPage";
import PatientDashboard    from "./pages/PatientDashboard/PatientDashboard";
import DoctorDashboard     from "./pages/DoctorDashboard";
import PharmacistDashboard from "./pages/PharmacistDashboard/PharmacistDashboard";

import {
  saveSession,
  getSession,
  clearSession,
} from "./services/api";
import type { LoginResponse } from "./services/api";

import connection from "./services/signalR";

import type { Patient, CreatePatientRequest } from "./types/types";

const PATIENTS_URL = "http://localhost:5165/api/patients";

async function getPatients(): Promise<{ data: Patient[] }> {
  const res = await fetch(PATIENTS_URL);
  if (!res.ok) throw new Error("Failed to load patients");
  const data: Patient[] = await res.json();
  return { data };
}

async function createPatient(body: CreatePatientRequest): Promise<void> {
  await fetch(PATIENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

type AuthScreen = "login" | "register";

export default function App() {
  const [user, setUser]             = useState<LoginResponse | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [patients, setPatients]     = useState<Patient[]>([]);

  useEffect(() => {
    const saved = getSession();
    if (saved) setUser(saved);
  }, []);

  const refreshPatients = useCallback(() => {
    getPatients()
      .then((res) => setPatients(res.data))
      .catch((err) => console.error("getPatients failed:", err));
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const start = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
          console.log("SignalR connected");
        }
        connection.on("ReceivePatientUpdate", () => {
          if (active) refreshPatients();
        });
        if (active) refreshPatients();
      } catch (err) {
        console.error("SignalR error:", err);
      }
    };

    start();

    return () => {
      active = false;
      connection.off("ReceivePatientUpdate");
      if (connection.state === "Connected") connection.stop().catch(console.error);
    };
  }, [user, refreshPatients]);

  function handleLoginSuccess(loggedInUser: LoginResponse) {
    saveSession(loggedInUser);
    setUser(loggedInUser);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setPatients([]);
    setAuthScreen("login");
  }

  async function handleAddPatient(name: string, age: number) {
    await createPatient({ name, age });
    refreshPatients();
  }

  
  if (!user) {
    if (authScreen === "register") {
      return (
        <RegisterPage
          onRegistered={() => setAuthScreen("login")}
          onGoLogin={() => setAuthScreen("login")}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoRegister={() => setAuthScreen("register")}
      />
    );
  }

  switch (user.role) {
    case "Patient":
      return (
        <PatientDashboard
          user={user}
          onLogout={handleLogout}
          patients={patients}
          onAddPatient={handleAddPatient}
        />
      );
    case "Doctor":
      return (
        <DoctorDashboard
          user={user}
          onLogout={handleLogout}
          patients={patients}
        />
      );
    case "Pharmacist":
      return (
        <PharmacistDashboard
          user={user}
          onLogout={handleLogout}
        />
      );
    default:
      return (
        <div style={errorStyles.wrap}>
          <h2 style={errorStyles.title}>Unknown role: "{user.role}"</h2>
          <p style={errorStyles.sub}>Please contact your administrator.</p>
          <button style={errorStyles.btn} onClick={handleLogout}>Back to login</button>
        </div>
      );
  }
}

const errorStyles: Record<string, React.CSSProperties> = {
  wrap:  { minHeight: "100vh", background: "#0f1117", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", gap: 12 },
  title: { color: "#f87171", fontSize: 22, fontWeight: 700, margin: 0 },
  sub:   { color: "#8892a4", fontSize: 14, margin: 0 },
  btn:   { marginTop: 8, background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171", borderRadius: 10, padding: "10px 24px", cursor: "pointer", fontSize: 14 },
};
