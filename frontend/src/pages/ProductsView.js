/**
 * ProductsView.js — Product Performance page
 *
 * This page shows:
 *   - A bar chart of top 10 products by revenue
 *   - A table with product name, category, units sold, and revenue
 *   - A date range filter
 *
 * The data fetching is already wired up.
 * Your job: implement the UI.
 */

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import TopControls from '../components/TopControls';
import { getProducts } from '../utils/api';

// Format currency helper
function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export default function ProductsView() {
  const [startDate, setStartDate] = useState(() => localStorage.getItem('dashboardDates_start') || '2022-01-01');
  const [endDate,   setEndDate]   = useState(() => localStorage.getItem('dashboardDates_end')   || '2022-12-31');
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(startDate, endDate); }, []);

  useEffect(() => { localStorage.setItem('dashboardDates_start', startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem('dashboardDates_end',   endDate);   }, [endDate]);

  function handleReset() {
    const currentYear = new Date().getFullYear();
    const resetStart = `${currentYear}-01-01`;
    const resetEnd = new Date().toISOString().split('T')[0];
    setStartDate(resetStart);
    setEndDate(resetEnd);
    loadData(resetStart, resetEnd);
  }

  async function loadData(start, end) {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts(start, end);
      setProducts(Array.isArray(data) ? data : (data.data ?? []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

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
        </div>

        {error && (
          <div style={{ color: '#C62828', padding: 16, background: '#FFEBEE', borderRadius: 8, marginBottom: 16 }}>
            Error: {error}
          </div>
        )}

        {loading && <div className="loading">Loading products data…</div>}

        {!loading && !error && (
          <div className="grid-2">

            {/*
              STEP 1 — Top products bar chart
              products is: [{ product_id, name, category, units_sold, revenue }]
              Use a horizontal BarChart (layout="vertical").
              XAxis type="number", YAxis type="category" dataKey="name"
              Hint: truncate long product names to 20 chars
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Top 10 Products by Revenue</div>
              {/* TODO: add your bar chart here */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={products.slice(0, 10)} layout="vertical">
                  <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                    tickFormatter={v => v.length > 20 ? v.slice(0, 20) + '…' : v} />
                  <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/*
              STEP 2 — Products table
              Show all products in a table: Name | Category | Units Sold | Revenue
              Hint: use an HTML table or build with divs.
              Format revenue with the formatCurrency helper above.
            */}
            <div className="card">
              <div className="section-title" style={{ marginBottom: 16 }}>Product Details</div>
              {/* TODO: add your table here */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Name</th>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Units Sold</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.product_id} style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-primary)' }}>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)' }}>{p.name}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{p.units_sold.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-primary)', textAlign: 'right' }}>{formatCurrency(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
