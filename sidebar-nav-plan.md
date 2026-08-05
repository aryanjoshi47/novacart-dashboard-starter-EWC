# Sidebar Navigation Plan

## Top-Level Overview

Convert the current horizontal `<Navbar>` component into a collapsible left sidebar. When collapsed, only the icon for each nav item is shown inside a rounded-square border. When expanded, text labels appear alongside icons. A toggle arrow button sits below the logo to control collapse/expand state.

**Confirmed design decisions:**
- `ServiceStatus` and theme toggle are removed from the sidebar entirely and placed in the upper-right corner of every page view as a fixed/absolute element.

This change touches:
1. `Navbar.js` — full rewrite of layout and styles; remove ServiceStatus and theme toggle
2. All three page views (`OrdersView.js`, `ProductsView.js`, `CustomersView.js`) — adjust outer wrapper for sidebar offset; add a top-right controls bar with ServiceStatus + theme toggle

---

## Sub-Task 1 — Rebuild Navbar.js as a collapsible left sidebar

**Status:** [x] done

**Intent**
Replace the horizontal `<nav>` with a vertical sidebar that collapses/expands via local `useState`. In collapsed state the sidebar is narrow and shows only icons (each in a rounded-square border). In expanded state the sidebar is wider and shows icon + label.

**Relevant Context**
- File: `frontend/src/components/Navbar.js`
- Icon library: `lucide-react` (already imported — add `ChevronLeft`, `ChevronRight`)
- Styling: inline styles + CSS variables (`var(--accent)`, `var(--bg-card)`, `var(--border)`, etc.)
- Theme: `useTheme()` hook provides `dark` boolean and `toggle()`
- Nav links array (lines 7–11) stays unchanged
- `ServiceStatus` component moves to the bottom of the sidebar
- Theme toggle button also moves to the bottom of the sidebar

**Expected Outcomes**
- Sidebar is `position: fixed`, `left: 0`, `top: 0`, `height: 100vh`, `zIndex: 100`
- Collapsed width: `72px`; Expanded width: `220px`
- Smooth width transition: `transition: width 0.22s ease`
- Logo area at top: star icon + "NovaCart" text (hidden when collapsed)
- Arrow toggle button directly below logo: `ChevronLeft` (expanded) / `ChevronRight` (collapsed), centered, with rounded-square border
- Each nav link: icon in rounded-square border + label text (label hidden when collapsed via `overflow: hidden` or conditional render)
- Active nav link: accent background, white text/icon
- Inactive nav link: transparent background, muted color, hover effect with subtle accent tint
- ServiceStatus and theme toggle at bottom of sidebar
- No top/horizontal nav bar remains
- `ServiceStatus` and theme toggle button are **removed** from the sidebar

**Todo List**
1. Add `collapsed` state via `useState(false)`
2. Import `ChevronLeft` and `ChevronRight` from `lucide-react`; remove `Sun`, `Moon` imports (moved to pages)
3. Replace `<nav>` container: change to vertical `flex-column`, `position: fixed`, height `100vh`, width conditional on `collapsed` (72px vs 220px), with `overflow: hidden` and width `transition`
4. Logo section: show star icon always; show "NovaCart" + "Dashboard" badge only when `!collapsed`
5. Add toggle button below logo: centered, 36×36px, rounded-square border (`borderRadius: 8px`), arrow icon flips based on `collapsed`
6. Nav links section: render each link as a `flex-row` button; icon always visible in a 36×36 rounded-square container; label text rendered only when `!collapsed` (or opacity/width trick for smooth fade)
7. Remove `ServiceStatus` import and usage from Navbar; remove theme toggle from Navbar
8. Remove horizontal-nav specific styles (`justifyContent: space-between`, `height: 64`, `borderBottom`, etc.)

---

## Sub-Task 2 — Update page view wrappers to accommodate the sidebar

**Status:** [x] done

**Intent**
Each page currently uses `<div style={{ minHeight: '100vh', ... }}>` with `<Navbar />` stacked on top. With a fixed-position sidebar, page content must be offset to the right so it doesn't sit under the sidebar. Since the sidebar width changes (72px / 220px), the pages need to receive the current width and apply a matching `marginLeft`.

**Relevant Context**
- Files: `frontend/src/pages/OrdersView.js`, `ProductsView.js`, `CustomersView.js`
- Navbar currently renders at lines 53–54 (Orders), 49–50 (Products), 69–70 (Customers)
- Existing `.page` CSS class provides `max-width: 1280px` centering

**Expected Outcomes**
- Page content shifts right by the sidebar width (72px collapsed, 220px expanded)
- Transition on `marginLeft` matches sidebar width transition (`0.22s ease`)
- No horizontal scrollbar or content overlap with the sidebar

**Approach: CSS variable** — Navbar writes `--sidebar-width` to `:root` on every toggle and on mount. Pages read `marginLeft: 'var(--sidebar-width)'`. No prop-drilling or new context needed. Browser handles the transition automatically.

**Todo List**
1. In `Navbar.js`, on mount and on every toggle, call `document.documentElement.style.setProperty('--sidebar-width', collapsed ? '72px' : '220px')`
2. In `App.css`, define fallback `--sidebar-width: 220px`
3. In each page view (`OrdersView.js`, `ProductsView.js`, `CustomersView.js`), change the outer wrapper `style` to add `marginLeft: 'var(--sidebar-width)'` and `transition: 'margin-left 0.22s ease'`
4. Keep `<Navbar />` JSX in each page — it is `position: fixed` so it self-positions outside the flow
5. Create a new `frontend/src/components/TopControls.js` component: `position: fixed`, `top: 16px`, `right: 24px`, `zIndex: 99`, renders `ServiceStatus` + theme toggle button (uses `useTheme()` for `Sun`/`Moon`)
6. Import and render `<TopControls />` in each of the three page views
