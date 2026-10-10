import type { AbstractImageResult, AbstractStyle, Brightness, GenerateResult, Meta, Mood, Palette, Quote } from "./types";

async function postForm<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "请求失败（" + res.status + "）");
  return json;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(json.error ?? "请求失败（" + res.status + "）");
  return json;
}

export async function fetchMeta(): Promise<Meta> {
  const res = await fetch("/api/meta");
  if (!res.ok) throw new Error("无法获取配置");
  return (await res.json()) as Meta;
}

export async function fetchPalette(file: File): Promise<Palette> {
  const form = new FormData();
  form.append("image", file);
  const data = await postForm<{ palette: Palette }>("/api/palette", form);
  return data.palette;
}

export interface GenerateOptions {
  style?: string;
  seed?: number;
}

export async function generate(file: File, opts: GenerateOptions): Promise<GenerateResult> {
  const form = new FormData();
  form.append("image", file);
  if (opts.style) form.append("style", opts.style);
  if (opts.seed !== undefined) form.append("seed", String(opts.seed));
  return postForm<GenerateResult>("/api/generate", form);
}

export async function switchQuote(mood: Mood, brightness: Brightness, excludeIds: number[] = []): Promise<Quote> {
  const data = await postJson<{ quote: Quote }>("/api/quote", { mood, brightness, excludeIds });
  return data.quote;
}

export async function switchAbstract(colors: string[], style: AbstractStyle, seed: number): Promise<AbstractImageResult> {
  return postJson<AbstractImageResult>("/api/abstract", { colors, style, seed });
}

export async function randomCard(opts: GenerateOptions = {}): Promise<GenerateResult> {
  return postJson<GenerateResult>("/api/random-card", opts);
}

export async function textCard(text: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
  return postJson<GenerateResult>("/api/text-card", { text, ...opts });
}
