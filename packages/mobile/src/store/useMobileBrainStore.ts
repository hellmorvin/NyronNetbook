import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Neuron,
  ShiftRecord,
  SavingsGoal,
  BankDeposit,
  FinanceTransaction,
  CanvasSticky,
  extractWikiLinks,
  HybridSearchEngine,
} from '@axon/shared';

export type MobileTab = 'notes' | 'graph' | 'canvas' | 'shifts' | 'finance' | 'sync';

interface MobileBrainState {
  // Navigation
  activeTab: MobileTab;
  setActiveTab: (tab: MobileTab) => void;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  // Notes
  neurons: Neuron[];
  activeNeuronId: string | null;
  setActiveNeuronId: (id: string | null) => void;
  addNeuron: (title?: string, folder?: string) => Neuron;
  updateNeuronContent: (id: string, content: string) => void;
  deleteNeuron: (id: string) => void;
  setNeurons: (neurons: Neuron[]) => void;

  // Canvas Stickies
  canvasStickies: CanvasSticky[];
  addCanvasSticky: (text?: string, color?: string) => void;
  updateCanvasSticky: (id: string, patch: Partial<CanvasSticky>) => void;
  deleteCanvasSticky: (id: string) => void;

  // Shifts & Earnings
  shifts: ShiftRecord[];
  hourlyRate: number;
  nightBonusRate: number;
  setHourlyRate: (rate: number) => void;
  setNightBonusRate: (rate: number) => void;
  setShift: (date: string, type: 'day' | 'night' | 'full24' | 'custom' | 'off', hours: number) => void;
  deleteShift: (date: string) => void;

