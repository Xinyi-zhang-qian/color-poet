import { test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { extractPalette } from "../src/lib/palette.ts";

async function solid(r: number, g: number, b: number): Promise<Buffer> {
  return sharp({ create: { width: 60, height: 60, channels: 3, background: { r, g, b } } }).png().toBuffer();
}

test("多色图片应提取出多个颜色且包含红色系", async () => {
  const red = await solid(220, 40, 40);
  const blue = await solid(40, 80, 200);
  const green = await solid(60, 180, 90);
  const yellow = await solid(240, 210, 60);
  const img = await sharp({
    create: { width: 120, height: 120, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .composite([
      { input: red, left: 0, top: 0 },
      { input: blue, left: 60, top: 0 },
      { input: green, left: 0, top: 60 },
      { input: yellow, left: 60, top: 60 },
    ])
    .png()
    .toBuffer();

  const palette = await extractPalette(img);
  assert.ok(palette.colors.length >= 3, "应提取至少 3 个颜色，实际 " + palette.colors.length);
  const hasRed = palette.colors.some((c) => c.rgb[0]! > c.rgb[1]! + 30 && c.rgb[0]! > c.rgb[2]! + 30);
  assert.ok(hasRed, "应包含红色系颜色");
});

test("蓝色图片应判定为冷色", async () => {
  const buf = await sharp({
    create: { width: 120, height: 120, channels: 3, background: { r: 40, g: 80, b: 200 } },
  }).png().toBuffer();
  const palette = await extractPalette(buf);
  assert.equal(palette.mood, "cool");
});

test("输出颜色为合法 hex 且占比为 0~1", async () => {
  const buf = await sharp({
    create: { width: 120, height: 120, channels: 3, background: { r: 120, g: 160, b: 90 } },
  }).png().toBuffer();
  const palette = await extractPalette(buf);
  for (const c of palette.colors) {
    assert.match(c.hex, /^#[0-9a-f]{6}$/i);
    assert.ok(c.ratio > 0 && c.ratio <= 1);
  }
});
