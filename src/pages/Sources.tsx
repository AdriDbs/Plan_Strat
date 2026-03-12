import React, { useState } from 'react';
import { Trash2, CheckCircle } from 'lucide-react';
import { useSourcesStore } from '../store/useSourcesStore';
import { UploadZone } from '../components/ui/UploadZone';
import { StatusBadge } from '../components/ui/StatusBadge';
import { parseExcelFile } from '../lib/excelParser';
import type { SourceKey } from '../types/data';

const SOURCES: Array<{ key: SourceKey; label: string; description: string }> = [
  { key: 'budget_collector_charges', label: 'Budget Collector Charges', description: 'Charges budgétaires par CDR/Process/Compte' },
  { key: 'budget_collector_fte_fp', label: 'Budget Collector FTE FP', description: 'ETP Fixe Permanent budgétés' },
  { key: 'budget_collector_fte_m', label: 'Budget Collector FTE Moyen', description: 'ETP Moyen budgétés' },
  { key: 'alcyone_etp_fp', label: 'Alcyone ETP FP', description: 'ETP Interne FP depuis Alcyone' },
  { key: 'alcyone_cout_etp', label: 'Alcyone Coût ETP', description: 'Coût ETP depuis Alcyone' },
  { key: 'alcyone_etp_moyen', label: 'Alcyone ETP Moyen', description: 'ETP Interne Moyen depuis Alcyone' },
  { key: 'expansion', label: 'Expansion', description: 'Données de transfert et expansion' },
  { key: 'etp_externe', label: 'ETP Externe', description: 'ETP contractuels externes' },
  { key: 'besoin_ressources', label: 'Besoin Ressources', description: 'Besoins en ressources' },
  { key: 'charges_additionnelles', label: 'Charges Additionnelles', description: 'Charges supplémentaires' },
  { key: 'flux', label: 'Flux', description: 'Flux d\'ETP (attention: header ligne 3)' },
];

interface SourceCardProps {
  sourceKey: SourceKey;
  label: string;
  description: string;
}

const SourceCard: React.FC<SourceCardProps> = ({ sourceKey, label, description }) => {
  const { setSource, clearSource, metadata } = useSourcesStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const meta = metadata[sourceKey];

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    const result = await parseExcelFile(file, sourceKey);
    if (result.success && result.data) {
      setSource(sourceKey, result.data as Record<string, unknown>[]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? 'Erreur inconnue');
    }
    setLoading(false);
  };

  return (
    <div style={{
      background: '#1a2235',
      border: `1px solid ${error ? '#ef4444' : success ? '#22c55e' : '#1e2d45'}`,
      borderRadius: 10,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{label}</div>
          <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>{description}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {success && <CheckCircle size={16} style={{ color: '#22c55e' }} />}
          <StatusBadge lastUpdated={meta?.lastUpdated ?? null} rowCount={meta?.rowCount} />
        </div>
      </div>

      <UploadZone onFile={handleFile} loading={loading} error={error ?? undefined} />

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, padding: '8px 12px', color: '#ef4444', fontSize: 12 }}>
          {error}
        </div>
      )}

      {meta && (
        <button
          onClick={() => { clearSource(sourceKey); setError(null); }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 6,
            color: '#ef4444',
            cursor: 'pointer',
            fontSize: 12,
            alignSelf: 'flex-start',
          }}
        >
          <Trash2 size={12} />
          Effacer les données
        </button>
      )}
    </div>
  );
};

export const Sources: React.FC = () => {
  return (
    <div>
      <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
        Importez les fichiers Excel pour chaque source de données. Chaque upload remplace intégralement les données existantes de la source.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
        {SOURCES.map(s => (
          <SourceCard key={s.key} sourceKey={s.key} label={s.label} description={s.description} />
        ))}
      </div>
    </div>
  );
};
