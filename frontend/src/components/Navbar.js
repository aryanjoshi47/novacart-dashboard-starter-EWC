import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { BarChart2, Package, Users, ChevronLeft, ChevronRight, Menu, X, Sun, Moon } from 'lucide-react';
import { getHealth } from '../utils/api';

const links = [
  { label: 'Orders',    path: '/orders',    Icon: BarChart2 },
  { label: 'Products',  path: '/products',  Icon: Package   },
  { label: 'Customers', path: '/customers', Icon: Users     },
];

const EXPANDED_WIDTH  = 220;
const COLLAPSED_WIDTH = 72;
const MOBILE_BP       = 768;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();

  const [collapsed,    setCollapsed]   = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [isMobile,     setIsMobile]    = useState(() => window.innerWidth <= MOBILE_BP);
  const [menuOpen,     setMenuOpen]    = useState(false);
  const [healthColor,  setHealthColor] = useState('#90A4AE'); // checking = muted grey

  const navBg           = dark ? '#0D0D10' : '#ffffff';
  const borderColor     = dark ? '#1A1A24' : '#E0E6ED';
  const logoColor       = dark ? '#EDE9FE' : '#1A2332';
  const inactiveColor   = dark ? '#6B6080' : '#6B7280';
  const hoverColor      = dark ? '#EDE9FE' : '#1A2332';
  const iconBorderColor = dark ? '#1A1A24' : '#E5E7EB';
  const btnBg           = dark ? '#5E6AD2' : '#00897B';

  // Track viewport width changes
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BP}px)`);
    const handler = (e) => {
      setIsMobile(e.matches);
      if (!e.matches) setMenuOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Health dot — only poll when on mobile
  useEffect(() => {
    if (!isMobile) return;
    const STATUS_COLORS = { healthy: '#00897B', degraded: '#F9A825', error: '#C62828' };
    async function checkHealth() {
      try {
        const data = await getHealth();
        setHealthColor(STATUS_COLORS[data.status === 'healthy' ? 'healthy' : 'degraded']);
      } catch {
        setHealthColor(STATUS_COLORS.error);
      }
    }
    checkHealth();
    const id = setInterval(checkHealth, 30000);
    return () => clearInterval(id);
  }, [isMobile]);

  // Keep --sidebar-width CSS variable in sync (desktop only)
  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '0px');
    }
  }, [width, isMobile]);

  function toggleSidebar() {
    setCollapsed(c => {
      const next = !c;
      localStorage.setItem('sidebarCollapsed', next);
      return next;
    });
  }

  // ── Mobile top bar ──────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        {/* Fixed top bar */}
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: 'var(--topbar-height)',
          background: navBg,
          borderBottom: `1px solid ${borderColor}`,
          boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 200,
          boxSizing: 'border-box',
        }}>
          {/* Logo */}
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
          >
            <img src="/novacart_logo.png" alt="NovaCart" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ color: logoColor, fontWeight: 600, fontSize: 16, letterSpacing: '-0.3px' }}>
              NovaCart
            </span>
          </div>

          {/* Right controls: health dot + theme toggle + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Health status dot */}
            <span
              title="Service status"
              style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: healthColor,
                boxShadow: 'none',
                display: 'inline-block', flexShrink: 0,
              }}
            />
            <div style={{ width: 1, height: 16, background: borderColor }} />
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32,
                background: btnBg,
                border: 'none', borderRadius: '50%',
                color: '#fff', cursor: 'pointer',
              }}
            >
              {dark ? <Sun size={14} strokeWidth={2.2} /> : <Moon size={14} strokeWidth={2.2} />}
            </button>
            <div style={{ width: 1, height: 16, background: borderColor }} />
            {/* Hamburger / close */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36,
                background: 'transparent',
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                color: inactiveColor, cursor: 'pointer',
              }}
            >
              {menuOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
            </button>
          </div>
        </div>

        {/* Dropdown nav menu */}
        {menuOpen && (
          <>
            {/* Backdrop — tap outside to close */}
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                zIndex: 198,
                background: 'transparent',
              }}
            />
            <div style={{
              position: 'fixed',
              top: 'var(--topbar-height)',
              left: 0, right: 0,
              background: navBg,
              borderBottom: `1px solid ${borderColor}`,
              boxShadow: dark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 16px rgba(0,0,0,0.08)',
              zIndex: 199,
              padding: '8px 12px 12px',
            }}>
              {links.map(({ label, path, Icon }) => {
                const active = location.pathname === path;
                return (
                  <button
                    key={path}
                    onClick={() => navigate(path)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      width: '100%',
                      background: active ? 'var(--accent)' : 'transparent',
                      border: active ? 'none' : `1px solid ${iconBorderColor}`,
                      color: active ? '#fff' : inactiveColor,
                      borderRadius: 8,
                      padding: '0 14px',
                      height: 44,
                      cursor: 'pointer',
                      fontSize: 14, fontWeight: 500,
                      marginBottom: 6,
                      boxSizing: 'border-box',
                    }}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </>
    );
  }

  // ── Desktop sidebar (unchanged) ─────────────────────────────────────────
  return (
    <>
    {/* Collapse toggle — floats on the outer edge, vertically centred */}
    <button
      onClick={toggleSidebar}
      title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      style={{
        position: 'fixed',
        top: '50vh',
        left: width - 20,
        transform: 'translateY(-50%)',
        zIndex: 101,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        background: navBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '50%',
        color: inactiveColor,
        cursor: 'pointer',
        transition: 'left 0.22s ease, background 0.15s, color 0.15s',
        boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.12)',
        padding: 0,
        flexShrink: 0,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = dark ? '#1A1A2E' : '#F3F4F6'; e.currentTarget.style.color = hoverColor; }}
      onMouseLeave={e => { e.currentTarget.style.background = navBg; e.currentTarget.style.color = inactiveColor; }}
    >
      {collapsed ? <ChevronRight size={18} strokeWidth={2.5} /> : <ChevronLeft size={18} strokeWidth={2.5} />}
    </button>

    <nav style={{
      position: 'fixed',
      left: 0, top: 0,
      height: '100vh',
      width,
      background: navBg,
      borderRight: `1px solid ${borderColor}`,
      boxShadow: dark ? '2px 0 12px rgba(0,0,0,0.3)' : '2px 0 8px rgba(0,0,0,0.06)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      zIndex: 100,
      overflow: 'hidden',
      transition: 'width 0.22s ease',
      boxSizing: 'border-box',
    }}>

      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', userSelect: 'none',
          padding: collapsed ? '16px 0' : '16px 18px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64, flexShrink: 0,
        }}
      >
        <img
          src="/novacart_logo.png"
          alt="NovaCart"
          style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
        />
        {!collapsed && (
          <span style={{ color: logoColor, fontWeight: 500, fontSize: 17, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            NovaCart
          </span>
        )}
      </div>

      {/* Nav links */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: collapsed ? '8px 0' : '8px 12px',
        flex: 1,
      }}>
        {links.map(({ label, path, Icon }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--accent)' : 'transparent',
                border: active ? 'none' : `1px solid ${active ? 'transparent' : iconBorderColor}`,
                color: active ? '#fff' : inactiveColor,
                borderRadius: 8,
                padding: collapsed ? 0 : '0 14px',
                cursor: 'pointer',
                fontSize: 14, fontWeight: 500,
                transition: 'background 0.15s, color 0.15s',
                height: 44,
                width: collapsed ? 44 : '100%',
                alignSelf: collapsed ? 'center' : 'stretch',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = inactiveColor; e.currentTarget.style.background = 'transparent'; } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{label}</span>}
            </button>
          );
        })}
      </div>

    </nav>
    </>
  );
}
