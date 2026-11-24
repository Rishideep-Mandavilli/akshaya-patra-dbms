# 25 Master DBMS Viva Questions & Answers
## Akshaya Patra Food Distribution Management System
### Student: Rutwik

---

### Q1: What is the primary difference between 3NF and BCNF?
**Answer:**  
In 3NF, for every non-trivial functional dependency $X \rightarrow Y$, either $X$ must be a superkey OR $Y$ must be a prime attribute (part of a candidate key).  
In BCNF (Boyce-Codd Normal Form), the second condition is eliminated: **$X$ MUST strictly be a superkey**. BCNF prevents anomalies that can arise when there are overlapping composite candidate keys. Our schema meets BCNF across all 12 tables because every determinant is a superkey.

---

### Q2: How does your database prevent inventory deficits when cooking 5,000 meals?
**Answer:**  
We implemented a PL/pgSQL database trigger `trg_deduct_inventory` that fires `AFTER UPDATE OF status ON meal_batches` when status becomes `'COMPLETED'`.  
The trigger first iterates through `recipe_ingredients` for that menu and checks if the non-expired warehouse stock is sufficient. If even one ingredient is short, the trigger raises an exception:
`RAISE EXCEPTION 'INVENTORY DEFICIT: ...'`  
Because PostgreSQL triggers execute inside the update transaction, raising an exception aborts the update and rolls back the transaction, guaranteeing that stock can never drop below zero.

---

### Q3: What is the difference between a Database Trigger and a Stored Procedure?
**Answer:**  
- **Trigger:** An event-driven block of PL/pgSQL code automatically invoked by the DBMS in response to a DML event (`INSERT`, `UPDATE`, `DELETE`) on a specific table. A user cannot call a trigger directly.
- **Stored Procedure:** An explicit procedural routine invoked on demand using the `CALL` statement (e.g. `CALL sp_procure_stock(...)`). Procedures can manage transactions (`COMMIT`/`ROLLBACK`) and accept input/output parameters.

---

### Q4: Explain the ACID properties with an example from your project.
**Answer:**  
- **Atomicity (All-or-Nothing):** When batch completion is marked, the update of `meal_batches`, deductions from `stock_inventory`, and insertions into `stock_transactions` succeed together. If stock is insufficient, all changes roll back.
- **Consistency:** All check constraints (e.g. `current_qty <= initial_qty`, `expiry_date >= received_date`) and foreign keys remain valid before and after the transaction.
- **Isolation:** Multiple delivery vans dispatching meals concurrently do not read uncommitted batch quantities.
- **Durability:** Once a donation or stock intake is committed, the changes survive system restarts via PostgreSQL Write-Ahead Logging (WAL).

---

### Q5: Why did you separate `menus` and `recipe_ingredients` instead of storing ingredients in `menus`?
**Answer:**  
Storing multiple ingredients in a single `menus` tuple would create a repeating group, violating **First Normal Form (1NF)**. Creating a separate `recipe_ingredients` table establishes a normalized $M:N$ bridge (Bill of Materials) between `menus` and `food_items`, allowing each recipe to define precise per-meal quantities and units of measure.

---

### Q6: What referential integrity constraints (ON DELETE actions) are implemented and why?
**Answer:**  
- **`ON DELETE CASCADE`** on `recipe_ingredients(menu_id)`: If a menu is deleted, its recipe proportions should be automatically removed.
- **`ON DELETE RESTRICT`** on `stock_inventory(item_id)` and `meal_batches(menu_id)`: Prevents accidental deletion of master food items or menus if active warehouse stock or historical cooking records exist.
- **`ON DELETE SET NULL`** on `institutions(route_id)`: If a delivery route is decommissioned, schools assigned to it are not deleted; their route reference is safely set to NULL until reassigned.

---

### Q7: What are Common Table Expressions (CTEs) and where did you use them?
**Answer:**  
A CTE (`WITH` clause) creates a temporary, named result set that exists only within the execution scope of a single SQL query.  
In **Query 6 (Batch Production Economics)**, we used a CTE `BatchIngredientCosts` to join consumption transactions with warehouse unit purchase prices, and then joined the outer query with `meal_batches` to calculate the exact raw material cost per cooked meal.

