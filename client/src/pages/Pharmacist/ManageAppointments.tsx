// Manage Appointments — Pharmacist
//
// Three sections:
//
//   A. Walk-in Appointment
//      Search existing patient by name/IC → pick doctor → add to queue (InQueue)
//      If patient doesn't exist → link to Manage Patients to create account first
//
//   B. Search Appointments
//      Search by patient name OR appointment ID
//      View result → cancel / reschedule / enter queue
//
//   C. Doctor Unavailability
//      Select doctor → load affected pending appointments
//      Cancel / reschedule / enter queue per appointment
//      SignalR auto-refreshes when that doctor's appointments change
//
// Observer Pattern fires on every action (cancel/reschedule/walkin):
//   NotifyObservers() → PatientObserver + DoctorObserver +
//                       PharmacistObserver + SignalRObserver (live push)

import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import type { LoginResponse } from "../../services/api";
import { getDoctors, parseHour } from "../../services/doctorService";
import {
  cancelAppointment,
  createWalkIn,
  searchAppointments,
  rescheduleAppointment,
  getAllAffectedAppointments,
  type AppointmentSearchResult,
  generateTimeSlots,
  getBookedSlots,
  getUnavailableSlots,
} from "../../services/appointmentService";
import { enqueuePatient } from "../../services/queueService";
import { searchPatients, type PatientRecord } from "../../services/patientService";
import type { Doctor } from "../../types/types";

import "./ManageAppointments.css";

// type Doctor = { id: number; name: string; specialization: string; workStartTime: string; workEndTime: string; };

