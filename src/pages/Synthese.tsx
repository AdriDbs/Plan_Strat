import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useParametresStore } from '../store/useParametresStore';
import { ExportButton } from '../components/ui/ExportButton';
import { getUniqueValues } from '../lib/pivotEngine';
import * as XLSX from 'xlsx';

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const INDICATEURS = ['ETP_Workforce_Interne_FP', 'ETP_Workforce_Interne_M', 'Cout_ETP', 'ETP_Workforce_Externe_FP', 'ETP_Workforce_Externe_M'];

const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

interface PivotRowData {
  key: string;
  Entité: string;
  Hub: string;
  Process: string;
  CDR: string;
  Nom_CDR: string;
  Type_indicateur: string;
  values: Record<number, number>;
  isSubtotal?: boolean;
  level: number;
}

export const Synthese: React.FC = () => {
  const { allData } = useDataStore();
  const { parametres } = useParametresStore();
  const [filterEntite, setFilterEntite] = useState<string[]>([]);
  const [filterHub, setFilterHub] = useState<string[]>([]);
  const [filterProcess, setFilterProcess] = useState<string[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Exclude expansion source
  const data = useMemo(() =>
    allData.filter(r => INDICATEURS.includes(r.Type_indicateur)),
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

  const pivotRows = useMemo(() => {
    // Aggregate by CDR + indicateur + year
    const map = new Map<string, PivotRowData>();

    for (const r of filtered) {
      for (const ind of INDICATEURS) {
        if (r.Type_indicateur !== ind) continue;
        const k = `${r.Entité}|${r.Hub}|${r.Process}|${r.CDR}|${ind}`;
        if (!map.has(k)) {
          map.set(k, {
            key: k,
            Entité: r.Entité,
            Hub: r.Hub,
            Process: r.Process,
            CDR: r.CDR,
            Nom_CDR: r.Nom_CDR ?? '',
            Type_indicateur: ind,
            values: {},
            level: 4,
          });
        }
        const entry = map.get(k)!;
        const val = ind.includes('ETP') ? (r.Total_ETP ?? 0) : (r.Total_Cout_KEUR ?? 0);
        entry.values[r.Année] = (entry.values[r.Année] ?? 0) + val;
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.Entité.localeCompare(b.Entité) ||
      a.Hub.localeCompare(b.Hub) ||
      a.Process.localeCompare(b.Process) ||
      a.CDR.localeCompare(b.CDR) ||
      INDICATEURS.indexOf(a.Type_indicateur) - INDICATEURS.indexOf(b.Type_indicateur)
    );
  }, [filtered]);

  const handleExport = () => {
    const rows = pivotRows.map(r => {
      const row: Record<string, unknown> = {
        Entité: r.Entité, Hub: r.Hub, Process: r.Process,
        CDR: r.CDR, Nom_CDR: r.Nom_CDR, Indicateur: r.Type_indicateur,
      };
      YEARS.forEach(y => { row[String(y)] = r.values[y] ?? ''; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Synthese');
    XLSX.writeFile(wb, 'synthese.xlsx');
  };

  return (
    <div>
      {/* Filters */}
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
        <ExportButton onClick={handleExport} disabled={pivotRows.length === 0} />
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto', maxHeight: '70vh' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', fontSize: 12, minWidth: 'max-content' }}>
          <thead>
            <tr>
              <th style={{ background: '#111827', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20 }}>CDR</th>
              <th style={{ background: '#111827', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20 }}>Nom CDR</th>
              <th style={{ background: '#111827', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20 }}>Indicateur</th>
              {YEARS.map(y => (
                <th key={y} style={{ background: '#111820', color: '#e8451a', padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 20 }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pivotRows.map((row, i) => (
              <tr key={row.key} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9', whiteSpace: 'nowrap' }}>{row.CDR}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{row.Nom_CDR || '—'}</td>
                <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', whiteSpace: 'nowrap', fontSize: 11 }}>{row.Type_indicateur}</td>
                {YEARS.map(y => (
                  <td key={y} style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9', textAlign: 'right', fontVariantNumeric: 'tabular-nums', background: 'rgba(232,69,26,0.03)' }}>
                    {fmt(row.values[y])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {pivotRows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune donnée</div>
        )}
      </div>
    </div>
  );
};
