import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { useUser } from '../utils/UserContext';
import { BarChart2, Package, Users, ChevronLeft, ChevronRight, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { getHealth } from '../utils/api';

const ALL_LINKS = [
  { label: 'Orders',    path: '/orders',    Icon: BarChart2, adminOnly: false },
  { label: 'Products',  path: '/products',  Icon: Package,   adminOnly: false },
  { label: 'Customers', path: '/customers', Icon: Users,     adminOnly: true  },
];

const EXPANDED_WIDTH  = 220;
const COLLAPSED_WIDTH = 72;
const MOBILE_BP       = 768;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();
  const { user, role, logout } = useUser();

  // Show admin-only links only when role is confirmed admin; during loading show non-admin links
  const links = ALL_LINKS.filter(l => !l.adminOnly || role === 'admin');

  const [collapsed,    setCollapsed]   = useState(() => localStorage.getItem('sidebarCollapsed') === 'true');
  const [isMobile,     setIsMobile]    = useState(() => window.innerWidth <= MOBILE_BP);
  const [menuOpen,     setMenuOpen]    = useState(false);
  const [healthColor,  setHealthColor] = useState('#90A4AE'); // checking = muted grey

  const navBg           = dark ? '#EDE9FE' : '#1A2332';
  const borderColor     = dark ? '#C5BFDF' : '#2E3D52';
  const logoColor       = dark ? '#1A2332' : '#EDE9FE';
  const inactiveColor   = dark ? '#455A64' : '#A0AEC0';
  const hoverColor      = dark ? '#1A2332' : '#ffffff';
  const iconBorderColor = dark ? '#C5BFDF' : '#2E3D52';
  const btnBg           = dark ? '#00897B' : '#5E6AD2';
  const logoSrc         = dark ? '/novacart_logo.png' : '/novacart_logo_white.png';

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
            <img src={logoSrc} alt="NovaCart" style={{ width: 28, height: 28, objectFit: 'contain' }} />
            <span style={{ color: logoColor, fontWeight: 300, fontSize: 16, letterSpacing: '-0.3px' }}>
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
                      fontSize: 16, fontWeight: 300, fontFamily: 'Satoshi, sans-serif',
                      marginBottom: 6,
                      boxSizing: 'border-box',
                    }}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span style={{ letterSpacing: '0.3px' }}>{label}</span>
                  </button>
                );
              })}
              {/* Logout */}
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  width: '100%',
                  background: 'transparent',
                  border: `1px solid ${iconBorderColor}`,
                  color: inactiveColor,
                  borderRadius: 8,
                  padding: '0 14px',
                  height: 44,
                  cursor: 'pointer',
                  fontSize: 16, fontWeight: 300, fontFamily: 'Satoshi, sans-serif',
                  marginTop: 2,
                  boxSizing: 'border-box',
                }}
              >
                <LogOut size={16} strokeWidth={1.8} />
                <span style={{ letterSpacing: '0.3px' }}>Logout{user ? ` (${user})` : ''}</span>
              </button>
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
      onMouseEnter={e => { e.currentTarget.style.background = dark ? '#D6D0EE' : '#253347'; e.currentTarget.style.color = hoverColor; }}
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
          src={logoSrc}
          alt="NovaCart"
          style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }}
        />
        {!collapsed && (
          <span style={{ color: logoColor, fontWeight: 300, fontSize: 17, letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            NovaCart
          </span>
        )}
      </div>

      {/* Nav links */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 2,
        padding: '8px 0',
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
                background: active ? (dark ? 'rgba(26,35,50,0.12)' : 'rgba(255,255,255,0.10)') : 'transparent',
                border: 'none',
                borderLeft: active ? `3px solid var(--accent)` : '3px solid transparent',
                color: active ? hoverColor : inactiveColor,
                borderRadius: 0,
                padding: collapsed ? 0 : '0 18px',
                cursor: 'pointer',
                fontSize: 16, fontWeight: 300, fontFamily: 'Satoshi, sans-serif',
                transition: 'background 0.15s, color 0.15s',
                height: 44,
                width: '100%',
                flexShrink: 0,
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = dark ? 'rgba(26,35,50,0.08)' : 'rgba(255,255,255,0.06)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.color = inactiveColor; e.currentTarget.style.background = 'transparent'; } }}
            >
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              {!collapsed && <span style={{ whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>{label}</span>}
            </button>
          );
        })}
      </div>

      {/* Logout — pinned to the bottom of the sidebar */}
      <div style={{ paddingBottom: 8, flexShrink: 0 }}>
        {!collapsed && user && (
          <div style={{
            fontSize: 11, color: inactiveColor,
            padding: '0 21px 4px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {user}
          </div>
        )}
        <button
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
          style={{
            display: 'flex', alignItems: 'center',
            gap: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%',
            background: 'transparent',
            border: 'none',
            borderLeft: '3px solid transparent',
            color: inactiveColor,
            borderRadius: 0,
            padding: collapsed ? 0 : '0 18px',
            height: 44,
            cursor: 'pointer',
            fontSize: 16, fontWeight: 300, fontFamily: 'Satoshi, sans-serif',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#C62828'; e.currentTarget.style.borderLeftColor = '#C62828'; e.currentTarget.style.background = dark ? 'rgba(198,40,40,0.08)' : 'rgba(198,40,40,0.06)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = inactiveColor; e.currentTarget.style.borderLeftColor = 'transparent'; e.currentTarget.style.background = 'transparent'; }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogOut size={15} strokeWidth={1.8} />
          </span>
          {!collapsed && <span style={{ whiteSpace: 'nowrap', letterSpacing: '0.3px' }}>Logout</span>}
        </button>
      </div>

    </nav>
    </>
  );
}
