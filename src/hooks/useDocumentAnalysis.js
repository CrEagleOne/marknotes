import { useMemo } from "react";
import { renderMarkdown } from "../markdown";

export function useDocumentAnalysis(content) {
  const renderedHtml = useMemo(() => {
    return renderMarkdown(content);
  }, [content]);

  const headings = useMemo(
    () =>
      content
        .split("\n")
        .map((line, lineNumber) => {
          const match = line.match(/^(#{1,6})\s+(.+)$/);

          if (!match) {
            return null;
          }

          return {
            level: match[1].length,
            text: match[2].replace(/[\*_`~]/g, ""),
            line: lineNumber,
          };
        })
        .filter(Boolean),
    [content],
  );

  const statistics = useMemo(
    () => ({
      words: content.trim() ? content.trim().split(/\s+/u).length : 0,
      characters: content.length,
    }),
    [content],
  );

  return { renderedHtml, headings, statistics };
}
