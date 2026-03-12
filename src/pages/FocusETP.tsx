import React, { useMemo, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '../store/useDataStore';
import { ExportButton } from '../components/ui/ExportButton';
import { getUniqueValues } from '../lib/pivotEngine';
import * as XLSX from 'xlsx';

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const fmt = (n: number | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

interface ETPRow {
  key: string;
  Entité: string;
  Hub: string;
  Process: string;
  CDR: string;
  Nom_CDR: string;
  Code_ETP: string;
  Nom_FTE: string;
  etpFP: Record<number, number>;
  etpM: Record<number, number>;
}

export const FocusETP: React.FC = () => {
  const { allData } = useDataStore();
  const [filterEntite, setFilterEntite] = useState<string[]>([]);
  const [filterHub, setFilterHub] = useState<string[]>([]);
  const [filterProcess, setFilterProcess] = useState<string[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);

  const data = useMemo(() =>
    allData.filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP' || r.Type_indicateur === 'ETP_Workforce_Interne_M'),
    [allData]
  );

  const entites = useMemo(() => getUniqueValues(data, 'Entité'), [data]);
  const hubs = useMemo(() => getUniqueValues(data, 'Hub'), [data]);
  const processes = useMemo(() => getUniqueValues(data, 'Process'), [data]);

  const filtered = useMemo(() => data.filter(r =>
    (filterEntite.length === 0 || filterEntite.includes(r.Entité)) &&
    (filterHub.length === 0 || filterHub.includes(r.Hub)) &&
    (filterProcess.length === 0 || filterProcess.includes(r.Process))
  ), [data, filterEntite, filterHub, filterProcess]);

  const rows = useMemo(() => {
    const map = new Map<string, ETPRow>();
    for (const r of filtered) {
      const k = `${r.Entité}|${r.Hub}|${r.Process}|${r.CDR}|${r.Code_ETP ?? ''}`;
      if (!map.has(k)) {
        map.set(k, {
          key: k,
          Entité: r.Entité, Hub: r.Hub, Process: r.Process, CDR: r.CDR,
          Nom_CDR: r.Nom_CDR ?? '',
          Code_ETP: r.Code_ETP ?? '',
          Nom_FTE: r.Nom_FTE ?? '',
          etpFP: {}, etpM: {},
        });
      }
      const entry = map.get(k)!;
      if (r.Type_indicateur === 'ETP_Workforce_Interne_FP') {
        entry.etpFP[r.Année] = (entry.etpFP[r.Année] ?? 0) + (r.Total_ETP ?? 0);
      } else {
        entry.etpM[r.Année] = (entry.etpM[r.Année] ?? 0) + (r.Total_ETP ?? 0);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.Entité.localeCompare(b.Entité) || a.Hub.localeCompare(b.Hub) || a.CDR.localeCompare(b.CDR)
    );
  }, [filtered]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 20,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom = virtualRows.length > 0 ? totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) : 0;

  const handleExport = () => {
    const data = rows.map(r => {
      const row: Record<string, unknown> = { Entité: r.Entité, Hub: r.Hub, Process: r.Process, CDR: r.CDR, Nom_CDR: r.Nom_CDR, Code_ETP: r.Code_ETP, Nom_FTE: r.Nom_FTE };
      YEARS.forEach(y => { row[`FP_${y}`] = r.etpFP[y] ?? ''; row[`M_${y}`] = r.etpM[y] ?? ''; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FocusETP');
    XLSX.writeFile(wb, 'focus_etp.xlsx');
  };

  const thStyle = (isYear = false): React.CSSProperties => ({
    background: isYear ? '#111820' : '#111827',
    color: isYear ? '#e8451a' : '#94a3b8',
    padding: '8px 8px',
    textAlign: isYear ? 'right' : 'left',
    borderBottom: '1px solid #1e2d45',
    fontFamily: 'DM Mono, monospace',
    fontSize: 10,
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[
          { label: 'ENTITÉ', vals: entites, sel: filterEntite, set: setFilterEntite },
          { label: 'HUB', vals: hubs, sel: filterHub, set: setFilterHub },
          { label: 'PROCESS', vals: processes, sel: filterProcess, set: setFilterProcess },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <select multiple value={f.sel} onChange={e => f.set(Array.from(e.target.selectedOptions).map(o => o.value))}
              style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '4px 8px', fontSize: 12, maxHeight: 80, minWidth: 120 }}>
              {f.vals.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
        <ExportButton onClick={handleExport} disabled={rows.length === 0} />
      </div>

      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', background: '#111827' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 'max-content', width: '100%' }}>
            <thead>
              <tr>
                <th style={thStyle()}>CDR</th>
                <th style={thStyle()}>Nom CDR</th>
                <th style={thStyle()}>Code ETP</th>
                <th style={thStyle()}>Intitulé</th>
                {YEARS.map(y => <th key={`fp${y}`} style={thStyle(true)}>FP {y}</th>)}
                {YEARS.map(y => <th key={`m${y}`} style={{ ...thStyle(true), color: '#94a3b8' }}>M {y}</th>)}
              </tr>
            </thead>
          </table>
        </div>
        <div ref={parentRef} style={{ height: 600, overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 'max-content', width: '100%' }}>
            <tbody>
              {paddingTop > 0 && <tr><td style={{ height: paddingTop }} /></tr>}
              {virtualRows.map(vr => {
                const row = rows[vr.index];
                return (
                  <tr key={row.key} style={{ background: vr.index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9', fontSize: 12, whiteSpace: 'nowrap' }}>{row.CDR}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{row.Nom_CDR || '—'}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', fontSize: 12 }}>{row.Code_ETP || '—'}</td>
                    <td style={{ padding: '5px 8px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', fontSize: 12, whiteSpace: 'nowrap' }}>{row.Nom_FTE || '—'}</td>
                    {YEARS.map(y => <td key={`fp${y}`} style={{ padding: '5px 8px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, background: 'rgba(232,69,26,0.03)' }}>{fmt(row.etpFP[y])}</td>)}
                    {YEARS.map(y => <td key={`m${y}`} style={{ padding: '5px 8px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, background: 'rgba(232,69,26,0.02)' }}>{fmt(row.etpM[y])}</td>)}
                  </tr>
                );
              })}
              {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} /></tr>}
            </tbody>
          </table>
          {rows.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune donnée</div>}
        </div>
        <div style={{ background: '#111827', borderTop: '1px solid #1e2d45', padding: '6px 12px', color: '#475569', fontSize: 11 }}>
          {rows.length.toLocaleString('fr-FR')} lignes
        </div>
      </div>
    </div>
  );
};
