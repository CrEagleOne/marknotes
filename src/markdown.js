import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import markedKatex from "marked-katex-extension";
import hljs from "highlight.js";
import DOMPurify from "dompurify";

const markdownParser = new Marked(
  { gfm: true, breaks: true },
  markedKatex({
    throwOnError: false,
    nonStandard: true,
    strict: "ignore",
    trust: false,
  }),
  markedHighlight({
    emptyLangClass: "hljs language-plaintext",
    langPrefix: "hljs language-",
    highlight(code, languageName) {
      const normalizedLanguage = String(languageName || "").trim().toLowerCase();

      if (normalizedLanguage === "mermaid") {
        return code;
      }

      const language = hljs.getLanguage(normalizedLanguage)
        ? normalizedLanguage
        : "plaintext";

      return hljs.highlight(code, { language }).value;
    },
  }),
);

export function renderMarkdown(content) {
  const normalizedContent = content.replace(/^[\u200B-\u200F\uFEFF]/, "");
  const parsedContent = markdownParser.parse(normalizedContent);

  return DOMPurify.sanitize(parsedContent, {
    ADD_ATTR: ["class", "id", "style", "aria-hidden"],
  });
}
