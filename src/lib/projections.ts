import type { ConsolidatedRecord } from '../types/data';
import type { Hypotheses } from '../types/hypotheses';

const PROJECTION_YEARS = [2027, 2028, 2029, 2030] as const;

export function buildProjections(
  consolidation: ConsolidatedRecord[],
  hypotheses: Hypotheses
): ConsolidatedRecord[] {
  const projections: ConsolidatedRecord[] = [];

  // Get max year in consolidation data as base
  const maxYear = consolidation.reduce((max, r) => Math.max(max, r.Année), 2026);

  // Build aggregation maps by dimension key
  // For charges: aggregate by REP + dimension key
  const chargesMap = new Map<string, Map<number, number>>();
  const etpFPMap = new Map<string, Map<number, number>>();
  const etpMMap = new Map<string, Map<number, number>>();
  const coutETPMap = new Map<string, Map<number, number>>();
  const etpExterneMap = new Map<string, Map<number, number>>();

  function getDimKey(r: ConsolidatedRecord): string {
    return [r.Entité, r.Hub, r.Process, r.CDR, r.Projet ?? '', r.REP ?? '', r.Account ?? '', r.Type_ETP ?? '', r.Code_ETP ?? ''].join('|');
  }

  for (const r of consolidation) {
    const key = getDimKey(r);
    if (r.Type_indicateur === 'Charges') {
      if (!chargesMap.has(key)) chargesMap.set(key, new Map());
      const m = chargesMap.get(key)!;
      m.set(r.Année, (m.get(r.Année) ?? 0) + (r.Total_Cout_KEUR ?? 0));
    } else if (r.Type_indicateur === 'ETP_Workforce_Interne_FP') {
      if (!etpFPMap.has(key)) etpFPMap.set(key, new Map());
      const m = etpFPMap.get(key)!;
      m.set(r.Année, (m.get(r.Année) ?? 0) + (r.Total_ETP ?? 0));
    } else if (r.Type_indicateur === 'ETP_Workforce_Interne_M') {
      if (!etpMMap.has(key)) etpMMap.set(key, new Map());
      const m = etpMMap.get(key)!;
      m.set(r.Année, (m.get(r.Année) ?? 0) + (r.Total_ETP ?? 0));
    } else if (r.Type_indicateur === 'Cout_ETP') {
      if (!coutETPMap.has(key)) coutETPMap.set(key, new Map());
      const m = coutETPMap.get(key)!;
      m.set(r.Année, (m.get(r.Année) ?? 0) + (r.Total_Cout_KEUR ?? 0));
    } else if (r.Type_indicateur.startsWith('ETP_Workforce_Externe')) {
      if (!etpExterneMap.has(key)) etpExterneMap.set(key, new Map());
      const m = etpExterneMap.get(key)!;
      m.set(r.Année, (m.get(r.Année) ?? 0) + (r.Total_ETP ?? 0));
    }
  }

  // Create unique dimension records for projection
  const uniqueDims = new Map<string, ConsolidatedRecord>();
  for (const r of consolidation) {
    const key = getDimKey(r);
    if (!uniqueDims.has(key)) uniqueDims.set(key, r);
  }

  // Project charges
  for (const [key, yearMap] of chargesMap) {
    const baseRec = uniqueDims.get(key)!;
    let prevValue = yearMap.get(maxYear) ?? yearMap.get(maxYear - 1) ?? 0;
    for (const yr of PROJECTION_YEARS) {
      if (yr <= maxYear) continue;
      const rep = baseRec.REP ?? '';
      const tauxMap = hypotheses.tauxEvolutionCharges[rep];
      const taux = tauxMap?.[yr] ?? 0;
      const value = prevValue * (1 + taux);
      projections.push({
        ...baseRec,
        Année: yr,
        Total_Cout_KEUR: value,
        Total_ETP: null,
      });
      prevValue = value;
    }
  }

  // Project ETP FP (internal)
  for (const [key, yearMap] of etpFPMap) {
    const baseRec = uniqueDims.get(key)!;
    let prevValue = yearMap.get(maxYear) ?? yearMap.get(maxYear - 1) ?? 0;
    for (const yr of PROJECTION_YEARS) {
      if (yr <= maxYear) continue;
      const value = prevValue * (1 - hypotheses.tauxMobilite);
      projections.push({
        ...baseRec,
        Type_indicateur: 'ETP_Workforce_Interne_FP',
        Année: yr,
        Total_ETP: value,
        Total_Cout_KEUR: null,
      });
      prevValue = value;
    }
  }

  // Project ETP M (internal)
  for (const [key, yearMap] of etpMMap) {
    const baseRec = uniqueDims.get(key)!;
    let prevValue = yearMap.get(maxYear) ?? yearMap.get(maxYear - 1) ?? 0;
    for (const yr of PROJECTION_YEARS) {
      if (yr <= maxYear) continue;
      // CU evolves by tauxChargement
      const isPologne = baseRec.Entité?.toLowerCase().includes('pol') || baseRec.Hub?.toLowerCase().includes('pl');
      const catKey = isPologne ? 'Pologne' : 'France';
      const taux = hypotheses.tauxChargement[catKey][yr as keyof typeof hypotheses.tauxChargement.France] ?? 0.02;
      const value = prevValue * (1 + taux);
      projections.push({
        ...baseRec,
        Type_indicateur: 'ETP_Workforce_Interne_M',
        Année: yr,
        Total_ETP: value,
        Total_Cout_KEUR: null,
      });
      prevValue = value;
    }
  }

  // Project Cout ETP
  for (const [key, yearMap] of coutETPMap) {
    const baseRec = uniqueDims.get(key)!;
    let prevValue = yearMap.get(maxYear) ?? yearMap.get(maxYear - 1) ?? 0;
    for (const yr of PROJECTION_YEARS) {
      if (yr <= maxYear) continue;
      const isPologne = baseRec.Entité?.toLowerCase().includes('pol');
      const catKey = isPologne ? 'Pologne' : 'France';
      const taux = hypotheses.tauxChargement[catKey][yr as keyof typeof hypotheses.tauxChargement.France] ?? 0.02;
      const value = prevValue * (1 + taux);
      projections.push({
        ...baseRec,
        Type_indicateur: 'Cout_ETP',
        Année: yr,
        Total_Cout_KEUR: value,
        Total_ETP: null,
      });
      prevValue = value;
    }
  }

  // Project ETP externe (reconduire sans évolution)
  for (const [key, yearMap] of etpExterneMap) {
    const baseRec = uniqueDims.get(key)!;
    const lastValue = yearMap.get(maxYear) ?? yearMap.get(maxYear - 1) ?? 0;
    for (const yr of PROJECTION_YEARS) {
      if (yr <= maxYear) continue;
      projections.push({
        ...baseRec,
        Année: yr,
        Total_ETP: lastValue,
        Total_Cout_KEUR: null,
      });
    }
  }

  return projections;
}