---

### Q8: What is a Window Function and how does it differ from a `GROUP BY`?
**Answer:**  
- `GROUP BY` collapses multiple rows into a single summary row for each group.
- **Window Functions** (`OVER (PARTITION BY ... ORDER BY ...)`) perform calculations across a set of table rows related to the current row, but **retain individual row identities** without collapsing.  
In our project, we used `DENSE_RANK() OVER (PARTITION BY route_id ORDER BY total_enrolled DESC)` to rank schools within each route without losing individual school records.

---

### Q9: What is the purpose of the `stock_transactions` table if you already have `stock_inventory`?
**Answer:**  
`stock_inventory` stores the current state (current balance, location, expiry). However, in inventory management, an **immutable audit ledger** (`stock_transactions`) is required to trace every historical change (procurement, cooking consumption, spoilage disposal). This eliminates repudiation and allows auditors to reconstruct past inventory balances.

---

### Q10: How does your schema prevent over-dispatching meals to schools?
**Answer:**  
We implemented the `trg_check_dispatch` trigger (`BEFORE INSERT OR UPDATE ON dispatch_deliveries`). It queries the parent batch's `actual_servings` and checks:
`SUM(meals_dispatched) + NEW.meals_dispatched <= actual_servings`  
If a user attempts to dispatch more meals than were actually cooked, the trigger raises an `OVER-DISPATCH INTEGRITY VIOLATION` exception.

---

### Q11: What is a Surrogate Key versus a Natural Key in your project?
**Answer:**  
- **Surrogate Key:** Artificial numeric identifiers generated by the database sequence, such as `item_id SERIAL PRIMARY KEY` or `batch_id SERIAL PRIMARY KEY`. They are compact, immutable, and optimize foreign key joins.
- **Natural Key:** Real-world unique attributes, such as `school_code` (e.g. `SCH-BLR-001`), `pan_number`, and `tax_exemption_80g_receipt`. We enforced `UNIQUE` constraints on all natural keys.

---

### Q12: Why did you use PostgreSQL instead of MySQL or SQLite?
**Answer:**  
PostgreSQL offers superior support for advanced SQL standards:
1. Native PL/pgSQL procedural language with rich exception handling and trigger granularity (`BEFORE`/`AFTER`, row-level vs. statement-level).
2. Comprehensive support for Window functions, Common Table Expressions (`WITH`), and grouping sets (`ROLLUP`, `CUBE`).
3. Robust ACID transaction support with Write-Ahead Logging (WAL).
4. Strict domain and table `CHECK` constraints (e.g. temperature ranges, quantity non-negativity).

---

### Q13: What indexes did you create and what is their performance impact?
**Answer:**  
We created B-Tree indexes on:
- `stock_inventory(item_id)` and `stock_inventory(expiry_date)`: Accelerates FIFO inventory searches during cooking batch deduction.
- `meal_batches(prep_date)` and `meal_batches(status)`: Optimizes daily dashboard queries.
- Foreign keys like `institutions(route_id)` and `donations(sponsor_id)`: Eliminates full table scans during multi-table joins.

---

### Q14: What is the difference between `RANK()` and `DENSE_RANK()`?
**Answer:**  
Both assign ranks based on an `ORDER BY` clause. If duplicate values occur:
- `RANK()` skips ranks (e.g., 1, 2, 2, 4).
- `DENSE_RANK()` does not skip ranks (e.g., 1, 2, 2, 3).  
We used `DENSE_RANK()` in Query 4 so schools with identical student counts share a rank without leaving gaps in route position.

---

### Q15: How are school leftovers and meal wastage tracked?
**Answer:**  
In `daily_indents`, schools submit their morning headcount request (`requested_meals`). In the afternoon, actual present students are recorded (`actual_present_students`). A trigger `trg_audit_leftovers` automatically calculates `leftover_meals = requested_meals - actual_present_students`.  
A stored function `fn_school_wastage_rate(institution_id, 30)` calculates the rolling 30-day percentage of food loss.

---

### Q16: What is a Correlated Subquery and where is it used?
**Answer:**  
A correlated subquery is a subquery that references columns from the outer query for each evaluated row.  
In **Query 7**, we used a correlated subquery to compare each school's leftover meals against the average leftover count for that specific calendar date.

