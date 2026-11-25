# false

**false** is a clean, minimal, zero-knowledge Boolean (True/False) statement tracker organized date-wise. Built with a React + Vite frontend, an Express + MongoDB backend (deployable directly to Vercel as serverless functions), and client-side encryption adhering to Universal Encryption Convention Version 1 (AES-256-GCM, PBKDF2-HMAC-SHA256).

---

## 1. Key Features

- **Date-Wise Organization:** Navigate to any date via an intuitive date picker, quick navigation (Previous Day, Next Day, Today), without full page reload.
- **Boolean Status:** Statements are labeled as **TRUE** (vibrant green) or **FALSE** (vibrant red), with 1-click status toggling. Newly created statements default to `status: TRUE`.
- **Statement Versioning:** Initial statements start at `v1`. Every edit creates an immutable new version (`v2`, `v3`, etc.) while preserving all previous encrypted versions and timestamps. Status changes do **not** trigger new versions.
- **Soft Deletion:** Deletion sets `deleted = true`. Statements are never physically destroyed, preserving the historical audit trail.
- **Append-Only Activity Log:** Minimal audit trail recording `ADD`, `DELETE`, `EDIT` (records new version id), and `CHANGE_STATUS` (records new boolean status). **Never logs statement content or encryption keys.**
- **Zero-Knowledge Client-Side Encryption (Version 1):**
  - **Algorithm:** AES-256-GCM
  - **Key Derivation:** PBKDF2-HMAC-SHA256 with 600,000 iterations
  - **Salt:** 16-byte cryptographically secure random salt per version
  - **Nonce:** 12-byte cryptographically secure random nonce per version
  - **Authentication Tag:** 16-byte (128-bit) integrity check
  - **Master Password Security:** Kept strictly in memory while unlocked. Never saved in localStorage, cookies, session storage, or transmitted across the wire.
- **Vercel & Analytics Ready:** Comes with `vercel.json`, Vercel serverless function entrypoint (`api/index.js`), and privacy-friendly `@vercel/analytics`.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────┐
│                   Browser (Frontend)                   │
│                                                        │
│  User Master Password (In-Memory Only)                 │
│         │                                              │
│         ▼ (PBKDF2-HMAC-SHA256: 600,000 iterations)     │
│  AES-256-GCM Key                                       │
│         │                                              │
│         ▼                                              │
│  Plaintext Statement ──► Encrypted Envelope (JSON)     │
│                                │                       │
└────────────────────────────────┼───────────────────────┘
                                 │ HTTP POST/PUT
                                 ▼
┌────────────────────────────────────────────────────────┐
│             Lightweight API Server (Backend)           │
│                                                        │
│  - Receives encrypted blob only                        │
│  - Never receives master password or plaintext content │
│  - Validates envelope & saves to MongoDB               │
│  - Records append-only Activity Log (IDs & metadata)   │
└────────────────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────┐
│                        MongoDB                         │
│  - collections: `statements`, `activitylogs`           │
└────────────────────────────────────────────────────────┘
```

---

## 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your configuration values in `.env`:

```env
PORT=5000
NODE_ENV=production

# MongoDB Connection String (Atlas or local)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/statement_tracker?retryWrites=true&w=majority
DB_NAME=statement_tracker
```

---

## 4. Local Installation & Development

### Prerequisites
- Node.js 18+ (tested on Node.js 24)
- npm 9+
- A running MongoDB instance or MongoDB Atlas cluster

### Install Dependencies
```bash
# Install root/backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### Running Locally
You can run the app in development or production mode:

```bash
# 1. Build the frontend
npm run build

# 2. Start the unified server (serves API on /api and static UI)
npm start
```

Visit `http://localhost:5000` in your browser.

To run Vite with hot-reload in development:
```bash
npm run dev:client
```

### Running the Test Suite
Run the built-in automated test suite covering crypto verification and API/MongoDB operations:

```bash
npm test
```

---

## 5. Hosting on Vercel (Step-by-Step Guide)

This application is configured to deploy both frontend and backend on Vercel under a single project with zero extra hosting servers needed.

### Step 1: Set up a Free MongoDB Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Create a free **M0 (Shared)** cluster.
3. Under **Security → Database Access**, create a database user (e.g., `app_user` with a strong password).
4. Under **Security → Network Access**, add IP `0.0.0.0/0` (Allow access from anywhere) so Vercel's serverless functions can connect.
5. Under **Deployment → Database**, click **Connect** → **Drivers** (Node.js) and copy your connection string:
   ```
   mongodb+srv://app_user:<password>@cluster0.xxxx.mongodb.net/statement_tracker?retryWrites=true&w=majority
   ```

### Step 2: Push Your Project to GitHub
Initialize a git repository and push your project to GitHub:
```bash
git init
git add .
git commit -m "Initial commit: Date-Wise Statement Tracker"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 3: Deploy to Vercel
1. Log in to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository.
3. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection string from Step 1.
   - `DB_NAME`: `statement_tracker`
   - `NODE_ENV`: `production`
4. Click **Deploy**.

Vercel will automatically:
- Install packages and build the frontend into `client/dist`.
- Set up the serverless backend API at `/api/*` via `vercel.json` and `api/index.js`.
- Enable Vercel Web Analytics.
- Provide a production HTTPS domain (e.g. `https://your-app.vercel.app`).

---

## 6. API Specification

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/statements?date=YYYY-MM-DD` | Get all non-deleted statements for the given date |
| `POST` | `/api/statements` | Create a new statement (`status: true`, initial version `v1`, logs `ADD`) |
| `PUT` | `/api/statements/:id` | Edit statement content (creates new version `v2`, `v3`..., logs `EDIT`) |
| `PATCH` | `/api/statements/:id/status` | Toggle boolean status (does **not** create a version, logs `CHANGE_STATUS`) |
| `DELETE` | `/api/statements/:id` | Soft delete (`deleted: true`, logs `DELETE`) |
| `GET` | `/api/statements/:id/history` | Get full version history for a statement |
| `GET` | `/api/activity-logs` | Retrieve chronological audit trail (most recent first) |
| `GET` | `/api/health` | Health check endpoint |
