import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage/Loginpage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";

import PatientDashboard from "./pages/Patient/PatientDashboard";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import PharmacistDashboard from "./pages/Pharmacist/PharmacistDashboard";

import {
  saveSession,
  getSession,
  clearSession,
} from "./services/api";

import type { LoginResponse } from "./services/api";
import connection from "./services/signalR";

type AuthScreen = "login" | "register";

export default function App() {
  const [user, setUser] = useState<LoginResponse | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");

  useEffect(() => {
    const saved = getSession();
    if (saved) setUser(saved);
  }, []);

  useEffect(() => {
    if (!user) return;

    const start = async () => {
      try {
        if (connection.state === "Disconnected") {
          await connection.start();
        }
      } catch (err) {
        console.error(err);
      }
    };

    start();

    return () => {
      connection.stop().catch(() => {});
    };
  }, [user]);

  function handleLoginSuccess(u: LoginResponse) {
    saveSession(u);
    setUser(u);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setAuthScreen("login");
  }

  return (
    <BrowserRouter>
      <Routes>

        {/* AUTH */}
        <Route
          path="/"
          element={
            !user ? (
              authScreen === "login" ? (
                <LoginPage
                  onLoginSuccess={handleLoginSuccess}
                  onGoRegister={() => setAuthScreen("register")}
                />
              ) : (
                <RegisterPage
                  onRegistered={() => setAuthScreen("login")}
                  onGoLogin={() => setAuthScreen("login")}
                />
              )
            ) : (
              <Navigate to={`/${user.role.toLowerCase()}/home`} />
            )
          }
        />

        {/* PATIENT */}
        <Route
          path="/patient/*"
          element={
            user?.role === "Patient" ? (
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
            user?.role === "Doctor" ? (
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
            user?.role === "Pharmacist" ? (
              <PharmacistDashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}