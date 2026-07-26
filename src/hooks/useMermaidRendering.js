import { useEffect } from "react";
import mermaid from "mermaid";

// Convert Mermaid code blocks in both the preview and print containers.
export function useMermaidRendering({
  previewRef,
  printRef,
  renderedHtml,
  theme,
  view,
  language,
  translate,
}) {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: theme === "dark" ? "dark" : "default",
      suppressErrorRendering: true,
    });

    let cancelled = false;

    async function renderMermaidDiagrams() {
      const diagramNodes = [];

      [previewRef.current, printRef.current]
        .filter(Boolean)
        .forEach((root) => {
          root
            .querySelectorAll("pre > code.language-mermaid")
            .forEach((codeElement) => {
              const diagramContainer = document.createElement("div");
              diagramContainer.className = "mermaid diagram";
              diagramContainer.textContent = codeElement.textContent || "";
              codeElement.parentElement?.replaceWith(diagramContainer);
              diagramNodes.push(diagramContainer);
            });
        });

      if (diagramNodes.length === 0 || cancelled) {
        return;
      }

      try {
        await mermaid.run({
          nodes: diagramNodes,
          suppressErrors: true,
        });
      } catch {
        diagramNodes.forEach((node) => {
          node.className = "diagram-error";
          node.textContent = translate("error");
        });
      }
    }

    renderMermaidDiagrams();

    return () => {
      cancelled = true;
    };
  }, [renderedHtml, theme, view, language]);
}
