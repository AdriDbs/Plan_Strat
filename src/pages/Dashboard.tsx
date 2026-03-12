import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Database, Users, DollarSign, Zap, BarChart3, AlertTriangle, ArrowRight } from 'lucide-react';
import { useSourcesStore } from '../store/useSourcesStore';
import { useDataStore } from '../store/useDataStore';
import { KpiCard } from '../components/ui/KpiCard';
import type { SourceKey } from '../types/data';

const SOURCE_LABELS: Record<SourceKey, string> = {
  budget_collector_charges: 'Budget Collector Charges',
  budget_collector_fte_fp: 'Budget Collector FTE FP',
  budget_collector_fte_m: 'Budget Collector FTE Moyen',
  alcyone_etp_fp: 'Alcyone ETP FP',
  alcyone_cout_etp: 'Alcyone Coût ETP',
  alcyone_etp_moyen: 'Alcyone ETP Moyen',
  expansion: 'Expansion',
  etp_externe: 'ETP Externe',
  besoin_ressources: 'Besoin Ressources',
  charges_additionnelles: 'Charges Additionnelles',
  flux: 'Flux',
};

const MODULES = [
  { path: '/sources', label: 'Connecteur de données', desc: 'Importer les fichiers source', icon: Database, color: '#e8451a' },
  { path: '/consolidation', label: 'Consolidation', desc: 'Données consolidées calculées', icon: BarChart3, color: '#3b82f6' },
  { path: '/synthese', label: 'Synthèse', desc: 'Vue pivot sans expansion', icon: BarChart3, color: '#8b5cf6' },
  { path: '/focus-etp', label: 'Focus ETP', desc: 'ETP FP et Moyen par CDR', icon: Users, color: '#22c55e' },
  { path: '/focus-charges', label: 'Focus Charges', desc: 'P&L par REP', icon: DollarSign, color: '#f59e0b' },
  { path: '/compte-resultat', label: 'Compte de résultat', desc: 'Hiérarchie REP_5 > REP_4 > REP', icon: DollarSign, color: '#ec4899' },
  { path: '/modifications', label: 'Modifications', desc: 'Saisie manuelle d\'ajustements', icon: Database, color: '#06b6d4' },
  { path: '/projections', label: 'Projections 2027–2030', desc: 'Horizons de prévision', icon: Zap, color: '#f97316' },
];

export const Dashboard: React.FC = () => {
  const { metadata } = useSourcesStore();
  const { consolidation, projections } = useDataStore();

  const sourceKeys = Object.keys(SOURCE_LABELS) as SourceKey[];
  const loadedSources = sourceKeys.filter(k => metadata[k] != null);
  const noData = consolidation.length === 0;

  const kpis = useMemo(() => {
    const refYear = 2025;
    const data = consolidation.filter(r => r.Année === refYear);

    const totalETPFP = data
      .filter(r => r.Type_indicateur === 'ETP_Workforce_Interne_FP')
      .reduce((s, r) => s + (r.Total_ETP ?? 0), 0);

    const totalCoutETP = data
      .filter(r => r.Type_indicateur === 'Cout_ETP')
      .reduce((s, r) => s + (r.Total_Cout_KEUR ?? 0), 0);

    const totalCharges = data
      .filter(r => r.Type_indicateur === 'Charges')
      .reduce((s, r) => s + (r.Total_Cout_KEUR ?? 0), 0);

    return { totalETPFP, totalCoutETP, totalCharges };
  }, [consolidation]);

  const fmt = (n: number) => n === 0 ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);
  const fmtK = (n: number) => n === 0 ? '—' : new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + ' K€';

  return (
    <div>
      {/* Banner warning */}
      {noData && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 24,
        }}>
          <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <span style={{ color: '#f59e0b', fontSize: 13 }}>
            Aucune donnée chargée — rendez-vous dans le{' '}
            <Link to="/sources" style={{ color: '#e8451a', textDecoration: 'underline' }}>Connecteur de données</Link>
          </span>
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <KpiCard title="ETP FP (2025)" value={fmt(kpis.totalETPFP)} subtitle="ETP Interne FP" icon={Users} color="#e8451a" />
        <KpiCard title="Coût ETP (2025)" value={fmtK(kpis.totalCoutETP)} subtitle="Coût total ETP" icon={DollarSign} color="#3b82f6" />
        <KpiCard title="Charges (2025)" value={fmtK(kpis.totalCharges)} subtitle="Total charges" icon={BarChart3} color="#8b5cf6" />
        <KpiCard title="Lignes consolidées" value={consolidation.length.toLocaleString('fr-FR')} subtitle={`+ ${projections.length.toLocaleString('fr-FR')} projections`} icon={Database} color="#22c55e" />
      </div>

      {/* Sources health */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Santé des sources ({loadedSources.length}/{sourceKeys.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {sourceKeys.map(key => {
            const meta = metadata[key];
            const days = meta ? (Date.now() - new Date(meta.lastUpdated).getTime()) / (1000 * 60 * 60 * 24) : null;
            const color = days == null ? '#ef4444' : days < 7 ? '#22c55e' : days < 30 ? '#f59e0b' : '#ef4444';
            return (
              <div key={key} style={{ background: '#1a2235', border: '1px solid #1e2d45', borderRadius: 6, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: '#f1f5f9', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {SOURCE_LABELS[key]}
                  </div>
                  {meta && (
                    <div style={{ color: '#475569', fontSize: 10 }}>{meta.rowCount.toLocaleString('fr-FR')} lignes</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick access modules */}
      <section>
        <h2 style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
          Accès rapide
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
          {MODULES.map(({ path, label, desc, icon: Icon, color }) => (
            <Link key={path} to={path} style={{ textDecoration: 'none' }}>
              <div style={{
                background: '#1a2235',
                border: '1px solid #1e2d45',
                borderRadius: 10,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.background = '#1e293b'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1e2d45'; (e.currentTarget as HTMLElement).style.background = '#1a2235'; }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={18} style={{ color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{label}</div>
                  <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>{desc}</div>
                </div>
                <ArrowRight size={14} style={{ color: '#475569' }} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};
