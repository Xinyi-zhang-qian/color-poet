import { extractPalette } from "../lib/palette.js";
import type { Palette, Mood, Brightness } from "../lib/palette.js";
import { generateAbstractSvg } from "../lib/abstract.js";
import type { AbstractStyle } from "../lib/abstract.js";
import { pickQuote } from "../data/quotes.js";
import type { Quote } from "../data/quotes.js";
import { generateImage } from "./wanx.js";
import { config, hasDashscopeKey } from "../config.js";

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
  return `一只超可爱的动漫风格${animal}，Q版圆润造型，圆溜溜的大眼睛，毛茸茸的质感，${description}，画面配色使用这些颜色：${hexes}，背景为简洁的纯色或极简几何色块，柔和光影，治愈系高质量插画，干净清爽`;
}

const NEGATIVE_PROMPT = "写实照片，恐怖，血腥，畸形，多余肢体，模糊，低质量，文字，水印，签名，杂乱背景，暗沉，压抑";

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
    return {
      name: animal,
      imageDataUri: `data:image/png;base64,${buffer.toString("base64")}`,
      fallback: false,
    };
  } catch (e) {
    return { name: animal, fallback: true, error: e instanceof Error ? e.message : String(e) };
  }
}

/* ---------- 主编排 ---------- */

export async function generateColorCard(imageBuffer: Buffer, req: GenerateRequest = {}): Promise<GenerateResult> {
  const seed = req.seed ?? Date.now();

  // ① 感知：提取调色板
  const palette = await extractPalette(imageBuffer);

  // ② 决策：选动物 + 意境描述（LLM 增强，失败回退规则）
  const decision = await decide(palette, req.animal, seed);

  // ③ 并行执行：抽象图（本地）、动物（万相）、名句（检索）
  const abstractSvg = generateAbstractSvg(palette.colors.map((c) => c.hex), req.style ?? "aurora", seed);
  const [animal, quote] = await Promise.all([
    generateAnimalImage(decision.animal, palette, decision.description, seed),
    Promise.resolve(pickQuote({ mood: palette.mood, brightness: palette.brightness }, new Set(), seed)),
  ]);

  // ④ 组装
  return { palette, abstractSvg, animal, quote, decision, seed };
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
