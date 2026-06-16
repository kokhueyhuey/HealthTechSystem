import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginResponse } from "../../services/api";

import Home                from "./Home";
import Inventory           from "./Inventory";
import Alerts              from "./Alerts";
import ManageAppointments  from "./ManageAppointments";
import ManageDoctor        from "./ManageDoctor";
import ManagePatients      from "./ManagePatients";
import PrescriptionManagement from "./PrescriptionManagement";

import "./PharmacistDashboard.css";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section =
  | "home" | "inventory" | "alerts" | "queue"
  | "appointments" | "doctors" | "patients" | "prescriptions";

export default function PharmacistDashboard({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const active: Section =
    location.pathname.includes("/inventory")     ? "inventory"
    : location.pathname.includes("/alerts")      ? "alerts"
    : location.pathname.includes("/queue")       ? "queue"
    : location.pathname.includes("/appointment")      ? "appointments"
    : location.pathname.includes("/doctors")     ? "doctors"
    : location.pathname.includes("/patients")    ? "patients"
    : location.pathname.includes("/prescriptions") ? "prescriptions"
    : "home";

  useEffect(() => {
    if (location.pathname === "/pharmacist") navigate("/pharmacist/home");
  }, [location.pathname, navigate]);

  function go(section: Section) { navigate(`/pharmacist/${section}`); }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="logoMark" style={{ background: "#f59e0b" }}>H</div>
          <span className="brandName">HealthTech</span>
        </div>

        <div className="userBadge">
          <div className="avatar" style={{ background: "#f59e0b" }}>
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div className="userName">{user.name}</div>
            <div className="userRole">Pharmacist</div>
          </div>
        </div>

        <nav className="nav">
          {([
            { id: "home",          label: "🏠 Overview" },
            { id: "appointments",  label: "📋 Manage Appointments" },
            { id: "patients",      label: "👤 Manage Patients" },
            { id: "doctors",       label: "👨‍⚕️ Manage Doctors" },
            { id: "prescriptions", label: "💊 Prescriptions" },
            { id: "inventory",     label: "📦 Inventory" },
            { id: "alerts",        label: "🚨 Alerts" },
            // { id: "queue",         label: "🔔 Queue" },
          ] as { id: Section; label: string }[]).map(item => (
            <button
              key={item.id}
              className={`navBtn ${active === item.id ? "active" : ""}`}
              onClick={() => go(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logoutBtn" onClick={onLogout}>Sign out</button>
      </aside>

      <main className="main">
        {active === "home"          && <Home />}
        {active === "appointments"  && <ManageAppointments user={user} />}
        {active === "doctors"       && <ManageDoctor />}
        {active === "patients"      && <ManagePatients />}
        {active === "prescriptions" && <PrescriptionManagement />}
        {active === "inventory"     && <Inventory />}
        {active === "alerts"        && <Alerts />}
      </main>
    </div>
  );
}