export default function DocumentOutline({ translate, headings, onJumpToHeading }) {
  return (
    <section className="outline">
      <h2>{translate("outline")}</h2>
      {headings.length > 0 ? (
        headings.map((heading) => (
          <button
            key={heading.line}
            style={{
              paddingLeft: 10 + Math.min(heading.level - 1, 4) * 12,
            }}
            onClick={() => onJumpToHeading(heading)}
          >
            {heading.text}
          </button>
        ))
      ) : (
        <p>{translate("none")}</p>
      )}
    </section>
  );
}
