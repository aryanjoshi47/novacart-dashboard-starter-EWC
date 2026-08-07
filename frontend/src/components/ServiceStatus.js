import React, { useEffect, useState } from 'react';
import { getHealth } from '../utils/api';

export default function ServiceStatus() {
  const [status, setStatus] = useState('checking');
  const [detail, setDetail] = useState('');

  async function check() {
    try {
      const data = await getHealth();
      setStatus(data.status === 'healthy' ? 'healthy' : 'degraded');
      setDetail(data.database?.status === 'connected' ? 'Connected' : 'DB issue');
    } catch {
      setStatus('error');
      setDetail('Backend unreachable');
    }
  }

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const colors = { healthy: '#00897B', degraded: '#F9A825', error: '#C62828', checking: '#90A4AE' };
  const labels = { healthy: 'Service healthy', degraded: 'Degraded', error: 'Offline', checking: 'Checking…' };

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Service status: ${labels[status]}${detail ? ` — ${detail}` : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
      title={detail}
    >
      <span
        aria-hidden="true"
        style={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: colors[status],
          boxShadow: 'none',
          display: 'inline-block',
        }}
      />
      <span aria-hidden="true" style={{ color: colors[status], fontWeight: 300 }}>{labels[status]}</span>
    </div>
  );
}
