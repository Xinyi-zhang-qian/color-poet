export interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
  ratio: number;
  textColor: "#0f0f0f" | "#fafafa";
}

export type Mood = "warm" | "cool" | "neutral";
export type Brightness = "light" | "dark" | "balanced";

export interface Palette {
  colors: PaletteColor[];
  mood: Mood;
  brightness: Brightness;
  average: { l: number; a: number; b: number };
}

export type AbstractStyle = "aurora" | "mondrian" | "gradients" | "flow";

export interface Quote {
  id: number;
  text: string;
  author: string;
  source?: string;
  lang: "zh" | "translated" | "classical";
  themes: string[];
  moods: Mood[];
  brightness: Brightness[];
}

export interface AnimalResult {
  name: string;
  imageDataUri?: string;
  fallback: boolean;
  error?: string;
}

export interface Decision {
  animal: string;
  description: string;
  byLLM: boolean;
}

export interface GenerateResult {
  palette: Palette;
  abstractSvg: string;
  animal: AnimalResult;
  quote: Quote;
  decision: Decision;
  seed: number;
}

export interface Meta {
  animals: Record<Mood, string[]>;
  styles: AbstractStyle[];
  styleLabels: Record<AbstractStyle, string>;
}
