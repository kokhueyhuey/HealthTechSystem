export default function BookAppointment() {
  return (
    <div>
      <h2 className="pageTitle">Book Appointment</h2>
      <p className="pageSub">Booking feature coming soon...</p>

      <div className="formCard">
        <input className="input" placeholder="Doctor" disabled />
        <input className="input" placeholder="Date" disabled />
        <input className="input" placeholder="Time" disabled />

        <button className="primaryBtn" disabled>
          Confirm Booking
        </button>
      </div>
    </div>
  );
}