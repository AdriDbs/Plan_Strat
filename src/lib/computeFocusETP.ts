/**
 * computeFocusETP.ts
 *
 * Calculates derived Focus ETP indicators:
 *   - ETP M  : (ETP_FP_N-1 + ETP_FP_N) / 2   (projected years)
 *   - Cout base : Cout_ETP from allData, inflated for projected years
 *   - CU    : Cout_base / ETP_M (historical) or CU_N-1 × (1+rate) (projected)
 *   - Cout total : CU_N × ETP_FP_N   (all years)
 *
 * All formulas extracted from Focus_ETP Excel ArrayFormulas.
 */

import type { ConsolidatedRecord } from '../types/data';
import type { Hypotheses } from '../types/hypotheses';
import { TAUX_CATEGORY } from './projections';

export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030] as const;

export interface FocusETPRow {
  key: string;           // `${CDR}§${Type_ETP}`
  CDR: string;
  Nom_CDR: string;
  Entité: string;
  Hub: string;
  Process: string;
  Type_ETP: string;
  etpFP: Partial<Record<number, number>>;
  etpM: Partial<Record<number, number>>;
  coutBase: Partial<Record<number, number>>;
  cu: Partial<Record<number, number>>;
  coutTotal: Partial<Record<number, number>>;
}

export interface FluxDetailRow {
  key: string;
  CDR: string;
  label: string;         // display label
  rowType: 'postes_ouverts' | 'activites' | 'total_sorties' | 'retraites' | 'effet_tps' | 'autres_mobilites' | 'total_entrees' | 'recrutements' | 'recrutements_poste_ouvert';
  values: Partial<Record<number, number>>;
}

// ─── ETP M : formule exacte Focus_ETP col R ─────────────────────
// Années projetées (N > ANNEE_REF) : ETP_M_N = (ETP_FP_N-1 + ETP_FP_N) / 2
// Années réelles   (N ≤ ANNEE_REF) : lire depuis consolidation[ETP_Workforce_Interne_M]
export function computeEtpM(
  etpFPByYear: Partial<Record<number, number>>,
  annee: number,
  anneeRef: number
): number {
  if (annee <= anneeRef) {
    return etpFPByYear[annee] ?? 0; // for historical, caller should use the M source
  }
  const fpPrev = etpFPByYear[annee - 1] ?? 0;
  const fpN    = etpFPByYear[annee]     ?? 0;
  return (fpPrev + fpN) / 2;
}

// ─── Cout base : Cout_ETP depuis allData ────────────────────────
// Années connues   (2024-2025) : somme Cout_ETP
// Années projetées (2026-2030) : Cout_base_2025 × (1+tauxInflation)^(n-2025)
export function computeCoutBase(
  coutBase2025: number,
  annee: number,
  tauxInflation: number
): number {
  if (annee <= 2025) throw new Error('Use historical Cout_ETP directly');
  let val = coutBase2025;
  for (let y = 2026; y <= annee; y++) {
    val = val * (1 + tauxInflation);
  }
  return val;
}

// ─── CU (Cout unitaire) ─────────────────────────────────────────
// 2024 : CU = Cout_base / ETP_FP  (pas d'ETP_M disponible)
// 2025 : CU = Cout_base / ETP_M
// 2026+ : CU_N = CU_N-1 × (1 + tauxChargement[cat][N])
//
// Pour le CU total (tous types confondus) :
//   CU_total_N = SUMPRODUCT(CU_type × ETP_M_type) / SUM(ETP_M_type)
export function computeCUTotal(
  cuByTypeETP: Record<string, number>,
  etpMByTypeETP: Record<string, number>
): number {
  let sumProd = 0;
  let sumETP  = 0;
  for (const [typeETP, cu] of Object.entries(cuByTypeETP)) {
    const etpM = etpMByTypeETP[typeETP] ?? 0;
    sumProd += cu * etpM;
    sumETP  += etpM;
  }
  return sumETP !== 0 ? sumProd / sumETP : 0;
}

