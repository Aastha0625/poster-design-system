import { 
  LayoutArchetype, 
  TextSafeZone, 
  ColorPalette, 
  FontPairing, 
  PosterElement, 
  TextElement, 
  ShapeElement, 
  ImageElement 
} from "@/types/poster";
import { v4 as uuidv4 } from "uuid";
import { getSafeContrastColor, getRelativeLuminance } from "@/utils/contrast";

export interface RegionPercent {
  x: number;      // 0.0 - 1.0 (percent of canvas width)
  y: number;      // 0.0 - 1.0 (percent of canvas height)
  width: number;  // 0.0 - 1.0
  height: number; // 0.0 - 1.0
}

export interface ArchetypeDefinition {
  id: LayoutArchetype;
  name: string;
  description: string;
  heroRegion: RegionPercent;
  textSafeZone: RegionPercent;
  textAlign: "left" | "center" | "right";
  hasHeroOverlay: boolean;
  overlayOpacity: number;
}

export const ARCHETYPE_DEFINITIONS: Record<LayoutArchetype, ArchetypeDefinition> = {
  "hero-top-text-bottom": {
    id: "hero-top-text-bottom",
    name: "Hero Top, Text Bottom",
    description: "Cinematic top hero imagery anchoring the upper half, with typography and event details organized cleanly in the lower half.",
    heroRegion: { x: 0, y: 0, width: 1.0, height: 0.50 },
    textSafeZone: { x: 0.07, y: 0.52, width: 0.86, height: 0.44 },
    textAlign: "left",
    hasHeroOverlay: false,
    overlayOpacity: 0,
  },
  "hero-bottom-text-top": {
    id: "hero-bottom-text-top",
    name: "Text Top, Hero Bottom",
    description: "Bold headline typography and event info in the upper half, with rich visual artwork grounding the base.",
    heroRegion: { x: 0, y: 0.52, width: 1.0, height: 0.48 },
    textSafeZone: { x: 0.07, y: 0.05, width: 0.86, height: 0.44 },
    textAlign: "left",
    hasHeroOverlay: false,
    overlayOpacity: 0,
  },
  "split-vertical": {
    id: "split-vertical",
    name: "Split Vertical Columns",
    description: "Modern editorial asymmetric split: left column houses typography and badges; right column displays edge-to-edge hero artwork.",
    heroRegion: { x: 0.48, y: 0, width: 0.52, height: 1.0 },
    textSafeZone: { x: 0.06, y: 0.06, width: 0.38, height: 0.88 },
    textAlign: "left",
    hasHeroOverlay: false,
    overlayOpacity: 0,
  },
  "centered-badge": {
    id: "centered-badge",
    name: "Centered Floating Badge",
    description: "Immersive edge-to-edge hero artwork across the full background with an elegant, high-contrast central card framing all key details.",
    heroRegion: { x: 0, y: 0, width: 1.0, height: 1.0 },
    textSafeZone: { x: 0.10, y: 0.18, width: 0.80, height: 0.68 },
    textAlign: "center",
    hasHeroOverlay: true,
    overlayOpacity: 0.60,
  },
  "asymmetric-thirds": {
    id: "asymmetric-thirds",
    name: "Asymmetric Thirds",
    description: "Dramatic diagonal or two-thirds hero imagery with high-contrast badge overlays and punchy editorial lower third.",
    heroRegion: { x: 0, y: 0, width: 1.0, height: 0.62 },
    textSafeZone: { x: 0.08, y: 0.56, width: 0.84, height: 0.40 },
    textAlign: "left",
    hasHeroOverlay: true,
    overlayOpacity: 0.35,
  },
};

export const DEFAULT_ARCHETYPE: LayoutArchetype = "hero-top-text-bottom";

export function getArchetypeDefinition(archetype?: string): ArchetypeDefinition {
  if (archetype && archetype in ARCHETYPE_DEFINITIONS) {
    return ARCHETYPE_DEFINITIONS[archetype as LayoutArchetype];
  }
  return ARCHETYPE_DEFINITIONS[DEFAULT_ARCHETYPE];
}

export interface SemanticPosterCopy {
  kicker?: string;
  title: string;
  description?: string;
  date?: string;
  time?: string;
  venue?: string;
  cta?: string;
  contact?: string;
}

export interface ArchetypeBuildParams {
  archetype: LayoutArchetype;
  canvasWidth: number;
  canvasHeight: number;
  heroImageBase64?: string | null;
  copy: SemanticPosterCopy;
  palette: ColorPalette;
  fontPairing: FontPairing;
}

