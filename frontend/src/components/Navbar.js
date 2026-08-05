import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import { BarChart2, Package, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const links = [
  { label: 'Orders',    path: '/orders',    Icon: BarChart2 },
  { label: 'Products',  path: '/products',  Icon: Package   },
  { label: 'Customers', path: '/customers', Icon: Users     },
];

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 72;

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const navBg           = dark ? '#0D0D10' : '#ffffff';
  const borderColor     = dark ? '#1A1A24' : '#E0E6ED';
  const logoColor       = dark ? '#EDE9FE' : '#1A2332';
  const inactiveColor   = dark ? '#6B6080' : '#6B7280';
  const hoverColor      = dark ? '#EDE9FE' : '#1A2332';
  const iconBorderColor = dark ? '#1A1A24' : '#E5E7EB';

  const width = collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  // Keep CSS variable in sync so page content can offset itself
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
  }, [width]);

  function toggle() {
    setCollapsed(c => !c);
  }

  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      top: 0,
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
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          userSelect: 'none',
          padding: collapsed ? '16px 0' : '16px 18px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
          flexShrink: 0,
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

      {/* Collapse toggle button */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '0 0 12px',
        flexShrink: 0,
      }}>
        <button
          onClick={toggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            background: 'transparent',
            border: `1px solid ${iconBorderColor}`,
            borderRadius: 8,
            color: inactiveColor,
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(167,139,250,0.12)' : 'rgba(124,58,237,0.07)'; e.currentTarget.style.color = hoverColor; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = inactiveColor; }}
        >
          {collapsed ? <ChevronRight size={15} strokeWidth={2} /> : <ChevronLeft size={15} strokeWidth={2} />}
        </button>
      </div>

      {/* Nav links */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
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
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : 12,
                justifyContent: collapsed ? 'center' : 'flex-start',
                background: active ? 'var(--accent)' : 'transparent',
                border: active ? 'none' : `1px solid ${active ? 'transparent' : iconBorderColor}`,
                color: active ? '#fff' : inactiveColor,
                borderRadius: 8,
                padding: collapsed ? 0 : '0 14px',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 500,
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
              <span style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={16} strokeWidth={1.8} />
              </span>
              {!collapsed && (
                <span style={{ whiteSpace: 'nowrap' }}>{label}</span>
              )}
            </button>
          );
        })}
      </div>

    </nav>
  );
}
