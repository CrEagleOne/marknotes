export default function Modal({ children, onClose }) {
  return (
    <div className="overlay">
      <div className="modal">
        {children}
        <button className="close" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
}
