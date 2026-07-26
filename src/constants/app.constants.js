import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
} from "lucide-react";

export const DEFAULT_LANGUAGE = "en";
export const DEFAULT_THEME = "light";
export const DEFAULT_VIEW = "split";
export const MAX_TABLE_ROWS = 15;
export const MAX_TABLE_COLUMNS = 10;
export const AUTO_SAVE_DELAY = 800;

export const STORAGE_KEYS = {
  document: "mo-doc",
  language: "mo-lang",
  theme: "mo-theme",
  syncPreviewScroll: "mo-sync-preview-scroll",
};

export const WORKSPACE_FILE = ".marknotes";
export const WORKSPACE_CONFIG_FILE = "workspace.json";
export const MARKDOWN_EXTENSIONS = ["md", "markdown", "txt"];

export const ALIGNMENT_OPTIONS = [
  ["left", AlignLeft],
  ["center", AlignCenter],
  ["right", AlignRight],
  ["justify", AlignJustify],
];
