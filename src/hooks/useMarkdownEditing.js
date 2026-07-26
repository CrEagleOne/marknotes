import { useRef } from "react";
import { createSlug } from "../utils/path.utils";

// Groups every action that edits `content` through the editor's current
// text selection (bold/italic/headings/blocks/TOC/heading navigation).
export function useMarkdownEditing({
  content,
  setContent,
  editorRef,
  view,
  setView,
  translate,
  headings,
}) {
  const selectionRef = useRef({ start: 0, end: 0 });

  function rememberSelection() {
    if (!editorRef.current) {
      return;
    }

    selectionRef.current = {
      start: editorRef.current.selectionStart,
      end: editorRef.current.selectionEnd,
    };
  }

  function replaceSelection(value, selectionOffset = 0, selectionLength = 0) {
    const { start, end } = selectionRef.current;

    setContent((currentContent) =>
      currentContent.slice(0, start) + value + currentContent.slice(end),
    );

    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(
        start + selectionOffset,
        start + selectionOffset + selectionLength,
      );
    });
  }

  function wrapSelection(before, after, placeholder) {
    rememberSelection();

    const { start, end } = selectionRef.current;
    const selectedText = content.slice(start, end) || placeholder;

    replaceSelection(
      before + selectedText + after,
      before.length,
      selectedText.length,
    );
  }

  function insertBlock(value) {
    rememberSelection();

    const { start, end } = selectionRef.current;
    const prefix = start > 0 && content[start - 1] !== "\n" ? "\n" : "";

    setContent(
      (currentContent) =>
        currentContent.slice(0, start) +
        prefix +
        value +
        "\n" +
        currentContent.slice(end),
    );
  }

  function prefixSelectedLines(prefixTemplate) {
    rememberSelection();

    const { start, end } = selectionRef.current;
    const firstLineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextLineBreak = content.indexOf("\n", end);
    const lastLineEnd = nextLineBreak < 0 ? content.length : nextLineBreak;

    const updatedLines = content
      .slice(firstLineStart, lastLineEnd)
      .split("\n")
      .map(
        (line, index) =>
          prefixTemplate.replace("{n}", String(index + 1)) + line,
      )
      .join("\n");

    setContent(
      content.slice(0, firstLineStart) +
        updatedLines +
        content.slice(lastLineEnd),
    );
  }

  function applyHeading(level, closeHeadingMenu) {
    rememberSelection();

    const { start, end } = selectionRef.current;
    const firstLineStart = content.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const nextLineBreak = content.indexOf("\n", end);
    const lastLineEnd = nextLineBreak < 0 ? content.length : nextLineBreak;
    const headingPrefix = `${"#".repeat(level)} `;

    const updatedLines = content
      .slice(firstLineStart, lastLineEnd)
      .split("\n")
      .map((line) => headingPrefix + line.replace(/^#{1,6}\s+/, ""))
      .join("\n");

    setContent(
      content.slice(0, firstLineStart) +
        updatedLines +
        content.slice(lastLineEnd),
    );
    closeHeadingMenu?.();
  }

  function jumpToHeading(heading) {
    const lines = content.split("\n");
    const position = lines
      .slice(0, heading.line)
      .reduce((total, line) => total + line.length + 1, 0);

    if (view === "preview") {
      setView("split");
    }

    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(
        position,
        position + lines[heading.line].length,
      );
      editorRef.current?.scrollTo({
        top: Math.max(0, heading.line * 25 - 100),
        behavior: "smooth",
      });
    });
  }

  function insertTableOfContents() {
    const tableOfContents = headings
      .filter((heading) => heading.level > 1)
      .map(
        (heading) =>
          `${"  ".repeat(heading.level - 2)}- [${heading.text}](#${createSlug(
            heading.text,
          )})`,
      )
      .join("\n");

    insertBlock(
      `## ${translate("toc")}\n\n${
        tableOfContents || `- ${translate("none")}`
      }`,
    );
  }

  return {
    selectionRef,
    rememberSelection,
    replaceSelection,
    wrapSelection,
    insertBlock,
    prefixSelectedLines,
    applyHeading,
    jumpToHeading,
    insertTableOfContents,
  };
}
