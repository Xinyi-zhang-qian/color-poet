import { extractPalette } from "../lib/palette.js";
import type { Palette, Mood, Brightness, PaletteColor } from "../lib/palette.js";
import { generateAbstractSvg } from "../lib/abstract.js";
import type { AbstractStyle } from "../lib/abstract.js";
import { pickQuote } from "../data/quotes.js";
import type { Quote } from "../data/quotes.js";
import { generateImage } from "./wanx.js";
import { config, hasDashscopeKey } from "../config.js";
import sharp from "sharp";

/* ---------- 可爱动物候选池（按情绪分组） ---------- */

export const ANIMALS: Record<Mood, string[]> = {
  warm: ["柴犬", "橘猫", "小鹿", "兔子", "熊猫", "龙猫", "柯基", "小熊"],
  cool: ["雪狐", "企鹅", "鲸鱼", "猫头鹰", "海豹", "白兔", "雪鸮", "北极熊"],
  neutral: ["仓鼠", "水獭", "海豹", "熊猫", "刺猬", "树懒", "小企鹅", "小猫"],
};

export interface Decision {
  animal: string;
  description: string;
  byLLM: boolean;
}

export interface GenerateRequest {
  animal?: string;
  style?: AbstractStyle;
  seed?: number;
}

export interface AnimalResult {
  name: string;
  /** 生成图片（data URI），fallback 时为 undefined */
  imageDataUri?: string;
  /** 是否因未配置 key 或生成失败而降级 */
  fallback: boolean;
  error?: string;
}

export interface GenerateResult {
  palette: Palette;
  abstractSvg: string;
  animal: AnimalResult;
  quote: Quote;
  decision: Decision;
  seed: number;
}

/* ---------- 决策：规则引擎（可选 LLM 增强） ---------- */

function ruleDecide(palette: Palette, requested?: string, seed = Date.now()): Decision {
  const rand = mulberry32(seed >>> 0);
  const pool = ANIMALS[palette.mood] ?? ANIMALS.neutral;
  const animal = requested && requested.trim() ? requested.trim() : pool[Math.floor(rand() * pool.length)]!;

  const moodText: Record<Mood, string> = {
    warm: "温暖明媚",
    cool: "清冷静谧",
    neutral: "柔和恬淡",
  };
  const brightText: Record<Brightness, string> = {
    light: "明亮通透",
    dark: "沉静深邃",
    balanced: "柔和舒适",
  };
  const description = `${moodText[palette.mood]}、${brightText[palette.brightness]}的画面氛围`;
  return { animal, description, byLLM: false };
}

/** 可选：调用通义千问做更细腻的意境理解（失败自动回退规则） */
async function llmDecide(palette: Palette, requested?: string, seed = Date.now()): Promise<Decision | null> {
  if (!hasDashscopeKey()) return null;
  const rule = ruleDecide(palette, requested, seed);
  const hexes = palette.colors.slice(0, 5).map((c) => c.hex).join("、");
  const pool = (ANIMALS[palette.mood] ?? ANIMALS.neutral).join("、");

  const sys = "你是一位懂色彩与文学的艺术策展人。根据图片的色调与情绪，从给定的动物候选池中挑选一只最契合的可爱动物，并用一句话描述画面意境。只输出 JSON。";
  const user = `主色调：${hexes}；整体情绪：${palette.mood}；明暗：${palette.brightness}；动物候选池：${pool}${requested ? `；用户指定动物：${requested}` : ""}。请输出 JSON：{"animal":"从候选池选择，或保留用户指定","description":"不超过20字的中文意境描述"}`;

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
        temperature: 0.8,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { animal?: string; description?: string };
    const animal = (parsed.animal ?? rule.animal).trim();
    return { animal, description: (parsed.description ?? rule.description).slice(0, 40), byLLM: true };
  } catch {
    return null;
  }
}

async function decide(palette: Palette, requested?: string, seed = Date.now()): Promise<Decision> {
  const llm = await llmDecide(palette, requested, seed);
  return llm ?? ruleDecide(palette, requested, seed);
}

/* ---------- 动物生成（万相 + 降级） ---------- */

function buildAnimalPrompt(animal: string, palette: Palette, description: string): string {
  const hexes = palette.colors.slice(0, 5).map((c) => c.hex).join("、");
  return `一只超可爱的动漫风格${animal}，Q版圆润造型，圆溜溜的大眼睛，毛茸茸的质感，${description}，全身像居中，主体配色使用这些颜色：${hexes}，背景为纯白色，无阴影，无文字，柔和光影，治愈系高质量插画`;
}

const NEGATIVE_PROMPT = "写实照片，恐怖，血腥，畸形，多余肢体，模糊，低质量，文字，水印，签名，杂乱背景，暗沉，压抑";

/** 去除图片背景（色度键控）：采样边缘背景色，把接近背景色的像素透明化（软边缘） */
async function removeBackground(buffer: Buffer): Promise<Buffer> {
  try {
    const { data, info } = await sharp(buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const ch = info.channels;
    const samples: number[] = [];
    const push = (x: number, y: number) => {
      const i = (y * w + x) * ch;
      samples.push(data[i]!, data[i + 1]!, data[i + 2]!);
    };
    for (let x = 0; x < w; x += 8) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y += 8) { push(0, y); push(w - 1, y); }
    let sr = 0, sg = 0, sb = 0;
    for (let i = 0; i < samples.length; i += 3) { sr += samples[i]!; sg += samples[i + 1]!; sb += samples[i + 2]!; }
    const n = samples.length / 3;
    const br = sr / n, bg = sg / n, bb = sb / n;
    const soft = 48;
    const hard = 96;
    for (let i = 0; i < data.length; i += ch) {
      const r = data[i]!, g = data[i + 1]!, b = data[i + 2]!;
      const dist = Math.abs(r - br) + Math.abs(g - bg) + Math.abs(b - bb);
      if (dist < soft) data[i + 3] = 0;
      else if (dist < hard) data[i + 3] = Math.round((255 * (dist - soft)) / (hard - soft));
    }
    return await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  } catch {
    return buffer;
  }
}