function fmtDateOnly(str: string) {
  return new Date(str).toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function fmtTimeOnly(str: string) {
  return new Date(str).toLocaleTimeString("en-MY", { timeStyle: "short" });
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

export default function ManageAppointments({ user }: { user: LoginResponse }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  useEffect(() => { getDoctors().then(setDoctors).catch(console.error); }, []);

  const [activeTab, setActiveTab]             = useState<"all" | "affected">("all");
  const [affectedResults, setAffectedResults] = useState<(AppointmentSearchResult & { unavailabilityReason: string })[]>([]);
  const [loadingAffected, setLoadingAffected] = useState(false);

  const loadAffectedAppointments = async () => {
    try {
      setLoadingAffected(true);

      const data = await getAllAffectedAppointments();

      setAffectedResults(data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAffected(false);
    }
  };

  useEffect(() => {
    loadAffectedAppointments();
  }, []);

  // TABLE SEARCH STATE 
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [searchResults, setSearchResults] = useState<AppointmentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [enqueuingId, setEnqueuingId] = useState<number | null>(null);

  useEffect(() => { handleApptSearch(); }, []);

  useEffect(() => {

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5165/appointmentHub")
      .withAutomaticReconnect()
      .build();

    connection.on(
      "ReceiveAppointmentUpdate",
      async (payload) => {

        console.log("SignalR update:", payload);

        // refresh badge
        await loadAffectedAppointments();

        // refresh appointment table
        await handleApptSearch();
      }
    );

    connection.start()
      .then(() => console.log("SignalR Connected"))
      .catch(console.error);

    return () => {
      connection.stop();
    };

  }, []);

  async function handleApptSearch() {
    setSearching(true);
    try {
      const results = await searchAppointments(searchQuery.trim(), searchDate);
      setSearchResults(results);
    } catch (e: any) { console.error(e); }
    finally { setSearching(false); }
  }

  async function handleEnqueue(appt: AppointmentSearchResult) {
    setEnqueuingId(appt.id);
    try {
      await enqueuePatient(user.token, appt.id, appt.patientId, appt.patientName);
      alert(`✅ ${appt.patientName} added to queue!`);
      handleApptSearch();
    } catch (e: any) {
      alert("⚠️ " + (e.message || "Failed to add to queue."));
    } finally {
      setEnqueuingId(null);
    }
  }

  // CANCEL MODAL STATE 
  const [apptToCancel, setApptToCancel] = useState<AppointmentSearchResult | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  async function confirmCancel() {
    if (!apptToCancel) return;
    setActionLoading(true);
    try {
      await cancelAppointment(apptToCancel.id, "Pharmacist");
      handleApptSearch();
      setApptToCancel(null);
    } catch (e: any) { alert("⚠️ " + e.message); } 
    finally { setActionLoading(false); }
  }

  // RESCHEDULE MODAL STATE 
  const [apptToReschedule, setApptToReschedule] = useState<AppointmentSearchResult | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);

  // When apptToReschedule changes (modal opens), load doctor's slots
  useEffect(() => {
    if (!apptToReschedule || !newDate) { 
      setRescheduleSlots([]); 
      return; 
    }
    
    const doctor = doctors.find(d => d.id === apptToReschedule.doctorId);
    if (!doctor) return;

    const allSlots = generateTimeSlots(parseHour(doctor.workStartTime), parseHour(doctor.workEndTime));

    // Define an async function inside the useEffect
    const fetchAvailableSlots = async () => {
      try {
        const [bookedSlots, unavailableSlots] = await Promise.all([
          getBookedSlots(apptToReschedule.doctorId, newDate),
          getUnavailableSlots(apptToReschedule.doctorId, newDate),
        ]);
        
        // Combine both lists into a Set for fast checking
        const blocked = new Set([...bookedSlots, ...unavailableSlots]);
        
        // We don't want to block the appointment's own current slot
        const currentSlot = fmtTimeOnly(apptToReschedule.appointmentDate); 

        // Filter: Keep it if it's NOT blocked, OR if it's their current slot
        setRescheduleSlots(allSlots.filter(s => !blocked.has(s) || s === currentSlot));
        setNewTime("");

      } catch (error) {
        console.error("Failed to fetch slots:", error);
      }
    };

    // Call the async function
    fetchAvailableSlots();

  }, [apptToReschedule, newDate, doctors]);

  async function confirmReschedule() {
    if (!apptToReschedule || !newDate || !newTime) {
      alert("⚠️ Select a new date and time."); return;
    }
    setActionLoading(true);
    try {
      await rescheduleAppointment(apptToReschedule.id, `${newDate}T${newTime}:00`, "Pharmacist");
      alert("✅ Appointment rescheduled.");
      handleApptSearch();
      setApptToReschedule(null);
      setNewDate(""); setNewTime("");
    } catch (e: any) { alert("⚠️ " + e.message); } 
    finally { setActionLoading(false); }
  }

  // WALK-IN MODAL STATE (New Appointment) 
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [walkQuery, setWalkQuery] = useState("");
  const [walkResults, setWalkResults] = useState<PatientRecord[]>([]);
  const [walkPatient, setWalkPatient] = useState<PatientRecord | null>(null);
  const [walkDoctorId, setWalkDoctorId] = useState<number>(0);
  const [walkNotes, setWalkNotes] = useState("");

  useEffect(() => {
    if (doctors.length > 0 && walkDoctorId === 0) setWalkDoctorId(doctors[0].id);
  }, [doctors]);

  async function handleWalkSearch() {
    if (!walkQuery.trim()) return;
    try {
      const results = await searchPatients(walkQuery.trim());
      setWalkResults(results);
    } catch (e: any) { console.error(e); }
  }

  async function handleWalkInSubmit() {
    if (!walkPatient) return;
    try {
      const result = await createWalkIn(walkPatient.id, walkDoctorId, walkNotes);
      await enqueuePatient(user.token, result.appointmentId, walkPatient.id, walkPatient.name);
      
      alert(`✅ Walk-in created and added to Queue for ${walkPatient.name}`);
      
      setShowWalkInModal(false);
      setWalkPatient(null); setWalkQuery(""); setWalkResults([]); setWalkNotes("");
      handleApptSearch();
    } catch (e: any) { alert("⚠️ " + e.message); }
  }

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-header">
        <h2 className="dashboard-title">Appointments</h2>
      </div>
      
      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}>All Appointments</button>
        <button className={`tab-btn ${activeTab === "affected" ? "active" : ""}`}
          onClick={() => setActiveTab("affected")}>
          Affected Appointments
          {affectedResults.length > 0 && <span className="tab-badge">{affectedResults.length}</span>}
        </button>
      </div>

      <div className="filter-bar">
        <input 
          className="filter-input search-text" 
          placeholder="🔍 Search Appt ID, Patient or Doctor..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleApptSearch()}
        />
        
        <input 
          type="date" 
          className="filter-input search-date" 
          value={searchDate}
          onChange={e => setSearchDate(e.target.value)}
        />

        <button className="search-btn" onClick={handleApptSearch}>
          Search
        </button>

        <button className="new-appt-btn" onClick={() => setShowWalkInModal(true)}>
          + New appointment
        </button>
      </div>

      <div className="table-container">
        <table className="appointment-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Appt ID</th>
              <th>Patient</th>
              <th>Phone Number</th>
              <th>Doctor Assigned</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {searchResults.length === 0 ? (
              <tr><td colSpan={8} className="empty-table-state">{searching ? "Loading..." : "No appointments found"}</td></tr>
            ) : (
              searchResults.map(a => (
                <tr key={a.id}>
                  <td>{fmtDateOnly(a.appointmentDate)}</td>
                  <td className="time-col">{fmtTimeOnly(a.appointmentDate)}</td>
                  <td className="appt-id">#{a.id}</td>
                  <td className="patient-name">{a.patientName}</td>
                  <td>{a.patientPhone}</td>
                  <td>{a.doctorName}</td>
                  <td>
                    <span className={`status-badge status-${a.status}`}>
                      {a.status === "InConsultation" ? "In Consult" : a.status}
                    </span>
                  </td>
                  
                  <td className="actions-cell">
                    {a.status == "Pending"  && (
                      <>
                        <button className="action-btn" onClick={() => setApptToReschedule(a)}>
                          Reschedule
                        </button>
                        <button className="action-btn danger" onClick={() => setApptToCancel(a)}>
                          Cancel
                        </button>
                        <button className="action-btn primary" 
                          disabled={enqueuingId === a.id}
                          onClick={() => handleEnqueue(a)}>
                          {enqueuingId === a.id ? "Adding..." : "Enter Queue"}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeTab === "affected" && (
        <div className="table-container">
          <table className="appointment-table">
            <thead>
              <tr>
                <th>Date</th><th>Time</th><th>Appt ID</th><th>Patient</th>
                <th>Phone</th><th>Doctor</th><th>Reason</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingAffected ? (
                <tr><td colSpan={9} className="empty-table-state">Loading...</td></tr>
              ) : affectedResults.length === 0 ? (
                <tr><td colSpan={9} className="empty-table-state">No affected appointments.</td></tr>
              ) : affectedResults.map(a => (
                <tr key={a.id} className="affected-row">
                  <td>{fmtDateOnly(a.appointmentDate)}</td>
                  <td className="time-col">{fmtTimeOnly(a.appointmentDate)}</td>
                  <td className="appt-id">#{a.id}</td>
                  <td className="patient-name">{a.patientName}</td>
                  <td>{a.patientPhone}</td>
                  <td>{a.doctorName}</td>
                  <td className="reason-col">{a.unavailabilityReason || "—"}</td>
                  <td><span className={`status-badge status-${a.status}`}>{a.status}</span></td>
                  <td className="actions-cell">
                    <button className="action-btn" onClick={() => setApptToReschedule(a)}>Reschedule</button>
                    <button className="action-btn danger" onClick={() => setApptToCancel(a)}>Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {apptToCancel && (
        <div className="modal-overlay">
          <div className="standard-modal">
            <h3 className="modal-title">Cancel appointment</h3>
            <p className="modal-desc">
              Are you sure you want to cancel <strong>{apptToCancel.patientName}'s</strong> appointment <br/>
              on <strong>{fmtDateOnly(apptToCancel.appointmentDate)}</strong> at <strong>{fmtTimeOnly(apptToCancel.appointmentDate)}</strong>?
            </p>
            <div className="modal-actions">
              <button className="dismiss-btn" disabled={actionLoading} onClick={() => setApptToCancel(null)}>Dismiss</button>
              <button className="confirm-btn danger" disabled={actionLoading} onClick={confirmCancel}>
                {actionLoading ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {apptToReschedule && (
        <div className="modal-overlay">
          <div className="standard-modal">
            <h3 className="modal-title">Reschedule Appointment</h3>
            <p className="modal-desc">Select a new date and time for <strong>{apptToReschedule.patientName}</strong>.</p>
            
            <div className="reschedule-inputs">
              <input type="date" className="filter-input flex-input" min={todayLocal()}
                value={newDate} onChange={e => setNewDate(e.target.value)} />
              <select className="filter-input" value={newTime} onChange={e => setNewTime(e.target.value)}>
                <option value="">-- time --</option>
                {rescheduleSlots.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="modal-actions">
              <button className="dismiss-btn" disabled={actionLoading} onClick={() => setApptToReschedule(null)}>Dismiss</button>
              <button className="confirm-btn" disabled={actionLoading} onClick={confirmReschedule}>
                {actionLoading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWalkInModal && (
        <div className="modal-overlay">
          <div className="standard-modal walkin-modal">
            <h3 className="modal-title">Create Walk-in Appointment</h3>
            
            {!walkPatient ? (
              <>
                <div className="walkin-search-row">
                  <input className="filter-input search-text" placeholder="Search Patient Name or IC" 
                    value={walkQuery} onChange={e => setWalkQuery(e.target.value)} />
                  <button className="confirm-btn fixed-btn" onClick={handleWalkSearch}>Search</button>
                </div>
                
                {walkResults.map(p => (
                  <div key={p.id} className="walkin-patient-row">
                    <div>
                      <strong>{p.name}</strong> <br/>
                      <span className="patient-ic">{p.icNumber}</span>
                    </div>
                    <button className="action-btn primary" onClick={() => setWalkPatient(p)}>Select</button>
                  </div>
                ))}
              </>
            ) : (
              <div className="walkin-form">
                <div className="selected-patient-box">
                  <strong>Selected Patient:</strong> {walkPatient.name}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Assign Doctor</label>
                  <select className="filter-input" value={walkDoctorId} onChange={e => setWalkDoctorId(Number(e.target.value))}>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (optional)</label>
                  <input className="filter-input" value={walkNotes} onChange={e => setWalkNotes(e.target.value)} placeholder="e.g. Fever, body check..." />
                </div>

                <div className="modal-actions mt-10">
                  <button className="dismiss-btn" onClick={() => setWalkPatient(null)}>Back</button>
                  <button className="confirm-btn" onClick={handleWalkInSubmit}>Add to Queue</button>
                </div>
              </div>
            )}
            
            {!walkPatient && (
              <button className="dismiss-btn full-width mt-20" onClick={() => {
                setShowWalkInModal(false); setWalkPatient(null);
              }}>Close</button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}