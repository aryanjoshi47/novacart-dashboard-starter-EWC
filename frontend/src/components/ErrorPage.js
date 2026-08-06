import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ErrorPage — Full-page error display for unrecoverable errors.
 *
 * Props:
 *   message : string  — friendly error message to show (optional)
 *   onRetry : func    — if provided, shows a Retry button instead of Go Home
 */
export default function ErrorPage({ message, onRetry }) {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '48px 40px',
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        boxShadow: 'var(--shadow)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
          {message || 'An unexpected error occurred. Please try again.'}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {onRetry && (
            <button onClick={onRetry} style={{
              background: 'var(--accent)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontSize: 14,
              fontWeight: 700, cursor: 'pointer',
            }}>
              Try Again
            </button>
          )}
          <button onClick={() => navigate('/orders')} style={{
            background: 'transparent', color: 'var(--text-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 8, padding: '10px 24px', fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}>
            Go to Orders
          </button>
        </div>
      </div>
    </div>
  );
}
