# AMSPEC — Lab Inventory Management & Compliance Tracking System

AMSPEC is an enterprise-grade Inventory Management and Compliance Tracking Software designed specifically for Oil, Gas, and Chemical Testing Laboratories. The system tracks chemical inventories, handles certifications, monitors expiry dates, and alerts key stakeholders of imminent expirations or low stock conditions.

---

## 🚀 Key Features

*   **Secure Auth & Role-Based Access (RBAC)**: Supports roles (Admin, Lab Manager, Chemist, Store Keeper, Auditor) with specific permissions.
*   **Dynamic Laboratory Dashboard**: Complete analytics displaying stock status, expiry trends, and high-priority compliance notifications.
*   **Full Inventory Tracking**: Track quantities, locations, manufacturers, batch numbers, and exact CAS numbers.
*   **Compliance & Certificate Management**: Upload and link Certificate of Analysis (COA), Calibration, and SDS/MSDS sheets to chemicals.
*   **Automated Email Alerts**: Background task checking daily and sending high-priority notifications to Lab Managers for expiring and low stock items.
*   **Custom QR/Barcode Generation**: Instantly generate scannable QR codes containing detailed batch and chemical identification.
*   **Audit Logging**: Every single record change (creation, quantity updates, consumption) is fully audited for regulatory compliance.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite, Tailwind CSS, Zustand |
| **Backend** | Node.js + Express.js + TypeScript |
| **Database** | PostgreSQL (via Prisma ORM) or SQLite |
| **Auth** | JWT (access + refresh tokens), bcrypt |
| **Alerts** | node-cron + Nodemailer (SMTP) |
| **Reports** | pdfkit (PDF), exceljs (Excel) |

---

## 💻 Zero-Configuration Quick Start (SQLite Mode)

If you do not have PostgreSQL installed locally or running in Docker, you can quickly spin up the entire application using **SQLite** for instant evaluation.

### 1. Configure the Backend for SQLite

Change the database provider in `backend/prisma/schema.prisma` to `sqlite`:

```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

Then edit `backend/.env` to reflect the SQLite database:
```env
DATABASE_URL="file:./dev.db"
```

### 2. Setup and Seed the Database
From the `backend` directory, run:
```bash
cd backend
npm run prisma:generate
npx prisma db push
npm run prisma:seed
```

### 3. Start the Backend API
```bash
npm run dev
```
The backend API will start on [http://localhost:5000](http://localhost:5000).

### 4. Start the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start on [http://localhost:5173](http://localhost:5173).

---

## 🐳 Standard Production Setup (PostgreSQL + Docker)

To run the application in its standard production environment with a dedicated PostgreSQL database:

### 1. Ensure Docker & Docker Compose are Installed
Make sure Docker Desktop is running.

### 2. Configure Credentials
Copy `.env.example` to `.env` in the `backend` directory:
```bash
cp backend/.env.example backend/.env
```
Update SMTP credentials to enable email alerts.

### 3. Spin Up Services
From the root project directory:
```bash
docker-compose up --build
```
This will build and spin up the three containers:
*   `amspec-db` (PostgreSQL on port 5432)
*   `amspec-backend` (Node.js API on port 5000)
*   `amspec-frontend` (Vite + React UI on port 3000)

---

## 🔑 Seeding Credentials

After running the database seed script, you can log in using any of the following credentials:

| Role | Username | Password |
|---|---|---|
| **Admin** | `admin@amspec.com` | `Admin@123` |
| **Lab Manager** | `manager@amspec.com` | `User@123` |
| **Chemist** | `chemist@amspec.com` | `User@123` |
| **Store Keeper** | `store@amspec.com` | `User@123` |
| **Auditor** | `auditor@amspec.com` | `User@123` |
