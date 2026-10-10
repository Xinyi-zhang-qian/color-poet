import type { AnimalResult, Palette, Quote } from "../types";

export interface PosterInput {
  palette: Palette;
  abstractSvg: string;
  animal: AnimalResult;
  quote: Quote;
}

const W = 1080;
const H = 1440;

export function svgToDataUri(svg: string): string {
  const bytes = new TextEncoder().encode(svg);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return "data:image/svg+xml;base64," + btoa(bin);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("图片加载失败"));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line.length > 0) lines.push(line);
  return lines;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function composePoster(input: PosterInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持 Canvas");

  // 1. 抽象背景
  const bg = await loadImage(svgToDataUri(input.abstractSvg));
  const scale = Math.max(W / bg.width, H / bg.height);
  const dw = bg.width * scale;
  const dh = bg.height * scale;
  ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // 2. 底部渐变遮罩
  const grad = ctx.createLinearGradient(0, H * 0.52, 0, H);
  grad.addColorStop(0, "rgba(12,10,18,0)");
  grad.addColorStop(1, "rgba(12,10,18,0.78)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 3. 动物（圆形，居中上方）
  const ring = 500;
  const cy = H * 0.32;
  if (input.animal.imageDataUri) {
    const img = await loadImage(input.animal.imageDataUri);
    ctx.save();
    ctx.beginPath();
    ctx.arc(W / 2, cy, ring / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    const s = Math.max(ring / img.width, ring / img.height);
    const iw = img.width * s;
    const ih = img.height * s;
    ctx.drawImage(img, (W - iw) / 2, cy - ih / 2, iw, ih);
    ctx.restore();
    ctx.beginPath();
    ctx.arc(W / 2, cy, ring / 2, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.stroke();
  } else {
    // 无图占位：色块圆 + 动物名
    ctx.beginPath();
    ctx.arc(W / 2, cy, ring / 2, 0, Math.PI * 2);
    ctx.fillStyle = input.palette.colors[0]?.hex ?? "#555";
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 64px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(input.animal.name, W / 2, cy);
  }

  // 4. 诗句
  ctx.textAlign = "center";
  ctx.fillStyle = "#f7f2e8";
  ctx.font = 'bold 54px "Songti SC", "STSong", "Noto Serif CJK SC", Georgia, serif';
  const lines = wrapText(ctx, "「" + input.quote.text + "」", W - 220);
  let textY = H * 0.62;
  lines.forEach((line) => {
    ctx.fillText(line, W / 2, textY);
    textY += 78;
  });

  // 5. 作者 / 出处
  ctx.font = '30px "Songti SC", "STSong", serif';
  ctx.fillStyle = "rgba(247,242,232,0.75)";
  const attribution = "—— " + input.quote.author + (input.quote.source ? "《" + input.quote.source + "》" : "");
  ctx.fillText(attribution, W / 2, textY + 40);

  // 6. 色卡
  const chips = input.palette.colors.slice(0, 5);
  const chipSize = 84;
  const gap = 20;
  const total = chips.length * chipSize + (chips.length - 1) * gap;
  let x = (W - total) / 2;
  const chipY = H - 190;
  chips.forEach((c) => {
    ctx.fillStyle = c.hex;
    roundedRect(ctx, x, chipY, chipSize, chipSize, 18);
    ctx.fill();
    x += chipSize + gap;
  });

  // 7. 品牌
  ctx.font = '26px "Songti SC", serif';
  ctx.fillStyle = "rgba(247,242,232,0.55)";
  ctx.fillText("色彩诗卡 · ColorPoet", W / 2, H - 56);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("生成图片失败"));
    }, "image/png");
  });
}
