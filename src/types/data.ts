export interface ConsolidatedRecord {
  Type_indicateur: string;
  Entité: string;
  Hub: string;
  Process: string;
  CDR: string;
  Projet: string | null;
  REP: string | null;
  Account: number | null;
  Type_ETP: string | null;
  Code_ETP: string | null;
  Type_mouvement: string | null;
  Année: number;
  Total_ETP: number | null;
  Total_Cout_KEUR: number | null;
  // Champs enrichis
  Nom_CDR?: string;
  Nom_Entité?: string;
  Nom_Hub?: string;
  Nom_Process?: string;
  Lib_REP?: string;
  REP_4?: string;
  REP_5?: string;
  Lib_REP_5?: string;
  Lib_REP_4?: string;
  Nom_FTE?: string;
  Nom_Projet?: string;
  Nature?: string;
}

export interface ModificationRecord {
  id: string;
  Type_indicateur: string;
  Entité: string;
  Hub: string;
  Process: string;
  CDR: string;
  Projet: string | null;
  REP: string | null;
  Account: number | null;
  Type_ETP: string | null;
  Code_ETP: string | null;
  Type_mouvement: string | null;
  Année: number;
  Total_ETP: number | null;
  Total_Cout_KEUR: number | null;
  Nouveau_Total_ETP: number | null;
  Nouveau_Total_Cout_KEUR: number | null;
}

// Source types
export interface BudgetCollectorChargesRecord {
  Projet?: string;
  Année: number;
  Account?: number;
  CDR: string;
  Process: string;
  Total_Cout_KEUR?: number;
  REP?: string;
  Type_indicateur?: string;
  Entité: string;
  Hub: string;
  [key: string]: unknown;
}

export interface BudgetCollectorFTERecord {
  Code_ETP?: string;
  Projet?: string;
  CDR: string;
  Process: string;
  Type_ETP?: string;
  Account?: number;
  Année: number;
  Total_ETP?: number;
  Total_Cout_KEUR?: number;
  Type_indicateur?: string;
  Entité: string;
  Hub: string;
  [key: string]: unknown;
}

export interface AlcyoneETPFPRecord {
  Code_ETP?: string;
  CDR: string;
  Année: number;
  Total_ETP?: number;
  Entité: string;
  Hub: string;
  Process: string;
  Type_indicateur?: string;
  Type_ETP?: string;
  [key: string]: unknown;
}

export interface AlcyoneCoutETPRecord {
  Entité: string;
  CDR: string;
  Année: number;
  Total_Cout_KEUR?: number;
  Hub: string;
  Process: string;
  Type_indicateur?: string;
  [key: string]: unknown;
}

export interface AlcyoneETPMoyenRecord {
  Code_ETP?: string;
  CDR: string;
  Année: number;
  Total_ETP?: number;
  Type_indicateur?: string;
  Entité: string;
  Hub: string;
  Process: string;
  Type_ETP?: string;
  [key: string]: unknown;
}

export interface ExpansionRecord {
  ID?: string | number;
  'Destination E2E Process'?: string;
  Activity?: string;
  'Expected transfer date'?: string;
  'Expected volume of activity (FTE)'?: number;
  'Transfer status'?: string;
  'Nature of movement'?: string;
  'Destination hub'?: string;
  'Expected permanent contracts to be transferred (Headcounts)'?: number;
  'Destination team'?: string;
  [key: string]: unknown;
}

export interface ETPExterneRecord {
  CDR: string;
  Projet?: string;
  Code_ETP?: string;
  Type_ETP?: string;
  Account?: number;
  Année: number;
  Total_ETP?: number;
  Total_Cout_KEUR?: number;
  Entité: string;
  Hub: string;
  Process: string;
  Type_indicateur?: string;
  [key: string]: unknown;
}

export interface BesoinRessourcesRecord {
  CDR: string;
  Total_ETP?: number;
  Entité: string;
  Hub: string;
  Process: string;
  Année: number;
  Type_indicateur?: string;
  [key: string]: unknown;
}

export interface ChargesAdditionnellesRecord {
  Entité: string;
  CDR: string;
  REP?: string;
  Account?: number;
  Année: number;
  Total_Cout_KEUR?: number;
  Hub: string;
  Process: string;
  Type_indicateur?: string;
  [key: string]: unknown;
}

export interface FluxRecord {
  CDR: string;
  Code_ETP?: string;
  Type_ETP?: string;
  Type_mouvement?: string;
  Année: number;
  Total_ETP?: number;
  Entité: string;
  Hub: string;
  Process: string;
  Type_indicateur?: string;
  [key: string]: unknown;
}

// Referentiel types
export interface AccountRef {
  REP_5: string;
  Lib_REP_5: string;
  REP_4: string;
  Lib_REP_4: string;
  REP: string;
  Lib_REP: string;
  ACCOUNT_GSP: number;
  Cpte_Conso?: string;
  CodeR?: string;
  CodeR_DESC?: string;
}

export interface FTERef {
  Type_FTE: string;
  Nom_FTE: string;
  Account: number;
}

export interface ProjetRef {
  Code_Projet: string;
  Nom_Projet: string;
  CDR: string;
  Entité: string;
  Supplier: string;
  Nature: string;
}

export interface OrganisationRef {
  CDR: string;
  Nom_CDR: string;
  Entité: string;
  Nom_Entité: string;
  Hub: string;
  Nom_Hub: string;
  Process: string;
  Nom_Process: string;
}

export type SourceKey =
  | 'budget_collector_charges'
  | 'budget_collector_fte_fp'
  | 'budget_collector_fte_m'
  | 'alcyone_etp_fp'
  | 'alcyone_cout_etp'
  | 'alcyone_etp_moyen'
  | 'expansion'
  | 'etp_externe'
  | 'besoin_ressources'
  | 'charges_additionnelles'
  | 'flux';

export interface SourceMetadata {
  lastUpdated: string;
  rowCount: number;
}

export interface SourcesState {
  budget_collector_charges: BudgetCollectorChargesRecord[];
  budget_collector_fte_fp: BudgetCollectorFTERecord[];
  budget_collector_fte_m: BudgetCollectorFTERecord[];
  alcyone_etp_fp: AlcyoneETPFPRecord[];
  alcyone_cout_etp: AlcyoneCoutETPRecord[];
  alcyone_etp_moyen: AlcyoneETPMoyenRecord[];
  expansion: ExpansionRecord[];
  etp_externe: ETPExterneRecord[];
  besoin_ressources: BesoinRessourcesRecord[];
  charges_additionnelles: ChargesAdditionnellesRecord[];
  flux: FluxRecord[];
}

export interface ReferentielsState {
  accounts: AccountRef[];
  fte: FTERef[];
  projet: ProjetRef[];
  organisation: OrganisationRef[];
}

export interface PivotRow {
  key: string;
  label: string;
  level: number;
  Type_indicateur: string;
  values: { [year: number]: number | null };
  isSubtotal?: boolean;
  isExpanded?: boolean;
  children?: PivotRow[];
}
