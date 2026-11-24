import React, { useState, useEffect } from 'react';
import {
  Utensils, ChefHat, Truck, School, HeartHandshake, Database,
  Package, ClipboardList, AlertTriangle, CheckCircle2, Clock,
  Plus, Search, ArrowRight, RefreshCw, Play, FileText, Layers,
  Award, ShieldCheck, Flame, IndianRupee, Thermometer, Info,
  Check, X
} from 'lucide-react';

const API_BASE = '/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Core Data States
  const [stats, setStats] = useState(null);
  const [items, setItems] = useState([]);
  const [stock, setStock] = useState([]);
  const [menus, setMenus] = useState([]);
  const [batches, setBatches] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [indents, setIndents] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [donations, setDonations] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // DBMS Explorer State
  const [customSql, setCustomSql] = useState('SELECT * FROM v_daily_kitchen_summary;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [selectedPresetQuery, setSelectedPresetQuery] = useState(1);
  const [activeDonorImpact, setActiveDonorImpact] = useState(null);

  // Modals
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [
        dashRes, itemsRes, stockRes, menusRes, batchesRes,
        routesRes, dispRes, instRes, indentsRes, sponsorsRes, donRes, txRes
      ] = await Promise.all([
        fetch(`${API_BASE}/dashboard/stats`).then(r => r.json()),
        fetch(`${API_BASE}/items`).then(r => r.json()),
        fetch(`${API_BASE}/stock`).then(r => r.json()),
        fetch(`${API_BASE}/menus`).then(r => r.json()),
        fetch(`${API_BASE}/batches`).then(r => r.json()),
        fetch(`${API_BASE}/routes`).then(r => r.json()),
        fetch(`${API_BASE}/dispatches`).then(r => r.json()),
        fetch(`${API_BASE}/institutions`).then(r => r.json()),
        fetch(`${API_BASE}/indents`).then(r => r.json()),
        fetch(`${API_BASE}/sponsors`).then(r => r.json()),
        fetch(`${API_BASE}/donations`).then(r => r.json()),
        fetch(`${API_BASE}/stock/transactions`).then(r => r.json()),
      ]);

      setStats(dashRes);
      setItems(itemsRes);
      setStock(stockRes);
      setMenus(menusRes);
      setBatches(batchesRes);
      setRoutes(routesRes);
      setDispatches(dispRes);
      setInstitutions(instRes);
      setIndents(indentsRes);
      setSponsors(sponsorsRes);
      setDonations(donRes);
      setTransactions(txRes);
    } catch (err) {
      console.error('Fetch error:', err);
      setErrorMsg('Failed to fetch data from backend. Ensure PostgreSQL and Node.js server are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const triggerNotify = (msg, isErr = false) => {
    if (isErr) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 7000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // Complete Cooking Batch & Fire PL/pgSQL Trigger
  const handleCompleteBatch = async (batchId, actualServings) => {
    try {
      const res = await fetch(`${API_BASE}/batches/${batchId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_servings: actualServings || 2500, food_temp_celsius: 81.5 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      triggerNotify(data.message || 'Batch completed! Trigger executed inventory deduction.');
      fetchAllData();
    } catch (err) {
      triggerNotify(err.message, true);
    }
  };

  // Auto-schedule daily dispatches
  const handleAutoSchedule = async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/dispatches/auto-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch_id: batchId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      triggerNotify('Logistics routes and school dispatches auto-scheduled via stored procedure!');
      fetchAllData();
    } catch (err) {
      triggerNotify(err.message, true);
    }
  };

  // Execute Custom SQL Query
  const handleRunQuery = async (queryToRun) => {
    const q = queryToRun || customSql;
    setQueryRunning(true);
    try {
      const res = await fetch(`${API_BASE}/dbms/execute-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: q })
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
    } finally {
      setQueryRunning(false);
    }
  };

  // Load Donor Impact Certificate
  const handleViewImpact = async (sponsorId) => {
    try {
      const res = await fetch(`${API_BASE}/sponsors/${sponsorId}/impact`);
      const data = await res.json();
      setActiveDonorImpact(data);
    } catch (err) {
      triggerNotify(err.message, true);
    }
  };

  const PRESET_QUERIES = [
    {
      id: 1,
      title: '1. End-to-End Traceability (5-Table JOIN)',
      desc: 'Trace Batch -> Menu -> Route -> Van -> School with temperatures and status.',
      sql: `SELECT mb.batch_code, m.menu_name, mb.head_cook_name, inst.name AS school_name, dr.route_code, dr.vehicle_number, dd.meals_dispatched, dd.delivery_status, dd.delivery_temp_celsius
FROM dispatch_deliveries dd
JOIN meal_batches mb ON dd.batch_id = mb.batch_id
JOIN menus m ON mb.menu_id = m.menu_id
JOIN institutions inst ON dd.institution_id = inst.institution_id
JOIN delivery_routes dr ON dd.route_id = dr.route_id
ORDER BY mb.batch_code, dd.dispatch_id;`
    },
    {
      id: 2,
      title: '2. School Wastage & Attendance Gap (HAVING)',
      desc: 'Aggregates requested vs present students and identifies leftover food wastage %',
      sql: `SELECT inst.name AS school_name, inst.school_code, COUNT(di.indent_id) AS recorded_days, SUM(di.requested_meals) AS total_meals_requested, SUM(di.actual_present_students) AS total_students_present, SUM(di.leftover_meals) AS total_leftover_meals, ROUND((SUM(di.leftover_meals)::NUMERIC / NULLIF(SUM(di.requested_meals), 0)) * 100, 2) AS wastage_percentage
FROM institutions inst
JOIN daily_indents di ON inst.institution_id = di.institution_id
GROUP BY inst.name, inst.school_code
HAVING SUM(di.leftover_meals) > 0
ORDER BY wastage_percentage DESC;`
    },
    {
      id: 3,
      title: '3. Route Capacity Utilization & Load Balancing',
      desc: 'Computes van capacity utilization percentage for today and flags fleet status.',
      sql: `SELECT dr.route_code, dr.route_name, dr.vehicle_number, dr.max_capacity_meals, COALESCE(SUM(dd.meals_dispatched), 0) AS total_meals_loaded, ROUND((COALESCE(SUM(dd.meals_dispatched), 0)::NUMERIC / dr.max_capacity_meals) * 100, 2) AS capacity_utilization_pct,
CASE 
  WHEN (COALESCE(SUM(dd.meals_dispatched), 0)::NUMERIC / dr.max_capacity_meals) > 0.90 THEN 'NEAR_CAPACITY'
  WHEN (COALESCE(SUM(dd.meals_dispatched), 0)::NUMERIC / dr.max_capacity_meals) BETWEEN 0.50 AND 0.90 THEN 'OPTIMAL'
  ELSE 'UNDER_UTILIZED'
END AS fleet_status
FROM delivery_routes dr
LEFT JOIN dispatch_deliveries dd ON dr.route_id = dd.route_id AND dd.dispatch_date = CURRENT_DATE
GROUP BY dr.route_code, dr.route_name, dr.vehicle_number, dr.max_capacity_meals
ORDER BY capacity_utilization_pct DESC;`
    },
    {
      id: 4,
      title: '4. Window Function: DENSE_RANK() by Route',
      desc: 'Ranks institutions by student size inside each delivery route partition.',
      sql: `SELECT dr.route_code, inst.name AS school_name, inst.institution_type, inst.total_enrolled,
DENSE_RANK() OVER (PARTITION BY dr.route_id ORDER BY inst.total_enrolled DESC) AS rank_in_route
FROM institutions inst
JOIN delivery_routes dr ON inst.route_id = dr.route_id
ORDER BY dr.route_code, rank_in_route;`
    },
    {
      id: 5,
      title: '5. CTE: Batch Raw Material Economic Cost',
      desc: 'Common Table Expression calculating precise raw ingredient costs for cooked batches.',
      sql: `WITH BatchIngredientCosts AS (
  SELECT st.reference_batch_id AS batch_id, st.item_id, st.quantity AS qty_consumed, si.unit_price_inr, (st.quantity * si.unit_price_inr) AS total_item_cost
  FROM stock_transactions st
  JOIN stock_inventory si ON st.stock_id = si.stock_id
  WHERE st.transaction_type = 'COOKING_CONSUMPTION'
)
SELECT mb.batch_code, m.menu_name, mb.actual_servings, ROUND(SUM(bic.total_item_cost), 2) AS total_batch_cost_inr, ROUND(SUM(bic.total_item_cost) / NULLIF(mb.actual_servings, 0), 2) AS raw_cost_per_meal_inr
FROM meal_batches mb
JOIN menus m ON mb.menu_id = m.menu_id
JOIN BatchIngredientCosts bic ON mb.batch_id = bic.batch_id
GROUP BY mb.batch_code, m.menu_name, mb.actual_servings
ORDER BY mb.batch_code;`
    },
    {
      id: 6,
      title: '6. Next-Day BOM Forecast Simulator',
      desc: 'Calculates exact raw ingredients needed if cooking 5,000 meals of Bisi Bele Bath.',
      sql: `SELECT m.menu_name, fi.item_name, fi.category, ri.qty_per_meal, 5000 AS simulated_meals, ROUND(ri.qty_per_meal * 5000, 2) AS total_required_qty, ri.uom, COALESCE(SUM(si.current_qty), 0) AS current_warehouse_qty,
CASE WHEN COALESCE(SUM(si.current_qty), 0) >= (ri.qty_per_meal * 5000) THEN 'ADEQUATE_STOCK' ELSE 'DEFICIT_REQUIRES_PROCUREMENT' END AS procurement_status
FROM menus m
JOIN recipe_ingredients ri ON m.menu_id = ri.menu_id
JOIN food_items fi ON ri.item_id = fi.item_id
LEFT JOIN stock_inventory si ON fi.item_id = si.item_id AND si.current_qty > 0
WHERE m.menu_id = 2
GROUP BY m.menu_name, fi.item_name, fi.category, ri.qty_per_meal, ri.uom
ORDER BY total_required_qty DESC;`
    }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-stone-100 font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-68 bg-amber-950 text-amber-50 flex flex-col justify-between shadow-xl z-20">
        <div>
          {/* Logo & Header */}
          <div className="p-5 border-b border-amber-900/60 bg-amber-950/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg text-white font-bold text-xl">
                🍲
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight tracking-wide text-white">Akshaya Patra</h1>
                <p className="text-xs text-amber-300 font-medium">Mega-Kitchen Distribution</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] bg-amber-900/40 px-2.5 py-1.5 rounded-md text-amber-200 border border-amber-800/40">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                PostgreSQL 16
              </span>
              <span className="font-mono text-amber-400">BCNF Normalized</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="p-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard & KPIs', icon: Layers },
              { id: 'menus', label: 'Menu & Recipes (BOM)', icon: Utensils },
              { id: 'inventory', label: 'Stock & Warehouse', icon: Package, badge: stats?.kpis?.lowStockAlerts },
              { id: 'batches', label: 'Cooking Production', icon: ChefHat },
              { id: 'logistics', label: 'Logistics & Routes', icon: Truck },
              { id: 'schools', label: 'Schools & Indents', icon: School },
              { id: 'sponsors', label: 'Sponsors & Grants', icon: HeartHandshake },
              { id: 'dbms', label: 'DBMS Viva & SQL Lab', icon: Database, highlight: true },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                      : item.highlight
                      ? 'text-amber-300 hover:bg-amber-900/50 hover:text-white border border-amber-700/40'
                      : 'text-amber-200/80 hover:bg-amber-900/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-400' : 'text-amber-400/80'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !isActive && (
                    <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-400/20 text-amber-300 rounded border border-amber-400/30">
                      VIVA
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Student / Footer Info */}
        <div className="p-4 border-t border-amber-900/60 bg-amber-950/90 text-xs text-amber-300/80">
          <p className="font-semibold text-white">DBMS Awareness Project</p>
          <p className="text-[11px] text-amber-400/90">Created for: Rutwik</p>
          <p className="text-[10px] text-amber-500/80 mt-1">Triggers • Stored Procs • BCNF</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-stone-800 capitalize flex items-center gap-2">
              {activeTab === 'dbms' ? 'DBMS Academic Viva & SQL Playground' : activeTab.replace('-', ' ')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Akshaya Patra Mid-Day Meal Operations & Relational Database System
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-md border border-stone-300 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="h-6 w-px bg-stone-200"></div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full border border-amber-200">
              Bangalore Central Kitchen
            </span>
          </div>
        </header>

        {/* Floating Notification Alerts */}
        {errorMsg && (
          <div className="mx-8 mt-4 p-4 bg-rose-50 border-l-4 border-rose-600 rounded-r-lg shadow-sm flex items-start gap-3 text-rose-900 text-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">Database Constraint / Operation Error:</strong>
              <p className="mt-0.5 font-mono text-xs">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-8 mt-4 p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-r-lg shadow-sm flex items-start gap-3 text-emerald-900 text-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold">Success:</strong>
              <p className="mt-0.5 text-xs">{successMsg}</p>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && stats && (
          <div className="p-8 space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Meals Cooked Today</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-0.5">{stats.kpis.totalCookedToday.toLocaleString()}</h3>
                  <span className="text-[11px] text-stone-500">{stats.kpis.batchesToday} Mega Batches</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Dispatched to Schools</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-0.5">{stats.kpis.totalDispatchedToday.toLocaleString()}</h3>
                  <span className="text-[11px] text-emerald-600 font-medium">{stats.kpis.schoolsDeliveredToday} Schools Delivered</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Institutions Covered</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-0.5">{stats.kpis.totalSchools}</h3>
                  <span className="text-[11px] text-stone-500">{stats.kpis.totalStudents.toLocaleString()} Enrolled Children</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">Sponsorship Fund</p>
                  <h3 className="text-2xl font-bold text-stone-900 mt-0.5">₹{(stats.kpis.totalDonationsInr / 100000).toFixed(1)}L</h3>
                  <span className="text-[11px] text-stone-500">{stats.kpis.donationsCount} Active Grants</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Live Kitchen Feeds */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Today's Production Batches */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-xs p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-stone-800 text-base">Today's Kitchen Production Runs</h3>
                    <p className="text-xs text-stone-500">Real-time status of central steam cauldrons</p>
                  </div>
                  <button
                    onClick={() => setShowBatchModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Cooking Batch
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 font-semibold border-y border-stone-200">
                      <tr>
                        <th className="py-2.5 px-3">Batch Code</th>
                        <th className="py-2.5 px-3">Menu</th>
                        <th className="py-2.5 px-3">Target Servings</th>
                        <th className="py-2.5 px-3">Cooking Temp</th>
                        <th className="py-2.5 px-3">Head Cook</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {batches.slice(0, 5).map((b) => (
                        <tr key={b.batch_id} className="hover:bg-stone-50/60">
                          <td className="py-3 px-3 font-mono font-medium text-stone-900">{b.batch_code}</td>
                          <td className="py-3 px-3 font-semibold text-stone-800">{b.menu_name}</td>
                          <td className="py-3 px-3">{b.target_servings.toLocaleString()} meals</td>
                          <td className="py-3 px-3">
                            {b.food_temp_celsius ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                                <Thermometer className="w-3.5 h-3.5" />
                                {b.food_temp_celsius}°C
                              </span>
                            ) : (
                              <span className="text-stone-400">Heating...</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-stone-600">{b.head_cook_name}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'COOKING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                              'bg-stone-100 text-stone-700'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {b.status === 'COOKING' ? (
                              <button
                                onClick={() => handleCompleteBatch(b.batch_id, b.target_servings)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] transition-colors cursor-pointer"
                                title="Fires PL/pgSQL inventory deduction trigger"
                              >
                                Complete & Deduct
                              </button>
                            ) : (
                              <span className="text-stone-400 text-[11px]">Deducted</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Logistics Overview */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-stone-800 text-base mb-1">Live Fleet & School Dispatches</h3>
                  <p className="text-xs text-stone-500 mb-4">Insulated delivery vans en route</p>

                  <div className="space-y-3">
                    {dispatches.slice(0, 4).map((d) => (
                      <div key={d.dispatch_id} className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-xs text-stone-900">{d.school_name}</p>
                          <p className="text-[11px] text-stone-500">{d.route_name} • {d.vehicle_number}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.delivery_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                            d.delivery_status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            'bg-stone-200 text-stone-700'
                          }`}>
                            {d.delivery_status}
                          </span>
                          <p className="text-[11px] font-bold text-stone-800 mt-1">{d.meals_dispatched} meals</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 mt-4">
                  <button
                    onClick={() => setActiveTab('logistics')}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    View All Distribution Routes <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MENUS & RECIPES (BOM) */}
        {activeTab === 'menus' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Standard Daily Menus & Bill of Materials (BOM)</h3>
                <p className="text-xs text-stone-500">Standardized recipe proportions defining exact ingredient consumption per meal serving</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {menus.map((m) => (
                <div key={m.menu_id} className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
                  <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200/60 flex items-start justify-between">
                    <div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-200 text-amber-900 uppercase tracking-wider">
                        {m.meal_category.replace('_', ' ')}
                      </span>
                      <h4 className="text-base font-bold text-stone-900 mt-1">{m.menu_name}</h4>
                      <p className="text-xs text-stone-600 mt-0.5">{m.description}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-md border border-amber-200">
                        {m.standard_calories} kcal
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h5 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">Recipe Ingredients (Per 1 Meal Serving)</h5>
                    <div className="divide-y divide-stone-100 text-xs">
                      {m.ingredients && m.ingredients.map((ing) => (
                        <div key={ing.recipe_id} className="py-2 flex items-center justify-between">
                          <span className="font-medium text-stone-800">{ing.item_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-stone-500 text-[11px]">{ing.category}</span>
                            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
                              {(ing.qty_per_meal * (ing.uom === 'KG' ? 1000 : 1000)).toFixed(0)} {ing.uom === 'KG' ? 'g' : 'ml'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 bg-stone-50/70 p-3 rounded-lg flex items-center justify-between text-xs text-stone-600">
                      <span>Cooking 5,000 Meals consumes:</span>
                      <span className="font-semibold text-stone-900 font-mono">
                        {m.ingredients?.length || 0} distinct raw ingredients
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Warehouse Inventory & Raw Stock Batches</h3>
                <p className="text-xs text-stone-500">Track raw grain, pulse, vegetable, and dairy stock levels with lot numbers and expiry dates</p>
              </div>
              <button
                onClick={() => setShowProcureModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Inward Stock Procurement
              </button>
            </div>

            {/* Current Stock Levels Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-800">Master Food Catalog & Total Available Stock</h4>
                <span className="text-xs text-stone-500">{items.length} items cataloged</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Item ID</th>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">UOM</th>
                    <th className="py-2.5 px-4">Min Reorder Level</th>
                    <th className="py-2.5 px-4">Available Stock</th>
                    <th className="py-2.5 px-4">Stock Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((item) => (
                    <tr key={item.item_id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-stone-500">#{item.item_id}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{item.item_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{item.uom}</td>
                      <td className="py-3 px-4 font-mono">{parseFloat(item.min_stock_threshold).toFixed(1)} {item.uom}</td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {parseFloat(item.total_available_stock).toFixed(1)} {item.uom}
                      </td>
                      <td className="py-3 px-4">
                        {item.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Warehouse Batches & Expiry */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50">
                <h4 className="text-sm font-bold text-stone-800">Warehouse Lot Batches (FIFO Order)</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-4">Lot Batch No</th>
                      <th className="py-2.5 px-4">Food Item</th>
                      <th className="py-2.5 px-4">Storage Location</th>
                      <th className="py-2.5 px-4">Received Date</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4">Current Qty</th>
                      <th className="py-2.5 px-4">Unit Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {stock.map((s) => (
                      <tr key={s.stock_id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-mono font-semibold text-stone-900">{s.batch_number}</td>
                        <td className="py-3 px-4 font-medium text-stone-800">{s.item_name}</td>
                        <td className="py-3 px-4 text-stone-600">{s.storage_location}</td>
                        <td className="py-3 px-4 text-stone-500">{new Date(s.received_date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className={`font-mono font-semibold ${
                            s.days_until_expiry <= 3 ? 'text-rose-600' : 'text-stone-700'
                          }`}>
                            {new Date(s.expiry_date).toLocaleDateString()} ({s.days_until_expiry}d left)
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-stone-900">{parseFloat(s.current_qty).toFixed(1)} {s.uom}</td>
                        <td className="py-3 px-4 font-mono">₹{parseFloat(s.unit_price_inr).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Inventory Transactions Audit Ledger */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
              <h4 className="text-sm font-bold text-stone-800 mb-2">Immutable Stock Transaction Audit Ledger</h4>
              <p className="text-xs text-stone-500 mb-4">Every procurement and cooking auto-deduction logged for full traceability</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transactions.slice(0, 8).map((tx) => (
                  <div key={tx.transaction_id} className="p-2.5 rounded-lg border border-stone-100 bg-stone-50/70 text-xs flex items-center justify-between">
                    <div>
                      <span className={`font-semibold px-2 py-0.5 rounded text-[10px] mr-2 ${
                        tx.transaction_type === 'COOKING_CONSUMPTION' ? 'bg-amber-100 text-amber-800' :
                        tx.transaction_type === 'PROCUREMENT' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-stone-200 text-stone-700'
                      }`}>
                        {tx.transaction_type}
                      </span>
                      <span className="font-medium text-stone-900">{tx.item_name}</span>
                      <span className="text-stone-500 text-[11px] ml-2">({tx.remarks})</span>
                    </div>
                    <div className="text-right font-mono font-bold text-stone-900">
                      {parseFloat(tx.quantity).toFixed(1)} {tx.uom}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MEAL PRODUCTION & BATCHES */}
        {activeTab === 'batches' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Mega-Kitchen Cooking Batches & Steam Cauldrons</h3>
                <p className="text-xs text-stone-500">Live production monitoring with automated PL/pgSQL inventory deduction triggers</p>
              </div>
              <button
                onClick={() => setShowBatchModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Schedule New Cooking Batch
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((b) => (
                <div key={b.batch_id} className="bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                        {b.batch_code}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        b.status === 'COOKING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                        'bg-stone-100 text-stone-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <h4 className="font-bold text-stone-900 text-base">{b.menu_name}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Head Cook: {b.head_cook_name}</p>

                    <div className="mt-4 grid grid-cols-2 gap-3 bg-stone-50 p-3 rounded-lg text-xs">
                      <div>
                        <span className="text-stone-500 text-[11px]">Target Servings</span>
                        <p className="font-bold text-stone-900">{b.target_servings.toLocaleString()} meals</p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[11px]">Actual Produced</span>
                        <p className="font-bold text-stone-900">{b.actual_servings ? b.actual_servings.toLocaleString() : 'Cooking...'}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[11px]">Cooking Temp</span>
                        <p className="font-bold text-emerald-700">{b.food_temp_celsius ? `${b.food_temp_celsius}°C` : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-stone-500 text-[11px]">Dispatched So Far</span>
                        <p className="font-bold text-blue-700">{b.total_dispatched_so_far.toLocaleString()} meals</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100">
                    {b.status === 'COOKING' ? (
                      <button
                        onClick={() => handleCompleteBatch(b.batch_id, b.target_servings)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Flame className="w-3.5 h-3.5" />
                        Complete Cooking (Execute Trigger)
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAutoSchedule(b.batch_id)}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Auto-Schedule Route Dispatches
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: LOGISTICS & DISTRIBUTION */}
        {activeTab === 'logistics' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Logistics Routes & Insulated Van Fleet</h3>
                <p className="text-xs text-stone-500">Scheduled school delivery corridors and real-time delivery status</p>
              </div>
            </div>

            {/* Routes List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {routes.map((r) => (
                <div key={r.route_id} className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {r.route_code}
                    </span>
                    <span className="text-[11px] text-stone-500">{r.vehicle_number}</span>
                  </div>
                  <h4 className="font-bold text-stone-900 text-sm">{r.route_name}</h4>
                  <p className="text-xs text-stone-600 mt-1">Driver: {r.driver_name} ({r.driver_phone})</p>
                  <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500">Max Capacity:</span>
                    <span className="font-bold text-stone-800">{r.max_capacity_meals.toLocaleString()} meals</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Dispatches Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <h4 className="text-sm font-bold text-stone-800">School Dispatches & Delivery Receipts</h4>
                <span className="text-xs text-stone-500">{dispatches.length} active delivery dispatches</span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Dispatch ID</th>
                    <th className="py-2.5 px-4">School</th>
                    <th className="py-2.5 px-4">Route & Van</th>
                    <th className="py-2.5 px-4">Batch</th>
                    <th className="py-2.5 px-4">Meals</th>
                    <th className="py-2.5 px-4">Arrival Temp</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Received By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {dispatches.map((d) => (
                    <tr key={d.dispatch_id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-stone-500">#{d.dispatch_id}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{d.school_name}</td>
                      <td className="py-3 px-4">{d.route_code} • {d.vehicle_number}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">{d.batch_code}</td>
                      <td className="py-3 px-4 font-bold text-stone-900">{d.meals_dispatched}</td>
                      <td className="py-3 px-4">
                        {d.delivery_temp_celsius ? (
                          <span className={`font-mono font-bold ${
                            d.delivery_temp_celsius >= 65 ? 'text-emerald-700' : 'text-rose-600'
                          }`}>
                            {d.delivery_temp_celsius}°C
                          </span>
                        ) : (
                          <span className="text-stone-400">In Transit</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          d.delivery_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          d.delivery_status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                          'bg-stone-100 text-stone-700'
                        }`}>
                          {d.delivery_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-600 font-medium">{d.received_by_signature || 'Awaiting Handover'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SCHOOLS & DAILY INDENTS */}
        {activeTab === 'schools' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Institutions Directory & Daily Indents</h3>
                <p className="text-xs text-stone-500">Government and aided schools, student enrollment, and daily attendance tracking</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">School Code</th>
                    <th className="py-2.5 px-4">School Name</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Assigned Route</th>
                    <th className="py-2.5 px-4">Principal Contact</th>
                    <th className="py-2.5 px-4">Enrolled Students</th>
                    <th className="py-2.5 px-4">Wastage % (30d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {institutions.map((inst) => (
                    <tr key={inst.institution_id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-stone-500">{inst.school_code}</td>
                      <td className="py-3 px-4 font-bold text-stone-900">{inst.name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700 font-medium">
                          {inst.institution_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-amber-800">{inst.route_name || 'Unassigned'}</td>
                      <td className="py-3 px-4 text-stone-600">{inst.principal_name} ({inst.phone})</td>
                      <td className="py-3 px-4 font-bold text-stone-900 font-mono">{inst.total_enrolled}</td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold ${
                          parseFloat(inst.wastage_rate_pct) > 3.0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}>
                          {inst.wastage_rate_pct || '0.00'}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: SPONSORS & DONATIONS */}
        {activeTab === 'sponsors' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Sponsors, CSR Benefactors & Donation Ledger</h3>
                <p className="text-xs text-stone-500">Donor transparency, meal subsidy tracking, and 80G tax exemption receipts</p>
              </div>
              <button
                onClick={() => setShowDonationModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record New Donation
              </button>
            </div>

            {/* Sponsor Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sponsors.map((s) => (
                <div key={s.sponsor_id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {s.organization_type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-stone-400">{s.total_donations_count} grants</span>
                    </div>
                    <h4 className="font-bold text-stone-900 text-base">{s.sponsor_name}</h4>
                    <p className="text-xs text-stone-500 mt-1">Total Contribution:</p>
                    <p className="text-xl font-bold text-stone-900 mt-0.5">
                      ₹{parseFloat(s.total_donated_inr).toLocaleString()}
                    </p>
                    <p className="text-xs text-emerald-700 font-medium mt-1">
                      {s.meals_subsidized.toLocaleString()} Meals Subsidized
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100">
                    <button
                      onClick={() => handleViewImpact(s.sponsor_id)}
                      className="w-full py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      View Impact Certificate
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Impact Certificate Modal */}
            {activeDonorImpact && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border-4 border-amber-400 relative">
                  <button
                    onClick={() => setActiveDonorImpact(null)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-3xl">
                      🏆
                    </div>
                    <h3 className="text-xl font-bold text-amber-950 font-serif">Certificate of Humanitarian Impact</h3>
                    <p className="text-xs text-stone-500">The Akshaya Patra Foundation • Mid-Day Meal Mission</p>

                    <div className="py-4 border-y border-stone-200 my-4 text-sm text-stone-700 leading-relaxed">
                      This honors <strong className="text-stone-900 font-bold">{activeDonorImpact.sponsor_name}</strong> for generous philanthropic contributions totaling <strong className="text-emerald-700">₹{parseFloat(activeDonorImpact.total_donated_inr || 0).toLocaleString()}</strong>, successfully funding over <strong className="text-amber-800">{parseInt(activeDonorImpact.meals_subsidized || 0).toLocaleString()} nutritious meals</strong> for underprivileged children in government schools.
                    </div>

                    <div className="text-xs text-stone-500 font-mono">
                      Certified on: {new Date().toLocaleDateString()} • Verified by PostgreSQL Database
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DBMS ACADEMIC VIVA & SQL PLAYGROUND */}
        {activeTab === 'dbms' && (
          <div className="p-8 space-y-8">
            {/* Banner */}
            <div className="bg-gradient-to-r from-amber-950 to-stone-900 text-white p-6 rounded-2xl shadow-md border border-amber-800/40">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-amber-950 uppercase tracking-wider">
                    DBMS Subject Evaluation Center
                  </span>
                  <h3 className="text-2xl font-bold mt-2 font-serif tracking-wide">Relational Architecture & Live SQL Terminal</h3>
                  <p className="text-xs text-amber-200/80 mt-1 max-w-2xl">
                    Demonstrates complete normalization (BCNF), referential constraints, PL/pgSQL triggers, stored procedures, and complex SQL analytics for evaluators.
                  </p>
                </div>
                <div className="hidden lg:flex items-center gap-3">
                  <div className="text-center px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-xl font-bold text-amber-400">12</span>
                    <p className="text-[10px] text-stone-300 uppercase">Tables</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-xl font-bold text-amber-400">3</span>
                    <p className="text-[10px] text-stone-300 uppercase">Triggers</p>
                  </div>
                  <div className="text-center px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                    <span className="text-xl font-bold text-amber-400">5</span>
                    <p className="text-[10px] text-stone-300 uppercase">SQL Views</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SQL Terminal & Presets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Presets List */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-5">
                <h4 className="text-sm font-bold text-stone-800 mb-1">Pre-loaded Viva Analytical Queries</h4>
                <p className="text-xs text-stone-500 mb-3">Click any query to load and execute in real-time:</p>
                <div className="space-y-2">
                  {PRESET_QUERIES.map((pq) => (
                    <button
                      key={pq.id}
                      onClick={() => {
                        setSelectedPresetQuery(pq.id);
                        setCustomSql(pq.sql);
                        handleRunQuery(pq.sql);
                      }}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                        selectedPresetQuery === pq.id
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 font-medium'
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 text-stone-700'
                      }`}
                    >
                      <p className="font-semibold">{pq.title}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{pq.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Query Editor & Execution Results */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
                      <TerminalIcon className="w-4 h-4 text-amber-700" />
                      Interactive SQL Console
                    </h4>
                    <button
                      onClick={() => handleRunQuery()}
                      disabled={queryRunning}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      {queryRunning ? 'Running...' : 'Execute SQL'}
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={customSql}
                    onChange={(e) => setCustomSql(e.target.value)}
                    className="w-full font-mono text-xs bg-stone-900 text-emerald-400 p-4 rounded-xl border border-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter any SQL query (e.g. SELECT * FROM menus;)"
                  />
                </div>

                {/* Results Table */}
                <div className="mt-4">
                  {queryResult && (
                    <div>
                      <div className="flex items-center justify-between text-xs py-1.5 px-2 bg-stone-100 rounded-t-lg border-x border-t border-stone-200 font-mono">
                        <span className="text-stone-700">
                          {queryResult.success ? `Command: ${queryResult.command || 'SELECT'} • ${queryResult.rowCount || 0} rows` : 'Execution Failed'}
                        </span>
                        <span className="text-stone-500">{queryResult.durationMs ? `${queryResult.durationMs}ms` : ''}</span>
                      </div>

                      {queryResult.success ? (
                        <div className="max-h-64 overflow-auto border border-stone-200 rounded-b-lg">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-stone-100 text-stone-700 font-mono text-[11px] sticky top-0 border-b border-stone-200">
                              <tr>
                                {queryResult.fields && queryResult.fields.map((f, i) => (
                                  <th key={i} className="py-2 px-3 border-r border-stone-200 font-semibold">{f.name}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                              {queryResult.rows && queryResult.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-amber-50/50">
                                  {queryResult.fields.map((f, cIdx) => (
                                    <td key={cIdx} className="py-1.5 px-3 border-r border-stone-100 text-stone-800">
                                      {row[f.name] !== null ? String(row[f.name]) : <span className="text-stone-400 italic">null</span>}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-b-lg text-rose-800 text-xs font-mono">
                          Error: {queryResult.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Proofs & ER Diagram Quick Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Relational Normalization Proofs (1NF to BCNF)
                </h4>
                <div className="space-y-3 text-xs text-stone-600">
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <strong className="text-stone-900">1NF (First Normal Form):</strong>
                    <p>All attributes are atomic. No repeating groups. Candidate keys defined for all relations.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <strong className="text-stone-900">2NF (Second Normal Form):</strong>
                    <p>No partial dependencies. In composite candidate key <code className="bg-stone-200 px-1 py-0.5 rounded">(menu_id, item_id)</code>, non-key attribute <code className="bg-stone-200 px-1 py-0.5 rounded">qty_per_meal</code> depends on the whole key.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <strong className="text-stone-900">3NF (Third Normal Form):</strong>
                    <p>No transitive dependencies. Route & driver data separated into <code className="bg-stone-200 px-1 py-0.5 rounded">delivery_routes</code> rather than embedded inside <code className="bg-stone-200 px-1 py-0.5 rounded">institutions</code>.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200">
                    <strong className="text-stone-900">BCNF (Boyce-Codd Normal Form):</strong>
                    <p>Every functional dependency determinant is a superkey across all 12 relations.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-xs">
                <h4 className="font-bold text-stone-900 text-sm mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  Active PL/pgSQL Triggers in Database
                </h4>
                <div className="space-y-3 text-xs text-stone-600">
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                    <strong className="text-amber-950">trg_deduct_inventory (AFTER UPDATE ON meal_batches):</strong>
                    <p className="mt-0.5">Automates FIFO raw inventory deduction upon batch completion. Validates stock availability and throws <code className="text-rose-700 font-mono">INVENTORY DEFICIT</code> exception if stock is inadequate.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                    <strong className="text-amber-950">trg_check_dispatch (BEFORE INSERT ON dispatch_deliveries):</strong>
                    <p className="mt-0.5">Integrity check that strictly prohibits total dispatched meals from exceeding actual cooked servings in the parent batch.</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                    <strong className="text-amber-950">trg_audit_leftovers (BEFORE UPDATE ON daily_indents):</strong>
                    <p className="mt-0.5">Automatically calculates leftover meals and assigns reason when school attendance is recorded.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: PROCURE STOCK */}
        {showProcureModal && (
          <ProcureModal
            items={items}
            onClose={() => setShowProcureModal(false)}
            onSuccess={() => {
              setShowProcureModal(false);
              triggerNotify('Stock procured successfully and transaction recorded!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL: SCHEDULE BATCH */}
        {showBatchModal && (
          <BatchModal
            menus={menus}
            onClose={() => setShowBatchModal(false)}
            onSuccess={() => {
              setShowBatchModal(false);
              triggerNotify('Cooking batch scheduled and boiling!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL: DONATION */}
        {showDonationModal && (
          <DonationModal
            sponsors={sponsors}
            institutions={institutions}
            onClose={() => setShowDonationModal(false)}
            onSuccess={() => {
              setShowDonationModal(false);
              triggerNotify('Donation recorded and 80G receipt issued!');
              fetchAllData();
            }}
          />
        )}
      </main>
    </div>
  );
}

// Helpers & Modals
function TerminalIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ProcureModal({ items, onClose, onSuccess }) {
  const [itemId, setItemId] = useState(items[0]?.item_id || 1);
  const [qty, setQty] = useState(500);
  const [price, setPrice] = useState(45);
  const [shelfDays, setShelfDays] = useState(60);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/stock/procure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: itemId,
          quantity: qty,
          unit_price: price,
          shelf_life_days: shelfDays
        })
      });
      if (!res.ok) throw new Error('Procurement failed');
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Inward Stock Procurement</h3>
        <p className="text-xs text-stone-500 mb-4">Executes <code className="font-mono text-amber-800">sp_procure_stock</code> stored procedure</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Food Item</label>
            <select
              value={itemId}
              onChange={(e) => setItemId(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
            >
              {items.map((it) => (
                <option key={it.item_id} value={it.item_id}>
                  {it.item_name} ({it.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Quantity (UOM)</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Unit Price (₹)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Shelf Life (Days)</label>
            <input
              type="number"
              value={shelfDays}
              onChange={(e) => setShelfDays(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
            >
              Procure Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BatchModal({ menus, onClose, onSuccess }) {
  const [menuId, setMenuId] = useState(menus[0]?.menu_id || 1);
  const [servings, setServings] = useState(2500);
  const [cook, setCook] = useState('Chef S. Somasekhar');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/batches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_id: menuId,
          target_servings: servings,
          head_cook_name: cook
        })
      });
      if (!res.ok) throw new Error('Batch creation failed');
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Schedule Cooking Batch</h3>
        <p className="text-xs text-stone-500 mb-4">Starts production in central steam cauldrons</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Select Menu</label>
            <select
              value={menuId}
              onChange={(e) => setMenuId(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
            >
              {menus.map((m) => (
                <option key={m.menu_id} value={m.menu_id}>
                  {m.menu_name} ({m.standard_calories} kcal)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Target Servings (Meals)</label>
            <input
              type="number"
              value={servings}
              onChange={(e) => setServings(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Head Cook Name</label>
            <input
              type="text"
              value={cook}
              onChange={(e) => setCook(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
            >
              Schedule Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DonationModal({ sponsors, institutions, onClose, onSuccess }) {
  const [sponsorId, setSponsorId] = useState(sponsors[0]?.sponsor_id || 1);
  const [amount, setAmount] = useState(100000);
  const [mode, setMode] = useState('NEFT_RTGS');
  const [schoolId, setSchoolId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/donations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsor_id: sponsorId,
          amount_inr: amount,
          payment_mode: mode,
          earmarked_institution_id: schoolId ? Number(schoolId) : null,
          donor_notes: 'Online Philanthropic Contribution'
        })
      });
      if (!res.ok) throw new Error('Donation failed');
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Record Philanthropic Donation</h3>
        <p className="text-xs text-stone-500 mb-4">Issues 80G tax receipt and updates impact ledger</p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Sponsor / Donor</label>
            <select
              value={sponsorId}
              onChange={(e) => setSponsorId(Number(e.target.value))}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
            >
              {sponsors.map((s) => (
                <option key={s.sponsor_id} value={s.sponsor_id}>
                  {s.sponsor_name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Amount (INR)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Payment Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="NEFT_RTGS">NEFT / RTGS</option>
                <option value="UPI">UPI Transfer</option>
                <option value="ONLINE_GATEWAY">Online Gateway</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Earmark for School (Optional)</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
            >
              <option value="">-- General Kitchen Operations Fund --</option>
              {institutions.map((inst) => (
                <option key={inst.institution_id} value={inst.institution_id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700"
            >
              Record Donation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
