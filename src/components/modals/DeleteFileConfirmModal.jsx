import Modal from "../Modal";

export default function DeleteFileConfirmModal({
  translate,
  fileName,
  onCancel,
  onConfirm,
}) {
  return (
    <Modal onClose={onCancel}>
      <h2>{translate("deleteFileConfirmTitle")}</h2>

      <p>
        « {fileName} » {translate("deleteFileConfirmMessage")}
      </p>

      <div className="actions">
        <button onClick={onCancel}>{translate("cancel")}</button>
        <button className="danger" onClick={onConfirm}>
          {translate("delete")}
        </button>
      </div>
    </Modal>
  );
}
