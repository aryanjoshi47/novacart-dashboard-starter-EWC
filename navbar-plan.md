# Navbar Redesign Plan

## Overview

Replace the existing `Navbar.js` component with a modern, glassmorphism-style navbar using Lucide React icons. The navbar floats above page content with a frosted-glass backdrop-blur effect. Nav links show a Lucide icon inline-left of the label. The active link uses a solid teal pill. The theme toggle becomes a circular Lucide Sun/Moon button. The logo uses a Lucide Star icon with the "NovaCart" wordmark and "Dashboard" badge.

Lucide React will be added as a new dependency via `package.json`.

---

## Sub-Tasks

---

### Sub-Task 1 — Install Lucide React

**Intent**  
Add `lucide-react` as a project dependency so icons can be imported in components.

**Expected Outcomes**  
- `lucide-react` appears in `frontend/package.json` dependencies
- The package is available for import in JS files

**Todo List**  
1. Add `"lucide-react": "^0.460.0"` (latest stable) to `dependencies` in `frontend/package.json`

**Relevant Context**  
- `frontend/package.json` — existing deps: react 18.2.0, react-router-dom 6.21.0, recharts 2.10.1, react-scripts 5.0.1
- No existing lucide usage in the project

**Status:** [x] done

---

### Sub-Task 2 — Redesign Navbar Component

**Intent**  
Rewrite `frontend/src/components/Navbar.js` to implement the glassmorphism design with Lucide icons, teal active pill, circular theme toggle, and Star logo icon.

**Expected Outcomes**  
- Navbar has a semi-transparent frosted-glass background (`rgba` + `backdrop-filter: blur(12px)`)
- Navbar is `position: sticky; top: 0` and floats above page content with a subtle shadow
- Logo area: Lucide `Star` icon (teal, filled) + "NovaCart" bold white wordmark + small "Dashboard" badge in teal
- Nav links: Lucide icon (inline-left) + label text, three routes: Orders (`BarChart2`), Products (`Package`), Customers (`Users`)
- Active link: solid teal pill background (`var(--accent)`) with white text, no border
- Inactive link: transparent background, muted text (`#B0BEC5`), hover lifts opacity
- Right side: `ServiceStatus` component + circular icon button for theme toggle (`Sun` in dark mode, `Moon` in light mode)
- CSS written as a `<style>` tag inside the component or as a companion CSS class block appended to `App.css` — use inline styles consistent with the existing pattern in the file

**Todo List**  
1. Import `Star`, `BarChart2`, `Package`, `Users`, `Sun`, `Moon` from `lucide-react`
2. Define `links` array mapping each route to its Lucide icon component and label
3. Build the glassmorphism `<nav>` container with inline styles:
   - `background: dark ? 'rgba(13,27,42,0.7)' : 'rgba(13,43,78,0.6)'`
   - `backdropFilter: 'blur(12px)'`
   - `WebkitBackdropFilter: 'blur(12px)'` (Safari compat)
   - `borderBottom: '1px solid rgba(255,255,255,0.08)'`
   - `boxShadow: '0 4px 24px rgba(0,0,0,0.25)'`
   - `position: 'sticky', top: 0, zIndex: 100, height: 60`
4. Build the logo section with `Star` icon (size 20, color `#4DB6AC`, fill `#4DB6AC`) + wordmark + badge
5. Build nav links using `.map()` over the links array — each renders the icon component at size 16 + label in a `<button>`
6. Active pill: `background: 'var(--accent)'`, `color: '#fff'`, `borderRadius: 20`, no border
7. Inactive: `background: 'transparent'`, `color: '#B0BEC5'`
8. Theme toggle: circular button (`borderRadius: '50%'`, `width/height: 36px`) containing `Sun` or `Moon` icon at size 18

**Relevant Context**  
- `frontend/src/components/Navbar.js` — existing component to be replaced (lines 1-61)
- `frontend/src/utils/ThemeContext.js` — provides `{ dark, toggle }` via `useTheme()`
- `frontend/src/components/ServiceStatus.js` — rendered as-is, no changes needed
- Existing inline-style pattern used throughout the codebase — keep consistent, no new CSS classes needed
- CSS variables: `--accent: #00897B` (light) / `#4DB6AC` (dark), defined in `App.css`

**Status:** [x] done

---

## Notes

- `lucide-react` v0.460.0 is the latest stable release (within last 6 months, actively maintained, MIT license)
- No other files need changes — `App.js` imports `Navbar` by path, no name change
- `ServiceStatus` component is preserved as-is
- Dark mode glassmorphism uses a darker rgba base (`#0D1B2A` base) and light mode uses navy (`#0D2B4E` base), matching existing navbar color logic
