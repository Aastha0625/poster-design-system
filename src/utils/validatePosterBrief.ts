import { EventDetails, GeminiDesignBrief } from "@/types/poster";

/**
 * Fields whose text must come verbatim from the user's form, never from Gemini.
 */
export const VERBATIM_FIELDS = [
  "name",
  "venue",
  "date",
  "time",
  "cta",
  "contact",
  "organizer",
] as const;

export type VerbatimField = (typeof VERBATIM_FIELDS)[number];

/** Expected max lengths for fields Gemini IS allowed to generate. */
const GENERATED_FIELD_MAX_LENGTH: Record<string, number> = {
  title: 70,
  description: 140,
  heroImagePrompt: 600,
};

/** Phrases that only ever show up when the model is reasoning out loud instead of returning final content. */
const META_COMMENTARY_PATTERNS: RegExp[] = [
  /\blet'?s\b/i,
  /\bwait[,.]?\b/i,
  /\bmake sure\b/i,
  /\bkeep (it |the )?clear\b/i,
  /\bwithout (extra|filler)\b/i,
  /\bmatch(ing)? context\b/i,
  /\bverified\b/i,
  /\bplaceholder replacement\b/i,
  /\bcontext match ok\b/i,
  /\bfine[.,]/i,
  /\bok[.,]\s/i,
  /\bcleaned up\b/i,
  /\bremoved\b/i,
  /\bcorrected\b/i,
];

export interface FieldIssue {
  field: string;
  reason: "meta-commentary" | "too-long" | "duplicated-sentence" | "empty";
  excerpt: string;
}

/** Detects a sentence repeated verbatim within the same field. */
export function hasDuplicatedSentence(text: string): boolean {
  if (!text) return false;
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 8); // ignore trivial fragments
  const seen = new Set<string>();
  for (const s of sentences) {
    if (seen.has(s)) return true;
    seen.add(s);
  }
  return false;
}

export function checkGeneratedField(field: string, value: string): FieldIssue | null {
  if (!value || !value.trim()) {
    return { field, reason: "empty", excerpt: "" };
  }
  const maxLen = GENERATED_FIELD_MAX_LENGTH[field];
  if (maxLen && value.length > maxLen) {
    return { field, reason: "too-long", excerpt: value.slice(0, 80) };
  }
  if (META_COMMENTARY_PATTERNS.some((re) => re.test(value))) {
    return { field, reason: "meta-commentary", excerpt: value.slice(0, 120) };
  }
  if (hasDuplicatedSentence(value)) {
    return { field, reason: "duplicated-sentence", excerpt: value.slice(0, 120) };
  }
  return null;
}

export interface ValidationResult {
  valid: boolean;
  issues: FieldIssue[];
}

/**
 * Validates the creative fields Gemini is allowed to generate
 * (title, description, heroImagePrompt).
 */
export function validateGeneratedFields(
  fields: Record<string, unknown>,
  targetFieldNames: string[] = ["title", "description", "heroImagePrompt"]
): ValidationResult {
  const issues: FieldIssue[] = [];
  for (const field of targetFieldNames) {
    const value = fields[field];
    if (typeof value !== "string") continue;
    const issue = checkGeneratedField(field, value);
    if (issue) issues.push(issue);
  }
  return { valid: issues.length === 0, issues };
}

export interface MergedPosterCopy {
  title: string;
  description?: string;
  venue?: string;
  date?: string;
  time?: string;
  cta?: string;
  contact?: string;
  kicker?: string;
}

/**
 * THE PRIMARY FIX: Overwrites any verbatim field in the copy with the
 * original user form value, unconditionally — regardless of what Gemini returned.
 * Verbatim fields are NEVER trusted from the model.
 */
export function mergeVerbatimFields(
  geminiCopy: GeminiDesignBrief["copy"] | undefined,
  formValues: EventDetails
): MergedPosterCopy {
  // Title: If Gemini proposed a creative/polished title that is clean, use it;
  // otherwise strictly fallback to the exact user event name.
  let title = formValues.name?.trim() || "";
  if (geminiCopy?.title && typeof geminiCopy.title === "string") {
    const issue = checkGeneratedField("title", geminiCopy.title);
    if (!issue && geminiCopy.title.trim().length > 0) {
      title = geminiCopy.title.trim();
    }
  }

  // Description: If Gemini generated a clean, concise description, use it;
  // otherwise fallback to form description.
  let description = formValues.description || "";
  if (geminiCopy?.description && typeof geminiCopy.description === "string") {
    const issue = checkGeneratedField("description", geminiCopy.description);
    if (!issue && geminiCopy.description.trim().length > 0) {
      description = geminiCopy.description.trim();
    }
  }

  return {
    title,
    description,
    // Factual verbatim fields: NEVER from Gemini
    venue: formValues.venue || "",
    date: formValues.date || "",
    time: formValues.time || "",
    cta: formValues.cta || "",
    contact: formValues.contact || "",
    kicker: formValues.organizer || "",
  };
}

/**
 * Builds a short, targeted correction prompt for a single retry — asks
 * Gemini for ONLY the failing creative field(s).
 */
export function buildCorrectionPrompt(issues: FieldIssue[]): string {
  const lines = issues.map(
    (issue) =>
      `- "${issue.field}" is invalid (${issue.reason}). Excerpt: "${issue.excerpt}". Return ONLY a clean, final, presentation-ready string for this field — no meta-commentary, no reasoning, no repeated sentences.`
  );
  return [
    "Your previous response had the following field validation issues:",
    ...lines,
    "",
    'Return ONLY a valid JSON object of the form { "field": "corrected value" } for the failing fields. Nothing else.',
  ].join("\n");
}

/**
 * Safe fallback for a field that fails validation twice.
 */
export function fallbackForField(field: string, value: string, fallbackText = ""): string {
  const firstSentence = value.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (firstSentence && firstSentence.length > 0 && firstSentence.length <= 120 && !META_COMMENTARY_PATTERNS.some((re) => re.test(firstSentence))) {
    return firstSentence;
  }
  const safeDefaults: Record<string, string> = {
    title: fallbackText || "",
    description: fallbackText || "",
    heroImagePrompt: fallbackText || "Cinematic, atmospheric background artwork matching the event theme, no text, no watermark.",
  };
  return safeDefaults[field] ?? fallbackText;
}
