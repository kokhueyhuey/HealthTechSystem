import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginResponse } from "../../services/api";

import Home from "./Home";
import Appointments from "./Appointments";
import Status from "./Status";
import Prescription from "./Prescription";
import Patients     from "./ViewPatientDetails";

import "./DoctorDashboard.css";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section = "home" | "appointments" | "status" | "prescription" | "patients";

export default function DoctorDashboard({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const active: Section =
    location.pathname.includes("/appointments")
      ? "appointments"
      : location.pathname.includes("/status")
      ? "status"
      : location.pathname.includes("/prescription")
      ? "prescription"
      : location.pathname.includes("/patients")     
      ? "patients"

      : "home";

  useEffect(() => {
    if (location.pathname === "/doctor") {
      navigate("/doctor/home");
    }
  }, [location.pathname, navigate]);

  function go(section: Section) {
    navigate(`/doctor/${section}`);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="logoMark logoGreen">H</div>
          <span className="brandName">HealthTech</span>
        </div>

        <div className="userBadge">
          <div className="avatar avatarGreen">
            {user.name[0].toUpperCase()}
          </div>
          <div>
            <div className="userName">{user.name}</div>
            <div className="userRole">Doctor</div>
          </div>
        </div>

        <nav className="nav">
          {[
            { id: "home", label: "🏠 Overview" },
            { id: "appointments", label: "📋 Today's Appointments" },
            { id: "status", label: "✏️ Update Status" },
            { id: "prescription", label: "💊 Prescription" },
            { id: "patients",     label: "👤 Patient Records" },

          ].map((item) => (
            <button
              key={item.id}
              className={`navBtn ${active === item.id ? "active" : ""}`}
              onClick={() => go(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logoutBtn" onClick={onLogout}>
          Sign out
        </button>
      </aside>

      <main className="main">
        {active === "home" && <Home name={user.name} />}
        {active === "appointments" && <Appointments user={user} />}
        {active === "status" && <Status user={user} />}
        {active === "prescription" && <Prescription />}
        {active === "patients"     && <Patients />}
      </main>
    </div>
  );
}