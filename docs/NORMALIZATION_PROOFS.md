# Normalization Walkthrough & Proofs (UNF to BCNF)
## Akshaya Patra Food Distribution Management System

**Subject:** Database Management Systems (DBMS)  
**Student:** Rutwik  
**Target Normal Form:** Boyce-Codd Normal Form (BCNF)

---

## 1. Functional Dependencies & Normalization Objectives

Normalization is the process of structuring a relational database to reduce data redundancy and improve data integrity. In this project, the goal is to systematically decompose unnormalized production data into Boyce-Codd Normal Form (BCNF) while preserving functional dependencies and ensuring lossless joins.

---

## 2. Step 1: Unnormalized Form (UNF)

In a naive operational kitchen paper register, records are stored as flat rows with repeating groups:

```text
KITCHEN_REGISTER_UNF (
    BatchCode, PrepDate, MenuName, MealCategory,
    HeadCook, CookingTemp,
    { IngredientName, IngredientCategory, UOM, QtyPerMeal, UnitCost },
    { SchoolCode, SchoolName, PrincipalName, RouteCode, DriverName, VehicleNumber, MealsDispatched, DeliveryTemp, ReceivedBy },
    { SponsorName, SponsorOrgType, SponsorPAN, DonationAmount, ReceiptNo }
)
```

### Violations in UNF:
- **Repeating Groups**: Multiple ingredients per batch; multiple schools and deliveries per batch; multiple donations per meal program.
- **Non-Atomic Attributes**: Inconsistent multivalued rows.

---

## 3. Step 2: First Normal Form (1NF)

### 1NF Definition:
A relation $R$ is in 1NF if and only if:
1. Every attribute domain contains only atomic (indivisible) values.
2. There are no repeating groups or multivalued arrays.
3. Each record is uniquely identified by a primary key.

### Decomposition into 1NF:
We flatten the repeating groups by introducing synthetic and composite candidate keys:
- Separate Menu & Ingredients into separate tuples.
- Separate Batch & School Dispatches into individual row entries.
- Ensure all attributes hold scalar values (e.g., numbers, text, dates).

### Problem Remaining after 1NF:
Large composite tables such as `BATCH_DISPATCH_1NF(BatchCode, SchoolCode, ...)` suffer from **Partial Dependencies** where non-key attributes depend on only part of the candidate key.

---

## 4. Step 3: Second Normal Form (2NF)

### 2NF Definition:
A relation $R$ is in 2NF if:
1. It is already in 1NF.
2. **No non-prime attribute is partially dependent on any candidate key** (i.e. every non-prime attribute is fully functionally dependent on the entire primary key).

### Analyzing Candidate Keys & Partial Dependencies:

Consider the composite relation `RECIPE_BOM_CANDIDATE(menu_id, item_id, item_name, category, uom, qty_per_meal, shelf_life)`:
- Candidate Key: `(menu_id, item_id)`
- Functional Dependencies:
  - `(menu_id, item_id) -> qty_per_meal` *(Full dependency)*
  - `item_id -> item_name, category, uom, shelf_life` *(Partial dependency! Depends only on item_id, not menu_id)*

### 2NF Decomposition:
To eliminate this partial dependency, we decompose into:
1. **`food_items(item_id, item_name, category, uom, min_stock_threshold, shelf_life_days)`**
   - Primary Key: `item_id`
   - FD: `item_id -> item_name, category, uom, min_stock_threshold, shelf_life_days`
2. **`recipe_ingredients(recipe_id, menu_id, item_id, qty_per_meal, uom)`**
   - Primary Key: `recipe_id` (Candidate Key: `(menu_id, item_id)`)
   - FD: `(menu_id, item_id) -> qty_per_meal, uom`
   - Both non-prime attributes are fully functionally dependent on `(menu_id, item_id)`.

---

## 5. Step 4: Third Normal Form (3NF)

### 3NF Definition:
A relation $R$ is in 3NF if:
1. It is in 2NF.
2. **No non-prime attribute is transitively dependent on any candidate key.**
   - Formally: For every non-trivial functional dependency $X \rightarrow Y$, either:
     - $X$ is a superkey, OR
     - $Y$ is a prime attribute (part of a candidate key).

### Identifying Transitive Dependencies:

Consider the relation `SCHOOL_LOGISTICS(institution_id, school_code, name, route_id, route_name, vehicle_number, driver_name, driver_phone)`:
- Candidate Key: `institution_id`
- Functional Dependencies:
  - `institution_id -> route_id, school_code, name, address`
  - `route_id -> route_name, vehicle_number, driver_name, driver_phone`
- Transitive Dependency:
  - `institution_id -> route_id -> driver_name, vehicle_number`
  - If a driver changes for a route, multiple school records would have to be updated, causing **Update Anomalies**.
  - If all schools on a route close, deleting the schools deletes the route and vehicle info (**Deletion Anomaly**).

