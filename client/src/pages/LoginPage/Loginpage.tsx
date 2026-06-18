import { useState } from "react";
import  { loginUser, saveSession } from "../../services/api";
import type { LoginResponse } from "../../services/api";
import styles from "./LoginPage.module.css";

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
    <div className={styles.bg}>
      <div className={styles.card}>
        {/* Logo / brand */}
        <div className={styles.brand}>
          <div className={styles.logoMark}>H</div>
          <span className={styles.brandName}>HealthTech</span>
        </div>

        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.sub}>Sign in to your account</p>

        <form onSubmit={handleLogin} className={styles.form}>
          <label className={styles.label}>Email</label>
          <input
            className={styles.input}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <label className={styles.label}>I am a</label>
          <select
            className={styles.select}
            value={role}
            onChange={e => setRole(e.target.value as any)}
          >
            <option value="Patient">Patient</option>
            <option value="Doctor">Doctor</option>
            <option value="Pharmacist">Pharmacist</option>
          </select>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className={styles.switchText}>
          Don't have an account?{" "}
          <span className={styles.link} onClick={onGoRegister}>Register here</span>
        </p>
      </div>
    </div>
  );
}
