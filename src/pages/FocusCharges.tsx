import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { ExportButton } from '../components/ui/ExportButton';
import { getUniqueValues } from '../lib/pivotEngine';
import * as XLSX from 'xlsx';

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const fmt = (n: number | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

interface ChargesRow {
  key: string;
  Entité: string;
  Hub: string;
  Process: string;
  CDR: string;
  Nom_CDR: string;
  REP: string;
  Lib_REP: string;
  REP_5: string;
  values: Record<number, number>;
}

export const FocusCharges: React.FC = () => {
  const { allData } = useDataStore();
  const [filterEntite, setFilterEntite] = useState<string[]>([]);
  const [filterREP5, setFilterREP5] = useState<string[]>([]);

  const data = useMemo(() => allData.filter(r => r.Type_indicateur === 'Charges'), [allData]);

  const entites = useMemo(() => getUniqueValues(data, 'Entité'), [data]);
  const rep5s = useMemo(() => getUniqueValues(data, 'REP_5').filter(Boolean), [data]);

  const filtered = useMemo(() => data.filter(r =>
    (filterEntite.length === 0 || filterEntite.includes(r.Entité)) &&
    (filterREP5.length === 0 || filterREP5.includes(r.REP_5 ?? ''))
  ), [data, filterEntite, filterREP5]);

  const rows = useMemo(() => {
    const map = new Map<string, ChargesRow>();
    for (const r of filtered) {
      const k = `${r.Entité}|${r.CDR}|${r.REP ?? ''}`;
      if (!map.has(k)) {
        map.set(k, {
          key: k, Entité: r.Entité, Hub: r.Hub, Process: r.Process, CDR: r.CDR,
          Nom_CDR: r.Nom_CDR ?? '', REP: r.REP ?? '', Lib_REP: r.Lib_REP ?? '',
          REP_5: r.REP_5 ?? '', values: {},
        });
      }
      const entry = map.get(k)!;
      entry.values[r.Année] = (entry.values[r.Année] ?? 0) + (r.Total_Cout_KEUR ?? 0);
    }
    return Array.from(map.values()).sort((a, b) =>
      a.REP_5.localeCompare(b.REP_5) || a.REP.localeCompare(b.REP) || a.CDR.localeCompare(b.CDR)
    );
  }, [filtered]);

  const handleExport = () => {
    const data = rows.map(r => {
      const row: Record<string, unknown> = { REP_5: r.REP_5, REP: r.REP, Lib_REP: r.Lib_REP, Entité: r.Entité, CDR: r.CDR, Nom_CDR: r.Nom_CDR };
      YEARS.forEach(y => { row[String(y)] = r.values[y] ?? ''; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FocusCharges');
    XLSX.writeFile(wb, 'focus_charges.xlsx');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[
          { label: 'ENTITÉ', vals: entites, sel: filterEntite, set: setFilterEntite },
          { label: 'REP_5', vals: rep5s, sel: filterREP5, set: setFilterREP5 },
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
      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', fontSize: 12, minWidth: 'max-content' }}>
          <thead>
            <tr>
              {['REP_5', 'REP', 'Lib REP', 'Entité', 'CDR', 'Nom CDR', ...YEARS.map(String)].map(h => (
                <th key={h} style={{ background: YEARS.map(String).includes(h) ? '#111820' : '#111827', color: YEARS.map(String).includes(h) ? '#e8451a' : '#94a3b8', padding: '8px 12px', textAlign: YEARS.map(String).includes(h) ? 'right' : 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.key} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#e8451a', fontSize: 11 }}>{row.REP_5}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9' }}>{row.REP}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{row.Lib_REP || '—'}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8' }}>{row.Entité}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9' }}>{row.CDR}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{row.Nom_CDR || '—'}</td>
                {YEARS.map(y => (
                  <td key={y} style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: (row.values[y] ?? 0) < 0 ? '#ef4444' : '#f1f5f9', textAlign: 'right', fontVariantNumeric: 'tabular-nums', background: 'rgba(232,69,26,0.03)' }}>
                    {fmt(row.values[y])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune donnée de charges</div>}
      </div>
    </div>
  );
};
