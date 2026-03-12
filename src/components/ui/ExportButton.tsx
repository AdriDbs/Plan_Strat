import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ onClick, label = 'Exporter Excel', disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        background: disabled ? '#1a2235' : '#e8451a',
        border: 'none',
        borderRadius: 6,
        color: disabled ? '#475569' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 13,
        fontWeight: 500,
        transition: 'background 0.15s',
      }}
    >
      <Download size={14} />
      {label}
    </button>
  );
};
