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

export type AbstractStyle = "fluid" | "gradient" | "graffiti" | "oil";

export interface Quote {
  id: number;
  text: string;
  author: string;
  source?: string;
  lang: "zh" | "translated";
  themes: string[];
  moods: Mood[];
  brightness: Brightness[];
}

export interface AbstractImageResult {
  dataUri: string;
  fallback: boolean;
}

export interface GenerateResult {
  palette: Palette;
  abstractImage: AbstractImageResult;
  quote: Quote;
  seed: number;
}

export interface Meta {
  styles: AbstractStyle[];
  styleLabels: Record<AbstractStyle, string>;
}
