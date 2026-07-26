import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileText,
  FolderOpen,
  FolderX,
  Pencil,
  Trash2,
} from "lucide-react";
import IconButton from "../IconButton";
import { getFileName } from "../../utils/path.utils";

// Inline text input used both for renaming an existing node and for typing
// the name of a new file. Local, uncontrolled-ish state so keystrokes don't
// round-trip through the workspace tree on every character.
function InlineNameInput({ initialValue, placeholder, onSubmit, onCancel }) {
  const [value, setValue] = useState(initialValue || "");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  function submit() {
    const trimmed = value.trim();
    if (trimmed) {
      onSubmit(trimmed);
    } else {
      onCancel();
    }
  }

  return (
    <input
      ref={inputRef}
      className="workspace-inline-input"
      value={value}
      placeholder={placeholder}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => setValue(event.target.value)}
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          submit();
        } else if (event.key === "Escape") {
          event.preventDefault();
          onCancel();
        }
      }}
    />
  );
}

function WorkspaceNodes({
  nodes,
  depth = 0,
  translate,
  expandedFolders,
  onToggleFolder,
  onOpenDocument,
  onOpenBrowserWorkspaceFile,
  isDesktopApp,
  editingPath,
  creatingInFolder,
  onStartRename,
  onSubmitRename,
  onCancelEdit,
  onStartCreate,
  onSubmitCreate,
  onRequestDelete,
  onContextMenu,
}) {
  return nodes.map((node) => (
    <React.Fragment key={node.path}>
      {node.type === "directory" ? (
        <div
          className="workspace-row workspace-folder-row"
          style={{ paddingLeft: 10 + depth * 14 }}
          onContextMenu={(event) => onContextMenu(event, node)}
        >
          {editingPath === node.path ? (
            <InlineNameInput
              initialValue={node.name}
              onSubmit={(newName) => onSubmitRename(node, newName)}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <button
                className="workspace-folder"
                onClick={() => onToggleFolder(node.path)}
                aria-expanded={expandedFolders.has(node.path)}
              >
                {expandedFolders.has(node.path) ? <ChevronDown /> : <ChevronRight />}
                <FolderOpen />
                <span>{node.name}</span>
              </button>
              {isDesktopApp && (
                <div className="workspace-row-actions">
                  <IconButton
                    title={translate("newFile")}
                    onClick={() => onStartCreate(node.path)}
                  >
                    <FilePlus />
                  </IconButton>
                  <IconButton title={translate("rename")} onClick={() => onStartRename(node.path)}>
                    <Pencil />
                  </IconButton>
                  <IconButton
                    title={translate("delete")}
                    onClick={() => onRequestDelete(node.path, node.name)}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div
          className="workspace-row workspace-file-row"
          style={{ paddingLeft: 10 + depth * 14 }}
          onContextMenu={(event) => onContextMenu(event, node)}
        >
          {editingPath === node.path ? (
            <InlineNameInput
              initialValue={node.name}
              onSubmit={(newName) => onSubmitRename(node, newName)}
              onCancel={onCancelEdit}
            />
          ) : (
            <>
              <button
                className="workspace-file"
                onClick={() =>
                  node.browserFile
                    ? onOpenBrowserWorkspaceFile(node.browserFile, node.path)
                    : onOpenDocument(node.path)
                }
                title={node.path}
              >
                <FileText />
                <span>{node.name}</span>
              </button>
              {isDesktopApp && (
                <div className="workspace-row-actions">
                  <IconButton title={translate("rename")} onClick={() => onStartRename(node.path)}>
                    <Pencil />
                  </IconButton>
                  <IconButton
                    title={translate("delete")}
                    onClick={() => onRequestDelete(node.path, node.name)}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {node.type === "directory" && creatingInFolder === node.path && (
        <div
          className="workspace-row workspace-file-row"
          style={{ paddingLeft: 10 + (depth + 1) * 14 }}
        >
          <FileText />
          <InlineNameInput
            placeholder="nouveau-fichier.md"
            onSubmit={(fileName) => onSubmitCreate(node.path, fileName)}
            onCancel={onCancelEdit}
          />
        </div>
      )}

      {node.children && expandedFolders.has(node.path) && (
        <WorkspaceNodes
          nodes={node.children}
          depth={depth + 1}
          translate={translate}
          expandedFolders={expandedFolders}
          onToggleFolder={onToggleFolder}
          onOpenDocument={onOpenDocument}
          onOpenBrowserWorkspaceFile={onOpenBrowserWorkspaceFile}
          isDesktopApp={isDesktopApp}
          editingPath={editingPath}
          creatingInFolder={creatingInFolder}
          onStartRename={onStartRename}
          onSubmitRename={onSubmitRename}
          onCancelEdit={onCancelEdit}
          onStartCreate={onStartCreate}
          onSubmitCreate={onSubmitCreate}
          onRequestDelete={onRequestDelete}
          onContextMenu={onContextMenu}
        />
      )}
    </React.Fragment>
  ));
}

export default function WorkspaceExplorer({
  translate,
  isDesktopApp,
  workspacePath,
  workspaceTree,
  expandedFolders,
  onToggleFolder,
  onOpenWorkspace,
  onCloseWorkspace,
  onOpenDocument,
  onOpenBrowserWorkspaceFile,
  onCreateFile,
  onRenameEntry,
  onRequestDelete,
}) {
  // Path of the node currently shown as an inline rename input, or null.
  const [editingPath, setEditingPath] = useState(null);
  // Directory path currently showing an inline "new file" input, or null.
  const [creatingInFolder, setCreatingInFolder] = useState(null);
  // { x, y, node } for the open right-click context menu, or null.
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (!contextMenu) return undefined;
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [contextMenu]);

  function cancelEdit() {
    setEditingPath(null);
    setCreatingInFolder(null);
  }

  function startRename(path) {
    setContextMenu(null);
    setCreatingInFolder(null);
    setEditingPath(path);
  }

  function startCreate(directoryPath) {
    setContextMenu(null);
    setEditingPath(null);
    setCreatingInFolder(directoryPath);
    if (!expandedFolders.has(directoryPath)) {
      onToggleFolder(directoryPath);
    }
  }

  function submitRename(node, newName) {
    setEditingPath(null);
    if (newName !== node.name) {
      onRenameEntry(node.path, newName);
    }
  }

  function submitCreate(directoryPath, fileName) {
    setCreatingInFolder(null);
    onCreateFile(directoryPath, fileName);
  }

  function requestDelete(path, name) {
    setContextMenu(null);
    onRequestDelete(path, name);
  }

  function openContextMenu(event, node) {
    if (!isDesktopApp) return;
    event.preventDefault();
    setContextMenu({ x: event.clientX, y: event.clientY, node });
  }

  return (
    <section className="workspace-explorer">
      <div className="sidebar-heading">
        <h2>{translate("workspace")}</h2>
        <IconButton title={translate("openFolder")} onClick={onOpenWorkspace}>
          <FolderOpen />
        </IconButton>
        {workspacePath && (
          <>
            {isDesktopApp && (
              <IconButton
                title={translate("newFile")}
                onClick={() => startCreate(workspacePath)}
              >
                <FilePlus />
              </IconButton>
            )}
            <IconButton title={translate("closeWorkspace")} onClick={onCloseWorkspace}>
              <FolderX />
            </IconButton>
          </>
        )}
      </div>
      {workspacePath ? (
        <>
          <p className="workspace-root" title={workspacePath}>
            {getFileName(workspacePath)}
          </p>
          <div className="workspace-tree">
            <WorkspaceNodes
              nodes={workspaceTree}
              translate={translate}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onOpenDocument={onOpenDocument}
              onOpenBrowserWorkspaceFile={onOpenBrowserWorkspaceFile}
              isDesktopApp={isDesktopApp}
              editingPath={editingPath}
              creatingInFolder={creatingInFolder}
              onStartRename={startRename}
              onSubmitRename={submitRename}
              onCancelEdit={cancelEdit}
              onStartCreate={startCreate}
              onSubmitCreate={submitCreate}
              onRequestDelete={requestDelete}
              onContextMenu={openContextMenu}
            />
            {creatingInFolder === workspacePath && (
              <div className="workspace-row workspace-file-row" style={{ paddingLeft: 10 }}>
                <FileText />
                <InlineNameInput
                  placeholder="nouveau-fichier.md"
                  onSubmit={(fileName) => submitCreate(workspacePath, fileName)}
                  onCancel={cancelEdit}
                />
              </div>
            )}
          </div>
        </>
      ) : (
        <p>{translate("noWorkspace")}</p>
      )}

      {contextMenu && (
        <ul
          className="workspace-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {contextMenu.node.type === "directory" && (
            <li onClick={() => startCreate(contextMenu.node.path)}>
              <FilePlus />
              {translate("newFile")}
            </li>
          )}
          <li onClick={() => startRename(contextMenu.node.path)}>
            <Pencil />
            {translate("rename")}
          </li>
          <li onClick={() => requestDelete(contextMenu.node.path, contextMenu.node.name)}>
            <Trash2 />
            {translate("delete")}
          </li>
        </ul>
      )}
    </section>
  );
}
