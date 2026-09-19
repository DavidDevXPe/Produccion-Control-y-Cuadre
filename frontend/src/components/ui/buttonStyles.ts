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

    dark:border-[#169FD0]
    dark:bg-[#169FD0]
    dark:hover:border-[#58C8EA]
    dark:hover:bg-[#138BB6]

    disabled:border-slate-200
    disabled:bg-slate-200
    disabled:text-slate-400

    dark:disabled:border-[#203E50]
    dark:disabled:bg-[#102331]
    dark:disabled:text-[#60798A]
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

    dark:border-[#2B5268]
    dark:bg-[#0D2534]
    dark:text-[#C3D2DC]
    dark:hover:border-[#3D6A80]
    dark:hover:bg-[#123247]
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

    dark:border-[#B58A27]
    dark:bg-[#211D12]
    dark:text-[#FFE7A3]
    dark:hover:border-[#FFD166]
    dark:hover:bg-[#2A2414]

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

    dark:text-[#A5BED0]
    dark:hover:bg-[#123247]
    dark:hover:text-white

    disabled:opacity-50
  `,

  icon: `
    active:scale-[0.92]
    border border-transparent
    bg-transparent text-slate-500

    hover:bg-slate-100
    hover:text-slate-900

    dark:text-[#7F9BAD]
    dark:hover:bg-[#123247]
    dark:hover:text-white

    disabled:opacity-40
  `,
};

export function buttonStyles(variant: ButtonVariant, size: "sm" | "md" = "md") {
  const sizeClass =
    size === "sm" ? "min-h-9 px-3 text-xs" : "min-h-10 px-4 text-sm";

  return `${base} ${variants[variant]} ${sizeClass}`;
}
