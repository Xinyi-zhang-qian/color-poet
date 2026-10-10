import { test } from "node:test";
import assert from "node:assert/strict";
import { generateAbstractSvg, svgToPng, ABSTRACT_STYLES } from "../src/lib/abstract.ts";

const colors = ["#e63946", "#f1faee", "#a8dadc", "#1d3557", "#457b9d"];

test("四种风格都生成合法 SVG", () => {
  for (const s of ABSTRACT_STYLES) {
    const svg = generateAbstractSvg(colors, s, 42);
    assert.ok(svg.startsWith("<svg"), s + " 应以 <svg 开头");
    assert.ok(svg.includes("</svg>"), s + " 应正确闭合");
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'), s + " 应有 SVG 命名空间");
  }
});

test("相同 seed 结果可复现", () => {
  const a = generateAbstractSvg(colors, "aurora", 123);
  const b = generateAbstractSvg(colors, "aurora", 123);
  assert.equal(a, b);
});

test("SVG 可转换为 PNG", async () => {
  const svg = generateAbstractSvg(colors, "mondrian", 42);
  const png = await svgToPng(svg);
  assert.ok(png.length > 1000, "PNG 应有合理体积");
});
