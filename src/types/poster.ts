
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
}

export type PosterElement = TextElement | ShapeElement | ImageElement;

export interface PosterState {
  width: number;
  height: number;
  background: string;
  elements: PosterElement[];
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

export interface PosterDesignRequest {
  eventDetails: EventDetails;
  style: string;
  format: "A4 Portrait" | "A4 Landscape" | "Square" | "Story";
}

