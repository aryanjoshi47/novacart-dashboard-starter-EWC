# Export All Button Plan

## Top-Level Overview

Add an "Export All" button to the `filter-bar-actions` div in each of the three dashboard views (Orders, Products, Customers). The button triggers a single multi-sheet Excel export that consolidates all data currently shown in that view. It is disabled (grayed out) until all data for that page has fully loaded. No new shared infrastructure needed — the existing `exportToExcel(filename, sheets[])` utility already accepts multiple sheets, so the only work is calling it with a combined `sheets` array.

---

## Sub-Task 1 — OrdersView: Add "Export All" button

**Status:** [ ] pending

**Intent**  
Add the button to the `filter-bar-actions` in `OrdersView.js`. The button is disabled while either `mainLoading` or `citiesLoading` is true (the page's two independent loading states). On click, it calls `exportToExcel` with two sheets: "Monthly Revenue" (from `orders`) and "Revenue by City" (from `cities`), reusing the exact same headers/row maps used by the individual card export buttons.

**Expected Outcomes**  
- A "Export All" button appears to the right of the Apply/Reset controls in the Orders filter bar.
- Button is grayed out (`disabled`) while either `mainLoading` or `citiesLoading` is `true`.
- Clicking it produces `orders_all_${startDate}_${endDate}.xlsx` with two sheets:
  - Sheet 1: "Monthly Revenue" — Month, Order Count, Revenue ($)
  - Sheet 2: "Revenue by City" — City, State, Order Count, Revenue ($)

**Todo List**
1. In `OrdersView.js`, inside `filter-bar-actions`, after the `btn-reset` button, add a new `<button>` with:
   - `className="btn-card-export"`
   - `disabled={mainLoading || citiesLoading}`
   - `aria-label="Export all orders data to Excel"`
   - `onClick` calling `exportToExcel` with `filename = orders_all_${startDate}_${endDate}` and a `sheets` array containing both the Monthly Revenue sheet and the Revenue by City sheet (using the same row mappers as the individual export buttons).
   - Label: `<Download size={13} strokeWidth={2} aria-hidden="true" />Export All`

**Relevant Context**
- File: `frontend/src/pages/OrdersView.js`, lines 166–169 (filter-bar-actions div)
- Loading states: `mainLoading` (line 41), `citiesLoading` (line 46)
- Individual export logic: Monthly Revenue at lines 234–242, Revenue by City at lines 310–318
- `exportToExcel` imported at line 5; `Download` icon imported at line 2

---

## Sub-Task 2 — ProductsView: Add "Export All" button

**Status:** [ ] pending

**Intent**  
Add the button to the `filter-bar-actions` in `ProductsView.js`. The single `loading` state covers both cards, so the disabled condition is just `loading`. On click it exports two sheets: "Products by Revenue" (from `chartProducts`) and "Product Details" (from `detailsProducts`).

**Expected Outcomes**  
- Button appears in the Products filter bar next to Apply/Reset.
- Disabled while `loading` is `true`.
- Clicking produces `products_all_${startDate}_${endDate}.xlsx` with two sheets:
  - Sheet 1: "Products by Revenue" — Name, Category, Units Sold, Revenue ($)
  - Sheet 2: "Product Details" — Name, Category, Units Sold, Revenue ($)

**Todo List**
1. In `ProductsView.js`, inside `filter-bar-actions` (line 141–144), add the Export All button after the `btn-reset` button:
   - `className="btn-card-export"`
   - `disabled={loading}`
   - `aria-label="Export all products data to Excel"`
   - `onClick` calling `exportToExcel` with both products sheets
   - Label: `<Download size={13} strokeWidth={2} aria-hidden="true" />Export All`

**Relevant Context**
- File: `frontend/src/pages/ProductsView.js`, lines 141–144 (filter-bar-actions)
- Loading state: `loading` (line 39)
- Individual export logic: Products by Revenue at lines 202–210, Product Details at lines 281–289
- `exportToExcel` imported at line 5; `Download` icon imported at line 2

---

## Sub-Task 3 — CustomersView: Add "Export All" button

**Status:** [ ] pending

**Intent**  
Add the button to the `filter-bar-actions` in `CustomersView.js`. This page has a single `loading` state and a single data set. The "Export All" exports the same `sorted` data as the card's individual export — the button is still useful here for consistency and accessible placement in the filter bar. The filename uses `customers_all_` prefix to distinguish it.

**Expected Outcomes**  
- Button appears in the Customers filter bar next to Apply/Reset.
- Disabled while `loading` is `true`.
- Clicking produces `customers_all_${startDate}_${endDate}.xlsx` with one sheet "Customers": Name, City, State, Orders, Total Spent ($).

**Todo List**
1. In `CustomersView.js`, inside `filter-bar-actions` (lines 130–133), add the Export All button after the `btn-reset` button:
   - `className="btn-card-export"`
   - `disabled={loading}`
   - `aria-label="Export all customers data to Excel"`
   - `onClick` calling `exportToExcel` with the Customers sheet (same row mapper as line 179)
   - Label: `<Download size={13} strokeWidth={2} aria-hidden="true" />Export All`

**Relevant Context**
- File: `frontend/src/pages/CustomersView.js`, lines 130–133 (filter-bar-actions)
- Loading state: `loading` (line 35)
- Individual export logic: lines 176–181
- `exportToExcel` imported at line 4; `Download` icon imported at line 2

---

## Sub-Task 4 — CSS: Style the Export All button in the filter bar

**Status:** [ ] pending

**Intent**  
The `btn-card-export` class was designed for card headers (small accent button). It already renders correctly in the filter bar since `filter-bar-actions` is `display: flex; align-items: center`. No new class is needed. However, we should verify the button doesn't cause layout issues on mobile (where `filter-bar-actions` gets `align-self: flex-end`). If it looks fine (expected), no CSS change is needed. If a minor width/wrapping issue appears, a targeted rule can be added.

**Expected Outcomes**  
- Button visually matches the existing Apply and Reset buttons in size and alignment.
- On mobile, button sits in the same `filter-bar-actions` flex row without overflowing.
- Disabled state is visually distinct (existing `opacity: 0.45; cursor: not-allowed` rule handles this).

**Todo List**
1. Verify the button renders correctly in the filter bar using `btn-card-export` class — no changes needed if it fits naturally.
2. If adjustments are needed: add a small targeted override rule in `App.css` (e.g. within `.filter-bar-actions .btn-card-export`) to ensure consistent sizing with the Apply button.

**Relevant Context**
- `App.css` lines 411–423: `.btn-card-export` styles
- `App.css` lines 136, 517–519: `.filter-bar-actions` layout (desktop + mobile)
- `App.css` lines 153–160: `.btn-apply` for reference sizing
