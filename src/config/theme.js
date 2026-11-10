export const PALETTES = Object.freeze({
  PRO: "pro",
  FAMILY: "family",
});

export function resolveThemeClass(palette) {
  if (palette === PALETTES.PRO) {
    return "";
  }

  if (palette === PALETTES.FAMILY) {
    return "family-theme";
  }

  throw new RangeError(`Unknown palette: ${palette}`);
}
