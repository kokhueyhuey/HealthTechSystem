// ─────────────────────────────────────────────────────────────────────────────
// View Patient Details — Doctor page
//
// Flow:
//   1. Doctor types a patient name or IC in the search bar
//   2. Matching patients appear as cards
//   3. Click "View Details" → expands a full detail panel inline
//   4. Panel shows:
//        - Profile (name, IC, age, phone, blood type, allergies)
//        - Prescription history (medicines, dosage, MC info)
//
// CONCEPT — Modularity:
//   This page is read-only. It never modifies patient data.
//   All writes (appointments, prescriptions) stay in their own pages.
//
// CONCEPT — Abstraction:
//   getPatientDetails() returns a clean shaped DTO.
//   This component never touches raw DB models.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";
import { searchPatients, getPatientDetails, type PatientRecord, type PatientDetails } from "../../services/patientService";

import "./ViewPatientDetails.css";

const PRESC_STATUS_COLOR: Record<string, string> = {
  Pending:  "#fbbf24",
  Approved: "#34d399",
  Dispensed:"#60a5fa",
  Cancelled:"#f87171",
};

function fmtDateOnly(str: string) {
  const s = str.endsWith("Z") ? str.slice(0, -1) : str;
  return new Date(s).toLocaleDateString("en-MY", { dateStyle: "medium" });
}