// ─── Cout total ─────────────────────────────────────────────────
// Cout_total_N = CU_N × ETP_FP_N   (toutes années, sans exception)
export function computeCoutTotal(cuN: number, etpFPN: number): number {
  return cuN * etpFPN;
}

// ─── Main builder ────────────────────────────────────────────────
export function buildFocusETPRows(
  allData: ConsolidatedRecord[],
  hypotheses: Hypotheses
): { rows: FocusETPRow[]; fluxRows: FluxDetailRow[] } {
  const ANNEE_REF    = hypotheses.anneeReference; // 2025
  const TAUX_INFL    = hypotheses.tauxInflation ?? 0.02;

  // ── Index ETP_FP per (CDR, Type_ETP, Year) ──
  const etpFPIdx = new Map<string, number>(); // key: `cdr§typeETP§year`
  const dimMeta  = new Map<string, { CDR: string; Nom_CDR: string; Entité: string; Hub: string; Process: string }>();

  for (const r of allData) {
    if (r.Type_indicateur === 'ETP_Workforce_Interne_FP' && r.CDR && r.Type_ETP) {
      const k = `${r.CDR}§${r.Type_ETP}§${r.Année}`;
      etpFPIdx.set(k, (etpFPIdx.get(k) ?? 0) + (r.Total_ETP ?? 0));
      const dimKey = `${r.CDR}§${r.Type_ETP}`;
      if (!dimMeta.has(dimKey)) {
        dimMeta.set(dimKey, {
          CDR:      r.CDR,
          Nom_CDR:  r.Nom_CDR ?? '',
          Entité:   r.Entité,
          Hub:      r.Hub,
          Process:  r.Process,
        });
      }
    }
  }

  // ── Index ETP_M per (CDR, Type_ETP, Year) ──
  const etpMIdx = new Map<string, number>();
  for (const r of allData) {
    if (r.Type_indicateur === 'ETP_Workforce_Interne_M' && r.CDR && r.Type_ETP) {
      const k = `${r.CDR}§${r.Type_ETP}§${r.Année}`;
      etpMIdx.set(k, (etpMIdx.get(k) ?? 0) + (r.Total_ETP ?? 0));
    }
  }

  // ── Index Cout_ETP per CDR per Year ──
  const coutETPIdx = new Map<string, number>(); // key: `cdr§year`
  for (const r of allData) {
    if (r.Type_indicateur === 'Cout_ETP' && r.CDR) {
      const k = `${r.CDR}§${r.Année}`;
      coutETPIdx.set(k, (coutETPIdx.get(k) ?? 0) + (r.Total_Cout_KEUR ?? 0));
    }
  }

  // ── Index ETP_Besoin_Ressources (postes ouverts, 2024) per CDR ──
  const postesOuvertsIdx = new Map<string, number>(); // key: `cdr§year`
  for (const r of allData) {
    if (r.Type_indicateur === 'ETP_Besoin_Ressources' && r.CDR) {
      const k = `${r.CDR}§${r.Année}`;
      postesOuvertsIdx.set(k, (postesOuvertsIdx.get(k) ?? 0) + (r.Total_ETP ?? 0));
    }
  }

  // ── Index ETP_flux per (CDR, Type_ETP, Type_mouvement, Year) ──
  // Positive movements: Recrutements, Recrutements - dont sur poste ouvert
  // Negative movements: Retraites hors effet TPS, Effet TPS, Autres mobilités
  const fluxIdx = new Map<string, number>(); // key: `cdr§typeETP§typeMvt§year`
  for (const r of allData) {
    if (r.Type_indicateur === 'ETP_flux' && r.CDR && r.Type_ETP && r.Type_mouvement) {
      const k = `${r.CDR}§${r.Type_ETP}§${r.Type_mouvement}§${r.Année}`;
      fluxIdx.set(k, (fluxIdx.get(k) ?? 0) + (r.Total_ETP ?? 0));
    }
  }

  // ── Build rows per (CDR, Type_ETP) ──
  const dimKeys = new Set<string>();
  for (const [k] of dimMeta) dimKeys.add(k);

  const rows: FocusETPRow[] = [];

  for (const dimKey of dimKeys) {
    const [cdr, typeETP] = dimKey.split('§');
    const meta = dimMeta.get(dimKey)!;
    const cat  = TAUX_CATEGORY[typeETP] ?? 'France';

    const etpFP: Partial<Record<number, number>> = {};
    const etpM:  Partial<Record<number, number>> = {};
    const coutBase: Partial<Record<number, number>> = {};
    const cu: Partial<Record<number, number>> = {};
    const coutTotal: Partial<Record<number, number>> = {};

    // ETP_FP
    for (const yr of YEARS) {
      const v = etpFPIdx.get(`${cdr}§${typeETP}§${yr}`);
      if (v != null) etpFP[yr] = v;
    }

    // ETP_M : from allData for all years (projections.ts already computed midpoint)
    for (const yr of YEARS) {
      const v = etpMIdx.get(`${cdr}§${typeETP}§${yr}`);
      if (v != null) etpM[yr] = v;
    }

    // Cout base : CDR-level cost (spread equally if multiple types; shown per type row)
    // The cost at CDR level is divided by the number of distinct Type_ETP in that CDR
    // but only for France-category types (Alcyone covers internal/France staff only).
    // For external types (Nearshoring, Offshoring, Outsourcing), coutBase = 0.
    const isFranceCat = cat === 'France';
    if (isFranceCat) {
      // Get Cout_ETP for this CDR
      for (const yr of YEARS) {
        const v = coutETPIdx.get(`${cdr}§${yr}`);
        if (v != null) coutBase[yr] = v;
      }
      // Fill in projected years from ANNEE_REF if missing
      const base2025 = coutBase[ANNEE_REF];
      if (base2025 != null) {
        for (const yr of YEARS) {
          if (yr > ANNEE_REF && coutBase[yr] == null) {
            let val = base2025;
            for (let y = ANNEE_REF + 1; y <= yr; y++) {
              val = val * (1 + TAUX_INFL);
            }
            coutBase[yr] = val;
          }
        }
      }
    }

    // CU historical
    // 2024: CU = Cout_base / ETP_FP
    if (coutBase[2024] != null && etpFP[2024] && etpFP[2024] !== 0) {
      cu[2024] = coutBase[2024]! / etpFP[2024]!;
    }
    // 2025: CU = Cout_base / ETP_M
    if (coutBase[2025] != null && etpM[2025] && etpM[2025] !== 0) {
      cu[2025] = coutBase[2025]! / etpM[2025]!;
    }

    // CU projected: CU_N = CU_N-1 × (1 + tauxChargement[cat][N])
    let cuPrev = cu[2025] ?? cu[2024];
    if (cuPrev != null) {
      for (const yr of [2026, 2027, 2028, 2029, 2030] as const) {
        const tauxCat = hypotheses.tauxChargement[cat as keyof typeof hypotheses.tauxChargement];
        const taux    = tauxCat ? (tauxCat[yr] ?? TAUX_INFL) : TAUX_INFL;
        cuPrev = cuPrev * (1 + taux);
        cu[yr] = cuPrev;
      }
    }

    // Cout total = CU × ETP_FP (all years)
    for (const yr of YEARS) {
      if (cu[yr] != null && etpFP[yr] != null) {
        coutTotal[yr] = cu[yr]! * etpFP[yr]!;
      }
    }

    rows.push({
      key: dimKey,
      CDR: meta.CDR,
      Nom_CDR: meta.Nom_CDR,
      Entité: meta.Entité,
      Hub: meta.Hub,
      Process: meta.Process,
      Type_ETP: typeETP,
      etpFP,
      etpM,
      coutBase,
      cu,
      coutTotal,
    });
  }

  rows.sort((a, b) =>
    a.Entité.localeCompare(b.Entité) ||
    a.Hub.localeCompare(b.Hub) ||
    a.CDR.localeCompare(b.CDR) ||
    a.Type_ETP.localeCompare(b.Type_ETP)
  );

  // ── Build flux detail rows per CDR ──
  const FLUX_MOVEMENTS = [
    'Retraites hors effet TPS',
    'Effet TPS',
    'Autres mobilités',
    'Recrutements',
    'Recrutements - dont sur poste ouvert',
  ] as const;

  // Collect unique CDRs with CDI flux data
  const fluxCDRs = new Set<string>();
  for (const r of allData) {
    if (r.Type_indicateur === 'ETP_flux' && r.CDR && r.Type_ETP === 'CDI') {
      fluxCDRs.add(r.CDR);
    }
  }

  const fluxRows: FluxDetailRow[] = [];
  for (const cdr of fluxCDRs) {
    // Postes ouverts (2024 only)
    const postesValues: Partial<Record<number, number>> = {};
    const postes2024 = postesOuvertsIdx.get(`${cdr}§2024`);
    if (postes2024 != null) postesValues[2024] = postes2024;
    fluxRows.push({ key: `${cdr}§postes_ouverts`, CDR: cdr, label: 'CDI postes ouverts fin d\'année', rowType: 'postes_ouverts', values: postesValues });

    // Activités = CDI_FP_N + CDD_FP_N + postes_ouverts
    const activitesValues: Partial<Record<number, number>> = {};
    for (const yr of YEARS) {
      const cdi = etpFPIdx.get(`${cdr}§CDI§${yr}`) ?? 0;
      const cdd = etpFPIdx.get(`${cdr}§CDD§${yr}`) ?? 0;
      const pos = postesOuvertsIdx.get(`${cdr}§${yr}`) ?? 0;
      if (cdi !== 0 || cdd !== 0 || pos !== 0) {
        activitesValues[yr] = cdi + cdd + pos;
      }
    }
    fluxRows.push({ key: `${cdr}§activites`, CDR: cdr, label: 'Activités', rowType: 'activites', values: activitesValues });

    // Individual flux movements
    for (const mvt of FLUX_MOVEMENTS) {
      const vals: Partial<Record<number, number>> = {};
      for (const yr of YEARS) {
        const v = fluxIdx.get(`${cdr}§CDI§${mvt}§${yr}`);
        if (v != null) vals[yr] = v;
      }
      const rowType = mvt === 'Retraites hors effet TPS'                  ? 'retraites'
                    : mvt === 'Effet TPS'                                  ? 'effet_tps'
                    : mvt === 'Autres mobilités'                           ? 'autres_mobilites'
                    : mvt === 'Recrutements'                               ? 'recrutements'
                    : 'recrutements_poste_ouvert';
      fluxRows.push({ key: `${cdr}§${rowType}`, CDR: cdr, label: mvt, rowType, values: vals });
    }

    // Total sorties CDI = sum of negative movements
    const totalSortiesValues: Partial<Record<number, number>> = {};
    for (const yr of YEARS) {
      let total = 0;
      for (const mvt of ['Retraites hors effet TPS', 'Effet TPS', 'Autres mobilités'] as const) {
        total += fluxIdx.get(`${cdr}§CDI§${mvt}§${yr}`) ?? 0;
      }
      if (total !== 0) totalSortiesValues[yr] = total;
    }
    fluxRows.push({ key: `${cdr}§total_sorties`, CDR: cdr, label: 'Total sorties CDI', rowType: 'total_sorties', values: totalSortiesValues });

    // Total entrées CDI = sum of positive movements
    const totalEntreesValues: Partial<Record<number, number>> = {};
    for (const yr of YEARS) {
      const v = fluxIdx.get(`${cdr}§CDI§Recrutements§${yr}`) ?? 0;
      if (v !== 0) totalEntreesValues[yr] = v;
    }
    fluxRows.push({ key: `${cdr}§total_entrees`, CDR: cdr, label: 'Total entrées CDI', rowType: 'total_entrees', values: totalEntreesValues });
  }

  return { rows, fluxRows };
}
