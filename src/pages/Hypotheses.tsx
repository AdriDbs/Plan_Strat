import React from 'react';
import { useHypothesesStore } from '../store/useHypothesesStore';
import { useDataStore } from '../store/useDataStore';

const YEARS = [2026, 2027, 2028, 2029, 2030] as const;
const CATEGORIES = ['France', 'Pologne'] as const;

const inputStyle: React.CSSProperties = {
  background: '#0a0f1e',
  border: '1px solid #1e2d45',
  borderRadius: 4,
  color: '#f1f5f9',
  padding: '6px 8px',
  fontSize: 12,
  width: '80px',
  fontVariantNumeric: 'tabular-nums',
  textAlign: 'right',
};

export const Hypotheses: React.FC = () => {
  const { hypotheses, updateHypotheses, resetHypotheses } = useHypothesesStore();
  const { recalculate } = useDataStore();

  const handleRecalculate = () => {
    recalculate();
  };

  const updateTaux = (cat: typeof CATEGORIES[number], yr: typeof YEARS[number], val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    updateHypotheses({
      tauxChargement: {
        ...hypotheses.tauxChargement,
        [cat]: { ...hypotheses.tauxChargement[cat], [yr]: num },
      },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          onClick={handleRecalculate}
          style={{ padding: '8px 20px', background: '#e8451a', border: 'none', borderRadius: 6, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          Recalculer les projections
        </button>
        <button
          onClick={resetHypotheses}
          style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #1e2d45', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
        >
          Réinitialiser
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 20 }}>
        {/* Taux chargement */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>
            Taux de chargement charges salariales
          </h3>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ color: '#94a3b8', fontSize: 10, fontFamily: 'DM Mono, monospace', padding: '4px 8px', textAlign: 'left' }}>Catégorie</th>
                {YEARS.map(y => (
                  <th key={y} style={{ color: '#e8451a', fontSize: 10, fontFamily: 'DM Mono, monospace', padding: '4px 8px', textAlign: 'center' }}>{y}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => (
                <tr key={cat}>
                  <td style={{ padding: '6px 8px', color: '#f1f5f9', fontSize: 13 }}>{cat}</td>
                  {YEARS.map(yr => (
                    <td key={yr} style={{ padding: '4px 4px' }}>
                      <input
                        type="number"
                        step="0.001"
                        style={inputStyle}
                        value={hypotheses.tauxChargement[cat][yr]}
                        onChange={e => updateTaux(cat, yr, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>Exemple : 0.02 = +2% par an</p>
        </div>

        {/* Taux mobilité */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>
            Taux de mobilité (ETP FP Interne)
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="number"
              step="0.001"
              style={{ ...inputStyle, width: 100 }}
              value={hypotheses.tauxMobilite}
              onChange={e => updateHypotheses({ tauxMobilite: parseFloat(e.target.value) || 0 })}
            />
            <span style={{ color: '#94a3b8', fontSize: 12 }}>({(hypotheses.tauxMobilite * 100).toFixed(1)}% de réduction annuelle)</span>
          </div>
          <p style={{ color: '#475569', fontSize: 11, marginTop: 8 }}>
            ETP_FP_N = ETP_FP_(N-1) × (1 − taux_mobilité)
          </p>
        </div>

        {/* Année de référence */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>
            Année de référence
          </h3>
          <input
            type="number"
            style={{ ...inputStyle, width: 100 }}
            value={hypotheses.anneeReference}
            onChange={e => updateHypotheses({ anneeReference: parseInt(e.target.value) || 2025 })}
          />
        </div>

        {/* Indicateurs ETP */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>
            Indicateurs ETP visibles
          </h3>
          {['ETP FP', 'ETP M', 'Cout base', 'CU', 'Cout total'].map(ind => (
            <label key={ind} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', color: '#f1f5f9', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={hypotheses.indicateursETP.includes(ind)}
                onChange={e => {
                  const updated = e.target.checked
                    ? [...hypotheses.indicateursETP, ind]
                    : hypotheses.indicateursETP.filter(i => i !== ind);
                  updateHypotheses({ indicateursETP: updated });
                }}
                style={{ accentColor: '#e8451a' }}
              />
              {ind}
            </label>
          ))}
        </div>

        {/* Indicateurs Expansion */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>
            Indicateurs Expansion visibles
          </h3>
          {['ETP FP', 'Cout total'].map(ind => (
            <label key={ind} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', color: '#f1f5f9', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={hypotheses.indicateursExpansion.includes(ind)}
                onChange={e => {
                  const updated = e.target.checked
                    ? [...hypotheses.indicateursExpansion, ind]
                    : hypotheses.indicateursExpansion.filter(i => i !== ind);
                  updateHypotheses({ indicateursExpansion: updated });
                }}
                style={{ accentColor: '#e8451a' }}
              />
              {ind}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
