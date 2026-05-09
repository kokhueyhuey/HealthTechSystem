import { useState } from "react";
import { registerUser } from "../../services/api";

interface Props {
  onRegistered: () => void;
  onGoLogin: () => void;
}

export default function RegisterPage({ onRegistered, onGoLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [icNumber, setIcNumber] = useState(""); // Only IC Number now!
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    
    try {
      const payload = { 
        name, 
        email, 
        phoneNumber: phone, 
        role: "Patient" as const, 
        icNumber 
      };
      
      await registerUser(payload);
      setSuccess(`Account created! Your password is the last 4 digits of your IC.`);
      setTimeout(onRegistered, 3000); 

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.bg}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>H</div>
          <span style={styles.brandName}>HealthTech</span>
        </div>

        <h1 style={styles.title}>Patient Registration</h1>
        <p style={styles.sub}>Create your account to book appointments</p>

        <form onSubmit={handleRegister} style={styles.form}>
          
          <label style={styles.label}>Full Name</label>
          <input style={styles.input} placeholder="Alice Tan" value={name} onChange={e => setName(e.target.value)} required />

          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" placeholder="alice@example.com" value={email} onChange={e => setEmail(e.target.value)} required />

          <label style={styles.label}>Phone Number</label>
          <input style={styles.input} placeholder="01X-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />

        {/* ic number as the password */}
          <label style={styles.label}>IC Number (Used for login)</label>
          <input 
            style={styles.input} 
            placeholder="e.g. 010203-04-5566" 
            value={icNumber} 
            onChange={e => setIcNumber(e.target.value)} 
            required 
          />

          {error   && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.successMsg}>{success}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Registering…" : `Create Patient Account`}
          </button>
        </form>

        <p style={styles.switchText}>
          Already have an account?{" "}
          <span style={styles.link} onClick={onGoLogin}>Sign in</span>
        </p>
      </div>
    </div>
  );
}


const styles: Record<string, React.CSSProperties> = {
  bg: { minHeight: "100vh", background: "linear-gradient(135deg, #0f1117 0%, #1a1f2e 50%, #0d1520 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI', sans-serif", },
  card: { background: "rgba(255,255,255,0.04)", borderTop: "3px solid #3b82f6", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "48px 40px", width: 420, backdropFilter: "blur(12px)", },
  brand: { display: "flex", alignItems: "center", gap: 10, marginBottom: 28 },
  logoMark: { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#3b82f6", color: "#fff", fontWeight: 700, fontSize: 18 },
  brandName: { color: "#fff", fontWeight: 600, fontSize: 18 },
  title: { color: "#fff", fontSize: 26, fontWeight: 700, margin: "0 0 6px" },
  sub:   { color: "#8892a4", fontSize: 14, margin: "0 0 24px" },
  form:  { display: "flex", flexDirection: "column", gap: 12 },
  label: { color: "#c0cad8", fontSize: 13, fontWeight: 500 },
  input: { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "12px 14px", color: "#fff", fontSize: 14, outline: "none", },
  error:      { color: "#f87171", fontSize: 13, margin: 0 },
  successMsg: { color: "#34d399", fontSize: 13, margin: 0 },
  btn: { marginTop: 8, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  switchText: { color: "#8892a4", fontSize: 13, textAlign: "center", marginTop: 24 },
  link: { color: "#3b82f6", cursor: "pointer", fontWeight: 500 }
};