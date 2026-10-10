import { extractPalette } from "../lib/palette.js";
import type { Palette, Mood, Brightness, PaletteColor } from "../lib/palette.js";
import type { AbstractStyle } from "../lib/abstract.js";
import { generateAbstractSvg } from "../lib/abstract.js";
import { pickQuote } from "../data/quotes.js";
import type { Quote } from "../data/quotes.js";
import { generateImage } from "./wanx.js";
import { config, hasDashscopeKey } from "../config.js";

export interface GenerateRequest {
  style?: AbstractStyle;
  seed?: number;
}

export interface AbstractImageResult {
  /** 图片 data URI（AI 生成的 PNG，或兜底的 SVG） */
  dataUri: string;
  /** true 表示未配置 key 或生成失败，使用了 SVG 兜底 */
  fallback: boolean;
}

export interface GenerateResult {
  palette: Palette;
  abstractImage: AbstractImageResult;
  quote: Quote;
  seed: number;
}

/* ---------------- 抽象画风格 Prompt 模板（AI 文生图） ---------------- */

export const STYLE_PROMPTS: Record<AbstractStyle, string> = {
  fluid: "Fluid art painting, acrylic pouring technique, liquid marbled swirls, flowing organic patterns, colors: {colors}, elegant abstract, ultra detailed, no text, no watermark",
  gradient: "Smooth gradient abstract art, soft dreamy color transitions, airy pastel tones, colors: {colors}, minimalist clean aesthetic, ultra detailed, no text, no watermark",
  graffiti: "Street graffiti art, spray paint style, bold saturated colors, paint drips and splatter effects, urban hip-hop mural, colors: {colors}, raw energetic expression, no text, no watermark",
  oil: "Oil painting, thick impasto brushstrokes, palette knife texture, van gogh swirling style, visible canvas texture, rich layered colors: {colors}, expressive masterpiece, no text, no watermark",
};

/* ---------------- 色板工具 ---------------- */

function hslToHexLocal(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return "#" + toHex(r) + toHex(g) + toHex(b);
}

