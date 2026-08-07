import React, { useState, useEffect } from 'react';
import { RotateCcw, Download, BarChart2, Table2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../components/Navbar';
import { exportToExcel } from '../utils/exportExcel';
import TopControls from '../components/TopControls';
import { getProducts, readStoredDate } from '../utils/api';
import Disclaimer from '../components/Disclaimer';
import { useTheme } from '../utils/ThemeContext';

const srOnly = {
  position: 'absolute', width: 1, height: 1,
  padding: 0, margin: -1, overflow: 'hidden',
  clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
};

const DEFAULT_START      = '2022-01-01';
const DEFAULT_END        = '2022-12-31';
const DEFAULT_LIMIT      = 10;
const DEFAULT_SORT_ORDER = 'desc';

function formatCurrency(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000)    return `$${(value / 1000).toFixed(0)}K`;
  return `$${value.toFixed(2)}`;
}

export default function ProductsView() {
  useEffect(() => { document.title = 'Products — NovaCart'; }, []);
  const { dark } = useTheme();
  const tooltipStyle = dark
    ? { backgroundColor: '#1A1A24', border: '1px solid #2E3D52', color: '#EDE9FE' }
    : { backgroundColor: '#ffffff', border: '1px solid #E0E6ED', color: '#1A2332' };

  const [startDate,  setStartDate]  = useState(() => readStoredDate('dashboardDates_start', DEFAULT_START));
  const [endDate,    setEndDate]    = useState(() => readStoredDate('dashboardDates_end',   DEFAULT_END));
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // Chart card controls — string drafts so backspace works freely
  const [chartLimitDraft,  setChartLimitDraft]  = useState(String(DEFAULT_LIMIT));
  const [chartSortOrder,   setChartSortOrder]   = useState(DEFAULT_SORT_ORDER);
  const [chartTableView,   setChartTableView]   = useState(false);

  // Details card controls — independent, own string draft
  const [detailsLimitDraft,  setDetailsLimitDraft]  = useState('20');
  const [detailsSortOrder,   setDetailsSortOrder]   = useState('desc');

  // Separate data slices
  const [chartProducts,   setChartProducts]   = useState([]);
  const [detailsProducts, setDetailsProducts] = useState([]);

  const isDefault = startDate === DEFAULT_START && endDate === DEFAULT_END;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadAll(startDate, endDate, DEFAULT_LIMIT, DEFAULT_SORT_ORDER, 20, 'desc'); }, []);

  useEffect(() => { localStorage.setItem('dashboardDates_start', startDate); }, [startDate]);
  useEffect(() => { localStorage.setItem('dashboardDates_end',   endDate);   }, [endDate]);

  function handleApply() {
    if (startDate > endDate) {
      setError('Start date must be on or before the end date.');
      return;
    }
    loadAll(startDate, endDate, parseLim(chartLimitDraft), chartSortOrder, parseLim(detailsLimitDraft), detailsSortOrder);
  }

  function handleReset() {
    setStartDate(DEFAULT_START);
    setEndDate(DEFAULT_END);
    loadAll(DEFAULT_START, DEFAULT_END, parseLim(chartLimitDraft), chartSortOrder, parseLim(detailsLimitDraft), detailsSortOrder);
  }

  // Parse a string draft to a safe 1–100 integer
  function parseLim(draft) {
    return Math.min(100, Math.max(1, parseInt(draft, 10) || 1));
  }

  // Fetch both cards in parallel — each can have independent params
  async function loadAll(start, end, cLimit, cSort, dLimit, dSort) {
    setLoading(true);
    setError(null);
    try {
      const [chart, details] = await Promise.all([
        getProducts(start, end, { limit: cLimit, sortOrder: cSort }),
        getProducts(start, end, { limit: dLimit, sortOrder: dSort }),
      ]);
      setChartProducts(Array.isArray(chart)   ? chart   : []);
      setDetailsProducts(Array.isArray(details) ? details : []);
      setProducts(Array.isArray(chart) ? chart : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function commitChartLimit() {
    const lim = parseLim(chartLimitDraft);
    setChartLimitDraft(String(lim));
    applyChartControls(lim, chartSortOrder);
  }

  function commitDetailsLimit() {
    const lim = parseLim(detailsLimitDraft);
    setDetailsLimitDraft(String(lim));
    applyDetailsControls(lim, detailsSortOrder);
  }

  function applyChartControls(newLimit, newSort) {
    setChartSortOrder(newSort);
    loadAll(startDate, endDate, newLimit, newSort, parseLim(detailsLimitDraft), detailsSortOrder);
  }

  function applyDetailsControls(newLimit, newSort) {
    setDetailsSortOrder(newSort);
    loadAll(startDate, endDate, parseLim(chartLimitDraft), chartSortOrder, newLimit, newSort);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', marginLeft: 'var(--sidebar-width)', transition: 'margin-left 0.22s ease', overflowX: 'hidden' }}>
      <Navbar />
      <TopControls />
      <main className="page" id="main-content" aria-labelledby="page-heading">
        <h1 id="page-heading" style={srOnly}>Products</h1>

        <div className="filter-bar" role="search" aria-label="Date range filter">
          <div className="filter-bar-dates">
            <div className="filter-bar-field">
              <label htmlFor="products-start-date">From</label>
              <input id="products-start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="filter-bar-field">
              <label htmlFor="products-end-date">To</label>
              <input id="products-end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="filter-bar-actions">
            <button className="btn-apply" onClick={handleApply}>Apply</button>
            <button className="btn-reset" onClick={handleReset} aria-label="Reset dates to default"><RotateCcw size={14} strokeWidth={2.5} aria-hidden="true" /></button>
            <button
              className="btn-card-export"
              disabled={loading}
              aria-label="Export all products data to Excel"
              onClick={() => exportToExcel(`products_all_${startDate}_${endDate}`, [
                {
                  sheetName: 'Products by Revenue',
                  headers: ['Name', 'Category', 'Units Sold', 'Revenue ($)'],
                  rows: chartProducts.map(p => [p.product_name, p.category, p.units_sold, p.revenue]),
                  colWidths: [{ wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 16 }],
                },
                {
                  sheetName: 'Product Details',
                  headers: ['Name', 'Category', 'Units Sold', 'Revenue ($)'],
                  rows: detailsProducts.map(p => [p.product_name, p.category, p.units_sold, p.revenue]),
                  colWidths: [{ wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 16 }],
                },
              ])}
            >
              <Download size={13} strokeWidth={2} aria-hidden="true" />Export All
            </button>
          </div>
        </div>

        {error && (
          <div className="error-box" role="alert">
            {error}
            <button onClick={() => setError(null)} aria-label="Dismiss error" style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 300, color: '#C62828' }}>✕</button>
          </div>
        )}

        {loading && (
          <div className="skeleton-grid-2" aria-busy="true" aria-label="Loading products data">
            {/* Products by Revenue card skeleton */}
            <div className="skeleton-card">
              <div className="skeleton-card-header">
                <div className="skeleton sk-title" />
                <div className="skeleton sk-btn" />
              </div>
              <div className="skeleton sk-chart" style={{ height: 360 }} />
            </div>
            {/* Product Details card skeleton */}
            <div className="skeleton-card">
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
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="grid-2">

            {/* ── Card 1: Revenue chart with limit + sort controls ── */}
            <div className="card" style={{ minHeight: Math.max(300, chartProducts.length * 36 + 120) }}>
              <div className="card-header">
                <div className="section-title">Products by Revenue</div>
                <div className="card-actions">
                  <button
                    className={`btn-toggle-view${chartTableView ? ' active' : ''}`}
                    onClick={() => setChartTableView(v => !v)}
                    aria-pressed={chartTableView}
                    aria-label={chartTableView ? 'Switch to chart view' : 'Switch to table view (accessible)'}
                  >
                    {chartTableView ? <><BarChart2 size={13} strokeWidth={2} aria-hidden="true" />Chart</> : <><Table2 size={13} strokeWidth={2} aria-hidden="true" />Table</>}
                  </button>
                  <button
                    className="btn-card-export"
                    disabled={chartProducts.length === 0}
                    aria-label="Export products by revenue to Excel"
                    onClick={() => exportToExcel(`products_chart_${startDate}_${endDate}`, [{
                      sheetName: 'Products by Revenue',
                      headers: ['Name', 'Category', 'Units Sold', 'Revenue ($)'],
                      rows: chartProducts.map(p => [p.product_name, p.category, p.units_sold, p.revenue]),
                      colWidths: [{ wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 16 }],
                    }])}
                  >
                    <Download size={13} strokeWidth={2} aria-hidden="true" />Export
                  </button>
                </div>
              </div>

              {/* Per-card controls */}
              <div className="card-controls">
                <label htmlFor="chart-limit">Show</label>
                <input
                  id="chart-limit"
                  type="number" min="1" max="100"
                  value={chartLimitDraft}
                  onChange={e => setChartLimitDraft(e.target.value)}
                  onBlur={commitChartLimit}
                  onKeyDown={e => e.key === 'Enter' && commitChartLimit()}
                />
                <label htmlFor="chart-sort">Sort</label>
                <select id="chart-sort" value={chartSortOrder} onChange={e => { setChartSortOrder(e.target.value); applyChartControls(parseLim(chartLimitDraft), e.target.value); }}>
                  <option value="desc">Top (highest revenue)</option>
                  <option value="asc">Bottom (lowest revenue)</option>
                </select>
              </div>

              {chartProducts.length === 0 ? (
                <div className="loading">No data available</div>
              ) : chartTableView ? (
                <div className="inline-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="right">Units Sold</th>
                        <th className="right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chartProducts.map(p => (
                        <tr key={p.product_id}>
                          <td>{p.product_name}</td>
                          <td className="muted">{p.category}</td>
                          <td className="right mono">{p.units_sold.toLocaleString()}</td>
                          <td className="right mono">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div role="img" aria-label="Products by revenue bar chart">
                <ResponsiveContainer width="100%" height={Math.max(200, chartProducts.length * 36)}>
                  <BarChart data={chartProducts} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                    <XAxis type="number" tickFormatter={v => `$${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                    <YAxis type="category" dataKey="product_name" width={130} interval={0} tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                      tickFormatter={v => v.length > 20 ? v.slice(0, 20) + '…' : v} />
                    <Tooltip formatter={v => [formatCurrency(v), 'Revenue']} contentStyle={tooltipStyle} />
                    <Bar dataKey="revenue" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Card 2: Product details table with independent controls ── */}
            <div className="card">
              <div className="card-header">
                <div className="section-title">Product Details</div>
                <div className="card-actions">
                  <button
                    className="btn-card-export"
                    disabled={detailsProducts.length === 0}
                    aria-label="Export product details to Excel"
                    onClick={() => exportToExcel(`products_details_${startDate}_${endDate}`, [{
                      sheetName: 'Product Details',
                      headers: ['Name', 'Category', 'Units Sold', 'Revenue ($)'],
                      rows: detailsProducts.map(p => [p.product_name, p.category, p.units_sold, p.revenue]),
                      colWidths: [{ wch: 30 }, { wch: 20 }, { wch: 14 }, { wch: 16 }],
                    }])}
                  >
                    <Download size={13} strokeWidth={2} aria-hidden="true" />Export
                  </button>
                </div>
              </div>

              {/* Per-card controls */}
              <div className="card-controls">
                <label htmlFor="details-limit">Show</label>
                <input
                  id="details-limit"
                  type="number" min="1" max="100"
                  value={detailsLimitDraft}
                  onChange={e => setDetailsLimitDraft(e.target.value)}
                  onBlur={commitDetailsLimit}
                  onKeyDown={e => e.key === 'Enter' && commitDetailsLimit()}
                />
                <label htmlFor="details-sort">Sort</label>
                <select id="details-sort" value={detailsSortOrder} onChange={e => { setDetailsSortOrder(e.target.value); applyDetailsControls(parseLim(detailsLimitDraft), e.target.value); }}>
                  <option value="desc">Top (highest revenue)</option>
                  <option value="asc">Bottom (lowest revenue)</option>
                </select>
              </div>

              {detailsProducts.length === 0 ? (
                <div className="loading">No data available</div>
              ) : (
                <div className="inline-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Category</th>
                        <th className="right">Units Sold</th>
                        <th className="right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsProducts.map(p => (
                        <tr key={p.product_id}>
                          <td>{p.product_name}</td>
                          <td className="muted">{p.category}</td>
                          <td className="right mono">{p.units_sold.toLocaleString()}</td>
                          <td className="right mono">{formatCurrency(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
        <Disclaimer />
      </main>
    </div>
  );
}
