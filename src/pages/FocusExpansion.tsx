import React, { useMemo, useState } from 'react';
import { useSourcesStore } from '../store/useSourcesStore';
import { ExportButton } from '../components/ui/ExportButton';
import * as XLSX from 'xlsx';

export const FocusExpansion: React.FC = () => {
  const { sources } = useSourcesStore();
  const data = sources.expansion;

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterNature, setFilterNature] = useState<string[]>([]);
  const [filterHub, setFilterHub] = useState<string[]>([]);

  const statuses = useMemo(() => [...new Set(data.map(r => String(r['Transfer status'] ?? '')).filter(Boolean))].sort(), [data]);
  const natures = useMemo(() => [...new Set(data.map(r => String(r['Nature of movement'] ?? '')).filter(Boolean))].sort(), [data]);
  const hubs = useMemo(() => [...new Set(data.map(r => String(r['Destination hub'] ?? '')).filter(Boolean))].sort(), [data]);

  const filtered = useMemo(() => data.filter(r =>
    (filterStatus.length === 0 || filterStatus.includes(String(r['Transfer status'] ?? ''))) &&
    (filterNature.length === 0 || filterNature.includes(String(r['Nature of movement'] ?? ''))) &&
    (filterHub.length === 0 || filterHub.includes(String(r['Destination hub'] ?? '')))
  ), [data, filterStatus, filterNature, filterHub]);

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered as Record<string, unknown>[]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expansion');
    XLSX.writeFile(wb, 'focus_expansion.xlsx');
  };

  const cols = ['ID', 'Destination E2E Process', 'Activity', 'Expected transfer date', 'Expected volume of activity (FTE)', 'Transfer status', 'Nature of movement', 'Destination hub', 'Expected permanent contracts to be transferred (Headcounts)', 'Destination team'];

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[
          { label: 'STATUT', vals: statuses, sel: filterStatus, set: setFilterStatus },
          { label: 'NATURE', vals: natures, sel: filterNature, set: setFilterNature },
          { label: 'HUB DESTINATION', vals: hubs, sel: filterHub, set: setFilterHub },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <select multiple value={f.sel} onChange={e => f.set(Array.from(e.target.selectedOptions).map(o => o.value))}
              style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '4px 8px', fontSize: 12, maxHeight: 80, minWidth: 140 }}>
              {f.vals.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
        <ExportButton onClick={handleExport} disabled={filtered.length === 0} />
      </div>
      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c} style={{ background: '#111827', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                {cols.map(c => (
                  <td key={c} style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9', whiteSpace: 'nowrap' }}>
                    {String(row[c] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune donnée d'expansion chargée</div>}
      </div>
    </div>
  );
};