---

### Q17: What is the purpose of Database Normalization? What are its trade-offs?
**Answer:**  
- **Purpose:** Eliminates redundancy, prevents update/insert/delete anomalies, and guarantees referential consistency.
- **Trade-off:** Highly normalized schemas require multi-table `JOIN` operations to reconstruct comprehensive views, which can increase CPU overhead if appropriate foreign key indexes are not created.

---

### Q18: What is a Lossless-Join Decomposition?
**Answer:**  
A decomposition of relation $R$ into $R_1$ and $R_2$ is lossless with respect to a set of functional dependencies $F$ if and only if $R_1 \bowtie R_2 = R$.  
Mathematically, the intersection of $R_1$ and $R_2$ must contain a candidate key for either $R_1$ or $R_2$ ($R_1 \cap R_2 \rightarrow R_1$ or $R_1 \cap R_2 \rightarrow R_2$). In our project, every foreign key references a candidate key in the parent relation, guaranteeing lossless joins.

---

### Q19: What is Dependency Preservation in Relational Design?
**Answer:**  
A decomposition preserves dependencies if the union of functional dependencies in the decomposed relations logically implies all dependencies in the original relation ($F' \equiv F$). In our schema, all business rules and functional dependencies can be enforced using primary and foreign key constraints without requiring cross-table assertions.

---

### Q20: Explain the function of `ROLLUP` in Query 8.
**Answer:**  
`GROUP BY ROLLUP(s.organization_type, inst.name)` generates hierarchical subtotal aggregates:
1. Subtotals per organization type and school.
2. Subtotals per organization type across all schools.
3. A grand total across all organization types and schools.

---

### Q21: What check constraints are implemented in your DDL?
**Answer:**  
1. `food_items.category IN ('GRAIN', 'PULSE', 'VEGETABLE', 'OIL_SPICE', 'DAIRY', 'CONDIMENT')`
2. `stock_inventory.expiry_date >= received_date`
3. `stock_inventory.current_qty <= initial_qty`
4. `meal_batches.food_temp_celsius BETWEEN 50.0 AND 100.0`
5. `dispatch_deliveries.arrival_time >= departure_time`

---

### Q22: How does your system support Food Safety Compliance?
**Answer:**  
Cooked mid-day meals must be served hot (≥60°C) to prevent bacterial growth. The database stores cooking cauldrons' temperatures (`meal_batches.food_temp_celsius`) and receipt temperatures upon arrival at schools (`dispatch_deliveries.delivery_temp_celsius`).  
**Query 9** audits the temperature drop between cooking and delivery, flagging any delivery under 65°C.

---

### Q23: How does the backend communicate with PostgreSQL?
**Answer:**  
The Node.js backend uses the official `pg` (node-postgres) connection pool client. It executes parameterized queries (`$1, $2, ...`) to eliminate SQL injection vulnerabilities. When a trigger raises an exception, the client intercepts the database error and relays the diagnostic message to the user interface with HTTP status 400.

---

### Q24: What is the difference between a Database View and a Materialized View?
**Answer:**  
- **Standard View (`CREATE VIEW`):** A saved virtual query that does not store data on disk; it executes dynamically each time it is queried. We used standard views (`v_daily_kitchen_summary`, `v_low_stock_alerts`) so changes in inventory are immediately reflected.
- **Materialized View:** Stores the query result physically on disk and must be explicitly refreshed (`REFRESH MATERIALIZED VIEW`), ideal for heavy analytics over static historical data.

---

### Q25: If you had to scale this system to 100 mega-kitchens across India, what database architecture changes would you recommend?
**Answer:**  
1. **Multi-Tenancy & Partitioning:** Range partition `dispatch_deliveries` and `stock_transactions` by `dispatch_date` (monthly partitions) and list partition by `kitchen_id` (state/region).
2. **Read Replicas:** Route heavy analytical reporting and donor dashboards to read replicas using connection pooling (e.g. PgBouncer).
3. **Geo-Distributed Replication:** Maintain local kitchen database instances that sync aggregated dispatches to a centralized cloud PostgreSQL warehouse.
