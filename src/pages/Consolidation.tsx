import React, { useMemo, useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { DataTable } from '../components/ui/DataTable';
import { ExportButton } from '../components/ui/ExportButton';
import { exportConsolidation } from '../lib/excelExporter';
import { getUniqueValues } from '../lib/pivotEngine';
import type { ColumnDef } from '@tanstack/react-table';
import type { ConsolidatedRecord } from '../types/data';

export const Consolidation: React.FC = () => {
  const { consolidation, isCalculating } = useDataStore();
  const [filterIndicateur, setFilterIndicateur] = useState('');
  const [filterAnnee, setFilterAnnee] = useState('');
  const [filterEntite, setFilterEntite] = useState('');

  const indicateurs = useMemo(() => getUniqueValues(consolidation, 'Type_indicateur'), [consolidation]);
  const annees = useMemo(() => getUniqueValues(consolidation, 'Année').sort(), [consolidation]);
  const entites = useMemo(() => getUniqueValues(consolidation, 'Entité'), [consolidation]);

  const filtered = useMemo(() => {
    return consolidation.filter(r =>
      (!filterIndicateur || r.Type_indicateur === filterIndicateur) &&
      (!filterAnnee || String(r.Année) === filterAnnee) &&
      (!filterEntite || r.Entité === filterEntite)
    );
  }, [consolidation, filterIndicateur, filterAnnee, filterEntite]);

  const fmt = (n: number | null) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2 }).format(n);

  const columns: ColumnDef<ConsolidatedRecord>[] = [
    { accessorKey: 'Type_indicateur', header: 'Indicateur', size: 160 },
    { accessorKey: 'Entité', header: 'Entité', size: 90 },
    { accessorKey: 'Hub', header: 'Hub', size: 100 },
    { accessorKey: 'Process', header: 'Process', size: 90 },
    { accessorKey: 'CDR', header: 'CDR', size: 90 },
    { accessorKey: 'Nom_CDR', header: 'Nom CDR', size: 160, cell: c => c.getValue() ?? '—' },
    { accessorKey: 'Projet', header: 'Projet', size: 80, cell: c => c.getValue() ?? '—' },
    { accessorKey: 'REP', header: 'REP', size: 80, cell: c => c.getValue() ?? '—' },
    { accessorKey: 'Account', header: 'Account', size: 80, cell: c => c.getValue() ?? '—' },
    { accessorKey: 'Type_ETP', header: 'Type ETP', size: 80, cell: c => c.getValue() ?? '—' },
    { accessorKey: 'Code_ETP', header: 'Code ETP', size: 80, cell: c => c.getValue() ?? '—' },
    { accessorKey: 'Année', header: 'Année', size: 70 },
    {
      accessorKey: 'Total_ETP',
      header: 'Total ETP',
      size: 100,
      cell: c => {
        const v = c.getValue() as number | null;
        return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span>;
      },
    },
    {
      accessorKey: 'Total_Cout_KEUR',
      header: 'Total Coût KEUR',
      size: 120,
      cell: c => {
        const v = c.getValue() as number | null;
        return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{fmt(v)}</span>;
      },
    },
  ];

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <label style={{ color: '#475569', fontSize: 11, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>INDICATEUR</label>
          <select value={filterIndicateur} onChange={e => setFilterIndicateur(e.target.value)} style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '6px 10px', fontSize: 12 }}>
            <option value="">Tous</option>
            {indicateurs.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: '#475569', fontSize: 11, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>ANNÉE</label>
          <select value={filterAnnee} onChange={e => setFilterAnnee(e.target.value)} style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '6px 10px', fontSize: 12 }}>
            <option value="">Toutes</option>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: '#475569', fontSize: 11, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>ENTITÉ</label>
          <select value={filterEntite} onChange={e => setFilterEntite(e.target.value)} style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '6px 10px', fontSize: 12 }}>
            <option value="">Toutes</option>
            {entites.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <ExportButton onClick={() => exportConsolidation(filtered)} disabled={filtered.length === 0} />
      </div>

      {isCalculating ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Calcul en cours...</div>
      ) : (
        <DataTable data={filtered} columns={columns} height={600} />
      )}
    </div>
  );
};
