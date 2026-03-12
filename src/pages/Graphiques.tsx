import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDataStore } from '../store/useDataStore';
import { useSourcesStore } from '../store/useSourcesStore';
import { getUniqueValues } from '../lib/pivotEngine';

const COLORS = ['#e8451a', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

const fmtNum = (n: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(n);

const chartBg = { background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 };

const tooltipStyle = {
  backgroundColor: '#111827',
  border: '1px solid #1e2d45',
  color: '#f1f5f9',
  fontSize: 12,
};

export const Graphiques: React.FC = () => {
  const { allData } = useDataStore();
  const { sources } = useSourcesStore();
  const [filterEntite, setFilterEntite] = useState('');

  const entites = useMemo(() => getUniqueValues(allData, 'Entité'), [allData]);
  const filtered = useMemo(() =>
    allData.filter(r => !filterEntite || r.Entité === filterEntite),
    [allData, filterEntite]
  );

  // 1. ETP FP by Process over years
  const etpFPByProcess = useMemo(() => {
    const processes = [...new Set(filtered.filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP').map(r => r.Process))];
    return YEARS.map(yr => {
      const point: Record<string, number | string> = { year: yr };
      for (const proc of processes.slice(0, 6)) {
        const total = filtered
          .filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP' && r.Année === yr && r.Process === proc)
          .reduce((s, r) => s + (r.Total_ETP ?? 0), 0);
        point[proc] = total;
      }
      return point;
    });
  }, [filtered]);

  const processes = useMemo(() =>
    [...new Set(filtered.filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP').map(r => r.Process))].slice(0, 6),
    [filtered]
  );

  // 2. Charges by REP_5 over years (stacked bar)
  const chargesByREP5 = useMemo(() => {
    const rep5s = [...new Set(filtered.filter(r => r.Type_indicateur === 'Charges' && r.REP_5).map(r => r.REP_5!))].slice(0, 6);
    return YEARS.map(yr => {
      const point: Record<string, number | string> = { year: yr };
      for (const rep5 of rep5s) {
        const total = filtered
          .filter(r => r.Type_indicateur === 'Charges' && r.Année === yr && r.REP_5 === rep5)
          .reduce((s, r) => s + (r.Total_Cout_KEUR ?? 0), 0);
        point[rep5] = total;
      }
      return point;
    });
  }, [filtered]);

  const rep5s = useMemo(() =>
    [...new Set(filtered.filter(r => r.Type_indicateur === 'Charges' && r.REP_5).map(r => r.REP_5!))].slice(0, 6),
    [filtered]
  );

  // 3. ETP by type (Pie chart) - for reference year 2025
  const etpByType = useMemo(() => {
    const types = [
      { name: 'Interne FP', key: 'ETP_Workforce_Interne_FP', field: 'Total_ETP' as const },
      { name: 'Interne M', key: 'ETP_Workforce_Interne_M', field: 'Total_ETP' as const },
      { name: 'Externe FP', key: 'ETP_Workforce_Externe_FP', field: 'Total_ETP' as const },
      { name: 'Externe M', key: 'ETP_Workforce_Externe_M', field: 'Total_ETP' as const },
      { name: 'Besoin', key: 'ETP_Besoin_Ressources', field: 'Total_ETP' as const },
    ];
    return types.map(t => ({
      name: t.name,
      value: filtered
        .filter(r => r.Type_indicateur === t.key && r.Année === 2025)
        .reduce((s, r) => s + (r[t.field] ?? 0), 0),
    })).filter(d => d.value > 0);
  }, [filtered]);

  // 4. Expansion hub bar chart
  const expansionByHub = useMemo(() => {
    const hubMap = new Map<string, number>();
    for (const r of sources.expansion) {
      const hub = String(r['Destination hub'] ?? 'Inconnu');
      const vol = Number(r['Expected volume of activity (FTE)'] ?? 0);
      hubMap.set(hub, (hubMap.get(hub) ?? 0) + vol);
    }
    return Array.from(hubMap.entries()).map(([hub, value]) => ({ hub, value })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [sources.expansion]);

  // 5. Charges vs projections
  const chargesVsProjections = useMemo(() => {
    return YEARS.map(yr => {
      const charges = filtered.filter(r => r.Type_indicateur === 'Charges' && r.Année === yr).reduce((s, r) => s + (r.Total_Cout_KEUR ?? 0), 0);
      const isProjection = yr >= 2027;
      return { year: yr, charges: isProjection ? 0 : charges, projections: isProjection ? charges : 0, total: charges };
    });
  }, [filtered]);

  const gridColor = '#1e2d45';
  const axisColor = '#475569';

  return (
    <div>
      {/* Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center' }}>
        <label style={{ color: '#475569', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>ENTITÉ</label>
        <select value={filterEntite} onChange={e => setFilterEntite(e.target.value)}
          style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '6px 10px', fontSize: 12 }}>
          <option value="">Toutes</option>
          {entites.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(540px, 1fr))', gap: 20 }}>
        {/* 1. ETP FP par Process */}
        <div style={chartBg}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>ETP FP INTERNE PAR PROCESS</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={etpFPByProcess}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickFormatter={fmtNum} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtNum(v), '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              {processes.map((proc, i) => (
                <Line key={proc} type="monotone" dataKey={proc} stroke={COLORS[i % COLORS.length]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Charges par REP_5 */}
        <div style={chartBg}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>CHARGES PAR REP_5 (KEUR)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chargesByREP5}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickFormatter={fmtNum} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtNum(v) + ' K€', '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              {rep5s.map((rep5, i) => (
                <Bar key={rep5} dataKey={rep5} stackId="a" fill={COLORS[i % COLORS.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Répartition ETP par type */}
        <div style={chartBg}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>RÉPARTITION ETP PAR TYPE (2025)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={etpByType} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#475569' }}>
                {etpByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtNum(v) + ' ETP', '']} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Expansion par hub */}
        <div style={chartBg}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>EXPANSION — VOLUME PAR HUB DESTINATION (ETP)</h3>
          {expansionByHub.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#475569', fontSize: 13 }}>Aucune donnée d'expansion</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={expansionByHub} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" stroke={axisColor} tick={{ fontSize: 11 }} tickFormatter={fmtNum} />
                <YAxis type="category" dataKey="hub" stroke={axisColor} tick={{ fontSize: 10 }} width={80} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtNum(v) + ' ETP', '']} />
                <Bar dataKey="value" fill="#e8451a" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* 5. Charges vs Projections */}
        <div style={{ ...chartBg, gridColumn: 'span 2' }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>CHARGES RÉELLES VS PROJECTIONS (KEUR)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chargesVsProjections}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="year" stroke={axisColor} tick={{ fontSize: 11 }} />
              <YAxis stroke={axisColor} tick={{ fontSize: 11 }} tickFormatter={fmtNum} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmtNum(v) + ' K€', '']} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Bar dataKey="charges" name="Réel" fill="#3b82f6" />
              <Bar dataKey="projections" name="Projection" fill="#e8451a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
