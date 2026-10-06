"use client";

import { useState, type FormEvent, type KeyboardEvent, type ReactElement } from "react";
import { MAX_NAME_LENGTH } from "@/components/identity/storedName";
import { buttonClass, inputClass } from "@/components/ui/styles";

/** Inline "who is voting" prompt; replaces window.prompt so it is styleable and accessible. */
export function NameForm(props: {
  idPrefix: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}): ReactElement {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const inputId = `${props.idPrefix}-name`;
  const errorId = `${props.idPrefix}-name-error`;
  const invalid = touched && name.trim().length === 0;

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTouched(true);
    if (name.trim()) props.onSubmit(name.trim());
  }

  function onKeyDown(event: KeyboardEvent<HTMLFormElement>): void {
    if (event.key === "Escape") props.onCancel();
  }

  return (
    <form onSubmit={onSubmit} onKeyDown={onKeyDown} noValidate className="space-y-2">
      <label htmlFor={inputId} className="block text-xs font-medium text-fg">
        Your name
      </label>
      <input
        id={inputId}
        autoFocus
        value={name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(event) => setName(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? errorId : undefined}
        placeholder="e.g. Dana from Acme"
        className={inputClass}
      />
      {invalid ? (
        <p id={errorId} className="text-xs text-danger">
          Enter a name so your support can be counted once.
        </p>
      ) : (
        <p className="text-xs text-muted">Remembered on this device for future votes.</p>
      )}
      <div className="flex gap-2">
        <button type="submit" className={buttonClass({ size: "sm" })}>
          Add my support
        </button>
        <button type="button" onClick={props.onCancel} className={buttonClass({ variant: "ghost", size: "sm" })}>
          Cancel
        </button>
      </div>
    </form>
  );
}
