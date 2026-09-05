import fs from "fs";
import path from "path";
import { EventDetails, LayoutArchetype, FontPairingKey, ColorPalette } from "@/types/poster";
import { ARCHETYPE_DEFINITIONS } from "@/utils/archetypes";
import { FONT_PAIRINGS } from "@/utils/fontPairings";

export interface BuildPromptParams {
  eventDetails: EventDetails;
  style: string;
  format: string;
  width: number;
  height: number;
  language?: string;
  preferredArchetype?: LayoutArchetype;
  preferredFontPairing?: FontPairingKey;
}

const TEMPLATE_PATH = path.join(process.cwd(), "src/prompts/poster-architect.md");

function getPromptTemplate(): string {
  try {
    if (fs.existsSync(TEMPLATE_PATH)) {
      return fs.readFileSync(TEMPLATE_PATH, "utf-8");
    }
  } catch (err) {
    console.warn("Could not read poster-architect.md from disk, using embedded fallback:", err);
  }

  // Fallback template matching poster-architect.md
  return `# Poster Architect
You are an expert poster art director and visual designer. Turn the user's event details into a structured design brief.

## POSTER CONFIGURATION
- Event Name: {{eventName}}
- Date / Time: {{eventDateTime}}
- Venue: {{venue}}
- Organizer / Host: {{organizer}}
- Description: {{description}}
- Call to Action: {{callToAction}}
- Contact Info: {{contactInfo}}
- Additional Details: {{additionalDetails}}
- Style: {{style}}
- Aspect Ratio / Format: {{aspectRatio}}
- Canvas Dimensions: {{canvasWidth}}px width x {{canvasHeight}}px height
- Language: {{language}}
{{overrides}}

## STEP 1 — CHOOSE A LAYOUT ARCHETYPE
{{approvedArchetypes}}

## STEP 2 — RESERVE THE TEXT SAFE ZONE
Declare textSafeZone and carry constraint into image prompt.

## STEP 3 — COLOR & CONTRAST
Choose colorPalette with >= 4.5:1 contrast against background.

## STEP 4 — TYPOGRAPHY
{{approvedFontPairings}}

## STEP 5 — HERO IMAGE PROMPT
Write Stage 2 image-generation prompt without text, letters, or watermark.

## OUTPUT FORMAT
Return strictly valid JSON matching schema.`;
}

export function buildPosterArchitectPrompt(params: BuildPromptParams): string {
  const { 
    eventDetails, 
    style, 
    format, 
    width, 
    height, 
    language = "English", 
    preferredArchetype, 
    preferredFontPairing 
  } = params;

  // Render approved archetypes list
  const approvedArchetypes = Object.values(ARCHETYPE_DEFINITIONS)
    .map(
      (a) =>
        `- "${a.id}": ${a.name} — ${a.description} (Text Safe Zone: x=${Math.round(a.textSafeZone.x * 100)}%, y=${Math.round(a.textSafeZone.y * 100)}%, w=${Math.round(a.textSafeZone.width * 100)}%, h=${Math.round(a.textSafeZone.height * 100)}%)`
    )
    .join("\n");

  // Render approved font pairings list
  const approvedFontPairings = Object.values(FONT_PAIRINGS)
    .map(
      (f) =>
        `- "${f.id}": Display: "${f.displayFont}", Body: "${f.bodyFont}" — Best for: ${f.vibe}`
    )
    .join("\n");

  const overrides = [
    preferredArchetype ? `- Requested Archetype Override: "${preferredArchetype}"` : null,
    preferredFontPairing ? `- Requested Font Pairing Override: "${preferredFontPairing}"` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const eventDateTime = [eventDetails.date, eventDetails.time].filter(Boolean).join(" | ") || "";

  // Load master template and interpolate placeholders
  let template = getPromptTemplate();

  const replacements: Record<string, string> = {
    "{{eventName}}": eventDetails.name || "",
    "{{eventDateTime}}": eventDateTime,
    "{{venue}}": eventDetails.venue || "",
    "{{organizer}}": eventDetails.organizer || "",
    "{{description}}": eventDetails.description || "",
    "{{callToAction}}": eventDetails.cta || "",
    "{{contactInfo}}": eventDetails.contact || "",
    "{{additionalDetails}}": eventDetails.additionalDetails || "",
    "{{style}}": style || "Modern",
    "{{aspectRatio}}": `${format} (${width}x${height})`,
    "{{canvasWidth}}": String(width),
    "{{canvasHeight}}": String(height),
    "{{language}}": language,
    "{{overrides}}": overrides ? `\nOverrides:\n${overrides}` : "",
    "{{approvedArchetypes}}": approvedArchetypes,
    "{{approvedFontPairings}}": approvedFontPairings,
  };

  for (const [key, value] of Object.entries(replacements)) {
    template = template.replaceAll(key, value);
  }

  return template;
}

/**
 * Constructs the refined hero image prompt for Pollinations.ai, enforcing
 * safe zone calm regions, palette color direction, and negative text prompts.
 */
export function buildHeroImagePrompt(params: {
  heroVisualDescription: string;
  archetype: LayoutArchetype;
  palette: ColorPalette;
}): string {
  const { heroVisualDescription, archetype, palette } = params;

  // Formulate composition restraint based on safe zone
  let safeZoneConstraint = "";
  if (archetype === "hero-top-text-bottom") {
    safeZoneConstraint = "Compositional framing: Focus all high-detail visual elements in the upper 55% of the frame. Keep the bottom 45% very clean, muted, and uncluttered with soft atmospheric gradation to allow overlay text.";
  } else if (archetype === "hero-bottom-text-top") {
    safeZoneConstraint = "Compositional framing: Focus visual subjects in the lower 50% of the canvas. Keep the upper 50% clear, calm, and spacious.";
  } else if (archetype === "split-vertical") {
    safeZoneConstraint = "Compositional framing: Compose key visual elements on the right side of the canvas. Keep the left side minimal and low contrast.";
  } else if (archetype === "centered-badge") {
    safeZoneConstraint = "Compositional framing: Vignetted atmospheric composition with subtle depth, leaving the central region calm.";
  } else {
    safeZoneConstraint = "Compositional framing: Clean negative space reserved in the lower third for typographic overlay.";
  }

  const paletteTone = `Color harmony: Subtle accents of ${palette.accent}, harmonious with ${palette.background} background atmosphere.`;
  const negativePrompt = "NO TEXT, NO LETTERS, NO TYPOGRAPHY, NO WORDS, NO SYMBOLS, NO WATERMARKS, NO LOGOS, NO GRAPHIC OVERLAYS.";

  // Sanitize and combine
  const cleanedDesc = heroVisualDescription
    .replace(/no text.*$/i, "")
    .replace(/no letters.*$/i, "")
    .trim();

  return `${cleanedDesc}. ${safeZoneConstraint} ${paletteTone} Cinematic studio lighting, award-winning editorial poster artwork, 8k resolution. ${negativePrompt}`;
}
