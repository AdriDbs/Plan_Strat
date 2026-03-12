import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Sources } from './pages/Sources';
import { Consolidation } from './pages/Consolidation';
import { Synthese } from './pages/Synthese';
import { SyntheseExpansion } from './pages/SyntheseExpansion';
import { FocusETP } from './pages/FocusETP';
import { FocusExpansion } from './pages/FocusExpansion';
import { FocusCharges } from './pages/FocusCharges';
import { CompteResultat } from './pages/CompteResultat';
import { Modifications } from './pages/Modifications';
import { Projections } from './pages/Projections';
import { Hypotheses } from './pages/Hypotheses';
import { Referentiels } from './pages/Referentiels';
import { Parametres } from './pages/Parametres';
import { Graphiques } from './pages/Graphiques';
import { useDataStore } from './store/useDataStore';

function App() {
  const { recalculate } = useDataStore();

  // Initial calculation on app load
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { recalculate(); }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sources" element={<Sources />} />
          <Route path="consolidation" element={<Consolidation />} />
          <Route path="synthese" element={<Synthese />} />
          <Route path="synthese-expansion" element={<SyntheseExpansion />} />
          <Route path="focus-etp" element={<FocusETP />} />
          <Route path="focus-expansion" element={<FocusExpansion />} />
          <Route path="focus-charges" element={<FocusCharges />} />
          <Route path="compte-resultat" element={<CompteResultat />} />
          <Route path="modifications" element={<Modifications />} />
          <Route path="projections" element={<Projections />} />
          <Route path="hypotheses" element={<Hypotheses />} />
          <Route path="referentiels" element={<Referentiels />} />
          <Route path="parametres" element={<Parametres />} />
          <Route path="graphiques" element={<Graphiques />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
