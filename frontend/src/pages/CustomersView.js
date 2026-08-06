/**
 * CustomersView.js — Customer List page
 *
 * This page shows:
 *   - A sortable table of top 20 customers by revenue
 *   - Columns: Name | City | State | Orders | Total Spent
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI and the sorting logic.
 */

import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { exportToExcel } from '../utils/exportExcel';
import TopControls from '../components/TopControls';
import ErrorPage from '../components/ErrorPage';
import { getCustomers, readStoredDate } from '../utils/api';
import Disclaimer from '../components/Disclaimer';

function formatCurrency(value) {
  if (!value) return '$0';
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function CustomersView() {
  const [startDate,  setStartDate]  = useState(() => readStoredDate('dashboardDates_start', '2022-01-01'));
  const [endDate,    setEndDate]    = useState(() => readStoredDate('dashboardDates_end',   '2022-12-31'));
  const [customers,  setCustomers]  = useState([]);
  const [sortBy,     setSortBy]     = useState('total_spent');
  const [sortDir,    setSortDir]    = useState('desc');
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(startDate, endDate); }, []);

  useEffect(() => { localStorage.setItem('dashboardDates_start', startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem('dashboardDates_end',   endDate);   }, [endDate]);

  function handleReset() {
    const resetStart = '2022-01-01';
    const resetEnd   = '2022-12-31';
    setStartDate(resetStart);
    setEndDate(resetEnd);
    loadData(resetStart, resetEnd);
  }

  async function loadData(start, end) {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(start, end);
      setCustomers(Array.isArray(data) ? data : (data.data ?? []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Sort handler — toggles direction if same column, resets to desc if new column
  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  }

  // Apply sort to customers array
  const sorted = [...customers].sort((a, b) => {
    const va = a[sortBy], vb = b[sortBy];
    if (typeof va === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    return sortDir === 'asc'
      ? String(va).localeCompare(String(vb))
      : String(vb).localeCompare(String(va));
  });

  // Sort indicator helper
  const sortIcon = (col) => sortBy === col ? (sortDir === 'asc' ? ' ↑' : ' ↓') : '';

  if (error) return <ErrorPage message={error} onRetry={() => loadData(startDate, endDate)} />;

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
          <button className="btn-apply" onClick={() => loadData(startDate, endDate)}>Apply</button>
          <button className="btn-apply" onClick={handleReset}>Reset</button>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {customers.length} customers
          </span>
          <button
            className="btn-export"
            disabled={loading || customers.length === 0}
            onClick={() => exportToExcel(`customers_${startDate}_${endDate}`, [
              {
                sheetName: 'Customers',
                headers: ['Name', 'City', 'State', 'Orders', 'Total Spent ($)'],
                rows: sorted.map(c => [c.name, c.city, c.state, c.total_orders, Number(c.total_spent)]),
                colWidths: [{ wch: 24 }, { wch: 18 }, { wch: 8 }, { wch: 10 }, { wch: 16 }],
              },
            ])}
          >
            ↓ Export to Excel
          </button>
        </div>

        {loading && <div className="loading">Loading customers…</div>}

        {!loading && !error && (
          <div className="card">
            <div className="section-title" style={{ marginBottom: 16 }}>
              Top Customers by Revenue
            </div>

            {/*
              STEP 1 — Sortable table
              sorted is: [{ customer_id, name, city, state, total_orders, total_spent }]

              Build a table with these columns:
                Name | City | State | Orders | Total Spent

              Each column header should be clickable and call handleSort(columnName).
              Use sortIcon(columnName) to show ↑ or ↓ on the active sort column.

              Hint: use a standard HTML <table> with <thead> and <tbody>.
              Style alternating rows with different background colors.
              Format total_spent with formatCurrency().
            */}

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
