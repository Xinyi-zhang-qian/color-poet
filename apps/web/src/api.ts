import type { AbstractStyle, AnimalResult, Brightness, GenerateResult, Meta, Mood, Palette, Quote } from "./types";

async function postForm<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(json.error ?? `请求失败（${res.status}）`);
  }
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
  animal?: string;
  style?: string;
  seed?: number;
}

export async function generate(file: File, opts: GenerateOptions): Promise<GenerateResult> {
  const form = new FormData();
  form.append("image", file);
  if (opts.animal) form.append("animal", opts.animal);
  if (opts.style) form.append("style", opts.style);
  if (opts.seed !== undefined) form.append("seed", String(opts.seed));
  return postForm<GenerateResult>("/api/generate", form);
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

export async function switchQuote(mood: Mood, brightness: Brightness, excludeIds: number[] = []): Promise<Quote> {
  const data = await postJson<{ quote: Quote }>("/api/quote", { mood, brightness, excludeIds });
  return data.quote;
}

export async function switchAbstract(colors: string[], style: AbstractStyle, seed: number): Promise<string> {
  const data = await postJson<{ svg: string }>("/api/abstract", { colors, style, seed });
  return data.svg;
}

export async function switchAnimal(file: File, opts: GenerateOptions): Promise<{ palette: Palette; animal: AnimalResult }> {
  const form = new FormData();
  form.append("image", file);
  if (opts.animal) form.append("animal", opts.animal);
  if (opts.seed !== undefined) form.append("seed", String(opts.seed));
  return postForm<{ palette: Palette; animal: AnimalResult }>("/api/animal", form);
}
