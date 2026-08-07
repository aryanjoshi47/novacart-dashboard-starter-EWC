import React, { useState, useEffect } from 'react';
import { RotateCcw, Download } from 'lucide-react';
import Navbar from '../components/Navbar';
import { exportToExcel } from '../utils/exportExcel';
import TopControls from '../components/TopControls';
import { getCustomers, readStoredDate } from '../utils/api';
import Disclaimer from '../components/Disclaimer';

const srOnly = {
  position: 'absolute', width: 1, height: 1,
  padding: 0, margin: -1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

const DEFAULT_START      = '2022-01-01';
const DEFAULT_END        = '2022-12-31';
const DEFAULT_LIMIT      = 20;
const DEFAULT_SORT_ORDER = 'desc';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomersView() {
  useEffect(() => { document.title = 'Customers — NovaCart'; }, []);
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
  const ariaSortValue = (col) => {
    if (sortBy !== col) return undefined;
    return sortDir === 'asc' ? 'ascending' : 'descending';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', marginLeft: 'var(--sidebar-width)', transition: 'margin-left 0.22s ease', overflowX: 'hidden' }}>
      <Navbar />
      <TopControls />
      <main className="page" id="main-content" aria-labelledby="page-heading">
        <h1 id="page-heading" style={srOnly}>Customers</h1>

        <div className="filter-bar" role="search" aria-label="Date range filter">
          <div className="filter-bar-dates">
            <div className="filter-bar-field">
              <label htmlFor="customers-start-date">From</label>
              <input id="customers-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="filter-bar-field">
              <label htmlFor="customers-end-date">To</label>
              <input id="customers-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="filter-bar-actions">
            <button className="btn-apply" onClick={handleApply}>Apply</button>
            <button className="btn-reset" onClick={handleReset} aria-label="Reset dates to default"><RotateCcw size={14} strokeWidth={2.5} aria-hidden="true" /></button>
            <button
              className="btn-card-export"
              disabled={loading}
              aria-label="Export all customers data to Excel"
              onClick={() => exportToExcel(`customers_all_${startDate}_${endDate}`, [{
                sheetName: 'Customers',
                headers: ['Name', 'City', 'State', 'Orders', 'Total Spent ($)'],
                rows: sorted.map(c => [c.name, c.city, c.state, c.total_orders, Number(c.total_spent)]),
                colWidths: [{ wch: 24 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 16 }],
              }])}
            >
              <Download size={13} strokeWidth={2} aria-hidden="true" />Export All
            </button>
          </div>
          <span className="filter-bar-hint" style={{ marginLeft: 'auto' }}>{customers.length} customers</span>
        </div>

        {error && (
          <div className="error-box" role="alert">
            {error}
            <button onClick={() => setError(null)} aria-label="Dismiss error" style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 300, color: '#C62828' }}>✕</button>
          </div>
        )}

        {loading && (
          <div className="skeleton-card" aria-busy="true" aria-label="Loading customers data">
            <div className="skeleton-card-header">
              <div className="skeleton sk-title" />
              <div className="skeleton sk-btn" />
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="sk-table-row">
                <div className="skeleton sk-cell" style={{ flex: 3 }} />
                <div className="skeleton sk-cell" style={{ flex: 2 }} />
                <div className="skeleton sk-cell" style={{ flex: 1 }} />
                <div className="skeleton sk-cell" style={{ flex: 1 }} />
                <div className="skeleton sk-cell" style={{ flex: 1.5 }} />
              </div>
            ))}
          </div>
        )}

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
                  aria-label="Export customers to Excel"
                  onClick={() => exportToExcel(`customers_${startDate}_${endDate}`, [{
                    sheetName: 'Customers',
                    headers: ['Name', 'City', 'State', 'Orders', 'Total Spent ($)'],
                    rows: sorted.map(c => [c.name, c.city, c.state, c.total_orders, Number(c.total_spent)]),
                    colWidths: [{ wch: 24 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 16 }],
                  }])}
                >
                  <Download size={13} strokeWidth={2} aria-hidden="true" />Export
                </button>
              </div>
            </div>

            {/* Per-card controls */}
            <div className="card-controls">
              <label htmlFor="customers-limit">Show</label>
              <input
                id="customers-limit"
                type="number" min="1" max="100"
                value={limitDraft}
                onChange={e => setLimitDraft(e.target.value)}
                onBlur={commitLimit}
                onKeyDown={e => e.key === 'Enter' && commitLimit()}
              />
              <label htmlFor="customers-sort">Sort by spend</label>
              <select id="customers-sort" value={sortOrder} onChange={e => { setSortOrder(e.target.value); applyCardControls(parseLim(limitDraft), e.target.value); }}>
                <option value="desc">Top spenders first</option>
                <option value="asc">Lowest spenders first</option>
              </select>
            </div>

            <div className="table-scroll">
            {customers.length === 0 ? (
              <div className="loading">No data available</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="sortable" scope="col" tabIndex={0} onClick={() => handleSort('name')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSort('name')} aria-sort={ariaSortValue('name')}>Name{sortIcon('name')}</th>
                    <th className="sortable" scope="col" tabIndex={0} onClick={() => handleSort('city')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSort('city')} aria-sort={ariaSortValue('city')}>City{sortIcon('city')}</th>
                    <th className="sortable" scope="col" tabIndex={0} onClick={() => handleSort('state')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSort('state')} aria-sort={ariaSortValue('state')}>State{sortIcon('state')}</th>
                    <th className="sortable right" scope="col" tabIndex={0} onClick={() => handleSort('total_orders')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSort('total_orders')} aria-sort={ariaSortValue('total_orders')}>Orders{sortIcon('total_orders')}</th>
                    <th className="sortable right" scope="col" tabIndex={0} onClick={() => handleSort('total_spent')} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleSort('total_spent')} aria-sort={ariaSortValue('total_spent')}>Total Spent{sortIcon('total_spent')}</th>
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
            )}
            </div>

          </div>
        )}
        <Disclaimer />
      </main>
    </div>
  );
}
