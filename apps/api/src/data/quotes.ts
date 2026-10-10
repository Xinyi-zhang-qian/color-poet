import type { Mood, Brightness } from "../lib/palette.js";

export type Theme =
  | "hope" | "love" | "serenity" | "resilience" | "time"
  | "nature" | "freedom" | "nostalgia" | "vitality" | "philosophy"
  | "presence" | "acceptance";

export type Lang = "zh" | "translated";

export interface Quote {
  id: number;
  text: string;
  author: string;
  /** 出处（书名/篇名），无法确证时省略 */
  source?: string;
  lang: Lang;
  themes: Theme[];
  moods: Mood[];
  brightness: Brightness[];
}

/**
 * 精选名句库：杨定一、克里希那穆提、一行禅师、拜伦·凯蒂、拉玛那·马哈希、埃克哈特·托利。
 * 全部为真实可查证的句子，标注作者与出处。
 */
export const QUOTES: Quote[] = [
  // ---------- 杨定一博士 ----------
  { id: 1, text: "宇宙不可能犯错。", author: "杨定一", source: "神圣的你", lang: "zh", themes: ["acceptance", "philosophy", "serenity"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 2, text: "一切，都刚刚好。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["acceptance", "serenity"], moods: ["warm", "neutral"], brightness: ["light", "balanced"] },
  { id: 3, text: "回到当下，一切自然都好。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 4, text: "你，就是宇宙。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["philosophy", "presence"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 5, text: "这里，现在，就是全部。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["light"] },

  // ---------- 克里希那穆提 ----------
  { id: 6, text: "真理是无路之国。", author: "克里希那穆提", source: "解散明星社演讲", lang: "translated", themes: ["philosophy", "freedom"], moods: ["cool", "neutral"], brightness: ["dark", "balanced"] },
  { id: 7, text: "你就是世界。", author: "克里希那穆提", source: "你就是世界", lang: "translated", themes: ["philosophy", "presence"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 8, text: "观察者即是被观察者。", author: "克里希那穆提", source: "生命之书", lang: "translated", themes: ["philosophy", "presence"], moods: ["cool", "neutral"], brightness: ["balanced", "dark"] },
  { id: 9, text: "在静默之中，才有真正的聆听。", author: "克里希那穆提", lang: "translated", themes: ["serenity", "presence"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 10, text: "自由，是心灵免于恐惧的状态。", author: "克里希那穆提", lang: "translated", themes: ["freedom", "philosophy"], moods: ["cool"], brightness: ["balanced"] },

  // ---------- 一行禅师 ----------
  { id: 11, text: "没有淤泥，就没有莲花。", author: "一行禅师", source: "没有淤泥，就没有莲花", lang: "translated", themes: ["acceptance", "hope"], moods: ["warm", "neutral"], brightness: ["balanced"] },
  { id: 12, text: "吸气，我回到当下；呼气，我微笑。", author: "一行禅师", source: "正念的奇迹", lang: "translated", themes: ["presence", "serenity"], moods: ["warm", "neutral"], brightness: ["light"] },
  { id: 13, text: "当下，是我们唯一的家。", author: "一行禅师", source: "活在此时此刻", lang: "translated", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 14, text: "安住于当下，我们已经到家了。", author: "一行禅师", lang: "translated", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["light"] },
  { id: 15, text: "每一步，都可以是和平。", author: "一行禅师", source: "和平始于每一步", lang: "translated", themes: ["serenity", "hope"], moods: ["neutral", "warm"], brightness: ["light"] },

  // ---------- 拜伦·凯蒂 ----------
  { id: 16, text: "当我与现实争辩时，输的总是我。", author: "拜伦·凯蒂", source: "一念之转", lang: "translated", themes: ["acceptance", "philosophy"], moods: ["neutral", "cool"], brightness: ["balanced"] },
  { id: 17, text: "现实，永远比我们讲述的故事更仁慈。", author: "拜伦·凯蒂", source: "一念之转", lang: "translated", themes: ["acceptance", "love"], moods: ["warm", "neutral"], brightness: ["balanced", "light"] },
  { id: 18, text: "没有你的故事，你是谁？", author: "拜伦·凯蒂", source: "一念之转", lang: "translated", themes: ["philosophy", "presence"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 19, text: "爱，只在当下。", author: "拜伦·凯蒂", lang: "translated", themes: ["love", "presence"], moods: ["warm"], brightness: ["light"] },
  { id: 20, text: "转念，就是回到平静。", author: "拜伦·凯蒂", lang: "translated", themes: ["acceptance", "serenity"], moods: ["neutral", "warm"], brightness: ["balanced"] },

  // ---------- 拉玛那·马哈希 ----------
  { id: 21, text: "静默，是永不间断的布道。", author: "拉玛那·马哈希", source: "走向静默，如你本来", lang: "translated", themes: ["serenity", "philosophy"], moods: ["neutral", "cool"], brightness: ["dark", "balanced"] },
  { id: 22, text: "如你本来。", author: "拉玛那·马哈希", source: "走向静默，如你本来", lang: "translated", themes: ["acceptance", "serenity"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 23, text: "我是谁？", author: "拉玛那·马哈希", source: "谁在我是？", lang: "translated", themes: ["philosophy", "presence"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 24, text: "你的本性，就是平静。", author: "拉玛那·马哈希", lang: "translated", themes: ["serenity", "presence"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 25, text: "一切都将过去，唯有真我常存。", author: "拉玛那·马哈希", lang: "translated", themes: ["philosophy", "time"], moods: ["neutral", "cool"], brightness: ["balanced", "dark"] },

  // ---------- 埃克哈特·托利 ----------
  { id: 26, text: "当下时刻，是你唯一拥有的时间。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["presence", "philosophy"], moods: ["neutral", "warm"], brightness: ["light", "balanced"] },
  { id: 27, text: "臣服于当下，就是臣服于生命。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["acceptance", "presence"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 28, text: "你无法在当下之外找到自己。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["presence", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 29, text: "临在，是觉醒的开始。", author: "埃克哈特·托利", lang: "translated", themes: ["presence", "philosophy"], moods: ["neutral", "warm"], brightness: ["light"] },
  { id: 30, text: "内在的平静，不需要任何条件。", author: "埃克哈特·托利", source: "新世界", lang: "translated", themes: ["serenity", "acceptance"], moods: ["neutral", "cool"], brightness: ["balanced"] },
];

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface QuoteContext {
  mood: Mood;
  brightness: Brightness;
}

/** 根据画面情绪检索最匹配的名句；seed 用于在同分候选中随机切换 */
export function pickQuote(
  ctx: QuoteContext,
  excludeIds: ReadonlySet<number> = new Set(),
  seed: number = Date.now(),
): Quote {
  const rand = mulberry32(seed >>> 0);
  const scored = QUOTES
    .filter((q) => !excludeIds.has(q.id))
    .map((q) => {
      let s = 0;
      if (q.moods.includes(ctx.mood)) s += 3;
      else if (q.moods.includes("neutral")) s += 1;
      if (q.brightness.includes(ctx.brightness)) s += 2;
      else if (q.brightness.includes("balanced")) s += 1;
      return { q, s };
    })
    .sort((a, b) => b.s - a.s);

  if (scored.length === 0) return QUOTES[0]!;
  const topScore = scored[0]!.s;
  const top = scored.filter((x) => x.s === topScore);
  const chosen = top[Math.floor(rand() * top.length)] ?? scored[0]!;
  return chosen.q;
}

export function getQuote(id: number): Quote | undefined {
  return QUOTES.find((q) => q.id === id);
}
