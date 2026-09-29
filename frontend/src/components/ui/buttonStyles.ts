export type ButtonVariant =
  | "primary"
  | "secondary"
  | "warning"
  | "danger"
  | "ghost"
  | "icon";

const base = `
  inline-flex items-center justify-center gap-2
  rounded-lg font-bold
  transition-all duration-150

  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-brand-500
  focus-visible:ring-offset-2

  disabled:cursor-not-allowed
  disabled:translate-y-0
  disabled:shadow-none
`;

const interactive = `
  hover:-translate-y-px
  active:translate-y-0
  active:scale-[0.98]
`;

const variants: Record<ButtonVariant, string> = {
  primary: `
    ${interactive}
    border border-brand-700
    bg-brand-700 text-white
    shadow-sm

    hover:border-brand-800
    hover:bg-brand-800
    hover:shadow-md

    dark:border-ui-brand
    dark:bg-ui-brand
    dark:hover:border-ui-accent-cyan
    dark:hover:bg-ui-brand

    disabled:border-slate-200
    disabled:bg-slate-200
    disabled:text-slate-400

    dark:disabled:border-ui-line-dark-grid
    dark:disabled:bg-ui-surface-dark-compact
    dark:disabled:text-ui-text-subtle
  `,

  secondary: `
    ${interactive}
    border border-slate-300
    bg-white text-slate-700
    shadow-sm

    hover:border-brand-300
    hover:bg-brand-50
    hover:text-brand-800
    hover:shadow-md

    dark:border-ui-line-dark
    dark:bg-ui-surface-dark
    dark:text-ui-text-dark-pale
    dark:hover:border-ui-line-dark
    dark:hover:bg-ui-surface-dark-hover-strong
    dark:hover:text-white

    disabled:opacity-50
  `,

  warning: `
    ${interactive}
    border border-amber-400
    bg-amber-50 text-amber-900
    shadow-sm

    hover:border-amber-500
    hover:bg-amber-100
    hover:shadow-md

    dark:border-ui-amber-border-dark
    dark:bg-ui-amber-surface-dark-deep
    dark:text-ui-amber-text-dark-bright
    dark:hover:border-ui-amber-text-dark
    dark:hover:bg-ui-amber-surface-dark

    disabled:opacity-50
  `,

  danger: `
    ${interactive}
    border border-rose-300
    bg-white text-rose-700

    hover:border-rose-500
    hover:bg-rose-50
    hover:text-rose-800
    hover:shadow-sm

    dark:border-rose-500/30
    dark:bg-transparent
    dark:text-rose-300
    dark:hover:bg-rose-500/10

    disabled:opacity-50
  `,

  ghost: `
    active:scale-[0.97]
    border border-transparent
    bg-transparent text-slate-600

    hover:bg-slate-100
    hover:text-slate-950

    dark:text-ui-text-dark-soft
    dark:hover:bg-ui-surface-dark-hover-strong
    dark:hover:text-white

    disabled:opacity-50
  `,

  icon: `
    active:scale-[0.92]
    border border-transparent
    bg-transparent text-slate-500

    hover:bg-slate-100
    hover:text-slate-900

    dark:text-ui-text-soft
    dark:hover:bg-ui-surface-dark-hover-strong
    dark:hover:text-white

    disabled:opacity-40
  `,
};

export function buttonStyles(variant: ButtonVariant, size: "sm" | "md" = "md") {
  const sizeClass =
    size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-10 px-4 text-sm";

  return `${base} ${variants[variant]} ${sizeClass}`;
}
