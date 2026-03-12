import React from 'react';
import { Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  options: string[];
  value: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}

interface FilterBarProps {
  filters: FilterOption[];
  onReset?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onReset }) => {
  return (
    <div style={{
      background: '#111827',
      border: '1px solid #1e2d45',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 12,
      alignItems: 'center',
      marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
        <Filter size={13} />
        <span style={{ fontFamily: 'DM Mono, monospace' }}>FILTRES</span>
      </div>
      {filters.map((f, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase' }}>{f.label}</label>
          <select
            multiple
            value={f.value}
            onChange={e => {
              const vals = Array.from(e.target.selectedOptions).map(o => o.value);
              f.onChange(vals);
            }}
            style={{
              background: '#1a2235',
              border: '1px solid #1e2d45',
              borderRadius: 4,
              color: '#f1f5f9',
              fontSize: 12,
              padding: '4px 8px',
              minWidth: 120,
              maxHeight: 80,
            }}
          >
            {f.options.map(opt => (
              <option key={opt} value={opt}>{opt || '(vide)'}</option>
            ))}
          </select>
        </div>
      ))}
      {onReset && (
        <button
          onClick={onReset}
          style={{
            padding: '4px 12px',
            background: 'transparent',
            border: '1px solid #1e2d45',
            borderRadius: 4,
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 12,
            alignSelf: 'flex-end',
          }}
        >
          Réinitialiser
        </button>
      )}
    </div>
  );
};
