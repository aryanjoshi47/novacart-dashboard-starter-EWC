import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { exportToExcel } from '../utils/exportExcel';
import TopControls from '../components/TopControls';
import { getCustomers, readStoredDate } from '../utils/api';
import Disclaimer from '../components/Disclaimer';

const DEFAULT_START      = '2022-01-01';
const DEFAULT_END        = '2022-12-31';
const DEFAULT_LIMIT      = 20;
const DEFAULT_SORT_ORDER = 'desc';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomersView() {
  const [startDate,  setStartDate]  = useState(() => readStoredDate('dashboardDates_start', DEFAULT_START));
  const [endDate,    setEndDate]    = useState(() => readStoredDate('dashboardDates_end',   DEFAULT_END));
  const [customers,  setCustomers]  = useState([]);
  // String draft so backspace works freely; validated on blur/Enter/sort-change
  const [limitDraft, setLimitDraft] = useState(String(DEFAULT_LIMIT));
  const [sortOrder,  setSortOrder]  = useState(DEFAULT_SORT_ORDER);
  const [sortBy,     setSortBy]     = useState('total_spent');
  const [sortDir,    setSortDir]    = useState('desc');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const isDefault = startDate === DEFAULT_START && endDate === DEFAULT_END;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(startDate, endDate, DEFAULT_LIMIT, DEFAULT_SORT_ORDER); }, []);

  useEffect(() => { localStorage.setItem('dashboardDates_start', startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem('dashboardDates_end',   endDate);   }, [endDate]);

  function parseLim(draft) {
    return Math.min(100, Math.max(1, parseInt(draft, 10) || 1));
  }

  function handleApply() {
    if (startDate > endDate) {
      setError('Start date must be on or before the end date.');
      return;
    }
    loadData(startDate, endDate, parseLim(limitDraft), sortOrder);
  }

  function handleReset() {
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    loadData(DEFAULT_START, DEFAULT_END, parseLim(limitDraft), sortOrder);
  }

  async function loadData(start, end, lim, ord) {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(start, end, { limit: lim, sortOrder: ord });
      setCustomers(Array.isArray(data) ? data : (data?.data ?? []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function commitLimit() {
    const lim = parseLim(limitDraft);
    setLimitDraft(String(lim));
    loadData(startDate, endDate, lim, sortOrder);
  }

  function applyCardControls(newLimit, newSort) {
    setSortOrder(newSort);
    loadData(startDate, endDate, newLimit, newSort);
  }

  // Client-side column sort (within the already-fetched page)
  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  const sorted = [...customers].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', marginLeft: 'var(--sidebar-width)', transition: 'margin-left 0.22s ease' }}>
      <Navbar />
      <TopControls />
      <div className="page">

        <div className="filter-bar">
          <label>From</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          <label>To</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          <button className="btn-apply" onClick={handleApply}>Apply</button>
          {!isDefault && (
            <button className="btn-reset" onClick={handleReset}>Reset</button>
          )}
        </div>

        {error && (
          <div className="error-box">
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: '#C62828' }}>✕</button>
          </div>
        )}

        {loading && <div className="loading">Loading customers…</div>}

        {!loading && !error && (
          <div className="card">
            <div className="card-header">
              <div className="section-title">
                Customers by Revenue
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                  {customers.length} shown
                </span>
              </div>
              <div className="card-actions">
                <button
                  className="btn-card-export"
                  disabled={customers.length === 0}
                  onClick={() => exportToExcel(`customers_${startDate}_${endDate}`, [{
                    sheetName: 'Customers',
                    headers: ['Name', 'City', 'State', 'Orders', 'Total Spent ($)'],
                    rows: sorted.map(c => [c.name, c.city, c.state, c.total_orders, Number(c.total_spent)]),
                    colWidths: [{ wch: 24 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 16 }],
                  }])}
                >
                  ↓ Export
                </button>
              </div>
            </div>

            {/* Per-card controls */}
            <div className="card-controls">
              <label>Show</label>
              <input
                type="number" min="1" max="100"
                value={limitDraft}
                onChange={e => setLimitDraft(e.target.value)}
                onBlur={commitLimit}
                onKeyDown={e => e.key === 'Enter' && commitLimit()}
              />
              <label>Sort by spend</label>
              <select value={sortOrder} onChange={e => { setSortOrder(e.target.value); applyCardControls(parseLim(limitDraft), e.target.value); }}>
                <option value="desc">Top spenders first</option>
                <option value="asc">Lowest spenders first</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('name')}>Name{sortIcon('name')}</th>
                  <th className="sortable" onClick={() => handleSort('city')}>City{sortIcon('city')}</th>
                  <th className="sortable" onClick={() => handleSort('state')}>State{sortIcon('state')}</th>
                  <th className="sortable right" onClick={() => handleSort('total_orders')}>Orders{sortIcon('total_orders')}</th>
                  <th className="sortable right" onClick={() => handleSort('total_spent')}>Total Spent{sortIcon('total_spent')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => (
                  <tr key={c.customer_id}>
                    <td>{c.name}</td>
                    <td className="muted">{c.city}</td>
                    <td className="muted">{c.state}</td>
                    <td className="right mono">{c.total_orders}</td>
                    <td className="right mono">{formatCurrency(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Disclaimer />
      </div>
    </div>
  );
}
