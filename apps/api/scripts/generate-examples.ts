import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const W = 800;
const H = 600;
const dir = fileURLToPath(new URL("../../web/public/examples/", import.meta.url));
mkdirSync(dir, { recursive: true });

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
type Fn = (x: number, y: number) => [number, number, number];

async function gen(name: string, fn: Fn) {
  const buf = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 3;
      const [r, g, b] = fn(x / W, y / H);
      buf[i] = clamp(r);
      buf[i + 1] = clamp(g);
      buf[i + 2] = clamp(b);
    }
  }
  await sharp(buf, { raw: { width: W, height: H, channels: 3 } })
    .jpeg({ quality: 88 })
    .toFile(dir + name + ".jpg");
  console.log("✓", name + ".jpg");
}

async function main() {
  await gen("sunset", (x, y) => {
    const glow = Math.max(0, 1 - Math.hypot(x - 0.5, y - 0.62) * 1.9);
    const cloud = 0.5 + 0.5 * Math.sin(x * 9 + y * 4);
    return [55 + 165 * y + 150 * glow * cloud, 25 + 95 * y + 105 * glow, 55 + 55 * (1 - y) + 30 * glow];
  });
  await gen("ocean", (x, y) => {
    const wave = 0.5 + 0.5 * Math.sin(x * 22 + y * 14);
    return [18 + 70 * y + 26 * wave, 55 + 115 * y + 34 * wave, 110 + 125 * y + 40 * wave];
  });
  await gen("forest", (x, y) => {
    const leaf = 0.5 + 0.5 * Math.sin(x * 15 + y * 7);
    const sun = Math.max(0, 1 - Math.hypot(x - 0.72, y - 0.18) * 3);
    return [28 + 55 * y + 60 * sun, 60 + 130 * y + 40 * leaf + 30 * sun, 28 + 55 * y + 40 * sun];
  });
  await gen("aurora", (x, y) => {
    const band = Math.exp(-Math.pow((y - 0.34) / 0.13, 2)) * (0.55 + 0.45 * Math.sin(x * 11));
    const band2 = Math.exp(-Math.pow((y - 0.5) / 0.1, 2)) * (0.4 + 0.6 * Math.sin(x * 7 + 2));
    return [14 + 70 * band + 40 * band2, 18 + 170 * band + 90 * band2, 44 + 90 * band + 60 * band2];
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
