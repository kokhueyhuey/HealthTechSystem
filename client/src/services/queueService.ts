// src/services/queueService.ts

export type QueueEntry = {
  queueEntryId: number;
  ticketNumber: number;
  patientId: number;
  appointmentId: number;
  patientName?: string;
  status: "Waiting" | "Serving" | "Completed" | "Skipped" | string;
};

export type QueueState = {
  nowServing: number;
  lastIssued: number;
  waitingCount: number;
  minutesPerSlot: number;
  queue: QueueEntry[];
};

const BASE_URL = "http://localhost:5165/api/queue";

// 1. Fetch the current queue state (GET)
export async function getQueueState(token: string): Promise<QueueState> {
  const res = await fetch(BASE_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch queue state");
  return res.json();
}

// 2. Add a patient to the queue (POST)
export async function enqueuePatient(
  token: string,
  appointmentId: number,
  patientId: number,
  patientName: string
): Promise<QueueEntry> {
  const res = await fetch(`${BASE_URL}/enqueue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ appointmentId, patientId, patientName }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}