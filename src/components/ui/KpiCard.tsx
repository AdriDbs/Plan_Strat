import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: number;
  color?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtitle, icon: Icon, trend, color = '#e8451a' }) => {
  return (
    <div style={{
      background: '#1a2235',
      border: '1px solid #1e2d45',
      borderRadius: 10,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ color: '#94a3b8', fontSize: 12, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{ width: 32, height: 32, borderRadius: 6, background: `rgba(${hexToRgb(color)}, 0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={16} style={{ color }} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#f1f5f9', fontFamily: 'DM Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {trend !== undefined && (
          <span style={{ fontSize: 12, color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
            {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
        )}
        {subtitle && <span style={{ color: '#475569', fontSize: 12 }}>{subtitle}</span>}
      </div>
    </div>
  );
};

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '232, 69, 26';
}
