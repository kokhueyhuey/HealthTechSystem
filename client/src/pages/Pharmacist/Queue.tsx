import { useState } from "react";

export default function Queue() {
  const [num, setNum] = useState(1);

  return (
    <div>
      <h2 className="pageTitle">Queue</h2>
      <h1 className="queueNum">Q-{num}</h1>

      <button className="primaryBtn" onClick={() => setNum(n => n + 1)}>
        Call Next
      </button>
    </div>
  );
}