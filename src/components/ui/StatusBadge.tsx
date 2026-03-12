import React from 'react';

interface StatusBadgeProps {
  lastUpdated: string | null;
  rowCount?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ lastUpdated, rowCount }) => {
  if (!lastUpdated) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
        <span style={{ color: '#ef4444', fontSize: 12 }}>Non chargé</span>
      </div>
    );
  }

  const daysDiff = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
  const color = daysDiff < 7 ? '#22c55e' : daysDiff < 30 ? '#f59e0b' : '#ef4444';
  const label = daysDiff < 7 ? 'Récent' : daysDiff < 30 ? 'À jour' : 'Ancien';

  const date = new Date(lastUpdated).toLocaleDateString('fr-FR');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ color, fontSize: 12, fontWeight: 500 }}>{label}</span>
      </div>
      <span style={{ color: '#94a3b8', fontSize: 11 }}>{date}</span>
      {rowCount !== undefined && (
        <span style={{ color: '#475569', fontSize: 11 }}>{rowCount.toLocaleString('fr-FR')} lignes</span>
      )}
    </div>
  );
};
