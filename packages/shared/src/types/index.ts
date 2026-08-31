export type LearningState = 'new' | 'learning' | 'review' | 'mastered';

export interface NeuronPosition {
  x: number;
  y: number;
  z: number;
}

export interface Synapse {
  targetId: string;
  weight?: number;
  kind?: 'prerequisite' | 'reinforces' | 'related' | 'contradicts';
  title?: string;
}

export interface NeuronFrontmatter {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
  pinned?: boolean;
  color_override?: string;
  activation_level?: number; // 0.0 to 1.0 (Hebbian activation)
  access_count?: number;     // Frequency of opening (LTP reinforcement)
  learning_state?: LearningState;
  position?: NeuronPosition;
  synapses?: Synapse[];
  [key: string]: unknown;
}

export interface Neuron {
  id: string;
  filePath: string;
  title: string;
  content: string;
  rawContent: string;
  frontmatter: NeuronFrontmatter;
  wikiLinks: string[];       // Target note titles extracted from [[Title]]
  backlinks: string[];       // IDs of notes linking to this one
  outlinks: string[];        // IDs of notes this one links to
  tags: string[];
  pinned: boolean;
  color: string;
  learningState: LearningState;
  activationLevel: number;
  accessCount: number;
  position: NeuronPosition;
  createdAt: number;
  updatedAt: number;
}

export interface SearchMatch {
  id: string;
  title: string;
  score: number;
  matchedField: 'title' | 'content' | 'tags';
  snippet?: string;
  highlightIndices?: [number, number][];
}

export interface MerkleLeaf {
  id: string;
  filePath: string;
  contentHash: string;
  updatedAt: number;
}

export interface SyncDelta {
  added: Neuron[];
  updated: Neuron[];
  deletedIds: string[];
  merkleRoot: string;
  timestamp: number;
  deviceId: string;
}

export interface ConflictRecord {
  neuronId: string;
  filePath: string;
  localContent: string;
  remoteContent: string;
  baseContent?: string;
  resolvedContent?: string;
  localTimestamp: number;
  remoteTimestamp: number;
}

export interface AIModelPresetItem {
  id: string;
  name: string;
  desc?: string;
  contextWindow?: string;
}

export interface AIProviderPreset {
  id: string;
  name: string;
  subtitle: string;
  category: 'cloud' | 'local' | 'aggregator';
  baseUrl: string;
  defaultModel: string;
  models: AIModelPresetItem[];
  description: string;
  keyPlaceholder: string;
  docsUrl: string;
  iconColor: string;
}

