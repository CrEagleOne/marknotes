import Modal from "../Modal";

export default function UnsavedChangesModal({
  translate,
  tab,
  onCancel,
  onDiscard,
  onSaveAndClose,
}) {
  return (
    <Modal onClose={onCancel}>
      <h2>{translate("unsavedChangesTitle")}</h2>

      <p>
        « {tab.name} » {translate("unsavedChangesMessage")}
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
