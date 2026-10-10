import Fastify from "fastify";
import type { FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import sharp from "sharp";
import { config, hasDashscopeKey } from "./config.js";
import { generateColorCard, generateAnimalOnly, generateTextCard, generateRandomCard, ANIMALS } from "./lib/agent.js";
import type { GenerateRequest } from "./lib/agent.js";
import { ABSTRACT_STYLES, ABSTRACT_STYLE_LABELS, generateAbstractSvg } from "./lib/abstract.js";
import type { AbstractStyle } from "./lib/abstract.js";
import { extractPalette } from "./lib/palette.js";
import { pickQuote } from "./data/quotes.js";
import type { Mood, Brightness } from "./lib/palette.js";

const app = Fastify({ logger: { level: "info" } });

await app.register(cors, { origin: true });
await app.register(multipart, { limits: { fileSize: 20 * 1024 * 1024, files: 1 } });

/* ---------- 健康检查 / 元信息 ---------- */

app.get("/api/health", async () => ({
  ok: true,
  service: "色彩诗卡 ColorPoet API",
  wanxModel: config.wanxModel,
  hasApiKey: hasDashscopeKey(),
}));

app.get("/api/meta", async () => ({
  animals: ANIMALS,
  styles: ABSTRACT_STYLES,
  styleLabels: ABSTRACT_STYLE_LABELS,
}));

/* ---------- 工具函数 ---------- */

interface Part {
  fieldname: string;
  file?: boolean;
  type?: string;
  value?: string;
  toBuffer?: () => Promise<Buffer>;
}

function isFilePart(part: Part): boolean {
  return part.file === true || part.type === "file";
}

async function readImageFromMultipart(req: FastifyRequest): Promise<{ image: Buffer; opts: GenerateRequest }> {
  const opts: GenerateRequest = {};
  let image: Buffer | null = null;

  // @fastify/multipart 的 parts() 异步迭代器
  const parts = (req as unknown as { parts: () => AsyncIterable<Part> }).parts();
  for await (const part of parts) {
    if (isFilePart(part)) {
      image = await part.toBuffer!();
    } else if (part.fieldname === "animal") {
      opts.animal = (part.value ?? "").trim() || undefined;
    } else if (part.fieldname === "style") {
      const s = (part.value ?? "").trim();
      if ((ABSTRACT_STYLES as string[]).includes(s)) opts.style = s as GenerateRequest["style"];
    } else if (part.fieldname === "seed") {
      const n = Number(part.value);
      if (Number.isFinite(n)) opts.seed = Math.floor(n);
    }
  }

  if (!image || image.length === 0) {
    throw Object.assign(new Error("请上传一张图片"), { statusCode: 400 });
  }
  return { image, opts };
}

async function validateImage(buffer: Buffer): Promise<void> {
  try {
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) throw new Error();
  } catch {
    throw Object.assign(new Error("无法识别的图片文件"), { statusCode: 400 });
  }
}

/* ---------- 接口 ---------- */

// 仅提取调色板（上传后即时反馈）
app.post("/api/palette", async (req) => {
  const { image } = await readImageFromMultipart(req);
  await validateImage(image);
  return { palette: await extractPalette(image) };
});

// 完整生成：调色板 + 抽象图 + 动物 + 名句
app.post("/api/generate", async (req) => {
  const { image, opts } = await readImageFromMultipart(req);
  await validateImage(image);
  return await generateColorCard(image, opts);
});

const MOODS: Mood[] = ["warm", "cool", "neutral"];
const BRIGHTNESSES: Brightness[] = ["light", "dark", "balanced"];

// 换一句诗（轻量，无需图片）
app.post("/api/quote", async (req) => {
  const body = (req.body ?? {}) as { mood?: string; brightness?: string; excludeIds?: number[] };
  const mood: Mood = MOODS.includes(body.mood as Mood) ? (body.mood as Mood) : "neutral";
  const brightness: Brightness = BRIGHTNESSES.includes(body.brightness as Brightness)
    ? (body.brightness as Brightness)
    : "balanced";
  const quote = pickQuote({ mood, brightness }, new Set(body.excludeIds ?? []), Date.now());
  return { quote };
});

// 切换抽象图风格（轻量）
app.post("/api/abstract", async (req) => {
  const body = (req.body ?? {}) as { colors?: string[]; style?: string; seed?: number };
  if (!Array.isArray(body.colors) || body.colors.length === 0) {
    throw Object.assign(new Error("缺少颜色列表"), { statusCode: 400 });
  }
  const style = (ABSTRACT_STYLES as string[]).includes(body.style ?? "")
    ? (body.style as (typeof ABSTRACT_STYLES)[number])
    : "aurora";
  return { svg: generateAbstractSvg(body.colors, style, body.seed ?? Date.now()) };
});

// 换一只动物（重新生成，保持其余不变）
app.post("/api/animal", async (req) => {
  const { image, opts } = await readImageFromMultipart(req);
  await validateImage(image);
  return await generateAnimalOnly(image, opts);
});

function optsFromBody(body: { animal?: string; style?: string; seed?: number }): GenerateRequest {
  const opts: GenerateRequest = { animal: body.animal?.trim() || undefined, seed: body.seed };
  if ((ABSTRACT_STYLES as string[]).includes(body.style ?? "")) {
    opts.style = body.style as AbstractStyle;
  }
  return opts;
}

// 一句话抽卡
app.post("/api/text-card", async (req) => {
  const body = (req.body ?? {}) as { text?: string; animal?: string; style?: string; seed?: number };
  const text = (body.text ?? "").trim();
  if (!text) throw Object.assign(new Error("请输入一句话"), { statusCode: 400 });
  return await generateTextCard(text, optsFromBody(body));
});

// 直接抽卡（随机）
app.post("/api/random-card", async (req) => {
  const body = (req.body ?? {}) as { animal?: string; style?: string; seed?: number };
  return await generateRandomCard(optsFromBody(body));
});

/* ---------- 错误处理 ---------- */

app.setErrorHandler((err, _req, reply) => {
  const status = (err as { statusCode?: number }).statusCode ?? 500;
  const message = err instanceof Error ? err.message : String(err);
  if (status >= 500) app.log.error(err);
  reply.code(status).send({ error: message });
});

const port = config.port;
await app.listen({ port, host: "0.0.0.0" });
console.log(`🖼️  色彩诗卡 API 已启动: http://localhost:${port}`);
