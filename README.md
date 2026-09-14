# Software Security Code Review Checklist (SecureShield AppSec)

A complete, production-ready, interactive cybersecurity web application designed for software developers, application security (AppSec) auditors, and engineering teams to systematically verify security controls during code reviews, track vulnerabilities, compute real-time risk scores, and generate professional PDF audit reports.

---

## 🛡️ Key Features & Capabilities

1. **Authentication & Role-Based Access Control (RBAC)**:
   - Secure password hashing using **bcrypt** (work factor 10).
   - Stateless JWT tokens with strict signature verification and claims.
   - Dual dashboards and access levels: **Administrator** and **Developer / Reviewer**.
   - Built-in **1-Click Demo Role Switcher** for instant live viva and project demonstrations.

2. **Interactive 12-Category Security Checklist (34 Master Controls)**:
   - **XSS Prevention**: Context-aware encoding, safe DOM sink usage, Content Security Policy (CSP).
   - **CSRF Protection**: SameSite cookie policies, anti-CSRF tokens, idempotent GET methods.
   - **Authentication & Authorization**: Broken Object Level Auth (BOLA/IDOR), RBAC enforcement, MFA & step-up verification.
   - **Input Validation & Sanitization**: Strict allow-list schemas, file upload magic bytes verification, mass assignment prevention.
   - **Session Management**: HttpOnly/Secure cookie flags, session rotation on privilege change, absolute timeouts.
   - **Password Security**: Strong cryptographic hashing (bcrypt/Argon2), complexity rules, rate limiting brute-force attempts.
   - **Secure API Handling**: JWT signature validation & algorithm pinning, CORS allow-lists, global rate quotas.
   - **SQL Injection Prevention**: Parameterized queries, column sorting allow-lists, least privilege DB accounts.
   - **Sensitive Data Protection**: Zero hardcoded credentials, TLS 1.2+ encryption in transit, log masking of PII & secrets.
   - **Security Headers**: HSTS, clickjacking defense (X-Frame-Options), nosniff, Referrer-Policy.
   - **Error Handling & Logging**: Generic error messages (no stack trace leaks), immutable security audit logs.
   - **Dependency / Library Security**: Software Composition Analysis (SCA), lockfile cryptographic verification.

3. **Dynamic Scoring & Risk Assessment Engine**:
   - Real-time scoring algorithm based on severity weights:
     - **Critical** failure: heavy penalty cap (maximum 50% score).
     - **High** failure: severe deduction.
     - **Medium / Low** failure: moderate deduction.
   - Automated letter grade (`A+`, `A`, `B`, `C`, `D`, `F`) and compliance ratings (`Compliant`, `Good Posture`, `Moderate Risk`, `High Risk`, `Critical Risk`).

4. **Auditor Workspace & Evidence Recorder**:
   - Tactile 3-state control toggles (`Pass`, `Fail`, `Not Reviewed`).
   - Side-by-side **Vulnerable vs. Secure Code Patterns** with 1-click code copying.
   - Dedicated fields for **Affected File Path**, **Line Numbers**, **Code Proof-of-Concept**, and **Reviewer Remediation Actions**.
   - Non-blocking auto-saving on blur with instant feedback.
   - Batch actions: *Mark All Unreviewed in Category as Passed* for audit velocity.

5. **Executive PDF Audit Report Generator**:
   - Executive audit summary and strategic remediation roadmap.
   - Metric summary cards (Total Controls, Passed, Failed, Critical Risks, High Risks).
   - Category compliance breakdown progress indicators.
   - Detailed vulnerability findings with affected file locations, PoC code evidence, and remediation steps.
   - Complete 34-control checklist matrix appendix.
   - Formal sign-off block with Lead Auditor and Engineering Lead signatures.
   - One-click client-side export to downloadable PDF (`jsPDF` + `jspdf-autotable`) and print stylesheet.

6. **Repository & Governance Management**:
   - Codebase catalog with repository URLs, technology stacks, lead developers, and average compliance history.
   - Immutable audit trail tracking review creation, vulnerability flagging, status changes, and sign-offs.

---

## 🏗️ Architecture & Technology Stack

```
   ┌─────────────────────────────────────────────────────────┐
   │            React 18 + Vite Frontend (Port 5173)         │
   │  Tailwind CSS • Lucide Icons • jsPDF • canvas-confetti  │
   └────────────────────────────┬────────────────────────────┘
                                │ HTTP / REST API (JWT Bearer)
   ┌────────────────────────────▼────────────────────────────┐
   │             Node.js + Express Backend (Port 5000)        │
   │  Helmet • Express-Rate-Limit • CORS • bcryptjs • JWT     │
   └────────────────────────────┬────────────────────────────┘
                                │ SQL (Parameterized Queries)
   ┌────────────────────────────▼────────────────────────────┐
   │        Relational Database (Auto-Migrated & Seeded)     │
   │  SQLite (Zero-Config Persistent) OR External PostgreSQL │
   └─────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation & Launch

1. Open a terminal in the project directory:
   ```bash
   npm start
   ```
   *(Or double-click `start.bat` on Windows)*

2. This automatically boots both the backend API and frontend dev server:
   - **Frontend Web UI**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
   - **Health Check**: [http://localhost:5000/health](http://localhost:5000/health)

---

## 🔑 Pre-Seeded Demo Accounts (Viva Presentation Ready)

The application includes pre-configured demo accounts ready for demonstration:

| Role | Username / Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@secureshield.io` | `Admin@123456` | Security Admin (full project & audit management) |
| **🔍 Reviewer** | `reviewer@secureshield.io` | `Reviewer@123456` | Security Reviewer (checklist execution & evidence logging) |
| **💻 Developer** | `dev@secureshield.io` | `Dev@123456` | Developer (remediation tracking & project status) |

