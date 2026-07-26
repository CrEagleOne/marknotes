import {
  FileDown,
  FileText,
  FolderOpen,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Save,
  Sun,
  Upload,
} from "lucide-react";
import IconButton from "../IconButton";

export default function AppHeader({
  translate,
  sidebarVisible,
  onToggleSidebar,
  onCreateNewDocument,
  onOpenFile,
  onOpenWorkspace,
  onOpenBrowserFile,
  onOpenBrowserWorkspace,
  onSaveFile,
  isDesktopApp,
  workspacePath,
  onSaveWorkspace,
  onExportPdf,
  theme,
  onToggleTheme,
}) {
  return (
    <header>
      <IconButton
        title={translate("sidebar")}
        active={sidebarVisible}
        onClick={onToggleSidebar}
      >
        {sidebarVisible ? <PanelLeftClose /> : <PanelLeftOpen />}
      </IconButton>

      <div className="brand">
        <FileText />
        <div>
          <b>{translate("app")}</b>
          <small>{translate("tag")}</small>
        </div>
      </div>

      <div className="top">
        <button onClick={onCreateNewDocument}>
          <FileText />
          {translate("new")}
        </button>

        <button onClick={onOpenFile}>
          <Upload />
          {translate("open")}
        </button>

        <button onClick={onOpenWorkspace}>
          <FolderOpen />
          {translate("openFolder")}
        </button>

        <input
          id="file"
          hidden
          type="file"
          accept=".md,.markdown,.txt"
          onChange={onOpenBrowserFile}
        />

        <input
          id="workspace"
          hidden
          type="file"
          multiple
          webkitdirectory=""
          onChange={onOpenBrowserWorkspace}
        />

        <button onClick={onSaveFile}>
          <Save />
          {translate("save")}
        </button>

        {isDesktopApp && workspacePath && (
          <button onClick={() => onSaveWorkspace()}>
            <Save />
            {translate("saveWorkspace")}
          </button>
        )}

        <button className="primary" onClick={onExportPdf}>
          <FileDown />
          {translate("pdf")}
        </button>

        <IconButton title={translate("theme")} onClick={onToggleTheme}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </IconButton>
      </div>
    </header>
  );
}