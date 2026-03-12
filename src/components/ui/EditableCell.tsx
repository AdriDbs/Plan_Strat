import React, { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
  value: string | number | null;
  onSave: (val: string) => void;
  type?: 'text' | 'number';
}

export const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, type = 'text' }) => {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = () => {
    onSave(localVal);
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        onClick={() => { setLocalVal(String(value ?? '')); setEditing(true); }}
        style={{
          cursor: 'text',
          minWidth: 60,
          padding: '2px 4px',
          borderRadius: 3,
          color: value == null || value === '' ? '#475569' : '#f1f5f9',
        }}
      >
        {value == null || value === '' ? '—' : String(value)}
      </div>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={localVal}
      onChange={e => setLocalVal(e.target.value)}
      onBlur={handleSave}
      onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      style={{
        background: '#0a0f1e',
        border: '1px solid #e8451a',
        borderRadius: 3,
        color: '#f1f5f9',
        padding: '2px 6px',
        fontSize: 13,
        width: '100%',
        minWidth: 80,
      }}
    />
  );
};
