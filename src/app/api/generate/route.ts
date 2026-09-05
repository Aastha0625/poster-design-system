import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { 
  buildPosterArchitectPrompt, 
  buildHeroImagePrompt 
} from "@/prompts/posterArchitectPrompt";
import { 
  validatePaletteContrast, 
  getSafeContrastColor, 
  getContrastRatio 
} from "@/utils/contrast";
import { 
  buildArchetypeLayout, 
  DEFAULT_ARCHETYPE 
} from "@/utils/archetypes";
import { 
  getFontPairing, 
  DEFAULT_FONT_PAIRING_KEY 
} from "@/utils/fontPairings";
import { 
  mergeVerbatimFields, 
  validateGeneratedFields, 
  buildCorrectionPrompt, 
  fallbackForField 
} from "@/utils/validatePosterBrief";
import { 
  ColorPalette, 
  LayoutArchetype, 
  FontPairingKey,
  GeminiDesignBrief 
} from "@/types/poster";

const CACHE_FILE = path.join(process.cwd(), ".poster-cache.json");

function getCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache: any) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (err) {
    console.warn("Failed to write to cache file:", err);
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { eventDetails, style, format, preferredArchetype, preferredFontPairing } = body;

    const isDevMode = process.env.DEVELOPMENT_MODE === "true";
    const cacheKey = crypto
      .createHash("md5")
      .update(JSON.stringify({ eventDetails, style, format, preferredArchetype, preferredFontPairing }))
      .digest("hex");

    if (isDevMode) {
      const cache = getCache();
      if (cache[cacheKey]) {
        console.log("Serving from DEVELOPMENT_MODE cache");
        return NextResponse.json(cache[cacheKey]);
      }
    }

    // Determine Canvas Dimensions based on selected Format
    let width = 794;
    let height = 1123;
    if (format === "A4 Landscape") {
      width = 1123;
      height = 794;
    } else if (format === "Square") {
      width = 1000;
      height = 1000;
    } else if (format === "Story") {
      width = 1080;
      height = 1920;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const textModelName = process.env.GEMINI_MODEL || "gemini-3.6-flash";

    // ──────────────────────────────────────────────────────────────────────────
    // STAGE 1: DESIGN INTELLIGENCE & ARCHETYPE SELECTION
    // ──────────────────────────────────────────────────────────────────────────
    const designPrompt = buildPosterArchitectPrompt({
      eventDetails,
      style: style || "Modern",
      format: format || "A4 Portrait",
      width,
      height,
      preferredArchetype,
      preferredFontPairing,
    });

    const textModel = genAI.getGenerativeModel({
      model: textModelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            visualConcept: { type: SchemaType.STRING },
            vibeJustification: { type: SchemaType.STRING },
            layoutArchetype: {
              type: SchemaType.STRING,
              format: "enum",
              enum: [
                "hero-top-text-bottom",
                "hero-bottom-text-top",
                "split-vertical",
                "centered-badge",
                "asymmetric-thirds",
              ],
            },
            fontPairing: {
              type: SchemaType.STRING,
              format: "enum",
              enum: [
                "modern-bold",
                "editorial-serif",
                "high-impact",
                "tech-futuristic",
                "clean-corporate",
                "dramatic-cinematic",
              ],
            },
            colorPalette: {
              type: SchemaType.OBJECT,
              properties: {
                background: { type: SchemaType.STRING },
                primaryText: { type: SchemaType.STRING },
                secondaryText: { type: SchemaType.STRING },
                accent: { type: SchemaType.STRING },
                surface: { type: SchemaType.STRING },
              },
              required: ["background", "primaryText", "secondaryText", "accent"],
            },
            heroVisual: {
              type: SchemaType.OBJECT,
              properties: {
                required: { type: SchemaType.BOOLEAN },
                description: { type: SchemaType.STRING },
              },
              required: ["required", "description"],
            },
            copy: {
              type: SchemaType.OBJECT,
              properties: {
                kicker: { type: SchemaType.STRING },
                title: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                date: { type: SchemaType.STRING },
                time: { type: SchemaType.STRING },
                venue: { type: SchemaType.STRING },
                cta: { type: SchemaType.STRING },
                contact: { type: SchemaType.STRING },
              },
              required: ["title"],
            },
          },
          required: [
            "visualConcept",
            "vibeJustification",
            "layoutArchetype",
            "fontPairing",
            "colorPalette",
            "heroVisual",
            "copy",
          ],
        },
      },
    });

    console.log("Stage 1: Calling Gemini Model for Design Brief:", textModelName);
    let layout: GeminiDesignBrief;

    try {
      const textResult = await textModel.generateContent(designPrompt);
      layout = JSON.parse(textResult.response.text());
    } catch (err: any) {
      console.warn("Stage 1 initial generation error:", err?.message);

      // Task 6: Single-retry on malformed or schema-rejected response
      try {
        console.log("Stage 1: Retrying with strict JSON instruction...");
        const retryPrompt = `${designPrompt}\n\nIMPORTANT: Your previous output was invalid or failed JSON parsing. Return ONLY valid JSON matching the exact schema without extra keys or markdown fences.`;
        const retryResult = await textModel.generateContent(retryPrompt);
        layout = JSON.parse(retryResult.response.text());
      } catch (retryErr: any) {
        console.error("Stage 1 retry failed:", retryErr?.message);
        // Fallback layout object to prevent pipeline collapse
        layout = {
          visualConcept: "Modern editorial event poster",
          vibeJustification: "Fallback balanced layout",
          layoutArchetype: preferredArchetype || DEFAULT_ARCHETYPE,
          fontPairing: preferredFontPairing || DEFAULT_FONT_PAIRING_KEY,
          colorPalette: {
            background: "#0B0F19",
            primaryText: "#F8FAFC",
            secondaryText: "#94A3B8",
            accent: "#38BDF8",
          },
          heroVisual: {
            required: true,
            description: `A minimalist, cinematic editorial backdrop for ${eventDetails.name || "the event"}.`,
          },
          copy: {
            kicker: eventDetails.organizer || "",
            title: eventDetails.name || "",
            description: eventDetails.description || "",
            date: eventDetails.date || "",
            time: eventDetails.time || "",
            venue: eventDetails.venue || "",
            cta: eventDetails.cta || "",
            contact: eventDetails.contact || "",
          },
        };
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 3 & 6: CONTRAST VALIDATION & SINGLE-RETRY PALETTE FIX
    // ──────────────────────────────────────────────────────────────────────────
    let palette: ColorPalette = layout.colorPalette || {
      background: "#0B0F19",
      primaryText: "#F8FAFC",
      secondaryText: "#94A3B8",
      accent: "#38BDF8",
    };

    const contrastCheck = validatePaletteContrast(palette);

    if (!contrastCheck.valid) {
      console.warn("Palette failed WCAG contrast check. Failures:", contrastCheck.failures);

      // Attempt 1 retry specifically for color correction
      try {
        const paletteCorrectionPrompt = `
          The following color palette failed WCAG 2.1 AA contrast requirements (all text against background must be >= 4.5:1):
          ${contrastCheck.failures
            .map((f) => `- ${f.pair}: "${f.colorA}" vs "${f.colorB}" ratio ${f.ratio}:1 (Required: ${f.required}:1)`)
            .join("\n")}
          
          Background color is: "${palette.background}".
          Provide a corrected JSON object with keys "background", "primaryText", "secondaryText", "accent", "surface" (all 6-digit hex strings) that strictly pass >= 4.5:1 contrast against the background.
        `;

        const paletteModel = genAI.getGenerativeModel({
          model: textModelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                background: { type: SchemaType.STRING },
                primaryText: { type: SchemaType.STRING },
                secondaryText: { type: SchemaType.STRING },
                accent: { type: SchemaType.STRING },
                surface: { type: SchemaType.STRING },
              },
              required: ["background", "primaryText", "secondaryText", "accent"],
            },
          },
        });

        const paletteResult = await paletteModel.generateContent(paletteCorrectionPrompt);
        const correctedPalette = JSON.parse(paletteResult.response.text());

        // Validate corrected palette
        const recheck = validatePaletteContrast(correctedPalette);
        if (recheck.valid) {
          console.log("Palette successfully corrected by retry!");
          palette = correctedPalette;
        } else {
          throw new Error("Palette retry still failed contrast");
        }
      } catch {
        // Fallback: guaranteed safe contrast assignment
        console.log("Applying deterministic safe contrast fallback palette");
        palette = {
          background: palette.background,
          primaryText: getSafeContrastColor(palette.background, "primary"),
          secondaryText: getSafeContrastColor(palette.background, "secondary"),
          accent: palette.accent || (getContrastRatio(palette.background, "#38BDF8") >= 3.0 ? "#38BDF8" : "#F59E0B"),
          surface: palette.surface,
        };
      }
    }

    // Resolve font pairing and layout archetype
    const chosenArchetype: LayoutArchetype = layout.layoutArchetype || DEFAULT_ARCHETYPE;
    const chosenFontPairingKey: FontPairingKey = layout.fontPairing || DEFAULT_FONT_PAIRING_KEY;
    const fontPairing = getFontPairing(chosenFontPairingKey);

    // ──────────────────────────────────────────────────────────────────────────
    // TASK 8: OPTIONAL SELF-CRITIQUE PASS
    // ──────────────────────────────────────────────────────────────────────────
    const enableSelfCritique = process.env.ENABLE_SELF_CRITIQUE !== "false";
    if (enableSelfCritique) {
      try {
        console.log("Executing Task 8 Self-Critique pass...");
        const critiquePrompt = `
          Critique this event poster brief:
          Title: "${layout.copy?.title}"
          Visual Concept: "${layout.visualConcept}"
          Archetype: "${chosenArchetype}"
          Primary Color: "${palette.primaryText}" on "${palette.background}"

          Checklist:
          1. Is the title concise, punchy, and clear?
          2. Is the visual concept semantically tied to the event subject?
          3. Is there any fabricated event data?

          If the title is overly long (> 8 words) or lacks punch, provide a polishedTitle.
          Return JSON: { "pass": boolean, "feedback": string, "polishedTitle": string }
        `;

        const critiqueModel = genAI.getGenerativeModel({
          model: textModelName,
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: SchemaType.OBJECT,
              properties: {
                pass: { type: SchemaType.BOOLEAN },
                feedback: { type: SchemaType.STRING },
                polishedTitle: { type: SchemaType.STRING },
              },
              required: ["pass", "feedback"],
            },
          },
        });

        const critiqueResult = await critiqueModel.generateContent(critiquePrompt);
        const critique = JSON.parse(critiqueResult.response.text());
        if (!critique.pass && critique.polishedTitle && critique.polishedTitle.trim().length > 0) {
          console.log("Self-critique polished the event title to:", critique.polishedTitle);
          layout.copy.title = critique.polishedTitle;
        }
      } catch (critiqueErr: any) {
        console.warn("Self-critique pass skipped gracefully:", critiqueErr?.message);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VALIDATION OF CREATIVE FIELDS & VERBATIM FIELD MERGING
    // ──────────────────────────────────────────────────────────────────────────
    let creativeFields: Record<string, string> = {
      title: layout.copy?.title || eventDetails.name,
      description: layout.copy?.description || eventDetails.description,
      heroImagePrompt: layout.heroVisual?.description || "",
    };

    let { valid: isCreativeValid, issues: creativeIssues } = validateGeneratedFields(creativeFields);

    if (!isCreativeValid) {
      console.warn("Creative fields contained meta-commentary or validation issues:", creativeIssues);
      try {
        const correctionPrompt = buildCorrectionPrompt(creativeIssues);
        const correctionModel = genAI.getGenerativeModel({
          model: textModelName,
          generationConfig: { responseMimeType: "application/json" },
        });

        const correctionResult = await correctionModel.generateContent(correctionPrompt);
        const corrections = JSON.parse(correctionResult.response.text());
        creativeFields = { ...creativeFields, ...corrections };

        // Re-validate once
        const recheck = validateGeneratedFields(creativeFields);
        if (!recheck.valid) {
          for (const issue of recheck.issues) {
            creativeFields[issue.field] = fallbackForField(
              issue.field,
              creativeFields[issue.field],
              issue.field === "title" ? eventDetails.name : issue.field === "description" ? eventDetails.description : ""
            );
          }
        }
      } catch (err: any) {
        console.warn("Creative fields correction retry failed, applying safe fallbacks:", err.message);
        for (const issue of creativeIssues) {
          creativeFields[issue.field] = fallbackForField(
            issue.field,
            creativeFields[issue.field],
            issue.field === "title" ? eventDetails.name : issue.field === "description" ? eventDetails.description : ""
          );
        }
      }

      // Update layout objects with sanitized values
      if (layout.copy) {
        layout.copy.title = creativeFields.title;
        layout.copy.description = creativeFields.description;
      }
      if (layout.heroVisual) {
        layout.heroVisual.description = creativeFields.heroImagePrompt;
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STAGE 2: HERO ARTWORK GENERATION (Tasks 5 & 7: safe zones & no-text)
    // ──────────────────────────────────────────────────────────────────────────
    let heroImageBase64: string | null = null;

    if (layout.heroVisual && layout.heroVisual.required) {
      try {
        console.log("Stage 2: Constructing refined hero image prompt...");
        const heroPrompt = buildHeroImagePrompt({
          heroVisualDescription: layout.heroVisual.description,
          archetype: chosenArchetype,
          palette,
        });

        // Clean prompt for URL query string
        const safePrompt = heroPrompt.replace(/[^a-zA-Z0-9 ,.-]/g, "");
        const imageWidth = Math.round(width);
        const imageHeight = Math.round(height);

        const heroImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${imageWidth}&height=${imageHeight}&nologo=true`;
        console.log("Fetching artwork from Pollinations.ai...");

        const imageResponse = await fetch(heroImageUrl);
        if (imageResponse.ok) {
          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          heroImageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
          console.log("Hero image successfully generated and encoded to Base64.");
        } else {
          console.warn("Pollinations returned non-200 status:", imageResponse.status);
        }
      } catch (err: any) {
        console.error("Hero image generation failed gracefully:", err.message);
      }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // ASSEMBLE ARCHETYPE-GROUNDED ELEMENTS (Tasks 1 & 2)
    // Primary Fix: mergeVerbatimFields unconditionally enforces user's form values
    // ──────────────────────────────────────────────────────────────────────────
    const sanitizedCopy = mergeVerbatimFields(layout.copy, eventDetails);

    const { elements, textSafeZone } = buildArchetypeLayout({
      archetype: chosenArchetype,
      canvasWidth: width,
      canvasHeight: height,
      heroImageBase64,
      copy: sanitizedCopy,
      palette,
      fontPairing,
    });

    const finalResponse = {
      width,
      height,
      background: palette.background,
      elements,
      layoutArchetype: chosenArchetype,
      textSafeZone,
      colorPalette: palette,
      fontPairing: chosenFontPairingKey,
    };

    if (isDevMode) {
      const cache = getCache();
      cache[cacheKey] = finalResponse;
      saveCache(cache);
    }

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error("Pipeline fatal error:", error);
    if (error?.message?.includes("429")) {
      return NextResponse.json(
        { error: "Gemini API rate limit reached. Please try again in a moment." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: error?.message || "Generation pipeline failed" }, { status: 500 });
  }
}
