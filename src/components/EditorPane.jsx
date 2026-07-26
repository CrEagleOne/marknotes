export default function EditorPane({
  content,
  editorRef,
  lineNumbersRef,
  onChange,
  onRememberSelection,
  onScroll,
  placeholder,
  title,
}) {
  return (
    <section className="editor">
      <h2>{title}</h2>
      <div className="editor-input">
        <div ref={lineNumbersRef} className="line-numbers" aria-hidden="true">
          {content.split("\n").map((_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        <textarea
          ref={editorRef}
          value={content}
          onChange={(event) => onChange(event.target.value)}
          onSelect={onRememberSelection}
          onClick={onRememberSelection}
          onKeyUp={onRememberSelection}
          onScroll={(event) => {
            if (lineNumbersRef.current) {
              lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
            }
            onScroll?.(event.currentTarget);
          }}
          placeholder={placeholder}
        />
      </div>
    </section>
  );
}
