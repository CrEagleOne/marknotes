export default function IconButton({ title, onClick, active = false, children }) {
  return (
    <button
      className={`icon ${active ? "active" : ""}`}
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
