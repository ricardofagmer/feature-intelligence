/** Shared class recipes so every interactive element gets the same focus ring and sizing. */

export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-canvas";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent-solid text-on-accent hover:bg-accent-solid-hover border border-transparent",
  secondary: "bg-surface text-fg border border-line-strong hover:bg-surface-muted",
  ghost: "bg-transparent text-muted border border-transparent hover:bg-surface-muted hover:text-fg",
  danger: "bg-surface text-danger border border-line-strong hover:bg-danger-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
};

export function buttonClass(options: { variant?: ButtonVariant; size?: ButtonSize } = {}): string {
  const variant = options.variant ?? "primary";
  const size = options.size ?? "md";
  return [
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
    focusRing,
    variantClasses[variant],
    sizeClasses[size],
  ].join(" ");
}

export const cardClass = "rounded-xl border border-line bg-surface";

export const inputClass = [
  "block w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-fg",
  "placeholder:text-subtle",
  "focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/40",
  "aria-[invalid=true]:border-danger",
].join(" ");

export const linkClass = `rounded text-accent underline-offset-2 hover:underline ${focusRing}`;
