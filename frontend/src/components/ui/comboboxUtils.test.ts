import { describe, expect, it } from "vitest";
import { groupOptions, normalizeSearch } from "./comboboxUtils";
import type { ComboboxOption } from "./Combobox";

describe("comboboxUtils", () => {
  describe("normalizeSearch", () => {
    it("normalizes lowercase, removes accents and trims whitespace", () => {
      expect(normalizeSearch("  Árbol  ")).toBe("arbol");
      expect(normalizeSearch("POTA CONGELADA")).toBe("pota congelada");
      expect(normalizeSearch("  TUBOS y ALETAS  ")).toBe("tubos y aletas");
      expect(normalizeSearch("Ñandú")).toBe("nandu");
    });
  });

  describe("groupOptions", () => {
    it("groups options by group field, using empty string for options without group", () => {
      const options: ComboboxOption[] = [
        { value: "1", label: "Item 1", group: "Grupo A" },
        { value: "2", label: "Item 2", group: "Grupo B" },
        { value: "3", label: "Item 3", group: "Grupo A" },
        { value: "4", label: "Item 4" }, // no group
      ];

      const grouped = groupOptions(options);
      expect(grouped).toHaveLength(3);

      const groupA = grouped.find((g) => g.name === "Grupo A");
      expect(groupA?.items.map((i) => i.value)).toEqual(["1", "3"]);

      const groupB = grouped.find((g) => g.name === "Grupo B");
      expect(groupB?.items.map((i) => i.value)).toEqual(["2"]);

      const groupEmpty = grouped.find((g) => g.name === "");
      expect(groupEmpty?.items.map((i) => i.value)).toEqual(["4"]);
    });
  });
});
