import { useEffect, useMemo, useState } from "react";
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { AUTO_SAVE_DELAY, STORAGE_KEYS } from "../constants/app.constants";
import { createSafeFileName, getFileName, isDesktop } from "../utils/path.utils";
import { createTab, getInitialDocument } from "../utils/tab.factory";

// Manages the list of open document tabs: creating, opening, saving,
// closing, and the local persistence/autosave side effects that go with it.
//
// `refreshWorkspaceTree` and `workspacePath` are injected so this hook has
// no direct dependency on useWorkspace (which itself depends on this hook's
// `openDocument`). App.jsx wires the two together through refs, the same
// pattern the original App.jsx used for `openDocumentRef`.
export function useDocumentTabs({ translate, refreshWorkspaceTree }) {
  // The initial document is intentionally loaded only once.
  const initialDocument = useMemo(() => getInitialDocument(translate), []);

  const [tabs, setTabs] = useState(() => [createTab(initialDocument)]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0].id);
  // Id of the tab pending a "close with unsaved changes" confirmation, or null.
  const [closeConfirmationTabId, setCloseConfirmationTabId] = useState(null);
  // { tabIds, onDone } pending a "close workspace with unsaved changes"
  // confirmation, or null. `onDone` runs once the tabs are actually removed
  // (either discarded or saved), so callers (useWorkspace) can reset their
  // own state only once it's safe to do so.
  const [workspaceCloseRequest, setWorkspaceCloseRequest] = useState(null);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || tabs[0];
  const closingConfirmationTab = tabs.find(
    (tab) => tab.id === closeConfirmationTabId,
  );
  const name = activeTab?.name || translate("untitled");
  const content = activeTab?.content || "";

  function updateActiveTab(updater) {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === activeTabId ? updater(tab) : tab,
      ),
    );
  }

  function setName(nextName) {
    updateActiveTab((tab) => ({
      ...tab,
      name: typeof nextName === "function" ? nextName(tab.name) : nextName,
      dirty: true,
    }));
  }

  function setContent(nextContent) {
    updateActiveTab((tab) => ({
      ...tab,
      content:
        typeof nextContent === "function"
          ? nextContent(tab.content)
          : nextContent,
      dirty: true,
    }));
  }

  async function openDocument(path) {
    const existingTab = tabs.find((tab) => tab.path === path);

    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const documentTab = createTab({
      name: getFileName(path),
      content: await readTextFile(path),
      path,
    });

    setTabs((currentTabs) => [...currentTabs, documentTab]);
    setActiveTabId(documentTab.id);
  }

  async function openBrowserWorkspaceFile(file, path) {
    const existingTab = tabs.find((tab) => tab.path === path);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const documentTab = createTab({
      name: file.name,
      content: await file.text(),
      path,
    });
    setTabs((currentTabs) => [...currentTabs, documentTab]);
    setActiveTabId(documentTab.id);
  }

  // Actually removes a tab from the list, without any save/confirmation logic.
  function removeTab(tabId) {
    if (tabs.length === 1) {
      const emptyTab = createTab({ name: translate("untitled"), content: "" });
      setTabs([emptyTab]);
      setActiveTabId(emptyTab.id);
      return;
    }

    const closingIndex = tabs.findIndex((tab) => tab.id === tabId);
    const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(remainingTabs);

    if (tabId === activeTabId) {
      setActiveTabId(remainingTabs[Math.max(0, closingIndex - 1)].id);
    }
  }

  // Same as removeTab, but removes a whole set of tabs in one state update
  // (used when closing a workspace) instead of one-by-one, which would
  // otherwise recompute "which tab becomes active" against a stale list.
  function removeTabs(tabIds) {
    setTabs((currentTabs) => {
      const remainingTabs = currentTabs.filter((tab) => !tabIds.includes(tab.id));

      if (remainingTabs.length === 0) {
        const emptyTab = createTab({ name: translate("untitled"), content: "" });
        setActiveTabId(emptyTab.id);
        return [emptyTab];
      }

      if (tabIds.includes(activeTabId)) {
        setActiveTabId(remainingTabs[0].id);
      }

      return remainingTabs;
    });
  }

  // Closes a set of tabs at once (e.g. every tab belonging to a workspace
  // being removed). If any of them has unsaved changes, asks once for
  // confirmation covering the whole batch instead of one modal per tab.
  // `onDone` fires once the tabs are actually gone, whichever path was
  // taken - never on cancel.
  function closeWorkspaceTabs(tabIds, onDone) {
    if (tabIds.length === 0) {
      onDone?.();
      return;
    }

    const hasUnsavedChanges = tabs.some(
      (tab) => tabIds.includes(tab.id) && tab.dirty,
    );

    if (!hasUnsavedChanges) {
      removeTabs(tabIds);
      onDone?.();
      return;
    }

    setWorkspaceCloseRequest({ tabIds, onDone });
  }

  function cancelCloseWorkspaceTabs() {
    setWorkspaceCloseRequest(null);
  }

  function discardAndCloseWorkspaceTabs() {
    const request = workspaceCloseRequest;
    setWorkspaceCloseRequest(null);
    if (request) {
      removeTabs(request.tabIds);
      request.onDone?.();
    }
  }

  async function saveAndCloseWorkspaceTabs() {
    const request = workspaceCloseRequest;
    if (!request) return;

    const dirtyTabs = tabs.filter(
      (tab) => request.tabIds.includes(tab.id) && tab.dirty,
    );
    const results = await Promise.all(
      dirtyTabs.map((tab) => saveTabContent(tab)),
    );

    // If any "save as" dialog was cancelled, keep the confirmation open
    // instead of closing the workspace and losing those changes.
    if (results.some((saved) => !saved)) {
      return;
    }

    setWorkspaceCloseRequest(null);
    removeTabs(request.tabIds);
    request.onDone?.();
  }

  // Keeps an already-open tab in sync when its file is renamed from the
  // workspace tree, instead of leaving it pointing at a path that no longer
  // exists.
  function renameOpenTab(oldPath, newPath, newName) {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.path === oldPath ? { ...tab, path: newPath, name: newName } : tab,
      ),
    );
  }

  // Closes the tab for a given path, if open, without any unsaved-changes
  // confirmation - used when the underlying file was just deleted from the
  // workspace tree, so there's nothing left on disk to save.
  function closeTabByPath(path) {
    const tab = tabs.find((currentTab) => currentTab.path === path);
    if (tab) {
      removeTab(tab.id);
    }
  }

  function closeTab(tabId) {
    const closingTab = tabs.find((tab) => tab.id === tabId);

    if (closingTab?.dirty) {
      setCloseConfirmationTabId(tabId);
      return;
    }

    removeTab(tabId);
  }

  function cancelCloseTab() {
    setCloseConfirmationTabId(null);
  }

  function discardAndCloseTab() {
    const tabId = closeConfirmationTabId;
    setCloseConfirmationTabId(null);
    if (tabId) {
      removeTab(tabId);
    }
  }

  // Writes a given tab's content to disk (prompting for a path if it doesn't
  // have one yet), independently of which tab is currently active.
  async function saveTabContent(tab) {
    if (isDesktop()) {
      let path = tab.path;

      if (!path) {
        path = await saveDialog({
          defaultPath: `${createSafeFileName(tab.name)}.md`,
          filters: [{ name: "Markdown", extensions: ["md"] }],
        });

        if (!path) {
          return false;
        }
      }

      await writeTextFile(path, tab.content);
      await refreshWorkspaceTree();
      return true;
    }

    const fileUrl = URL.createObjectURL(
      new Blob([tab.content], { type: "text/markdown;charset=utf-8" }),
    );
    const downloadLink = document.createElement("a");

    downloadLink.href = fileUrl;
    downloadLink.download = `${createSafeFileName(tab.name)}.md`;
    downloadLink.click();

    setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
    return true;
  }

  async function saveAndCloseTab() {
    const tabId = closeConfirmationTabId;
    const tab = tabs.find((currentTab) => currentTab.id === tabId);

    if (!tab) {
      setCloseConfirmationTabId(null);
      return;
    }

    const saved = await saveTabContent(tab);
    // If the user cancelled the "save as" dialog, keep the confirmation
    // open instead of closing the tab and losing their changes.
    if (!saved) {
      return;
    }

    setCloseConfirmationTabId(null);
    removeTab(tabId);
  }

  async function openFile() {
    if (isDesktop()) {
      const path = await openDialog({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "Markdown",
            extensions: ["md", "markdown", "txt"],
          },
        ],
      });

      if (!path) {
        return;
      }

      await openDocument(path);
      return;
    }

    document.getElementById("file")?.click();
  }

  async function openBrowserFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const documentTab = createTab({
      name: file.name,
      content: await file.text(),
    });
    setTabs((currentTabs) => [...currentTabs, documentTab]);
    setActiveTabId(documentTab.id);
  }

  async function saveFile() {
    if (isDesktop()) {
      if (activeTab?.path) {
        await writeTextFile(activeTab.path, content);
        updateActiveTab((tab) => ({ ...tab, dirty: false }));
        await refreshWorkspaceTree();
        return;
      }

      const path = await saveDialog({
        defaultPath: `${createSafeFileName(name)}.md`,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });

      if (path) {
        await writeTextFile(path, content);
        updateActiveTab((tab) => ({
          ...tab,
          name: getFileName(path),
          path,
          dirty: false,
        }));
        await refreshWorkspaceTree();
      }

      return;
    }

    const fileUrl = URL.createObjectURL(
      new Blob([content], { type: "text/markdown;charset=utf-8" }),
    );
    const downloadLink = document.createElement("a");

    downloadLink.href = fileUrl;
    downloadLink.download = `${createSafeFileName(name)}.md`;
    downloadLink.click();

    setTimeout(() => URL.revokeObjectURL(fileUrl), 0);
  }

  function createNewDocument() {
    const documentTab = createTab({ name: translate("untitled"), content: "" });
    setTabs((currentTabs) => [...currentTabs, documentTab]);
    setActiveTabId(documentTab.id);
  }

  // Persist the current document, language, and theme locally.
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.document,
      JSON.stringify({ name, content }),
    );
  }, [name, content]);

  useEffect(() => {
    if (!isDesktop()) return undefined;

    const dirtyTabs = tabs.filter((tab) => tab.dirty && tab.path);
    if (dirtyTabs.length === 0) return undefined;

    const timer = window.setTimeout(async () => {
      const savedTabs = new Map();

      await Promise.all(
        dirtyTabs.map(async (tab) => {
          try {
            await writeTextFile(tab.path, tab.content);
            savedTabs.set(tab.id, tab.content);
          } catch {
            // Keep the tab marked as modified when its file cannot be saved.
          }
        }),
      );

      if (savedTabs.size > 0) {
        setTabs((currentTabs) =>
          currentTabs.map((tab) =>
            savedTabs.get(tab.id) === tab.content
              ? { ...tab, dirty: false }
              : tab,
          ),
        );
        await refreshWorkspaceTree();
      }
    }, AUTO_SAVE_DELAY);

    return () => window.clearTimeout(timer);
  }, [tabs]);

  return {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    activeTab,
    name,
    content,
    setName,
    setContent,
    updateActiveTab,
    openDocument,
    openBrowserWorkspaceFile,
    removeTab,
    removeTabs,
    closeTab,
    renameOpenTab,
    closeTabByPath,
    cancelCloseTab,
    discardAndCloseTab,
    saveTabContent,
    saveAndCloseTab,
    closingConfirmationTab,
    closeWorkspaceTabs,
    cancelCloseWorkspaceTabs,
    discardAndCloseWorkspaceTabs,
    saveAndCloseWorkspaceTabs,
    workspaceCloseRequest,
    openFile,
    openBrowserFile,
    saveFile,
    createNewDocument,
  };
}
