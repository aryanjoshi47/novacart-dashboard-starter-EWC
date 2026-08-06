import React from 'react';
import { useTheme } from '../utils/ThemeContext';
import ServiceStatus from './ServiceStatus';
import { Sun, Moon } from 'lucide-react';

export default function TopControls() {
  const { dark, toggle } = useTheme();

  const borderColor  = dark ? '#1A1A24' : '#E0E6ED';
  const pillBg       = dark ? '#0D0D10' : '#ffffff';
  const pillShadow   = dark ? '0 4px 24px rgba(0,0,0,0.6)' : '0 4px 20px rgba(0,0,0,0.10)';
  const btnBg        = dark ? '#5E6AD2' : '#00897B';
  const btnColor     = '#ffffff';
  const btnHoverBg   = dark ? '#4F5BBD' : '#00796B';

  return (
    <div className="top-controls-pill" style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 99,
      alignItems: 'center',
      gap: 8,
      background: pillBg,
      border: `1px solid ${borderColor}`,
      borderRadius: 999,
      padding: '6px 6px 6px 12px',
      boxShadow: pillShadow,
    }}>
      <ServiceStatus />
      <div style={{ width: 1, height: 18, background: borderColor }} />
      <button
        onClick={toggle}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 32,
          height: 32,
          background: btnBg,
          border: 'none',
          borderRadius: '50%',
          color: btnColor,
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = btnHoverBg; }}
        onMouseLeave={e => { e.currentTarget.style.background = btnBg; }}
      >
        {dark ? <Sun size={15} strokeWidth={2.2} /> : <Moon size={15} strokeWidth={2.2} />}
      </button>
    </div>
  );
}
