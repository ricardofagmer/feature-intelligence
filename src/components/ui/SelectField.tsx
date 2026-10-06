import type { ReactElement, ReactNode } from "react";
import { ChevronDownIcon } from "@/components/ui/Icons";
import { inputClass } from "@/components/ui/styles";

export function SelectField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}): ReactElement {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1 block text-xs font-medium text-muted">
        {props.label}
      </label>
      <div className="relative">
        <select
          id={props.id}
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          className={`${inputClass} appearance-none pr-9`}
        >
          {props.children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
      </div>
    </div>
  );
}
