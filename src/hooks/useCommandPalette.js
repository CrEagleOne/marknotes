import { useEffect, useRef, useState } from "react";

// Builds the command list, and owns the command palette's open/query state
// plus the global keyboard shortcut listener that runs those same commands.
export function useCommandPalette({
  translate,
  createNewDocument,
  openFile,
  saveFile,
  exportPdf,
  toggleTheme,
  setSidebarVisible,
  setView,
}) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const commandInputRef = useRef(null);

  const commands = [
    { id: "new", label: translate("new"), shortcut: "Ctrl+N", action: createNewDocument },
    { id: "open", label: translate("open"), shortcut: "Ctrl+O", action: openFile },
    { id: "save", label: translate("save"), shortcut: "Ctrl+S", action: saveFile },
    { id: "pdf", label: translate("exportPdf"), shortcut: "Ctrl+Shift+P", action: exportPdf },
    { id: "theme", label: translate("theme"), shortcut: "", action: toggleTheme },
    {
      id: "sidebar",
      label: translate("sidebar"),
      shortcut: "Ctrl+B",
      action: () => setSidebarVisible((isVisible) => !isVisible),
    },
    { id: "split", label: translate("split"), shortcut: "Ctrl+1", action: () => setView("split") },
    { id: "editor", label: translate("editorOnly"), shortcut: "Ctrl+2", action: () => setView("editor") },
    { id: "preview", label: translate("previewOnly"), shortcut: "Ctrl+3", action: () => setView("preview") },
  ];

  function openCommandPalette() {
    setCommandQuery("");
    setCommandPaletteOpen(true);
  }

  function runCommand(command) {
    setCommandPaletteOpen(false);
    command.action();
  }

  useEffect(() => {
    if (commandPaletteOpen) {
      commandInputRef.current?.focus();
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    function handleKeyboardShortcut(event) {
      const hasModifier = event.ctrlKey || event.metaKey;

      if (event.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
        return;
      }

      if (!hasModifier) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "p" && !event.shiftKey) {
        event.preventDefault();
        openCommandPalette();
        return;
      }

      const command = commands.find((item) => {
        const shortcutKey = item.shortcut.split("+").at(-1)?.toLowerCase();
        const requiresShift = item.shortcut.includes("Shift");

        return shortcutKey === key && requiresShift === event.shiftKey;
      });

      if (!command) {
        return;
      }

      event.preventDefault();
      runCommand(command);
    }

    window.addEventListener("keydown", handleKeyboardShortcut);
    return () => window.removeEventListener("keydown", handleKeyboardShortcut);
  }, [commandPaletteOpen, commands]);

  return {
    commands,
    commandPaletteOpen,
    setCommandPaletteOpen,
    commandQuery,
    setCommandQuery,
    commandInputRef,
    openCommandPalette,
    runCommand,
  };
}
