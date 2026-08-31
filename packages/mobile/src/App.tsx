import React, { useEffect, useState } from 'react';
import { MobileTopBar } from './components/mobile/MobileTopBar';
import { MobileBottomNav } from './components/mobile/MobileBottomNav';
import { MobileLeftDrawer } from './components/mobile/MobileLeftDrawer';
import { MobileRightDrawer } from './components/mobile/MobileRightDrawer';
import { MobileMoreSheet } from './components/mobile/MobileMoreSheet';

import { ObsidianGraphView } from './components/graph/ObsidianGraphView';
import { ObsidianCanvasView } from './components/views/ObsidianCanvasView';
import { CalendarShiftView } from './components/views/CalendarShiftView';
import { FinanceManagerView } from './components/views/FinanceManagerView';
import { ObsidianNoteEditor } from './components/editor/ObsidianNoteEditor';
import { DatabaseView } from './components/views/DatabaseView';
import { SearchModal } from './components/search/SearchModal';
import { NotebookLMHubModal } from './components/ai/NotebookLMHubModal';
import { SyncModal } from './components/sync/SyncModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { UserManualGuideModal } from './components/modals/UserManualGuideModal';
import { KeyboardShortcutsModal } from './components/modals/KeyboardShortcutsModal';
import { useBrainStore, applyThemeToDOM } from './store/useBrainStore';

import { ErrorBoundary } from './components/common/ErrorBoundary';

export const App: React.FC = () => {
  const {
    themePreset,
    themeMode,
    uiSettings,
    tabs,
    activeTabId,
    setSearchOpen,
    addNeuron,
    openNote,
  } = useBrainStore();

  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Track visited view types to lazily mount once and keep alive in DOM (0ms tab switching)
  const [visitedViews, setVisitedViews] = useState<Set<string>>(() => new Set([activeTab?.type || 'graph']));

  useEffect(() => {
    if (activeTab?.type) {
      setVisitedViews((prev) => {
        if (!prev.has(activeTab.type)) {
          const next = new Set(prev);
          next.add(activeTab.type);
          return next;
        }
        return prev;
      });
    }
  }, [activeTab?.type]);

  // Apply Theme & UI Customization to DOM
  useEffect(() => {
    applyThemeToDOM(themePreset, uiSettings, themeMode);
  }, [themePreset, uiSettings, themeMode]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#0d0e12] text-[#e2e8f0] select-none font-sans">
      {/* 1. Touch-Optimized Mobile Top Bar */}
      <ErrorBoundary fallbackTitle="Ошибка панели заголовка">
        <MobileTopBar
          onOpenLeftDrawer={() => setIsLeftDrawerOpen(true)}
          onOpenRightDrawer={() => setIsRightDrawerOpen(true)}
        />
      </ErrorBoundary>

      {/* 2. Full-Width Active View with Keep-Alive View Cache (0ms Instant Switch) */}
      <main className="flex-1 relative overflow-hidden bg-[#0d0e12] min-w-0">
        <ErrorBoundary fallbackTitle="Ошибка отображения экрана">
          {/* Persistent Graph View */}
          {visitedViews.has('graph') && (
            <div className={`w-full h-full ${activeTab?.type === 'graph' ? 'block' : 'hidden'}`}>
              <ObsidianGraphView />
            </div>
          )}

          {/* Persistent Canvas View */}
          {visitedViews.has('canvas') && (
            <div className={`w-full h-full ${activeTab?.type === 'canvas' ? 'block' : 'hidden'}`}>
              <ObsidianCanvasView />
            </div>
          )}

          {/* Persistent Calendar View */}
          {visitedViews.has('calendar') && (
            <div className={`w-full h-full ${activeTab?.type === 'calendar' ? 'block' : 'hidden'}`}>
              <CalendarShiftView />
            </div>
          )}

          {/* Persistent Finance View */}
          {visitedViews.has('finance') && (
            <div className={`w-full h-full ${activeTab?.type === 'finance' ? 'block' : 'hidden'}`}>
              <FinanceManagerView />
            </div>
          )}

          {/* Persistent Database View */}
          {visitedViews.has('database') && (
            <div className={`w-full h-full ${activeTab?.type === 'database' ? 'block' : 'hidden'}`}>
              <DatabaseView />
            </div>
          )}

          {/* Active Note Editor View */}
          {activeTab?.type === 'note' && activeTab?.noteId && (
            <div className="w-full h-full block">
              <ObsidianNoteEditor key={activeTab.noteId} noteId={activeTab.noteId} />
            </div>
          )}
        </ErrorBoundary>
      </main>

      {/* 3. Touch-Optimized Mobile Bottom Navigation Bar */}
      <ErrorBoundary fallbackTitle="Ошибка нижней панели">
        <MobileBottomNav onOpenMoreMenu={() => setIsMoreSheetOpen(true)} />
      </ErrorBoundary>

      {/* 4. Sliding Drawers and Action Sheets */}
      <MobileLeftDrawer
        isOpen={isLeftDrawerOpen}
        onClose={() => setIsLeftDrawerOpen(false)}
      />
      <MobileRightDrawer
        isOpen={isRightDrawerOpen}
        onClose={() => setIsRightDrawerOpen(false)}
      />
      <MobileMoreSheet
        isOpen={isMoreSheetOpen}
        onClose={() => setIsMoreSheetOpen(false)}
      />

      {/* 5. Modals & Dialogs */}
      <SearchModal />
      <NotebookLMHubModal />
      <SyncModal />
      <SettingsModal />
      <UserManualGuideModal />
      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

export default App;
