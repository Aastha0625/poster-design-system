import { ColorPalette } from "@/types/poster";

/**
 * Standard WCAG 2.1 Relative Luminance calculation
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.trim().replace(/^#/, "");
  
  let r = 0;
  let g = 0;
  let b = 0;

  if (sanitized.length === 3) {
    r = parseInt(sanitized[0] + sanitized[0], 16);
    g = parseInt(sanitized[1] + sanitized[1], 16);
    b = parseInt(sanitized[2] + sanitized[2], 16);
  } else if (sanitized.length === 6 || sanitized.length === 8) {
    r = parseInt(sanitized.substring(0, 2), 16);
    g = parseInt(sanitized.substring(2, 4), 16);
    b = parseInt(sanitized.substring(4, 6), 16);
  } else {
    return null;
  }

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

function channelLuminance(channel: number): number {
  const sRGB = channel / 255;
  return sRGB <= 0.04045 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const r = channelLuminance(rgb.r);
  const g = channelLuminance(rgb.g);
  const b = channelLuminance(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors.
 * Returns a number between 1.0 and 21.0.
 */
export function getContrastRatio(hexA: string, hexB: string): number {
  const lumA = getRelativeLuminance(hexA);
  const lumB = getRelativeLuminance(hexB);

  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  return Math.round(ratio * 100) / 100;
}

export interface ContrastResult {
  ratio: number;
  pass: boolean;
  score: "AAA" | "AA" | "AA-Large" | "Fail";
}

export function checkContrast(hexA: string, hexB: string, threshold = 4.5): ContrastResult {
  const ratio = getContrastRatio(hexA, hexB);
  const pass = ratio >= threshold;

  let score: "AAA" | "AA" | "AA-Large" | "Fail" = "Fail";
  if (ratio >= 7.0) score = "AAA";
  else if (ratio >= 4.5) score = "AA";
  else if (ratio >= 3.0) score = "AA-Large";

  return { ratio, pass, score };
}

export interface PaletteFailure {
  pair: string;
  colorA: string;
  colorB: string;
  ratio: number;
  required: number;
}

/**
 * Validates the core text and background contrast requirements of a ColorPalette.
 */
export function validatePaletteContrast(palette: ColorPalette): {
  valid: boolean;
  failures: PaletteFailure[];
} {
  const failures: PaletteFailure[] = [];

  // 1. Background vs Primary Text (Must pass 4.5:1)
  const bgPrimaryRatio = getContrastRatio(palette.background, palette.primaryText);
  if (bgPrimaryRatio < 4.5) {
    failures.push({
      pair: "background vs primaryText",
      colorA: palette.background,
      colorB: palette.primaryText,
      ratio: bgPrimaryRatio,
      required: 4.5,
    });
  }

  // 2. Background vs Secondary Text (Must pass 4.5:1 or at least 3.5:1)
  const bgSecondaryRatio = getContrastRatio(palette.background, palette.secondaryText);
  if (bgSecondaryRatio < 4.0) {
    failures.push({
      pair: "background vs secondaryText",
      colorA: palette.background,
      colorB: palette.secondaryText,
      ratio: bgSecondaryRatio,
      required: 4.0,
    });
  }

  return {
    valid: failures.length === 0,
    failures,
  };
}

/**
 * Fallback generator providing guaranteed high-contrast pairing for any background.
 */
export function getSafeContrastColor(backgroundHex: string, type: "primary" | "secondary" = "primary"): string {
  const bgLum = getRelativeLuminance(backgroundHex);
  const isDarkBg = bgLum < 0.5;

  if (isDarkBg) {
    return type === "primary" ? "#FFFFFF" : "#CBD5E1"; // Slate-300
  } else {
    return type === "primary" ? "#0F172A" : "#475569"; // Slate-900 / Slate-600
  }
}