export default function Patients() {
  const [query,          setQuery]          = useState("");
  const [results,        setResults]        = useState<PatientRecord[]>([]);
  const [searching,      setSearching]      = useState(false);
  const [searchMsg,      setSearchMsg]      = useState<string | null>(null);
  const [hasSearched,    setHasSearched]    = useState(false);

  const [expandedId,     setExpandedId]     = useState<number | null>(null);
  const [details,        setDetails]        = useState<Record<number, PatientDetails>>({});
  const [loadingDetail,  setLoadingDetail]  = useState<number | null>(null);
  const [detailError,    setDetailError]    = useState<Record<number, string>>({});

  // ── Search ──────────────────────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    if (!query.trim()) { setSearchMsg("Enter a patient name or IC number."); return; }
    setSearching(true); setSearchMsg(null); setHasSearched(true);
    try {
      const data = await searchPatients(query.trim());
      setResults(data);
      if (data.length === 0) setSearchMsg("No patients found matching your search.");
    } catch (e: any) {
      setSearchMsg("⚠️ " + e.message);
    } finally {
      setSearching(false);
    }
  }, [query]);

  // ── Load patient details ─────────────────────────────────────────────
  async function toggleDetails(patientId: number) {
    // Collapse if already open
    if (expandedId === patientId) { setExpandedId(null); return; }

    setExpandedId(patientId);

    // Already loaded — just show
    if (details[patientId]) return;

    setLoadingDetail(patientId);
    try {
      const data = await getPatientDetails(patientId);
      setDetails(prev => ({ ...prev, [patientId]: data }));
    } catch (e: any) {
      setDetailError(prev => ({ ...prev, [patientId]: e.message }));
    } finally {
      setLoadingDetail(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="pageTitle">Patient Records</h2>
      <p className="pageSub">
        Search patients by name or IC number to view their profile and prescriptions history.
      </p>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <div className="searchRow">
        <input
          className="searchInput"
          placeholder="Search by patient name or IC number…"
          value={query}
          onChange={e => { setQuery(e.target.value); setSearchMsg(null); }}
          onKeyDown={e => e.key === "Enter" && handleSearch()}
        />
        <button className="searchBtn" onClick={handleSearch} disabled={searching}>
          {searching ? "Searching…" : "Search"}
        </button>
      </div>

      {searchMsg && (
        <div className={searchMsg.startsWith("⚠️") ? "errorBox" : "infoBox"}>
          {searchMsg}
        </div>
      )}

      {/* ── Patient list ─────────────────────────────────────────── */}
      {!hasSearched && (
        <div className="emptyState">
          Use the search bar above to find a patient.
        </div>
      )}

      {results.map(patient => {
        const isExpanded = expandedId === patient.id;
        const detail     = details[patient.id];
        const isLoading  = loadingDetail === patient.id;
        const err        = detailError[patient.id];

        return (
          <div key={patient.id} className="patientCard">

            {/* ── Patient summary row ────────────────────────────── */}
            <div className="patientSummary">
              <div className="patientAvatar">
                {patient.name[0].toUpperCase()}
              </div>
              <div className="patientInfo">
                <div className="patientName">{patient.name}</div>
                <div className="patientMeta">
                  IC: {patient.icNumber || "—"}
                  &nbsp;·&nbsp; Age: {patient.age}
                  &nbsp;·&nbsp; {patient.phoneNumber}
                </div>
              </div>
              <button
                className={`detailBtn ${isExpanded ? "detailBtnActive" : ""}`}
                onClick={() => toggleDetails(patient.id)}
              >
                {isExpanded ? "Hide Details ▲" : "View Details ▼"}
              </button>
            </div>

            {/* ── Expanded detail panel ───────────────────────────── */}
            {isExpanded && (
              <div className="detailPanel">

                {isLoading && (
                  <div className="loadingRow">
                    <div className="spinner" />Loading patient data…
                  </div>
                )}

                {err && <div className="errorBox">⚠️ {err}</div>}

                {detail && (
                  <>
                    {/* ── Profile ──────────────────────────────────── */}
                    <div className="detailSection">
                      <h4 className="detailSectionTitle">👤 Profile</h4>
                      <div className="profileGrid">
                        <ProfileField label="Full Name"   value={detail.name} />
                        <ProfileField label="IC Number"   value={detail.icNumber || "—"} />
                        <ProfileField label="Age"         value={String(detail.age)} />
                        <ProfileField label="Phone"       value={detail.phoneNumber} />
                        <ProfileField label="Email"       value={detail.email} />
                        <ProfileField label="Blood Type"  value={detail.bloodType || "—"} />
                        <ProfileField label="Allergies"   value={detail.allergies || "None"} />
                      </div>

                      {/* Summary stats */}
                      <div className="statRow">
                        <div className="statBox">
                          <div className="statNum">{detail.totalVisits}</div>
                          <div className="statLabel">Total Visits</div>
                        </div>
                        <div className="statBox">
                          <div className="statNum">{detail.totalPrescriptions}</div>
                          <div className="statLabel">Prescriptions</div>
                        </div>
                        <div className="statBox">
                          <div className="statNum">
                            {detail.lastVisit ? fmtDateOnly(detail.lastVisit) : "—"}
                          </div>
                          <div className="statLabel">Last Visit</div>
                        </div>
                      </div>
                    </div>

                    {/* ── Prescription history ───────────────────────── */}
                    <div className="detailSection">
                      <h4 className="detailSectionTitle">💊 Prescription History</h4>

                      {detail.prescriptions.length === 0 ? (
                        <div className="emptyState">No prescriptions recorded yet.</div>
                      ) : (
                        detail.prescriptions.map((presc, idx) => (
                          <div key={presc.id} className="prescCard">
                            {/* Prescription header */}
                            <div className="prescHeader">
                              <div>
                                <div className="prescTitle">
                                  Prescription {detail.prescriptions.length - idx}
                                  <span className="prescId"> #{presc.id}</span>
                                </div>
                                <div className="prescDate">
                                  {fmtDateOnly(presc.createdAt)}
                                </div>
                              </div>
                              <span
                                className="prescStatus"
                                style={{ color: PRESC_STATUS_COLOR[presc.status] ?? "#c0cad8" }}
                              >
                                {presc.status}
                              </span>
                            </div>

                            {/* MC info */}
                            {presc.needMc && (
                              <div className="mcBadge">
                                🏥 MC: {presc.mcDays} day{presc.mcDays !== 1 ? "s" : ""}
                                {presc.mcReason ? ` — ${presc.mcReason}` : ""}
                              </div>
                            )}

                            {/* Medicine items */}
                            <div className="medicineList">
                              {presc.items.map(item => (
                                <div key={item.id} className="medicineRow">
                                  <div className="medicineName">{item.medicineName}</div>
                                  <div className="medicineMeta">
                                    {item.dosage}
                                    &nbsp;·&nbsp; Qty: {item.quantity}
                                    &nbsp;·&nbsp; {item.preference}
                                  </div>
                                  {item.usageInstruction && (
                                    <div className="medicineUsage">
                                      Usage: {item.usageInstruction}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Small helper component ────────────────────────────────────────────────────
function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="profileField">
      <div className="profileLabel">{label}</div>
      <div className="profileValue">{value}</div>
    </div>
  );
}