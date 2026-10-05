import { describe, expect, it } from "vitest";
import { buttonStyles, type ButtonVariant } from "./buttonStyles";

describe("buttonStyles", () => {
  const allVariants: ButtonVariant[] = [
    "primary",
    "secondary",
    "warning",
    "danger",
    "ghost",
    "icon",
  ];

  it.each(allVariants)(
    "returns base classes and specific variant classes for %s",
    (variant) => {
      const styles = buttonStyles(variant);
      expect(styles).toContain("inline-flex items-center justify-center");
      expect(styles).toContain("rounded-lg font-bold");
      expect(styles).toContain("min-h-10 px-4 text-sm"); // default md size
    },
  );

  it("applies small size classes when size is sm", () => {
    const styles = buttonStyles("primary", "sm");
    expect(styles).toContain("min-h-9 px-3 text-xs");
  });

  it("applies medium size classes when size is md", () => {
    const styles = buttonStyles("secondary", "md");
    expect(styles).toContain("min-h-10 px-4 text-sm");
  });

  it("includes variant-specific tokens", () => {
    expect(buttonStyles("primary")).toContain("bg-brand-700 text-white");
    expect(buttonStyles("secondary")).toContain("border-slate-300");
    expect(buttonStyles("warning")).toContain("bg-amber-50 text-amber-900");
    expect(buttonStyles("danger")).toContain("text-rose-700");
    expect(buttonStyles("ghost")).toContain("bg-transparent text-slate-600");
    expect(buttonStyles("icon")).toContain("bg-transparent text-slate-500");
  });
});
