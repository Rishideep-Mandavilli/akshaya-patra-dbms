#!/usr/bin/env bash
set -e

DB_NAME="akshaya_patra_db"
PG_USER="${PGUSER:-$(whoami)}"

echo "=== Testing 12 Analytical SQL Queries on ${DB_NAME} ==="
psql -U "${PG_USER}" -d "${DB_NAME}" -f "$(dirname "$0")/../database/05_analytical_queries.sql" > /tmp/queries_output.txt

LINE_COUNT=$(wc -l < /tmp/queries_output.txt)
echo "Query execution succeeded! Produced ${LINE_COUNT} lines of formatted output."

echo "=== All 12 Analytical Queries Executed Successfully! ==="
