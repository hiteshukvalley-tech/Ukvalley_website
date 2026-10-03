import { Fragment } from "react";
import { splitMarks } from "@/lib/home-schema";
import { ukText } from "@/lib/texts";

/**
 * Renders admin-edited text where *starred* words get the highlight style
 * (blue by default) — how editable headings keep their accent colour.
 */
export function Marked({ text, className = "text-uk-blue" }: { text: string; className?: string }) {
  return (
    <>
      {splitMarks(text).map((p, i) =>
        p.marked ? (
          <span key={i} className={className}>{ukText(p.text)}</span>
        ) : (
          <Fragment key={i}>{ukText(p.text)}</Fragment>
        )
      )}
    </>
  );
}
