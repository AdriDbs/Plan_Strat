import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDataStore } from '../../store/useDataStore';
import { RefreshCw, AlertTriangle } from 'lucide-react';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/sources': 'Connecteur de données',
  '/consolidation': 'Consolidation',
  '/synthese': 'Synthèse sans Expansion',
  '/synthese-expansion': 'Synthèse avec Expansion',
  '/focus-etp': 'Focus ETP',
  '/focus-expansion': 'Focus Expansion',
  '/focus-charges': 'Focus Charges',
  '/compte-resultat': 'Compte de résultat',
  '/modifications': 'Modifications',
  '/projections': 'Projections',
  '/hypotheses': 'Hypothèses',
  '/referentiels': 'Référentiels',
  '/parametres': 'Paramètres',
  '/graphiques': 'Graphiques',
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const { isCalculating, consolidation, recalculate } = useDataStore();
  const title = routeLabels[location.pathname] ?? 'PST GSP';

  return (
    <header style={{
      height: 56,
      background: '#111827',
      borderBottom: '1px solid #1e2d45',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <h1 style={{
        margin: 0,
        fontSize: 14,
        fontFamily: 'DM Mono, monospace',
        color: '#f1f5f9',
        fontWeight: 500,
        flex: 1,
      }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {consolidation.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: 12 }}>
            <AlertTriangle size={14} />
            <span>Aucune donnée</span>
          </div>
        )}

        <div style={{ color: '#475569', fontSize: 12 }}>
          {consolidation.length.toLocaleString('fr-FR')} lignes consolidées
        </div>

        <button
          onClick={recalculate}
          disabled={isCalculating}
          title="Recalculer la consolidation"
          style={{
            padding: '6px 12px',
            background: '#1a2235',
            border: '1px solid #1e2d45',
            borderRadius: 6,
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
          }}
        >
          <RefreshCw size={13} style={{ animation: isCalculating ? 'spin 1s linear infinite' : undefined }} />
          {isCalculating ? 'Calcul...' : 'Recalculer'}
        </button>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </header>
  );
};
