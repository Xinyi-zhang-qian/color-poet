import sharp from "sharp";

/** RGB 颜色 */
export interface RGB { r: number; g: number; b: number; }
/** CIE Lab 颜色（贴合人眼感知） */
export interface LAB { l: number; a: number; b: number; }

export interface PaletteColor {
  hex: string;
  rgb: [number, number, number];
  /** 该颜色在画面中的占比 0~1 */
  ratio: number;
  /** 该颜色上适合的前景色（黑或白） */
  textColor: "#0f0f0f" | "#fafafa";
}

export type Mood = "warm" | "cool" | "neutral";
export type Brightness = "light" | "dark" | "balanced";

export interface Palette {
  colors: PaletteColor[];
  mood: Mood;
  brightness: Brightness;
  /** 占比加权的平均 Lab */
  average: LAB;
}

/* ---------------- 色彩空间转换 ---------------- */

function srgbLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearSrgb(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToLab(r: number, g: number, b: number): LAB {
  const rl = srgbLinear(r / 255);
  const gl = srgbLinear(g / 255);
  const bl = srgbLinear(b / 255);
  // sRGB(D65) -> XYZ
  const x = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;
  // XYZ -> Lab（D65 白点）
  const fx = f(x / 0.95047);
  const fy = f(y / 1.0);
  const fz = f(z / 1.08883);
  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

function labToRgb(l: number, a: number, b: number): RGB {
  const fy = (l + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const x = 0.95047 * finv(fx);
  const y = 1.0 * finv(fy);
  const z = 1.08883 * finv(fz);
  const rl = x * 3.2404542 - y * 1.5371385 - z * 0.4985314;
  const gl = -x * 0.969266 + y * 1.8760108 + z * 0.041556;
  const bl = x * 0.0556434 - y * 0.2040259 + z * 1.0572252;
  const clamp = (v: number) => Math.round(Math.min(255, Math.max(0, linearSrgb(v)) * 255));
  return { r: clamp(rl), g: clamp(gl), b: clamp(bl) };
}

function f(t: number): number {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
}
function finv(t: number): number {
  return t > 0.206893 ? t * t * t : (t - 16 / 116) / 7.787;
}

function labDistance(x: LAB, y: LAB): number {
  const dl = x.l - y.l;
  const da = x.a - y.a;
  const db = x.b - y.b;
  return dl * dl + da * da + db * db;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/* ---------------- K-means（k-means++ 初始化） ---------------- */

function kmeans(points: LAB[], k: number, iters = 24): { centers: LAB[]; assignments: number[] } {
  const n = points.length;
  if (n === 0) return { centers: [], assignments: [] };

  // k-means++ 初始化
  const centers: LAB[] = [points[Math.floor(Math.random() * n)]!];
  while (centers.length < k) {
    const d2 = points.map((p) => Math.min(...centers.map((c) => labDistance(p, c))));
    const sum = d2.reduce((s, v) => s + v, 0) || 1;
    let r = Math.random() * sum;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      r -= d2[i]!;
      if (r <= 0) { idx = i; break; }
    }
    centers.push(points[idx]!);
  }

  let assignments = new Array<number>(n).fill(0);
  for (let iter = 0; iter < iters; iter++) {
    // 分配
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = labDistance(points[i]!, centers[c]!);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (assignments[i] !== best) { assignments[i] = best; changed = true; }
    }
    // 更新中心
    const sums = Array.from({ length: k }, () => ({ l: 0, a: 0, b: 0, count: 0 }));
    for (let i = 0; i < n; i++) {
      const c = assignments[i]!;
      sums[c]!.l += points[i]!.l;
      sums[c]!.a += points[i]!.a;
      sums[c]!.b += points[i]!.b;
      sums[c]!.count++;
    }
    for (let c = 0; c < k; c++) {
      const s = sums[c]!;
      if (s.count > 0) centers[c] = { l: s.l / s.count, a: s.a / s.count, b: s.b / s.count };
    }
    if (!changed) break;
  }

  return { centers, assignments };
}

/* ---------------- 主提取逻辑 ---------------- */

/** 颜色是否过于接近灰/黑/白，不适合作为搭配主色 */
function isDull(lab: LAB): boolean {
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  return lab.l < 10 || lab.l > 96 || chroma < 6;
}

export async function extractPalette(buffer: Buffer, targetColors = 6): Promise<Palette> {
  // 缩小采样，加速且降低噪声
  const { data, info } = await sharp(buffer)
    .rotate() // 依 EXIF 自动摆正
    .resize(160, 160, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels: LAB[] = [];
  for (let i = 0; i < data.length; i += info.channels) {
    pixels.push(rgbToLab(data[i]!, data[i + 1]!, data[i + 2]!));
  }
  if (pixels.length === 0) throw new Error("图片没有可读取的像素");

  // 先聚类出更多中心，再过滤
  const k = Math.min(targetColors + 3, 9);
  const { centers, assignments } = kmeans(pixels, k);

  const counts = new Array<number>(k).fill(0);
  for (const a of assignments) counts[a]!++;

  const ranked = centers
    .map((lab, i) => ({ lab, count: counts[i] ?? 0 }))
    .filter((c) => c.count > 0 && !isDull(c.lab))
    .sort((x, y) => y.count - x.count)
    .slice(0, targetColors);

  // 过滤后数量不足时放宽条件
  let final = ranked;
  if (final.length < 3) {
    final = centers
      .map((lab, i) => ({ lab, count: counts[i] ?? 0 }))
      .filter((c) => c.count > 0 && c.lab.l >= 6 && c.lab.l <= 97)
      .sort((x, y) => y.count - x.count)
      .slice(0, targetColors);
  }

  const total = final.reduce((s, c) => s + c.count, 0) || 1;
  const colors: PaletteColor[] = final.map((c) => {
    const rgb = labToRgb(c.lab.l, c.lab.a, c.lab.b);
    return {
      hex: rgbToHex(rgb.r, rgb.g, rgb.b),
      rgb: [rgb.r, rgb.g, rgb.b],
      ratio: c.count / total,
      textColor: c.lab.l > 55 ? "#0f0f0f" : "#fafafa",
    };
  });

  // 加权平均 Lab，判断情绪
  const avg = colors.reduce(
    (acc, c, i) => ({
      l: acc.l + c.ratio * final[i]!.lab.l,
      a: acc.a + c.ratio * final[i]!.lab.a,
      b: acc.b + c.ratio * final[i]!.lab.b,
    }),
    { l: 0, a: 0, b: 0 },
  );

  // 色温：利用 a（红绿轴）与 b（黄蓝轴）
  const warmth = avg.a * 0.6 + avg.b * 0.4;
  const mood: Mood = Math.abs(warmth) < 8 ? "neutral" : warmth > 0 ? "warm" : "cool";
  const brightness: Brightness = avg.l < 40 ? "dark" : avg.l > 65 ? "light" : "balanced";

  return { colors, mood, brightness, average: avg };
}
