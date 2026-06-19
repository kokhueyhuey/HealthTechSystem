# HealthTech System

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![.NET Core](https://img.shields.io/badge/.NET%20Core-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![C#](https://img.shields.io/badge/C%23-239120?style=for-the-badge&logo=c-sharp&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-CC2927?style=for-the-badge&logo=microsoft-sql-server&logoColor=white)

A full-stack clinic management system for a medical clinic, supporting three roles: **Patient**, **Doctor**, and **Pharmacist**. The system covers appointment booking, a live consultation queue, digital prescriptions, and pharmacy inventory management, with real-time updates pushed to clients over SignalR.

The codebase is also a study in the **Gang of Four design patterns**: the Observer, State, and Builder patterns each own a distinct domain module.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Backend | ASP.NET Core (.NET 10), C#, Entity Framework Core, SignalR |
| Database | SQL Server |
| Frontend | React 18, TypeScript, Vite, CSS Modules |
| Real-time | SignalR (WebSocket) |

---

## Getting started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/) (18+) and npm
- SQL Server (LocalDB, Express, or full)

### 1. Configure the database

The default connection string lives in `server/HealthTech.API/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=HealthTechDb;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Adjust the `Server=` value to match your SQL Server instance.

### 2. Run the backend

```bash
cd server/HealthTech.API
dotnet ef database update   # apply migrations / create the database
dotnet run
```

The API serves Swagger UI at `https://localhost:<port>/swagger` in development.

### 3. Run the frontend

```bash
cd client
npm install
npm run dev
```

The Vite dev server runs at **http://localhost:5173** — this origin is allow-listed by the backend's CORS policy.

---

## Design patterns

Three Gang of Four patterns are used — and only these three.

| Pattern | GoF category | Module | Key participants |
|---------|-------------|--------|------------------|
| **Observer** | Behavioral | Appointment | `IAppointmentSubject` / `AppointmentService`, `IAppointmentObserver` + ConcreteObservers |
| **Observer** | Behavioral | Queue | `IQueueSubject` / `QueueService`, `IQueueObserver` + ConcreteObservers |
| **State** | Behavioral | Pharmacy Inventory | `MedicineContext`, `IMedicineState` + `InStock`/`LowStock`/`OutOfStock`/`Expired` states |
| **Builder** | Creational | Digital Prescription | `IPrescriptionBuilder` / `PrescriptionBuilder`, `PrescriptionDirector`, `Prescription` |

---

## Build commands

```bash
# Backend
cd server/HealthTech.API && dotnet build
cd server/HealthTech.API && dotnet run

# Frontend
cd client && npm install
cd client && npm run dev
cd client && npm run build      

# Migrations (run only when needed)
cd server/HealthTech.API && dotnet ef migrations add <Name>
cd server/HealthTech.API && dotnet ef database update
```

---
