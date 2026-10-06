import type { ReactElement } from "react";
import { inputClass } from "@/components/ui/styles";

/** Labeled input/textarea with inline error and a character counter near the limit. */
export function TextField(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  autoFocus?: boolean;
}): ReactElement {
  const errorId = `${props.id}-error`;
  const counterId = `${props.id}-counter`;
  const nearLimit = props.value.length > props.maxLength * 0.8;
  const describedBy = [props.error ? errorId : null, nearLimit ? counterId : null].filter(Boolean).join(" ") || undefined;
  const shared = {
    id: props.id,
    value: props.value,
    maxLength: props.maxLength,
    disabled: props.disabled,
    placeholder: props.placeholder,
    autoFocus: props.autoFocus,
    "aria-invalid": Boolean(props.error),
    "aria-describedby": describedBy,
    "aria-required": !props.optional,
    className: `${inputClass} disabled:opacity-70`,
  };

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <label htmlFor={props.id} className="text-sm font-medium text-fg">
          {props.label}
          {props.optional ? <span className="ml-1 text-xs font-normal text-muted">(optional)</span> : null}
        </label>
        {nearLimit ? (
          <span id={counterId} className="text-xs tabular-nums text-muted">
            {props.value.length}/{props.maxLength}
          </span>
        ) : null}
      </div>
      {props.multiline ? (
        <textarea {...shared} rows={5} onChange={(event) => props.onChange(event.target.value)} />
      ) : (
        <input {...shared} type="text" onChange={(event) => props.onChange(event.target.value)} />
      )}
      {props.error ? (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {props.error}
        </p>
      ) : null}
    </div>
  );
}
