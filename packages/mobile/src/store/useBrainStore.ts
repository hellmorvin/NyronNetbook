import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  Neuron,
  LearningState,
  HybridSearchEngine,
  AISettings,
  SyncDelta,
  parseMarkdown,
  serializeMarkdown,
  createMerkleRoot,
  computeHash,
} from '@axon/shared';
import { INITIAL_NEURONS } from './defaultVaultData';

export type RibbonView = 'explorer' | 'search' | 'bookmarks' | 'database' | 'ai' | 'sync' | 'calendar' | 'finance';

export interface TabItem {
  id: string;
  type: 'graph' | 'note' | 'canvas' | 'database' | 'calendar' | 'finance';
  noteId?: string;
  title: string;
  isDirty?: boolean;
}

export interface FolderItem {
  id: string;
  name: string;
  isOpen: boolean;
}

export interface GraphPhysicsSettings {
  nodeSize: number;
  linkDistance: number;
  repulsion: number;
  centerGravity: number;
  showLabels: boolean;
  showArrows: boolean;
  filterText: string;
  colorScheme: 'default' | 'learning' | 'tags';
}

// Canvas / Whiteboard Item Types
export interface CanvasCard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'text' | 'note' | 'sticky';
  content: string;
  title?: string;
  noteId?: string;
  color: string;
}

export interface CanvasConnection {
  id: string;
  fromNode: string;
  toNode: string;
  fromPort?: 'top' | 'bottom' | 'left' | 'right';
  toPort?: 'top' | 'bottom' | 'left' | 'right';
  color?: string;
  label?: string;
}

// Calendar & Work Shift Types
export type ShiftType = 'day' | 'night' | 'full' | 'part' | 'off' | 'vacation';

export interface WorkShift {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: ShiftType;
  hours: number;
  rateType: 'hourly' | 'fixed';
  rate: number;
  bonus: number;
  earnings: number;
  note: string;
  expense?: number;
  roadExpense?: number;
  foodExpense?: number;
  completed?: boolean;
}

export interface ShiftSettings {
  defaultHourlyRate: number;
  defaultFixedRate: number;
  defaultRateType: 'hourly' | 'fixed';
  defaultDayHours: number;
  defaultNightHours: number;
  defaultFullHours: number;
  currency: string;
}

// Calendar Events & Tasks
export type EventCategory = 'personal' | 'beauty' | 'health' | 'shopping' | 'work' | 'finance' | 'other';

export interface CalendarEvent {
  id: string;
  date: string; // 'YYYY-MM-DD'
  time?: string; // '15:00'
  title: string;
  category: EventCategory;
  amount?: number; // e.g. 1500 ₽
  completed: boolean;
  note?: string;
  color?: string;
}

// Finance & Budget Manager Types
export type TransactionType = 'income' | 'expense';

export interface FinanceTransaction {
  id: string;
  date: string; // 'YYYY-MM-DD'
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  paymentMethod?: string;
}

// Financial Goals (Цели накоплений)
export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  color: string;
  note?: string;
}

// Bank Deposits & Savings Accounts (Вклады и Накопительные счета)
export interface BankDeposit {
  id: string;
  title: string;
  bankName: string;
  balance: number;
  interestRate: number; // % годовых
  startDate: string;
  endDate?: string;
  capitalization: boolean;
  payoutFrequency: 'monthly' | 'at_maturity';
  notes?: string;
  color: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type ThemePreset =
  | 'obsidian'
  | 'midnight'
  | 'emerald'
  | 'amethyst'
  | 'monochrome'
  | 'sunset'
  | 'rose'
  | 'cyan'
  | 'light_snow'
  | 'light_paper'
  | 'light_nord'
  | 'custom';

export interface UICustomizationSettings {
  accentColor: string;
  bgPrimary: string;
  bgSecondary: string;
  fontFamily: 'sans' | 'mono' | 'serif' | 'jetbrains' | 'fira';
  fontSize: 'sm' | 'md' | 'lg';
  editorFontSize: number;
  borderRadius: 'sharp' | 'medium' | 'rounded';
  glassmorphism: boolean;
  neonGlow: boolean;
}

export const THEME_CONFIGS: Record<ThemePreset, {
  name: string;
  desc: string;
  bgPrimary: string;
  bgSecondary: string;
  accent: string;
  accentSubtle: string;
  border: string;
  mode: 'dark' | 'light';
}> = {
  obsidian: {
    name: 'Obsidian Onyx (По умолчанию)',
    desc: 'Глубокий матовый оникс с фиолетовыми нейро-акцентами',
    bgPrimary: '#0d0e12',
    bgSecondary: '#13141a',
    accent: '#7c5cff',
    accentSubtle: 'rgba(124, 92, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.10)',
    mode: 'dark',
  },
  midnight: {
    name: 'Midnight Cyber (Киберпанк)',
    desc: 'Глубокий ночной синий с электрическим циановым свечением',
    bgPrimary: '#090d16',
    bgSecondary: '#0f172a',
    accent: '#38bdf8',
    accentSubtle: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.20)',
    mode: 'dark',
  },
  emerald: {
    name: 'Emerald Matrix (Бионика)',
    desc: 'Графитовый сланец с живыми изумрудными акцентами',
    bgPrimary: '#0a100d',
    bgSecondary: '#111c16',
    accent: '#10b981',
    accentSubtle: 'rgba(16, 185, 129, 0.15)',
    border: 'rgba(16, 185, 129, 0.20)',
    mode: 'dark',
  },
  amethyst: {
    name: 'Amethyst Deep (Нео-фиолетовый)',
    desc: 'Темный аметистовый бархат с неоновым свечением',
    bgPrimary: '#100b18',
    bgSecondary: '#181224',
    accent: '#a855f7',
    accentSubtle: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.20)',
    mode: 'dark',
  },
  sunset: {
    name: 'Sunset Amber (Теплое золото)',
    desc: 'Темный шоколадный фон с яркими золотисто-янтарными акцентами',
    bgPrimary: '#120d09',
    bgSecondary: '#1a130e',
    accent: '#f59e0b',
    accentSubtle: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.20)',
    mode: 'dark',
  },
  rose: {
    name: 'Rose Quartz (Неоновый корунд)',
    desc: 'Глубокий рубиновый графит с неоново-розовыми акцентами',
    bgPrimary: '#140a12',
    bgSecondary: '#1f101d',
    accent: '#ec4899',
    accentSubtle: 'rgba(236, 72, 153, 0.15)',
    border: 'rgba(236, 72, 153, 0.20)',
    mode: 'dark',
  },
  cyan: {
    name: 'Ocean Abyssal (Океаническая глубина)',
    desc: 'Ультрамариновый морской фон с лазурными акцентами',
    bgPrimary: '#071015',
    bgSecondary: '#0c1a24',
    accent: '#06b6d4',
    accentSubtle: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.20)',
    mode: 'dark',
  },
  monochrome: {
    name: 'Monochrome Studio (Контраст)',
    desc: 'Чистый черный монохром с четким белым шрифтом',
    bgPrimary: '#000000',
    bgSecondary: '#111111',
    accent: '#94a3b8',
    accentSubtle: 'rgba(148, 163, 184, 0.15)',
    border: 'rgba(255, 255, 255, 0.18)',
    mode: 'dark',
  },
  light_snow: {
    name: 'Чистый Альпийский Белый (Light Snow)',
    desc: 'Белоснежный минималистичный интерфейс с мягкими границами',
    bgPrimary: '#f8fafc',
    bgSecondary: '#ffffff',
    accent: '#7c5cff',
    accentSubtle: 'rgba(124, 92, 255, 0.12)',
    border: 'rgba(0, 0, 0, 0.08)',
    mode: 'light',
  },
  light_paper: {
    name: 'Теплый Пергамент (Paper Studio)',
    desc: 'Теплый бумажный оттенок для комфортного долгого чтения',
    bgPrimary: '#fbfbfa',
    bgSecondary: '#f4f4f0',
    accent: '#0284c7',
    accentSubtle: 'rgba(2, 132, 199, 0.12)',
    border: 'rgba(0, 0, 0, 0.09)',
    mode: 'light',
  },
  light_nord: {
    name: 'Северный Светлый (Nordic Frost)',
    desc: 'Прохладная нордическая светлая тема с индиго-акцентами',
    bgPrimary: '#f1f5f9',
    bgSecondary: '#ffffff',
    accent: '#4f46e5',
    accentSubtle: 'rgba(79, 70, 229, 0.12)',
    border: 'rgba(0, 0, 0, 0.08)',
    mode: 'light',
  },
  custom: {
    name: 'Custom Palette (Пользовательская)',
    desc: 'Ваша индивидуальная палитра цветов и элементов',
    bgPrimary: '#0d0e12',
    bgSecondary: '#14151c',
    accent: '#7c5cff',
    accentSubtle: 'rgba(124, 92, 255, 0.15)',
    border: 'rgba(255, 255, 255, 0.10)',
    mode: 'dark',
  },
};

