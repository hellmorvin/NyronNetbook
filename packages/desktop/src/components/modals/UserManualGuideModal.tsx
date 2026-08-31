import React, { useState } from 'react';
import {
  X,
  Keyboard,
  Calendar,
  Wifi,
  Radio,
  Smartphone,
  Sparkles,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileText,
  DollarSign,
  Compass,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  Share2,
  Zap,
  Target,
  Sliders,
  MousePointer,
} from 'lucide-react';
import {
  IconBookGuide,
  IconStickyNote,
  IconGraph2D,
  IconExcelTable,
  IconMathSigma,
  IconTargetGoal,
  IconBankDeposit,
  IconClearCanvas,
  IconDayShift,
  IconWalletCapital,
} from '../icons/CustomNeironoIcons';
import { useBrainStore } from '../../store/useBrainStore';

export const UserManualGuideModal: React.FC = () => {
  const { isManualOpen, setManualOpen } = useBrainStore();
  const [activeSection, setActiveSection] = useState<
    'canvas' | 'graph' | 'editor' | 'shifts' | 'finance' | 'sync' | 'notebooklm' | 'hotkeys'
  >('canvas');

  if (!isManualOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4 text-[#e2e8f0]">
      <div className="w-full max-w-3xl bg-[#12131a] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#161722]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#7c5cff]/20 text-[#7c5cff] border border-[#7c5cff]/30">
              <IconBookGuide size={20} color="#7c5cff" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Руководство пользователя NyronNotebook
              </h2>
              <p className="text-xs text-[#94a3b8]">
                Подробная инструкция по всем возможностям и модулям приложения
              </p>
            </div>
          </div>
          <button
            onClick={() => setManualOpen(false)}
            className="p-1.5 text-[#94a3b8] hover:text-white hover:bg-white/[0.06] rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Navigation Tabs */}
          <div className="w-60 border-r border-white/[0.08] bg-[#0f1015] p-3 space-y-1.5 overflow-y-auto shrink-0">
            <button
              onClick={() => setActiveSection('canvas')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'canvas'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <IconStickyNote size={16} color={activeSection === 'canvas' ? '#ffffff' : '#94a3b8'} />
              <span>Холст и MindMap</span>
            </button>

            <button
              onClick={() => setActiveSection('graph')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'graph'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <IconGraph2D size={16} color={activeSection === 'graph' ? '#ffffff' : '#94a3b8'} />
              <span>Интерактивный Граф</span>
            </button>

            <button
              onClick={() => setActiveSection('editor')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'editor'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <IconExcelTable size={16} color={activeSection === 'editor' ? '#ffffff' : '#94a3b8'} />
              <span>Редактор и Таблицы</span>
            </button>

            <button
              onClick={() => setActiveSection('shifts')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'shifts'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <IconDayShift size={16} color={activeSection === 'shifts' ? '#ffffff' : '#94a3b8'} />
              <span>Смены и Календарь</span>
            </button>

            <button
              onClick={() => setActiveSection('finance')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'finance'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <IconTargetGoal size={16} color={activeSection === 'finance' ? '#ffffff' : '#94a3b8'} />
              <span>Финансы и Цели</span>
            </button>

            <button
              onClick={() => setActiveSection('sync')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'sync'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Wifi size={16} />
              <span>P2P Синхронизация</span>
            </button>

            <button
              onClick={() => setActiveSection('notebooklm')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'notebooklm'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Sparkles size={16} className="text-[#ec4899]" />
              <span>Google NotebookLM</span>
            </button>

            <button
              onClick={() => setActiveSection('hotkeys')}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeSection === 'hotkeys'
                  ? 'bg-[#7c5cff] text-white shadow-lg'
                  : 'text-[#94a3b8] hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <Keyboard size={16} />
              <span>Горячие клавиши</span>
            </button>
          </div>

          {/* Right Details Panel */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
            {/* 1. Canvas & MindMap */}
            {activeSection === 'canvas' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconStickyNote size={20} color="#7c5cff" />
                  <span>Интеллект-карта и Холст (Obsidian Canvas)</span>
                </h3>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-2">
                  <h4 className="font-bold text-white text-xs">Что такое бесконечный Холст?</h4>
                  <p className="text-[#94a3b8]">
                    Холст — это интерактивное 2D-пространство для свободного визуального мышления. Здесь вы можете создавать стикеры, размещать заметки, соединять их плавными стрелками Безье и проектировать архитектуру идей.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#f59e0b] block">Навигация и зум:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Зажмите левую кнопку мыши на пустом фоне для перемещения по холсту. Вращайте колесико мыши для плавного масштабирования.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#8b5cf6] block">Стикеры и Цвета:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Нажмите <b>«+ Стикер»</b> или дважды кликните по холсту. Выбирайте из 6 фирменных палитр (фиолетовый, синий, зеленый, янтарный, розовый, графит).
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#38bdf8] block">Соединительные стрелки:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Наведите на круглые порты по краям карточки и протяните линию к другому блоку. Связи сохраняются автоматически.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#10b981] block">Заметки из дерева файлов:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Перетащите заметку из левого дерева файлов прямо на холст — появится карточка, синхронизированная с вашей заметкой.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Interactive Graph View */}
            {activeSection === 'graph' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconGraph2D size={20} color="#7c5cff" />
                  <span>Интерактивный Нейро-Граф Связей</span>
                </h3>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-2">
                  <h4 className="font-bold text-white text-xs">Как строится граф?</h4>
                  <p className="text-[#94a3b8]">
                    Граф автоматически формируется на основе ваших перекрёстных вики-ссылок <code>[[Название заметки]]</code>. Физический движок D3 Force организует мысли в естественные созвездия знаний (Knowledge Clusters).
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#38bdf8] block flex items-center gap-1.5">
                      <Zap size={14} />
                      <span>Подсветка синапсов и наведение:</span>
                    </span>
                    <p className="text-[#94a3b8] text-[11px]">
                      При наведении на узел все несвязанные заметки плавно затухают, а связанные синапсы и пути подсвечиваются ярким цветом. Клик по узлу открывает заметку в редакторе.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#f59e0b] block flex items-center gap-1.5">
                      <Target size={14} />
                      <span>Режим «Паук» (Spider Focus):</span>
                    </span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Кнопка «Паук» в тулбаре изолирует только выбранный узел и его непосредственных соседей, убирая визуальный шум большой базы.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#10b981] block flex items-center gap-1.5">
                      <MousePointer size={14} />
                      <span>Быстрое связывание (Режим Link):</span>
                    </span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Нажмите кнопку «Связать» в тулбаре графа, кликните по первой заметке, затем по второй — между ними мгновенно создастся двусторонняя вики-ссылка.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#8b5cf6] block flex items-center gap-1.5">
                      <Sliders size={14} />
                      <span>Настройка физики D3:</span>
                    </span>
                    <p className="text-[#94a3b8] text-[11px]">
                      В панели настроек графа вы можете регулировать силу гравитации (Gravity), силу отталкивания узлов (Repulsion), длину соединений (Link Distance) и размер сфер.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Editor & Formulas */}
            {activeSection === 'editor' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconExcelTable size={20} color="#10b981" />
                  <span>Умный Редактор, Формулы и Таблицы</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#f59e0b] block">Калькулятор прямо в тексте:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Наберите математическое выражение и знак <code>=</code>, например <code>15000 * 0.13 = </code> или <code>2400 / 12 = </code>. Редактор покажет подсказку — нажмите <b>Tab</b>, чтобы вставить результат.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#10b981] block">Интерактивные таблицы:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Вставьте таблицу через риббон. Колонки с числами умеют автоматически считать <b>∑ Сумму, Ø Среднее, # Количество, Мин/Макс</b>.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#38bdf8] block">Двусторонние вики-ссылки:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Введите <code>[[</code> — появится авто-подсказка со списком всех заметок для создания перекрестной связи.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#7c5cff] block">Теги и метаданные:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Используйте <code>#проект</code>, <code>#финансы</code> или <code>#идея</code> для мгновенной фильтрации в боковом меню.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Shift Calendar */}
            {activeSection === 'shifts' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconDayShift size={20} color="#ec4899" />
                  <span>Календарь смен, дел и заработка</span>
                </h3>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-2">
                  <h4 className="font-bold text-white text-xs">Планирование графика и зарплаты</h4>
                  <p className="text-[#94a3b8]">
                    Специализированный календарь для работы посменно: дневные, ночные, суточные (1/3), подработки и гибкие графики 2/2 с автоматическим расчётом дохода и ночных надбавок.
                  </p>
                </div>

                <div className="space-y-2 text-[11px] text-[#cbd5e1]">
                  <div className="p-3 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span><b>Генератор графиков</b> — циклическое построение расписания на 1–12 месяцев вперед за секунду</span>
                    <CheckCircle2 size={14} className="text-[#10b981]" />
                  </div>
                  <div className="p-3 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span><b>Учёт трат на смене</b> — фиксация расходов на дорогу и обед с автоматическим расчётом чистых денег</span>
                    <CheckCircle2 size={14} className="text-[#10b981]" />
                  </div>
                  <div className="p-3 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span><b>Кисть и Ластик</b> — расстановка смен и выходных в 1 клик по ячейкам</span>
                    <CheckCircle2 size={14} className="text-[#10b981]" />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Finance Manager */}
            {activeSection === 'finance' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <IconTargetGoal size={20} color="#10b981" />
                  <span>Финансовый Менеджер, Вклады и Цели</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-2">
                    <span className="font-bold text-[#10b981] block text-xs">Цели накоплений (Копилки):</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Создавайте цели на покупки, отпуск или подушку безопасности. Следите за прогресс-баром и пополняйте сумму в один клик.
                    </p>
                  </div>

                  <div className="p-4 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-2">
                    <span className="font-bold text-[#f59e0b] block text-xs">Банковские Вклады и Счета:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Указывайте процентную ставку (% годовых) и капитализацию — система сама посчитает ваш точный ежемесячный пассивный доход.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. P2P Wireless Sync */}
            {activeSection === 'sync' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wifi size={20} className="text-[#10b981]" />
                  <span>P2P Синхронизация без серверов (Wi-Fi, Hotspot, Bluetooth)</span>
                </h3>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-2">
                  <h4 className="font-bold text-white text-xs">100% Локальная безопасность</h4>
                  <p className="text-[#94a3b8]">
                    Синхронизация происходит напрямую между вашими устройствами. Ваши личные заметки, финансовые данные и пароли никогда не отправляются на сторонние серверы.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 bg-[#171822] rounded-xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#7c5cff] block">1. Wi-Fi Сеть (LAN):</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Если ПК и телефон в одной домашней или рабочей сети, они автоматически находят друг друга.
                    </p>
                  </div>

                  <div className="p-3 bg-[#171822] rounded-xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#38bdf8] block">2. Точка Доступа:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Включите раздачу интернета на телефоне (Hotspot) и подключите ПК — синхронизация работает автономно.
                    </p>
                  </div>

                  <div className="p-3 bg-[#171822] rounded-xl border border-white/[0.08] space-y-1">
                    <span className="font-bold text-[#10b981] block">3. Bluetooth:</span>
                    <p className="text-[#94a3b8] text-[11px]">
                      Прямой защищённый обмен данными без необходимости подключения к роутеру.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. NotebookLM */}
            {activeSection === 'notebooklm' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-[#ec4899]" />
                  <span>Интеграция с Google NotebookLM Studio</span>
                </h3>

                <div className="p-4 rounded-2xl bg-[#171822] border border-white/[0.08] space-y-2">
                  <h4 className="font-bold text-white text-xs">Что такое Google NotebookLM?</h4>
                  <p className="text-[#94a3b8]">
                    Экспериментальная лаборатория от Google, которая анализирует ваши документы, генерирует аудио-подкасты с обсуждением ваших заметок и отвечает на вопросы строго по вашим источникам.
                  </p>
                </div>

                <div className="p-3.5 bg-[#171822] rounded-2xl border border-white/[0.08] space-y-2">
                  <span className="font-bold text-white block">Как экспортировать заметки в NotebookLM:</span>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#cbd5e1]">
                    <li>Нажмите на иконку <b>NotebookLM</b> в левом риббоне.</li>
                    <li>Выберите нужные заметки или папки галочками.</li>
                    <li>Нажмите <b>«Сформировать пакет источников»</b> и скопируйте в буфер.</li>
                    <li>Вставьте в веб-студию NotebookLM для генерации аудио-обзоров и аналитики.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* 8. Hotkeys */}
            {activeSection === 'hotkeys' && (
              <div className="space-y-3 animate-fade-in">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Keyboard size={20} className="text-[#ec4899]" />
                  <span>Полный справочник горячих клавиш (Hotkeys)</span>
                </h3>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[#cbd5e1]">Быстрый поиск (Spotlight)</span>
                    <kbd className="px-2 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#38bdf8] font-bold">Ctrl + K / P</kbd>
                  </div>

                  <div className="p-2.5 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[#cbd5e1]">Новая заметка</span>
                    <kbd className="px-2 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#38bdf8] font-bold">Ctrl + N</kbd>
                  </div>

                  <div className="p-2.5 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[#cbd5e1]">Закрыть активную вкладку</span>
                    <kbd className="px-2 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#38bdf8] font-bold">Ctrl + W</kbd>
                  </div>

                  <div className="p-2.5 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[#cbd5e1]">Скрыть / показать боковую панель</span>
                    <kbd className="px-2 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#38bdf8] font-bold">Ctrl + B</kbd>
                  </div>

                  <div className="p-2.5 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[#cbd5e1]">Создать вики-ссылку</span>
                    <kbd className="px-2 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#7c5cff] font-bold">[[</kbd>
                  </div>

                  <div className="p-2.5 bg-[#171822] rounded-xl border border-white/[0.08] flex items-center justify-between">
                    <span className="text-[#cbd5e1]">Полноэкранный режим</span>
                    <kbd className="px-2 py-0.5 bg-black/40 rounded border border-white/10 font-mono text-[10px] text-[#7c5cff] font-bold">F11</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
