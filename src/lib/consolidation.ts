import type { ConsolidatedRecord, SourcesState, ReferentielsState, ModificationRecord } from '../types/data';

export function buildConsolidation(
  sources: SourcesState,
  modifications: ModificationRecord[],
  referentiels: ReferentielsState
): ConsolidatedRecord[] {
  const records: ConsolidatedRecord[] = [];

  // Build lookup maps for performance
  const orgMap = new Map<string, typeof referentiels.organisation[0]>();
  for (const org of referentiels.organisation) {
    orgMap.set(org.CDR, org);
  }

  const accountMap = new Map<number, typeof referentiels.accounts[0]>();
  for (const acc of referentiels.accounts) {
    if (acc.ACCOUNT_GSP != null) accountMap.set(acc.ACCOUNT_GSP, acc);
  }

  const fteMap = new Map<string, typeof referentiels.fte[0]>();
  for (const fte of referentiels.fte) {
    fteMap.set(fte.Type_FTE, fte);
  }

  const projetMap = new Map<string, typeof referentiels.projet[0]>();
  for (const proj of referentiels.projet) {
    projetMap.set(proj.Code_Projet, proj);
  }

  function enrich(rec: ConsolidatedRecord): ConsolidatedRecord {
    const org = orgMap.get(rec.CDR);
    if (org) {
      rec.Nom_CDR = org.Nom_CDR;
      if (!rec.Nom_Entité) rec.Nom_Entité = org.Nom_Entité;
      if (!rec.Nom_Hub) rec.Nom_Hub = org.Nom_Hub;
      if (!rec.Nom_Process) rec.Nom_Process = org.Nom_Process;
    }
    if (rec.Account != null) {
      const accRef = accountMap.get(rec.Account);
      if (accRef) {
        rec.REP_5 = accRef.REP_5;
        rec.Lib_REP_5 = accRef.Lib_REP_5;
        rec.REP_4 = accRef.REP_4;
        rec.Lib_REP_4 = accRef.Lib_REP_4;
        rec.Lib_REP = accRef.Lib_REP;
      }
    }
    if (rec.Code_ETP) {
      const fteRef = fteMap.get(rec.Code_ETP);
      if (fteRef) rec.Nom_FTE = fteRef.Nom_FTE;
    }
    if (rec.Projet) {
      const projRef = projetMap.get(rec.Projet);
      if (projRef) {
        rec.Nom_Projet = projRef.Nom_Projet;
        rec.Nature = projRef.Nature;
      }
    }
    return rec;
  }

  // budget_collector_charges → Charges
  for (const row of sources.budget_collector_charges) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'Charges',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: row.Projet != null ? String(row.Projet) : null,
      REP: row.REP != null ? String(row.REP) : null,
      Account: row.Account != null ? Number(row.Account) : null,
      Type_ETP: null,
      Code_ETP: null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: null,
      Total_Cout_KEUR: row.Total_Cout_KEUR != null ? Number(row.Total_Cout_KEUR) : null,
    };
    records.push(enrich(rec));
  }

  // budget_collector_fte_fp → ETP_Workforce_Externe_FP
  for (const row of sources.budget_collector_fte_fp) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'ETP_Workforce_Externe_FP',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: row.Projet != null ? String(row.Projet) : null,
      REP: null,
      Account: row.Account != null ? Number(row.Account) : null,
      Type_ETP: row.Type_ETP != null ? String(row.Type_ETP) : null,
      Code_ETP: row.Code_ETP != null ? String(row.Code_ETP) : null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: row.Total_Cout_KEUR != null ? Number(row.Total_Cout_KEUR) : null,
    };
    records.push(enrich(rec));
  }

  // budget_collector_fte_m → ETP_Workforce_Externe_M
  for (const row of sources.budget_collector_fte_m) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'ETP_Workforce_Externe_M',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: row.Projet != null ? String(row.Projet) : null,
      REP: null,
      Account: row.Account != null ? Number(row.Account) : null,
      Type_ETP: row.Type_ETP != null ? String(row.Type_ETP) : null,
      Code_ETP: row.Code_ETP != null ? String(row.Code_ETP) : null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: row.Total_Cout_KEUR != null ? Number(row.Total_Cout_KEUR) : null,
    };
    records.push(enrich(rec));
  }

  // alcyone_etp_fp → ETP_Workforce_Interne_FP
  for (const row of sources.alcyone_etp_fp) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'ETP_Workforce_Interne_FP',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: null,
      REP: null,
      Account: null,
      Type_ETP: row.Type_ETP != null ? String(row.Type_ETP) : null,
      Code_ETP: row.Code_ETP != null ? String(row.Code_ETP) : null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: null,
    };
    records.push(enrich(rec));
  }

  // alcyone_cout_etp → Cout_ETP
  for (const row of sources.alcyone_cout_etp) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'Cout_ETP',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: null,
      REP: null,
      Account: null,
      Type_ETP: null,
      Code_ETP: null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: null,
      Total_Cout_KEUR: row.Total_Cout_KEUR != null ? Number(row.Total_Cout_KEUR) : null,
    };
    records.push(enrich(rec));
  }

  // alcyone_etp_moyen → ETP_Workforce_Interne_M
  for (const row of sources.alcyone_etp_moyen) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'ETP_Workforce_Interne_M',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: null,
      REP: null,
      Account: null,
      Type_ETP: row.Type_ETP != null ? String(row.Type_ETP) : null,
      Code_ETP: row.Code_ETP != null ? String(row.Code_ETP) : null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: null,
    };
    records.push(enrich(rec));
  }

  // etp_externe → conserver le Type_indicateur de la ligne source
  // Only historical (≤2026); projected years (≥2027) are passed separately to buildProjections
  for (const row of sources.etp_externe) {
    if (Number(row.Année) > 2026) continue;
    const rec: ConsolidatedRecord = {
      Type_indicateur: row.Type_indicateur != null ? String(row.Type_indicateur) : 'ETP_Externe',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: row.Projet != null ? String(row.Projet) : null,
      REP: null,
      Account: row.Account != null ? Number(row.Account) : null,
      Type_ETP: row.Type_ETP != null ? String(row.Type_ETP) : null,
      Code_ETP: row.Code_ETP != null ? String(row.Code_ETP) : null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: row.Total_Cout_KEUR != null ? Number(row.Total_Cout_KEUR) : null,
    };
    records.push(enrich(rec));
  }

  // besoin_ressources → ETP_Besoin_Ressources
  for (const row of sources.besoin_ressources) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'ETP_Besoin_Ressources',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: null,
      REP: null,
      Account: null,
      Type_ETP: null,
      Code_ETP: null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: null,
    };
    records.push(enrich(rec));
  }

  // charges_additionnelles → Charges
  for (const row of sources.charges_additionnelles) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'Charges',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: null,
      REP: row.REP != null ? String(row.REP) : null,
      Account: row.Account != null ? Number(row.Account) : null,
      Type_ETP: null,
      Code_ETP: null,
      Type_mouvement: null,
      Année: Number(row.Année),
      Total_ETP: null,
      Total_Cout_KEUR: row.Total_Cout_KEUR != null ? Number(row.Total_Cout_KEUR) : null,
    };
    records.push(enrich(rec));
  }

  // flux → ETP_flux
  for (const row of sources.flux) {
    const rec: ConsolidatedRecord = {
      Type_indicateur: 'ETP_flux',
      Entité: String(row.Entité ?? ''),
      Hub: String(row.Hub ?? ''),
      Process: String(row.Process ?? ''),
      CDR: String(row.CDR ?? ''),
      Projet: null,
      REP: null,
      Account: null,
      Type_ETP: row.Type_ETP != null ? String(row.Type_ETP) : null,
      Code_ETP: row.Code_ETP != null ? String(row.Code_ETP) : null,
      Type_mouvement: row.Type_mouvement != null ? String(row.Type_mouvement) : null,
      Année: Number(row.Année),
      Total_ETP: row.Total_ETP != null ? Number(row.Total_ETP) : null,
      Total_Cout_KEUR: null,
    };
    records.push(enrich(rec));
  }

  // Apply modifications
  if (modifications.length > 0) {
    for (let i = 0; i < records.length; i++) {
      const r = records[i];
      const mod = modifications.find(m =>
        m.Type_indicateur === r.Type_indicateur &&
        m.Entité === r.Entité &&
        m.Hub === r.Hub &&
        m.Process === r.Process &&
        m.CDR === r.CDR &&
        (m.Projet ?? null) === (r.Projet ?? null) &&
        (m.REP ?? null) === (r.REP ?? null) &&
        (m.Account ?? null) === (r.Account ?? null) &&
        (m.Type_ETP ?? null) === (r.Type_ETP ?? null) &&
        (m.Code_ETP ?? null) === (r.Code_ETP ?? null) &&
        (m.Type_mouvement ?? null) === (r.Type_mouvement ?? null) &&
        m.Année === r.Année
      );
      if (mod) {
        if (mod.Nouveau_Total_ETP != null) records[i] = { ...r, Total_ETP: mod.Nouveau_Total_ETP };
        if (mod.Nouveau_Total_Cout_KEUR != null) records[i] = { ...records[i], Total_Cout_KEUR: mod.Nouveau_Total_Cout_KEUR };
      }
    }
  }

  return records;
}
