"""
main.py — NovaCart Account Dashboard API

Built with FastAPI. Auto-generated docs at: http://localhost:8000/docs

Endpoints:
  GET /health                                  — service health check
  GET /authorize                               — SPCS OAuth flow
  GET /franchise/{id}/summary                  — overview stats
  GET /franchise/{id}/orders                   — monthly order volume and revenue
  GET /franchise/{id}/products                 — top products by revenue
  GET /franchise/{id}/customers                — top customers by revenue
  GET /franchise/{id}/countries                — revenue by country (city/state for US data)

Data schema (from the DE capstone Gold layer):
  fact_orders:   order_id, customer_id, product_id, order_date, amount, currency, status, quantity, date_key
  dim_customer:  customer_id, name, email, addr_city, addr_state, valid_from, valid_to, is_current
  dim_product:   product_id, name, category, price
  dim_date:      date_key, year, quarter, month, month_name, day_of_week

Your job: implement the TODO sections in each endpoint.
The connection and query helpers are already set up in connection.py.
"""

import os
import time
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from connection import get_connection, execute_query

load_dotenv()

# ── App setup ─────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NovaCart Account Dashboard API",
    description=(
        "REST API for the NovaCart account manager dashboard. "
        "Built on top of the Gold data layer produced by the Data Engineering team."
    ),
    version="1.0.0",
)

PORT              = int(os.getenv("PORT", 8000))
CLIENT_VALIDATION = os.getenv("CLIENT_VALIDATION", "Dev")
START_TIME        = time.time()

# CORS — only needed for local development
# In SPCS, the NGINX router handles routing so CORS is not required
if CLIENT_VALIDATION == "Dev":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://localhost:3001"],
        allow_methods=["GET"],
        allow_headers=["*"],
    )


# ── Startup log ───────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    print("\nStarting NovaCart Dashboard API")
    print(f"Port:            {PORT}")
    print(f"Data backend:    {os.getenv('DATA_BACKEND', 'sqlite')}")
    print(f"Validation mode: {CLIENT_VALIDATION}")
    print(f"Docs:            http://localhost:{PORT}/docs\n")


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health", tags=["System"])
def health():
    """
    Returns service health and confirms the database connection is working.
    Used by the frontend service status indicator.
    """
    uptime = round(time.time() - START_TIME)
    try:
        conn    = get_connection()
        results = execute_query(conn, "SELECT 1 AS ping")
        assert len(results) > 0
    except Exception as e:
        return JSONResponse(status_code=503, content={
            "status":   "degraded",
            "uptime_s": uptime,
            "database": {"status": "error", "message": str(e)},
        })
    return {
        "status":   "healthy",
        "uptime_s": uptime,
        "backend":  os.getenv("DATA_BACKEND", "sqlite"),
        "database": {"status": "connected"},
    }


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.get("/authorize", tags=["Auth"])
def authorize(request: Request):
    """
    SPCS OAuth authorization endpoint.

    When running inside SPCS, the platform injects the authenticated Snowflake
    username in the Sf-Context-Current-User header. This endpoint reads that
    header and returns the user's identity so the frontend can store it.

    In Dev mode: returns a mock user for local development.
    """
    if CLIENT_VALIDATION == "Dev":
        return {"user": "dev_user", "status": "authorized"}

    username = request.headers.get("sf-context-current-user")
    if not username:
        raise HTTPException(status_code=422, detail="Missing Sf-Context-Current-User header")

    return {"user": username, "status": "authorized"}


# ── Shared helpers ────────────────────────────────────────────────────────────

def _validate_date(value: str, param_name: str) -> None:
    """Raises HTTP 400 if value is not a valid YYYY-MM-DD date string."""
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format for '{param_name}': '{value}'. Expected YYYY-MM-DD.",
        )


def _require_auth(request: Request) -> None:
    """
    FastAPI dependency — enforces authorization on franchise endpoints.

    Dev mode:   passes all requests through (CLIENT_VALIDATION=Dev).
    Production: requires the Sf-Context-Current-User header injected by SPCS OAuth.
                Returns HTTP 401 if the header is absent.
    """
    if CLIENT_VALIDATION == "Dev":
        return
    if not request.headers.get("sf-context-current-user"):
        raise HTTPException(status_code=401, detail="Unauthorized")


# ── Franchise endpoints ───────────────────────────────────────────────────────

@app.get("/franchise/{franchise_id}/summary", tags=["Franchise"],
         dependencies=[Depends(_require_auth)])
def get_summary(franchise_id: int):
    """
    Returns an overview of all orders in the database:
    - Total revenue (delivered + shipped orders only)
    - Total orders
    - Number of unique customers
    - Date range of available data

    Path parameter:
      franchise_id: unique ID of the franchise (integer)

    Response:
    {
        "franchise_id": 1,
        "total_revenue": 1284750.00,
        "total_orders": 8432,
        "unique_customers": 380,
        "date_range": { "start": "2022-01-01", "end": "2022-12-31" }
    }
    """
    _SQL = """
        SELECT
            COUNT(DISTINCT order_id)    AS total_orders,
            SUM(amount)                 AS total_revenue,
            COUNT(DISTINCT customer_id) AS active_customers,
            MIN(order_date)             AS start_date,
            MAX(order_date)             AS end_date
        FROM fact_orders
        WHERE status IN ('delivered', 'shipped')
    """

    conn    = get_connection()
    results = execute_query(conn, _SQL)

    row = results[0] if results else {}
    return {
        "franchise_id":      franchise_id,
        "total_revenue":     round(row.get("total_revenue") or 0, 2),
        "total_orders":      row.get("total_orders") or 0,
        "active_customers":  row.get("active_customers") or 0,
        "date_range": {
            "start": row.get("start_date"),
            "end":   row.get("end_date"),
        },
    }