export const AI_PROVIDERS: AIProviderPreset[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    subtitle: 'GPT-4o & o3',
    category: 'cloud',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Сверхбыстрая и умная (по умолчанию)' },
      { id: 'gpt-4o', name: 'GPT-4o (Флагман)', desc: 'Высочайший интеллект и точность' },
      { id: 'o3-mini', name: 'o3-mini (Reasoning)', desc: 'Глубокое рассуждение и код' },
      { id: 'o1', name: 'o1 (Deep Reasoning)', desc: 'Максимальный логический анализ' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: '128k контекст' },
    ],
    description: 'Официальный API OpenAI (GPT-4o, o3-mini, o1)',
    keyPlaceholder: 'sk-proj-...',
    docsUrl: 'https://platform.openai.com/api-keys',
    iconColor: '#10a37f',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    subtitle: 'V3 & R1 CoT',
    category: 'cloud',
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek-V3', desc: 'Универсальная топ-модель' },
      { id: 'deepseek-reasoner', name: 'DeepSeek-R1', desc: 'Логическое рассуждение (Chain-of-Thought)' },
    ],
    description: 'Официальный API DeepSeek (мощный интеллект по доступной цене)',
    keyPlaceholder: 'sk-...',
    docsUrl: 'https://platform.deepseek.com',
    iconColor: '#4d6bfe',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    subtitle: 'Flash & Pro (Google AI)',
    category: 'cloud',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    defaultModel: 'gemini-3.7-flash',
    models: [
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', desc: 'Новейшая быстрая модель Google' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', desc: 'Высокая скорость отклика' },
      { id: 'gemini-3.1-pro', name: 'Gemini 3.1 Pro', desc: 'Глубокий анализ и рассуждения' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Стабильная Flash модель' },
    ],
    description: 'Официальный API Google Gemini (Google AI Studio)',
    keyPlaceholder: 'AIzaSy...',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    iconColor: '#38bdf8',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    subtitle: 'Claude & Llama',
    category: 'aggregator',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    models: [
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'Топ модель для текстов и кода' },
      { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', desc: 'Быстрый и умный Claude' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', desc: 'Reasoning модель' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', desc: 'Флагманский DeepSeek' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B', desc: 'Модель Meta' },
      { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', desc: 'Google Gemini' },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', desc: 'Отличный русский язык' },
    ],
    description: 'Единый шлюз ко всем мировым нейросетям (Claude, GPT, DeepSeek, Llama)',
    keyPlaceholder: 'sk-or-v1-...',
    docsUrl: 'https://openrouter.ai/keys',
    iconColor: '#8b5cf6',
  },
  {
    id: 'groq',
    name: 'Groq LPU',
    subtitle: '500+ ток/сек',
    category: 'cloud',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', desc: '500+ токенов/сек' },
      { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill 70B', desc: 'Мгновенные рассуждения' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', desc: 'Контекст 32k' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', desc: 'Компактная быстрая модель Google' },
    ],
    description: 'Аппаратное LPU-ускорение (самый быстрый отклик в мире)',
    keyPlaceholder: 'gsk_...',
    docsUrl: 'https://console.groq.com/keys',
    iconColor: '#f97316',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    subtitle: '100% Локально',
    category: 'local',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.2',
    models: [
      { id: 'llama3.2', name: 'Llama 3.2 (3B/1B)', desc: 'Локальная модель Meta' },
      { id: 'deepseek-r1:8b', name: 'DeepSeek-R1 (8B)', desc: 'Локальный DeepSeek' },
      { id: 'mistral', name: 'Mistral 7B', desc: 'Популярная европейская модель' },
      { id: 'qwen2.5:7b', name: 'Qwen 2.5 (7B)', desc: 'Высокое качество на русском' },
    ],
    description: '100% локально и конфиденциально, без интернета и без API ключа',
    keyPlaceholder: 'Не требуется (оставьте пустым)',
    docsUrl: 'https://ollama.com',
    iconColor: '#e2e8f0',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    subtitle: 'Порт 1234 GUI',
    category: 'local',
    baseUrl: 'http://localhost:1234/v1',
    defaultModel: 'local-model',
    models: [
      { id: 'local-model', name: 'Текущая модель в LM Studio', desc: 'Загруженная в GUI' },
    ],
    description: 'Локальный сервер через приложение LM Studio (порт 1234)',
    keyPlaceholder: 'Не требуется (любой текст)',
    docsUrl: 'https://lmstudio.ai',
    iconColor: '#06b6d4',
  },
  {
    id: 'custom',
    name: 'Свой API',
    subtitle: 'Custom / Proxy',
    category: 'cloud',
    baseUrl: '',
    defaultModel: '',
    models: [],
    description: 'Любой собственный OpenAI-совместимый эндпоинт',
    keyPlaceholder: 'Ваш API ключ...',
    docsUrl: '',
    iconColor: '#ec4899',
  },
];

export interface AISettings {
  providerId?: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens?: number;
  systemPrompt?: string;
  customHeaders?: Record<string, string>;
}

export interface AIModelInfo {
  id: string;
  name?: string;
  description?: string;
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface QuizCard {
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  sourceNeuronId: string;
}

export interface BookChapterSummary {
  chapterTitle: string;
  coreInsight: string;
  keyPoints: string[];
  generatedNeuronIds?: string[];
}

export interface ShiftRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'day' | 'night' | 'full24' | 'custom' | 'off';
  hours: number;
  earnings: number;
  note?: string;
  expenses?: number;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color?: string;
  category?: string;
}

export interface BankDeposit {
  id: string;
  bankName: string;
  principal: number;
  interestRate: number; // % annual
  termMonths: number;
  startDate: string;
  isCapitalized?: boolean;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
}

export interface CanvasSticky {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text: string;
  updatedAt: number;
}

