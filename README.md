# false — Statement Tracker & Encrypted Diary

**false** is a zero-knowledge, privacy-first web application featuring a Boolean (True/False) statement tracker and an authentic handwritten **Diary ("Dairy")** organized date-wise.

Built with a React 19 + Vite frontend, Express + MongoDB backend (deployable directly to Vercel as serverless functions), and client-side encryption adhering to Universal Encryption Convention Version 1 (AES-256-GCM, PBKDF2-HMAC-SHA256 with 600,000 iterations).

---

## 1. Key Features

### 📖 Daily Encrypted Diary ("Dairy")
- **Per-Day Journal Entries:** Seamlessly write, browse, and edit rich journal entries for any date.
- **Authentic Handwriting Aesthetic:** Beautiful handwriting typography using Google Fonts (**Caveat** and **Patrick Hand**) with adjustable sizing controls (**Normal**, **Large**, **Extra Large**).
- **Ruled Notebook Paper Styling:**
  - **Light Mode:** Warm parchment texture (`#fdfbf7`) with subtle light blue ruled lines (36px spacing) and soft red left margin line.
  - **Dark Mode:** Midnight journal aesthetic (`#1c1b18`) with warm golden/sepia ruled lines and spine depth shadow.
- **MyAnimeList (MAL) Style BBCode Support:** Full AST-based BBCode parsing with interactive toolbar:
  - Formatting: `[b]bold[/b]`, `[i]italic[/i]`, `[u]underline[/u]`, `[s]strikethrough[/s]`
  - Alignment: `[center]centered[/center]`, `[right]right-aligned[/right]`
  - Quotes: `[quote]Text[/quote]` and `[quote=Author]Quote text[/quote]` with styled quote box and icon
  - Interactive Spoilers: `[spoiler]Secret[/spoiler]` and `[spoiler=Warning]Hidden[/spoiler]` with click-to-reveal toggle
  - Media & Links: `[img]https://...[/img]`, `[url=https://...]link[/url]`
  - Colors & Sizing: `[color=#ef4444]red[/color]`, `[size=120%]larger text[/size]`
  - Structure & Code: `[list][*]item 1[*]item 2[/list]`, `[code]monospace code[/code]`
- **Real-Time Local Storage Drafts:** Whatever you type (title, mood, content) is instantly auto-saved to your browser's `localStorage` as an uncommitted draft.
- **Git-Style Explicit Commits (v1, v2, ...):** Content is **only sent to the server after you commit**. Each commit creates an immutable version (`v1`, `v2`, etc.) with fresh AES-256-GCM encryption, mirroring the statement tracker versioning model.
- **Uncommitted Pages Manager:** A dedicated slide-over / modal listing all uncommitted local pages across any date with options to jump directly to any page, commit individually to the server, or discard local changes to revert to the server state.
- **Visual Draft Indicators:** Real-time auto-save indicator while typing, uncommitted page badge counts on the top navigation bar and sidebar rail, and draft preview notices.
- **Live Split-Preview:** Side-by-side writing and real-time BBCode rendering on authentic notebook paper.
- **Mood Tracker:** Select daily feelings (☀️ Grateful, ☕ Calm, 🌙 Peaceful, 🌧️ Reflective, 🚀 Productive, 💭 Thoughtful).
- **Diary Version History:** Every committed edit preserves immutable historical versions (`v1`, `v2`, etc.) with timestamps, decryptable in the version history modal.

### 📝 Statements & Analytics
- **Date-Wise Organization:** Quick navigation (Previous Day, Next Day, Today) with native date picker.
- **Boolean Status:** Instant 1-click toggling between **TRUE** (vibrant green) and **FALSE** (vibrant red).
- **Immutable Versioning:** Edits create audited versions (`v1`, `v2`, etc.) without losing historical drafts.
- **Soft Deletion:** Entries are marked `deleted = true` to preserve the historical audit trail.
- **Summary & Analytics:** Filterable statistics and charts by date range, tag, and boolean distributions.
- **Activity Log:** Chronological audit trail recording `ADD`, `DELETE`, `EDIT`, `CHANGE_STATUS`, `ADD_DIARY`, `EDIT_DIARY`, and `DELETE_DIARY`.

### 🧭 Multi-Page Layout & Navigation
- **Collapsible Side Panel (Sidebar):** Quick desktop rail collapse/expand and responsive mobile drawer.
- **Unified Statements Hub:** Keeps Daily Statements List, Summary & Analytics, and Activity Log organized in one place.
- **Dedicated Diary Page:** Accessible via direct URLs (`/dairy` and `/statement`).
- **State Persistence:** Remembers the last opened page in `localStorage` (`false_last_page`), defaulting to `/statement`.
- **Direct SPA Routing:** Express server and Vercel rewrites serve `index.html` for client-side HTML5 history and hash navigation.

