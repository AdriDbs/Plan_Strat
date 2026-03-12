import * as XLSX from 'xlsx';
import type { SourceKey } from '../types/data';

export const SOURCE_REQUIRED_COLUMNS: Record<SourceKey, string[]> = {
  budget_collector_charges: ['Projet', 'Année', 'Account', 'CDR', 'Process', 'Total_Cout_KEUR', 'REP', 'Type_indicateur', 'Entité', 'Hub'],
  budget_collector_fte_fp: ['Code_ETP', 'Projet', 'CDR', 'Process', 'Type_ETP', 'Account', 'Année', 'Total_ETP', 'Total_Cout_KEUR', 'Type_indicateur', 'Entité', 'Hub'],
  budget_collector_fte_m: ['Code_ETP', 'Projet', 'CDR', 'Process', 'Type_ETP', 'Account', 'Année', 'Total_ETP', 'Total_Cout_KEUR', 'Type_indicateur', 'Entité', 'Hub'],
  alcyone_etp_fp: ['Code_ETP', 'CDR', 'Année', 'Total_ETP', 'Entité', 'Hub', 'Process', 'Type_indicateur', 'Type_ETP'],
  alcyone_cout_etp: ['Entité', 'CDR', 'Année', 'Total_Cout_KEUR', 'Hub', 'Process', 'Type_indicateur'],
  alcyone_etp_moyen: ['Code_ETP', 'CDR', 'Année', 'Total_ETP', 'Type_indicateur', 'Entité', 'Hub', 'Process', 'Type_ETP'],
  expansion: ['ID', 'Destination E2E Process', 'Activity', 'Expected transfer date', 'Expected volume of activity (FTE)', 'Transfer status', 'Nature of movement', 'Destination hub', 'Expected permanent contracts to be transferred (Headcounts)', 'Destination team'],
  etp_externe: ['CDR', 'Projet', 'Code_ETP', 'Type_ETP', 'Account', 'Année', 'Total_ETP', 'Total_Cout_KEUR', 'Entité', 'Hub', 'Process', 'Type_indicateur'],
  besoin_ressources: ['CDR', 'Total_ETP', 'Entité', 'Hub', 'Process', 'Année', 'Type_indicateur'],
  charges_additionnelles: ['Entité', 'CDR', 'REP', 'Account', 'Année', 'Total_Cout_KEUR', 'Hub', 'Process', 'Type_indicateur'],
  flux: ['CDR', 'Code_ETP', 'Type_ETP', 'Type_mouvement', 'Année', 'Total_ETP', 'Entité', 'Hub', 'Process', 'Type_indicateur'],
};

export interface ParseResult {
  success: boolean;
  data?: Record<string, unknown>[];
  error?: string;
  rowCount?: number;
}

export async function parseExcelFile(file: File, sourceKey: SourceKey): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        let rows: Record<string, unknown>[];

        if (sourceKey === 'flux') {
          // Flux: header at row 3, skip first 2 rows
          const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
          if (rawRows.length < 3) {
            resolve({ success: false, error: 'Le fichier flux doit avoir au moins 3 lignes.' });
            return;
          }
          const headers = rawRows[2] as string[];
          rows = [];
          for (let i = 3; i < rawRows.length; i++) {
            const rowArr = rawRows[i] as unknown[];
            const rowObj: Record<string, unknown> = {};
            headers.forEach((h, idx) => {
              rowObj[h] = rowArr[idx];
            });
            rows.push(rowObj);
          }
        } else {
          rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
        }

        // Validate required columns
        const requiredCols = SOURCE_REQUIRED_COLUMNS[sourceKey];
        if (rows.length === 0) {
          resolve({ success: false, error: 'Le fichier est vide.' });
          return;
        }
        const actualCols = Object.keys(rows[0]);
        const missingCols = requiredCols.filter(c => !actualCols.includes(c));
        if (missingCols.length > 0) {
          resolve({
            success: false,
            error: `Colonnes manquantes : ${missingCols.join(', ')}`,
          });
          return;
        }

        resolve({ success: true, data: rows, rowCount: rows.length });
      } catch (err) {
        resolve({ success: false, error: `Erreur de parsing : ${String(err)}` });
      }
    };
    reader.onerror = () => resolve({ success: false, error: 'Erreur de lecture du fichier.' });
    reader.readAsArrayBuffer(file);
  });
}

export async function parseReferentielFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
        resolve({ success: true, data: rows, rowCount: rows.length });
      } catch (err) {
        resolve({ success: false, error: `Erreur de parsing : ${String(err)}` });
      }
    };
    reader.onerror = () => resolve({ success: false, error: 'Erreur de lecture du fichier.' });
    reader.readAsArrayBuffer(file);
  });
}