async function generateAnimalImage(
  animal: string,
  palette: Palette,
  description: string,
  seed: number,
): Promise<AnimalResult> {
  if (!hasDashscopeKey()) {
    return { name: animal, fallback: true, error: "未配置 DASHSCOPE_API_KEY" };
  }
  try {
    const prompt = buildAnimalPrompt(animal, palette, description);
    const { buffer } = await generateImage({
      prompt,
      size: "1024*1024",
      n: 1,
      seed,
      negativePrompt: NEGATIVE_PROMPT,
    });
    const cutout = await removeBackground(buffer);
    return {
      name: animal,
      imageDataUri: `data:image/png;base64,${cutout.toString("base64")}`,
      fallback: false,
    };
  } catch (e) {
    return { name: animal, fallback: true, error: e instanceof Error ? e.message : String(e) };
  }
}

/* ---------- 色板工具（随机 / 文字抽卡） ---------- */

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

/** 随机生成一组和谐的色板 */
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

interface TextAnalysis {
  palette: Palette;
  description: string;
  animal?: string;
}

/** 用通义千问分析一句话的意境，得到色板与描述；失败返回 null */
async function analyzeText(text: string): Promise<TextAnalysis | null> {
  if (!hasDashscopeKey()) return null;
  const pool = ANIMALS.warm.concat(ANIMALS.cool, ANIMALS.neutral).join("、");
  const sys = "你是一位灵性艺术策展人。感受用户这句话的意境，输出与之契合的和谐配色、情绪与一只可爱动物。只输出 JSON。";
  const user = `句子：${text}；动物候选池：${pool}。请输出 JSON：{"mood":"warm/cool/neutral 之一","brightness":"light/dark/balanced 之一","description":"不超过20字的中文意境描述","animal":"从候选池选一只","colors":["#RRGGBB", 共6个和谐配色]}`;
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
    const parsed = JSON.parse(content) as { mood?: string; brightness?: string; description?: string; animal?: string; colors?: string[] };
    const colors = Array.isArray(parsed.colors)
      ? parsed.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(String(c))).slice(0, 6)
      : [];
    if (colors.length < 3) return null;
    const mood: Mood = (["warm", "cool", "neutral"] as const).includes(parsed.mood as Mood) ? (parsed.mood as Mood) : "neutral";
    const brightness: Brightness = (["light", "dark", "balanced"] as const).includes(parsed.brightness as Brightness) ? (parsed.brightness as Brightness) : "balanced";
    return {
      palette: makePaletteFromHex(colors, mood, brightness),
      description: String(parsed.description ?? "").slice(0, 40),
      animal: typeof parsed.animal === "string" ? parsed.animal.trim() : undefined,
    };
  } catch {
    return null;
  }
}

/* ---------- 主编排 ---------- */

/** 从色板生成完整诗卡（图片 / 文字 / 随机三种模式共用） */
async function generateCardFromPalette(
  palette: Palette,
  req: GenerateRequest,
  analysis?: { description?: string; animal?: string },
): Promise<GenerateResult> {
  const seed = req.seed ?? Date.now();
  const decision: Decision = analysis?.description
    ? { animal: req.animal ?? analysis.animal ?? ANIMALS[palette.mood]?.[0] ?? "小猫", description: analysis.description, byLLM: true }
    : await decide(palette, req.animal, seed);

  const abstractSvg = generateAbstractSvg(palette.colors.map((c) => c.hex), req.style ?? "gradient", seed);
  const [animal, quote] = await Promise.all([
    generateAnimalImage(decision.animal, palette, decision.description, seed),
    Promise.resolve(pickQuote({ mood: palette.mood, brightness: palette.brightness }, new Set(), seed)),
  ]);

  return { palette, abstractSvg, animal, quote, decision, seed };
}

/** 上传图片抽卡：提取色板 → 生成 */
export async function generateColorCard(imageBuffer: Buffer, req: GenerateRequest = {}): Promise<GenerateResult> {
  const palette = await extractPalette(imageBuffer);
  return generateCardFromPalette(palette, req);
}

/** 一句话抽卡：分析文字意境 → 生成 */
export async function generateTextCard(text: string, req: GenerateRequest = {}): Promise<GenerateResult> {
  const analysis = await analyzeText(text);
  if (analysis) {
    return generateCardFromPalette(
      analysis.palette,
      { ...req, animal: req.animal ?? analysis.animal },
      { description: analysis.description, animal: analysis.animal },
    );
  }
  const seed = req.seed ?? hashText(text);
  const palette = randomPalette(seed);
  return generateCardFromPalette(palette, req);
}

/** 直接抽卡：随机色板 → 生成 */
export async function generateRandomCard(req: GenerateRequest = {}): Promise<GenerateResult> {
  const seed = req.seed ?? Date.now();
  const palette = randomPalette(seed);
  return generateCardFromPalette(palette, req);
}

/** 单独换一只动物：重新提取调色板并生成（供 /api/animal 使用） */
export async function generateAnimalOnly(
  imageBuffer: Buffer,
  req: GenerateRequest = {},
): Promise<{ palette: Palette; animal: AnimalResult }> {
  const seed = req.seed ?? Date.now();
  const palette = await extractPalette(imageBuffer);
  const decision = await decide(palette, req.animal, seed);
  const animal = await generateAnimalImage(decision.animal, palette, decision.description, seed);
  return { palette, animal };
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
