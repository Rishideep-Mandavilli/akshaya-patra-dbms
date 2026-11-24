#!/usr/bin/env bash
set -e

DB_NAME="akshaya_patra_db"
PG_USER="${PGUSER:-$(whoami)}"

echo "=== Running Database Schema & Constraint Tests ==="

# 1. Verify 12 tables exist
TABLE_COUNT=$(psql -U "${PG_USER}" -d "${DB_NAME}" -t -c "
    SELECT count(*) FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
")
TABLE_COUNT=$(echo "${TABLE_COUNT}" | tr -d '[:space:]')

echo "Found ${TABLE_COUNT} tables in public schema."
if [ "${TABLE_COUNT}" -ne 12 ]; then
    echo "ERROR: Expected 12 tables, found ${TABLE_COUNT}"
    exit 1
fi

# 2. Test Foreign Key Enforcement
echo "Testing foreign key enforcement..."
psql -U "${PG_USER}" -d "${DB_NAME}" -c "
    DO \$\$
    BEGIN
        -- Attempt inserting stock for non-existent food_item (should fail)
        BEGIN
            INSERT INTO stock_inventory(item_id, batch_number, expiry_date, initial_qty, current_qty, unit_price_inr)
            VALUES (99999, 'INVALID-BATCH', CURRENT_DATE + 30, 100, 100, 50);
            RAISE EXCEPTION 'TEST FAILED: FK violation was not caught!';
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'SUCCESS: Foreign key violation caught as expected.';
        END;

        -- Test CHECK constraint on negative quantities
        BEGIN
            INSERT INTO food_items(item_name, category, uom, min_stock_threshold)
            VALUES ('Negative Test', 'GRAIN', 'KG', -5.0);
            RAISE EXCEPTION 'TEST FAILED: Check constraint on min_stock_threshold was not caught!';
        EXCEPTION WHEN check_violation THEN
            RAISE NOTICE 'SUCCESS: Check constraint violation caught as expected.';
        END;
    END \$\$;
"

echo "=== All Schema & Constraint Tests Passed! ==="
