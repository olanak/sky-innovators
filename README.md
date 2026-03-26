# 🛰️ Sky Innovators: Aerial Intelligence Platform

Sky Innovators is a full-stack web application designed to transform raw drone telemetry and aerial media into actionable environmental and infrastructure insights. By leveraging **FastAPI** and **React**, the platform provides a centralized workspace for managing large-scale aerial projects and extracting automated AI metrics.

## 🚀 Core Features

* **Project-Centric Workspace:** Organize aerial missions by client, location, and status.
* **Automated AI Analysis:** * 🌳 **Forestry & Environment:** Canopy cover and vegetation health extraction.
    * 🌾 **Land & Soil:** Real-time health monitoring of agricultural zones.
    * 🛣️ **Infrastructure:** Hydrology and structural mapping.
* **Media Library Management:** A central repository for .mp4, .mov, and .tif files with secure project-linking capabilities.
* **Dynamic Data Reporting:** * Individual asset analysis reports with confidence scoring.
    * Master Project CSV Export: Compile metrics from all project assets into a single executive summary.
* **Secure Authentication Flow:** Robust Sign-in/Sign-up with a database-backed "Forgot Password" system integrated with **Resend API**.

## 🛠️ Technical Stack

### Frontend
* **React (Vite)** – Fast, component-based UI.
* **Tailwind CSS** – Custom-themed dark/light mode interface.
* **React Router** – Seamless navigation and smart "back-button" history.

### Backend
* **FastAPI (Python)** – High-performance asynchronous API framework.
* **PostgreSQL** – Relational database for persistent storage of users, projects, and AI results.
* **SQLAlchemy** – ORM for complex data relationship mapping.
* **JWT & Bcrypt** – Secure session handling and hashed credential storage.

## 📂 Project Structure

```text
├── backend/
│   ├── main.py          # FastAPI application routes
│   ├── models.py        # SQLAlchemy database schemas
│   ├── mailer.py        # Resend API integration
│   └── database.py      # PostgreSQL connection setup
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable UI (UploadZone, AnalysisReport)
│   │   ├── pages/       # Dashboard, Projects, Login
│   │   └── config.js    # API environment settings
```

## ⚙️ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. Environment Variables
Create a `.env` file in the backend folder:
```env
DATABASE_URL=postgresql://user:password@localhost/skyinnovators
RESEND_API_KEY=re_your_key
FRONTEND_URL=http://localhost:5173
```
