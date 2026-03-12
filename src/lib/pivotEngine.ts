import type { ConsolidatedRecord } from '../types/data';

export interface PivotCell {
  value: number | null;
}

export interface PivotEntry {
  key: string;
  dimensions: Record<string, string>;
  Type_indicateur: string;
  yearValues: Map<number, number>;
  isSubtotal?: boolean;
  level: number;
  label: string;
}

export interface PivotOptions {
  groupBy: string[];
  indicateurs: string[];
  years: number[];
  filters?: Record<string, string[]>;
}

export function buildPivot(
  records: ConsolidatedRecord[],
  options: PivotOptions
): PivotEntry[] {
  const { groupBy, indicateurs, years, filters } = options;

  // Apply filters
  let filtered = records;
  if (filters) {
    for (const [field, values] of Object.entries(filters)) {
      if (values.length > 0) {
        filtered = filtered.filter(r => {
          const val = r[field as keyof ConsolidatedRecord];
          return values.includes(String(val ?? ''));
        });
      }
    }
  }

  // Filter by indicateurs
  filtered = filtered.filter(r => indicateurs.includes(r.Type_indicateur));

  // Build aggregation
  const aggMap = new Map<string, PivotEntry>();

  for (const r of filtered) {
    for (const indicateur of indicateurs) {
      if (r.Type_indicateur !== indicateur) continue;

      const dims: Record<string, string> = {};
      for (const g of groupBy) {
        dims[g] = String(r[g as keyof ConsolidatedRecord] ?? '');
      }
      dims['Type_indicateur'] = indicateur;

      const key = groupBy.map(g => dims[g]).join('§') + '§' + indicateur;

      if (!aggMap.has(key)) {
        aggMap.set(key, {
          key,
          dimensions: dims,
          Type_indicateur: indicateur,
          yearValues: new Map(),
          level: groupBy.length,
          label: dims[groupBy[groupBy.length - 1]] ?? '',
        });
      }

      const entry = aggMap.get(key)!;
      if (years.includes(r.Année)) {
        const existing = entry.yearValues.get(r.Année) ?? 0;
        const val = indicateur.includes('ETP') ? (r.Total_ETP ?? 0) : (r.Total_Cout_KEUR ?? 0);
        entry.yearValues.set(r.Année, existing + val);
      }
    }
  }

  return Array.from(aggMap.values());
}

export function getUniqueValues(records: ConsolidatedRecord[], field: keyof ConsolidatedRecord): string[] {
  const set = new Set<string>();
  for (const r of records) {
    const v = r[field];
    if (v != null && v !== '') set.add(String(v));
  }
  return Array.from(set).sort();
}
