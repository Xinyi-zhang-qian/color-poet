import sharp from "sharp";

export type AbstractStyle = "fluid" | "gradient" | "graffiti" | "oil";
export const ABSTRACT_STYLES: AbstractStyle[] = ["fluid", "gradient", "graffiti", "oil"];

const SIZE = 1200;

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function mix(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const v = a.map((x, i) => Math.round(x + (b[i]! - x) * t));
  return "#" + v.map((x) => x.toString(16).padStart(2, "0")).join("");
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return "#" + toHex(rgb[0]) + toHex(rgb[1]) + toHex(rgb[2]);
}

function paletteOrDefault(colors: string[]): string[] {
  const defaults = ["#2b2d42", "#8d99ae", "#ef233c", "#edf2f4"];
  return colors.length >= 2 ? colors : defaults;
}

/* ---------------- 四种风格 ---------------- */

/** 流体：层层波浪色带，流动的液态感 */
function fluid(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = mix(c[0]!, "#0d0d12", 0.75);
  let waves = "";
  const n = Math.min(6, c.length);
  for (let i = 0; i < n; i++) {
    const color = c[i]!;
    const base = 120 + i * 170 + rand() * 60;
    const amp = 40 + rand() * 90;
    const freq = 1.2 + rand() * 1.6;
    const ph = rand() * Math.PI * 2;
    let d = `M -60 ${base}`;
    for (let x = -60; x <= SIZE + 60; x += 40) {
      const y = base + Math.sin((x / SIZE) * Math.PI * freq + ph) * amp;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    d += ` L ${SIZE + 60} ${SIZE + 60} L -60 ${SIZE + 60} Z`;
    waves += `<path d="${d}" fill="${color}" opacity="${0.5 + i * 0.05}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${waves}
</svg>`;
}

/** 渐变：多色平滑过渡 + 柔和光晕，通透轻盈 */
function gradient(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const stops = c.map((col, i) => `<stop offset="${((i / (c.length - 1)) * 100).toFixed(0)}%" stop-color="${col}"/>`).join("");
  let glows = "";
  for (let i = 0; i < 3; i++) {
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const r = 320 + rand() * 420;
    glows += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${c[i % c.length]}" opacity="0.22" filter="url(#soft)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="80"/></filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#g)"/>
  ${glows}
</svg>`;
}

/** 涂鸦：高饱和喷漆笔触 + 滴落 + 星点，街头自由感 */
function graffiti(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = mix(c[0]!, "#0a0a12", 0.45);
  let s = "";
  // 喷漆粗笔触（弯曲粗线）
  for (let i = 0; i < 14; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const x1 = rand() * SIZE;
    const y1 = rand() * SIZE;
    const x2 = x1 + (rand() - 0.5) * 500;
    const y2 = y1 + (rand() - 0.5) * 500;
    const cx = (x1 + x2) / 2 + (rand() - 0.5) * 220;
    const cy = (y1 + y2) / 2 + (rand() - 0.5) * 220;
    const w = 20 + rand() * 34;
    s += `<path d="M ${x1.toFixed(0)} ${y1.toFixed(0)} Q ${cx.toFixed(0)} ${cy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="${color}" stroke-width="${w.toFixed(0)}" stroke-linecap="round" fill="none" opacity="${0.5 + rand() * 0.3}"/>`;
  }
  // 滴落
  for (let i = 0; i < 12; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const x = rand() * SIZE;
    const y = rand() * SIZE * 0.5;
    const len = 40 + rand() * 160;
    s += `<path d="M ${x.toFixed(0)} ${y.toFixed(0)} L ${x.toFixed(0)} ${(y + len).toFixed(0)}" stroke="${color}" stroke-width="${(4 + rand() * 8).toFixed(0)}" stroke-linecap="round" opacity="0.55"/>`;
  }
  // 星形与圆点
  for (let i = 0; i < 40; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    if (rand() < 0.4) {
      const r = 3 + rand() * 12;
      s += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(1)}" fill="${color}" opacity="${0.4 + rand() * 0.5}"/>`;
    } else {
      const d = 6 + rand() * 22;
      s += `<rect x="${(cx - d / 2).toFixed(0)}" y="${(cy - d / 2).toFixed(0)}" width="${d.toFixed(0)}" height="${d.toFixed(0)}" fill="${color}" opacity="${0.4 + rand() * 0.5}" transform="rotate(45 ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${s}
</svg>`;
}

/** 油画：漩涡厚涂笔触 + 散落短笔触，梵高式表现力 */
function oil(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = mix(c[0]!, "#181410", 0.5);
  let s = "";
  // 漩涡笔触
  for (let i = 0; i < 6; i++) {
    const cx = SIZE * (0.15 + rand() * 0.7);
    const cy = SIZE * (0.15 + rand() * 0.7);
    const color = c[Math.floor(rand() * c.length)]!;
    const turns = 2 + rand() * 2.5;
    const pts = 60;
    let d = "";
    for (let p = 0; p <= pts; p++) {
      const t = p / pts;
      const ang = t * Math.PI * 2 * turns;
      const rad = 8 + t * (90 + rand() * 90);
      const x = cx + Math.cos(ang) * rad;
      const y = cy + Math.sin(ang) * rad;
      d += (p === 0 ? "M" : "L") + x.toFixed(0) + " " + y.toFixed(0);
    }
    s += `<path d="${d}" stroke="${color}" stroke-width="${(16 + rand() * 14).toFixed(0)}" stroke-linecap="round" fill="none" opacity="0.55"/>`;
  }
  // 散落短笔触（明暗变体）
  for (let i = 0; i < 70; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const { h, s: sat, l } = hexToHsl(color);
    const variant = hslToHex(h, sat, Math.max(10, Math.min(90, l + rand() * 24 - 12)));
    const x1 = rand() * SIZE;
    const y1 = rand() * SIZE;
    const ang = rand() * Math.PI * 2;
    const len = 18 + rand() * 52;
    const x2 = x1 + Math.cos(ang) * len;
    const y2 = y1 + Math.sin(ang) * len;
    s += `<path d="M ${x1.toFixed(0)} ${y1.toFixed(0)} L ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="${variant}" stroke-width="${(8 + rand() * 14).toFixed(0)}" stroke-linecap="round" opacity="${0.45 + rand() * 0.3}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${s}
</svg>`;
}

/* ---------------- 对外接口 ---------------- */

const GENERATORS: Record<AbstractStyle, (c: string[], r: () => number) => string> = {
  fluid, gradient, graffiti, oil,
};

export function generateAbstractSvg(colors: string[], style: AbstractStyle = "gradient", seed = Date.now()): string {
  const rand = mulberry32(seed >>> 0);
  return GENERATORS[style](colors, rand);
}

export async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export const ABSTRACT_STYLE_LABELS: Record<AbstractStyle, string> = {
  fluid: "流体",
  gradient: "渐变",
  graffiti: "涂鸦",
  oil: "油画",
};
