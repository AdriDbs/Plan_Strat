import * as XLSX from 'xlsx';
import type { ConsolidatedRecord, ModificationRecord } from '../types/data';

export function exportToExcel(data: Record<string, unknown>[], filename: string, sheetName = 'Data'): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

export function exportConsolidation(records: ConsolidatedRecord[], filename = 'consolidation.xlsx'): void {
  const data = records.map(r => ({
    Type_indicateur: r.Type_indicateur,
    Entité: r.Entité,
    Hub: r.Hub,
    Process: r.Process,
    CDR: r.CDR,
    Nom_CDR: r.Nom_CDR ?? '',
    Projet: r.Projet ?? '',
    REP: r.REP ?? '',
    Account: r.Account ?? '',
    Type_ETP: r.Type_ETP ?? '',
    Code_ETP: r.Code_ETP ?? '',
    Type_mouvement: r.Type_mouvement ?? '',
    Année: r.Année,
    Total_ETP: r.Total_ETP ?? '',
    Total_Cout_KEUR: r.Total_Cout_KEUR ?? '',
  }));
  exportToExcel(data, filename, 'Consolidation');
}

export function exportModifications(records: ModificationRecord[], filename = 'modifications.xlsx'): void {
  const data = records.map(r => ({
    Type_indicateur: r.Type_indicateur,
    Entité: r.Entité,
    Hub: r.Hub,
    Process: r.Process,
    CDR: r.CDR,
    Projet: r.Projet ?? '',
    REP: r.REP ?? '',
    Account: r.Account ?? '',
    Type_ETP: r.Type_ETP ?? '',
    Code_ETP: r.Code_ETP ?? '',
    Type_mouvement: r.Type_mouvement ?? '',
    Année: r.Année,
    Total_ETP: r.Total_ETP ?? '',
    Total_Cout_KEUR: r.Total_Cout_KEUR ?? '',
    Nouveau_Total_ETP: r.Nouveau_Total_ETP ?? '',
    Nouveau_Total_Cout_KEUR: r.Nouveau_Total_Cout_KEUR ?? '',
  }));
  exportToExcel(data, filename, 'Modifications');
}

export function exportSynthese(
  rows: Array<{
    CDR: string;
    Nom_CDR: string;
    Indicateur: string;
    values: Record<number, number | null>;
  }>,
  years: number[],
  filename = 'synthese.xlsx'
): void {
  const data = rows.map(r => {
    const row: Record<string, unknown> = {
      CDR: r.CDR,
      Nom_CDR: r.Nom_CDR,
      Indicateur: r.Indicateur,
    };
    for (const yr of years) {
      row[String(yr)] = r.values[yr] ?? '';
    }
    return row;
  });
  exportToExcel(data, filename, 'Synthese');
}
