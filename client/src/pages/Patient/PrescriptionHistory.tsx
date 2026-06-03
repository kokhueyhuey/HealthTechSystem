import { useEffect, useState } from "react";
import {
  getPatientPrescriptionHistory,
  getSession,
  type Prescription,
} from "../../services/api";
import styles from "./PrescriptionHistory.module.css";

// ── Status badge colours (text + background) ─────────────────────────────────
const STATUS_META: Record<string, { color: string; bg: string }> = {
  Pending:   { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  Dispensed: { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  Ready:     { color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  Cancelled: { color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

function getStatusMeta(status: string) {
  return STATUS_META[status] ?? { color: "#94a3b8", bg: "rgba(148,163,184,0.10)" };
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────
function ClipboardIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
    </svg>
  );
}

function AlertCircleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PrescriptionHistory() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    const user = getSession();
    if (!user) {
      alert("Patient session not found.");
      return;
    }
    setLoading(true);
    try {
      const data = await getPatientPrescriptionHistory(user.id);
      setPrescriptions(data);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>

      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Prescription History</h2>
        <p className={styles.pageSub}>Your past and current prescriptions from clinic visits.</p>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className={styles.loadingRow}>
          <span className={styles.spinner} />
          Loading prescription history...
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && prescriptions.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <ClipboardIcon />
          </div>
          <p className={styles.emptyTitle}>No prescriptions yet</p>
          <p className={styles.emptySub}>
            Prescriptions issued after your clinic visits will appear here.
          </p>
        </div>
      )}

      {/* ── List ── */}
      {!loading && prescriptions.length > 0 && (
        <div className={styles.list}>
          {prescriptions.map((prescription, index) => {
            const { color, bg } = getStatusMeta(prescription.status);
            return (
              <div key={prescription.id} className={styles.card}>
                <div className={styles.cardBody}>

                  {/* ── Card top row: label + date left, status badge right ── */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardIndex}>
                        Prescription {prescriptions.length - index}
                        <span className={styles.cardId}> &nbsp;·&nbsp; #{prescription.id}</span>
                      </span>
                      <span className={styles.cardDate}>
                        {new Date(prescription.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <span
                      className={styles.badge}
                      style={{ color, background: bg }}
                    >
                      <span className={styles.badgeDot} style={{ background: color }} />
                      {prescription.status}
                    </span>
                  </div>

                  {/* ── MC section ── */}
                  {prescription.needMc && (
                    <div className={styles.mcSection}>
                      <div className={styles.mcHeader}>
                        <AlertCircleIcon />
                        Medical Certificate
                      </div>
                      {/* dl for semantics; aligned label/value columns */}
                      <dl className={styles.mcProps}>
                        <div className={styles.mcPair}>
                          <dt className={styles.mcLabel}>Duration</dt>
                          <dd className={styles.mcValue}>
                            {prescription.mcDays} day{prescription.mcDays !== 1 ? "s" : ""}
                          </dd>
                        </div>
                        <div className={styles.mcPair}>
                          <dt className={styles.mcLabel}>Reason</dt>
                          <dd className={styles.mcValue}>{prescription.mcReason}</dd>
                        </div>
                      </dl>
                    </div>
                  )}

                  <div className={styles.divider} />

                  {/* ── Medicine list ── */}
                  <p className={styles.sectionLabel}>
                    Medicine details &mdash; {prescription.items.length} item{prescription.items.length !== 1 ? "s" : ""}
                  </p>

                  <div className={styles.medicineList}>
                    {prescription.items.map((item) => (
                      <div key={item.id} className={styles.medicineItem}>

                        {/* Name + dosage badge */}
                        <div className={styles.medicineTop}>
                          <span className={styles.medicineName}>{item.medicineName}</span>
                          <span className={styles.medicineDosage}>{item.dosage}</span>
                        </div>

                        {/* Property pairs: Qty + Type — clear LABEL value layout */}
                        <dl className={styles.medicineMeta}>
                          <div className={styles.metaPair}>
                            <dt className={styles.metaLabel}>Qty</dt>
                            <dd className={styles.metaValue}>{item.quantity}</dd>
                          </div>
                          <div className={styles.metaPair}>
                            <dt className={styles.metaLabel}>Type</dt>
                            <dd className={styles.metaValue}>{item.preference}</dd>
                          </div>
                        </dl>

                        {/* Usage instruction — labeled row, no italic */}
                        {item.usageInstruction && (
                          <div className={styles.usageRow}>
                            <span className={styles.usageLabel}>Usage</span>
                            <span className={styles.usageText}>{item.usageInstruction}</span>
                          </div>
                        )}

                      </div>
                    ))}
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
