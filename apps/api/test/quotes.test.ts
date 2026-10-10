import { test } from "node:test";
import assert from "node:assert/strict";
import { QUOTES, pickQuote } from "../src/data/quotes.ts";

test("名句库数量充足且字段完整", () => {
  assert.ok(QUOTES.length >= 50);
  for (const q of QUOTES) {
    assert.ok(q.text.length > 0, "id " + q.id + " 缺少 text");
    assert.ok(q.author.length > 0, "id " + q.id + " 缺少 author");
    assert.ok(q.themes.length > 0, "id " + q.id + " 缺少 themes");
    assert.ok(q.moods.length > 0, "id " + q.id + " 缺少 moods");
    assert.ok(q.brightness.length > 0, "id " + q.id + " 缺少 brightness");
  }
});

test("pickQuote 优先返回情绪匹配的句子", () => {
  const q = pickQuote({ mood: "warm", brightness: "light" }, new Set(), 42);
  assert.ok(q.moods.includes("warm") || q.moods.includes("neutral"));
});

test("pickQuote 会排除指定 id", () => {
  const excluded = QUOTES[0]!.id;
  for (let i = 0; i < 30; i++) {
    const q = pickQuote({ mood: "neutral", brightness: "balanced" }, new Set([excluded]), i);
    assert.notEqual(q.id, excluded);
  }
});

test("换句有随机性（不同 seed 可能返回不同句子）", () => {
  const seen = new Set<number>();
  for (let i = 0; i < 40; i++) {
    seen.add(pickQuote({ mood: "neutral", brightness: "balanced" }, new Set(), i).id);
  }
  assert.ok(seen.size >= 2, "不同 seed 应产生至少两种结果");
});