/**
 * Converts an archetype selection and copy into pixel-calibrated,
 * non-overlapping PosterElements with strict visual hierarchy.
 */
export function buildArchetypeLayout(params: ArchetypeBuildParams): {
  elements: PosterElement[];
  textSafeZone: TextSafeZone;
  heroVisualBounds: { x: number; y: number; width: number; height: number };
} {
  const {
    archetype,
    canvasWidth,
    canvasHeight,
    heroImageBase64,
    copy,
    palette,
    fontPairing,
  } = params;

  const def = getArchetypeDefinition(archetype);

  // Compute concrete pixel bounds
  const heroBounds = {
    x: Math.round(def.heroRegion.x * canvasWidth),
    y: Math.round(def.heroRegion.y * canvasHeight),
    width: Math.round(def.heroRegion.width * canvasWidth),
    height: Math.round(def.heroRegion.height * canvasHeight),
  };

  const safeZone: TextSafeZone = {
    x: Math.round(def.textSafeZone.x * canvasWidth),
    y: Math.round(def.textSafeZone.y * canvasHeight),
    width: Math.round(def.textSafeZone.width * canvasWidth),
    height: Math.round(def.textSafeZone.height * canvasHeight),
    description: `Reserved text zone for archetype '${archetype}'`,
  };

  const elements: PosterElement[] = [];

  // 1. Hero Artwork Layer
  if (heroImageBase64) {
    elements.push({
      id: uuidv4(),
      type: "image",
      src: heroImageBase64,
      x: heroBounds.x,
      y: heroBounds.y,
      width: heroBounds.width,
      height: heroBounds.height,
      role: "hero",
    } as ImageElement);

    // Hero overlay for contrast if requested
    if (def.hasHeroOverlay && def.overlayOpacity > 0) {
      elements.push({
        id: uuidv4(),
        type: "shape",
        shapeType: "rectangle",
        x: heroBounds.x,
        y: heroBounds.y,
        width: heroBounds.width,
        height: heroBounds.height,
        fill: palette.overlay || `rgba(0, 0, 0, ${def.overlayOpacity})`,
      } as ShapeElement);
    }
  }

  // 2. Centered Badge Card Backdrop (for centered-badge archetype)
  if (archetype === "centered-badge") {
    elements.push({
      id: uuidv4(),
      type: "shape",
      shapeType: "rectangle",
      x: safeZone.x - 10,
      y: safeZone.y - 10,
      width: safeZone.width + 20,
      height: safeZone.height + 20,
      fill: palette.surface || palette.background,
      stroke: palette.accent,
      strokeWidth: 2,
      cornerRadius: 16,
    } as ShapeElement);
  }

  // 3. Layout Flow within Safe Zone
  let currentY = safeZone.y + 12;
  const contentWidth = safeZone.width;
  const contentX = safeZone.x;
  const textAlign = def.textAlign;

  // Slot A: Kicker / Organizer / Tag
  if (copy.kicker) {
    const kickerFontSize = Math.max(14, Math.round(canvasWidth * 0.022));
    elements.push({
      id: uuidv4(),
      type: "text",
      text: copy.kicker.toUpperCase(),
      x: contentX,
      y: currentY,
      width: contentWidth,
      height: kickerFontSize * 1.5,
      fontSize: kickerFontSize,
      fontFamily: fontPairing.bodyFont,
      fill: palette.accent || palette.secondaryText,
      fontWeight: "bold",
      align: textAlign,
      letterSpacing: 2,
    } as TextElement);
    currentY += kickerFontSize * 1.8;
  }

  // Slot B: Event Title (Massive, Prominent)
  const isCompactLayout = archetype === "split-vertical";
  const titleFontSize = isCompactLayout
    ? Math.max(28, Math.round(canvasWidth * 0.045))
    : Math.max(36, Math.round(canvasWidth * 0.065));

  const titleHeight = titleFontSize * 2.2;
  elements.push({
    id: uuidv4(),
    type: "text",
    text: copy.title,
    x: contentX,
    y: currentY,
    width: contentWidth,
    height: titleHeight,
    fontSize: titleFontSize,
    fontFamily: fontPairing.displayFont,
    fill: palette.primaryText,
    fontWeight: "bold",
    align: textAlign,
    lineHeight: 1.15,
  } as TextElement);
  currentY += titleHeight + 10;

  // Slot C: Description / Subheading
  if (copy.description) {
    const descFontSize = Math.max(14, Math.round(canvasWidth * 0.022));
    const descHeight = descFontSize * 3.2;
    elements.push({
      id: uuidv4(),
      type: "text",
      text: copy.description,
      x: contentX,
      y: currentY,
      width: contentWidth,
      height: descHeight,
      fontSize: descFontSize,
      fontFamily: fontPairing.bodyFont,
      fill: palette.secondaryText,
      align: textAlign,
      lineHeight: 1.35,
    } as TextElement);
    currentY += descHeight + 16;
  }

  // Slot D: Infographics Card (Date, Time, Venue)
  const metaLines = [
    copy.date && copy.time ? `${copy.date}  •  ${copy.time}` : copy.date || copy.time,
    copy.venue ? `📍 ${copy.venue}` : null,
  ].filter(Boolean) as string[];

  if (metaLines.length > 0) {
    const metaFontSize = Math.max(13, Math.round(canvasWidth * 0.021));
    const badgeHeight = metaLines.length * (metaFontSize * 1.6) + 16;
    const badgeWidth = isCompactLayout ? contentWidth : Math.min(contentWidth, 540);
    const badgeX = textAlign === "center" ? contentX + (contentWidth - badgeWidth) / 2 : contentX;

    // Background pill/card for metadata
    elements.push({
      id: uuidv4(),
      type: "shape",
      shapeType: "rectangle",
      x: badgeX,
      y: currentY,
      width: badgeWidth,
      height: badgeHeight,
      fill: palette.surface || (getRelativeLuminance(palette.background) > 0.5 ? "rgba(0, 0, 0, 0.05)" : "rgba(255, 255, 255, 0.08)"),
      cornerRadius: 10,
      stroke: palette.accent,
      strokeWidth: 1,
    } as ShapeElement);

    // Text inside metadata card
    elements.push({
      id: uuidv4(),
      type: "text",
      text: metaLines.join("\n"),
      x: badgeX + 16,
      y: currentY + 10,
      width: badgeWidth - 32,
      height: badgeHeight - 20,
      fontSize: metaFontSize,
      fontFamily: fontPairing.bodyFont,
      fill: palette.primaryText,
      fontWeight: "normal",
      align: textAlign === "center" ? "center" : "left",
      lineHeight: 1.4,
    } as TextElement);

    currentY += badgeHeight + 18;
  }

  // Slot E: Call To Action Button
  if (copy.cta) {
    const btnFontSize = Math.max(13, Math.round(canvasWidth * 0.021));
    const btnWidth = isCompactLayout ? Math.min(contentWidth, 200) : 220;
    const btnHeight = 44;
    const btnX = textAlign === "center" ? contentX + (contentWidth - btnWidth) / 2 : contentX;

    // Button Shape
    elements.push({
      id: uuidv4(),
      type: "shape",
      shapeType: "rectangle",
      x: btnX,
      y: currentY,
      width: btnWidth,
      height: btnHeight,
      fill: palette.accent,
      cornerRadius: 8,
    } as ShapeElement);

    // Button Text (Dynamic high-contrast text against accent color)
    elements.push({
      id: uuidv4(),
      type: "text",
      text: copy.cta.toUpperCase(),
      x: btnX,
      y: currentY + 12,
      width: btnWidth,
      height: btnHeight - 24,
      fontSize: btnFontSize,
      fontFamily: fontPairing.displayFont,
      fill: getSafeContrastColor(palette.accent, "primary"),
      fontWeight: "bold",
      align: "center",
      letterSpacing: 1,
    } as TextElement);

    currentY += btnHeight + 14;
  }

  // Slot F: Footer Contact / Website (pinned to bottom of safe zone if room)
  if (copy.contact) {
    const footerFontSize = Math.max(12, Math.round(canvasWidth * 0.018));
    const footerY = Math.max(currentY + 6, safeZone.y + safeZone.height - footerFontSize * 2);
    elements.push({
      id: uuidv4(),
      type: "text",
      text: copy.contact,
      x: contentX,
      y: footerY,
      width: contentWidth,
      height: footerFontSize * 1.6,
      fontSize: footerFontSize,
      fontFamily: fontPairing.bodyFont,
      fill: palette.secondaryText,
      align: textAlign,
    } as TextElement);
  }

  return {
    elements,
    textSafeZone: safeZone,
    heroVisualBounds: heroBounds,
  };
}
