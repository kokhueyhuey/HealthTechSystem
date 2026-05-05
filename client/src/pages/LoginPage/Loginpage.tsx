import { useState } from "react";
import  { loginUser, saveSession } from "../../services/api";
import type { LoginResponse } from "../../services/api";

interface Props {
  onLoginSuccess: (user: LoginResponse) => void;
  onGoRegister: () => void;
}

export default function LoginPage({ onLoginSuccess, onGoRegister }: Props) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<"Patient" | "Doctor" | "Pharmacist">("Patient");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await loginUser(email, password, role);
      saveSession(user); // save to localStorage so session persists on refresh
      onLoginSuccess(user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        {/* Logo / brand */}
        <div style={styles.brand}>
          <div style={styles.logoMark}>H</div>
          <span style={styles.brandName}>HealthTech</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <label style={styles.label}>I am a</label>
          <select
            style={styles.select}
            value={role}
            onChange={e => setRole(e.target.value as any)}
          >
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Pharmacist">Pharmacist</option>
          </select>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <span style={styles.link} onClick={onGoRegister}>Register here</span>
        </p>
      </div>
    </div>
  );
}

// styles
const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0d1520 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', sans-serif",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 20,
    padding: "48px 40px",
    width: 400,
    backdropFilter: "blur(12px)",
  },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32 },
  logoMark: {
    width: 36, height: 36, borderRadius: 10,
    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontWeight: 700, fontSize: 18,
  },
  brandName: { color: "#fff", fontWeight: 600, fontSize: 18 },
  title: { color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" },
  sub: { color: "#8892a4", fontSize: 14, margin: "0 0 28px" },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  label: { color: "#c0cad8", fontSize: 13, fontWeight: 500 },
  input: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "12px 14px",
    color: "#fff", fontSize: 14, outline: "none",
  },
  select: {
    background: "#1e2535",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10, padding: "12px 14px",
    color: "#fff", fontSize: 14, outline: "none", cursor: "pointer",
  },
  error: { color: "#f87171", fontSize: 13, margin: 0 },
  btn: {
    marginTop: 8,
    background: "linear-gradient(135deg, #3b82f6, #06b6d4)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "13px", fontSize: 15, fontWeight: 600,
    cursor: "pointer", transition: "opacity 0.2s",
  },
  switchText: { color: "#8892a4", fontSize: 13, textAlign: "center", marginTop: 24 },
  link: { color: "#60a5fa", cursor: "pointer", fontWeight: 500 },
};