### 🛡️ Zero-Knowledge Client-Side Encryption (Version 1)
- **Algorithm:** AES-256-GCM
- **Key Derivation:** PBKDF2-HMAC-SHA256 with 600,000 iterations
- **Salt & Nonce:** Fresh 16-byte random salt and 12-byte nonce generated per version
- **Authentication Tag:** 16-byte (128-bit) integrity check
- **Master Password Security:** Master password and derived keys remain strictly in memory while unlocked. Never saved in localStorage, cookies, session storage, or sent across the network.
- **Unified Keyring:** Unlocking with your master password decrypts both statements and diary entries seamlessly.

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
│         ├── Plaintext Statement ──► Encrypted Envelope │
│         └── Plaintext Diary     ──► Encrypted Envelope │
│                                │                       │
└────────────────────────────────┼───────────────────────┘
                                 │ HTTP POST/PUT
                                 ▼
┌────────────────────────────────────────────────────────┐
│             Lightweight API Server (Backend)           │
│                                                        │
│  - Receives encrypted envelopes only                   │
│  - Never receives master password or plaintext content │
│  - Validates envelope schemas & saves to MongoDB       │
│  - Records append-only Activity Log (IDs & metadata)   │
└────────────────────────────────┼───────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────┐
│                        MongoDB                         │
│  - collections: `statements`, `diaryentries`,          │
│                 `activitylogs`                         │
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
- Node.js 20+ (tested on Node.js 20 and 24)
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
```bash
# 1. Build the frontend
npm run build

# 2. Start the unified server (serves API on /api and static UI)
npm start
```

Visit `http://localhost:5000` or `http://localhost:5000/dairy` in your browser.

To run Vite with hot-reload in development:
```bash
npm run dev:client
```

### Running the Test Suite
Run the built-in automated test suite covering crypto verification, statement operations, and diary operations (21 tests across 3 suites):

```bash
npm test
```

---

## 5. GitHub Actions CI & Branch Merging

Automated pull request and branch verification workflow is configured in [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
- **Triggers:** Push to `main`, `feature/**`, `feature-*`, and Pull Requests targeting `main`.
- **Automated Checks:**
  1. Installs root and client dependencies (`npm ci`).
  2. Executes complete automated test suite (`npm test`).
  3. Verifies frontend build for production (`npm run build`).

---

## 6. API Specification

### Statement Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/statements?date=YYYY-MM-DD` | Get all non-deleted statements for the given date |
| `POST` | `/api/statements` | Create a new statement (`status: true`, initial version `v1`, logs `ADD`) |
| `PUT` | `/api/statements/:id` | Edit statement content (creates new version `v2`, `v3`..., logs `EDIT`) |
| `PATCH` | `/api/statements/:id/status` | Toggle boolean status (does **not** create a version, logs `CHANGE_STATUS`) |
| `DELETE` | `/api/statements/:id` | Soft delete (`deleted: true`, logs `DELETE`) |
| `GET` | `/api/statements/:id/history` | Get full version history for a statement |
| `GET` | `/api/statements/summary` | Statement statistics & distributions |

### Diary ("Dairy") Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/diary?date=YYYY-MM-DD` | Get all non-deleted diary entries for the date |
| `GET` | `/api/diary/dates` | Get list of distinct active dates containing diary entries |
| `GET` | `/api/diary/summary` | Get diary summary statistics (total entries, active days, edits) |
| `POST` | `/api/diary` | Create a new encrypted diary entry (version `v1`, logs `ADD_DIARY`) |
| `PUT` | `/api/diary/:id` | Edit diary content (creates version `v2`, `v3`..., logs `EDIT_DIARY`) |
| `DELETE` | `/api/diary/:id` | Soft delete diary entry (`deleted: true`, logs `DELETE_DIARY`) |
| `GET` | `/api/diary/:id/history` | Get version history for a diary entry |

### System & Audit Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/activity-logs` | Retrieve chronological audit trail (most recent first) |
| `GET` | `/api/health` | Health check endpoint |

---

## 7. Hosting on Vercel

This application is ready to deploy on Vercel as a single full-stack project:
1. Push this branch or merge to `main` on your GitHub repository.
2. Import the project in Vercel.
3. Configure environment variables (`MONGODB_URI`, `DB_NAME`, `NODE_ENV=production`).
4. Deploy! Vercel will automatically build the frontend and serve backend serverless functions via `api/index.js` and `vercel.json`.
