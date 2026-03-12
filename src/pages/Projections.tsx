import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { ExportButton } from '../components/ui/ExportButton';
import { getUniqueValues } from '../lib/pivotEngine';
import { exportConsolidation } from '../lib/excelExporter';

const PROJECTION_YEARS = [2027, 2028, 2029, 2030];
const fmt = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export const Projections: React.FC = () => {
  const { projections, isCalculating } = useDataStore();
  const [filterIndicateur, setFilterIndicateur] = useState('');
  const [filterEntite, setFilterEntite] = useState('');

  const indicateurs = useMemo(() => getUniqueValues(projections, 'Type_indicateur'), [projections]);
  const entites = useMemo(() => getUniqueValues(projections, 'Entité'), [projections]);

  const filtered = useMemo(() => projections.filter(r =>
    (!filterIndicateur || r.Type_indicateur === filterIndicateur) &&
    (!filterEntite || r.Entité === filterEntite) &&
    PROJECTION_YEARS.includes(r.Année)
  ), [projections, filterIndicateur, filterEntite]);

  const pivotData = useMemo(() => {
    const map = new Map<string, { Entité: string; Hub: string; Process: string; CDR: string; Nom_CDR: string; Type_indicateur: string; values: Record<number, number> }>();
    for (const r of filtered) {
      const k = `${r.Entité}|${r.Hub}|${r.Process}|${r.CDR}|${r.Type_indicateur}`;
      if (!map.has(k)) {
        map.set(k, { Entité: r.Entité, Hub: r.Hub, Process: r.Process, CDR: r.CDR, Nom_CDR: r.Nom_CDR ?? '', Type_indicateur: r.Type_indicateur, values: {} });
      }
      const entry = map.get(k)!;
      const val = r.Type_indicateur.includes('ETP') ? (r.Total_ETP ?? 0) : (r.Total_Cout_KEUR ?? 0);
      entry.values[r.Année] = (entry.values[r.Année] ?? 0) + val;
    }
    return Array.from(map.values()).sort((a, b) => a.Entité.localeCompare(b.Entité) || a.CDR.localeCompare(b.CDR));
  }, [filtered]);

  return (
    <div>
      <div style={{ background: 'rgba(232,69,26,0.08)', border: '1px solid rgba(232,69,26,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#e8451a', fontSize: 13 }}>
        Projections calculées en mémoire pour les années 2027–2030 à partir des hypothèses de modélisation.
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>INDICATEUR</label>
          <select value={filterIndicateur} onChange={e => setFilterIndicateur(e.target.value)} style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '6px 10px', fontSize: 12 }}>
            <option value="">Tous</option>
            {indicateurs.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>ENTITÉ</label>
          <select value={filterEntite} onChange={e => setFilterEntite(e.target.value)} style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '6px 10px', fontSize: 12 }}>
            <option value="">Toutes</option>
            {entites.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <ExportButton onClick={() => exportConsolidation(filtered, 'projections.xlsx')} disabled={filtered.length === 0} />
      </div>

      {isCalculating ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Calcul en cours...</div>
      ) : (
        <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead>
              <tr>
                {['Entité', 'Hub', 'Process', 'CDR', 'Nom CDR', 'Indicateur', ...PROJECTION_YEARS.map(String)].map(h => (
                  <th key={h} style={{ background: PROJECTION_YEARS.map(String).includes(h) ? '#111820' : '#111827', color: PROJECTION_YEARS.map(String).includes(h) ? '#e8451a' : '#94a3b8', padding: '8px 12px', textAlign: PROJECTION_YEARS.map(String).includes(h) ? 'right' : 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, whiteSpace: 'nowrap', position: 'sticky', top: 0, zIndex: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pivotData.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8' }}>{row.Entité}</td>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8' }}>{row.Hub}</td>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8' }}>{row.Process}</td>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9' }}>{row.CDR}</td>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', whiteSpace: 'nowrap' }}>{row.Nom_CDR || '—'}</td>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#94a3b8', fontSize: 11 }}>{row.Type_indicateur}</td>
                  {PROJECTION_YEARS.map(y => (
                    <td key={y} style={{ padding: '6px 12px', borderBottom: '1px solid rgba(30,45,69,0.4)', color: '#f1f5f9', textAlign: 'right', fontVariantNumeric: 'tabular-nums', background: 'rgba(232,69,26,0.04)' }}>
                      {fmt(row.values[y])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {pivotData.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune projection disponible — chargez des données sources</div>}
        </div>
      )}
    </div>
  );
};
