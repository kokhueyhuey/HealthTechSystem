export default function Prescription() {
  return (
    <div>
      <h2 className="pageTitle">Prescription</h2>

      <div className="formCard">
        <input className="input" placeholder="Medicine" />
        <input className="input" placeholder="Dosage" />
        <button className="primaryBtn">Send</button>
      </div>
    </div>
  );
}