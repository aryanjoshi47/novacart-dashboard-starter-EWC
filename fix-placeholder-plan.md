# Fix: SQL Parameter Placeholder Mismatch (SQLite `?` vs Snowflake `%s`)

## Top-Level Overview

**Goal:** Fix a runtime crash that occurs when the backend is running against Snowflake.

**Root cause:** All four SQL query functions in `main.py` use `?` as parameter placeholders (SQLite syntax). The Snowflake connector expects `%s` instead. When `DATA_BACKEND=snowflake`, `execute_query` passes the `?`-style query directly to the Snowflake cursor, which tries `%`-style string formatting and raises a `TypeError`.

**Scope:** One targeted change to `connection.py` — translate `?` → `%s` inside the Snowflake branch of `execute_query` before the query is executed. No changes to `main.py` or any SQL strings.

**Approach:** Centralise the fix in the adapter layer (`execute_query`) so all existing and future queries can be written in the single consistent `?` style.

---

## Sub-Tasks

### Sub-Task 1 — Translate `?` to `%s` in the Snowflake branch of `execute_query`

**Intent:**  
`execute_query` already knows which backend is active. Adding a single `str.replace` call inside the `snowflake` branch means every caller — present and future — can keep using `?` without any per-query changes.

**Expected Outcomes:**
- `DATA_BACKEND=snowflake` no longer raises a `TypeError` on any of the four endpoint functions.
- `DATA_BACKEND=sqlite` (the default) is completely unaffected.
- The docstring is updated to reflect that callers should always use `?`.

**Todo List:**
1. Open `backend/connection.py`.
2. Inside the `if DATA_BACKEND == "snowflake":` block of `execute_query`, add `query = query.replace("?", "%s")` before the `cursor.execute(query, params)` call.
3. Update the docstring param note from `(use ? for SQLite, %s for Snowflake)` to `(always use ? — translated to %s for Snowflake automatically)`.

**Relevant Context:**
- File: `backend/connection.py`, function `execute_query` (lines 111–134)
- `DATA_BACKEND` is set via `os.getenv("DATA_BACKEND", "sqlite")` at line 21 of `connection.py`
- The four affected callers are `get_orders`, `get_products`, `get_customers`, and `get_cities` in `backend/main.py` — **no changes needed there**

**Status:** [ ] pending