export function applyThemeToDOM(
  theme: ThemePreset,
  custom?: Partial<UICustomizationSettings>,
  mode: ThemeMode = 'dark'
) {
  if (typeof document === 'undefined') return;

  const isSystemDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const isLightMode =
    mode === 'light' ||
    (mode === 'system' && !isSystemDark) ||
    theme.startsWith('light_');

  const activeThemeKey: ThemePreset =
    isLightMode && !theme.startsWith('light_') && theme !== 'custom'
      ? 'light_snow'
      : !isLightMode && theme.startsWith('light_')
      ? 'obsidian'
      : theme;

  const cfg = THEME_CONFIGS[activeThemeKey] || THEME_CONFIGS.obsidian;
  const root = document.documentElement;

  const accent = custom?.accentColor || cfg.accent;
  const bgPrimary = custom?.bgPrimary || cfg.bgPrimary;
  const bgSecondary = custom?.bgSecondary || cfg.bgSecondary;

  const fontFam =
    custom?.fontFamily === 'jetbrains'
      ? '"JetBrains Mono", monospace'
      : custom?.fontFamily === 'fira'
      ? '"Fira Code", monospace'
      : custom?.fontFamily === 'mono'
      ? 'monospace'
      : custom?.fontFamily === 'serif'
      ? 'Georgia, serif'
      : 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  const fontScale = custom?.fontSize === 'sm' ? '12px' : custom?.fontSize === 'lg' ? '15px' : '13px';
  const editorScale = custom?.editorFontSize ? `${custom.editorFontSize}px` : '14px';
  const radius = custom?.borderRadius === 'sharp' ? '4px' : custom?.borderRadius === 'rounded' ? '14px' : '8px';
  const radiusLg = custom?.borderRadius === 'sharp' ? '6px' : custom?.borderRadius === 'rounded' ? '18px' : '12px';
  const glass = custom?.glassmorphism !== false;
  const glow = custom?.neonGlow !== false;

  root.setAttribute('data-theme', activeThemeKey);
  root.setAttribute('data-mode', isLightMode ? 'light' : 'dark');

  if (isLightMode) {
    root.classList.remove('dark');
    root.classList.add('light');
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
  }

  root.style.setProperty('--color-bg-primary', bgPrimary);
  root.style.setProperty('--color-bg-secondary', bgSecondary);
  root.style.setProperty('--color-iris', accent);
  root.style.setProperty('--border-default', cfg.border);

  let styleTag = document.getElementById('neirono-dynamic-theme-style');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'neirono-dynamic-theme-style';
    document.head.appendChild(styleTag);
  }

  const textColor = isLightMode ? '#0f172a' : '#e2e8f0';

  styleTag.textContent = `
    :root {
      font-family: ${fontFam} !important;
      font-size: ${fontScale};
      --color-bg-primary: ${bgPrimary};
      --color-bg-secondary: ${bgSecondary};
      --color-iris: ${accent};
    }
    body, #root {
      font-family: ${fontFam} !important;
    }
    nav, aside {
      font-family: ${fontFam} !important;
    }
    input, select, textarea {
      font-family: inherit;
    }
    .rounded-xl, .rounded-2xl {
      border-radius: ${radiusLg} !important;
    }
    .rounded-lg, .rounded-md {
      border-radius: ${radius} !important;
    }
    ${!isLightMode ? `
      body, #root {
        background-color: ${bgPrimary} !important;
        color: ${textColor} !important;
      }
      .bg-\\[\\#090a0e\\],
      .bg-\\[\\#0a0b0e\\],
      .bg-\\[\\#0d0e12\\],
      .bg-\\[\\#0e0f13\\],
      .bg-\\[\\#0f1015\\],
      .bg-\\[\\#111217\\] {
        background-color: ${bgPrimary} !important;
      }
      .bg-\\[\\#12131a\\],
      .bg-\\[\\#13141a\\],
      .bg-\\[\\#14151c\\],
      .bg-\\[\\#161720\\],
      .bg-\\[\\#161722\\],
      .bg-\\[\\#171822\\],
      .bg-\\[\\#191a22\\] {
        background-color: ${bgSecondary} !important;
      }
    ` : ''}
    .bg-\\[\\#7c5cff\\] {
      background-color: ${accent} !important;
    }
    .bg-\\[\\#7c5cff\\]\\/20,
    .bg-\\[\\#7c5cff\\]\\/15,
    .bg-\\[\\#7c5cff\\]\\/10 {
      background-color: ${accent}26 !important;
    }
    .text-\\[\\#7c5cff\\] {
      color: ${accent} !important;
    }
    .border-\\[\\#7c5cff\\] {
      border-color: ${accent} !important;
    }
    .ring-\\[\\#7c5cff\\] {
      --tw-ring-color: ${accent} !important;
    }
    textarea, .prose-dark {
      font-size: ${editorScale} !important;
    }
    ${glow && !isLightMode ? `
      .neon-glow, .bg-\\[\\#7c5cff\\] {
        box-shadow: 0 0 15px ${accent}40 !important;
      }
    ` : ''}
    ${glass ? `
      .backdrop-blur-md, .backdrop-blur-xl {
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
      }
    ` : ''}
  `;
}

// Attach system theme change listener if available
if (typeof window !== 'undefined' && window.matchMedia) {
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const state = useBrainStore?.getState?.();
      if (state && state.themeMode === 'system') {
        applyThemeToDOM(state.themePreset, state.uiSettings, 'system');
      }
    });
  } catch (e) {
    // Ignore in non-browser env
  }
}

interface BrainState {
  // Vault Data
  vaultName: string;
  neurons: Neuron[];
  folders: FolderItem[];
  
  // Navigation & Tabs
  tabs: TabItem[];
  activeTabId: string;
  activeRibbonView: RibbonView;
  navigationHistory: string[];
  historyIndex: number;
  
  // Selection & Interactions
  activeNeuronId: string | null;
  hoveredNeuronId: string | null;
  selectedTag: string | null;
  spiderMode: boolean;
  
  // Sidebars visibility
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  rightSidebarTab: 'backlinks' | 'graph-settings' | 'ai-copilot';
  isStatusBarVisible: boolean;
  
  // Theme & Appearance
  themePreset: ThemePreset;
  themeMode: ThemeMode;
  uiSettings: UICustomizationSettings;
  autoLoadCalendarShifts: boolean;
  
  // Modals & Guide
  isSearchOpen: boolean;
  isSettingsOpen: boolean;
  isSyncOpen: boolean;
  isQuizOpen: boolean;
  isAIOpen: boolean;
  isNotebookLMOpen: boolean;
  isManualOpen: boolean;
  notebookLMUrl: string;
  
  // Search & Physics
  searchQuery: string;
  searchEngine: HybridSearchEngine;
  graphSettings: GraphPhysicsSettings;
  aiSettings: AISettings;
  p2pConnectedPeers: string[];

  // Canvas Whiteboard Data
  canvasCards: CanvasCard[];
  canvasConnections: CanvasConnection[];

  // Work Shifts & Calendar Data
  shifts: WorkShift[];
  shiftSettings: ShiftSettings;
  calendarEvents: CalendarEvent[];

  // Finance Module Data
  transactions: FinanceTransaction[];
  monthlyBudgetLimit: number;
  savingsGoals: SavingsGoal[];
  bankDeposits: BankDeposit[];

  // Navigation History Actions
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => void;
  goForward: () => void;

  // Actions
  setVaultName: (name: string) => void;
  openTab: (tab: Omit<TabItem, 'id'>) => void;
  closeTab: (tabId: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  setActiveRibbonView: (view: RibbonView) => void;
  
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setRightSidebarTab: (tab: 'backlinks' | 'graph-settings' | 'ai-copilot') => void;
  
  selectNeuron: (id: string | null) => void;
  openNote: (id: string) => void;
  setHoveredNeuron: (id: string | null) => void;
  setSelectedTag: (tag: string | null) => void;
  toggleSpiderMode: () => void;
  
  setSearchOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setSyncOpen: (open: boolean) => void;
  setQuizOpen: (open: boolean) => void;
  setAIOpen: (open: boolean) => void;
  setNotebookLMOpen: (open: boolean) => void;
  setManualOpen: (open: boolean) => void;
  setNotebookLMUrl: (url: string) => void;
  setSearchQuery: (q: string) => void;
  
  setThemePreset: (theme: ThemePreset) => void;
  setThemeMode: (mode: ThemeMode) => void;
  updateUISettings: (settings: Partial<UICustomizationSettings>) => void;
  setAutoLoadCalendarShifts: (val: boolean) => void;
  toggleStatusBar: () => void;
  
  updateGraphSettings: (settings: Partial<GraphPhysicsSettings>) => void;
  updateAISettings: (settings: Partial<AISettings>) => void;
  
  // Note CRUD
  addNeuron: (title?: string, content?: string, folderName?: string) => Neuron;
  updateNeuron: (id: string, updates: Partial<Neuron>) => void;
  deleteNeuron: (id: string) => void;
  togglePin: (id: string) => void;
  setLearningState: (id: string, state: LearningState) => void;
  recordAccess: (id: string) => void;
  
  // Folders & Structure
  toggleFolder: (id: string) => void;
  addFolder: (name: string) => void;
  deleteFolder: (folderName: string, deleteNotes?: boolean) => void;
  renameFolder: (oldName: string, newName: string) => void;
  moveNoteToFolder: (noteId: string, targetFolderName: string | null) => void;

  // Canvas Actions
  addCanvasCard: (card: Omit<CanvasCard, 'id'>) => CanvasCard;
  addCanvasSticker: (text?: string, color?: string, x?: number, y?: number) => CanvasCard;
  clearCanvas: () => void;
  updateCanvasCard: (id: string, updates: Partial<CanvasCard>) => void;
  deleteCanvasCard: (id: string) => void;
  addCanvasConnection: (conn: Omit<CanvasConnection, 'id'>) => void;
  deleteCanvasConnection: (id: string) => void;
  autoLayoutCanvas: () => void;

  // Shift & Calendar Actions
  addOrUpdateShift: (shift: Omit<WorkShift, 'id' | 'earnings'> & { id?: string }) => void;
  deleteShift: (date: string) => void;
  updateShiftSettings: (settings: Partial<ShiftSettings>) => void;
  generateShiftSchedule: (startDate: string, pattern: '2/2' | '3/3' | '5/2' | '1/3' | '1/2', countDays: number, shiftType: ShiftType) => void;
  generateCustomCycleSchedule: (
    startDate: string,
    cycleSequence: ShiftType[],
    countDays: number,
    customConfig?: {
      rate?: number;
      rateType?: 'hourly' | 'fixed';
      dayHours?: number;
      fullHours?: number;
    }
  ) => void;

  // Calendar Events Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  toggleCalendarEvent: (id: string) => void;

  // Finance Actions
  addTransaction: (tx: Omit<FinanceTransaction, 'id'>) => FinanceTransaction;
  updateTransaction: (id: string, updates: Partial<FinanceTransaction>) => void;
  deleteTransaction: (id: string) => void;
  setMonthlyBudgetLimit: (limit: number) => void;
  importSalaryFromShifts: (monthPrefix: string) => void;

  // Savings Goals & Deposits Actions
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => SavingsGoal;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  depositToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;

  addBankDeposit: (deposit: Omit<BankDeposit, 'id'>) => BankDeposit;
  updateBankDeposit: (id: string, updates: Partial<BankDeposit>) => void;
  deleteBankDeposit: (id: string) => void;
  updateDepositBalance: (id: string, newBalance: number) => void;

  // Sync & Export
  applySyncDelta: (delta: SyncDelta) => void;
  loadVault: (neurons: Neuron[]) => void;
  exportVaultJSON: () => string;
}

export function resolveGraphConnections(neurons: Neuron[]): Neuron[] {
  const titleToIdMap = new Map<string, string>();
  neurons.forEach((n) => {
    titleToIdMap.set(n.title.toLowerCase().trim(), n.id);
  });

  return neurons.map((n) => {
    const outlinks: string[] = [];
    (n.wikiLinks || []).forEach((linkTitle) => {
      const targetId = titleToIdMap.get(linkTitle.toLowerCase().trim());
      if (targetId && targetId !== n.id && !outlinks.includes(targetId)) {
        outlinks.push(targetId);
      }
    });

    return {
      ...n,
      outlinks,
    };
  }).map((n, _, all) => {
    const backlinks: string[] = [];
    all.forEach((other) => {
      if (other.outlinks?.includes(n.id) && !backlinks.includes(other.id)) {
        backlinks.push(other.id);
      }
    });

    return {
      ...n,
      backlinks,
    };
  });
}

const initialWithLinks = resolveGraphConnections(INITIAL_NEURONS);
const initialEngine = new HybridSearchEngine();
initialEngine.indexAll(initialWithLinks);

const defaultFolders: FolderItem[] = [];

const initialTabs: TabItem[] = [
  { id: 'tab_graph', type: 'graph', title: 'Граф' },
];

const initialCanvasCards: CanvasCard[] = [];
const initialCanvasConnections: CanvasConnection[] = [];

const initialShiftSettings: ShiftSettings = {
  defaultHourlyRate: 450,
  defaultFixedRate: 5400,
  defaultRateType: 'hourly',
  defaultDayHours: 12,
  defaultNightHours: 12,
  defaultFullHours: 24,
  currency: '₽',
};

const generateInitialShifts = (): WorkShift[] => [];
const generateInitialEvents = (): CalendarEvent[] => [];
const generateInitialTransactions = (): FinanceTransaction[] => [];
const initialSavingsGoals: SavingsGoal[] = [];
const initialBankDeposits: BankDeposit[] = [];

// Debounced Indexing Timer for 0ms Input Latency
let debouncedIndexTimer: any = null;

function triggerDebouncedGraphResolution(get: () => BrainState, set: (partial: Partial<BrainState>) => void) {
  if (debouncedIndexTimer) clearTimeout(debouncedIndexTimer);
  debouncedIndexTimer = setTimeout(() => {
    const current = get().neurons;
    const resolved = resolveGraphConnections(current);
    get().searchEngine.indexAll(resolved);
    set({ neurons: resolved });
  }, 200);
}

export const useBrainStore = create<BrainState>()(
  persist(
    (set, get) => ({
      vaultName: 'НейроноБлокнот',
      neurons: initialWithLinks,
      folders: defaultFolders,
      
      tabs: initialTabs,
      activeTabId: 'tab_graph',
      activeRibbonView: 'explorer',
      navigationHistory: ['tab_graph'],
      historyIndex: 0,
      
      activeNeuronId: initialWithLinks[0]?.id || null,
      hoveredNeuronId: null,
      selectedTag: null,
      spiderMode: false,
      
      isLeftSidebarOpen: true,
      isRightSidebarOpen: true,
      rightSidebarTab: 'graph-settings',
      isStatusBarVisible: true,
      
      themePreset: 'obsidian',
      themeMode: 'dark',
      uiSettings: {
        accentColor: '#7c5cff',
        bgPrimary: '#0d0e12',
        bgSecondary: '#14151c',
        fontFamily: 'sans',
        fontSize: 'md',
        editorFontSize: 14,
        borderRadius: 'medium',
        glassmorphism: true,
        neonGlow: true,
      },
      autoLoadCalendarShifts: true,
      
      isSearchOpen: false,
      isSettingsOpen: false,
      isSyncOpen: false,
      isQuizOpen: false,
      isAIOpen: false,
      isNotebookLMOpen: false,
      isManualOpen: false,
      notebookLMUrl: 'https://notebooklm.google.com/',
      
      searchQuery: '',
      searchEngine: initialEngine,
      
      graphSettings: {
        nodeSize: 1.0,
        linkDistance: 60,
        repulsion: -75,
        centerGravity: 0.12,
        showLabels: true,
        showArrows: true,
        filterText: '',
        colorScheme: 'default',
      },
      
      aiSettings: {
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '',
        model: 'gpt-4o-mini',
        temperature: 0.7,
      },
      p2pConnectedPeers: ['Local Wi-Fi / Bluetooth (Ready)'],

      canvasCards: initialCanvasCards,
      canvasConnections: initialCanvasConnections,

      shifts: generateInitialShifts(),
      shiftSettings: initialShiftSettings,
      calendarEvents: generateInitialEvents(),

      transactions: generateInitialTransactions(),
      monthlyBudgetLimit: 60000,
      savingsGoals: initialSavingsGoals,
      bankDeposits: initialBankDeposits,

      canGoBack: () => get().historyIndex > 0,
      canGoForward: () => get().historyIndex < get().navigationHistory.length - 1,

      goBack: () => {
        const { historyIndex, navigationHistory, tabs } = get();
        if (historyIndex > 0) {
          const prevIndex = historyIndex - 1;
          const targetTabId = navigationHistory[prevIndex];
          const targetTab = tabs.find((t) => t.id === targetTabId);
          if (targetTab) {
            set({
              historyIndex: prevIndex,
              activeTabId: targetTab.id,
              activeNeuronId: targetTab.noteId || get().activeNeuronId,
            });
          }
        }
      },

      goForward: () => {
        const { historyIndex, navigationHistory, tabs } = get();
        if (historyIndex < navigationHistory.length - 1) {
          const nextIndex = historyIndex + 1;
          const targetTabId = navigationHistory[nextIndex];
          const targetTab = tabs.find((t) => t.id === targetTabId);
          if (targetTab) {
            set({
              historyIndex: nextIndex,
              activeTabId: targetTab.id,
              activeNeuronId: targetTab.noteId || get().activeNeuronId,
            });
          }
        }
      },

      setVaultName: (name) => set({ vaultName: name }),

      openTab: (newTab) => {
        const { tabs, navigationHistory, historyIndex } = get();

        const existing = tabs.find(
          (t) =>
            (newTab.noteId && t.noteId === newTab.noteId) ||
            (newTab.type === 'graph' && t.type === 'graph') ||
            (newTab.type === 'canvas' && t.type === 'canvas') ||
            (newTab.type === 'calendar' && t.type === 'calendar') ||
            (newTab.type === 'finance' && t.type === 'finance') ||
            (newTab.type === 'database' && t.type === 'database')
        );

        if (existing) {
          const newHistory = navigationHistory.slice(0, historyIndex + 1);
          newHistory.push(existing.id);

          set({
            activeTabId: existing.id,
            activeNeuronId: existing.noteId || get().activeNeuronId,
            navigationHistory: newHistory,
            historyIndex: newHistory.length - 1,
          });
          return;
        }

        const tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        const tab: TabItem = { ...newTab, id: tabId };
        const newTabs = [...tabs, tab];
        const newHistory = navigationHistory.slice(0, historyIndex + 1);
        newHistory.push(tabId);

        set({
          tabs: newTabs,
          activeTabId: tabId,
          activeNeuronId: newTab.noteId || get().activeNeuronId,
          navigationHistory: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      closeTab: (tabId) => {
        const { tabs, activeTabId, navigationHistory, historyIndex } = get();
        if (tabs.length === 1) return;

        const newTabs = tabs.filter((t) => t.id !== tabId);
        let nextActiveId = activeTabId;

        if (activeTabId === tabId) {
          const closedIndex = tabs.findIndex((t) => t.id === tabId);
          const nextTab = newTabs[Math.max(0, closedIndex - 1)];
          nextActiveId = nextTab ? nextTab.id : newTabs[0]!.id;
        }

        const newHistory = navigationHistory.filter((id) => id !== tabId);
        const nextIndex = Math.min(historyIndex, newHistory.length - 1);

        set({
          tabs: newTabs,
          activeTabId: nextActiveId,
          navigationHistory: newHistory,
          historyIndex: nextIndex,
        });
      },

      closeAllTabs: () => {
        const defaultTab: TabItem = { id: 'tab_graph', type: 'graph', title: 'Граф' };
        set({
          tabs: [defaultTab],
          activeTabId: 'tab_graph',
          navigationHistory: ['tab_graph'],
          historyIndex: 0,
        });
      },

      closeOtherTabs: (keepTabId) => {
        const { tabs } = get();
        const kept = tabs.filter((t) => t.id === keepTabId);
        if (kept.length > 0) {
          set({
            tabs: kept,
            activeTabId: keepTabId,
            navigationHistory: [keepTabId],
            historyIndex: 0,
          });
        }
      },

      setActiveTab: (tabId) => {
        const { tabs, navigationHistory, historyIndex } = get();
        const tab = tabs.find((t) => t.id === tabId);
        if (!tab) return;

        const newHistory = navigationHistory.slice(0, historyIndex + 1);
        newHistory.push(tabId);

        set({
          activeTabId: tabId,
          activeNeuronId: tab.noteId || get().activeNeuronId,
          navigationHistory: newHistory,
          historyIndex: newHistory.length - 1,
        });
      },

      setActiveRibbonView: (view) => set({ activeRibbonView: view }),
      toggleLeftSidebar: () => set((s) => ({ isLeftSidebarOpen: !s.isLeftSidebarOpen })),
      toggleRightSidebar: () => set((s) => ({ isRightSidebarOpen: !s.isRightSidebarOpen })),
      setRightSidebarTab: (tab) => set({ rightSidebarTab: tab, isRightSidebarOpen: true }),

      selectNeuron: (id) => {
        set({ activeNeuronId: id });
        if (id) {
          get().recordAccess(id);
        }
      },

      openNote: (id: string) => {
        const neuron = get().neurons.find((n) => n.id === id);
        if (neuron) {
          get().selectNeuron(neuron.id);
          get().openTab({ type: 'note', noteId: neuron.id, title: neuron.title });
        }
      },

      setHoveredNeuron: (id) => set({ hoveredNeuronId: id }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
      toggleSpiderMode: () => set((s) => ({ spiderMode: !s.spiderMode })),

      setSearchOpen: (open) => set({ isSearchOpen: open }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setSyncOpen: (open) => set({ isSyncOpen: open }),
      setQuizOpen: (open) => set({ isQuizOpen: open }),
      setAIOpen: (open) => set({ isAIOpen: open }),
      setNotebookLMOpen: (open) => set({ isNotebookLMOpen: open }),
      setManualOpen: (open) => set({ isManualOpen: open }),
      setNotebookLMUrl: (url) => set({ notebookLMUrl: url }),
      setSearchQuery: (q) => set({ searchQuery: q }),

      setThemeMode: (mode) => {
        applyThemeToDOM(get().themePreset, get().uiSettings, mode);
        set({ themeMode: mode });
      },

      setThemePreset: (theme) => {
        const isLight = theme.startsWith('light_');
        const nextMode: ThemeMode = isLight ? 'light' : get().themeMode === 'light' ? 'dark' : get().themeMode;
        applyThemeToDOM(theme, get().uiSettings, nextMode);
        set({ themePreset: theme, themeMode: nextMode });
      },

      updateUISettings: (settings) => {
        const next = { ...get().uiSettings, ...settings };
        set({ uiSettings: next });
        applyThemeToDOM(get().themePreset, next, get().themeMode);
      },

      setAutoLoadCalendarShifts: (val) => set({ autoLoadCalendarShifts: val }),
      toggleStatusBar: () => set((s) => ({ isStatusBarVisible: !s.isStatusBarVisible })),

      updateGraphSettings: (updates) =>
        set((state) => ({
          graphSettings: { ...state.graphSettings, ...updates },
        })),

      updateAISettings: (settings) =>
        set((state) => ({
          aiSettings: { ...state.aiSettings, ...settings },
        })),

      addNeuron: (rawTitle = 'Без названия', content = '', folderName) => {
        const defaultBody = content || '';
        const currentFolders = get().folders || [];
        let folder = folderName;
        if (!folder && currentFolders.length > 0) {
          folder = currentFolders[0].name;
        }

        // Auto-number duplicate or default note names
        let title = rawTitle.trim() || 'Без названия';
        const existingWithPrefix = get().neurons.filter((n) => {
          if (title === 'Без названия' || title === 'Новая заметка') {
            return n.title === 'Без названия' || /^Без названия \d+$/.test(n.title);
          }
          return n.title === title || n.title.startsWith(`${title} `);
        });

        if (existingWithPrefix.length > 0) {
          if (title === 'Без названия' || title === 'Новая заметка') {
            title = `Без названия ${existingWithPrefix.length + 1}`;
          } else {
            title = `${title} ${existingWithPrefix.length + 1}`;
          }
        }

        const neuronId = `neu_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
        const newNeuron: Neuron = {
          id: neuronId,
          filePath: folder ? `${folder}/${title.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_')}.md` : `${title.replace(/[^a-zA-Z0-9а-яА-ЯёЁ_-]/g, '_')}.md`,
          title,
          content: defaultBody,
          rawContent: defaultBody,
          frontmatter: {
            id: neuronId,
            title,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            tags: [],
            pinned: false,
            learning_state: 'new',
            activation_level: 0.5,
            access_count: 1,
            position: {
              x: (Math.random() - 0.5) * 20,
              y: (Math.random() - 0.5) * 20,
              z: 0,
            },
          },
          wikiLinks: [],
          backlinks: [],
          outlinks: [],
          tags: [],
          pinned: false,
          color: '#ffffff',
          learningState: 'new',
          activationLevel: 0.5,
          accessCount: 1,
          position: {
            x: (Math.random() - 0.5) * 20,
            y: (Math.random() - 0.5) * 20,
            z: 0,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updatedList = resolveGraphConnections([newNeuron, ...get().neurons]);
        get().searchEngine.indexAll(updatedList);

        set({
          neurons: updatedList,
          activeNeuronId: newNeuron.id,
        });

        get().openTab({ type: 'note', noteId: newNeuron.id, title: newNeuron.title });

        return newNeuron;
      },

      updateNeuron: (id, updates) => {
        const current = get().neurons;
        const idx = current.findIndex((n) => n.id === id);
        if (idx === -1) return;

        const existing = current[idx]!;
        const updated: Neuron = {
          ...existing,
          ...updates,
          updatedAt: Date.now(),
        };

        if (updates.title !== undefined) {
          updated.title = updates.title;
        }

        if (updates.content !== undefined) {
          const parsed = parseMarkdown(updates.content, updated.filePath);
          if (!updated.title || updated.title === 'Без названия' || updated.title === 'Новая заметка') {
            if (parsed.title) {
              updated.title = parsed.title;
            }
          }
          updated.wikiLinks = parsed.wikiLinks || [];
          if (parsed.tags && parsed.tags.length > 0) {
            updated.tags = Array.from(new Set([...updated.tags, ...parsed.tags]));
          }
        }

        const nextNeurons = [...current];
        nextNeurons[idx] = updated;

        const nextTabs = get().tabs.map((t) =>
          t.noteId === id ? { ...t, title: updated.title } : t
        );

        // Fast path: update note and tabs immediately for 0ms typing latency
        set({ neurons: nextNeurons, tabs: nextTabs });

        // Background debounced graph connection resolution and search re-indexing
        triggerDebouncedGraphResolution(get, set);
      },

      deleteNeuron: (id) => {
        const nextList = resolveGraphConnections(get().neurons.filter((n) => n.id !== id));
        get().searchEngine.indexAll(nextList);

        const nextTabs = get().tabs.filter((t) => t.noteId !== id);
        if (nextTabs.length === 0) {
          nextTabs.push({ id: 'tab_graph', type: 'graph', title: 'Граф' });
        }

        set({
          neurons: nextList,
          tabs: nextTabs,
          activeTabId: nextTabs[0]!.id,
          activeNeuronId: nextTabs[0]?.noteId || null,
        });
      },

      togglePin: (id) => {
        const neuron = get().neurons.find((n) => n.id === id);
        if (!neuron) return;
        const nextPinned = !neuron.pinned;
        get().updateNeuron(id, {
          pinned: nextPinned,
          color: nextPinned ? '#f59e0b' : '#ffffff',
        });
      },

      setLearningState: (id, state) => {
        const neuron = get().neurons.find((n) => n.id === id);
        if (!neuron) return;
        get().updateNeuron(id, {
          learningState: state,
          color: neuron.pinned ? '#f59e0b' : (state === 'mastered' ? '#10b981' : '#ffffff'),
        });
      },

      recordAccess: (id) => {
        const neuron = get().neurons.find((n) => n.id === id);
        if (!neuron) return;
        get().updateNeuron(id, {
          accessCount: (neuron.accessCount || 0) + 1,
          activationLevel: Math.min(1.0, (neuron.activationLevel || 0.5) + 0.1),
        });
      },

      toggleFolder: (id) => {
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, isOpen: !f.isOpen } : f
          ),
        }));
      },

      addFolder: (name) => {
        const newFolder: FolderItem = {
          id: `fld_${Date.now()}`,
          name: name.trim(),
          isOpen: true,
        };
        set((state) => ({ folders: [...state.folders, newFolder] }));
      },

      deleteFolder: (folderName, deleteNotes = false) => {
        const nextFolders = get().folders.filter((f) => f.name !== folderName);

        if (deleteNotes) {
          const notesToDelete = get().neurons.filter((n) => (n.filePath || '').startsWith(`${folderName}/`));
          const deleteIds = new Set(notesToDelete.map((n) => n.id));
          const nextNeurons = resolveGraphConnections(get().neurons.filter((n) => !deleteIds.has(n.id)));
          get().searchEngine.indexAll(nextNeurons);
          const nextTabs = get().tabs.filter((t) => !t.noteId || !deleteIds.has(t.noteId));
          if (nextTabs.length === 0) {
            nextTabs.push({ id: 'tab_graph', type: 'graph', title: 'Граф' });
          }
          set({
            folders: nextFolders,
            neurons: nextNeurons,
            tabs: nextTabs,
            activeTabId: nextTabs[0]!.id,
            activeNeuronId: nextTabs[0]?.noteId || null,
          });
        } else {
          // Move notes out of deleted folder into root
          const nextNeurons = get().neurons.map((n) => {
            if ((n.filePath || '').startsWith(`${folderName}/`)) {
              const fileName = (n.filePath || '').slice(folderName.length + 1);
              return { ...n, filePath: fileName };
            }
            return n;
          });
          set({
            folders: nextFolders,
            neurons: nextNeurons,
          });
        }
      },

      renameFolder: (oldName, newName) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === trimmed) return;
        const nextFolders = get().folders.map((f) =>
          f.name === oldName ? { ...f, name: trimmed } : f
        );
        const nextNeurons = get().neurons.map((n) => {
          if ((n.filePath || '').startsWith(`${oldName}/`)) {
            const rest = (n.filePath || '').slice(oldName.length + 1);
            return { ...n, filePath: `${trimmed}/${rest}` };
          }
          return n;
        });
        set({
          folders: nextFolders,
          neurons: nextNeurons,
        });
      },

      moveNoteToFolder: (noteId, targetFolderName) => {
        const neuron = get().neurons.find((n) => n.id === noteId);
        if (!neuron) return;
        const currentPath = neuron.filePath || '';
        const fileName = currentPath.includes('/')
          ? currentPath.split('/').pop() || `${neuron.title || 'Note'}.md`
          : (currentPath || `${neuron.title || 'Note'}.md`);
        const newPath = targetFolderName ? `${targetFolderName}/${fileName}` : fileName;
        get().updateNeuron(noteId, { filePath: newPath });
      },

      // Canvas Actions
      addCanvasCard: (card) => {
        const newCard: CanvasCard = {
          id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...card,
        };
        set((state) => ({ canvasCards: [...state.canvasCards, newCard] }));
        return newCard;
      },

      addCanvasSticker: (text = 'Новая мысль / Стикер', color = '#f59e0b', x, y) => {
        const defaultX = x !== undefined ? x : 150 + Math.random() * 200;
        const defaultY = y !== undefined ? y : 150 + Math.random() * 150;
        const newSticker: CanvasCard = {
          id: `stk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          x: defaultX,
          y: defaultY,
          width: 220,
          height: 180,
          type: 'sticky',
          title: 'Стикер',
          content: text,
          color: color || '#f59e0b',
        };
        set((state) => ({ canvasCards: [...state.canvasCards, newSticker] }));
        return newSticker;
      },

      clearCanvas: () => {
        set({ canvasCards: [], canvasConnections: [] });
      },

      updateCanvasCard: (id, updates) => {
        set((state) => ({
          canvasCards: state.canvasCards.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      deleteCanvasCard: (id) => {
        set((state) => ({
          canvasCards: state.canvasCards.filter((c) => c.id !== id),
          canvasConnections: state.canvasConnections.filter(
            (conn) => conn.fromNode !== id && conn.toNode !== id
          ),
        }));
      },

      addCanvasConnection: (conn) => {
        const exists = get().canvasConnections.some(
          (c) => c.fromNode === conn.fromNode && c.toNode === conn.toNode
        );
        if (exists) return;

        const newConn: CanvasConnection = {
          id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...conn,
        };
        set((state) => ({ canvasConnections: [...state.canvasConnections, newConn] }));
      },

      deleteCanvasConnection: (id) => {
        set((state) => ({
          canvasConnections: state.canvasConnections.filter((c) => c.id !== id),
        }));
      },

      autoLayoutCanvas: () => {
        const cards = get().canvasCards;
        const cols = Math.max(2, Math.ceil(Math.sqrt(cards.length)));
        const colWidth = 320;
        const rowHeight = 220;

        const layouted = cards.map((c, idx) => {
          const col = idx % cols;
          const row = Math.floor(idx / cols);
          return {
            ...c,
            x: 80 + col * colWidth,
            y: 80 + row * rowHeight,
          };
        });

        set({ canvasCards: layouted });
      },

      // Shifts Actions
      addOrUpdateShift: (shiftData) => {
        const earnings =
          shiftData.hours > 0
            ? (shiftData.rateType === 'hourly' ? shiftData.hours * shiftData.rate : shiftData.rate) + shiftData.bonus
            : 0;

        const currentShifts = get().shifts;
        const existingIndex = currentShifts.findIndex((s) => s.date === shiftData.date);

        if (existingIndex !== -1) {
          const updated: WorkShift = {
            ...currentShifts[existingIndex]!,
            ...shiftData,
            earnings,
          };
          const next = [...currentShifts];
          next[existingIndex] = updated;
          set({ shifts: next });
        } else {
          const newShift: WorkShift = {
            id: `shift_${shiftData.date}`,
            ...shiftData,
            earnings,
          };
          set({ shifts: [...currentShifts, newShift] });
        }
      },

      deleteShift: (date) => {
        set((state) => ({
          shifts: state.shifts.filter((s) => s.date !== date),
        }));
      },

      updateShiftSettings: (settings) => {
        set((state) => ({
          shiftSettings: { ...state.shiftSettings, ...settings },
        }));
      },

      generateShiftSchedule: (startDate, pattern, countDays, shiftType) => {
        const currentShifts = get().shifts;
        const settings = get().shiftSettings;
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const start = new Date(sYear!, (sMonth! - 1), sDay!, 12, 0, 0);

        let workSpan = 2;
        let restSpan = 2;

        if (pattern === '3/3') {
          workSpan = 3;
          restSpan = 3;
        } else if (pattern === '5/2') {
          workSpan = 5;
          restSpan = 2;
        } else if (pattern === '1/3') {
          workSpan = 1;
          restSpan = 3;
        } else if (pattern === '1/2') {
          workSpan = 1;
          restSpan = 2;
        }

        const totalCycle = workSpan + restSpan;
        const generatedDates = new Set<string>();
        const newGeneratedShifts: WorkShift[] = [];

        for (let i = 0; i < countDays; i++) {
          const curDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0);
          const yyyy = curDate.getFullYear();
          const mm = String(curDate.getMonth() + 1).padStart(2, '0');
          const dd = String(curDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          generatedDates.add(dateStr);

          const cycleDay = i % totalCycle;
          const isWork = cycleDay < workSpan;

          const type: ShiftType = isWork ? shiftType : 'off';
          const hours = isWork
            ? type === 'full'
              ? settings.defaultFullHours
              : settings.defaultDayHours
            : 0;

          const rate =
            settings.defaultRateType === 'hourly'
              ? settings.defaultHourlyRate
              : settings.defaultFixedRate;

          const earnings = isWork ? (settings.defaultRateType === 'hourly' ? hours * rate : rate) : 0;

          const newShift: WorkShift = {
            id: `shift_${dateStr}`,
            date: dateStr,
            type,
            hours,
            rateType: settings.defaultRateType,
            rate,
            bonus: 0,
            earnings,
            note: isWork ? `График ${pattern} (${type})` : 'Выходной',
          };
          newGeneratedShifts.push(newShift);
        }

        // Clean replacement: filter out any existing shifts that overlap with the new generated date range
        const preservedShifts = currentShifts.filter((s) => !generatedDates.has(s.date));
        set({ shifts: [...preservedShifts, ...newGeneratedShifts] });
      },

      generateCustomCycleSchedule: (startDate, cycleSequence, countDays, customConfig) => {
        if (!cycleSequence || cycleSequence.length === 0) return;
        const currentShifts = get().shifts;
        const settings = get().shiftSettings;
        const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
        const start = new Date(sYear!, (sMonth! - 1), sDay!, 12, 0, 0);
        
        const rateType = customConfig?.rateType ?? settings.defaultRateType;
        const rate = customConfig?.rate ?? (rateType === 'hourly' ? settings.defaultHourlyRate : settings.defaultFixedRate);
        const dayHours = customConfig?.dayHours ?? settings.defaultDayHours;
        const fullHours = customConfig?.fullHours ?? settings.defaultFullHours;

        const cycleLen = cycleSequence.length;
        const generatedDates = new Set<string>();
        const newGeneratedShifts: WorkShift[] = [];

        for (let i = 0; i < countDays; i++) {
          const curDate = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 12, 0, 0);
          const yyyy = curDate.getFullYear();
          const mm = String(curDate.getMonth() + 1).padStart(2, '0');
          const dd = String(curDate.getDate()).padStart(2, '0');
          const dateStr = `${yyyy}-${mm}-${dd}`;

          generatedDates.add(dateStr);

          const type: ShiftType = cycleSequence[i % cycleLen] || 'off';
          const isWork = type !== 'off' && type !== 'vacation';
          const hours = isWork
            ? type === 'full'
              ? fullHours
              : dayHours
            : 0;

          const earnings = isWork ? (rateType === 'hourly' ? hours * rate : rate) : 0;

          const newShift: WorkShift = {
            id: `shift_${dateStr}`,
            date: dateStr,
            type,
            hours,
            rateType,
            rate,
            bonus: 0,
            earnings,
            note: isWork ? `График (${type})` : 'Выходной',
          };
          newGeneratedShifts.push(newShift);
        }

        // Clean replacement: filter out any existing shifts in the generated range so it never overlaps or layers over old ones
        const preservedShifts = currentShifts.filter((s) => !generatedDates.has(s.date));
        set({ shifts: [...preservedShifts, ...newGeneratedShifts] });
      },

      // Calendar Events Actions
      addCalendarEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...eventData,
        };
        set((state) => ({ calendarEvents: [...state.calendarEvents, newEvent] }));
        return newEvent;
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      deleteCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        }));
      },

      toggleCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, completed: !e.completed } : e
          ),
        }));
      },

      // Finance Transactions Actions
      addTransaction: (txData) => {
        const newTx: FinanceTransaction = {
          id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...txData,
        };
        set((state) => ({ transactions: [newTx, ...state.transactions] }));
        return newTx;
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      setMonthlyBudgetLimit: (limit) => set({ monthlyBudgetLimit: limit }),

      importSalaryFromShifts: (monthPrefix) => {
        const shifts = get().shifts;
        const monthShifts = shifts.filter((s) => s.date.startsWith(monthPrefix));
        const totalEarnings = monthShifts.reduce((sum, s) => sum + s.earnings, 0);

        if (totalEarnings <= 0) {
          alert('В этом месяце нет начисленного заработка по сменам.');
          return;
        }

        const txDate = `${monthPrefix}-10`;
        const description = `Зарплата за ${monthShifts.filter((s) => s.hours > 0).length} смен`;
        const transactions = get().transactions;

        const existing = transactions.find((t) => t.date.startsWith(monthPrefix) && t.category === 'Зарплата за смены');
        if (existing) {
          get().updateTransaction(existing.id, { amount: totalEarnings, description });
        } else {
          get().addTransaction({
            date: txDate,
            type: 'income',
            category: 'Зарплата за смены',
            amount: totalEarnings,
            description,
            paymentMethod: 'Банковский перевод',
          });
        }
      },

      // Savings Goals Actions
      addSavingsGoal: (goalData) => {
        const newGoal: SavingsGoal = {
          id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...goalData,
        };
        set((state) => ({ savingsGoals: [...state.savingsGoals, newGoal] }));
        return newGoal;
      },

      updateSavingsGoal: (id, updates) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.map((g) =>
            g.id === id ? { ...g, ...updates } : g
          ),
        }));
      },

      deleteSavingsGoal: (id) => {
        set((state) => ({
          savingsGoals: state.savingsGoals.filter((g) => g.id !== id),
        }));
      },

      depositToGoal: (id, amount) => {
        const goal = get().savingsGoals.find((g) => g.id === id);
        if (!goal) return;
        const newAmount = Math.max(0, goal.currentAmount + amount);
        get().updateSavingsGoal(id, { currentAmount: newAmount });
      },

      withdrawFromGoal: (id, amount) => {
        const goal = get().savingsGoals.find((g) => g.id === id);
        if (!goal) return;
        const newAmount = Math.max(0, goal.currentAmount - amount);
        get().updateSavingsGoal(id, { currentAmount: newAmount });
      },

      // Bank Deposits Actions
      addBankDeposit: (depData) => {
        const newDeposit: BankDeposit = {
          id: `dep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          ...depData,
        };
        set((state) => ({ bankDeposits: [...state.bankDeposits, newDeposit] }));
        return newDeposit;
      },

      updateBankDeposit: (id, updates) => {
        set((state) => ({
          bankDeposits: state.bankDeposits.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      deleteBankDeposit: (id) => {
        set((state) => ({
          bankDeposits: state.bankDeposits.filter((d) => d.id !== id),
        }));
      },

      updateDepositBalance: (id, newBalance) => {
        get().updateBankDeposit(id, { balance: Math.max(0, newBalance) });
      },

      applySyncDelta: (delta) => {
        const currentMap = new Map(get().neurons.map((n) => [n.id, n]));
        delta.deletedIds.forEach((id) => currentMap.delete(id));
        delta.added.forEach((n) => currentMap.set(n.id, n));
        delta.updated.forEach((n) => currentMap.set(n.id, n));

        const combined = resolveGraphConnections(Array.from(currentMap.values()));
        get().searchEngine.indexAll(combined);
        set({ neurons: combined });
      },

      loadVault: (neurons) => {
        const resolved = resolveGraphConnections(neurons);
        get().searchEngine.indexAll(resolved);
        set({
          neurons: resolved,
          activeNeuronId: resolved[0]?.id || null,
        });
      },

      exportVaultJSON: () => {
        const data = {
          version: '1.2.0',
          vaultName: get().vaultName,
          exportedAt: new Date().toISOString(),
          merkleRoot: createMerkleRoot(
            get().neurons.map((n) => ({
              id: n.id,
              filePath: n.filePath,
              contentHash: computeHash(n.content),
              updatedAt: n.updatedAt,
            }))
          ),
          neurons: get().neurons,
          canvasCards: get().canvasCards,
          canvasConnections: get().canvasConnections,
          shifts: get().shifts,
          shiftSettings: get().shiftSettings,
          calendarEvents: get().calendarEvents,
          transactions: get().transactions,
          savingsGoals: get().savingsGoals,
          bankDeposits: get().bankDeposits,
        };
        return JSON.stringify(data, null, 2);
      },
    }),
    {
      name: 'neirono-vault-storage-v5',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vaultName: state.vaultName,
        neurons: state.neurons,
        folders: state.folders,
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        activeNeuronId: state.activeNeuronId,
        isLeftSidebarOpen: state.isLeftSidebarOpen,
        isRightSidebarOpen: state.isRightSidebarOpen,
        rightSidebarTab: state.rightSidebarTab,
        isStatusBarVisible: state.isStatusBarVisible,
        themePreset: state.themePreset,
        themeMode: state.themeMode,
        uiSettings: state.uiSettings,
        autoLoadCalendarShifts: state.autoLoadCalendarShifts,
        spiderMode: state.spiderMode,
        graphSettings: state.graphSettings,
        aiSettings: state.aiSettings,
        canvasCards: state.canvasCards,
        canvasConnections: state.canvasConnections,
        shifts: state.shifts,
        shiftSettings: state.shiftSettings,
        calendarEvents: state.calendarEvents,
        transactions: state.transactions,
        monthlyBudgetLimit: state.monthlyBudgetLimit,
        savingsGoals: state.savingsGoals,
        bankDeposits: state.bankDeposits,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('Error during storage rehydration:', error);
          return;
        }
        if (state) {
          try {
            // Apply loaded theme to DOM immediately
            applyThemeToDOM(
              state.themePreset || 'obsidian',
              state.uiSettings,
              state.themeMode || 'dark'
            );

            // Ensure search engine is properly instantiated
            if (!state.searchEngine || typeof state.searchEngine.indexAll !== 'function') {
              state.searchEngine = new HybridSearchEngine();
            }
            if (state.neurons && state.neurons.length > 0) {
              const resolved = resolveGraphConnections(state.neurons);
              state.neurons = resolved;
              state.searchEngine.indexAll(resolved);
            }
            if (!state.vaultName || state.vaultName === 'Psih Brain') {
              state.vaultName = 'НейроноБлокнот';
            }
            // Ensure default arrays exist
            if (!state.savingsGoals) state.savingsGoals = initialSavingsGoals;
            if (!state.bankDeposits) state.bankDeposits = initialBankDeposits;
            if (!state.calendarEvents) state.calendarEvents = generateInitialEvents();
            if (!state.transactions) state.transactions = generateInitialTransactions();
            if (!state.shifts) state.shifts = generateInitialShifts();
          } catch (e) {
            console.error('Failed to resolve graph on rehydrate:', e);
          }
        }
      },
    }
  )
);
