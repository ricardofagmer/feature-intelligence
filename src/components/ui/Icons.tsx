import type { ReactElement, SVGProps } from "react";

interface IconProps {
  className?: string;
}

const base: SVGProps<SVGSVGElement> = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
};

export function ArrowUpIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="M10 16V4M4.5 9.5 10 4l5.5 5.5" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="m5 7.5 5 5 5-5" />
    </svg>
  );
}

export function ArrowLeftIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="M16 10H4m5.5-5.5L4 10l5.5 5.5" />
    </svg>
  );
}

export function SparkIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="M10 2.5v3M10 14.5v3M2.5 10h3M14.5 10h3M5 5l2 2M13 13l2 2M15 5l-2 2M7 13l-2 2" />
    </svg>
  );
}

export function SearchIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.5 13.5 3.5 3.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="M10 4v12M4 10h12" />
    </svg>
  );
}

export function CheckIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

export function CloseIcon(props: IconProps): ReactElement {
  return (
    <svg {...base} className={props.className ?? "h-4 w-4"}>
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export function LogoMark(props: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden
      className={props.className ?? "h-6 w-6"}
    >
      <rect width="24" height="24" rx="6" className="fill-accent-solid" />
      <path
        d="M7 8h10M7 12h6M7 16h3"
        className="stroke-on-accent"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16.5" cy="15.5" r="2" className="fill-on-accent" />
    </svg>
  );
}
