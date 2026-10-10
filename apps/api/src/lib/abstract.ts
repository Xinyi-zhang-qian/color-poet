import sharp from "sharp";

export type AbstractStyle = "aurora" | "mondrian" | "gradients" | "flow";
export const ABSTRACT_STYLES: AbstractStyle[] = ["aurora", "mondrian", "gradients", "flow"];

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

function paletteOrDefault(colors: string[]): string[] {
  const defaults = ["#2b2d42", "#8d99ae", "#ef233c", "#edf2f4"];
  return colors.length >= 2 ? colors : defaults;
}

/* ---------------- 各风格 ---------------- */

function aurora(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const bg = c.reduce((a, b) => (a < b ? a : b), c[0]!); // 取较暗色做背景（简化为最靠前的深色）
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
  // 点缀光点
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
  // 递归分割
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
  // 顶部叠加细微纹理圆点
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

/* ---------------- 对外接口 ---------------- */

const GENERATORS: Record<AbstractStyle, (c: string[], r: () => number) => string> = {
  aurora, mondrian, gradients, flow,
};

export function generateAbstractSvg(colors: string[], style: AbstractStyle = "aurora", seed = Date.now()): string {
  const rand = mulberry32(seed >>> 0);
  return GENERATORS[style](colors, rand);
}

export async function svgToPng(svg: string): Promise<Buffer> {
  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** 判断 SVG 各风格是否依赖模糊滤镜（用于前端渲染提示） */
export const ABSTRACT_STYLE_LABELS: Record<AbstractStyle, string> = {
  aurora: "极光幻梦",
  mondrian: "蒙德里安",
  gradients: "柔光渐变",
  flow: "流体涟漪",
};
