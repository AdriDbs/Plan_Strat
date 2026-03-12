import { create } from 'zustand';
import { saveToStorage, loadFromStorage } from '../lib/storage';
import type { AccountRef, FTERef, ProjetRef, OrganisationRef, ReferentielsState } from '../types/data';

const DEFAULT_FTE: FTERef[] = [
  { Type_FTE: 'F25', Nom_FTE: 'Temporary staff', Account: 417200 },
  { Type_FTE: 'F30', Nom_FTE: 'Nearshoring PL', Account: 414720 },
  { Type_FTE: 'F35', Nom_FTE: 'Nearshoring other', Account: 414720 },
  { Type_FTE: 'F40', Nom_FTE: 'Offshoring', Account: 417210 },
  { Type_FTE: 'F50', Nom_FTE: 'Outsourcing Autres', Account: 414720 },
  { Type_FTE: 'F55', Nom_FTE: 'Subcontracting - FTE', Account: 414720 },
];

const DEFAULT_PROJET: ProjetRef[] = [
  { Code_Projet: 'GSP013', Nom_Projet: 'GSP013 Transfo Projet', CDR: 'UA2EW', Entité: '0050EMR', Supplier: 'IA2530', Nature: 'TRANSFO' },
  { Code_Projet: 'GSP014', Nom_Projet: 'GSP014 Transfo Double Run', CDR: 'UA2EW', Entité: '0050EMR', Supplier: 'IA2530', Nature: 'TRANSFO' },
  { Code_Projet: 'GSP015', Nom_Projet: 'GSP015 Run Ponctuel', CDR: 'UA2EW', Entité: '0050EMR', Supplier: 'IA2530', Nature: 'RUN' },
  { Code_Projet: 'GSP016', Nom_Projet: 'GSP016 Run Expertise', CDR: 'UA2EW', Entité: '0050EMR', Supplier: 'IA2530', Nature: 'RUN' },
];

interface ReferentielsStore {
  referentiels: ReferentielsState;
  setAccounts: (data: AccountRef[]) => void;
  setFTE: (data: FTERef[]) => void;
  setProjet: (data: ProjetRef[]) => void;
  setOrganisation: (data: OrganisationRef[]) => void;
}

function loadReferentiels(): ReferentielsState {
  return {
    accounts: loadFromStorage<AccountRef[]>('pst_referentiels_accounts', []),
    fte: loadFromStorage<FTERef[]>('pst_referentiels_fte', DEFAULT_FTE),
    projet: loadFromStorage<ProjetRef[]>('pst_referentiels_projet', DEFAULT_PROJET),
    organisation: loadFromStorage<OrganisationRef[]>('pst_referentiels_organisation', []),
  };
}

export const useReferentielsStore = create<ReferentielsStore>((set) => ({
  referentiels: loadReferentiels(),

  setAccounts: (data) => {
    saveToStorage('pst_referentiels_accounts', data);
    set(state => ({ referentiels: { ...state.referentiels, accounts: data } }));
  },

  setFTE: (data) => {
    saveToStorage('pst_referentiels_fte', data);
    set(state => ({ referentiels: { ...state.referentiels, fte: data } }));
  },

  setProjet: (data) => {
    saveToStorage('pst_referentiels_projet', data);
    set(state => ({ referentiels: { ...state.referentiels, projet: data } }));
  },

  setOrganisation: (data) => {
    saveToStorage('pst_referentiels_organisation', data);
    set(state => ({ referentiels: { ...state.referentiels, organisation: data } }));
  },
}));