  // Finances & Savings
  savingsGoals: SavingsGoal[];
  bankDeposits: BankDeposit[];
  transactions: FinanceTransaction[];
  addSavingsGoal: (title: string, targetAmount: number, currentAmount?: number, color?: string) => void;
  updateSavingsGoal: (id: string, amount: number) => void;
  deleteSavingsGoal: (id: string) => void;
  addBankDeposit: (bankName: string, principal: number, interestRate: number, termMonths: number) => void;
  deleteBankDeposit: (id: string) => void;
  addTransaction: (tx: Omit<FinanceTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;

  // Search Engine instance
  searchEngine: HybridSearchEngine;
}

const createFullNeuron = (params: {
  id: string;
  filePath: string;
  title: string;
  content: string;
  tags?: string[];
  pinned?: boolean;
  learningState?: 'new' | 'learning' | 'review' | 'mastered';
  wikiLinks?: string[];
  backlinks?: string[];
}): Neuron => {
  const now = Date.now();
  const iso = new Date().toISOString();
  return {
    id: params.id,
    filePath: params.filePath,
    title: params.title,
    content: params.content,
    rawContent: params.content,
    frontmatter: {
      id: params.id,
      title: params.title,
      created_at: iso,
      updated_at: iso,
      tags: params.tags || [],
      pinned: !!params.pinned,
      learning_state: params.learningState || 'new',
      activation_level: 0.5,
      access_count: 1,
    },
    wikiLinks: params.wikiLinks || [],
    backlinks: params.backlinks || [],
    outlinks: [],
    tags: params.tags || [],
    pinned: !!params.pinned,
    color: params.pinned ? '#ec4899' : '#8052ff',
    learningState: params.learningState || 'new',
    activationLevel: 0.5,
    accessCount: 1,
    position: { x: 0, y: 0, z: 0 },
    createdAt: now,
    updatedAt: now,
  };
};

const defaultWelcomeNotes: Neuron[] = [];
const defaultStickies: CanvasSticky[] = [];
const defaultSavings: SavingsGoal[] = [];

export const useMobileBrainStore = create<MobileBrainState>()(
  persist(
    (set, get) => ({
      activeTab: 'notes',
      setActiveTab: (activeTab) => set({ activeTab }),
      isDrawerOpen: false,
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
      isSearchOpen: false,
      setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),

      neurons: defaultWelcomeNotes,
      activeNeuronId: null,
      setActiveNeuronId: (activeNeuronId) => set({ activeNeuronId }),

      addNeuron: (title = 'Новая заметка', folder = 'Заметки') => {
        const id = `neu_mob_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const newNeuron: Neuron = createFullNeuron({
          id,
          filePath: `${folder}/${title.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_')}.md`,
          title,
          content: `# ${title}\n\nНачните писать здесь...`,
          tags: [],
          pinned: false,
          learningState: 'new',
          wikiLinks: [],
          backlinks: [],
        });

        set((state) => {
          const updated = [newNeuron, ...state.neurons];
          state.searchEngine.indexAll(updated);
          return {
            neurons: updated,
            activeNeuronId: newNeuron.id,
            activeTab: 'notes',
          };
        });

        return newNeuron;
      },

      updateNeuronContent: (id, content) => {
        set((state) => {
          const wikiLinks = extractWikiLinks(content);
          const updated = state.neurons.map((n) => {
            if (n.id !== id) return n;
            return {
              ...n,
              content,
              rawContent: content,
              wikiLinks,
              frontmatter: {
                ...n.frontmatter,
                updated_at: new Date().toISOString(),
              },
            };
          });
          state.searchEngine.indexAll(updated);
          return { neurons: updated };
        });
      },

      deleteNeuron: (id) => {
        set((state) => {
          const updated = state.neurons.filter((n) => n.id !== id);
          const nextActive = state.activeNeuronId === id ? (updated[0]?.id || null) : state.activeNeuronId;
          state.searchEngine.indexAll(updated);
          return { neurons: updated, activeNeuronId: nextActive };
        });
      },

      setNeurons: (neurons) => {
        set((state) => {
          state.searchEngine.indexAll(neurons);
          return {
            neurons,
            activeNeuronId: neurons[0]?.id || null,
          };
        });
      },

      canvasStickies: [],
      addCanvasSticky: (text = 'Новая идея', color = '#8052ff') => {
        const newSticky: CanvasSticky = {
          id: `sticky_${Date.now()}`,
          x: 40 + Math.random() * 100,
          y: 80 + Math.random() * 200,
          width: 220,
          height: 140,
          color,
          text,
          updatedAt: Date.now(),
        };
        set((state) => ({ canvasStickies: [...state.canvasStickies, newSticky] }));
      },

      updateCanvasSticky: (id, patch) => {
        set((state) => ({
          canvasStickies: state.canvasStickies.map((s) => (s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s)),
        }));
      },

      deleteCanvasSticky: (id) => {
        set((state) => ({
          canvasStickies: state.canvasStickies.filter((s) => s.id !== id),
        }));
      },

      shifts: [],
      hourlyRate: 450,
      nightBonusRate: 1.2,
      setHourlyRate: (hourlyRate) => set({ hourlyRate }),
      setNightBonusRate: (nightBonusRate) => set({ nightBonusRate }),

      setShift: (date, type, hours) => {
        set((state) => {
          const rate = state.hourlyRate;
          const nightMultiplier = type === 'night' ? state.nightBonusRate : 1;
          const earnings = Math.round(hours * rate * nightMultiplier);

          const existing = state.shifts.filter((s) => s.date !== date);
          if (type === 'off' || hours <= 0) {
            return { shifts: existing };
          }

          const newRecord: ShiftRecord = {
            id: `shift_${date}`,
            date,
            type,
            hours,
            earnings,
            note: '',
            expenses: 0,
          };

          return { shifts: [...existing, newRecord] };
        });
      },

      deleteShift: (date) => {
        set((state) => ({
          shifts: state.shifts.filter((s) => s.date !== date),
        }));
      },

      savingsGoals: [],
      bankDeposits: [],
      transactions: [],

      addSavingsGoal: (title, targetAmount, currentAmount = 0, color = '#8052ff') => {
        const newGoal: SavingsGoal = {
          id: `goal_${Date.now()}`,
          title,
          targetAmount,
          currentAmount,
          color,
        };
        set((state) => ({ savingsGoals: [...state.savingsGoals, newGoal] }));
      },

      updateSavingsGoal: (id, amount) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) => (g.id === id ? { ...g, currentAmount: amount } : g)),
        }));
      },

      deleteSavingsGoal: (id) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
        }));
      },

      addBankDeposit: (bankName, principal, interestRate, termMonths) => {
        const newDep: BankDeposit = {
          id: `dep_${Date.now()}`,
          bankName,
          principal,
          interestRate,
          termMonths,
          startDate: new Date().toISOString().split('T')[0] || '',
          isCapitalized: true,
        };
        set((state) => ({ bankDeposits: [...state.bankDeposits, newDep] }));
      },

      deleteBankDeposit: (id) => {
        set((state) => ({
          bankDeposits: state.bankDeposits.filter((d) => d.id !== id),
        }));
      },

      addTransaction: (tx) => {
        const newTx: FinanceTransaction = {
          ...tx,
          id: `tx_${Date.now()}`,
        };
        set((state) => ({ transactions: [newTx, ...state.transactions] }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      searchEngine: new HybridSearchEngine(),
    }),
    {
      name: 'nyron_mobile_vault_v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        neurons: state.neurons,
        activeNeuronId: state.activeNeuronId,
        canvasStickies: state.canvasStickies,
        shifts: state.shifts,
        hourlyRate: state.hourlyRate,
        nightBonusRate: state.nightBonusRate,
        savingsGoals: state.savingsGoals,
        bankDeposits: state.bankDeposits,
        transactions: state.transactions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (!state.searchEngine || typeof state.searchEngine.indexAll !== 'function') {
            state.searchEngine = new HybridSearchEngine();
          }
          if (state.neurons && state.neurons.length > 0) {
            state.searchEngine.indexAll(state.neurons);
          }
        }
      },
    }
  )
);
