/**
 * api.js — NovaCart Dashboard API client
 *
 * All API calls go through this file.
 * In SPCS, REACT_APP_BACKEND_URL is set to /api and calls are
 * routed through the NGINX router to the backend container.
 * Locally, calls go directly to http://localhost:8000.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const FRIENDLY_ERRORS = {
  400: 'Invalid request. Please check your inputs.',
  401: 'You are not authorised to view this data.',
  403: 'Access denied.',
  404: 'The requested data could not be found.',
  500: 'A server error occurred. Please try again later.',
  503: 'The service is currently unavailable. Please try again later.',
};

async function apiFetch(path) {
  let res;
  try {
    res = await fetch(`${BACKEND_URL}${path}`);
  } catch {
    throw new Error('Unable to reach the server. Please check your connection.');
  }
  if (!res.ok) {
    throw new Error(FRIENDLY_ERRORS[res.status] || 'Something went wrong. Please try again.');
  }
  return res.json();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function readStoredDate(key, fallback) {
  const val = localStorage.getItem(key);
  return (val && DATE_RE.test(val)) ? val : fallback;
}

export async function authorize()       { return apiFetch('/authorize'); }
export async function getHealth()       { return apiFetch('/health'); }
export async function getSummary(s, e)  { return apiFetch(`/franchise/summary?start=${s}&end=${e}`); }
export async function getOrders(s, e)   { return apiFetch(`/franchise/orders?start=${s}&end=${e}`); }

export async function getProducts(s, e, { limit = 10, offset = 0, sortOrder = 'desc' } = {}) {
  return apiFetch(`/franchise/products?start=${s}&end=${e}&limit=${limit}&offset=${offset}&sort_order=${sortOrder}`)
    .then(r => r.data);
}

export async function getCustomers(s, e, { limit = 20, offset = 0, sortOrder = 'desc' } = {}) {
  return apiFetch(`/franchise/customers?start=${s}&end=${e}&limit=${limit}&offset=${offset}&sort_order=${sortOrder}`)
    .then(r => r.data);
}

export async function getCities(s, e, { limit = 10, offset = 0, sortOrder = 'desc' } = {}) {
  return apiFetch(`/franchise/cities?start=${s}&end=${e}&limit=${limit}&offset=${offset}&sort_order=${sortOrder}`)
    .then(r => r.data);
}
