export default function PreviewPane({ previewRef, translate, renderedHtml }) {
  return (
    <section ref={previewRef} className="preview">
      <h2>{translate("preview")}</h2>
      <article
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </section>
  );
}
