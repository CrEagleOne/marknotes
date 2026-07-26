import Modal from "../Modal";
import { MAX_TABLE_COLUMNS, MAX_TABLE_ROWS } from "../../constants/app.constants";
import { clampNumber } from "../../utils/path.utils";

export default function TableInsertModal({
  translate,
  onClose,
  tableRows,
  setTableRows,
  tableColumns,
  updateTableColumnCount,
  tableHasHeader,
  setTableHasHeader,
  columnAlignments,
  setColumnAlignments,
  onInsert,
}) {
  return (
    <Modal onClose={onClose}>
      <h2>{translate("tableTitle")}</h2>

      <div className="grid">
        <label>
          {translate("rows")}
          <input
            type="number"
            min="1"
            max={MAX_TABLE_ROWS}
            value={tableRows}
            onChange={(event) =>
              setTableRows(
                clampNumber(event.target.value, 1, MAX_TABLE_ROWS),
              )
            }
          />
        </label>

        <label>
          {translate("columns")}
          <input
            type="number"
            min="1"
            max={MAX_TABLE_COLUMNS}
            value={tableColumns}
            onChange={(event) =>
              updateTableColumnCount(event.target.value)
            }
          />
        </label>
      </div>

      <label className="check">
        <input
          type="checkbox"
          checked={tableHasHeader}
          onChange={(event) => setTableHasHeader(event.target.checked)}
        />
        {translate("header")}
      </label>

      <div className="columns">
        {Array.from({ length: tableColumns }, (_, index) => (
          <label key={index}>
            {translate("columns")} {index + 1} : {translate("alignment")}
            <select
              value={columnAlignments[index]}
              onChange={(event) =>
                setColumnAlignments((currentAlignments) =>
                  currentAlignments.map((alignment, alignmentIndex) =>
                    alignmentIndex === index
                      ? event.target.value
                      : alignment,
                  ),
                )
              }
            >
              <option value="left">{translate("left")}</option>
              <option value="center">{translate("center")}</option>
              <option value="right">{translate("right")}</option>
            </select>
          </label>
        ))}
      </div>

      <div className="actions">
        <button onClick={onClose}>
          {translate("cancel")}
        </button>
        <button className="primary" onClick={onInsert}>
          {translate("insert")}
        </button>
      </div>
    </Modal>
  );
}
