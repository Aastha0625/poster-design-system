import { FontPairing, FontPairingKey } from "@/types/poster";

export const FONT_PAIRINGS: Record<FontPairingKey, FontPairing> = {
  "modern-bold": {
    id: "modern-bold",
    label: "Modern Bold",
    displayFont: "Montserrat",
    bodyFont: "Inter",
    vibe: "High-energy tech summits, modern startups, product launches, dynamic youth conferences",
  },
  "editorial-serif": {
    id: "editorial-serif",
    label: "Editorial Serif",
    displayFont: "Playfair Display",
    bodyFont: "Inter",
    vibe: "Art exhibitions, galas, literary festivals, luxury showcases, formal symposiums",
  },
  "high-impact": {
    id: "high-impact",
    label: "High Impact Headline",
    displayFont: "Oswald",
    bodyFont: "Inter",
    vibe: "Sports tournaments, music festivals, bold protests, concerts, urgent announcements",
  },
  "tech-futuristic": {
    id: "tech-futuristic",
    label: "Tech Futuristic",
    displayFont: "Space Grotesk",
    bodyFont: "Inter",
    vibe: "AI hackathons, web3 expos, robotics conventions, cybersecurity summits",
  },
  "clean-corporate": {
    id: "clean-corporate",
    label: "Clean Corporate",
    displayFont: "Plus Jakarta Sans",
    bodyFont: "Inter",
    vibe: "Business seminars, investor briefings, professional networking, medical & academic conferences",
  },
  "dramatic-cinematic": {
    id: "dramatic-cinematic",
    label: "Dramatic Cinematic",
    displayFont: "Cinzel",
    bodyFont: "Inter",
    vibe: "Film screenings, theatrical premieres, historical galas, prestigious awards nights",
  },
};

export const DEFAULT_FONT_PAIRING_KEY: FontPairingKey = "modern-bold";

export function getFontPairing(key?: string): FontPairing {
  if (key && key in FONT_PAIRINGS) {
    return FONT_PAIRINGS[key as FontPairingKey];
  }
  return FONT_PAIRINGS[DEFAULT_FONT_PAIRING_KEY];
}

export function getAllFontPairings(): FontPairing[] {
  return Object.values(FONT_PAIRINGS);
}

export function getAvailableFontPairingKeys(): FontPairingKey[] {
  return Object.keys(FONT_PAIRINGS) as FontPairingKey[];
}
