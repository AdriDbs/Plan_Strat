import React, { useRef, useState, useCallback } from 'react';
import { Upload, FileUp } from 'lucide-react';

interface UploadZoneProps {
  onFile: (file: File) => void;
  loading?: boolean;
  error?: string;
  accept?: string;
  label?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFile,
  loading,
  error,
  accept = '.xlsx,.xls',
  label = 'Glisser-déposer votre fichier .xlsx',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file);
      e.target.value = '';
    }
  }, [onFile]);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#e8451a' : error ? '#ef4444' : '#1e2d45'}`,
        borderRadius: 8,
        padding: '16px 20px',
        background: dragging ? 'rgba(232,69,26,0.05)' : '#111827',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        transition: 'all 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleChange} />
      {loading ? (
        <div style={{ color: '#94a3b8', fontSize: 13 }}>Traitement en cours...</div>
      ) : (
        <>
          <FileUp size={18} style={{ color: '#475569', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>{label}</div>
            <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>ou cliquer pour parcourir</div>
          </div>
          <Upload size={14} style={{ color: '#475569' }} />
        </>
      )}
    </div>
  );
};
