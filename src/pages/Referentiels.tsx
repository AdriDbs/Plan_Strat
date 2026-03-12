import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useReferentielsStore } from '../store/useReferentielsStore';
import { ExportButton } from '../components/ui/ExportButton';
import { parseReferentielFile } from '../lib/excelParser';
import { exportToExcel } from '../lib/excelExporter';
import type { AccountRef, FTERef, ProjetRef, OrganisationRef } from '../types/data';

type TabKey = 'accounts' | 'fte' | 'projet' | 'organisation';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'accounts', label: 'Référentiel Accounts' },
  { key: 'fte', label: 'Référentiel FTE' },
  { key: 'projet', label: 'Référentiel Projet' },
  { key: 'organisation', label: 'Référentiel Organisation' },
];

const ACCOUNT_COLS: (keyof AccountRef)[] = ['REP_5', 'Lib_REP_5', 'REP_4', 'Lib_REP_4', 'REP', 'Lib_REP', 'ACCOUNT_GSP', 'Cpte_Conso', 'CodeR', 'CodeR_DESC'];
const FTE_COLS: (keyof FTERef)[] = ['Type_FTE', 'Nom_FTE', 'Account'];
const PROJET_COLS: (keyof ProjetRef)[] = ['Code_Projet', 'Nom_Projet', 'CDR', 'Entité', 'Supplier', 'Nature'];
const ORG_COLS: (keyof OrganisationRef)[] = ['CDR', 'Nom_CDR', 'Entité', 'Nom_Entité', 'Hub', 'Nom_Hub', 'Process', 'Nom_Process'];

const thStyle: React.CSSProperties = {
  background: '#111827',
  color: '#94a3b8',
  padding: '8px 10px',
  textAlign: 'left',
  borderBottom: '1px solid #1e2d45',
  fontFamily: 'DM Mono, monospace',
  fontSize: 10,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
  position: 'sticky',
  top: 0,
  zIndex: 10,
};

const tdStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderBottom: '1px solid rgba(30,45,69,0.4)',
  color: '#f1f5f9',
  fontSize: 12,
  whiteSpace: 'nowrap',
};

export const Referentiels: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('accounts');
  const { referentiels, setAccounts, setFTE, setProjet, setOrganisation } = useReferentielsStore();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseReferentielFile(file);
    if (!result.success || !result.data) return;
    const data = result.data as Record<string, unknown>[];
    if (activeTab === 'accounts') setAccounts(data as unknown as AccountRef[]);
    else if (activeTab === 'fte') setFTE(data as unknown as FTERef[]);
    else if (activeTab === 'projet') setProjet(data as unknown as ProjetRef[]);
    else if (activeTab === 'organisation') setOrganisation(data as unknown as OrganisationRef[]);
    e.target.value = '';
  };

  const handleExport = () => {
    let data: Record<string, unknown>[] = [];
    let filename = '';
    if (activeTab === 'accounts') { data = referentiels.accounts as unknown as Record<string, unknown>[]; filename = 'referentiel_accounts.xlsx'; }
    else if (activeTab === 'fte') { data = referentiels.fte as unknown as Record<string, unknown>[]; filename = 'referentiel_fte.xlsx'; }
    else if (activeTab === 'projet') { data = referentiels.projet as unknown as Record<string, unknown>[]; filename = 'referentiel_projet.xlsx'; }
    else { data = referentiels.organisation as unknown as Record<string, unknown>[]; filename = 'referentiel_organisation.xlsx'; }
    exportToExcel(data, filename);
  };

  const renderTable = () => {
    if (activeTab === 'accounts') {
      const rows = referentiels.accounts;
      return (
        <>
          <thead><tr>{ACCOUNT_COLS.map(c => <th key={c} style={thStyle}>{c}</th>)}<th style={thStyle}></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              {ACCOUNT_COLS.map(c => <td key={c} style={tdStyle}>{String(r[c] ?? '—')}</td>)}
              <td style={tdStyle}><button onClick={() => setAccounts(rows.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button></td>
            </tr>
          ))}</tbody>
        </>
      );
    }
    if (activeTab === 'fte') {
      const rows = referentiels.fte;
      return (
        <>
          <thead><tr>{FTE_COLS.map(c => <th key={c} style={thStyle}>{c}</th>)}<th style={thStyle}></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              {FTE_COLS.map(c => <td key={c} style={tdStyle}>{String(r[c] ?? '—')}</td>)}
              <td style={tdStyle}><button onClick={() => setFTE(rows.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button></td>
            </tr>
          ))}</tbody>
        </>
      );
    }
    if (activeTab === 'projet') {
      const rows = referentiels.projet;
      return (
        <>
          <thead><tr>{PROJET_COLS.map(c => <th key={c} style={thStyle}>{c}</th>)}<th style={thStyle}></th></tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
              {PROJET_COLS.map(c => <td key={c} style={tdStyle}>{String(r[c] ?? '—')}</td>)}
              <td style={tdStyle}><button onClick={() => setProjet(rows.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button></td>
            </tr>
          ))}</tbody>
        </>
      );
    }
    // organisation
    const rows = referentiels.organisation;
    return (
      <>
        <thead><tr>{ORG_COLS.map(c => <th key={c} style={thStyle}>{c}</th>)}<th style={thStyle}></th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
            {ORG_COLS.map(c => <td key={c} style={tdStyle}>{String(r[c] ?? '—')}</td>)}
            <td style={tdStyle}><button onClick={() => setOrganisation(rows.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={12} /></button></td>
          </tr>
        ))}</tbody>
      </>
    );
  };

  const currentCount = activeTab === 'accounts' ? referentiels.accounts.length : activeTab === 'fte' ? referentiels.fte.length : activeTab === 'projet' ? referentiels.projet.length : referentiels.organisation.length;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderBottom: '1px solid #1e2d45' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding: '10px 20px', background: 'transparent', border: 'none',
            borderBottom: activeTab === t.key ? '2px solid #e8451a' : '2px solid transparent',
            color: activeTab === t.key ? '#e8451a' : '#94a3b8',
            cursor: 'pointer', fontSize: 13, fontWeight: activeTab === t.key ? 500 : 400,
          }}>{t.label}</button>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          Importer Excel
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        </label>
        <ExportButton onClick={handleExport} disabled={currentCount === 0} />
        <span style={{ color: '#475569', fontSize: 12 }}>{currentCount.toLocaleString('fr-FR')} entrées</span>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto', maxHeight: 600 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
          {renderTable()}
        </table>
        {currentCount === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>
            Aucune entrée — importez un fichier Excel ou les valeurs par défaut sont chargées
          </div>
        )}
      </div>
    </div>
  );
};
