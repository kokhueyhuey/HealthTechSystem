import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LoginResponse } from "../../services/api";

import Home from "./Home";
import Inventory from "./Inventory";
import Alerts from "./Alerts";
import ManageAppointments from "./ManageAppointments";
import ManageDoctor from "./ManageDoctor";

import "./PharmacistDashboard.css";

interface Props {
  user: LoginResponse;
  onLogout: () => void;
}

type Section = "home" | "inventory" | "alerts" | "queue" | "manage" | "doctors";

export default function PharmacistDashboard({ user, onLogout }: Props) {
  const navigate = useNavigate();
  const location = useLocation();

  const active: Section =
    location.pathname.includes("/inventory") ? "inventory"
    : location.pathname.includes("/alerts")  ? "alerts"
    : location.pathname.includes("/queue")   ? "queue"
    : location.pathname.includes("/manage")  ? "manage"
    : location.pathname.includes("/doctors") ? "doctors"
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
          {[
            { id: "home",      label: "🏠 Overview" },
            { id: "doctors",   label: "👨‍⚕️ Manage Doctors" },
            { id: "manage",    label: "📋 Manage Appointments" },
            { id: "inventory", label: "📦 Inventory" },
            { id: "alerts",    label: "🚨 Alerts" },
            { id: "queue",     label: "🔔 Queue" },
          ].map(item => (
            <button
              key={item.id}
              className={`navBtn ${active === item.id ? "active" : ""}`}
              onClick={() => go(item.id as Section)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button className="logoutBtn" onClick={onLogout}>Sign out</button>
      </aside>

      <main className="main">
        {active === "home"      && <Home />}
        {active === "doctors"   && <ManageDoctor />}
        {active === "manage"    && <ManageAppointments user={user}/>}
        {active === "inventory" && <Inventory />}
        {active === "alerts"    && <Alerts />}
        {/* {active === "queue"     && <Queue user={user} />} */}
      </main>
    </div>
  );
}