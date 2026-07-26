import Modal from "../Modal";

export default function WorkspaceUnsavedChangesModal({
  translate,
  fileCount,
  onCancel,
  onDiscard,
  onSaveAndClose,
}) {
  return (
    <Modal onClose={onCancel}>
      <h2>{translate("unsavedWorkspaceChangesTitle")}</h2>

      <p>
        {fileCount} {translate("unsavedWorkspaceChangesMessage")}
      </p>

      <div className="actions">
        <button onClick={onCancel}>{translate("cancel")}</button>
        <button onClick={onDiscard}>
          {translate("closeWithoutSaving")}
        </button>
        <button className="primary" onClick={onSaveAndClose}>
          {translate("saveAndClose")}
        </button>
      </div>
    </Modal>
  );
}
