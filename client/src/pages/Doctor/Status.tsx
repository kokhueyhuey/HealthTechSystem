import { useState } from "react";

export default function Status() {
  const [status, setStatus] = useState("InProgress");

  return (
    <div>
      <h2 className="pageTitle">Update Status</h2>

      <div className="formCard">
        <div style={{ display: "flex", gap: 10 }}>
          {["Pending", "InProgress", "Completed"].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              style={{
                flex: 1,
                background: status === s ? "#10b981" : "transparent",
                color: "#fff",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <button className="primaryBtn">Update</button>
      </div>
    </div>
  );
}