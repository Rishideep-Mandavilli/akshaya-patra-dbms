import React, { useState, useEffect } from 'react';
import {
  Utensils, ChefHat, Truck, School, HeartHandshake, Database,
  Package, ClipboardList, AlertTriangle, CheckCircle2, Clock,
  Plus, Search, ArrowRight, RefreshCw, Play, FileText, Layers,
  Award, ShieldCheck, Flame, IndianRupee, Thermometer, Info,
  Check, X, BarChart3, Printer, Download, TrendingUp, Building2,
  Calendar, CheckSquare
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

  // Analytics Explorer State
  const [customSql, setCustomSql] = useState('SELECT * FROM v_daily_kitchen_summary;');
  const [queryResult, setQueryResult] = useState(null);
  const [queryRunning, setQueryRunning] = useState(false);
  const [selectedPresetQuery, setSelectedPresetQuery] = useState(1);
  const [activeDonorImpact, setActiveDonorImpact] = useState(null);

  // Modals
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [selectedDispatchForUpdate, setSelectedDispatchForUpdate] = useState(null);
  const [selectedIndentForUpdate, setSelectedIndentForUpdate] = useState(null);

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

  // Complete Cooking Batch
  const handleCompleteBatch = async (batchId, actualServings) => {
    try {
      const res = await fetch(`${API_BASE}/batches/${batchId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_servings: actualServings || 2500, food_temp_celsius: 81.5 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      triggerNotify(data.message || 'Batch completed! Inventory auto-deducted successfully.');
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
      triggerNotify('Logistics routes and school dispatches auto-scheduled successfully!');
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
      title: '1. End-to-End Kitchen Traceability Audit',
      desc: 'Trace Batch -> Menu -> Route -> Van -> School with temperatures and delivery status.',
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
      title: '2. School Wastage & Attendance Gap Report',
      desc: 'Aggregates requested vs present students and identifies leftover food wastage percentages.',
      sql: `SELECT inst.name AS school_name, inst.school_code, COUNT(di.indent_id) AS recorded_days, SUM(di.requested_meals) AS total_meals_requested, SUM(di.actual_present_students) AS total_students_present, SUM(di.leftover_meals) AS total_leftover_meals, ROUND((SUM(di.leftover_meals)::NUMERIC / NULLIF(SUM(di.requested_meals), 0)) * 100, 2) AS wastage_percentage
FROM institutions inst
JOIN daily_indents di ON inst.institution_id = di.institution_id
GROUP BY inst.name, inst.school_code
HAVING SUM(di.leftover_meals) > 0
ORDER BY wastage_percentage DESC;`
    },
    {
      id: 3,
      title: '3. Fleet Route Capacity & Load Balancing',
      desc: 'Computes delivery van capacity utilization percentage and flags fleet load status.',
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
      title: '4. Institution Enrollment Partition Ranking',
      desc: 'Ranks institutions by student size inside each delivery route corridor.',
      sql: `SELECT dr.route_code, inst.name AS school_name, inst.institution_type, inst.total_enrolled,
DENSE_RANK() OVER (PARTITION BY dr.route_id ORDER BY inst.total_enrolled DESC) AS rank_in_route
FROM institutions inst
JOIN delivery_routes dr ON inst.route_id = dr.route_id
ORDER BY dr.route_code, rank_in_route;`
    },
    {
      id: 5,
      title: '5. Batch Raw Material Economic Cost Analysis',
      desc: 'Calculates precise raw ingredient cost per batch and per individual meal serving.',
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
      title: '6. Next-Day Raw Material Bill of Materials (BOM) Forecast',
      desc: 'Forecasts exact raw ingredients required for 5,000 servings against warehouse stock.',
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
                <p className="text-xs text-amber-300 font-medium">Mega-Kitchen Operations</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] bg-amber-900/40 px-2.5 py-1.5 rounded-md text-amber-200 border border-amber-800/40">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Operational System
              </span>
              <span className="font-mono text-amber-400">Bangalore Hub</span>
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
              { id: 'reports', label: 'Daily Reports & Analytics', icon: BarChart3 }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                      : 'text-amber-200/80 hover:bg-amber-900/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-400/80'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Professional Footer Info */}
        <div className="p-4 border-t border-amber-900/60 bg-amber-950/90 text-xs text-amber-300/80">
          <p className="font-semibold text-white">The Akshaya Patra Foundation</p>
          <p className="text-[11px] text-amber-400/90">Mid-Day Meal Distribution Hub</p>
          <p className="text-[10px] text-amber-500/80 mt-1">ISO 22000 Certified • Operations v2.4</p>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-stone-800 capitalize flex items-center gap-2">
              {activeTab === 'reports' ? 'Daily Reports & Operational Analytics' : activeTab.replace('-', ' ')}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Akshaya Patra Mid-Day Meal Operations & Integrated Kitchen Management
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
              <strong className="font-semibold">System Notification:</strong>
              <p className="mt-0.5 font-mono text-xs">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-800">
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
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800">
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
                  <span className="text-xs text-stone-500 font-medium">Meals Cooked (Today)</span>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">
                    {stats.kpis.totalCookedToday.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> {stats.kpis.batchesToday} active batches
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium">Meals Dispatched</span>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">
                    {stats.kpis.totalDispatchedToday.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> {stats.kpis.schoolsDeliveredToday} schools reached
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium">Enrolled Children</span>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">
                    {stats.kpis.totalStudents.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1 font-medium">
                    Across {stats.kpis.totalSchools} partner schools
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs text-stone-500 font-medium">Total CSR Donations</span>
                  <p className="text-2xl font-bold text-stone-900 mt-0.5">
                    ₹{(stats.kpis.totalDonationsInr / 100000).toFixed(1)}L
                  </p>
                  <p className="text-[11px] text-stone-500 mt-1 font-medium">
                    {stats.kpis.donationsCount} philanthropic grants
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-xl p-4 text-white shadow-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Flame className="w-5 h-5 text-amber-100" />
                </div>
                <div>
                  <h4 className="font-bold text-sm">Mega-Kitchen Live Operations</h4>
                  <p className="text-xs text-amber-100">Schedule steam cauldrons, track dispatch routes, and procure stock</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBatchModal(true)}
                  className="px-3.5 py-1.5 bg-white text-amber-800 font-bold rounded-lg text-xs hover:bg-amber-50 shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Cooking Batch
                </button>
                <button
                  onClick={() => setShowProcureModal(true)}
                  className="px-3.5 py-1.5 bg-amber-800/80 hover:bg-amber-900 text-white font-medium rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  Procure Raw Stock
                </button>
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="px-3.5 py-1.5 bg-amber-800/80 hover:bg-amber-900 text-white font-medium rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <HeartHandshake className="w-3.5 h-3.5" />
                  Record Donation
                </button>
              </div>
            </div>

            {/* Live Sections Split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Batches Section */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat className="w-4 h-4 text-amber-600" />
                    <h3 className="text-sm font-bold text-stone-800">Production Steam Cauldrons</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('batches')}
                    className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    View All Batches <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4 divide-y divide-stone-100">
                  {stats.recentBatches.map((b) => (
                    <div key={b.batch_id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-stone-800">{b.batch_code}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            b.status === 'COOKING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-1 font-medium">{b.menu_name}</p>
                        <p className="text-[11px] text-stone-400">Head Cook: {b.head_cook_name}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-900">
                          {b.actual_servings ? `${b.actual_servings.toLocaleString()} meals` : `${b.target_servings.toLocaleString()} target`}
                        </span>
                        {b.food_temp_celsius && (
                          <p className="text-[11px] text-emerald-700 font-medium flex items-center justify-end gap-1 mt-0.5">
                            <Thermometer className="w-3 h-3" /> {b.food_temp_celsius}°C
                          </p>
                        )}
                        {b.status === 'COOKING' && (
                          <button
                            onClick={() => handleCompleteBatch(b.batch_id, b.target_servings)}
                            className="mt-1.5 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Mark Completed
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logistics Dispatches Feed */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-blue-600" />
                    <h3 className="text-sm font-bold text-stone-800">School Delivery Corridors</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('logistics')}
                    className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    View Fleet Dispatches <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="p-4 divide-y divide-stone-100">
                  {stats.liveDispatches.map((d) => (
                    <div key={d.dispatch_id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-stone-900">{d.school_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            d.delivery_status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                            d.delivery_status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-800' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {d.delivery_status}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Route {d.route_code} • {d.vehicle_number} ({d.driver_name})
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-800 font-mono">
                          {d.meals_dispatched} meals
                        </span>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Temp: {d.delivery_temp_celsius ? `${d.delivery_temp_celsius}°C` : 'En Route'}
                        </p>
                      </div>
                    </div>
                  ))}
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
              <button
                onClick={() => setShowMenuModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create New Menu
              </button>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-stone-600" />
                  Add Food Item
                </button>
                <button
                  onClick={() => setShowProcureModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Inward Stock Procurement
                </button>
              </div>
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
              <h4 className="text-sm font-bold text-stone-800 mb-2">Stock Transaction Audit Ledger</h4>
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
                <p className="text-xs text-stone-500">Live production monitoring with automated inventory deduction</p>
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
                        Complete Cooking & Deduct Stock
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

            {/* Live Dispatches Table with Update Delivery Action */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">School Dispatches & Delivery Receipts</h4>
                  <p className="text-xs text-stone-500">{dispatches.length} active delivery dispatches</p>
                </div>
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
                    <th className="py-2.5 px-4 text-right">Actions</th>
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
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedDispatchForUpdate(d)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300 text-stone-700 font-medium rounded border border-stone-200 transition-colors cursor-pointer text-[11px]"
                        >
                          {d.delivery_status === 'DELIVERED' ? 'Edit Receipt' : 'Confirm Delivery'}
                        </button>
                      </td>
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
              <button
                onClick={() => setShowSchoolModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Register New School
              </button>
            </div>

            {/* Institutions Directory */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50">
                <h4 className="text-sm font-bold text-stone-800">Partner Educational Institutions</h4>
              </div>
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

            {/* Daily School Indents & Leftover Attendance Ledger */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">Daily Indents & Attendance Logs</h4>
                  <p className="text-xs text-stone-500">Record actual present students and audit leftover meals</p>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">School</th>
                    <th className="py-2.5 px-4">Requested Meals</th>
                    <th className="py-2.5 px-4">Actual Present</th>
                    <th className="py-2.5 px-4">Leftover Meals</th>
                    <th className="py-2.5 px-4">Reason / Notes</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {indents.map((indent) => (
                    <tr key={indent.indent_id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono text-stone-500">
                        {new Date(indent.indent_date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-900">{indent.school_name}</td>
                      <td className="py-3 px-4 font-bold text-stone-800">{indent.requested_meals}</td>
                      <td className="py-3 px-4 font-mono">
                        {indent.actual_present_students !== null ? (
                          <span className="font-bold text-emerald-700">{indent.actual_present_students}</span>
                        ) : (
                          <span className="text-stone-400 italic">Pending attendance</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {indent.leftover_meals > 0 ? (
                          <span className="text-rose-600 font-bold">{indent.leftover_meals}</span>
                        ) : (
                          <span className="text-stone-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-stone-600 text-[11px]">
                        {indent.wastage_reason || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedIndentForUpdate(indent)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-stone-700 font-medium rounded border border-stone-200 transition-colors cursor-pointer text-[11px]"
                        >
                          Record Attendance
                        </button>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSponsorModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-stone-600" />
                  Register Sponsor
                </button>
                <button
                  onClick={() => setShowDonationModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Record New Donation
                </button>
              </div>
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

            {/* Recent Donations Ledger */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50">
                <h4 className="text-sm font-bold text-stone-800">Philanthropic Grants & 80G Receipts</h4>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Receipt No</th>
                    <th className="py-2.5 px-4">Donor Name</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4">Payment Mode</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Earmarked School</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {donations.map((d) => (
                    <tr key={d.donation_id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-mono font-medium text-amber-800">{d.tax_exemption_80g_receipt}</td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{d.sponsor_name}</td>
                      <td className="py-3 px-4 font-bold text-stone-900 font-mono">₹{parseFloat(d.amount_inr).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700">
                          {d.payment_mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-stone-500">{new Date(d.donation_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-stone-600">{d.earmarked_school_name || 'Central Kitchen Fund'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Impact Certificate Modal */}
            {activeDonorImpact && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl border-4 border-amber-400 relative">
                  <button
                    onClick={() => setActiveDonorImpact(null)}
                    className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 cursor-pointer"
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
                      Certified on: {new Date().toLocaleDateString()} • Verified by Central Kitchen Records
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 8: DAILY REPORTS & OPERATIONAL ANALYTICS */}
        {activeTab === 'reports' && (
          <div className="p-8 space-y-8">
            {/* Reports Banner */}
            <div className="bg-gradient-to-r from-stone-900 to-amber-950 text-white p-6 rounded-2xl shadow-md border border-stone-800 flex items-center justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-amber-950 uppercase tracking-wider">
                  Operational Intelligence & Daily Reports
                </span>
                <h3 className="text-2xl font-bold mt-2 tracking-wide">Mega-Kitchen Daily Reports & Analytics Hub</h3>
                <p className="text-xs text-amber-200/80 mt-1 max-w-2xl">
                  Comprehensive audit of daily meal preparation, school dispatch fulfillment, raw inventory reserve balance, and custom operational query analytics.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save Daily Report
              </button>
            </div>

            {/* Daily Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-xs text-stone-500 font-medium">Total Prepared Meals</span>
                <p className="text-xl font-bold text-stone-900 mt-1">
                  {stats?.kpis?.totalCookedToday?.toLocaleString() || 0}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">Across {batches.length} cooking batches</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-xs text-stone-500 font-medium">Total Dispatched</span>
                <p className="text-xl font-bold text-blue-700 mt-1">
                  {stats?.kpis?.totalDispatchedToday?.toLocaleString() || 0}
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">{dispatches.length} school drops</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-xs text-stone-500 font-medium">Delivered & Verified</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  {dispatches.filter(d => d.delivery_status === 'DELIVERED').reduce((acc, cur) => acc + (cur.meals_dispatched || 0), 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-emerald-600 mt-0.5">Signed by schools</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
                <span className="text-xs text-stone-500 font-medium">Low Stock Alerts</span>
                <p className="text-xl font-bold text-rose-600 mt-1">
                  {stats?.kpis?.lowStockAlerts || 0}
                </p>
                <p className="text-[11px] text-rose-500 mt-0.5">Requires immediate replenishment</p>
              </div>
            </div>

            {/* Report Table 1: Daily Production & Distribution Summary */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">Daily Kitchen Batch Production & Dispatch Fulfillment</h4>
                  <p className="text-xs text-stone-500">Traceability of prepared servings vs actual meals loaded into delivery fleet</p>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Batch Code</th>
                    <th className="py-2.5 px-4">Menu Name</th>
                    <th className="py-2.5 px-4">Head Cook</th>
                    <th className="py-2.5 px-4">Prepared Servings</th>
                    <th className="py-2.5 px-4">Dispatched Meals</th>
                    <th className="py-2.5 px-4">Fulfillment Rate</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {batches.map((b) => {
                    const prepared = b.actual_servings || b.target_servings;
                    const dispatched = b.total_dispatched_so_far || 0;
                    const rate = prepared > 0 ? ((dispatched / prepared) * 100).toFixed(1) : 0;
                    return (
                      <tr key={b.batch_id} className="hover:bg-stone-50/50">
                        <td className="py-3 px-4 font-mono font-medium text-stone-700">{b.batch_code}</td>
                        <td className="py-3 px-4 font-semibold text-stone-900">{b.menu_name}</td>
                        <td className="py-3 px-4 text-stone-600">{b.head_cook_name}</td>
                        <td className="py-3 px-4 font-bold text-stone-900 font-mono">{prepared.toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-blue-700 font-mono">{dispatched.toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            Number(rate) >= 90 ? 'bg-emerald-100 text-emerald-800' :
                            Number(rate) >= 50 ? 'bg-amber-100 text-amber-800' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {rate}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Report Table 2: Available Food Stock & Remaining Raw Inventory */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-800">Available Food Stock & Remaining Inventory Balances</h4>
                  <p className="text-xs text-stone-500">Current warehouse reserve quantities vs minimum replenishment thresholds</p>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Item Name</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">UOM</th>
                    <th className="py-2.5 px-4">Available Warehouse Qty</th>
                    <th className="py-2.5 px-4">Safety Buffer Threshold</th>
                    <th className="py-2.5 px-4">Inventory Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((it) => (
                    <tr key={it.item_id} className="hover:bg-stone-50/50">
                      <td className="py-3 px-4 font-semibold text-stone-900">{it.item_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700">
                          {it.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">{it.uom}</td>
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {parseFloat(it.total_available_stock).toFixed(1)} {it.uom}
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-500">
                        {parseFloat(it.min_stock_threshold).toFixed(1)} {it.uom}
                      </td>
                      <td className="py-3 px-4">
                        {it.is_low_stock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Deficit / Reorder Needed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 w-fit">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Adequate Reserve
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Custom Operational Query & Analytics Console */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-xs p-6 space-y-6">
              <div>
                <h4 className="text-base font-bold text-stone-900 flex items-center gap-2">
                  <TerminalIcon className="w-5 h-5 text-amber-600" />
                  Live Operational SQL Analytics Console
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  Execute custom operational audits and analytical queries directly across live kitchen tables.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Presets List */}
                <div className="bg-stone-50/70 rounded-xl border border-stone-200 p-4">
                  <h5 className="text-xs font-bold text-stone-800 mb-2 uppercase tracking-wider">
                    Saved Operational Reports
                  </h5>
                  <div className="space-y-2">
                    {PRESET_QUERIES.map((pq) => (
                      <button
                        key={pq.id}
                        onClick={() => {
                          setSelectedPresetQuery(pq.id);
                          setCustomSql(pq.sql);
                          handleRunQuery(pq.sql);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                          selectedPresetQuery === pq.id
                            ? 'border-amber-600 bg-amber-50 text-amber-950 font-medium shadow-xs'
                            : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                        }`}
                      >
                        <p className="font-semibold">{pq.title}</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">{pq.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Query Editor & Execution Output */}
                <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-stone-700">Query Editor</span>
                      <button
                        onClick={() => handleRunQuery()}
                        disabled={queryRunning}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        {queryRunning ? 'Running...' : 'Run Analysis'}
                      </button>
                    </div>

                    <textarea
                      rows={6}
                      value={customSql}
                      onChange={(e) => setCustomSql(e.target.value)}
                      className="w-full font-mono text-xs bg-stone-900 text-emerald-400 p-4 rounded-xl border border-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Enter custom SQL query (e.g. SELECT * FROM menus;)"
                    />
                  </div>

                  {/* Results Display */}
                  <div>
                    {queryResult && (
                      <div>
                        <div className="flex items-center justify-between text-xs py-1.5 px-3 bg-stone-100 rounded-t-lg border-x border-t border-stone-200 font-mono">
                          <span className="text-stone-700">
                            {queryResult.success ? `Result: ${queryResult.rowCount || 0} rows returned` : 'Execution Failed'}
                          </span>
                          <span className="text-stone-500">{queryResult.durationMs ? `${queryResult.durationMs}ms` : ''}</span>
                        </div>

                        {queryResult.success ? (
                          <div className="max-h-60 overflow-auto border border-stone-200 rounded-b-lg">
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
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODALS */}
        {/* ========================================================================= */}

        {/* MODAL 1: PROCURE STOCK */}
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

        {/* MODAL 2: SCHEDULE BATCH */}
        {showBatchModal && (
          <BatchModal
            menus={menus}
            onClose={() => setShowBatchModal(false)}
            onSuccess={() => {
              setShowBatchModal(false);
              triggerNotify('Cooking batch scheduled successfully in steam cauldrons!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 3: RECORD DONATION */}
        {showDonationModal && (
          <DonationModal
            sponsors={sponsors}
            institutions={institutions}
            onClose={() => setShowDonationModal(false)}
            onSuccess={() => {
              setShowDonationModal(false);
              triggerNotify('Donation recorded and 80G tax receipt generated!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 4: CREATE MENU */}
        {showMenuModal && (
          <MenuModal
            items={items}
            onClose={() => setShowMenuModal(false)}
            onSuccess={() => {
              setShowMenuModal(false);
              triggerNotify('New menu and standard recipe ingredients created successfully!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 5: ADD FOOD ITEM */}
        {showItemModal && (
          <FoodItemModal
            onClose={() => setShowItemModal(false)}
            onSuccess={() => {
              setShowItemModal(false);
              triggerNotify('New food item added to master catalog!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 6: REGISTER SCHOOL */}
        {showSchoolModal && (
          <SchoolModal
            routes={routes}
            onClose={() => setShowSchoolModal(false)}
            onSuccess={() => {
              setShowSchoolModal(false);
              triggerNotify('New educational institution registered successfully!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 7: REGISTER SPONSOR */}
        {showSponsorModal && (
          <SponsorModal
            onClose={() => setShowSponsorModal(false)}
            onSuccess={() => {
              setShowSponsorModal(false);
              triggerNotify('New sponsor organization registered successfully!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 8: UPDATE DISPATCH / DELIVERY */}
        {selectedDispatchForUpdate && (
          <UpdateDeliveryModal
            dispatch={selectedDispatchForUpdate}
            onClose={() => setSelectedDispatchForUpdate(null)}
            onSuccess={() => {
              setSelectedDispatchForUpdate(null);
              triggerNotify('Delivery receipt updated and arrival recorded!');
              fetchAllData();
            }}
          />
        )}

        {/* MODAL 9: RECORD ATTENDANCE & LEFTOVERS */}
        {selectedIndentForUpdate && (
          <RecordAttendanceModal
            indent={selectedIndentForUpdate}
            onClose={() => setSelectedIndentForUpdate(null)}
            onSuccess={() => {
              setSelectedIndentForUpdate(null);
              triggerNotify('Attendance and leftover audit saved successfully!');
              fetchAllData();
            }}
          />
        )}

      </main>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS & MODALS
// ============================================================================

function TerminalIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

// 1. Inward Stock Procurement Modal
function ProcureModal({ items, onClose, onSuccess }) {
  const [itemId, setItemId] = useState(items[0]?.item_id || 1);
  const [qty, setQty] = useState(500);
  const [price, setPrice] = useState(45);
  const [shelfDays, setShelfDays] = useState(60);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Procurement failed');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Inward Stock Procurement</h3>
        <p className="text-xs text-stone-500 mb-4">Record warehouse arrival of grains, pulses, or fresh ingredients</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

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
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              Procure Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Schedule Cooking Batch Modal
function BatchModal({ menus, onClose, onSuccess }) {
  const [menuId, setMenuId] = useState(menus[0]?.menu_id || 1);
  const [servings, setServings] = useState(2500);
  const [cook, setCook] = useState('Chef S. Somasekhar');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Batch creation failed');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Schedule Cooking Batch</h3>
        <p className="text-xs text-stone-500 mb-4">Starts production in central automated steam cauldrons</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

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
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
            >
              Schedule Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Record Donation Modal
function DonationModal({ sponsors, institutions, onClose, onSuccess }) {
  const [sponsorId, setSponsorId] = useState(sponsors[0]?.sponsor_id || 1);
  const [amount, setAmount] = useState(100000);
  const [mode, setMode] = useState('NEFT_RTGS');
  const [schoolId, setSchoolId] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
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
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Donation failed');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Record Philanthropic Donation</h3>
        <p className="text-xs text-stone-500 mb-4">Issues 80G tax receipt and updates impact ledger</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

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
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
            >
              Record Donation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. Create New Menu & BOM Modal
function MenuModal({ items, onClose, onSuccess }) {
  const [menuName, setMenuName] = useState('');
  const [mealCategory, setMealCategory] = useState('RICE_SAMBAR');
  const [description, setDescription] = useState('');
  const [standardCalories, setStandardCalories] = useState(650);
  const [selectedIngredients, setSelectedIngredients] = useState([
    { item_id: items[0]?.item_id || 1, qty_per_meal: 0.12, uom: 'KG' }
  ]);
  const [error, setError] = useState(null);

  const addIngredientRow = () => {
    setSelectedIngredients([
      ...selectedIngredients,
      { item_id: items[0]?.item_id || 1, qty_per_meal: 0.05, uom: 'KG' }
    ]);
  };

  const removeIngredientRow = (index) => {
    setSelectedIngredients(selectedIngredients.filter((_, i) => i !== index));
  };

  const updateIngredientRow = (index, field, val) => {
    const updated = [...selectedIngredients];
    updated[index][field] = val;
    setSelectedIngredients(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/menus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_name: menuName,
          meal_category: mealCategory,
          description: description,
          standard_calories: Number(standardCalories),
          ingredients: selectedIngredients
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create menu');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-bold text-stone-900 mb-1">Create Standard Daily Menu</h3>
        <p className="text-xs text-stone-500 mb-4">Define meal nutrition and exact recipe Bill of Materials (BOM)</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Menu Name</label>
            <input
              type="text"
              placeholder="e.g. Sona Masoori Rice & Drumstick Dal"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Meal Category</label>
              <select
                value={mealCategory}
                onChange={(e) => setMealCategory(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="RICE_SAMBAR">Rice & Sambar</option>
                <option value="BISI_BELE_BATH">Bisi Bele Bath</option>
                <option value="CURD_RICE">Curd Rice & Pickle</option>
                <option value="SPECIAL_FESTIVE">Special Festive Meal</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Standard Calories (kcal)</label>
              <input
                type="number"
                value={standardCalories}
                onChange={(e) => setStandardCalories(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Description</label>
            <textarea
              rows={2}
              placeholder="Nutritional composition and dietary remarks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          {/* Recipe Ingredients BOM */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-stone-800">Recipe Ingredients (Per 1 Meal Serving)</label>
              <button
                type="button"
                onClick={addIngredientRow}
                className="text-amber-700 hover:text-amber-900 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {selectedIngredients.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
                  <select
                    value={row.item_id}
                    onChange={(e) => updateIngredientRow(idx, 'item_id', Number(e.target.value))}
                    className="flex-1 p-1.5 border border-stone-300 rounded text-xs bg-white"
                  >
                    {items.map((it) => (
                      <option key={it.item_id} value={it.item_id}>
                        {it.item_name} ({it.category})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Qty per meal"
                    value={row.qty_per_meal}
                    onChange={(e) => updateIngredientRow(idx, 'qty_per_meal', parseFloat(e.target.value) || 0)}
                    className="w-24 p-1.5 border border-stone-300 rounded text-xs bg-white"
                    required
                  />
                  <select
                    value={row.uom}
                    onChange={(e) => updateIngredientRow(idx, 'uom', e.target.value)}
                    className="w-20 p-1.5 border border-stone-300 rounded text-xs bg-white"
                  >
                    <option value="KG">KG</option>
                    <option value="LITER">LITER</option>
                    <option value="UNIT">UNIT</option>
                  </select>
                  {selectedIngredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredientRow(idx)}
                      className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
            >
              Create Menu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 5. Add Food Item Modal
function FoodItemModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('GRAINS');
  const [uom, setUom] = useState('KG');
  const [minThreshold, setMinThreshold] = useState(25.0);
  const [shelfLife, setShelfLife] = useState(90);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: name,
          category: category,
          uom: uom,
          min_stock_threshold: Number(minThreshold),
          shelf_life_days: Number(shelfLife)
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add food item');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Add Food Item to Master Catalog</h3>
        <p className="text-xs text-stone-500 mb-4">Define raw ingredient attributes and replenishment parameters</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Item Name</label>
            <input
              type="text"
              placeholder="e.g. Sona Masoori Raw Rice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="GRAINS">Grains</option>
                <option value="PULSES">Pulses</option>
                <option value="VEGETABLES">Vegetables</option>
                <option value="DAIRY">Dairy</option>
                <option value="SPICES_OILS">Spices & Oils</option>
                <option value="PACKAGING">Packaging</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Unit of Measure (UOM)</label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="KG">Kilogram (KG)</option>
                <option value="LITER">Liter (LITER)</option>
                <option value="UNIT">Unit / Count</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Min Reorder Level</label>
              <input
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Shelf Life (Days)</label>
              <input
                type="number"
                value={shelfLife}
                onChange={(e) => setShelfLife(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
            >
              Save Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 6. Register New School / Institution Modal
function SchoolModal({ routes, onClose, onSuccess }) {
  const [schoolCode, setSchoolCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('GOVERNMENT_PRIMARY');
  const [routeId, setRouteId] = useState(routes[0]?.route_id || 1);
  const [principal, setPrincipal] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [enrolled, setEnrolled] = useState(300);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/institutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_code: schoolCode || `SCH-BLR-${Date.now().toString().slice(-4)}`,
          name: name,
          institution_type: type,
          route_id: Number(routeId),
          principal_name: principal,
          phone: phone,
          email: email,
          address: address,
          total_enrolled: Number(enrolled)
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register school');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-stone-200 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-bold text-stone-900 mb-1">Register Educational Institution</h3>
        <p className="text-xs text-stone-500 mb-4">Add government or aided school to mid-day meal delivery network</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">School Code</label>
              <input
                type="text"
                placeholder="e.g. BLR-N-005"
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Institution Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="GOVERNMENT_PRIMARY">Government Primary</option>
                <option value="GOVERNMENT_HIGH">Government High School</option>
                <option value="AIDED_SECONDARY">Aided Secondary</option>
                <option value="ANGANWADI">Anganwadi Center</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">School / College Name</label>
            <input
              type="text"
              placeholder="e.g. Government Model Primary School, Hebbal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Assigned Logistics Route</label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(Number(e.target.value))}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                {routes.map((r) => (
                  <option key={r.route_id} value={r.route_id}>
                    {r.route_code} - {r.route_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Enrolled Students Count</label>
              <input
                type="number"
                value={enrolled}
                onChange={(e) => setEnrolled(Number(e.target.value))}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Principal / Headmaster Name</label>
              <input
                type="text"
                placeholder="e.g. Smt. Kamala Devi"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98450 XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Address & Landmark</label>
            <input
              type="text"
              placeholder="Full physical street address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
            >
              Register School
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 7. Register New Sponsor Modal
function SponsorModal({ onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('CORPORATE_CSR');
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sponsors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          organization_type: type,
          pan_number: pan,
          email: email,
          phone: phone,
          address: address
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to register sponsor');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Register Sponsor / Benefactor</h3>
        <p className="text-xs text-stone-500 mb-4">Onboard CSR corporate donor or philanthropic endowment</p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Organization / Sponsor Name</label>
            <input
              type="text"
              placeholder="e.g. Tata Trusts / Infosys Foundation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Organization Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="CORPORATE_CSR">Corporate CSR</option>
                <option value="PHILANTHROPIC_TRUST">Philanthropic Trust</option>
                <option value="INDIVIDUAL_DONOR">Individual Donor</option>
                <option value="GOVERNMENT_GRANT">Government Grant</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">PAN Number (for 80G)</label>
              <input
                type="text"
                placeholder="AAACT1234F"
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Email Address</label>
              <input
                type="email"
                placeholder="csr@org.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
            <div>
              <label className="font-semibold text-stone-700">Phone</label>
              <input
                type="text"
                placeholder="+91 80 XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Registered Office Address</label>
            <input
              type="text"
              placeholder="Corporate headquarters address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 cursor-pointer"
            >
              Register Sponsor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 8. Update Delivery Status Modal
function UpdateDeliveryModal({ dispatch, onClose, onSuccess }) {
  const [status, setStatus] = useState(dispatch.delivery_status || 'DELIVERED');
  const [temp, setTemp] = useState(dispatch.delivery_temp_celsius || 68.5);
  const [signature, setSignature] = useState(dispatch.received_by_signature || '');
  const [notes, setNotes] = useState(dispatch.notes || 'Delivered warm and verified in good condition');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/dispatches/${dispatch.dispatch_id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_status: status,
          delivery_temp_celsius: Number(temp),
          received_by_signature: signature,
          notes: notes
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update delivery');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Confirm School Delivery Receipt</h3>
        <p className="text-xs text-stone-500 mb-4">
          Dispatch #{dispatch.dispatch_id} for <strong className="text-stone-800">{dispatch.school_name}</strong>
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700">Delivery Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              >
                <option value="DELIVERED">DELIVERED</option>
                <option value="IN_TRANSIT">IN TRANSIT</option>
                <option value="SCHEDULED">SCHEDULED</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-stone-700">Arrival Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Receiver Name / Signature</label>
            <input
              type="text"
              placeholder="e.g. Headmaster R. Narayan / Teacher-in-Charge"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-stone-700">Handover Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              Confirm Delivery
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 9. Record Attendance & Leftovers Modal
function RecordAttendanceModal({ indent, onClose, onSuccess }) {
  const [actualPresent, setActualPresent] = useState(indent.actual_present_students ?? indent.requested_meals);
  const [reason, setReason] = useState(indent.wastage_reason || 'NORMAL_CONSUMPTION');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/indents/${indent.indent_id}/leftovers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actual_present_students: Number(actualPresent),
          wastage_reason: reason
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update attendance');
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-stone-200">
        <h3 className="text-base font-bold text-stone-900 mb-1">Record Daily Attendance & Leftovers</h3>
        <p className="text-xs text-stone-500 mb-4">
          School: <strong className="text-stone-800">{indent.school_name}</strong> • Requested Meals: <strong className="text-stone-800">{indent.requested_meals}</strong>
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-stone-700">Actual Present Students Fed</label>
            <input
              type="number"
              value={actualPresent}
              onChange={(e) => setActualPresent(Number(e.target.value))}
              max={indent.requested_meals}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
              required
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Leftover food will be automatically calculated as ({indent.requested_meals} - {actualPresent} = {Math.max(0, indent.requested_meals - actualPresent)} meals)
            </p>
          </div>

          <div>
            <label className="font-semibold text-stone-700">Attendance Variance / Leftover Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full p-2 border border-stone-300 rounded-lg text-xs"
            >
              <option value="NORMAL_CONSUMPTION">Normal Attendance (All Meals Consumed)</option>
              <option value="ABSENTEEISM_RAIN">Monsoon Heavy Rain Absenteeism</option>
              <option value="SCHOOL_EXAM_HALF_DAY">Mid-Term Exam Half Day Schedule</option>
              <option value="LOCAL_FESTIVAL">Local Community Festival</option>
              <option value="EXCESS_PORTION_SIZE">Excess Portion / Low Appetite</option>
            </select>
          </div>

          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
            >
              Save Attendance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
