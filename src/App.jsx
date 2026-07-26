import { useRef, useState } from "react";

import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";
import "katex/contrib/mhchem";
import "./editor.css";
import "./workspace.css";

import { DEFAULT_VIEW } from "./constants/app.constants";
import { isDesktop } from "./utils/path.utils";
import { useTranslate } from "./i18n/useTranslate";
import { usePersistedSettings } from "./hooks/usePersistedSettings";
import { useDocumentTabs } from "./hooks/useDocumentTabs";
import { useWorkspace } from "./hooks/useWorkspace";
import { useStartupFile } from "./hooks/useStartupFile";
import { useDocumentAnalysis } from "./hooks/useDocumentAnalysis";
import { useMarkdownEditing } from "./hooks/useMarkdownEditing";
import { useTableInsertion } from "./hooks/useTableInsertion";
import { useMermaidRendering } from "./hooks/useMermaidRendering";
import { useCommandPalette } from "./hooks/useCommandPalette";

import AppHeader from "./components/layout/AppHeader";
import EditorToolbar from "./components/layout/EditorToolbar";
import TabsBar from "./components/layout/TabsBar";
import AppFooter from "./components/layout/AppFooter";
import Sidebar from "./components/sidebar/Sidebar";
import EditorPane from "./components/EditorPane";
import PreviewPane from "./components/preview/PreviewPane";
import PrintableDocument from "./components/preview/PrintableDocument";
import TableInsertModal from "./components/modals/TableInsertModal";
import UnsavedChangesModal from "./components/modals/UnsavedChangesModal";
import WorkspaceUnsavedChangesModal from "./components/modals/WorkspaceUnsavedChangesModal";
import DeleteFileConfirmModal from "./components/modals/DeleteFileConfirmModal";
import CommandPalette from "./components/CommandPalette";

