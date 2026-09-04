import React, { useEffect, useState } from 'react';
import { ActivityRibbon } from './components/layout/ActivityRibbon';
import { FileTreeSidebar } from './components/layout/FileTreeSidebar';
import { TopTabBar } from './components/layout/TopTabBar';
import { RightSidebar } from './components/layout/RightSidebar';
import { StatusBar } from './components/layout/StatusBar';
import { ObsidianGraphView } from './components/graph/ObsidianGraphView';
import { ObsidianCanvasView } from './components/views/ObsidianCanvasView';
import { CalendarShiftView } from './components/views/CalendarShiftView';
import { FinanceManagerView } from './components/views/FinanceManagerView';
import { AnalyticsDashboardView } from './components/views/AnalyticsDashboardView';
import { ObsidianNoteEditor } from './components/editor/ObsidianNoteEditor';
import { DatabaseView } from './components/views/DatabaseView';
import { WelcomeView } from './components/views/WelcomeView';
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
    toggleLeftSidebar,
    isStatusBarVisible,
    goBack,
    goForward,
  } = useBrainStore();

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Apply Theme & UI Customization to DOM
  useEffect(() => {
    applyThemeToDOM(themePreset, uiSettings, themeMode);
  }, [themePreset, uiSettings, themeMode]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K, Ctrl+O, Ctrl+P -> Quick Switcher / Search
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'k' || e.key.toLowerCase() === 'o' || e.key.toLowerCase() === 'p')
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Ctrl+N -> New Note
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const newNote = addNeuron('Без названия');
        openNote(newNote.id);
      }
      // Ctrl+B -> Toggle Left Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleLeftSidebar();
      }
      // Ctrl+/ -> Keyboard Shortcuts Help
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      }
      // Alt+Left -> History Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        goBack();
      }
      // Alt+Right -> History Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        goForward();
      }
      // Escape -> Close shortcuts modal
      if (e.key === 'Escape' && isShortcutsOpen) {
        setIsShortcutsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchOpen, addNeuron, openNote, toggleLeftSidebar, goBack, goForward, isShortcutsOpen]);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#0d0e12] text-[#e2e8f0] select-none font-sans">
      {/* 1. Full-Width Unified Top Bar (Tabs + Window Controls) */}
      <ErrorBoundary fallbackTitle="Ошибка панели вкладок">
        <TopTabBar />
      </ErrorBoundary>

      {/* 2. Main App Workspace Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Far Left Activity Ribbon */}
        <ErrorBoundary fallbackTitle="Ошибка панели навигации">
          <ActivityRibbon />
        </ErrorBoundary>

        {/* Collapsible File Tree Sidebar */}
        <ErrorBoundary fallbackTitle="Ошибка проводника файлов">
          <FileTreeSidebar />
        </ErrorBoundary>

        {/* Center Workspace (Active View) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0e12] min-w-0">
          {/* Active View Container */}
          <div className="flex-1 relative overflow-hidden">
            <ErrorBoundary fallbackTitle="Ошибка отображения вкладки">
              {activeTab?.type === 'graph' ? (
                <ObsidianGraphView />
              ) : activeTab?.type === 'canvas' ? (
                <ObsidianCanvasView />
              ) : activeTab?.type === 'calendar' ? (
                <CalendarShiftView />
              ) : activeTab?.type === 'finance' ? (
                <FinanceManagerView />
              ) : activeTab?.type === 'analytics' ? (
                <AnalyticsDashboardView />
              ) : activeTab?.type === 'database' ? (
                <DatabaseView />
              ) : activeTab?.type === 'note' && activeTab?.noteId ? (
                <ObsidianNoteEditor key={activeTab.noteId} noteId={activeTab.noteId} />
              ) : (
                <ObsidianGraphView />
              )}
            </ErrorBoundary>
          </div>
        </div>

        {/* Collapsible Right Sidebar (Backlinks, Graph Settings, AI Copilot) */}
        {activeTab?.type !== 'calendar' && (
          <ErrorBoundary fallbackTitle="Ошибка правой панели">
            <RightSidebar />
          </ErrorBoundary>
        )}
      </div>

      {/* Bottom Status Bar */}
      {isStatusBarVisible && <StatusBar />}

      {/* Modals & Dialogs */}
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
