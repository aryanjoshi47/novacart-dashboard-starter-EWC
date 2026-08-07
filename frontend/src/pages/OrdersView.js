import React, { useState, useEffect } from 'react';
import { RotateCcw, Download, BarChart2, Table2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Navbar from '../components/Navbar';
import { exportToExcel } from '../utils/exportExcel';
import TopControls from '../components/TopControls';
import { getSummary, getOrders, getCities, readStoredDate } from '../utils/api';
import Disclaimer from '../components/Disclaimer';
import { useTheme } from '../utils/ThemeContext';

// Visually hidden but available to screen readers
const srOnly = {
  position: 'absolute', width: 1, height: 1,
  padding: 0, margin: -1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

const DEFAULT_START = '2022-01-01';
const DEFAULT_END   = '2022-12-31';

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${Number(value).toFixed(2)}`;
}

export default function OrdersView() {
  useEffect(() => { document.title = 'Orders — NovaCart'; }, []);
  const { dark } = useTheme();
  const tooltipStyle = dark
    ? { backgroundColor: '#1A1A24', border: '1px solid #2E3D52', color: '#EDE9FE' }
    : { backgroundColor: '#ffffff', border: '1px solid #E0E6ED', color: '#1A2332' };

  const [startDate, setStartDate] = useState(() => readStoredDate('dashboardDates_start', DEFAULT_START));
  const [endDate,   setEndDate]   = useState(() => readStoredDate('dashboardDates_end',   DEFAULT_END));

  // Summary + orders — shared load, no per-card controls
  const [summary,      setSummary]      = useState(null);
  const [orders,       setOrders]       = useState([]);
  const [mainLoading,  setMainLoading]  = useState(true);
  const [mainError,    setMainError]    = useState(null);

  // Cities — independent load with its own controls
  const [cities,        setCities]        = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [citiesError,   setCitiesError]   = useState(null);

  const [ordersTableView, setOrdersTableView] = useState(false);
  const [citiesTableView, setCitiesTableView] = useState(false);

  // Cities limit: stored as string draft so backspace works freely
  const [citiesLimitDraft, setCitiesLimitDraft] = useState('10');
  const [citiesSortOrder,  setCitiesSortOrder]  = useState('desc');

  const isDefault = startDate === DEFAULT_START && endDate === DEFAULT_END;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // If stored dates fail validation, silently fall back to defaults
    const bad = !!validateRange(startDate, endDate);
    const start = bad ? DEFAULT_START : startDate;
    const end   = bad ? DEFAULT_END   : endDate;
    if (bad) {
      setStartDate(start);
      setEndDate(end);
      localStorage.setItem('dashboardDates_start', start);
      localStorage.setItem('dashboardDates_end',   end);
    }
    loadMain(start, end);
    loadCities(start, end, 10, 'desc');
  }, []);

  useEffect(() => { localStorage.setItem('dashboardDates_start', startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem('dashboardDates_end',   endDate);   }, [endDate]);

  function validateRange(start, end) {
    if (start > end) return 'Start date must be on or before the end date.';
    const days = (new Date(end) - new Date(start)) / 86400000;
    if (days > 366 * 3) return 'Date range cannot exceed 3 years.';
    return null;
  }

  function handleApply() {
    const err = validateRange(startDate, endDate);
    if (err) { setMainError(err); return; }
    const lim = Math.min(100, Math.max(1, parseInt(citiesLimitDraft, 10) || 10));
    setCitiesLimitDraft(String(lim));
    loadMain(startDate, endDate);
    loadCities(startDate, endDate, lim, citiesSortOrder);
  }

  function handleReset() {
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    setMainError(null);
    const lim = Math.min(100, Math.max(1, parseInt(citiesLimitDraft, 10) || 10));
    loadMain(DEFAULT_START, DEFAULT_END);
    loadCities(DEFAULT_START, DEFAULT_END, lim, citiesSortOrder);
  }

  // Loads summary + orders only — unaffected by cities controls
  async function loadMain(start, end) {
    // Guard: never send a range the backend will reject
    const rangeErr = validateRange(start, end);
    if (rangeErr) { setMainError(rangeErr); setMainLoading(false); return; }
    setMainLoading(true);
    setMainError(null);
    try {
      const [s, o] = await Promise.all([
        getSummary(start, end),
        getOrders(start, end),
      ]);
      setSummary(s);
      setOrders(Array.isArray(o) ? o : []);
    } catch (err) {
      setMainError(err.message);
    } finally {
      setMainLoading(false);
    }
  }

  // Loads cities only — independent, safe to retry without touching orders
  async function loadCities(start, end, lim, sort) {
    setCitiesLoading(true);
    setCitiesError(null);
    try {
      const c = await getCities(start, end, { limit: lim, sortOrder: sort });
      setCities(Array.isArray(c) ? c : []);
    } catch (err) {
      setCitiesError(err.message);
    } finally {
      setCitiesLoading(false);
    }
  }

  function applyCitiesControls(lim, sort) {
    setCitiesSortOrder(sort);
    loadCities(startDate, endDate, lim, sort);
  }

  function commitCitiesLimit() {
    const lim = Math.min(100, Math.max(1, parseInt(citiesLimitDraft, 10) || 10));
    setCitiesLimitDraft(String(lim));
    applyCitiesControls(lim, citiesSortOrder);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', marginLeft: 'var(--sidebar-width)', transition: 'margin-left 0.22s ease', overflowX: 'hidden' }}>
      <Navbar />
      <TopControls />
      <main className="page" id="main-content" aria-labelledby="page-heading">
        <h1 id="page-heading" style={srOnly}>Orders</h1>

        <div className="filter-bar" role="search" aria-label="Date range filter">
          <div className="filter-bar-dates">
            <div className="filter-bar-field">
              <label htmlFor="orders-start-date">From</label>
              <input id="orders-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="filter-bar-field">
              <label htmlFor="orders-end-date">To</label>
              <input id="orders-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="filter-bar-actions">
            <button className="btn-apply" onClick={handleApply}>Apply</button>
            <button className="btn-reset" onClick={handleReset} aria-label="Reset dates to default"><RotateCcw size={14} strokeWidth={2.5} aria-hidden="true" /></button>
            <button
              className="btn-card-export"
              disabled={mainLoading || citiesLoading}
              aria-label="Export all orders data to Excel"
              onClick={() => exportToExcel(`orders_all_${startDate}_${endDate}`, [
                {
                  sheetName: 'Monthly Revenue',
                  headers: ['Month', 'Order Count', 'Revenue ($)'],
                  rows: orders.map(o => [o.month_name, o.order_count, o.revenue]),
                  colWidths: [{ wch: 14 }, { wch: 14 }, { wch: 16 }],
                },
                {
                  sheetName: 'Revenue by City',
                  headers: ['City', 'State', 'Order Count', 'Revenue ($)'],
                  rows: cities.map(c => [c.city, c.state, c.order_count, c.revenue]),
                  colWidths: [{ wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 16 }],
                },
              ])}
            >
              <Download size={13} strokeWidth={2} aria-hidden="true" />Export All
            </button>
          </div>
          <span className="filter-bar-hint">Date range limit: 3 years</span>
        </div>

        {mainError && (
          <div className="error-box" role="alert">
            {mainError}
            <button onClick={() => setMainError(null)} aria-label="Dismiss error" style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 300, color: '#C62828' }}>✕</button>
          </div>
        )}

        {/* ── Stat cards + Monthly Revenue — show skeleton while loading ── */}
        {mainLoading ? (
          <div aria-busy="true" aria-label="Loading orders data">
            {/* Stat box skeletons */}
            <div className="skeleton-stat-row">
              {[1,2,3].map(i => (
                <div key={i} className="skeleton-stat-box">
                  <div className="skeleton sk-label" />
                  <div className="skeleton sk-value" />
                </div>
              ))}
            </div>
            {/* Monthly revenue card skeleton */}
            <div className="skeleton-card">
              <div className="skeleton-card-header">
                <div className="skeleton sk-title" />
                <div className="skeleton sk-btn" />
              </div>
              <div className="skeleton sk-chart" />
            </div>
          </div>
        ) : !mainError && (
          <>
            <div className="stat-row">
              <div className="stat-box">
                <div className="label" aria-label="Total Revenue">Total Revenue</div>
                <div className="value">{summary?.total_revenue?.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</div>
              </div>
              <div className="stat-box">
                <div className="label" aria-label="Total Orders">Total Orders</div>
                <div className="value">{summary?.total_orders?.toLocaleString()}</div>
              </div>
              <div className="stat-box">
                <div className="label" aria-label="Unique Customers">Unique Customers</div>
                <div className="value">{summary?.unique_customers?.toLocaleString()}</div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <div className="section-title">Monthly Revenue</div>
                <div className="card-actions">
                  <button
                    className={`btn-toggle-view${ordersTableView ? ' active' : ''}`}
                    onClick={() => setOrdersTableView(v => !v)}
                    aria-pressed={ordersTableView}
                    aria-label={ordersTableView ? 'Switch to chart view' : 'Switch to table view (accessible)'}
                  >
                    {ordersTableView ? <><BarChart2 size={13} strokeWidth={2} aria-hidden="true" />Chart</> : <><Table2 size={13} strokeWidth={2} aria-hidden="true" />Table</>}
                  </button>
                  <button
                    className="btn-card-export"
                    disabled={orders.length === 0}
                    aria-label="Export monthly revenue to Excel"
                    onClick={() => exportToExcel(`monthly_revenue_${startDate}_${endDate}`, [{
                      sheetName: 'Monthly Revenue',
                      headers: ['Month', 'Order Count', 'Revenue ($)'],
                      rows: orders.map(o => [o.month_name, o.order_count, o.revenue]),
                      colWidths: [{ wch: 14 }, { wch: 14 }, { wch: 16 }],
                    }])}
                  >
                    <Download size={13} strokeWidth={2} aria-hidden="true" />Export
                  </button>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="loading">No data available</div>
              ) : ordersTableView ? (
                <div className="inline-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th className="right">Order Count</th>
                        <th className="right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(o => (
                        <tr key={o.month}>
                          <td>{o.month_name}</td>
                          <td className="right mono">{o.order_count?.toLocaleString()}</td>
                          <td className="right mono">{formatCurrency(o.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div role="img" aria-label="Monthly revenue line chart">
                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={orders} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="month_name"
                      interval={0}
                      tickFormatter={v => v.slice(0, 3)}
                      tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    />
                    <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} labelFormatter={v => v} contentStyle={tooltipStyle} />
                    <Line type="linear" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── Revenue by City — independent load, own error + shimmer ── */}
        <div className={`card${citiesLoading ? ' card-loading-wrap' : ''}`}>
          {citiesLoading && <div className="card-loading-mask" />}

          <div className="card-header">
            <div className="section-title">Revenue by City</div>
            <div className="card-actions">
              <button
                className={`btn-toggle-view${citiesTableView ? ' active' : ''}`}
                onClick={() => setCitiesTableView(v => !v)}
                aria-pressed={citiesTableView}
                aria-label={citiesTableView ? 'Switch to chart view' : 'Switch to table view (accessible)'}
              >
                {citiesTableView ? <><BarChart2 size={13} strokeWidth={2} aria-hidden="true" />Chart</> : <><Table2 size={13} strokeWidth={2} aria-hidden="true" />Table</>}
              </button>
              <button
                className="btn-card-export"
                disabled={citiesLoading || cities.length === 0}
                aria-label="Export revenue by city to Excel"
                onClick={() => exportToExcel(`revenue_by_city_${startDate}_${endDate}`, [{
                  sheetName: 'Revenue by City',
                  headers: ['City', 'State', 'Order Count', 'Revenue ($)'],
                  rows: cities.map(c => [c.city, c.state, c.order_count, c.revenue]),
                  colWidths: [{ wch: 20 }, { wch: 8 }, { wch: 14 }, { wch: 16 }],
                }])}
              >
                <Download size={13} strokeWidth={2} aria-hidden="true" />Export
              </button>
            </div>
          </div>

          <div className="card-controls">
            <label htmlFor="cities-limit">Show</label>
            <input
              id="cities-limit"
              type="number" min="1" max="100"
              value={citiesLimitDraft}
              onChange={e => setCitiesLimitDraft(e.target.value)}
              onBlur={commitCitiesLimit}
              onKeyDown={e => e.key === 'Enter' && commitCitiesLimit()}
            />
            <label htmlFor="cities-sort">Sort</label>
            <select
              id="cities-sort"
              value={citiesSortOrder}
              onChange={e => {
                const sort = e.target.value;
                setCitiesSortOrder(sort);
                const lim = Math.min(100, Math.max(1, parseInt(citiesLimitDraft, 10) || 10));
                applyCitiesControls(lim, sort);
              }}
            >
              <option value="desc">Top (highest revenue)</option>
              <option value="asc">Bottom (lowest revenue)</option>
            </select>
          </div>

          {citiesError ? (
            <div className="error-box" role="alert" style={{ marginBottom: 0 }}>
              {citiesError}
              <button onClick={() => setCitiesError(null)} aria-label="Dismiss error" style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 300, color: '#C62828' }}>✕</button>
            </div>
          ) : cities.length === 0 ? (
            <div className="loading">No data available</div>
          ) : citiesTableView ? (
            <div className="inline-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>City</th>
                    <th>State</th>
                    <th className="right">Order Count</th>
                    <th className="right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {cities.map(c => (
                    <tr key={`${c.city}-${c.state}`}>
                      <td>{c.city}</td>
                      <td className="muted">{c.state}</td>
                      <td className="right mono">{c.order_count?.toLocaleString()}</td>
                      <td className="right mono">{formatCurrency(c.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div role="img" aria-label="Revenue by city bar chart">
            <ResponsiveContainer width="100%" height={Math.max(200, cities.length * 36)}>
              <BarChart data={cities} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                <YAxis type="category" dataKey="city" width={130} interval={0} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill="var(--blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          )}
        </div>

        <Disclaimer />
      </main>
    </div>
  );
}
