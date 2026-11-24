# Akshaya Patra Food Distribution Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-grade, aesthetically rich full-stack web application for the Akshaya Patra Mega-Kitchen Food Distribution Management System, complete with full academic DBMS deliverables (ER Diagram, Normalization up to BCNF, DDL/DML, PL/pgSQL Triggers/Procedures, Complex Analytical Queries, and an interactive Viva & SQL playground).

**Architecture:** A normalized 12-table PostgreSQL database with advanced PL/pgSQL procedural logic, an Express/Node.js REST API providing transactional endpoints and raw SQL execution, and a responsive Tailwind CSS + React (Vite) single-page application featuring both operational kitchen/distribution management and an integrated DBMS concept explorer for academic presentation.

**Tech Stack:** PostgreSQL 16 (PL/pgSQL), Node.js v25, Express.js, `pg` client, React 19 / Vite, Tailwind CSS v4, Lucide Icons.

**Spec:** `docs/superpowers/specs/2026-11-24-akshaya-patra-dbms-design.md`

## Global Constraints
- Target database: PostgreSQL 16 on `localhost:5432`, database name `akshaya_patra_db`.
- Database authentication: standard local peer/user connection (`user: rishideep` or environment defaults).
- Port assignments: Backend API on port `5001` (to avoid macOS AirPlay conflict on 5000); Frontend Vite server on port `5173`.
- Strict relational constraints: Primary keys, Foreign keys with appropriate `ON DELETE` rules, `CHECK` constraints on quantities, temperatures, and status enums.
- Idempotent scripts: Schema and seed scripts must run cleanly via `psql -f` multiple times without error.

## Review Focus
1. Inventory Deduction Transaction Integrity: Trigger must roll back batch completion if stock for any ingredient is insufficient, without leaving orphaned partial transactions.
2. Over-Dispatch Prevention: Total meals allocated to schools must strictly not exceed actual cooked batch quantity.
3. Normalization Rigor: Every table strictly adheres to BCNF; functional dependencies must be clearly documented.
4. Viva Demonstration Readiness: UI must provide live interactive testing of SQL queries and PL/pgSQL triggers directly from the browser.
5. Error Handling: Frontend must capture and display user-friendly database constraint violations (e.g. check constraints, foreign key restrictions).

---

### Task 1: Database Setup, Normalized DDL Schema & Referential Constraints

**Files:**
- Create: `database/01_schema.sql`
- Create: `database/init_db.sh`
- Test: `tests/db_schema_test.sh`

- [ ] Write `database/01_schema.sql` defining all 12 tables (`food_items`, `stock_inventory`, `stock_transactions`, `menus`, `recipe_ingredients`, `meal_batches`, `delivery_routes`, `institutions`, `daily_indents`, `dispatch_deliveries`, `sponsors`, `donations`) with UUIDs or SERIAL PKs, FK constraints, NOT NULL constraints, CHECK constraints, and optimized indexes.
- [ ] Create `database/init_db.sh` to safely drop, recreate `akshaya_patra_db`, and apply the schema.
- [ ] Write `tests/db_schema_test.sh` to verify table creation, foreign key constraints, and check constraints.
- [ ] Execute `database/init_db.sh` and run `tests/db_schema_test.sh`.

---

### Task 2: PL/pgSQL Triggers, Stored Procedures, Functions & Views

**Files:**
- Create: `database/02_triggers_and_procedures.sql`
- Create: `database/03_views.sql`
- Test: `tests/db_logic_test.sql`

- [ ] Implement `trg_deduct_inventory_on_batch_completion` to automate FIFO inventory deduction upon batch completion.
- [ ] Implement `trg_prevent_over_dispatch` to enforce that dispatch count does not exceed batch production.
- [ ] Implement `sp_auto_generate_daily_dispatch` to match daily indents with batches and generate deliveries.
- [ ] Implement analytical functions: `fn_school_wastage_report` and `fn_get_donor_impact_summary`.
- [ ] Implement useful SQL Views: `v_daily_kitchen_summary`, `v_low_stock_alerts`, `v_route_delivery_status`, and `v_donor_contribution_report`.
- [ ] Write `tests/db_logic_test.sql` and verify via `psql` that triggers fire as expected and throw correct errors when constraints fail.

---

### Task 3: Realistic Seed Data & Analytical SQL Queries

**Files:**
- Create: `database/04_seed_data.sql`
- Create: `database/05_analytical_queries.sql`
- Test: `tests/queries_test.sh`

