# Date Persistence & Reset Feature Plan

## Overview
Implement localStorage persistence for date range selections across all date-filtered pages (OrdersView, CustomersView, ProductsView). Add a "Reset" button that resets dates to January 1st of the current year to today, with this action also persisting to localStorage.

## Requirements Summary
- **Persist date selections** across page reloads using localStorage
- **Add Reset button** that sets dates to: January 1st of current year → today's date
- **Persist reset state** so reloading after reset maintains the reset dates
- **Apply consistently** across OrdersView, CustomersView, and ProductsView

## Design Approach
1. Create a reusable localStorage key pattern for each page (e.g., `ordersDates`, `customersDates`, `productsDates`)
2. Initialize date state from localStorage on component mount, falling back to defaults if not stored
3. Save dates to localStorage whenever they change
4. Add a Reset button that:
   - Calculates January 1st of current year and today's date
   - Updates state (which triggers localStorage save)
   - Calls loadData to refresh results
5. Update the UI to include the Reset button in the filter bar

## Sub-Tasks

### Sub-Task 1: Implement Date Persistence in OrdersView
**Intent:** Create localStorage persistence for OrdersView date range so selections survive page reloads.

**Expected Outcomes:**
- OrdersView reads startDate and endDate from localStorage on mount
- As user changes dates, they are automatically saved to localStorage
- Page reload preserves previously selected dates

**Todo List:**
1. Read OrdersView.js to understand current state initialization
2. Create localStorage keys for startDate and endDate (e.g., `ordersDates_start`, `ordersDates_end`)
3. Modify useState hooks to initialize from localStorage with fallback to current values
4. Add useEffect to save startDate/endDate to localStorage whenever they change
5. Verify dates persist across page reload

**Relevant Context:**
- File: `frontend/src/pages/OrdersView.js` (lines 23-30 for state, lines 60-66 for date inputs)
- Pattern reference: ThemeContext.js (localStorage initialization in useState), Navbar.js (localStorage updates)
- Initial dates: `'2022-01-01'` to `'2022-12-31'`

**Status:** [x] done

---

### Sub-Task 2: Add Reset Button to OrdersView
**Intent:** Add a Reset button that sets dates to January 1st of current year → today, and persists this state.

**Expected Outcomes:**
- Reset button appears in the filter bar next to Apply button
- Clicking Reset updates both startDate and endDate to the calculated values
- loadData is called to refresh results with new dates
- Reset state is automatically saved to localStorage via existing persistence

**Todo List:**
1. Calculate January 1st of current year and today's date in a helper function
2. Add onClick handler to Reset button that updates both state values
3. Add Reset button to the filter bar JSX (position after Apply button)
4. Verify reset dates are correct and persist across reload
5. Test that data refreshes after reset

**Relevant Context:**
- File: `frontend/src/pages/OrdersView.js` (lines 60-66 for filter bar, lines 32-51 for loadData)
- Current Apply button styling: `className="btn-apply"`
- Reset button should use same styling class or `.btn-reset`

**Status:** [x] done

---

### Sub-Task 3: Implement Date Persistence in CustomersView
**Intent:** Apply the same date persistence and reset pattern to CustomersView.

**Expected Outcomes:**
- CustomersView reads and writes startDate/endDate to localStorage
- CustomersView has a Reset button that works identically to OrdersView
- Dates persist across page reloads

**Todo List:**
1. Apply same localStorage persistence pattern as OrdersView
2. Add Reset button with same logic
3. Verify persistence and reset functionality

**Relevant Context:**
- File: `frontend/src/pages/CustomersView.js` (lines 23-45 for state, lines 75-84 for filter bar)
- Similar structure to OrdersView

**Status:** [x] done

---

### Sub-Task 4: Implement Date Persistence in ProductsView
**Intent:** Apply the same date persistence and reset pattern to ProductsView.

**Expected Outcomes:**
- ProductsView reads and writes startDate/endDate to localStorage
- ProductsView has a Reset button that works identically to other views
- Dates persist across page reloads

**Todo List:**
1. Apply same localStorage persistence pattern as OrdersView
2. Add Reset button with same logic
3. Verify persistence and reset functionality

**Relevant Context:**
- File: `frontend/src/pages/ProductsView.js` (lines 27-47 for state, lines 55-60 for filter bar)
- Similar structure to OrdersView

**Status:** [x] done

---

## Implementation Notes

### localStorage Key Strategy
- **OrdersView:** `ordersDates_start`, `ordersDates_end`
- **CustomersView:** `customersDates_start`, `customersDates_end`
- **ProductsView:** `productsDates_start`, `productsDates_end`

### Reset Date Calculation
```
const currentYear = new Date().getFullYear();
const resetStart = `${currentYear}-01-01`;
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
```

### Code Pattern to Reuse
```javascript
// Initialize state from localStorage
const [startDate, setStartDate] = useState(() => {
  return localStorage.getItem('ordersDates_start') || '2022-01-01';
});

// Save to localStorage whenever date changes
useEffect(() => {
  localStorage.setItem('ordersDates_start', startDate);
}, [startDate]);
```

---

## Validation Criteria
- [ ] Dates persist across page reload for all three views
- [ ] Reset button sets correct dates (Jan 1 current year → today)
- [ ] Reset action persists across page reload
- [ ] Data refreshes automatically after reset
- [ ] localStorage keys do not conflict
- [ ] All three pages function identically
