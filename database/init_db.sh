#!/usr/bin/env bash
set -e

DB_NAME="akshaya_patra_db"
PG_USER="${PGUSER:-$(whoami)}"

echo "=== Initializing PostgreSQL Database: ${DB_NAME} (User: ${PG_USER}) ==="

# Check if database exists, create if not
if psql -U "${PG_USER}" -lqt | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo "Database ${DB_NAME} already exists. Resetting schema..."
else
    echo "Creating database ${DB_NAME}..."
    createdb -U "${PG_USER}" "${DB_NAME}"
fi

echo "Applying Schema (01_schema.sql)..."
psql -U "${PG_USER}" -d "${DB_NAME}" -f "$(dirname "$0")/01_schema.sql"

echo "=== Database Schema Initialized Successfully! ==="