> 💡 **Viva Tip**: Use the **"Demo Role"** buttons located in the top navigation bar to switch between Admin, Reviewer, and Developer views in one click without re-typing credentials!

---

## 🎓 College Viva & Demonstration Guide

Follow this step-by-step workflow during your project demonstration:

1. **Demonstrate Role Dashboards**:
   - Start as **Admin**: Show global metrics (Total Audits, Critical Risks, Average Security Score, Top Failed Categories chart, Recent Audits).
   - Switch to **Reviewer**: Show assigned audits queue with progress bars and outstanding high/critical risks.

2. **Create a New Security Review (Admin)**:
   - Click **"+ New Security Review"**.
   - Select a project (e.g. `FinTech Core Payment Gateway`), assign `Security Reviewer`, set deadline, and click **Create**.
   - Notice that the review automatically initializes all **34 security controls across 12 categories**.

3. **Interactive Security Audit & Evidence Recording (Reviewer)**:
   - Open the review in the **Interactive Workspace**.
   - Inspect the **Real-time Security Score Gauge** (starts at 0% / Grade F).
   - Navigate through categories (e.g. *SQL Injection Prevention*, *XSS Prevention*, *Authentication & Authorization*).
   - Click **"View Vulnerable vs Secure Code Pattern"** to show the examiner the built-in educational CWE code samples.
   - Click **✓ Pass** on several controls: observe the score immediately increase in real-time.
   - Click **✕ Fail** on a Critical control (e.g., `SQLI-01`): observe the score capped at 50% with an alert badge.
   - Enter **Affected File Path** (`src/controllers/search.js`), **Line Numbers** (`44-48`), and paste a code snippet into **Evidence**.
   - Notice the green **"Control updated & score recalculated"** auto-save indicator.

4. **Finalize Audit & Generate Professional PDF Report**:
   - Click **"Complete & Finalize Audit"**.
   - Review executive summary and click **"Mark as Completed"** (triggers celebratory confetti animation).
   - Click **"View Security Report"** to view the audit summary, compliance breakdown, vulnerability findings table, and appendix.
   - Click **"Download PDF Report"** to export an executive PDF audit report.

5. **Security Controls Knowledge Catalog**:
   - Navigate to **"Security Controls Guide"** in the sidebar.
   - Search for specific vulnerabilities like `CWE-79` (XSS), `CWE-89` (SQLi), or `CWE-352` (CSRF).
   - Show side-by-side vulnerable vs secure code blocks with copy capability.

---

## ☁️ Deploying to Render (Cloud Hosting Guide)

The platform is configured for single-service fullstack deployment on Render ([render.com](https://render.com)).

### Render Web Service Settings

| Setting | Value | Notes |
| :--- | :--- | :--- |
| **Service Type** | **Web Service** | Free tier supported |
| **Language / Environment** | **Node** | Node.js 18+ |
| **Root Directory** | *(leave blank)* | Defaults to repository root `./` |
| **Build Command** | `npm run build` | Builds client Vite SPA and dependencies |
| **Start Command** | `npm start` | Launches production Express server (`0.0.0.0:${PORT}`) |
| **Auto-Deploy** | `Yes` | Deploys on git push |

### Required Environment Variables (Render Dashboard → Environment)

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations and error masking |
| `PORT` | `10000` | Render assigns this automatically (fallback: 5000) |
| `JWT_SECRET` | *(Random 32+ char string)* | Cryptographic key used to sign session tokens |

### Optional Environment Variables

| Variable | Example Value | When to Use |
| :--- | :--- | :--- |
| `CORS_ORIGIN` | `https://my-domain.com` | Only if connecting an external domain or separated frontend |
| `VITE_API_URL` | `https://my-api.onrender.com` | Only if deploying the React frontend on a separate Static Site |
| `DATABASE_URL` | `postgres://user:pass@host/db` | Optional: switch from SQLite to external PostgreSQL |

### 💾 Important Note on SQLite on Render Free Tier
- **Zero Configuration**: The application runs on **SQLite** (`server/data/security_review.db`) with zero setup or external services required.
- **Ephemeral Storage**: Render free-tier Web Services use ephemeral disks. When the container sleeps after 15 minutes of inactivity or upon a new deployment, the SQLite database resets. On boot, the server automatically re-initializes tables and re-seeds all default controls and demo accounts.
- **Persistent Alternative**: If you want persistent review history across redeployments, you can create a free **PostgreSQL Database** on Render and set the `DATABASE_URL` environment variable. The backend automatically detects PostgreSQL and connects without code changes.

