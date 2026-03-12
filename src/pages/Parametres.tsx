import React from 'react';
import { useParametresStore } from '../store/useParametresStore';

export const Parametres: React.FC = () => {
  const { parametres, updateParametres, resetParametres } = useParametresStore();

  const inputStyle: React.CSSProperties = {
    background: '#0a0f1e', border: '1px solid #1e2d45', borderRadius: 4,
    color: '#f1f5f9', padding: '6px 10px', fontSize: 13, width: '100%',
  };

  const handleREPOrderChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const reps = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    updateParametres({ repsCompteResultat: reps });
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={resetParametres} style={{ padding: '8px 20px', background: 'transparent', border: '1px solid #1e2d45', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
          Réinitialiser
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
        {/* Année de référence */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>Année de référence</h3>
          <input type="number" style={inputStyle} value={parametres.anneeReference} onChange={e => updateParametres({ anneeReference: parseInt(e.target.value) || 2025 })} />
        </div>

        {/* Années de prévision */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>Années de prévision</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map(yr => (
              <label key={yr} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#f1f5f9', fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={parametres.anneesPrevision.includes(yr)}
                  onChange={e => {
                    const updated = e.target.checked
                      ? [...parametres.anneesPrevision, yr].sort()
                      : parametres.anneesPrevision.filter(y => y !== yr);
                    updateParametres({ anneesPrevision: updated });
                  }}
                  style={{ accentColor: '#e8451a' }}
                />
                {yr}
              </label>
            ))}
          </div>
        </div>

        {/* Entités */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>Entités</h3>
          <textarea
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }}
            value={parametres.entites.join('\n')}
            onChange={e => updateParametres({ entites: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
            placeholder="Une entité par ligne"
          />
        </div>

        {/* REPs Compte de résultat */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20, gridColumn: 'span 2' }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 8 }}>
            Ordre des REP (Compte de résultat)
          </h3>
          <p style={{ color: '#475569', fontSize: 12, marginBottom: 12 }}>Un REP par ligne, dans l'ordre d'affichage souhaité.</p>
          <textarea
            rows={14}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }}
            value={parametres.repsCompteResultat.join('\n')}
            onChange={handleREPOrderChange}
          />
          <p style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>{parametres.repsCompteResultat.length} REP configurés</p>
        </div>

        {/* Indicateurs ETP */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>Indicateurs ETP visibles</h3>
          {['ETP FP', 'ETP M', 'Cout base', 'CU', 'Cout total'].map(ind => (
            <label key={ind} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', color: '#f1f5f9', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={parametres.indicateursETP.includes(ind)}
                onChange={e => {
                  const updated = e.target.checked ? [...parametres.indicateursETP, ind] : parametres.indicateursETP.filter(i => i !== ind);
                  updateParametres({ indicateursETP: updated });
                }}
                style={{ accentColor: '#e8451a' }}
              />
              {ind}
            </label>
          ))}
        </div>

        {/* Indicateurs Expansion */}
        <div style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 10, padding: 20 }}>
          <h3 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#f1f5f9', marginBottom: 16 }}>Indicateurs Expansion visibles</h3>
          {['ETP FP', 'Cout total'].map(ind => (
            <label key={ind} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', color: '#f1f5f9', fontSize: 13 }}>
              <input
                type="checkbox"
                checked={parametres.indicateursExpansion.includes(ind)}
                onChange={e => {
                  const updated = e.target.checked ? [...parametres.indicateursExpansion, ind] : parametres.indicateursExpansion.filter(i => i !== ind);
                  updateParametres({ indicateursExpansion: updated });
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
