import type { AbstractImageResult, Palette, Quote } from "../types";

export interface PosterInput {
  palette: Palette;
  abstractImage: AbstractImageResult;
  quote: Quote;
}

const W = 1080;
const H = 1440;

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

export async function composePoster(input: PosterInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("当前浏览器不支持 Canvas");

  // 1. 抽象画背景
  const bg = await loadImage(input.abstractImage.dataUri);
  const scale = Math.max(W / bg.width, H / bg.height);
  const dw = bg.width * scale;
  const dh = bg.height * scale;
  ctx.drawImage(bg, (W - dw) / 2, (H - dh) / 2, dw, dh);

  // 2. 底部柔和遮罩
  const grad = ctx.createLinearGradient(0, H * 0.4, 0, H);
  grad.addColorStop(0, "rgba(12,12,14,0)");
  grad.addColorStop(0.55, "rgba(12,12,14,0.3)");
  grad.addColorStop(1, "rgba(12,12,14,0.72)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // 3. 左上 LOGO
  ctx.textAlign = "left";
  ctx.font = "600 40px Songti SC, STSong, serif";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillText("生命之流彩", 70, 90);
  ctx.font = "20px Georgia, Didot, serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillText("FLOW OF LIFE", 70, 124);

  // 4. 诗句（中间居中）
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#fdfdfd";
  const fontSize = input.quote.text.length > 26 ? 42 : input.quote.text.length > 16 ? 50 : 58;
  ctx.font = "600 " + fontSize + "px Songti SC, STSong, Noto Serif CJK SC, Georgia, serif";
  const lines = wrapText(ctx, "「" + input.quote.text + "」", W - 220);
  const lineH = fontSize * 1.42;
  let textY = H * 0.5 - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line) => {
    ctx.fillText(line, W / 2, textY);
    textY += lineH;
  });

  // 5. 作者 / 出处
  ctx.font = "30px Songti SC, STSong, serif";
  ctx.fillStyle = "rgba(255,255,255,0.78)";
  const attribution = "—— " + input.quote.author + (input.quote.source ? "《" + input.quote.source + "》" : "");
  ctx.fillText(attribution, W / 2, textY + 30);

  // 6. 色卡（底部左）+ 英文（底部右）
  const chips = input.palette.colors.slice(0, 5);
  let x = 70;
  const dotY = H - 108;
  chips.forEach((c) => {
    ctx.beginPath();
    ctx.arc(x + 12, dotY, 12, 0, Math.PI * 2);
    ctx.fillStyle = c.hex;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.stroke();
    x += 32;
  });

  ctx.textAlign = "right";
  ctx.font = "16px Georgia, Didot, serif";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("ALL IS AS IT IS", W - 70, H - 118);
  ctx.fillText("ABUNDANCE EVERYWHERE", W - 70, H - 92);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("生成图片失败"));
    }, "image/png");
  });
}
