# Akshaya Patra – Food Distribution Management System
## DBMS Subject Awareness & Academic Capstone Project

**Student:** Rutwik  
**Course:** Database Management Systems (DBMS)  
**Database Engine:** PostgreSQL 16 (PL/pgSQL)  
**Backend:** Node.js (v25) / Express.js REST API  
**Frontend:** React 19 / Vite + Tailwind CSS v4 + Lucide Icons  

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

## 🎓 Academic Viva Cheat Sheet

Check [`docs/VIVA_QUESTIONS_AND_ANSWERS.md`](docs/VIVA_QUESTIONS_AND_ANSWERS.md) for detailed answers to top questions:
- *Why BCNF instead of 3NF?*
- *How does the trigger maintain ACID properties during batch completion?*
- *What is the difference between `RANK()` and `DENSE_RANK()`?*
- *How do CTEs optimize complex calculations compared to temporary tables?*
