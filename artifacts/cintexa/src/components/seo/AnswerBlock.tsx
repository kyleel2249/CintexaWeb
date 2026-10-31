/**
 * "Quick answer" block: a plain-language question followed by a direct, self-contained answer. Placed near the top of
 * a page so visitors, search snippets and answer engines can read the core answer without scrolling or running scripts.
 */
export function AnswerBlock({ id, question, answer, className = "" }: { id: string; question: string; answer: string; className?: string }) {
  const headingId = `${id}-title`;
  return (
    <section aria-labelledby={headingId} className={`cx-card border-l-2 border-l-[hsl(var(--accent))] ${className}`} data-answer-block={id}>
      <h2 id={headingId} className="cx-display text-xl">
        {question}
      </h2>
      <p className="mt-2 max-w-3xl leading-7 text-[hsl(var(--fg-muted))]">{answer}</p>
    </section>
  );
}
