import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Database, BarChart3, TrendingUp, Users, Zap,
  DollarSign, BookOpen, PenSquare, Calendar, Settings, Sliders,
  BookMarked, ChevronLeft, ChevronRight, Activity
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/sources', label: 'Connecteur de données', icon: Database },
  { path: '/consolidation', label: 'Consolidation', icon: Activity },
  { path: '/synthese', label: 'Synthèse', icon: BarChart3 },
  { path: '/synthese-expansion', label: 'Synthèse + Expansion', icon: TrendingUp },
  { path: '/focus-etp', label: 'Focus ETP', icon: Users },
  { path: '/focus-expansion', label: 'Focus Expansion', icon: Zap },
  { path: '/focus-charges', label: 'Focus Charges', icon: DollarSign },
  { path: '/compte-resultat', label: 'Compte de résultat', icon: BookOpen },
  { path: '/modifications', label: 'Modifications', icon: PenSquare },
  { path: '/projections', label: 'Projections', icon: Calendar },
  { path: '/hypotheses', label: 'Hypothèses', icon: Sliders },
  { path: '/referentiels', label: 'Référentiels', icon: BookMarked },
  { path: '/parametres', label: 'Paramètres', icon: Settings },
  { path: '/graphiques', label: 'Graphiques', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      style={{
        width: collapsed ? 56 : 240,
        minHeight: '100vh',
        background: '#0d1424',
        borderRight: '1px solid #1e2d45',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        overflowX: 'hidden',
      }}
    >
      {/* Logo */}
      <div style={{
        padding: collapsed ? '16px 12px' : '20px 16px',
        borderBottom: '1px solid #1e2d45',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minHeight: 64,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6,
          background: '#e8451a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ color: 'white', fontWeight: 700, fontSize: 14, fontFamily: 'DM Mono, monospace' }}>P</span>
        </div>
        {!collapsed && (
          <div>
            <div style={{ color: '#f1f5f9', fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 500 }}>PST GSP</div>
            <div style={{ color: '#475569', fontSize: 10, fontFamily: 'DM Mono, monospace' }}>Platform v1.0</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: collapsed ? '10px 12px' : '10px 16px',
                color: isActive ? '#e8451a' : '#94a3b8',
                background: isActive ? 'rgba(232, 69, 26, 0.1)' : 'transparent',
                borderLeft: isActive ? '2px solid #e8451a' : '2px solid transparent',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(c => !c)}
        style={{
          margin: '8px',
          padding: '8px',
          background: '#1a2235',
          border: '1px solid #1e2d45',
          borderRadius: 6,
          color: '#94a3b8',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );
};