- [ ] Write rich, realistic Indian mid-day meal seed data (Rice, Sambar, Vegetable Pulao, Curd, Chana Dal; 6 real Bangalore schools; 4 delivery routes; 10 sponsors with genuine-looking donations; multiple batches and indents).
- [ ] Develop 12 complex analytical SQL queries covering: Multi-table JOINs, GROUP BY with HAVING, Window functions (`ROW_NUMBER()`, `RANK()`), Common Table Expressions (CTEs), Subqueries, and Date arithmetic.
- [ ] Verify query execution and validate output sanity via `tests/queries_test.sh`.

---

### Task 4: Node.js Express REST Backend & Database Adapter

**Files:**
- Create: `server/package.json`
- Create: `server/db.js`
- Create: `server/index.js`
- Create: `server/routes/api.js`
- Test: `server/tests/api.test.js`

- [ ] Initialize Node.js project in `server/` with `express`, `cors`, `pg`, `dotenv`.
- [ ] Implement `server/db.js` pool connection with auto-retry and query logging.
- [ ] Implement REST endpoints for all 8 modules (Menus, Items, Stock, Batches, Routes, Institutions, Indents, Dispatches, Sponsors, Donations).
- [ ] Implement special DBMS endpoints: `/api/dbms/schema`, `/api/dbms/execute-query`, `/api/dbms/views`, `/api/dbms/triggers-info`.
- [ ] Write automated endpoint tests and verify all routes return 200 OK with expected JSON.

---

### Task 5: React + Vite + Tailwind CSS Frontend Application

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/src/App.jsx`
- Create: `client/src/components/*` (Dashboard, Menu, Inventory, Batches, Logistics, Schools, Sponsors, Reports, DBMSPlayground)
- Test: Build verification (`npm run build`)

- [ ] Scaffold Vite React application with Tailwind CSS and Lucide React icons.
- [ ] Create an intuitive, brand-appropriate layout matching Akshaya Patra's warm humanitarian identity (gold, saffron, deep green accents).
- [ ] Build functional management screens for:
  - 1. Executive Dashboard (KPI metrics, today's status)
  - 2. Menu & Recipe Management (BOM calculator)
  - 3. Food Stock & Inventory Ledger (Low stock warnings, add inward stock)
  - 4. Meal Preparation & Batch Cooking (with live "Complete & Deduct Stock" action)
  - 5. School Distribution & Logistics (Route vehicle tracker, mark delivered)
  - 6. Institutions & Daily Indents (Attendance & wastage logging)
  - 7. Sponsors & Impact Certificates (Donation entry, auto-generated certificate)
- [ ] Build the dedicated **DBMS Academic & Viva Explorer**:
  - Interactive ER Diagram viewer (interactive nodes & relationships)
  - Normalization Walkthrough (1NF -> 2NF -> 3NF -> BCNF with functional dependency proofs)
  - Live SQL Query Runner (execute custom or pre-set queries with table results)
  - Trigger & Procedure demonstrator (simulate triggers with live before/after state)
- [ ] Test frontend build with `npm run build`.

---

### Task 6: Comprehensive Academic Documentation & Viva Preparation Package

**Files:**
- Create: `docs/DBMS_PROJECT_REPORT.md`
- Create: `docs/ER_DIAGRAM.png` or SVG/Mermaid
- Create: `docs/NORMALIZATION_PROOFS.md`
- Create: `docs/VIVA_QUESTIONS_AND_ANSWERS.md`
- Create: `README.md`
- Create: `start.sh`

- [ ] Write an exhaustive `DBMS_PROJECT_REPORT.md` formatted for university submission:
  - Problem definition, requirements specification
  - Entity-Relationship (ER) model and Cardinality
  - Relational Schema mapping
  - Complete Normalization proofs for all tables
  - Full DDL, DML, Triggers, Stored Procedures, and Analytical Queries with explanations
- [ ] Write `docs/VIVA_QUESTIONS_AND_ANSWERS.md` detailing 25 expected viva questions with answers (ACID properties, BCNF vs 3NF, Trigger vs Stored Procedure, Cascade constraints, Indexing, View performance).
- [ ] Provide a root `start.sh` script to set up the database and launch the application seamlessly.

---

### Task 7: End-to-End Verification via Subagents & Visual Inspection

- [ ] Dispatch a testing subagent to verify database integrity, constraints, and PL/pgSQL trigger mechanics.
- [ ] Dispatch a verification subagent to test all backend REST APIs and simulate edge cases (e.g. insufficient inventory, over-dispatch).
- [ ] Launch both backend and frontend servers, perform live end-to-end verification.
- [ ] Prepare an executive summary walkthrough for Rutwik.
