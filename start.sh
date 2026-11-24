#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "================================================================="
echo "   AKSHAYA PATRA - FOOD DISTRIBUTION MANAGEMENT SYSTEM"
echo "   DBMS Academic Project (Student: Rutwik)"
echo "================================================================="

# 1. Database Check & Setup
echo "[1/4] Checking PostgreSQL connection..."
if ! pg_isready -q; then
    echo "ERROR: PostgreSQL service is not reachable on localhost:5432."
    echo "Please ensure PostgreSQL is started (e.g., brew services start postgresql@16)."
    exit 1
fi

echo "[2/4] Initializing Database & Seed Data..."
./database/init_db.sh
psql -d akshaya_patra_db -f database/02_triggers_and_procedures.sql -q
psql -d akshaya_patra_db -f database/03_views.sql -q
psql -d akshaya_patra_db -f database/04_seed_data.sql -q

# 2. Server Setup & Start
echo "[3/4] Starting Node.js Express REST Backend (Port 5001)..."
if [ ! -d "server/node_modules" ]; then
    echo "Installing server dependencies..."
    (cd server && npm install --silent)
fi

# Kill any previous instance on port 5001
lsof -ti:5001 | xargs kill -9 2>/dev/null || true
(cd server && npm start) > server.log 2>&1 &
SERVER_PID=$!
echo "Backend started with PID: ${SERVER_PID}"

# 3. Client Setup & Start
echo "[4/4] Starting React / Vite Frontend (Port 5173)..."
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    (cd client && npm install --silent)
fi

# Kill any previous instance on port 5173
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
(cd client && npm run dev -- --host 127.0.0.1 --port 5173) > client.log 2>&1 &
CLIENT_PID=$!
echo "Frontend started with PID: ${CLIENT_PID}"

echo "================================================================="
echo "  ✅ SYSTEM ONLINE & READY FOR EVALUATION!"
echo ""
echo "  🌐 Web Interface:      http://localhost:5173"
echo "  🔌 REST API Backend:   http://localhost:5001"
echo "  🗄️  Database:          akshaya_patra_db (PostgreSQL 16)"
echo "  📖 Project Report:     docs/DBMS_PROJECT_REPORT.md"
echo "  🎓 Viva Guide:         docs/VIVA_QUESTIONS_AND_ANSWERS.md"
echo "================================================================="
echo "Press Ctrl+C to terminate both servers."

trap "kill ${SERVER_PID} ${CLIENT_PID} 2>/dev/null || true; exit 0" INT TERM
wait
