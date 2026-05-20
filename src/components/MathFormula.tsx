import katex from "katex";
import { useMemo } from "react";

interface MathFormulaProps {
  tex: string;
  block?: boolean;
  muted?: boolean;
}

export function MathFormula({ tex, block = false, muted = false }: MathFormulaProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        displayMode: block,
        throwOnError: false,
        strict: "ignore",
        output: "htmlAndMathml"
      });
    } catch {
      return tex;
    }
  }, [tex, block]);

  const className = ["math-formula", block ? "math-formula--block" : "", muted ? "math-formula--muted" : ""]
    .filter(Boolean)
    .join(" ");

  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
