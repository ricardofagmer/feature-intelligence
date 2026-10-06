/** Client-side checks mirror the API limits for fast feedback; the server stays the source of truth. */

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 5000;

export interface RequestFormValues {
  title: string;
  description: string;
}

export interface RequestFormErrors {
  title?: string;
  description?: string;
}

export function validateRequestForm(values: RequestFormValues): RequestFormErrors {
  const errors: RequestFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  if (!title) errors.title = "Give the request a short title.";
  else if (title.length > TITLE_MAX) errors.title = `Keep the title under ${TITLE_MAX} characters.`;
  if (!description) errors.description = "Describe what you need and why — the AI reads this to find the underlying need.";
  else if (description.length > DESCRIPTION_MAX)
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  return errors;
}

export function hasErrors(errors: RequestFormErrors): boolean {
  return Boolean(errors.title || errors.description);
}
