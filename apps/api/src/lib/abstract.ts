import sharp from "sharp";

export type AbstractStyle = "aurora" | "mondrian" | "gradients" | "oil";
export const ABSTRACT_STYLES: AbstractStyle[] = ["aurora", "mondrian", "gradients", "oil"];

const SIZE = 1200;

/** 可复现的伪随机数生成器 */
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

/* ---------------- HSL 工具 ---------------- */

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

/* ---------------- 四种鲜明风格 ---------------- */

/** 极光：垂直流动的光幕 + 星光，梦幻空灵 */
function aurora(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bgTop = mix(c[0]!, "#080814", 0.55);
  const bgBottom = mix(c[c.length - 1]!, "#10101c", 0.4);
  let beams = "";
  const n = Math.min(5, c.length);
  for (let i = 0; i < n; i++) {
    const color = c[i]!;
    const x0 = SIZE * (0.16 + i * 0.18) + rand() * 46;
    const width = 70 + rand() * 96;
    const amp = 40 + rand() * 80;
    const ph = rand() * Math.PI * 2;
    let d = `M ${x0.toFixed(0)} -80`;
    for (let y = -80; y <= SIZE + 80; y += 90) {
      const x = x0 + Math.sin((y / SIZE) * Math.PI * 2.4 + ph) * amp;
      d += ` L ${x.toFixed(0)} ${y}`;
    }
    beams += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width.toFixed(0)}" stroke-linecap="round" opacity="${0.32 + i * 0.07}" filter="url(#soft)"/>`;
  }
  let stars = "";
  for (let i = 0; i < 44; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    stars += `<circle cx="${(rand() * SIZE).toFixed(0)}" cy="${(rand() * SIZE).toFixed(0)}" r="${(1 + rand() * 3).toFixed(1)}" fill="${color}" opacity="${0.25 + rand() * 0.5}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${bgTop}"/><stop offset="1" stop-color="${bgBottom}"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="46"/></filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  ${beams}${stars}
</svg>`;
}

/** 蒙德里安：几何色块 + 粗黑线，现代主义 */
function mondrian(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const whites = ["#f6f2ea", "#ffffff", "#efe9dd"];
  interface Rect { x: number; y: number; w: number; h: number; }
  const rects: Rect[] = [];
  const stack: Rect[] = [{ x: 0, y: 0, w: SIZE, h: SIZE }];
  let guard = 0;
  while (stack.length > 0 && guard++ < 500) {
    const r = stack.pop()!;
    const tooSmall = r.w < 150 || r.h < 150;
    if (tooSmall || rand() < 0.45) { rects.push(r); continue; }
    const vertical = rand() < 0.5;
    if (vertical) {
      const split = r.x + r.w * (0.25 + rand() * 0.5);
      stack.push({ x: r.x, y: r.y, w: split - r.x, h: r.h });
      stack.push({ x: split, y: r.y, w: r.x + r.w - split, h: r.h });
    } else {
      const split = r.y + r.h * (0.25 + rand() * 0.5);
      stack.push({ x: r.x, y: r.y, w: r.w, h: split - r.y });
      stack.push({ x: r.x, y: split, w: r.w, h: r.y + r.h - split });
    }
  }
  let fills = "";
  rects.forEach((r) => {
    const roll = rand();
    const color = roll < 0.62 ? c[Math.floor(rand() * c.length)]! : whites[Math.floor(rand() * whites.length)]!;
    fills += `<rect x="${r.x.toFixed(0)}" y="${r.y.toFixed(0)}" width="${(r.w - 6).toFixed(0)}" height="${(r.h - 6).toFixed(0)}" fill="${color}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="#101014"/>
  ${fills}
</svg>`;
}

/** 柔光：大面积的柔和光晕叠加，通透梦幻 */
function gradients(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = c[c.length - 1]!;
  let circles = "";
  const n = Math.min(5, c.length);
  for (let i = 0; i < n; i++) {
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const r = 300 + rand() * 500;
    const color = c[i]!;
    circles += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}" opacity="${0.45 + rand() * 0.3}" filter="url(#soft)"/>`;
  }
  let dots = "";
  for (let i = 0; i < 36; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    dots += `<circle cx="${(rand() * SIZE).toFixed(0)}" cy="${(rand() * SIZE).toFixed(0)}" r="${(1 + rand() * 4).toFixed(1)}" fill="${color}" opacity="${0.18 + rand() * 0.4}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs><filter id="soft"><feGaussianBlur stdDeviation="90"/></filter></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${circles}${dots}
</svg>`;
}

/** 油画：弯曲的厚涂笔触 + 明暗层次，模拟画布质感 */
function oil(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = mix(c[0]!, "#161210", 0.55);
  let strokes = "";
  // 底层大笔触
  for (let i = 0; i < 55; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const { h, s, l } = hexToHsl(color);
    const variant = hslToHex(h, s, Math.max(10, Math.min(88, l + rand() * 30 - 15)));
    const x1 = rand() * SIZE;
    const y1 = rand() * SIZE;
    const x2 = x1 + (rand() - 0.5) * 260;
    const y2 = y1 + (rand() - 0.5) * 260;
    const cx = (x1 + x2) / 2 + (rand() - 0.5) * 130;
    const cy = (y1 + y2) / 2 + (rand() - 0.5) * 130;
    const w = 16 + rand() * 34;
    strokes += `<path d="M ${x1.toFixed(0)} ${y1.toFixed(0)} Q ${cx.toFixed(0)} ${cy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="${variant}" stroke-width="${w.toFixed(0)}" stroke-linecap="round" fill="none" opacity="${0.4 + rand() * 0.3}"/>`;
  }
  // 上层高光笔触
  for (let i = 0; i < 35; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const { h, s, l } = hexToHsl(color);
    const variant = hslToHex(h, s, Math.max(28, Math.min(96, l + 20)));
    const x1 = rand() * SIZE;
    const y1 = rand() * SIZE;
    const x2 = x1 + (rand() - 0.5) * 180;
    const y2 = y1 + (rand() - 0.5) * 180;
    const cx = (x1 + x2) / 2 + (rand() - 0.5) * 90;
    const cy = (y1 + y2) / 2 + (rand() - 0.5) * 90;
    const w = 6 + rand() * 14;
    strokes += `<path d="M ${x1.toFixed(0)} ${y1.toFixed(0)} Q ${cx.toFixed(0)} ${cy.toFixed(0)} ${x2.toFixed(0)} ${y2.toFixed(0)}" stroke="${variant}" stroke-width="${w.toFixed(0)}" stroke-linecap="round" fill="none" opacity="${0.45 + rand() * 0.35}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${strokes}
</svg>`;
}

/* ---------------- 对外接口 ---------------- */

const GENERATORS: Record<AbstractStyle, (c: string[], r: () => number) => string> = {
  aurora, mondrian, gradients, oil,
};

export function generateAbstractSvg(colors: string[], style: AbstractStyle = "aurora", seed = Date.now()): string {
  const rand = mulberry32(seed >>> 0);
  return GENERATORS[style](colors, rand);
}

export async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export const ABSTRACT_STYLE_LABELS: Record<AbstractStyle, string> = {
  aurora: "极光",
  mondrian: "蒙德里安",
  gradients: "柔光",
  oil: "油画",
};
