import React, { useMemo, useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { useDataStore } from '../store/useDataStore';
import { useParametresStore } from '../store/useParametresStore';
import { useReferentielsStore } from '../store/useReferentielsStore';
import { ExportButton } from '../components/ui/ExportButton';
import * as XLSX from 'xlsx';

const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030];
const fmt = (n: number | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

interface TreeNode {
  key: string;
  label: string;
  sublabel?: string;
  level: number;
  values: Record<number, number>;
  children: TreeNode[];
}

export const CompteResultat: React.FC = () => {
  const { allData } = useDataStore();
  const { parametres } = useParametresStore();
  const { referentiels } = useReferentielsStore();
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const chargesData = useMemo(() => allData.filter(r => r.Type_indicateur === 'Charges'), [allData]);

  // Build REP hierarchy from referentiels
  const repHierarchy = useMemo(() => {
    const accMap = new Map<string, { REP_5: string; Lib_REP_5: string; REP_4: string; Lib_REP_4: string; REP: string; Lib_REP: string }>();
    for (const a of referentiels.accounts) {
      accMap.set(a.REP, { REP_5: a.REP_5, Lib_REP_5: a.Lib_REP_5, REP_4: a.REP_4, Lib_REP_4: a.Lib_REP_4, REP: a.REP, Lib_REP: a.Lib_REP });
    }

    // Aggregate charges by REP and year
    const repValues = new Map<string, Record<number, number>>();
    const repMeta = new Map<string, { REP_5: string; Lib_REP_5: string; REP_4: string; Lib_REP_4: string; Lib_REP: string }>();

    for (const r of chargesData) {
      const rep = r.REP ?? '';
      if (!rep) continue;
      if (!repValues.has(rep)) repValues.set(rep, {});
      const m = repValues.get(rep)!;
      m[r.Année] = (m[r.Année] ?? 0) + (r.Total_Cout_KEUR ?? 0);
      if (!repMeta.has(rep)) {
        const info = accMap.get(rep);
        if (info) repMeta.set(rep, info);
        else {
          const fromData = { REP_5: r.REP_5 ?? '', Lib_REP_5: r.Lib_REP_5 ?? '', REP_4: r.REP_4 ?? '', Lib_REP_4: r.Lib_REP_4 ?? '', Lib_REP: r.Lib_REP ?? '' };
          repMeta.set(rep, fromData);
        }
      }
    }

    // Build tree: REP_5 > REP_4 > REP
    const rep5Map = new Map<string, { label: string; rep4Map: Map<string, { label: string; reps: string[] }> }>();

    for (const [rep, meta] of repMeta) {
      const rep5 = meta.REP_5 || 'AUTRE';
      const rep4 = meta.REP_4 || 'AUTRE';
      const lib5 = meta.Lib_REP_5 || rep5;
      const lib4 = meta.Lib_REP_4 || rep4;

      if (!rep5Map.has(rep5)) rep5Map.set(rep5, { label: lib5, rep4Map: new Map() });
      const rep5node = rep5Map.get(rep5)!;
      if (!rep5node.rep4Map.has(rep4)) rep5node.rep4Map.set(rep4, { label: lib4, reps: [] });
      rep5node.rep4Map.get(rep4)!.reps.push(rep);
    }

    const tree: TreeNode[] = [];
    for (const [rep5, { label: lib5, rep4Map }] of rep5Map) {
      const rep5Node: TreeNode = {
        key: rep5, label: rep5, sublabel: lib5, level: 0, values: {}, children: [],
      };
      for (const [rep4, { label: lib4, reps }] of rep4Map) {
        const rep4Node: TreeNode = {
          key: `${rep5}|${rep4}`, label: rep4, sublabel: lib4, level: 1, values: {}, children: [],
        };
        for (const rep of reps) {
          const meta2 = repMeta.get(rep)!;
          const repNode: TreeNode = {
            key: `${rep5}|${rep4}|${rep}`, label: rep, sublabel: meta2.Lib_REP, level: 2, values: repValues.get(rep) ?? {}, children: [],
          };
          // Accumulate up
          for (const [yr, val] of Object.entries(repNode.values)) {
            rep4Node.values[Number(yr)] = (rep4Node.values[Number(yr)] ?? 0) + val;
            rep5Node.values[Number(yr)] = (rep5Node.values[Number(yr)] ?? 0) + val;
          }
          rep4Node.children.push(repNode);
        }
        rep5Node.children.push(rep4Node);
      }
      tree.push(rep5Node);
    }
    return tree.sort((a, b) => {
      const i1 = parametres.repsCompteResultat.indexOf(a.label);
      const i2 = parametres.repsCompteResultat.indexOf(b.label);
      return (i1 === -1 ? 999 : i1) - (i2 === -1 ? 999 : i2);
    });
  }, [chargesData, referentiels.accounts, parametres.repsCompteResultat]);

  const toggleExpand = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      result.push(node);
      if (expandedKeys.has(node.key)) {
        result.push(...flattenTree(node.children));
      }
    }
    return result;
  };

  const flatRows = useMemo(() => flattenTree(repHierarchy), [repHierarchy, expandedKeys]);

  const handleExport = () => {
    const allRows = flattenTree(repHierarchy).map(r => {
      const row: Record<string, unknown> = { Code: r.label, Intitulé: r.sublabel, Niveau: r.level };
      YEARS.forEach(y => { row[String(y)] = r.values[y] ?? ''; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(allRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CompteResultat');
    XLSX.writeFile(wb, 'compte_resultat.xlsx');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <ExportButton onClick={handleExport} disabled={repHierarchy.length === 0} />
      </div>
      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto', maxHeight: '70vh' }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 0, width: '100%', fontSize: 12, minWidth: 'max-content' }}>
          <thead>
            <tr>
              <th style={{ background: '#111827', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, position: 'sticky', top: 0, zIndex: 20, minWidth: 200 }}>Code / Intitulé</th>
              {YEARS.map(y => (
                <th key={y} style={{ background: '#111820', color: '#e8451a', padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #1e2d45', fontFamily: 'DM Mono, monospace', fontSize: 10, position: 'sticky', top: 0, zIndex: 20, whiteSpace: 'nowrap' }}>{y}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flatRows.map((row) => {
              const hasChildren = row.children.length > 0;
              const isExpanded = expandedKeys.has(row.key);
              return (
                <tr key={row.key} style={{
                  background: row.level === 0 ? 'rgba(232,69,26,0.08)' : row.level === 1 ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}>
                  <td
                    style={{
                      padding: '7px 12px',
                      borderBottom: '1px solid rgba(30,45,69,0.5)',
                      paddingLeft: 12 + row.level * 20,
                      cursor: hasChildren ? 'pointer' : undefined,
                    }}
                    onClick={() => hasChildren && toggleExpand(row.key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {hasChildren ? (
                        isExpanded ? <ChevronDown size={12} style={{ color: '#94a3b8', flexShrink: 0 }} /> : <ChevronRight size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
                      ) : <span style={{ width: 12, flexShrink: 0 }} />}
                      <span style={{ color: row.level === 0 ? '#e8451a' : row.level === 1 ? '#f1f5f9' : '#94a3b8', fontWeight: row.level < 2 ? 600 : 400, fontFamily: row.level < 2 ? 'DM Mono, monospace' : undefined }}>
                        {row.label}
                      </span>
                      {row.sublabel && row.sublabel !== row.label && (
                        <span style={{ color: '#475569', fontSize: 11 }}>{row.sublabel}</span>
                      )}
                    </div>
                  </td>
                  {YEARS.map(y => {
                    const val = row.values[y];
                    const isNeg = (val ?? 0) < 0;
                    return (
                      <td key={y} style={{
                        padding: '7px 12px',
                        borderBottom: '1px solid rgba(30,45,69,0.5)',
                        textAlign: 'right',
                        fontVariantNumeric: 'tabular-nums',
                        color: isNeg ? '#ef4444' : '#f1f5f9',
                        fontWeight: row.level < 2 ? 600 : 400,
                        background: 'rgba(232,69,26,0.03)',
                      }}>
                        {fmt(val)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
        {repHierarchy.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune donnée de charges</div>
        )}
      </div>
    </div>
  );
};
