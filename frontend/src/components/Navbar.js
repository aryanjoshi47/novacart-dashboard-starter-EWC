import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../utils/ThemeContext';
import ServiceStatus from './ServiceStatus';
import { Star, BarChart2, Package, Users, Sun, Moon } from 'lucide-react';

const links = [
  { label: 'Orders',    path: '/orders',    Icon: BarChart2 },
  { label: 'Products',  path: '/products',  Icon: Package   },
  { label: 'Customers', path: '/customers', Icon: Users     },
];


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dark, toggle } = useTheme();

  const navBg = dark ? '#1A2332' : '#ffffff';
  const borderColor = dark ? '#1E3248' : '#E0E6ED';
  const logoColor = dark ? '#E8EDF2' : '#1A2332';
  const inactiveColor = dark ? '#607D8B' : '#6B7280';
  const hoverColor = dark ? '#E8EDF2' : '#1A2332';

  return (
    <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 64,
        background: navBg,
        borderBottom: `1px solid ${borderColor}`,
        boxShadow: dark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.07)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>

        {/* Logo */}
        <div
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <Star size={22} color="#7C3AED" fill="#7C3AED" strokeWidth={1.5} />
          <span style={{ color: logoColor, fontWeight: 500, fontSize: 18, letterSpacing: '-0.3px' }}>
            NovaCart
          </span>
          <span style={{
            color: '#7C3AED',
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: '0.6px',
            textTransform: 'uppercase',
            background: 'rgba(124,58,237,0.10)',
            border: '1px solid rgba(124,58,237,0.25)',
            borderRadius: 4,
            padding: '1px 6px',
            marginLeft: 2,
          }}>
            Dashboard
          </span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: 4 }}>
          {links.map(({ label, path, Icon }) => {
            const active = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: active ? '#7C3AED' : 'transparent',
                  border: 'none',
                  color: active ? '#fff' : inactiveColor,
                  borderRadius: 10,
                  padding: '7px 16px',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 500,
                  transition: 'background 0.15s, color 0.15s',
                  height: 40,
                  boxSizing: 'border-box',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = 'rgba(124,58,237,0.10)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = inactiveColor; e.currentTarget.style.background = 'transparent'; } }}
              >
                <Icon size={15} strokeWidth={1.8} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Right side: service status + theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ServiceStatus />
          <button
            onClick={toggle}
            title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36,
              background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              border: `1px solid ${borderColor}`,
              borderRadius: '50%',
              color: dark ? '#FFD54F' : '#6B7280',
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.09)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'; }}
          >
            {dark ? <Sun size={17} strokeWidth={2} /> : <Moon size={17} strokeWidth={2} />}
          </button>
        </div>

    </nav>
  );
}
