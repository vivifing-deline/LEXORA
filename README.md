# LEXORA — Modern Legal Practice Management Platform

> **"Clarity in Every Case."**

LEXORA is a multi-user, enterprise-grade legal practice management platform designed for advocates, law firms, litigation teams, and legal departments. It unifies legal CRM, case management, litigation workflows, document management, court calendars, task management, financial management, and legal knowledge management.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: Angular 21, TypeScript, SCSS, Lucide Icons, Reactive Forms, Component-driven Architecture.
- **Backend**: Node.js, Express.js (v4), REST API versioned under `/api/v1`.
- **Database**: SQLite with Prisma ORM, versioned migrations, relational schema with foreign key integrity.
- **Authentication & Security**: JWT authentication, bcrypt password hashing, granular Role-Based Access Control (RBAC), and server-side authorization middleware.
- **Storage**: Local filesystem storage with mime-type validation, randomized naming, and access-controlled streaming.

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18 (Recommended: v20 LTS)
- npm >= 9

### Quick Start

1. **Clone & Setup**:
   ```bash
   cd LEXORA
   ```

2. **Install Server Dependencies & Initialize Database**:
   ```bash
   cd server
   npm install
   npx prisma generate
   npx prisma db push
   npx tsx prisma/seed.ts
   ```

3. **Install Client Dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Run Both Services**:
   - Backend API:
     ```bash
     cd server
     npm run dev
     # Runs on http://localhost:5000 (API at http://localhost:5000/api/v1)
     ```
   - Frontend Client:
     ```bash
     cd client
     npm start
     # Runs on http://localhost:4200
     ```

---

## 🔑 Demo Accounts

All demo accounts are configured with the password: `Demo@123`

| Role | Email | Password |
|---|---|---|
| **Firm Admin** | `admin@lexora.demo` | `Demo@123` |
| **Senior Advocate** | `senior@lexora.demo` | `Demo@123` |
| **Associate Advocate** | `associate@lexora.demo` | `Demo@123` |
| **Junior Advocate** | `junior@lexora.demo` | `Demo@123` |
| **Legal Clerk** | `clerk@lexora.demo` | `Demo@123` |
| **Accountant** | `accountant@lexora.demo` | `Demo@123` |
| **Client Portal** | `client@lexora.demo` | `Demo@123` |

---

## 📂 Project Structure

```text
LEXORA/
├── client/                     # Angular Single Page Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Auth, Guards, Interceptors, Core Services
│   │   │   ├── shared/         # Reusable UI Components, Directives, Pipes
│   │   │   ├── layouts/        # App Shell, Sidebar, Header, Mobile Nav
│   │   │   └── features/       # Feature Modules (Cases, Clients, Finance, etc.)
│   │   └── styles/             # Global SCSS, Design Tokens, Themes
├── server/                     # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Relational SQLite Schema
│   │   └── seed.ts             # Realistic Seed Data
│   └── src/
│       ├── config/             # DB, Environment & Config
│       ├── middleware/         # Auth, RBAC, Validation, Error Handler
│       ├── modules/            # Feature Controllers, Services, Validators
│       ├── routes/             # Versioned API routes (/api/v1)
│       └── utils/              # Response envelope, Logger, Hashing
├── storage/                    # Local File Storage
│   └── uploads/                # Uploaded pleadings, orders, evidence
└── README.md
```

---

## ⚖️ Design System

LEXORA features a bespoke, premium enterprise design foundation:
- **Primary Color**: Deep Indigo (`#4F46E5`)
- **Accent**: Electric Violet (`#8B5CF6`)
- **Neutral Surface**: Slate (`#64748B`, `#0F172A`)
- **Status Colors**: Success (`#16A34A`), Warning (`#F59E0B`), Danger (`#EF4444`)
- **Modes**: Native Light Mode and Dark Mode with persistent theme selection.

