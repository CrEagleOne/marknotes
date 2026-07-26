import WorkspaceExplorer from "./WorkspaceExplorer";
import DocumentOutline from "./DocumentOutline";

export default function Sidebar({
  translate,
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
  isDesktopApp,
  headings,
  onJumpToHeading,
}) {
  return (
    <aside>
      <WorkspaceExplorer
        translate={translate}
        isDesktopApp={isDesktopApp}
        workspacePath={workspacePath}
        workspaceTree={workspaceTree}
        expandedFolders={expandedFolders}
        onToggleFolder={onToggleFolder}
        onOpenWorkspace={onOpenWorkspace}
        onCloseWorkspace={onCloseWorkspace}
        onOpenDocument={onOpenDocument}
        onOpenBrowserWorkspaceFile={onOpenBrowserWorkspaceFile}
        onCreateFile={onCreateFile}
        onRenameEntry={onRenameEntry}
        onRequestDelete={onRequestDelete}
      />
      <DocumentOutline
        translate={translate}
        headings={headings}
        onJumpToHeading={onJumpToHeading}
      />
    </aside>
  );
}
