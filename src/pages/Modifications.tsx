import React, { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useModificationsStore } from '../store/useModificationsStore';
import { useDataStore } from '../store/useDataStore';
import { ExportButton } from '../components/ui/ExportButton';
import { exportModifications } from '../lib/excelExporter';
import { getUniqueValues } from '../lib/pivotEngine';
import { parseReferentielFile } from '../lib/excelParser';
import type { ModificationRecord } from '../types/data';

const EMPTY_MOD: Omit<ModificationRecord, 'id'> = {
  Type_indicateur: '',
  Entité: '',
  Hub: '',
  Process: '',
  CDR: '',
  Projet: null,
  REP: null,
  Account: null,
  Type_ETP: null,
  Code_ETP: null,
  Type_mouvement: null,
  Année: 2025,
  Total_ETP: null,
  Total_Cout_KEUR: null,
  Nouveau_Total_ETP: null,
  Nouveau_Total_Cout_KEUR: null,
};

export const Modifications: React.FC = () => {
  const { modifications, addModification, deleteModification, setModifications } = useModificationsStore();
  const { consolidation } = useDataStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_MOD });

  const indicateurs = useMemo(() => getUniqueValues(consolidation, 'Type_indicateur'), [consolidation]);
  const entites = useMemo(() => getUniqueValues(consolidation, 'Entité'), [consolidation]);
  const hubs = useMemo(() => getUniqueValues(consolidation, 'Hub'), [consolidation]);
  const processes = useMemo(() => getUniqueValues(consolidation, 'Process'), [consolidation]);
  const cdrs = useMemo(() => getUniqueValues(consolidation, 'CDR'), [consolidation]);

  const handleAdd = () => {
    if (!form.Type_indicateur || !form.CDR || !form.Année) return;
    addModification(form);
    setForm({ ...EMPTY_MOD });
    setShowForm(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await parseReferentielFile(file);
    if (result.success && result.data) {
      const mods = (result.data as Record<string, unknown>[]).map((r, i) => ({
        id: `imported_${i}`,
        Type_indicateur: String(r.Type_indicateur ?? ''),
        Entité: String(r.Entité ?? ''),
        Hub: String(r.Hub ?? ''),
        Process: String(r.Process ?? ''),
        CDR: String(r.CDR ?? ''),
        Projet: r.Projet != null ? String(r.Projet) : null,
        REP: r.REP != null ? String(r.REP) : null,
        Account: r.Account != null ? Number(r.Account) : null,
        Type_ETP: r.Type_ETP != null ? String(r.Type_ETP) : null,
        Code_ETP: r.Code_ETP != null ? String(r.Code_ETP) : null,
        Type_mouvement: r.Type_mouvement != null ? String(r.Type_mouvement) : null,
        Année: Number(r.Année ?? 2025),
        Total_ETP: r.Total_ETP != null ? Number(r.Total_ETP) : null,
        Total_Cout_KEUR: r.Total_Cout_KEUR != null ? Number(r.Total_Cout_KEUR) : null,
        Nouveau_Total_ETP: r.Nouveau_Total_ETP != null ? Number(r.Nouveau_Total_ETP) : null,
        Nouveau_Total_Cout_KEUR: r.Nouveau_Total_Cout_KEUR != null ? Number(r.Nouveau_Total_Cout_KEUR) : null,
      } as ModificationRecord));
      setModifications(mods);
    }
    e.target.value = '';
  };

  const inputStyle = {
    background: '#0a0f1e',
    border: '1px solid #1e2d45',
    borderRadius: 4,
    color: '#f1f5f9',
    padding: '6px 8px',
    fontSize: 12,
    width: '100%',
  };

  const selectStyle = { ...inputStyle };

  return (
    <div>
      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#e8451a', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 13 }}
        >
          <Plus size={14} />
          Ajouter une modification
        </button>
        <ExportButton onClick={() => exportModifications(modifications)} disabled={modifications.length === 0} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          Importer Excel
          <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImport} />
        </label>
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background: '#1a2235', border: '1px solid #e8451a', borderRadius: 10, padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>Nouvelle modification</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Type indicateur *</label>
              <select style={selectStyle} value={form.Type_indicateur} onChange={e => setForm(f => ({ ...f, Type_indicateur: e.target.value }))}>
                <option value="">—</option>
                {indicateurs.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Entité *</label>
              <select style={selectStyle} value={form.Entité} onChange={e => setForm(f => ({ ...f, Entité: e.target.value }))}>
                <option value="">—</option>
                {entites.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Hub</label>
              <select style={selectStyle} value={form.Hub} onChange={e => setForm(f => ({ ...f, Hub: e.target.value }))}>
                <option value="">—</option>
                {hubs.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Process</label>
              <select style={selectStyle} value={form.Process} onChange={e => setForm(f => ({ ...f, Process: e.target.value }))}>
                <option value="">—</option>
                {processes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>CDR *</label>
              <select style={selectStyle} value={form.CDR} onChange={e => setForm(f => ({ ...f, CDR: e.target.value }))}>
                <option value="">—</option>
                {cdrs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Année *</label>
              <input type="number" style={inputStyle} value={form.Année} onChange={e => setForm(f => ({ ...f, Année: Number(e.target.value) }))} />
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Nouveau Total ETP</label>
              <input type="number" step="0.01" style={inputStyle} value={form.Nouveau_Total_ETP ?? ''} onChange={e => setForm(f => ({ ...f, Nouveau_Total_ETP: e.target.value ? Number(e.target.value) : null }))} />
            </div>
            <div>
              <label style={{ color: '#475569', fontSize: 10, display: 'block', marginBottom: 3 }}>Nouveau Total Coût KEUR</label>
              <input type="number" step="0.01" style={inputStyle} value={form.Nouveau_Total_Cout_KEUR ?? ''} onChange={e => setForm(f => ({ ...f, Nouveau_Total_Cout_KEUR: e.target.value ? Number(e.target.value) : null }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={handleAdd} style={{ padding: '8px 20px', background: '#e8451a', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 13 }}>
              Ajouter
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #1e2d45', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ border: '1px solid #1e2d45', borderRadius: 8, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
          <thead>
            <tr>
              {['Type_indicateur', 'Entité', 'Hub', 'Process', 'CDR', 'Année', 'Total_ETP', 'Total_Cout_KEUR', 'Nouveau_Total_ETP', 'Nouveau_Total_Cout_KEUR', ''].map(h => (
                <th key={h} style={{ background: '#111827', color: '#94a3b8', padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #1e2d45', whiteSpace: 'nowrap', fontFamily: 'DM Mono, monospace', fontSize: 10, textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modifications.map((mod, i) => (
              <tr key={mod.id} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#f1f5f9' }}>{mod.Type_indicateur}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#f1f5f9' }}>{mod.Entité}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#f1f5f9' }}>{mod.Hub}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#f1f5f9' }}>{mod.Process}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#f1f5f9' }}>{mod.CDR}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>{mod.Année}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{mod.Total_ETP ?? '—'}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{mod.Total_Cout_KEUR ?? '—'}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#22c55e', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{mod.Nouveau_Total_ETP ?? '—'}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)', color: '#22c55e', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{mod.Nouveau_Total_Cout_KEUR ?? '—'}</td>
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(30,45,69,0.5)' }}>
                  <button onClick={() => deleteModification(mod.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {modifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569', fontSize: 13 }}>Aucune modification enregistrée</div>
        )}
      </div>
    </div>
  );
};