### 3NF Decomposition:
We decompose `SCHOOL_LOGISTICS` into two independent relations:
1. **`delivery_routes`**:
   - `route_id -> route_code, route_name, vehicle_number, driver_name, driver_phone, max_capacity_meals`
   - Determinant `route_id` is a Superkey.
2. **`institutions`**:
   - `institution_id -> school_code, name, institution_type, route_id, principal_name, phone, email, address, total_enrolled`
   - `route_id` acts as a Foreign Key referencing `delivery_routes(route_id)`.

Consider the relation `DONATION_SPONSOR(donation_id, amount_inr, donation_date, sponsor_id, sponsor_name, pan_number, email)`:
- `donation_id -> sponsor_id`
- `sponsor_id -> sponsor_name, pan_number, email`
- Transitive dependency: `donation_id -> sponsor_name`
- Decomposed into:
  - **`sponsors`** (`sponsor_id`, `name`, `organization_type`, `pan_number`, `email`, `phone`, `address`)
  - **`donations`** (`donation_id`, `sponsor_id`, `amount_inr`, `donation_date`, `payment_mode`, `earmarked_institution_id`, `tax_exemption_80g_receipt`)

---

## 6. Step 5: Boyce-Codd Normal Form (BCNF)

### BCNF Definition:
A relation $R$ is in BCNF if and only if:
**For every non-trivial functional dependency $X \rightarrow Y$, $X$ is a superkey.**
(BCNF is a stricter version of 3NF that eliminates anomalies when overlapping composite candidate keys exist).

### Verification of All 12 Final Relations for BCNF:

1. **`food_items`**:
   - Keys: `{item_id}` (Primary), `{item_name}` (Unique)
   - FDs: `item_id -> all attributes`; `item_name -> all attributes`
   - Both determinants are candidate keys. $\rightarrow$ **In BCNF**.

2. **`stock_inventory`**:
   - Keys: `{stock_id}` (Primary), `{(item_id, batch_number)}` (Unique)
   - FDs: `stock_id -> item_id, batch_number, expiry_date, current_qty, unit_price_inr...`
   - All determinants are superkeys. $\rightarrow$ **In BCNF**.

3. **`stock_transactions`**:
   - Key: `{transaction_id}`
   - FD: `transaction_id -> stock_id, item_id, transaction_type, quantity, reference_batch_id, timestamp...`
   - Determinant is a superkey. $\rightarrow$ **In BCNF**.

4. **`menus`**:
   - Keys: `{menu_id}` (Primary), `{menu_name}` (Unique)
   - Determinants are superkeys. $\rightarrow$ **In BCNF**.

5. **`recipe_ingredients`**:
   - Keys: `{recipe_id}` (Primary), `{(menu_id, item_id)}` (Unique)
   - FDs: `recipe_id -> menu_id, item_id, qty_per_meal, uom`; `(menu_id, item_id) -> recipe_id, qty_per_meal, uom`
   - Determinants are candidate keys. $\rightarrow$ **In BCNF**.

6. **`meal_batches`**:
   - Keys: `{batch_id}` (Primary), `{batch_code}` (Unique)
   - Determinants are superkeys. $\rightarrow$ **In BCNF**.

7. **`delivery_routes`**:
   - Keys: `{route_id}` (Primary), `{route_code}` (Unique)
   - Determinants are superkeys. $\rightarrow$ **In BCNF**.

8. **`institutions`**:
   - Keys: `{institution_id}` (Primary), `{school_code}` (Unique)
   - Determinants are superkeys. $\rightarrow$ **In BCNF**.

9. **`daily_indents`**:
   - Keys: `{indent_id}` (Primary), `{(institution_id, indent_date)}` (Unique)
   - Determinants are candidate keys. $\rightarrow$ **In BCNF**.

10. **`dispatch_deliveries`**:
    - Key: `{dispatch_id}`
    - Determinant is a superkey. $\rightarrow$ **In BCNF**.

11. **`sponsors`**:
    - Keys: `{sponsor_id}` (Primary), `{email}` (Unique)
    - Determinants are candidate keys. $\rightarrow$ **In BCNF**.

12. **`donations`**:
    - Keys: `{donation_id}` (Primary), `{tax_exemption_80g_receipt}` (Unique)
    - Determinants are candidate keys. $\rightarrow$ **In BCNF**.

---

## 7. Summary of Normalization Achievements

| Normal Form | Rule Satisfied | Anomalies Prevented |
| :--- | :--- | :--- |
| **1NF** | Atomic domains, primary keys defined, no nested tables | Inability to query individual items, duplicate records |
| **2NF** | All non-prime attributes fully dependent on candidate keys | Redundant recipe ingredient data, inconsistent UOMs |
| **3NF** | No transitive dependencies ($X \rightarrow Y \rightarrow Z$) | Logistics driver update anomalies, sponsor info duplication |
| **BCNF** | Every determinant is a superkey | Overlapping composite key inconsistencies |

**Conclusion:** The database is provably in **Boyce-Codd Normal Form (BCNF)** with lossless decomposition and complete dependency preservation.
