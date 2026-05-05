import { useState } from "react";
import { registerUser } from "../api";

interface Props {
  onRegistered: () => void;
  onGoLogin: () => void;
}

export default function RegisterPage({ onRegistered, onGoLogin }: Props) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [phone, setPhone]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<"Patient" | "Doctor" | "Pharmacist">("Patient");
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      // This call hits POST /api/user/register.
      // The backend calls UserFactoryProvider.GetFactory(role) — Factory Method Pattern.
      const res = await registerUser({ name, email, password, phoneNumber: phone, role });
      setSuccess(`${res.role} "${res.name}" registered! Redirecting to login…`);
      setTimeout(onRegistered, 1800);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Role-specific colour
  const roleColor: Record<string, string> = {
    Patient:    "#3b82f6",
    Doctor:     "#10b981",
    Pharmacist: "#f59e0b",
  };
  const accent = roleColor[role];

  return (
    <div style={styles.bg}>
      <div style={{ ...styles.card, borderTop: `3px solid ${accent}` }}>
        <div style={styles.brand}>
          <div style={{ ...styles.logoMark, background: accent }}>H</div>
          <span style={styles.brandName}>HealthTech</span>
        </div>

        <h1 style={styles.title}>Create account</h1>
        <p style={styles.sub}>Register as a {role}</p>

        <form onSubmit={handleRegister} style={styles.form}>
          <label style={styles.label}>I am registering as</label>
          <div style={styles.roleRow}>
            {(["Patient", "Doctor", "Pharmacist"] as const).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  ...styles.roleBtn,
                  background: role === r ? accent : "rgba(255,255,255,0.05)",
                  border: `1px solid ${role === r ? accent : "rgba(255,255,255,0.12)"}`,
                  color: role === r ? "#fff" : "#8892a4",
                  fontWeight: role === r ? 600 : 400,
                }}
              >
                {r}
              </button>
            ))}
          </div>

          <label style={styles.label}>Full name</label>
          <input style={styles.input} placeholder="Alice Tan" value={name} onChange={e => setName(e.target.value)} required />

          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />

          <label style={styles.label}>Phone number</label>
          <input style={styles.input} placeholder="01X-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />

          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />

          {error   && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.successMsg}>{success}</p>}

          <button style={{ ...styles.btn, background: accent }} type="submit" disabled={loading}>
            {loading ? "Registering…" : `Register as ${role}`}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <span style={{ color: accent, cursor: "pointer", fontWeight: 500 }} onClick={onGoLogin}>Sign in</span>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0d1520 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20, padding: "48px 40px", width: 420,
    backdropFilter: "blur(12px)",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 18, transition: "background 0.3s",
  },
  brandName: { color: "#fff", fontWeight: 600, fontSize: 18 },
  title: { color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" },
  sub:   { color: "#8892a4", fontSize: 14, margin: "0 0 24px" },
  form:  { display: "flex", flexDirection: "column", gap: 12 },
  label: { color: "#c0cad8", fontSize: 13, fontWeight: 500 },
  roleRow: { display: "flex", gap: 8 },
  roleBtn: { flex: 1, padding: "10px 0", borderRadius: 10, cursor: "pointer", fontSize: 13, transition: "all 0.2s" },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "12px 14px",
    color: "#fff", fontSize: 14, outline: "none",
  },
  error:      { color: "#f87171", fontSize: 13, margin: 0 },
  successMsg: { color: "#34d399", fontSize: 13, margin: 0 },
  btn: {
    marginTop: 8, color: "#fff", border: "none", borderRadius: 10,
    padding: "13px", fontSize: 15, fontWeight: 600,
    cursor: "pointer", transition: "opacity 0.2s",
  },
  switchText: { color: "#8892a4", fontSize: 13, textAlign: "center", marginTop: 24 },
};
