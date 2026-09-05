
export type ElementType = "text" | "shape" | "image";

export interface BaseElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  layerIndex?: number;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  fill: string;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  align?: "left" | "center" | "right";
  letterSpacing?: number;
  lineHeight?: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeType: "rectangle" | "circle" | "line";
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  src: string;
  role?: string;
}

export type PosterElement = TextElement | ShapeElement | ImageElement;

export type LayoutArchetype = 
  | "hero-top-text-bottom" 
  | "hero-bottom-text-top" 
  | "split-vertical" 
  | "centered-badge" 
  | "asymmetric-thirds";

export interface TextSafeZone {
  x: number;
  y: number;
  width: number;
  height: number;
  description?: string;
}

export interface ColorPalette {
  background: string;
  primaryText: string;
  secondaryText: string;
  accent: string;
  surface?: string;
  overlay?: string;
}

export type FontPairingKey = 
  | "modern-bold" 
  | "editorial-serif" 
  | "high-impact" 
  | "tech-futuristic" 
  | "clean-corporate" 
  | "dramatic-cinematic";

export interface FontPairing {
  id: FontPairingKey;
  label: string;
  displayFont: string;
  bodyFont: string;
  vibe: string;
}

export interface PosterState {
  width: number;
  height: number;
  background: string;
  elements: PosterElement[];
  layoutArchetype?: LayoutArchetype;
  textSafeZone?: TextSafeZone;
  colorPalette?: ColorPalette;
  fontPairing?: FontPairingKey;
}

export interface EventDetails {
  name: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  cta: string;
  contact: string;
  additionalDetails: string;
}

export interface GeminiDesignBrief {
  visualConcept: string;
  vibeJustification: string;
  layoutArchetype: LayoutArchetype;
  fontPairing: FontPairingKey;
  colorPalette: ColorPalette;
  heroVisual: {
    required: boolean;
    description: string;
  };
  copy: {
    kicker?: string;
    title: string;
    description?: string;
    date?: string;
    time?: string;
    venue?: string;
    cta?: string;
    contact?: string;
  };
}

export interface PosterDesignRequest {
  eventDetails: EventDetails;
  style: string;
  format: "A4 Portrait" | "A4 Landscape" | "Square" | "Story";
  preferredArchetype?: LayoutArchetype;
  preferredFontPairing?: FontPairingKey;
}

