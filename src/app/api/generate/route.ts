
import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const CACHE_FILE = path.join(process.cwd(), ".poster-cache.json");

function getCache() {
  if (fs.existsSync(CACHE_FILE)) {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
  }
  return {};
}

function saveCache(cache: any) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
    }

    const body = await req.json();
    const { eventDetails, style, format } = body;

    const isDevMode = process.env.DEVELOPMENT_MODE === "true";
    const cacheKey = crypto.createHash("md5").update(JSON.stringify({ eventDetails, style, format })).digest("hex");
    
    if (isDevMode) {
      const cache = getCache();
      if (cache[cacheKey]) {
        console.log("Serving from DEVELOPMENT_MODE cache");
        const cachedLayout = cache[cacheKey];
        cachedLayout.elements = cachedLayout.elements.map((el: any) => ({ ...el, id: uuidv4() }));
        return NextResponse.json(cachedLayout);
      }
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // STAGE 1: DESIGN INTELLIGENCE
    const textModelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";
    const textModel = genAI.getGenerativeModel({
      model: textModelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: {
            visualConcept: { type: SchemaType.STRING, description: "A detailed description of the overarching visual concept." },
            background: { type: SchemaType.STRING },
            heroVisual: {
              type: SchemaType.OBJECT,
              properties: {
                required: { type: SchemaType.BOOLEAN },
                description: { type: SchemaType.STRING, description: "An exact image generation prompt for the hero visual." },
                x: { type: SchemaType.NUMBER },
                y: { type: SchemaType.NUMBER },
                width: { type: SchemaType.NUMBER },
                height: { type: SchemaType.NUMBER }
              },
              required: ["required", "description", "x", "y", "width", "height"]
            },
            elements: {
              type: SchemaType.ARRAY,
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  type: { type: SchemaType.STRING },
                  text: { type: SchemaType.STRING },
                  fontSize: { type: SchemaType.NUMBER },
                  fontFamily: { type: SchemaType.STRING },
                  fill: { type: SchemaType.STRING },
                  fontWeight: { type: SchemaType.STRING },
                  align: { type: SchemaType.STRING },
                  x: { type: SchemaType.NUMBER },
                  y: { type: SchemaType.NUMBER },
                  width: { type: SchemaType.NUMBER },
                  height: { type: SchemaType.NUMBER },
                  shapeType: { type: SchemaType.STRING },
                },
                required: ["type", "x", "y", "width", "height", "fill"]
              }
            }
          },
          required: ["visualConcept", "background", "heroVisual", "elements"]
        }
      }
    });

    let width = 794; let height = 1123;
    if (format === "A4 Landscape") { width = 1123; height = 794; } 
    else if (format === "Square") { width = 1000; height = 1000; } 
    else if (format === "Story") { width = 1080; height = 1920; }

    const prompt = `
      You are an elite Art Director. Design a professional event poster.
      
      EVENT DETAILS:
      Name: ${eventDetails.name}
      Description: ${eventDetails.description}
      Date: ${eventDetails.date} | Time: ${eventDetails.time}
      Venue: ${eventDetails.venue}
      CTA: ${eventDetails.cta}
      Style: ${style}
      Canvas Size: ${width}px width by ${height}px height.

      CORE RULE: SEMANTIC RELEVANCE
      The poster MUST begin with a content-aware visual concept.
      You must deduce the exact SUBJECT of the poster before designing.
      - "AI Hackathon" -> Neural networks, data streams, glowing core, developers.
      - "Music Festival" -> Stage, sound waves, instruments.
      - "Food Festival" -> Culinary imagery, ingredients.
      - "Business Conference" -> Corporate, professional, editorial context.
      - "Environment Campaign" -> Nature, ecosystems, earth.
      DO NOT USE generic futuristic cities or skyscrapers unless it is an architecture event.

      1. HERO VISUAL: 
         - Output heroVisual.required = true. 
         - In heroVisual.description, write a HIGHLY DETAILED, SEMANTICALLY RELEVANT image-generation prompt.
         - The prompt must include: EVENT TYPE, SUBJECT, REQUIRED VISUAL ELEMENTS, STYLE, COMPOSITION, LIGHTING, and COLOR DIRECTION.
         - End the prompt with "NO TEXT, NO LETTERS, NO LOGOS."
         - Example for AI: "Create a premium editorial hero artwork specifically for an Artificial Intelligence hackathon. The central subject is a sophisticated generative AI computational core formed from interconnected neural-network nodes... Dark sophisticated environment with controlled cyan... NO TEXT."
      
      2. COMPOSITION: Use modern poster layouts. Asymmetric, diagonal, overlapping. Do not stack everything in the center.
      3. TYPOGRAPHY: Make the Event Name MASSIVE. Use striking fonts.
      4. INFOGRAPHICS: Create visual blocks for the date and venue (e.g., colored rectangles behind the text).
      5. COLORS: Choose a coherent color palette based on the visual concept.
      
      Return the structured design specification.
    `;

    console.log("Stage 1: Calling Text Model", textModelName);
    const textResult = await textModel.generateContent(prompt);
    const layout = JSON.parse(textResult.response.text());

    let heroImageUrl = null;
    let heroImageBase64 = null;

    // STAGE 2: IMAGE GENERATION (Using Pollinations.ai free API)
    if (layout.heroVisual && layout.heroVisual.required) {
      try {
        console.log("Stage 2: Calling Free Image API (Pollinations)");
        const safePrompt = layout.heroVisual.description.replace(/[^a-zA-Z0-9 ,.-]/g, "");
        const imageWidth = Math.round(layout.heroVisual.width || width);
        const imageHeight = Math.round(layout.heroVisual.height || height);
        
        heroImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(safePrompt)}?width=${imageWidth}&height=${imageHeight}&nologo=true`;
        console.log("Fetching image from:", heroImageUrl);

        const imageResponse = await fetch(heroImageUrl);
        if (!imageResponse.ok) {
           throw new Error("Failed to fetch image from Pollinations");
        }
        
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        heroImageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
        console.log("Image successfully downloaded and encoded to Base64.");

      } catch (err: any) {
        console.error("Image Generation URL construction failed:", err.message);
        throw new Error("Unable to generate hero artwork. Try again.");
      }
    }

    const processedElements = [];

    // Add generated hero image if successful
    if (heroImageBase64) {
      processedElements.push({
        id: uuidv4(),
        type: "image",
        src: heroImageBase64,
        x: layout.heroVisual.x,
        y: layout.heroVisual.y,
        width: layout.heroVisual.width,
        height: layout.heroVisual.height,
        role: "hero"
      });
      
      // Add optional dark overlay for text contrast if requested by design
      processedElements.push({
        id: uuidv4(),
        type: "shape",
        shapeType: "rectangle",
        x: layout.heroVisual.x,
        y: layout.heroVisual.y,
        width: layout.heroVisual.width,
        height: layout.heroVisual.height,
        fill: "rgba(0,0,0,0.5)",
      });
    }

    // Add typography and infographics
    const canvasElements = [...processedElements, ...layout.elements.map((el: any) => ({
      ...el,
      id: uuidv4(),
    }))];

    const finalResponse = {
      width,
      height,
      background: layout.background,
      elements: canvasElements,
    };

    if (isDevMode) {
      const cache = getCache();
      cache[cacheKey] = finalResponse;
      saveCache(cache);
    }

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error("Pipeline error:", error);
    if (error.message.includes("429")) {
      return NextResponse.json({ error: "Gemini API limit reached. Please try again later or switch to another configured model." }, { status: 429 });
    }
    return NextResponse.json({ error: error.message || "Pipeline failed" }, { status: 500 });
  }
}

