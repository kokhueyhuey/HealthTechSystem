import { useEffect, useState } from "react";
import { getPatients, createPatient } from "./api";
import type { Patient } from "./types";
import connection from "./signalR";

function App() {
  const [patients, setPatients] = useState<Patient[]>([]);

  // form states
  const [name, setName] = useState("");
  const [age, setAge] = useState("");

  const loadPatients = () => {
    getPatients().then((res) => setPatients(res.data));
  };

useEffect(() => {
  loadPatients();

  const startConnection = async () => {
    try {
      if (connection.state === "Disconnected") {
        await connection.start();
        console.log("SignalR Connected");

        connection.on("ReceivePatientUpdate", () => {
          loadPatients();
        });
      }
    } catch (err) {
      console.error("SignalR error:", err);
    }
  };

  startConnection();

  return () => {
    if (connection.state === "Connected") {
      connection.stop();
    }
  };
}, []);

  // ADD PATIENT FUNCTION
  const handleAddPatient = async () => {
    if (!name || !age ) {
      alert("Please fill all fields");
      return;
    }

    await createPatient({
      name,
      age: Number(age),
    });

    // clear form
    setName("");
    setAge("");

    // fallback refresh (SignalR also does this)
    loadPatients();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>HealthTech Patients</h2>

      {/* ADD PATIENT FORM */}
      <div style={{ marginBottom: 20 }}>
        <h3>Add Patient</h3>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />


        <button onClick={handleAddPatient}>
          Add Patient
        </button>
      </div>

      <hr />

      {/* PATIENT LIST */}
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            {p.name} - {p.age} 
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;