import { useState } from "react";
import {
  AlignLeft,
  ArrowDownUp,
  Beaker,
  Bold,
  BookOpenText,
  Braces,
  Code2,
  Columns2,
  Eye,
  Heading,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Palette,
  Quote,
  Sigma,
  Strikethrough,
  Table2,
} from "lucide-react";
import IconButton from "../IconButton";
import { ALIGNMENT_OPTIONS } from "../../constants/app.constants";

export default function EditorToolbar({
  translate,
  rememberSelection,
  applyHeading,
  wrapSelection,
  prefixSelectedLines,
  insertBlock,
  onOpenTableModal,
  onInsertTableOfContents,
  view,
  setView,
  syncPreviewScroll,
  setSyncPreviewScroll,
}) {
  const [headingMenuOpen, setHeadingMenuOpen] = useState(false);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [alignmentMenuOpen, setAlignmentMenuOpen] = useState(false);
  const [color, setColor] = useState("#dc2626");

  return (
    <nav className="toolbar">
      <div className="menu">
        <IconButton
          title={translate("heading")}
          onClick={() => {
            rememberSelection();
            setHeadingMenuOpen((isOpen) => !isOpen);
          }}
        >
          <Heading />
        </IconButton>

        {headingMenuOpen && (
          <div className="dropdown">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <button
                key={level}
                onClick={() => applyHeading(level, () => setHeadingMenuOpen(false))}
              >
                {translate("heading")} {level}
              </button>
            ))}
          </div>
        )}
      </div>

      <IconButton
        title={translate("bold")}
        onClick={() => wrapSelection("**", "**", "bold text")}
      >
        <Bold />
      </IconButton>

      <IconButton
        title={translate("italic")}
        onClick={() => wrapSelection("_", "_", "italic text")}
      >
        <Italic />
      </IconButton>

      <IconButton
        title={translate("strike")}
        onClick={() => wrapSelection("~~", "~~", "text")}
      >
        <Strikethrough />
      </IconButton>

      <IconButton
        title={translate("quote")}
        onClick={() => prefixSelectedLines("> ")}
      >
        <Quote />
      </IconButton>

      <IconButton
        title={translate("code")}
        onClick={() =>
          insertBlock("```javascript\nconst value = true;\n```")
        }
      >
        <Code2 />
      </IconButton>

      <IconButton
        title={translate("link")}
        onClick={() =>
          wrapSelection("[", "](https://example.com)", "link text")
        }
      >
        <Link />
      </IconButton>

      <IconButton
        title={translate("image")}
        onClick={() =>
          wrapSelection(
            "![",
            "](https://example.com/image.png)",
            "description",
          )
        }
      >
        <Image />
      </IconButton>

      <IconButton
        title={translate("bullets")}
        onClick={() => prefixSelectedLines("- ")}
      >
        <List />
      </IconButton>

      <IconButton
        title={translate("numbers")}
        onClick={() => prefixSelectedLines("{n}. ")}
      >
        <ListOrdered />
      </IconButton>

      <div className="menu">
        <IconButton
          title={translate("color")}
          onClick={() => {
            rememberSelection();
            setColorMenuOpen((isOpen) => !isOpen);
          }}
        >
          <Palette />
        </IconButton>

        {colorMenuOpen && (
          <div className="dropdown panel">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
            <button
              onClick={() => {
                wrapSelection(
                  `<span style="color:${color}">`,
                  "</span>",
                  "Text",
                );
                setColorMenuOpen(false);
              }}
            >
              {translate("insert")}
            </button>
          </div>
        )}
      </div>

      <div className="menu">
        <IconButton
          title={translate("alignment")}
          onClick={() => {
            rememberSelection();
            setAlignmentMenuOpen((isOpen) => !isOpen);
          }}
        >
          <AlignLeft />
        </IconButton>

        {alignmentMenuOpen && (
          <div className="dropdown">
            {ALIGNMENT_OPTIONS.map(([value, AlignmentIcon]) => (
              <button
                key={value}
                onClick={() => {
                  wrapSelection(
                    `<div style="text-align:${value}">\n`,
                    "\n</div>",
                    "Text",
                  );
                  setAlignmentMenuOpen(false);
                }}
              >
                <AlignmentIcon />
                {translate(value)}
              </button>
            ))}
          </div>
        )}
      </div>

      <IconButton
        title={translate("table")}
        onClick={() => {
          rememberSelection();
          onOpenTableModal();
        }}
      >
        <Table2 />
      </IconButton>

      <IconButton
        title={translate("inlineMath")}
        onClick={() => wrapSelection("$", "$", "E=mc^2")}
      >
        <Sigma />
      </IconButton>

      <IconButton
        title={translate("chemistry")}
        onClick={() => insertBlock("$$\n\\ce{2H2 + O2 -> 2H2O}\n$$")}
      >
        <Beaker />
      </IconButton>

      <IconButton
        title={translate("diagram")}
        onClick={() =>
          insertBlock(
            "```mermaid\nflowchart LR\n A[Start] --> B[Result]\n```",
          )
        }
      >
        <Braces />
      </IconButton>

      <IconButton
        title={translate("toc")}
        onClick={onInsertTableOfContents}
      >
        <BookOpenText />
      </IconButton>

      <span className="spacer" />

      <IconButton
        title={translate("split")}
        active={view === "split"}
        onClick={() => setView("split")}
      >
        <Columns2 />
      </IconButton>

      <IconButton
        title={translate("editorOnly")}
        active={view === "editor"}
        onClick={() => setView("editor")}
      >
        <Code2 />
      </IconButton>

      <IconButton
        title={translate("previewOnly")}
        active={view === "preview"}
        onClick={() => setView("preview")}
      >
        <Eye />
      </IconButton>

      <IconButton
        title={translate("syncPreviewScroll")}
        active={syncPreviewScroll}
        onClick={() => setSyncPreviewScroll((isEnabled) => !isEnabled)}
      >
        <ArrowDownUp />
      </IconButton>
    </nav>
  );
}