function hexToRgbLocal(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function hashText(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function randomPalette(seed: number): Palette {
  const rand = mulberry32(seed >>> 0);
  const baseHue = rand() * 360;
  const mode = rand() < 0.5 ? "analogous" : "triad";
  const n = 6;
  const colors: PaletteColor[] = [];
  let sumL = 0;
  for (let i = 0; i < n; i++) {
    let h: number, s: number, l: number;
    if (mode === "analogous") {
      h = (baseHue + (i - 2.5) * 16 + rand() * 12 + 360) % 360;
      s = 0.45 + rand() * 0.35;
      l = 0.32 + rand() * 0.38;
    } else {
      h = (baseHue + i * 60 + rand() * 24 + 360) % 360;
      s = 0.55 + rand() * 0.3;
      l = 0.38 + rand() * 0.3;
    }
    const hex = hslToHexLocal(h, s, l);
    const rgb = hexToRgbLocal(hex);
    sumL += l;
    colors.push({ hex, rgb, ratio: 1 / n, textColor: l > 0.55 ? "#0f0f0f" : "#fafafa" });
  }
  const mood: Mood = baseHue < 70 || baseHue >= 320 ? "warm" : baseHue >= 100 && baseHue < 280 ? "cool" : "neutral";
  const avgL = sumL / n;
  const brightness: Brightness = avgL < 0.4 ? "dark" : avgL > 0.62 ? "light" : "balanced";
  return { colors, mood, brightness, average: { l: avgL * 100, a: 0, b: 0 } };
}

function makePaletteFromHex(hexes: string[], mood: Mood, brightness: Brightness): Palette {
  const colors: PaletteColor[] = hexes.map((hex) => {
    const [r, g, b] = hexToRgbLocal(hex);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return { hex, rgb: [r, g, b], ratio: 1 / hexes.length, textColor: lum > 0.6 ? "#0f0f0f" : "#fafafa" };
  });
  return { colors, mood, brightness, average: { l: 50, a: 0, b: 0 } };
}

/** 用通义千问分析一句话的意境，得到色板；失败返回 null */
async function analyzeText(text: string): Promise<Palette | null> {
  if (!hasDashscopeKey()) return null;
  const sys = "你是色彩艺术家。感受用户这句话的意境，输出与之契合的和谐配色。只输出 JSON。";
  const user = `句子：${text}。请输出 JSON：{"mood":"warm/cool/neutral 之一","brightness":"light/dark/balanced 之一","colors":["#RRGGBB", 共6个和谐配色]}`;
  try {
    const res = await fetch(`${config.dashscopeBase}/compatible-mode/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.dashscopeApiKey}`,
      },
      body: JSON.stringify({
        model: config.qwenModel,
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { mood?: string; brightness?: string; colors?: string[] };
    const colors = Array.isArray(parsed.colors)
      ? parsed.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(String(c))).slice(0, 6)
      : [];
    if (colors.length < 3) return null;
    const mood: Mood = (["warm", "cool", "neutral"] as const).includes(parsed.mood as Mood) ? (parsed.mood as Mood) : "neutral";
    const brightness: Brightness = (["light", "dark", "balanced"] as const).includes(parsed.brightness as Brightness) ? (parsed.brightness as Brightness) : "balanced";
    return makePaletteFromHex(colors, mood, brightness);
  } catch {
    return null;
  }
}

/* ---------------- 抽象画生成（AI 文生图，SVG 兜底） ---------------- */

function svgToDataUri(svg: string): string {
  return "data:image/svg+xml;base64," + Buffer.from(svg).toString("base64");
}

/** 按颜色列表生成抽象画（供换风格接口使用） */
export async function generateAbstractFromColors(colors: string[], style: AbstractStyle, seed: number): Promise<AbstractImageResult> {
  return generateAbstractImage(makePaletteFromHex(colors, "neutral", "balanced"), style, seed);
}

async function generateAbstractImage(palette: Palette, style: AbstractStyle, seed: number): Promise<AbstractImageResult> {
  const hexes = palette.colors.slice(0, 6).map((c) => c.hex);
  if (!hasDashscopeKey()) {
    return { dataUri: svgToDataUri(generateAbstractSvg(hexes, style, seed)), fallback: true };
  }
  try {
    const template = STYLE_PROMPTS[style];
    const prompt = template.replace("{colors}", hexes.join("、"));
    const { buffer } = await generateImage({ prompt, size: "1024*1024", n: 1, seed });
    return { dataUri: "data:image/png;base64," + buffer.toString("base64"), fallback: false };
  } catch {
    return { dataUri: svgToDataUri(generateAbstractSvg(hexes, style, seed)), fallback: true };
  }
}

/* ---------------- 主编排 ---------------- */

async function generateCardFromPalette(palette: Palette, req: GenerateRequest): Promise<GenerateResult> {
  const seed = req.seed ?? Date.now();
  const abstractImage = await generateAbstractImage(palette, req.style ?? "gradient", seed);
  const quote = pickQuote({ mood: palette.mood, brightness: palette.brightness }, new Set(), seed);
  return { palette, abstractImage, quote, seed };
}

export async function generateColorCard(imageBuffer: Buffer, req: GenerateRequest = {}): Promise<GenerateResult> {
  const palette = await extractPalette(imageBuffer);
  return generateCardFromPalette(palette, req);
}

export async function generateTextCard(text: string, req: GenerateRequest = {}): Promise<GenerateResult> {
  const analysis = await analyzeText(text);
  if (analysis) return generateCardFromPalette(analysis, req);
  return generateCardFromPalette(randomPalette(req.seed ?? hashText(text)), req);
}

export async function generateRandomCard(req: GenerateRequest = {}): Promise<GenerateResult> {
  return generateCardFromPalette(randomPalette(req.seed ?? Date.now()), req);
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