@app.get("/franchise/{franchise_id}/orders", tags=["Franchise"],
         dependencies=[Depends(_require_auth)])
def get_orders(franchise_id: int, start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns monthly order volume and revenue for the given date range.
    Used to power the orders overview chart.

    Path parameter:
      franchise_id: unique ID of the franchise (integer)

    Query parameters:
      start: start date (YYYY-MM-DD)
      end:   end date (YYYY-MM-DD)

    Response:
    [
        { "month": "2022-01", "month_name": "January",  "order_count": 842, "revenue": 128450.00 },
        { "month": "2022-02", "month_name": "February", "order_count": 910, "revenue": 141230.00 }
    ]
    """
    _SQL = """
        SELECT
            dd.year || '-' || printf('%02d', dd.month)  AS month,
            dd.month_name,
            COUNT(fo.order_id)          AS order_count,
            ROUND(SUM(fo.amount), 2)    AS revenue
        FROM fact_orders fo
        JOIN dim_date dd ON fo.date_key = dd.date_key
        WHERE fo.status IN ('delivered', 'shipped')
          AND fo.order_date BETWEEN ? AND ?
        GROUP BY dd.year, dd.month, dd.month_name
        ORDER BY dd.year, dd.month
    """

    _validate_date(start, "start")
    _validate_date(end, "end")
    conn    = get_connection()
    results = execute_query(conn, _SQL, params=(start, end))
    return results


@app.get("/franchise/{franchise_id}/products", tags=["Franchise"],
         dependencies=[Depends(_require_auth)])
def get_products(franchise_id: int, start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns the top 10 products by revenue for the given date range.

    Path parameter:
      franchise_id: unique ID of the franchise (integer)

    Query parameters:
      start: start date (YYYY-MM-DD)
      end:   end date (YYYY-MM-DD)

    Response:
    [
        { "product_id": "P001", "product_name": "Wireless Headphones", "category": "Electronics",
          "units_sold": 342, "revenue": 30578.58 }
    ]
    """
    _SQL = """
        SELECT
            dp.product_id,
            dp.name                     AS product_name,
            dp.category,
            SUM(fo.quantity)            AS units_sold,
            ROUND(SUM(fo.amount), 2)    AS revenue
        FROM fact_orders fo
        JOIN dim_product dp ON fo.product_id = dp.product_id
        WHERE fo.status IN ('delivered', 'shipped')
          AND fo.order_date BETWEEN ? AND ?
        GROUP BY dp.product_id, dp.name, dp.category
        ORDER BY revenue DESC
        LIMIT 10
    """

    _validate_date(start, "start")
    _validate_date(end, "end")
    conn    = get_connection()
    results = execute_query(conn, _SQL, params=(start, end))
    return results


@app.get("/franchise/{franchise_id}/customers", tags=["Franchise"],
         dependencies=[Depends(_require_auth)])
def get_customers(franchise_id: int, start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns the top 20 customers by total spend for the given date range.

    Path parameter:
      franchise_id: unique ID of the franchise (integer)

    Query parameters:
      start: start date (YYYY-MM-DD)
      end:   end date (YYYY-MM-DD)

    Response:
    [
        { "customer_id": "C001", "name": "Alice Johnson", "city": "Austin",
          "state": "TX", "total_orders": 14, "total_spent": 1240.50 }
    ]
    """
    _SQL = """
        SELECT
            dc.customer_id,
            dc.name,
            dc.addr_city                AS city,
            dc.addr_state               AS state,
            COUNT(fo.order_id)          AS total_orders,
            ROUND(SUM(fo.amount), 2)    AS total_spent
        FROM fact_orders fo
        JOIN dim_customer dc ON fo.customer_id = dc.customer_id
        WHERE fo.status IN ('delivered', 'shipped')
          AND fo.order_date BETWEEN ? AND ?
          AND dc.is_current = 1
        GROUP BY dc.customer_id, dc.name, dc.addr_city, dc.addr_state
        ORDER BY total_spent DESC
        LIMIT 20
    """

    _validate_date(start, "start")
    _validate_date(end, "end")
    conn    = get_connection()
    results = execute_query(conn, _SQL, params=(start, end))
    return results


@app.get("/franchise/{franchise_id}/countries", tags=["Franchise"],
         dependencies=[Depends(_require_auth)])
def get_countries(franchise_id: int, start: str = "2022-01-01", end: str = "2022-12-31"):
    """
    Returns revenue and order count grouped by city and state.
    Used to power the geographic breakdown chart.

    Path parameter:
      franchise_id: unique ID of the franchise (integer)

    Query parameters:
      start: start date (YYYY-MM-DD)
      end:   end date (YYYY-MM-DD)

    Response:
    [
        { "city": "Austin", "state": "TX", "total_orders": 420, "total_revenue": 38430.00 }
    ]
    """
    _SQL = """
        SELECT
            dc.addr_city                AS city,
            dc.addr_state               AS state,
            COUNT(fo.order_id)          AS total_orders,
            ROUND(SUM(fo.amount), 2)    AS total_revenue
        FROM fact_orders fo
        JOIN dim_customer dc ON fo.customer_id = dc.customer_id
        WHERE fo.status IN ('delivered', 'shipped')
          AND fo.order_date BETWEEN ? AND ?
          AND dc.is_current = 1
        GROUP BY dc.addr_city, dc.addr_state
        ORDER BY revenue DESC
        LIMIT 100
    """

    _validate_date(start, "start")
    _validate_date(end, "end")
    conn    = get_connection()
    results = execute_query(conn, _SQL, params=(start, end))
    return results
