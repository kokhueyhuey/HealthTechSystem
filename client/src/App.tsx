import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage/Loginpage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";

import PatientDashboard from "./pages/Patient/PatientDashboard";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import PharmacistDashboard from "./pages/Pharmacist/PharmacistDashboard";

import { saveSession, getSession, clearSession } from "./services/api";
import type { LoginResponse } from "./services/api";

import connection from "./services/signalR";

/* App */

export default function App() {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");

  const navigate = useNavigate();

  /* Load session */
  useEffect(() => {
    const saved = getSession();
    if (saved) setUser(saved);
  }, []);

  /*  SignalR */
  const refreshPatients = useCallback(() => {
    // kept for future expansion (doctor/pharmacist features)
    console.log("SignalR refresh triggered");
  }, []);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const start = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
        }

        connection.on("ReceivePatientUpdate", () => {
          if (active) refreshPatients();
        });

      } catch (err) {
        console.error("SignalR error:", err);
      }
    };

    start();

    return () => {
      active = false;
      connection.off("ReceivePatientUpdate");
      if (connection.state === "Connected") connection.stop();
    };
  }, [user, refreshPatients]);

  /* Login */
  function handleLoginSuccess(loggedInUser: LoginResponse) {
    saveSession(loggedInUser);
    setUser(loggedInUser);

    // role-based routing
    if (loggedInUser.role === "Patient") {
      navigate("/patient/home");
    } else if (loggedInUser.role === "Doctor") {
      navigate("/doctor/home");
    } else if (loggedInUser.role === "Pharmacist") {
      navigate("/pharmacist/home");
    }
  }

  /* Logout */
  function handleLogout() {
    clearSession();
    setUser(null);
    setAuthScreen("login");
    navigate("/login");
  }

  /* AUTH (NOT LOGGED IN) */
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

  /* ROUTES (LOGGED IN) */
  return (
    <Routes>

      {/* ROOT REDIRECT FIX */}
      <Route
        path="/"
        element={
          <Navigate
            to={
              user.role === "Patient"
                ? "/patient/home"
                : user.role === "Doctor"
                ? "/doctor/home"
                : "/pharmacist/home"
            }
            replace
          />
        }
      />

      {/* AUTH SAFETY ROUTES */}
      <Route path="/login" element={<Navigate to="/" />} />
      <Route path="/register" element={<Navigate to="/" />} />

      {/* PATIENT */}
      <Route
        path="/patient/*"
        element={
          user.role === "Patient" ? (
            <PatientDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* DOCTOR */}
      <Route
        path="/doctor/*"
        element={
          user.role === "Doctor" ? (
            <DoctorDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* PHARMACIST */}
      <Route
        path="/pharmacist/*"
        element={
          user.role === "Pharmacist" ? (
            <PharmacistDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/" />
          )
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" />} />

    </Routes>
  );
}