import type { ReactElement } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { focusRing } from "@/components/ui/styles";

/** Native disclosure: keyboard-operable and works before hydration. */
export function PriorityRationale(props: { score: number; rationale: string }): ReactElement {
  return (
    <details className="group/why mt-3">
      <summary
        className={`inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium text-accent hover:underline ${focusRing}`}
      >
        Why a {props.score}?
        <ChevronDownIcon className="h-3.5 w-3.5 transition-transform group-open/why:rotate-180" />
      </summary>
      <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-sm leading-relaxed text-fg">
        {props.rationale}
      </p>
    </details>
  );
}
