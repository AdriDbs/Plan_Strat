import type { ConsolidatedRecord } from '../types/data';
import type { Hypotheses } from '../types/hypotheses';

const ANNEES_PROJ = [2026, 2027, 2028, 2029, 2030] as const;

// Mapping Type_ETP → taux category key in hypotheses.tauxChargement
export const TAUX_CATEGORY: Record<string, string> = {
  'CDI':                             'France',
  'CDD':                             'France',
  'Interim':                         'France',
  'Nearshoring PL':                  'Pologne',
  'Nearshoring Autres':              'Nearshoring Autre',
  'Nearshoring other':               'Nearshoring Autre',
  'Offshoring':                      'Offshoring',
  'Outsourcing Accenture':           'Outsourcing',
  'Outsourcing Autres':              'Outsourcing',
  'Subcontracting - FTE equivalent': 'Outsourcing',
};

export function buildProjections(
  consolidation: ConsolidatedRecord[],
  etpExterneSource: ConsolidatedRecord[], // ETP_Externe 2027-2030 (from raw sources, pre-filtered)
  hypotheses: Hypotheses
): ConsolidatedRecord[] {
  const ANNEE_REF = hypotheses.anneeReference; // 2025
  const TAUX_MOBILITE = hypotheses.tauxMobilite; // 0.03
  const TAUX_INFLATION = hypotheses.tauxInflation ?? 0.02;

  const results: ConsolidatedRecord[] = [];

  // ═══════════════════════════════════════════════════════════════
  // PARTIE A : ETP_Workforce_Interne_FP (flux-based projection)
  //
  // Formule :
  //   2026 : ETP_N = ETP_ANNEE_REF + flux[CDR][Type_ETP][2026]
  //   2027+ : si flux ≠ 0 → ETP_N = ETP_N-1 + flux
  //           sinon        → ETP_N = ETP_N-1 × (1 - tauxMobilite)
  // ═══════════════════════════════════════════════════════════════

  // Index 1 : flux aggregé par (CDR, Type_ETP, Année)
  const fluxIdx = new Map<string, number>();
  for (const r of consolidation) {
    if (
      r.Type_indicateur === 'ETP_flux' &&
      r.CDR && r.Type_ETP && r.Année
    ) {
      const k = `${r.CDR}§${r.Type_ETP}§${r.Année}`;
      fluxIdx.set(k, (fluxIdx.get(k) ?? 0) + (r.Total_ETP ?? 0));
    }
  }

  // Index 2 : ETP_Workforce_Interne_FP réel par (CDR, Type_ETP, Année)
  type FPEntry = { record: ConsolidatedRecord; total: number };
  const interneFPIdx = new Map<string, FPEntry[]>();
  for (const r of consolidation) {
    if (r.Type_indicateur === 'ETP_Workforce_Interne_FP' && r.CDR && r.Type_ETP) {
      const k = `${r.CDR}§${r.Type_ETP}§${r.Année}`;
      if (!interneFPIdx.has(k)) interneFPIdx.set(k, []);
      interneFPIdx.get(k)!.push({ record: r, total: r.Total_ETP ?? 0 });
    }
  }

  // Accumulateur de valeurs projetées (pour chaîner N-1 → N)
  const projectedFP = new Map<string, number>();

  // Collecter les dimensions (CDR, Type_ETP) ayant des données à ANNEE_REF
  const cdrsAndTypes = new Set<string>();
  for (const [k] of interneFPIdx) {
    const parts = k.split('§');
    if (Number(parts[2]) === ANNEE_REF) {
      cdrsAndTypes.add(`${parts[0]}§${parts[1]}`);
    }
  }

  // Initialiser avec les valeurs réelles de ANNEE_REF
  for (const dimKey of cdrsAndTypes) {
    const [cdr, typeETP] = dimKey.split('§');
    const entries = interneFPIdx.get(`${cdr}§${typeETP}§${ANNEE_REF}`) ?? [];
    const totalRef = entries.reduce((s, e) => s + e.total, 0);
    projectedFP.set(`${dimKey}§${ANNEE_REF}`, totalRef);
  }

  // Projeter année par année
  for (const annee of ANNEES_PROJ) {
    for (const dimKey of cdrsAndTypes) {
      const [cdr, typeETP] = dimKey.split('§');

      const prevKey = `${dimKey}§${annee - 1}`;
      const etpPrev = projectedFP.get(prevKey) ?? 0;

      const fluxKey = `${cdr}§${typeETP}§${annee}`;
      const flux = fluxIdx.get(fluxKey) ?? 0;

      let etpN: number;
      if (annee === ANNEE_REF + 1) {
        // 2026 : valeur réelle 2025 + flux 2026 (fourni dans Source_Flux)
        etpN = etpPrev + flux;
      } else {
        // 2027+ : flux planifiés ou attrition naturelle
        if (flux !== 0) {
          etpN = etpPrev + flux;
        } else {
          etpN = etpPrev * (1 - TAUX_MOBILITE);
        }
      }

      projectedFP.set(`${dimKey}§${annee}`, etpN);

      // Récupérer les métadonnées depuis le premier enregistrement de référence
      const refEntries = interneFPIdx.get(`${cdr}§${typeETP}§${ANNEE_REF}`) ?? [];
      if (refEntries.length === 0) continue;
      const ref = refEntries[0].record;

      results.push({
        ...ref,
        Type_indicateur: 'ETP_Workforce_Interne_FP',
        Année: annee,
        Total_ETP: etpN,
        Total_Cout_KEUR: null,
        Projet: null,
        REP: null,
        Account: null,
      });
    }
  }

  // ETP_Workforce_Interne_M projeté = (ETP_FP_N-1 + ETP_FP_N) / 2
  for (const annee of ANNEES_PROJ) {
    for (const dimKey of cdrsAndTypes) {
      const [cdr, typeETP] = dimKey.split('§');
      const fpPrev = projectedFP.get(`${dimKey}§${annee - 1}`) ?? 0;
      const fpN = projectedFP.get(`${dimKey}§${annee}`) ?? 0;
      const etpM = (fpPrev + fpN) / 2;

      const refEntries = interneFPIdx.get(`${cdr}§${typeETP}§${ANNEE_REF}`) ?? [];
      if (refEntries.length === 0) continue;
      const ref = refEntries[0].record;

      results.push({
        ...ref,
        Type_indicateur: 'ETP_Workforce_Interne_M',
        Année: annee,
        Total_ETP: etpM,
        Total_Cout_KEUR: null,
        Projet: null,
        REP: null,
        Account: null,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PARTIE B : ETP_Workforce_Externe_FP (2027-2030)
  // Source_ETP_Externe contient directement les valeurs estimées
  // ═══════════════════════════════════════════════════════════════
  for (const r of etpExterneSource) {
    if (r.Année >= 2027 && r.Année <= 2030) {
      results.push({
        ...r,
        Type_indicateur: r.Type_indicateur || 'ETP_Workforce_Externe_FP',
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PARTIE C : Charges (projection 2027-2030 depuis base 2026)
  //
  // Formule :
  //   Charges_2027 = Charges_2026 × (1 + tauxInflation)
  //   Charges_N    = Charges_N-1   × (1 + tauxInflation)
  //
  // Note : ANNEE_REF = 2025, base = ANNEE_REF+1 = 2026
  // ═══════════════════════════════════════════════════════════════
  type ChargesEntry = { record: ConsolidatedRecord; total: number };
  const charges2026Idx = new Map<string, ChargesEntry>();

  for (const r of consolidation) {
    if (r.Type_indicateur === 'Charges' && r.Année === ANNEE_REF + 1) {
      const k = `${r.CDR}§${r.Projet ?? ''}§${r.REP ?? ''}§${r.Account ?? ''}`;
      const existing = charges2026Idx.get(k);
      charges2026Idx.set(k, {
        record: r,
        total: (existing?.total ?? 0) + (r.Total_Cout_KEUR ?? 0),
      });
    }
  }

  const projectedCharges = new Map<string, number>();
  for (const [k, entry] of charges2026Idx) {
    projectedCharges.set(`${k}§${ANNEE_REF + 1}`, entry.total);
  }

  for (const annee of [2027, 2028, 2029, 2030] as const) {
    for (const [baseKey, entry] of charges2026Idx) {
      const prevKey = `${baseKey}§${annee - 1}`;
      const prevValue = projectedCharges.get(prevKey) ?? 0;
      const newValue = prevValue * (1 + TAUX_INFLATION);
      projectedCharges.set(`${baseKey}§${annee}`, newValue);

      results.push({
        ...entry.record,
        Année: annee,
        Total_ETP: null,
        Total_Cout_KEUR: newValue,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // Cout_ETP projection (2026-2030 depuis base ANNEE_REF)
  // Utilisé par computeFocusETP pour Cout base, CU, Cout total
  // ═══════════════════════════════════════════════════════════════
  type CoutEntry = { record: ConsolidatedRecord; total: number };
  const cout2025Idx = new Map<string, CoutEntry>();

  for (const r of consolidation) {
    if (r.Type_indicateur === 'Cout_ETP' && r.Année === ANNEE_REF) {
      const k = r.CDR;
      const existing = cout2025Idx.get(k);
      cout2025Idx.set(k, {
        record: r,
        total: (existing?.total ?? 0) + (r.Total_Cout_KEUR ?? 0),
      });
    }
  }

  const projectedCout = new Map<string, number>();
  for (const [k, entry] of cout2025Idx) {
    projectedCout.set(`${k}§${ANNEE_REF}`, entry.total);
  }

  for (const annee of ANNEES_PROJ) {
    for (const [baseKey, entry] of cout2025Idx) {
      const prevKey = `${baseKey}§${annee - 1}`;
      const prevValue = projectedCout.get(prevKey) ?? 0;
      const newValue = prevValue * (1 + TAUX_INFLATION);
      projectedCout.set(`${baseKey}§${annee}`, newValue);

      results.push({
        ...entry.record,
        Type_indicateur: 'Cout_ETP',
        Année: annee,
        Total_ETP: null,
        Total_Cout_KEUR: newValue,
      });
    }
  }

  return results;
}
