import { useState } from "react";
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "../constants/app.constants";
import { clampNumber } from "../utils/path.utils";

// Owns the "insert table" modal's form state and the Markdown/HTML
// generation logic that turns it into an actual table.
export function useTableInsertion({ insertBlock }) {
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableColumns, setTableColumns] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const [columnAlignments, setColumnAlignments] = useState([
    "left",
    "left",
    "left",
  ]);

  function updateTableColumnCount(value) {
    const nextColumnCount = clampNumber(value, 1, MAX_TABLE_COLUMNS);

    setTableColumns(nextColumnCount);
    setColumnAlignments((currentAlignments) =>
      Array.from(
        { length: nextColumnCount },
        (_, index) => currentAlignments[index] || "left",
      ),
    );
  }

  function insertTable() {
    const rowCount = clampNumber(tableRows, 1, MAX_TABLE_ROWS);
    const columnCount = clampNumber(tableColumns, 1, MAX_TABLE_COLUMNS);
    const alignments = columnAlignments.slice(0, columnCount);

    if (tableHasHeader) {
      const headerRow = `| ${Array.from(
        { length: columnCount },
        (_, index) => `Column ${index + 1}`,
      ).join(" | ")} |`;

      const alignmentRow = `| ${alignments
        .map((alignment) => {
          if (alignment === "center") return ":---:";
          if (alignment === "right") return "---:";
          return ":---";
        })
        .join(" | ")} |`;

      const bodyRows = Array.from(
        { length: rowCount },
        () => `| ${Array(columnCount).fill("Value").join(" | ")} |`,
      ).join("\n");

      insertBlock(`${headerRow}\n${alignmentRow}\n${bodyRows}`);
    } else {
      const bodyRows = Array.from(
        { length: rowCount },
        () => `  <tr>\n${alignments
          .map(
            (alignment) =>
              `    <td style="text-align:${alignment}">Value</td>`,
          )
          .join("\n")}\n  </tr>`,
      ).join("\n");

      insertBlock(`<table>\n${bodyRows}\n</table>`);
    }

    setTableModalOpen(false);
  }

  return {
    tableModalOpen,
    setTableModalOpen,
    tableRows,
    setTableRows,
    tableColumns,
    tableHasHeader,
    setTableHasHeader,
    columnAlignments,
    setColumnAlignments,
    updateTableColumnCount,
    insertTable,
  };
}
