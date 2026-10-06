"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactElement } from "react";
import { SubmissionResult } from "@/components/board/SubmissionResult";
import { TextField } from "@/components/board/TextField";
import {
  DESCRIPTION_MAX,
  TITLE_MAX,
  hasErrors,
  validateRequestForm,
} from "@/components/board/requestFormValidation";
import { MAX_NAME_LENGTH, saveName, useStoredName } from "@/components/identity/storedName";
import { Banner } from "@/components/ui/Banner";
import { PlusIcon, SparkIcon } from "@/components/ui/Icons";
import { Spinner } from "@/components/ui/Spinner";
import { buttonClass, cardClass } from "@/components/ui/styles";
import { createRequest, describeApiError } from "@/lib/clientApi";
import type { CreateRequestResponse } from "@/lib/types";

type SubmitPhase =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done"; response: CreateRequestResponse }
  | { kind: "error"; message: string };

export function SubmitRequestPanel(): ReactElement {
  const router = useRouter();
  const storedName = useStoredName();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // null = untouched, so the field shows the remembered name without copying it into state.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [phase, setPhase] = useState<SubmitPhase>({ kind: "idle" });

  const name = nameDraft ?? storedName;
  const errors = attempted ? validateRequestForm({ title, description }) : {};
  const submitting = phase.kind === "submitting";

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setAttempted(true);
    if (hasErrors(validateRequestForm({ title, description }))) return;

    const requester = name.trim();
    if (requester) saveName(requester);
    setPhase({ kind: "submitting" });
    try {
      const response = await createRequest({
        title: title.trim(),
        description: description.trim(),
        requester: requester || undefined,
      });
      setPhase({ kind: "done", response });
      setTitle("");
      setDescription("");
      setNameDraft(null);
      setAttempted(false);
      setOpen(false);
      router.refresh();
    } catch (error) {
      setPhase({ kind: "error", message: describeApiError(error, "Your request could not be submitted. Try again.") });
    }
  }

  return (
    <section aria-labelledby="submit-heading" className="space-y-3">
      <div className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              <SparkIcon />
            </span>
            <div>
              <h2 id="submit-heading" className="text-sm font-semibold text-fg">
                Request a feature
              </h2>
              <p className="text-sm text-muted">
                Describe the problem in your own words. AI triage finds the underlying need, checks for duplicates and
                scores priority in seconds.
              </p>
            </div>
          </div>
          {!open ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-expanded={false}
              aria-controls="submit-request-form"
              className={`${buttonClass()} shrink-0`}
            >
              <PlusIcon />
              New request
            </button>
          ) : null}
        </div>

        {open ? (
          <form
            id="submit-request-form"
            onSubmit={(event) => void onSubmit(event)}
            noValidate
            aria-busy={submitting}
            className="space-y-4 border-t border-line bg-surface-muted/40 p-4 sm:p-5"
          >
            <TextField
              id="request-title"
              label="Title"
              value={title}
              onChange={setTitle}
              maxLength={TITLE_MAX}
              error={errors.title}
              disabled={submitting}
              placeholder="e.g. Export dashboards to PDF"
              autoFocus
            />
            <TextField
              id="request-description"
              label="Description"
              value={description}
              onChange={setDescription}
              maxLength={DESCRIPTION_MAX}
              error={errors.description}
              disabled={submitting}
              placeholder="What are you trying to do, what gets in the way, and who is affected?"
              multiline
            />
            <TextField
              id="request-name"
              label="Your name"
              optional
              value={name}
              onChange={setNameDraft}
              maxLength={MAX_NAME_LENGTH}
              disabled={submitting}
              placeholder="Shown as the requester"
            />

            {phase.kind === "error" ? (
              <Banner tone="danger" title="Submission failed">
                {phase.message}
              </Banner>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" className="text-sm text-muted">
                {submitting ? (
                  <span className="inline-flex items-start gap-2">
                    <Spinner className="mt-0.5 h-4 w-4 text-accent" />
                    <span>
                      <span className="font-medium text-fg">AI is triaging your request…</span>
                      <span className="block text-xs">
                        Extracting the underlying need, checking duplicates, assigning a theme and scoring priority.
                      </span>
                    </span>
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                  className={buttonClass({ variant: "ghost" })}
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className={buttonClass()}>
                  {submitting ? "Triaging…" : "Submit request"}
                </button>
              </div>
            </div>
          </form>
        ) : null}
      </div>

      {phase.kind === "done" ? (
        <SubmissionResult response={phase.response} onDismiss={() => setPhase({ kind: "idle" })} />
      ) : null}
    </section>
  );
}
