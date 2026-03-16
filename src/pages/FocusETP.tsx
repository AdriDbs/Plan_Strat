import React, { useMemo, useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useDataStore } from '../store/useDataStore';
import { useHypothesesStore } from '../store/useHypothesesStore';
import { ExportButton } from '../components/ui/ExportButton';
import { getUniqueValues } from '../lib/pivotEngine';
import { buildFocusETPRows, YEARS } from '../lib/computeFocusETP';
import type { FocusETPRow, FluxDetailRow } from '../lib/computeFocusETP';
import * as XLSX from 'xlsx';

// ─── Formatters ───────────────────────────────────────────────────
const fmtETP = (n: number | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

const fmtKEUR = (n: number | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtCU = (n: number | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─── Sticky left column offsets (px) ────────────────────────────
const LEFT_CDR      = 0;
const LEFT_NOM_CDR  = 110;
const LEFT_TYPE_ETP = 270;
const COL_WIDTHS    = { cdr: 110, nomCdr: 160, typeETP: 150 } as const;

// ─── Row type union for virtualizer ─────────────────────────────
type VRow =
  | { kind: 'etp';  data: FocusETPRow }
  | { kind: 'flux'; data: FluxDetailRow };

// ─── Theme helpers ───────────────────────────────────────────────
const TH_BASE: React.CSSProperties = {
  background: '#111827',
  color: '#94a3b8',
  padding: '6px 8px',
  textAlign: 'left',
  borderBottom: '1px solid #1e2d45',
  fontFamily: 'DM Mono, monospace',
  fontSize: 10,
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 20,
};
const TH_YEAR: React.CSSProperties = {
  ...TH_BASE,
  background: '#111820',
  color: '#e8451a',
  textAlign: 'right',
};
const TH_FREEZE = (left: number, width: number, row = 0): React.CSSProperties => ({
  ...TH_BASE,
  left,
  width,
  minWidth: width,
  zIndex: 30,
  top: row === 0 ? 0 : 32, // row 0 or row 1 of double header
  backgroundColor: '#111827',
});
const TH_GROUP = (color: string): React.CSSProperties => ({
  ...TH_BASE,
  color,
  textAlign: 'center',
  borderLeft: '1px solid #1e2d45',
  fontWeight: 600,
  fontSize: 11,
});

const TD_FREEZE = (left: number, width: number): React.CSSProperties => ({
  position: 'sticky',
  left,
  width,
  minWidth: width,
  zIndex: 10,
  backgroundColor: '#0f1929',
  padding: '5px 8px',
  borderBottom: '1px solid rgba(30,45,69,0.4)',
  whiteSpace: 'nowrap',
  fontSize: 12,
});

const tdNum = (neg?: boolean): React.CSSProperties => ({
  padding: '5px 8px',
  borderBottom: '1px solid rgba(30,45,69,0.4)',
  color: neg ? '#ef4444' : '#f1f5f9',
  textAlign: 'right',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 12,
});

// ─── Group color accents ─────────────────────────────────────────
const GROUP_COLORS = {
  etpFP:      '#e8451a',
  etpM:       '#94a3b8',
  coutBase:   '#60a5fa',
  cu:         '#a78bfa',
  coutTotal:  '#34d399',
} as const;

export const FocusETP: React.FC = () => {
  const { allData } = useDataStore();
  const { hypotheses } = useHypothesesStore();
  const [filterEntite, setFilterEntite] = useState<string[]>([]);
  const [filterHub,    setFilterHub]    = useState<string[]>([]);
  const [filterProcess,setFilterProcess]= useState<string[]>([]);
  const [showFlux,     setShowFlux]     = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // ── Compute all Focus ETP rows ──
  const { rows: allRows, fluxRows: allFluxRows } = useMemo(
    () => buildFocusETPRows(allData, hypotheses),
    [allData, hypotheses]
  );

  // ── Filter options ──
  const entites  = useMemo(() => getUniqueValues(allData.filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP'), 'Entité'), [allData]);
  const hubs     = useMemo(() => getUniqueValues(allData.filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP'), 'Hub'),    [allData]);
  const processes= useMemo(() => getUniqueValues(allData.filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP'), 'Process'),[allData]);

  // ── Apply filters ──
  const etpRows = useMemo(() => allRows.filter(r =>
    (filterEntite.length  === 0 || filterEntite.includes(r.Entité))  &&
    (filterHub.length     === 0 || filterHub.includes(r.Hub))        &&
    (filterProcess.length === 0 || filterProcess.includes(r.Process))
  ), [allRows, filterEntite, filterHub, filterProcess]);

  const fluxRows = useMemo(() => allFluxRows.filter(r =>
    etpRows.some(e => e.CDR === r.CDR)
  ), [allFluxRows, etpRows]);

  // ── Build virtual rows ──
  const vRows: VRow[] = useMemo(() => {
    const list: VRow[] = etpRows.map(data => ({ kind: 'etp', data } as VRow));
    if (showFlux) {
      for (const data of fluxRows) list.push({ kind: 'flux', data });
    }
    return list;
  }, [etpRows, fluxRows, showFlux]);

  // ── Virtualizer ──
  const virtualizer = useVirtualizer({
    count: vRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 34,
    overscan: 20,
  });
  const virtualItems = virtualizer.getVirtualItems();
  const totalSize    = virtualizer.getTotalSize();
  const paddingTop    = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - (virtualItems[virtualItems.length - 1]?.end ?? 0) : 0;

  // ── Export ──
  const handleExport = () => {
    const exportData = etpRows.map(r => {
      const row: Record<string, unknown> = { CDR: r.CDR, Nom_CDR: r.Nom_CDR, Type_ETP: r.Type_ETP };
      YEARS.forEach(y => {
        row[`FP_${y}`]    = r.etpFP[y]     ?? '';
        row[`M_${y}`]     = r.etpM[y]      ?? '';
        row[`CB_${y}`]    = r.coutBase[y]  ?? '';
        row[`CU_${y}`]    = r.cu[y]        ?? '';
        row[`CT_${y}`]    = r.coutTotal[y] ?? '';
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FocusETP');
    XLSX.writeFile(wb, 'focus_etp.xlsx');
  };

  // ── Render ──
  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {[
          { label: 'ENTITÉ',   vals: entites,   sel: filterEntite,   set: setFilterEntite   },
          { label: 'HUB',      vals: hubs,      sel: filterHub,      set: setFilterHub      },
          { label: 'PROCESS',  vals: processes, sel: filterProcess,  set: setFilterProcess  },
        ].map(f => (
          <div key={f.label}>
            <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace', display: 'block', marginBottom: 4 }}>{f.label}</label>
            <select multiple value={f.sel} onChange={e => f.set(Array.from(e.target.selectedOptions).map(o => o.value))}
              style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 4, color: '#f1f5f9', padding: '4px 8px', fontSize: 12, maxHeight: 80, minWidth: 120 }}>
              {f.vals.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <label style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }}>
            <input type="checkbox" checked={showFlux} onChange={e => setShowFlux(e.target.checked)}
              style={{ marginRight: 6, accentColor: '#e8451a' }} />
            Afficher flux CDI
          </label>
        </div>
        <ExportButton onClick={handleExport} disabled={etpRows.length === 0} />
      </div>

      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'hidden' }}>
        {/* Unified scrollable container — sticky header works via borderCollapse: separate */}
        <div ref={parentRef} style={{ height: 620, overflowY: 'auto', overflowX: 'auto', background: '#0f1929' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 'max-content', fontSize: 12 }}>
            <thead>
              {/* Row 1 — group headers */}
              <tr>
                <th style={TH_FREEZE(LEFT_CDR,     COL_WIDTHS.cdr,    0)} rowSpan={2}>CDR</th>
                <th style={TH_FREEZE(LEFT_NOM_CDR,  COL_WIDTHS.nomCdr, 0)} rowSpan={2}>Nom CDR</th>
                <th style={TH_FREEZE(LEFT_TYPE_ETP, COL_WIDTHS.typeETP,0)} rowSpan={2}>Type ETP</th>
                <th colSpan={YEARS.length} style={{ ...TH_GROUP(GROUP_COLORS.etpFP),    borderLeft: '2px solid #1e2d45' }}>ETP FP</th>
                <th colSpan={YEARS.length} style={{ ...TH_GROUP(GROUP_COLORS.etpM),     borderLeft: '2px solid #1e2d45' }}>ETP M</th>
                <th colSpan={YEARS.length} style={{ ...TH_GROUP(GROUP_COLORS.coutBase), borderLeft: '2px solid #1e2d45' }}>Coût base (K€)</th>
                <th colSpan={YEARS.length} style={{ ...TH_GROUP(GROUP_COLORS.cu),       borderLeft: '2px solid #1e2d45' }}>CU (K€/ETP)</th>
                <th colSpan={YEARS.length} style={{ ...TH_GROUP(GROUP_COLORS.coutTotal),borderLeft: '2px solid #1e2d45' }}>Coût total (K€)</th>
              </tr>
              {/* Row 2 — year sub-headers */}
              <tr>
                {/* ETP FP years */}
                {YEARS.map((y, i) => (
                  <th key={`fp${y}`} style={{ ...TH_YEAR, top: 32, borderLeft: i === 0 ? '2px solid #1e2d45' : undefined, color: GROUP_COLORS.etpFP }}>{y}</th>
                ))}
                {/* ETP M years */}
                {YEARS.map((y, i) => (
                  <th key={`m${y}`} style={{ ...TH_YEAR, top: 32, borderLeft: i === 0 ? '2px solid #1e2d45' : undefined, color: GROUP_COLORS.etpM }}>{y}</th>
                ))}
                {/* Cout base years */}
                {YEARS.map((y, i) => (
                  <th key={`cb${y}`} style={{ ...TH_YEAR, top: 32, borderLeft: i === 0 ? '2px solid #1e2d45' : undefined, color: GROUP_COLORS.coutBase }}>{y}</th>
                ))}
                {/* CU years */}
                {YEARS.map((y, i) => (
                  <th key={`cu${y}`} style={{ ...TH_YEAR, top: 32, borderLeft: i === 0 ? '2px solid #1e2d45' : undefined, color: GROUP_COLORS.cu }}>{y}</th>
                ))}
                {/* Cout total years */}
                {YEARS.map((y, i) => (
                  <th key={`ct${y}`} style={{ ...TH_YEAR, top: 32, borderLeft: i === 0 ? '2px solid #1e2d45' : undefined, color: GROUP_COLORS.coutTotal }}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paddingTop > 0 && <tr><td style={{ height: paddingTop }} colSpan={3 + YEARS.length * 5} /></tr>}
              {virtualItems.map(vi => {
                const vrow = vRows[vi.index];
                const isEven = vi.index % 2 === 0;
                const rowBg = isEven ? 'transparent' : 'rgba(255,255,255,0.012)';

                if (vrow.kind === 'etp') {
                  const r = vrow.data;
                  return (
                    <tr key={r.key} style={{ background: rowBg }}>
                      {/* Sticky left columns */}
                      <td style={{ ...TD_FREEZE(LEFT_CDR, COL_WIDTHS.cdr), color: '#f1f5f9' }}>{r.CDR}</td>
                      <td style={{ ...TD_FREEZE(LEFT_NOM_CDR, COL_WIDTHS.nomCdr), color: '#94a3b8' }}>{r.Nom_CDR || '—'}</td>
                      <td style={{ ...TD_FREEZE(LEFT_TYPE_ETP, COL_WIDTHS.typeETP), color: '#e8451a', fontSize: 11 }}>{r.Type_ETP}</td>
                      {/* ETP FP */}
                      {YEARS.map((y, i) => (
                        <td key={`fp${y}`} style={{ ...tdNum(), borderLeft: i === 0 ? '2px solid rgba(232,69,26,0.3)' : undefined, background: 'rgba(232,69,26,0.03)' }}>
                          {fmtETP(r.etpFP[y])}
                        </td>
                      ))}
                      {/* ETP M */}
                      {YEARS.map((y, i) => (
                        <td key={`m${y}`} style={{ ...tdNum(), color: '#94a3b8', borderLeft: i === 0 ? '2px solid rgba(148,163,184,0.2)' : undefined, background: 'rgba(148,163,184,0.02)' }}>
                          {fmtETP(r.etpM[y])}
                        </td>
                      ))}
                      {/* Cout base */}
                      {YEARS.map((y, i) => (
                        <td key={`cb${y}`} style={{ ...tdNum((r.coutBase[y] ?? 0) < 0), borderLeft: i === 0 ? '2px solid rgba(96,165,250,0.2)' : undefined, background: 'rgba(96,165,250,0.03)' }}>
                          {fmtKEUR(r.coutBase[y])}
                        </td>
                      ))}
                      {/* CU */}
                      {YEARS.map((y, i) => (
                        <td key={`cu${y}`} style={{ ...tdNum((r.cu[y] ?? 0) < 0), borderLeft: i === 0 ? '2px solid rgba(167,139,250,0.2)' : undefined, background: 'rgba(167,139,250,0.03)' }}>
                          {fmtCU(r.cu[y])}
                        </td>
                      ))}
                      {/* Cout total */}
                      {YEARS.map((y, i) => (
                        <td key={`ct${y}`} style={{ ...tdNum((r.coutTotal[y] ?? 0) < 0), borderLeft: i === 0 ? '2px solid rgba(52,211,153,0.2)' : undefined, background: 'rgba(52,211,153,0.03)' }}>
                          {fmtKEUR(r.coutTotal[y])}
                        </td>
                      ))}
                    </tr>
                  );
                }

                // Flux row
                const f = vrow.data;
                const isTotal = f.rowType === 'total_sorties' || f.rowType === 'total_entrees';
                const isHeader = f.rowType === 'postes_ouverts' || f.rowType === 'activites';
                const fluxColor = isTotal ? '#f1f5f9' : isHeader ? '#e8451a' : '#94a3b8';
                return (
                  <tr key={f.key} style={{ background: isTotal ? 'rgba(255,255,255,0.04)' : rowBg }}>
                    <td style={{ ...TD_FREEZE(LEFT_CDR, COL_WIDTHS.cdr), color: '#475569', fontSize: 11 }}>{f.CDR}</td>
                    <td colSpan={2} style={{ ...TD_FREEZE(LEFT_NOM_CDR, COL_WIDTHS.nomCdr + COL_WIDTHS.typeETP), color: fluxColor, fontStyle: 'italic', fontSize: 11, fontWeight: isTotal ? 600 : 400 }}>
                      {f.label}
                    </td>
                    {/* Show flux values under ETP FP columns; remaining groups are blank */}
                    {YEARS.map((y, i) => (
                      <td key={`fv${y}`} style={{ ...tdNum((f.values[y] ?? 0) < 0), borderLeft: i === 0 ? '2px solid rgba(232,69,26,0.3)' : undefined, background: 'rgba(232,69,26,0.02)', fontWeight: isTotal ? 600 : 400, fontSize: 11 }}>
                        {f.values[y] != null ? fmtETP(f.values[y]) : ''}
                      </td>
                    ))}
                    {/* Blank cells for ETP M, Cout base, CU, Cout total */}
                    {Array.from({ length: YEARS.length * 4 }).map((_, i) => (
                      <td key={`blank${i}`} style={{ borderBottom: '1px solid rgba(30,45,69,0.4)' }} />
                    ))}
                  </tr>
                );
              })}
              {paddingBottom > 0 && <tr><td style={{ height: paddingBottom }} colSpan={3 + YEARS.length * 5} /></tr>}
            </tbody>
          </table>
          {vRows.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>
              Aucune donnée — chargez les sources Alcyone
            </div>
          )}
        </div>
        <div style={{ background: '#111827', borderTop: '1px solid #1e2d45', padding: '6px 12px', color: '#475569', fontSize: 11, display: 'flex', gap: 16 }}>
          <span>{etpRows.length.toLocaleString('fr-FR')} lignes ETP</span>
          {showFlux && <span>{fluxRows.length.toLocaleString('fr-FR')} lignes flux</span>}
        </div>
      </div>
    </div>
  );
};
