import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginResponse } from "../../services/api";

import Home from "./Home";
import BookAppointment from "./BookAppointment";
import MyAppointments from "./MyAppointments";
import QueueStatus from "./QueueStatus";
import Prescriptions from "./Prescriptions";

import "./PatientDashboard.css";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section = "home" | "book" | "myappointments" | "queue" | "prescriptions";

export default function PatientDashboard({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const active: Section =
    location.pathname.includes("/book")
      ? "book"
      : location.pathname.includes("/myappointments")
      ? "myappointments"
      : location.pathname.includes("/queue")
      ? "queue"
      : location.pathname.includes("/prescriptions")
      ? "prescriptions"
      : "home";

  useEffect(() => {
    if (location.pathname === "/patient") navigate("/patient/home");
  }, [location.pathname, navigate]);

  function go(section: Section) {
    navigate(`/patient/${section}`);
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebarBrand">
          <div className="logoMark blue">H</div>
          <span className="brandName">HealthTech</span>
        </div>

        <div className="userBadge">
          <div className="avatar blue">{user.name[0].toUpperCase()}</div>
          <div>
            <div className="userName">{user.name}</div>
            <div className="userRole blueText">Patient</div>
          </div>
        </div>

        <nav className="nav">
          {[
            { id: "home",           label: "🏠 Overview" },
            { id: "book",           label: "📅 Book Appointment" },
            { id: "myappointments", label: "🗂️ My Appointments" },
            { id: "queue",          label: "🔢 Queue Status" },
            { id: "prescriptions",  label: "💊 Prescriptions" },
          ].map(item => (
            <button
              key={item.id}
              className={`navBtn ${active === item.id ? "activeBlue" : ""}`}
              onClick={() => go(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logoutBtn" onClick={onLogout}>Sign out</button>
      </aside>

      <main className="main">
        {active === "home"           && <Home name={user.name} />}
        {active === "book"           && <BookAppointment user={user} />}
        {active === "myappointments" && <MyAppointments user={user} />}
        {active === "queue"          && <QueueStatus user={user} />}
        {active === "prescriptions"  && <Prescriptions />}
      </main>
    </div>
  );
}