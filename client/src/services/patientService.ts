const BASE_URL = "http://localhost:5165/api/patients";

export async function getPatients() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Failed");
  return res.json();
}

export async function createPatient(data: any) {
  await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}