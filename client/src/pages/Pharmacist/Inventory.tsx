type MedStatus = "In Stock" | "Low Stock" | "Out of Stock" | "Expired";

interface Medicine {
  name: string; qty: number; threshold: number; expiry: string; status: MedStatus;
}

const MEDICINES: Medicine[] = [
  { name: "Paracetamol 500mg", qty: 320, threshold: 50, expiry: "2027-03-01", status: "In Stock" },
  { name: "Amoxicillin 250mg", qty: 30, threshold: 50, expiry: "2026-08-15", status: "Low Stock" },
  { name: "Metformin 500mg", qty: 0, threshold: 30, expiry: "2026-12-01", status: "Out of Stock" },
];

export default function Inventory() {
  return (
    <div>
      <h2 className="pageTitle">Inventory</h2>

      {MEDICINES.map((m, i) => (
        <div key={i} className="row">
          <div>{m.name}</div>
          <div>{m.qty}</div>
          <div className="status">{m.status}</div>
        </div>
      ))}
    </div>
  );
}