import sharp from "sharp";

export type AbstractStyle = "fluid" | "gradient" | "watercolor" | "aurora";
export const ABSTRACT_STYLES: AbstractStyle[] = ["fluid", "gradient", "watercolor", "aurora"];

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

function paletteOrDefault(colors: string[]): string[] {
  const defaults = ["#2b2d42", "#8d99ae", "#ef233c", "#edf2f4"];
  return colors.length >= 2 ? colors : defaults;
}

/* ---------------- 四种风格（SVG 兜底） ---------------- */

/** 流体：层层波浪色带 */
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

/** 渐变：多色平滑过渡 + 柔和光晕 */
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

/** 水彩：白纸底 + 柔和晕染色块，通透轻盈 */
function watercolor(colors: string[], rand: () => number): string {
  const c = paletteOrDefault(colors);
  const paper = "#f6f2ea";
  let blobs = "";
  const n = Math.min(8, c.length + 2);
  for (let i = 0; i < n; i++) {
    const color = c[i % c.length]!;
    const cx = rand() * SIZE;
    const cy = rand() * SIZE;
    const r = 150 + rand() * 380;
    blobs += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${r.toFixed(0)}" fill="${color}" opacity="${0.16 + rand() * 0.2}" filter="url(#soft)"/>`;
  }
  let spots = "";
  for (let i = 0; i < 22; i++) {
    const color = c[Math.floor(rand() * c.length)]!;
    spots += `<circle cx="${(rand() * SIZE).toFixed(0)}" cy="${(rand() * SIZE).toFixed(0)}" r="${(20 + rand() * 90).toFixed(0)}" fill="${color}" opacity="${0.14 + rand() * 0.2}" filter="url(#soft)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
  <defs><filter id="soft"><feGaussianBlur stdDeviation="70"/></filter></defs>
  <rect width="${SIZE}" height="${SIZE}" fill="${paper}"/>
  ${blobs}${spots}
</svg>`;
}

/** 极光：夜空底 + 垂直流动光幕 + 星光 */
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

/* ---------------- 对外接口 ---------------- */

const GENERATORS: Record<AbstractStyle, (c: string[], r: () => number) => string> = {
  fluid, gradient, watercolor, aurora,
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
  watercolor: "水彩",
  aurora: "极光",
};
