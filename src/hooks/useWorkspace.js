import { useEffect, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  mkdir,
  readDir,
  readTextFile,
  remove,
  rename,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { WORKSPACE_CONFIG_FILE, WORKSPACE_FILE } from "../constants/app.constants";
import {
  getDirectoryPaths,
  getFileName,
  getRelativePath,
  isDesktop,
  isMarkdownFile,
  joinPath,
} from "../utils/path.utils";

// Manages the currently open folder ("workspace"): building the file tree
// (from the Tauri filesystem on desktop, or from a browser directory input
// in the web build), and persisting/restoring which files were open.
//
// `openDocument` is injected (see useDocumentTabs) to avoid a circular
// dependency between the two hooks; `tabs`/`activeTab` are needed to know
// which open tabs belong to the workspace when saving it.
export function useWorkspace({
  language,
  tabs,
  activeTab,
  openDocument,
  closeWorkspaceTabs,
  renameOpenTab,
  closeTabByPath,
}) {
  const [workspacePath, setWorkspacePath] = useState(null);
  const [workspaceTree, setWorkspaceTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(() => new Set());
  // { path, name } of a file pending a delete confirmation, or null.
  const [deleteRequest, setDeleteRequest] = useState(null);

  async function buildWorkspaceTree(directoryPath) {
    const entries = await readDir(directoryPath);
    const nodes = await Promise.all(
      entries
        .filter((entry) => entry.name !== WORKSPACE_FILE)
        .map(async (entry) => {
          const entryPath = joinPath(directoryPath, entry.name);

          if (entry.isDirectory) {
            const children = await buildWorkspaceTree(entryPath);
            return { name: entry.name, path: entryPath, type: "directory", children };
          }

          return entry.isFile && isMarkdownFile(entry.name)
            ? { name: entry.name, path: entryPath, type: "file" }
            : null;
        }),
    );

    return nodes
      .filter(Boolean)
      .sort((left, right) => {
        if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
        return left.name.localeCompare(right.name, language);
      });
  }

  async function refreshWorkspaceTree(directoryPath = workspacePath) {
    if (!directoryPath || !isDesktop()) return;
    try {
      const tree = await buildWorkspaceTree(directoryPath);
      setWorkspaceTree(tree);
      setExpandedFolders(new Set(getDirectoryPaths(tree)));
    } catch (error) {
      console.error("Failed to build workspace tree for", directoryPath, error);
      setWorkspaceTree([]);
    }
  }

  function createBrowserWorkspaceTree(files) {
    const tree = [];

    files
      .filter((file) => isMarkdownFile(file.name))
      .forEach((file) => {
        const pathParts = (file.webkitRelativePath || file.name).split("/");
        const relativePath = pathParts.slice(1).join("/") || file.name;
        const directoryParts = relativePath.split("/").slice(0, -1);
        let nodes = tree;

        directoryParts.forEach((directoryName, index) => {
          const directoryPath = pathParts.slice(0, index + 2).join("/");
          let directory = nodes.find(
            (node) => node.type === "directory" && node.name === directoryName,
          );

          if (!directory) {
            directory = {
              name: directoryName,
              path: directoryPath,
              type: "directory",
              children: [],
            };
            nodes.push(directory);
          }

          nodes = directory.children;
        });

        nodes.push({
          name: file.name,
          path: file.webkitRelativePath || file.name,
          type: "file",
          browserFile: file,
        });
      });

    function sortNodes(nodes) {
      return nodes
        .sort((left, right) => {
          if (left.type !== right.type) return left.type === "directory" ? -1 : 1;
          return left.name.localeCompare(right.name, language);
        })
        .map((node) =>
          node.children ? { ...node, children: sortNodes(node.children) } : node,
        );
    }

    return sortNodes(tree);
  }

  function openBrowserWorkspace(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (files.length === 0) return;

    const firstPath = files[0].webkitRelativePath || files[0].name;
    const tree = createBrowserWorkspaceTree(files);
    setWorkspacePath(firstPath.split("/")[0]);
    setWorkspaceTree(tree);
    setExpandedFolders(new Set(getDirectoryPaths(tree)));
  }

  async function openWorkspace() {
    if (!isDesktop()) {
      document.getElementById("workspace")?.click();
      return;
    }

    const path = await openDialog({ directory: true, multiple: false });
    if (!path) return;

    setWorkspacePath(path);
    await refreshWorkspaceTree(path);

    try {
      const configPath = joinPath(joinPath(path, WORKSPACE_FILE), WORKSPACE_CONFIG_FILE);
      const workspace = JSON.parse(await readTextFile(configPath));
      const storedFiles = Array.isArray(workspace.openFiles) ? workspace.openFiles : [];

      for (const filePath of storedFiles) {
        await openDocument(joinPath(path, filePath));
      }
    } catch {
      // No saved MarkNotes workspace yet for this folder: create one right
      // away so `.marknotes/workspace.json` exists from the first open,
      // instead of only appearing after an explicit "save workspace".
      await saveWorkspace(path);
    }
  }

  async function saveWorkspace(directoryPath = workspacePath) {
    if (!directoryPath || !isDesktop()) return;

    try {
      const workspaceDirectory = joinPath(directoryPath, WORKSPACE_FILE);
      await mkdir(workspaceDirectory, { recursive: true });
      await writeTextFile(
        joinPath(workspaceDirectory, WORKSPACE_CONFIG_FILE),
        JSON.stringify(
          {
            version: 1,
            openFiles: tabs
              .filter((tab) => tab.path?.startsWith(directoryPath))
              .map((tab) => getRelativePath(directoryPath, tab.path)),
            activeFile: activeTab?.path?.startsWith(directoryPath)
              ? getRelativePath(directoryPath, activeTab.path)
              : null,
          },
          null,
          2,
        ),
      );
    } catch (error) {
      console.error("Failed to save workspace config for", directoryPath, error);
    }
  }

  // Keeps `.marknotes/workspace.json` in sync with which files are open and
  // which one is active. The dependency is a key built from *paths only*
  // (not the `tabs` array itself), so this only re-runs when a workspace
  // tab is opened/closed or the active tab changes - not on every keystroke,
  // since editing content also produces a new `tabs` reference.
  const openWorkspaceTabPaths = workspacePath
    ? tabs
        .filter((tab) => tab.path?.startsWith(workspacePath))
        .map((tab) => tab.path)
    : [];
  const openFilesKey = openWorkspaceTabPaths.join("|");
  const activeFilePath = workspacePath && activeTab?.path?.startsWith(workspacePath)
    ? activeTab.path
    : null;

  useEffect(() => {
    if (!workspacePath || !isDesktop()) return;
    saveWorkspace(workspacePath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspacePath, openFilesKey, activeFilePath]);

  // Removes the workspace link (tree, expanded state, path) and closes every
  // open tab that belongs to it. If any of those tabs has unsaved changes,
  // the confirmation modal offers to save all of them to disk before
  // closing - the workspace state itself is only reset once that's settled,
  // so a cancel leaves everything untouched.
  function closeWorkspace() {
    if (!workspacePath) return;

    const currentWorkspacePath = workspacePath;
    const workspaceTabIds = tabs
      .filter((tab) => tab.path?.startsWith(currentWorkspacePath))
      .map((tab) => tab.id);

    closeWorkspaceTabs(workspaceTabIds, () => {
      setWorkspacePath(null);
      setWorkspaceTree([]);
      setExpandedFolders(new Set());
    });
  }

  // Creates a new empty markdown file directly inside `directoryPath`, then
  // opens it. `fileName` is whatever the user typed in the inline input -
  // the .md extension is added if missing.
  async function createFile(directoryPath, fileName) {
    if (!isDesktop() || !fileName?.trim()) return;

    const name = isMarkdownFile(fileName) ? fileName.trim() : `${fileName.trim()}.md`;
    const filePath = joinPath(directoryPath, name);

    try {
      await writeTextFile(filePath, "");
      await refreshWorkspaceTree();
      await openDocument(filePath);
    } catch (error) {
      console.error("Failed to create file", filePath, error);
    }
  }

  // Renames a file or folder in place (same parent directory), then keeps
  // any open tab for it pointing at the new path/name instead of a path
  // that no longer exists on disk.
  async function renameEntry(entryPath, newName) {
    if (!isDesktop() || !newName?.trim()) return;

    const currentName = getFileName(entryPath);
    const parentPath = entryPath
      .slice(0, entryPath.length - currentName.length)
      .replace(/[\\/]+$/, "");
    const trimmedName = newName.trim();
    const finalName =
      currentName.includes(".") && !trimmedName.includes(".")
        ? `${trimmedName}.${currentName.split(".").pop()}`
        : trimmedName;
    const newPath = joinPath(parentPath, finalName);

    if (newPath === entryPath) return;

    try {
      await rename(entryPath, newPath);
      await refreshWorkspaceTree();
      renameOpenTab?.(entryPath, newPath, finalName);
    } catch (error) {
      console.error("Failed to rename", entryPath, error);
    }
  }

  function requestDelete(entryPath, entryName) {
    setDeleteRequest({ path: entryPath, name: entryName });
  }

  function cancelDelete() {
    setDeleteRequest(null);
  }

  async function confirmDelete() {
    const request = deleteRequest;
    if (!request) return;

    try {
      await remove(request.path, { recursive: true });
      await refreshWorkspaceTree();
      closeTabByPath?.(request.path);
    } catch (error) {
      console.error("Failed to delete", request.path, error);
    } finally {
      setDeleteRequest(null);
    }
  }

  return {
    workspacePath,
    workspaceTree,
    expandedFolders,
    setExpandedFolders,
    refreshWorkspaceTree,
    openWorkspace,
    closeWorkspace,
    saveWorkspace,
    openBrowserWorkspace,
    createFile,
    renameEntry,
    deleteRequest,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
}