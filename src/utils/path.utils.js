import { MARKDOWN_EXTENSIONS } from "../constants/app.constants";

export function isDesktop() {
  return Boolean(window.__TAURI_INTERNALS__);
}

export function clampNumber(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, Number(value) || minimum));
}

export function createSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function createSafeFileName(value) {
  return (
    value
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "-")
      .replace(/\s+/g, "-") || "document"
  );
}

export function removeMarkdownExtension(fileName) {
  return fileName.replace(/\.(md|markdown|txt)$/i, "");
}

export function getFileName(path) {
  return String(path).split(/[\\/]/).pop() || "";
}

export function isMarkdownFile(path) {
  return MARKDOWN_EXTENSIONS.some((extension) =>
    String(path).toLowerCase().endsWith(`.${extension}`),
  );
}

export function joinPath(directory, fileName) {
  return `${directory}${directory.endsWith("\\") || directory.endsWith("/") ? "" : "\\"}${fileName}`;
}

export function getRelativePath(rootPath, filePath) {
  return filePath.slice(rootPath.length).replace(/^[\\/]+/, "");
}

export function getDirectoryPaths(nodes) {
  return nodes.flatMap((node) =>
    node.type === "directory"
      ? [node.path, ...getDirectoryPaths(node.children)]
      : [],
  );
}
