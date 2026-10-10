import sharp from "sharp";

export type AbstractStyle = "aurora" | "mondrian" | "gradients" | "flow" | "oil" | "vivid";
export const ABSTRACT_STYLES: AbstractStyle[] = ["aurora", "mondrian", "gradients", "flow", "oil", "vivid"];

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

/* ---------------- HSL 工具（用于油画 / 绚烂风格的色彩扩展） ---------------- */

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

/* ---------------- 各风格 ---------------- */

function aurora(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = c.reduce((a, b) => (a < b ? a : b), c[0]!);
  const bg2 = mix(bg, "#0b0b14", 0.6);
  const ribbons = c.slice(0, Math.min(5, c.length));
  let paths = "";
  ribbons.forEach((color, i) => {
    const y0 = 150 + i * 190 + rand() * 60;
    const amp = 90 + rand() * 120;
    const ph = rand() * Math.PI * 2;
    let d = `M -80 ${y0}`;
    for (let x = -80; x <= SIZE + 80; x += 160) {
      const y = y0 + Math.sin((x / SIZE) * Math.PI * 3 + ph + i) * amp;
      d += ` L ${x} ${y.toFixed(1)}`;
    }
    paths += `<path d="${d}" fill="none" stroke="${color}" stroke-width="${90 - i * 8}" stroke-linecap="round" opacity="${0.55 + i * 0.06}" filter="url(#soft)"/>`;
  });
  let dots = "";
  for (let i = 0; i < 26; i++) {
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const r = 2 + rand() * 8;
    const color = c[Math.floor(rand() * c.length)]!;
    dots += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(1)}" fill="${color}" opacity="${0.35 + rand() * 0.4}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg2}"/><stop offset="1" stop-color="${bg}"/>
    </linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="38"/></filter>
  </defs>
  <rect width="${SIZE}" height="${SIZE}" fill="url(#bg)"/>
  ${paths}${dots}
</svg>`;
}

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
  for (let i = 0; i < 40; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    dots += `<circle cx="${(rand() * SIZE).toFixed(0)}" cy="${(rand() * SIZE).toFixed(0)}" r="${(1 + rand() * 4).toFixed(1)}" fill="${color}" opacity="${0.2 + rand() * 0.4}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs><filter id="soft"><feGaussianBlur stdDeviation="90"/></filter></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${circles}${dots}
</svg>`;
}

function flow(colors: string[], rand: () => number): string {
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

/** 油画质感：大量随机椭圆笔触 + 明暗变体，营造厚涂效果 */
function oil(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = mix(c[0]!, "#141210", 0.55);
  let strokes = "";
  for (let i = 0; i < 46; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const { h, s, l } = hexToHsl(color);
    const variant = hslToHex(h, s, Math.max(8, Math.min(92, l + (rand() * 40 - 20))));
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const rx = 24 + rand() * 110;
    const ry = 16 + rand() * 60;
    const rot = rand() * 360;
    strokes += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="${variant}" opacity="${0.28 + rand() * 0.35}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }
  for (let i = 0; i < 30; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    const { h, s, l } = hexToHsl(color);
    const variant = hslToHex(h, s, Math.max(20, Math.min(95, l + 12 + rand() * 18)));
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const rx = 10 + rand() * 40;
    const ry = 6 + rand() * 22;
    const rot = rand() * 360;
    strokes += `<ellipse cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="${variant}" opacity="${0.35 + rand() * 0.3}" transform="rotate(${rot.toFixed(0)} ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${strokes}
</svg>`;
}

/** 绚烂霓虹：高饱和色相扩展 + 彩色光晕与星形光斑 */
function vivid(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const expanded: string[] = [...c];
  for (const col of c) {
    const { h, s, l } = hexToHsl(col);
    expanded.push(hslToHex(h + 45, Math.min(100, s + 18), Math.max(30, Math.min(70, l))));
    expanded.push(hslToHex(h + 90, Math.min(100, s + 25), Math.max(28, Math.min(72, l))));
    expanded.push(hslToHex(h + 160, 90, 55));
  }
  const bg = mix(c[c.length - 1]!, "#0a0a14", 0.35);
  let blobs = "";
  const n = Math.min(10, expanded.length);
  for (let i = 0; i < n; i++) {
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const r = 220 + rand() * 420;
    const color = expanded[Math.floor(rand() * expanded.length)]!;
    blobs += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}" opacity="${0.4 + rand() * 0.35}" filter="url(#soft)"/>`;
  }
  let sparkles = "";
  for (let i = 0; i < 50; i++) {
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const s = 4 + rand() * 16;
    const color = expanded[Math.floor(rand() * expanded.length)]!;
    sparkles += `<rect x="${(cx - s / 2).toFixed(0)}" y="${(cy - s / 2).toFixed(0)}" width="${s.toFixed(0)}" height="${s.toFixed(0)}" fill="${color}" opacity="${0.5 + rand() * 0.4}" transform="rotate(45 ${cx.toFixed(0)} ${cy.toFixed(0)})"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs><filter id="soft"><feGaussianBlur stdDeviation="70"/></filter></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
  ${blobs}${sparkles}
</svg>`;
}

/* ---------------- 对外接口 ---------------- */

const GENERATORS: Record<AbstractStyle, (c: string[], r: () => number) => string> = {
  aurora, mondrian, gradients, flow, oil, vivid,
};

export function generateAbstractSvg(colors: string[], style: AbstractStyle = "aurora", seed = Date.now()): string {
  const rand = mulberry32(seed >>> 0);
  return GENERATORS[style](colors, rand);
}

export async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export const ABSTRACT_STYLE_LABELS: Record<AbstractStyle, string> = {
  aurora: "极光幻梦",
  mondrian: "蒙德里安",
  gradients: "柔光渐变",
  flow: "流体涟漪",
  oil: "油画质感",
  vivid: "绚烂霓虹",
};
