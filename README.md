# 🚀 Policy Impact Simulator (PIS)


A full-stack academic project for simulating how government policy eligibility rules impact different citizen groups.

The system lets policy teams:
- 📝 write or upload policy text,
- 🤖 convert that policy into structured, machine-readable eligibility rules using AI,
- ⚙️ run simulations on a citizen dataset,
- 📊 analyze eligibility outcomes using demographic and geography-wise breakdowns,
- 🗺️ visualize state-level coverage on an interactive India map.

---

## 📌 Project Description

Policy Impact Simulator (PIS) is designed to support data-driven policy planning.

It combines:
- 📱 a React Native (Expo) mobile client for login, policy input, confirmation, and results visualization,
- 🌐 a Node.js + Express backend with MongoDB for authentication, rule parsing, and simulation,
- 🧠 an LLM-powered policy parser (Groq SDK) that transforms natural-language policy descriptions into structured filter rules.

The core objective is to estimate policy reach (coverage %) and identify who benefits or gets excluded before real-world implementation.

---
## ✨ Features

### 🔐 1) Authentication & User Roles
- User registration and login.
- JWT-based authentication.
- Roles supported in backend model:
  - viewer
  - policy-maker
- Session persistence in the mobile app using AsyncStorage.

### 📄 2) Policy Input (Text + Document)
- Write policy eligibility criteria directly in text.
- Upload policy documents (PDF, DOC, DOCX).
- Optional notes support for uploaded documents.

### 🤖 3) AI Rule Extraction
- Uses Groq LLM to extract structured rules from policy text.
- Returns:
  - rules array with field/operator/value/label
- Supports domain fields such as age, income, state, social category, occupation, education level, disability, etc.

### ✅ 4) Rule Review Flow
- Human-in-the-loop confirmation screen.
- Approve extracted rules to proceed to simulation.
- Disapprove/regenerate rules if extraction quality is unsatisfactory.

### ⚙️ 5) Simulation Engine
- Converts rules into MongoDB queries.
- Computes:
  - total population
  - eligible count
  - excluded count
  - coverage percent
- Provides breakdowns by:
  - social category
  - rural vs urban
  - gender
  - state-wise coverage statistics

### 📊 6) Visualization
- Results dashboard with charts/bars for each breakdown.
- Interactive India SVG map with state-level color heat visualization.
- Sorted state coverage list for quick comparison.

---

## 🛠️ Tech Stack

### 📱 Mobile App (App)
- React Native (Expo)
- React Navigation
- Axios
- AsyncStorage


### 🌐 Backend (Backend)
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- Groq SDK (LLM integration)

### 💾 Data / Storage
- MongoDB collections:
  - users
  - citizen

---

## 📂 Repository Structure

- App
  - Expo mobile app source
  - Authentication UI
  - Policy input + upload flow
  - Rule confirmation and simulation result screens
  - India map visualization
- Backend
  - Express server entrypoint
  - Auth, parse-policy, simulation, and citizen routes/controllers
  - MongoDB models and middleware

---

## 🔗 API Overview

Base backend prefix: /api

### 👤 User
- POST /api/users/signup
- POST /api/users/login
- POST /api/users/getuser

### 📄 Policy Parsing
- POST /api/parse-policy
- POST /api/parse-policy/document

### ⚙️ Simulation
- POST /api/simulate

### 🧑 Citizen
- GET /api/citizens/citizen
- GET /api/citizens/limitedCitizens?limit=10
- GET /api/citizens/citizen/:id
- POST /api/citizens/CitizenFilter
  
---

## ⚙️ Steps to Run the Project

## 1️⃣ Prerequisites

Install these first:
- Node.js (LTS recommended, npm included)
- Expo CLI support (via npx; global install optional)
- Android Studio emulator or Expo Go app on phone

---

## 2️⃣ Clone and Open

```bash
git clone https://github.com/Pranav0223/ISE-Course-Project.git
cd ISE-Course-Project
```

---

## 3) Configure Backend Environment

Create a file named .env inside Backend with:

```env
MONGO_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key
```

Important:
- Keep .env private (already ignored by .gitignore).
- Choose a strong JWT secret.

---

## 4) Install and Run Backend

```bash
cd Backend
npm install
nodemon app.js
```

Expected logs include:
- database connected.......
- server is started on port number : 5000 

---

## 5) Configure Mobile API Base URL

Open App/src/services/api.js and replace the placeholder base URL:

Current placeholder:
- IP_ADDRESS

Change it to your backend URL, for example:
- Android emulator (same machine): http://10.0.2.2:5000
- Physical device on same Wi-Fi: http://YOUR_LOCAL_IP:5000

Make sure phone/emulator can reach the backend host.

---

## 6) Install and Run Mobile App

```bash
cd App
npm install
npm run start
```

Then choose one:
- press a for Android emulator
- press i for iOS simulator (macOS)
- scan QR with Expo Go on device

You can also run directly:

```bash
npm run android
npm run ios
npm run web
```

---

## 7) End-to-End Flow Check

1. Register a new user.
2. Log in.
3. Enter policy text or upload a policy document.
4. Confirm extracted rules.
5. Run simulation.
6. Inspect result cards and India map.

---

## Known Gaps / Current Notes

- Web folder is currently not an implemented frontend.
- API base URL is hardcoded in mobile api.js and must be manually updated for each environment.


