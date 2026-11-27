# Akshaya Patra – Food Distribution Management System
## Mega-Kitchen Operations & Distribution Platform

**Database Engine:** PostgreSQL 16 (PL/pgSQL)  
**Backend:** Node.js (v20+) / Express.js REST API  
**Frontend:** React 19 / Vite + Tailwind CSS v4 + Lucide Icons  
**Deployment Ready:** Vercel, Render, Railway, Docker  

---

## 🌟 Highlights & Academic Criteria Covered

1. **Normalized Database Architecture (BCNF):**
   - 12 fully normalized tables designed to eliminate insertion, deletion, and update anomalies.
   - Comprehensive normalization documentation from **UNF $\rightarrow$ 1NF $\rightarrow$ 2NF $\rightarrow$ 3NF $\rightarrow$ BCNF** in [`docs/NORMALIZATION_PROOFS.md`](docs/NORMALIZATION_PROOFS.md).

2. **Automated PL/pgSQL Triggers:**
   - `trg_deduct_inventory`: Automates FIFO raw inventory deduction upon cooking batch completion, with automatic deficit detection and rollback.
   - `trg_check_dispatch`: Strictly prevents over-dispatching meals beyond actual batch production count.
   - `trg_audit_leftovers`: Auto-calculates student attendance gaps and leftover wastage.

3. **PL/pgSQL Stored Procedures & Functions:**
   - `sp_procure_stock`: Standardized warehouse lot inward receipt with immutable audit logs.
   - `sp_auto_generate_daily_dispatch`: Auto-schedules school delivery runs matching daily morning indents with completed kitchen batches.
   - `fn_school_wastage_rate`: Analytical calculation of 30-day percentage food loss per school.
   - `fn_get_donor_impact_summary`: Computes total meals subsidized and schools supported by a sponsor.

4. **12 Advanced Analytical SQL Queries:**
   - Multi-table JOINs across 5 tables, Window functions (`DENSE_RANK`, `ROW_NUMBER`, Running Totals), Common Table Expressions (CTEs), Correlated Subqueries, and Grouping Sets (`ROLLUP`). Full script in [`database/05_analytical_queries.sql`](database/05_analytical_queries.sql).

5. **Interactive DBMS Viva Playground:**
   - Built directly into the web UI! Allows students and examiners to test live SQL queries, inspect active triggers and procedures, view BCNF proofs, and observe before/after trigger states in real time.

---

## 🚀 Quick Start (One-Click Launch)

Ensure PostgreSQL is running locally on port 5432:

```bash
# 1. Run the all-in-one setup and launch script:
./start.sh
```

This will automatically:
1. Initialize the PostgreSQL database (`akshaya_patra_db`).
2. Apply schemas, PL/pgSQL triggers, procedures, views, and seed data.
3. Start the Express REST Backend on `http://localhost:5001`.
4. Start the Vite React Frontend on `http://localhost:5173`.

---

## 📂 Project Structure

```text
├── database/
│   ├── 01_schema.sql                  # 12 Normalized DDL Tables & Constraints
│   ├── 02_triggers_and_procedures.sql # PL/pgSQL Triggers, Stored Procs & Functions
│   ├── 03_views.sql                   # 5 Relational Reporting Views
│   ├── 04_seed_data.sql               # Indian Mega-Kitchen Operational Seed Data
│   ├── 05_analytical_queries.sql      # 12 Advanced Analytical SQL Queries
│   └── init_db.sh                     # Idempotent DB Reset & Migration Script
├── server/
│   ├── index.js                       # Express Application Server
│   ├── db.js                          # PostgreSQL Connection Pool & Logging
│   ├── routes/api.js                  # REST API Endpoints & DBMS Query Runner
│   └── tests/api.test.js              # Automated Backend Test Suite
├── client/
│   ├── src/App.jsx                    # Single Page App with 8 Functional Modules + DBMS Lab
│   ├── src/index.css                  # Tailwind CSS Styles
│   └── vite.config.js                 # Vite + Proxy Configuration
├── docs/
│   ├── DBMS_PROJECT_REPORT.md         # Comprehensive University Report
│   ├── NORMALIZATION_PROOFS.md        # Step-by-Step BCNF Mathematical Proofs
│   ├── VIVA_QUESTIONS_AND_ANSWERS.md  # 25 High-Frequency DBMS Viva Q&A
│   └── superpowers/plans/             # Implementation Specification & Plan
├── tests/
│   ├── db_schema_test.sh              # Schema & Constraint Verification Test
│   ├── db_logic_test.sql              # PL/pgSQL Trigger & Deficit Verification
│   └── queries_test.sh                # Analytical Query Execution Test
└── start.sh                           # One-Click Launch Script
```

---

## 🧪 Automated Testing

Run the full verification suite from the terminal:

```bash
# 1. Test DDL Schema & Constraints:
./tests/db_schema_test.sh

# 2. Test PL/pgSQL Triggers & Business Rules:
psql -d akshaya_patra_db -f tests/db_logic_test.sql

# 3. Test 12 Analytical SQL Queries:
./tests/queries_test.sh

# 4. Test REST API Endpoints:
cd server && npm test
```

---

## 🌐 Cloud Deployment Guide

### Option 1: Deploy to Vercel (Frontend + Serverless API)

Vercel hosts the React frontend and runs the Express API as serverless functions (`api/index.js`).

#### Step 1: Create a Free Cloud PostgreSQL Database
Since Vercel is serverless, you need a cloud PostgreSQL instance:
- **[Neon.tech](https://neon.tech)** (Recommended: Free Serverless PostgreSQL, 0.5 GB, 1-click Vercel integration)
- **[Supabase.com](https://supabase.com)** (Free PostgreSQL, 500 MB)
- Copy your connection string (`postgres://user:password@host/database?sslmode=require`).

#### Step 2: Initialize Database Schema & Seed Data
Run the automated cloud migration script from your terminal:
```bash
DATABASE_URL="your_neon_or_supabase_connection_string" npm run db:setup
```
This automatically applies all 12 normalized tables, PL/pgSQL triggers, views, and seed data.

#### Step 3: Deploy on Vercel
1. Push your repository to GitHub.
2. In [Vercel Dashboard](https://vercel.com), click **Add New Project** $\rightarrow$ **Import** your repository.
3. In the project settings, add the Environment Variable:
   - `DATABASE_URL` = `your_neon_or_supabase_connection_string`
4. Click **Deploy**. Vercel will build the frontend and serve both the web application and API endpoints seamlessly!

---

### Option 2: Deploy to Render (All-in-One: Frontend + API + PostgreSQL)

Render can host both the Node Web Service and a managed PostgreSQL database together.

1. Push your repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** $\rightarrow$ **Blueprint**.
3. Connect your repository. Render will detect [`render.yaml`](render.yaml) and automatically create:
   - A free managed PostgreSQL database (`akshaya-patra-postgres`)
   - A Node.js web service running the application
4. Once deployed, run `npm run db:setup` with the database connection string from Render.

