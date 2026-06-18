import { useState } from "react";
import { registerUser } from "../../services/api";
import styles from "./RegisterPage.module.css";

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
    <div className={styles.bg}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>H</div>
          <span className={styles.brandName}>HealthTech</span>
        </div>

        <h1 className={styles.title}>Patient Registration</h1>
        <p className={styles.sub}>Create your account to book appointments</p>

        <form onSubmit={handleRegister} className={styles.form}>

          <label className={styles.label}>Full Name</label>
          <input className={styles.input} placeholder="Alice Tan" value={name} onChange={e => setName(e.target.value)} required />

          <label className={styles.label}>Email</label>
          <input className={styles.input} type="email" placeholder="alice@example.com" value={email} onChange={e => setEmail(e.target.value)} required />

          <label className={styles.label}>Phone Number</label>
          <input className={styles.input} placeholder="01X-XXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />

        {/* ic number as the password */}
          <label className={styles.label}>IC Number (Used for login)</label>
          <input
            className={styles.input}
            placeholder="e.g. 010203-04-5566"
            value={icNumber}
            onChange={e => setIcNumber(e.target.value)}
            required
          />

          {error   && <p className={styles.error}>{error}</p>}
          {success && <p className={styles.successMsg}>{success}</p>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Registering…" : `Create Patient Account`}
          </button>
        </form>

        <p className={styles.switchText}>
          Already have an account?{" "}
          <span className={styles.link} onClick={onGoLogin}>Sign in</span>
        </p>
      </div>
    </div>
  );
}