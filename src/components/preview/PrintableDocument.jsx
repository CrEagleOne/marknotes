export default function PrintableDocument({ printRef, renderedHtml }) {
  return (
    <article
      ref={printRef}
      className="print-only markdown-body"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