export default function App() {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    syncPreviewScroll,
    setSyncPreviewScroll,
  } = usePersistedSettings();

  const translate = useTranslate(language);

  const [view, setView] = useState(DEFAULT_VIEW);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const editorRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const previewRef = useRef(null);
  const printRef = useRef(null);

  // These two refs break the circular dependency between useDocumentTabs
  // (needs to refresh the workspace tree after saving) and useWorkspace
  // (needs to open a document when restoring a saved workspace). Both refs
  // are refreshed on every render, so they always call the latest closure -
  // the same pattern the original App.jsx used for `openDocumentRef`.
  const openDocumentRef = useRef(null);
  const refreshWorkspaceTreeRef = useRef(null);

  const documentTabs = useDocumentTabs({
    translate,
    refreshWorkspaceTree: (...args) => refreshWorkspaceTreeRef.current?.(...args),
  });

  const workspace = useWorkspace({
    language,
    tabs: documentTabs.tabs,
    activeTab: documentTabs.activeTab,
    openDocument: (path) => openDocumentRef.current?.(path),
    closeWorkspaceTabs: documentTabs.closeWorkspaceTabs,
    renameOpenTab: documentTabs.renameOpenTab,
    closeTabByPath: documentTabs.closeTabByPath,
  });

  openDocumentRef.current = documentTabs.openDocument;
  refreshWorkspaceTreeRef.current = workspace.refreshWorkspaceTree;

  useStartupFile(openDocumentRef);

  const { renderedHtml, headings, statistics } = useDocumentAnalysis(
    documentTabs.content,
  );

  const editing = useMarkdownEditing({
    content: documentTabs.content,
    setContent: documentTabs.setContent,
    editorRef,
    view,
    setView,
    translate,
    headings,
  });

  const tableInsertion = useTableInsertion({ insertBlock: editing.insertBlock });

  useMermaidRendering({
    previewRef,
    printRef,
    renderedHtml,
    theme,
    view,
    language,
    translate,
  });

  function exportPdf() {
    window.print();
  }

  const commandPalette = useCommandPalette({
    translate,
    createNewDocument: documentTabs.createNewDocument,
    openFile: documentTabs.openFile,
    saveFile: documentTabs.saveFile,
    exportPdf,
    toggleTheme,
    setSidebarVisible,
    setView,
  });

  function syncPreviewToEditor(editor) {
    if (!syncPreviewScroll || !previewRef.current) return;

    const editorScrollableHeight = editor.scrollHeight - editor.clientHeight;
    const previewScrollableHeight =
      previewRef.current.scrollHeight - previewRef.current.clientHeight;
    const progress = editorScrollableHeight > 0
      ? editor.scrollTop / editorScrollableHeight
      : 0;

    previewRef.current.scrollTop = progress * Math.max(0, previewScrollableHeight);
  }

  function toggleWorkspaceFolder(path) {
    workspace.setExpandedFolders((currentFolders) => {
      const nextFolders = new Set(currentFolders);
      if (nextFolders.has(path)) {
        nextFolders.delete(path);
      } else {
        nextFolders.add(path);
      }
      return nextFolders;
    });
  }

  return (
    <div className={`app ${theme}`}>
      <AppHeader
        translate={translate}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={() => setSidebarVisible((isVisible) => !isVisible)}
        onCreateNewDocument={documentTabs.createNewDocument}
        onOpenFile={documentTabs.openFile}
        onOpenWorkspace={workspace.openWorkspace}
        onOpenBrowserFile={documentTabs.openBrowserFile}
        onOpenBrowserWorkspace={workspace.openBrowserWorkspace}
        onSaveFile={documentTabs.saveFile}
        isDesktopApp={isDesktop()}
        workspacePath={workspace.workspacePath}
        onSaveWorkspace={workspace.saveWorkspace}
        onExportPdf={exportPdf}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <EditorToolbar
        translate={translate}
        rememberSelection={editing.rememberSelection}
        applyHeading={editing.applyHeading}
        wrapSelection={editing.wrapSelection}
        prefixSelectedLines={editing.prefixSelectedLines}
        insertBlock={editing.insertBlock}
        onOpenTableModal={() => tableInsertion.setTableModalOpen(true)}
        onInsertTableOfContents={editing.insertTableOfContents}
        view={view}
        setView={setView}
        syncPreviewScroll={syncPreviewScroll}
        setSyncPreviewScroll={setSyncPreviewScroll}
      />

      <TabsBar
        tabs={documentTabs.tabs}
        activeTabId={documentTabs.activeTabId}
        onSelectTab={documentTabs.setActiveTabId}
        onCloseTab={documentTabs.closeTab}
      />

      <main className={`${view} ${sidebarVisible ? "with-sidebar" : ""}`}>
        {sidebarVisible && (
          <Sidebar
            translate={translate}
            workspacePath={workspace.workspacePath}
            workspaceTree={workspace.workspaceTree}
            expandedFolders={workspace.expandedFolders}
            onToggleFolder={toggleWorkspaceFolder}
            onOpenWorkspace={workspace.openWorkspace}
            onCloseWorkspace={workspace.closeWorkspace}
            onOpenDocument={documentTabs.openDocument}
            onOpenBrowserWorkspaceFile={documentTabs.openBrowserWorkspaceFile}
            onCreateFile={workspace.createFile}
            onRenameEntry={workspace.renameEntry}
            onRequestDelete={workspace.requestDelete}
            isDesktopApp={isDesktop()}
            headings={headings}
            onJumpToHeading={editing.jumpToHeading}
          />
        )}

        {view !== "preview" && (
          <EditorPane
            content={documentTabs.content}
            editorRef={editorRef}
            lineNumbersRef={lineNumbersRef}
            onChange={documentTabs.setContent}
            onRememberSelection={editing.rememberSelection}
            onScroll={syncPreviewToEditor}
            placeholder={translate("placeholder")}
            title={translate("editor")}
          />
        )}

        {view !== "editor" && (
          <PreviewPane
            previewRef={previewRef}
            translate={translate}
            renderedHtml={renderedHtml}
          />
        )}
      </main>

      <AppFooter
        statistics={statistics}
        translate={translate}
        language={language}
        onLanguageChange={setLanguage}
      />

      {tableInsertion.tableModalOpen && (
        <TableInsertModal
          translate={translate}
          onClose={() => tableInsertion.setTableModalOpen(false)}
          tableRows={tableInsertion.tableRows}
          setTableRows={tableInsertion.setTableRows}
          tableColumns={tableInsertion.tableColumns}
          updateTableColumnCount={tableInsertion.updateTableColumnCount}
          tableHasHeader={tableInsertion.tableHasHeader}
          setTableHasHeader={tableInsertion.setTableHasHeader}
          columnAlignments={tableInsertion.columnAlignments}
          setColumnAlignments={tableInsertion.setColumnAlignments}
          onInsert={tableInsertion.insertTable}
        />
      )}

      {documentTabs.closingConfirmationTab && (
        <UnsavedChangesModal
          translate={translate}
          tab={documentTabs.closingConfirmationTab}
          onCancel={documentTabs.cancelCloseTab}
          onDiscard={documentTabs.discardAndCloseTab}
          onSaveAndClose={documentTabs.saveAndCloseTab}
        />
      )}

      {documentTabs.workspaceCloseRequest && (
        <WorkspaceUnsavedChangesModal
          translate={translate}
          fileCount={documentTabs.workspaceCloseRequest.tabIds.length}
          onCancel={documentTabs.cancelCloseWorkspaceTabs}
          onDiscard={documentTabs.discardAndCloseWorkspaceTabs}
          onSaveAndClose={documentTabs.saveAndCloseWorkspaceTabs}
        />
      )}

      {workspace.deleteRequest && (
        <DeleteFileConfirmModal
          translate={translate}
          fileName={workspace.deleteRequest.name}
          onCancel={workspace.cancelDelete}
          onConfirm={workspace.confirmDelete}
        />
      )}

      {commandPalette.commandPaletteOpen && (
        <CommandPalette
          commands={commandPalette.commands}
          inputRef={commandPalette.commandInputRef}
          onClose={() => commandPalette.setCommandPaletteOpen(false)}
          onQueryChange={commandPalette.setCommandQuery}
          onRunCommand={commandPalette.runCommand}
          query={commandPalette.commandQuery}
          translate={translate}
        />
      )}

      <PrintableDocument printRef={printRef} renderedHtml={renderedHtml} />
    </div>
  );
}
