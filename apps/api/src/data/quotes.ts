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
  source?: string;
  lang: Lang;
  themes: Theme[];
  moods: Mood[];
  brightness: Brightness[];
}

/**
 * 精选名句库：灵性导师 + 哲学家，全部为真实可查证的完整句子。
 */
export const QUOTES: Quote[] = [
  // ---------- 杨定一博士 ----------
  { id: 1, text: "宇宙不可能犯错。", author: "杨定一", source: "神圣的你", lang: "zh", themes: ["acceptance", "philosophy"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 2, text: "一切，都刚刚好。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["acceptance", "serenity"], moods: ["warm", "neutral"], brightness: ["light", "balanced"] },
  { id: 3, text: "回到当下，一切自然都好。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 5, text: "这里，现在，就是全部。", author: "杨定一", source: "全部的你", lang: "zh", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["light"] },

  // ---------- 克里希那穆提 ----------
  { id: 6, text: "真理是无路之国。", author: "克里希那穆提", source: "解散明星社演讲", lang: "translated", themes: ["philosophy", "freedom"], moods: ["cool", "neutral"], brightness: ["dark", "balanced"] },
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
  { id: 20, text: "转念，就是回到平静。", author: "拜伦·凯蒂", lang: "translated", themes: ["acceptance", "serenity"], moods: ["neutral", "warm"], brightness: ["balanced"] },

  // ---------- 拉玛那·马哈希 ----------
  { id: 21, text: "静默，是永不间断的布道。", author: "拉玛那·马哈希", source: "走向静默，如你本来", lang: "translated", themes: ["serenity", "philosophy"], moods: ["neutral", "cool"], brightness: ["dark", "balanced"] },
  { id: 22, text: "凡是生起的，都会消逝；唯有真我，恒常不变。", author: "拉玛那·马哈希", source: "走向静默，如你本来", lang: "translated", themes: ["philosophy", "time"], moods: ["neutral", "cool"], brightness: ["balanced", "dark"] },
  { id: 23, text: "探究「我是谁」，其余一切都会自然归位。", author: "拉玛那·马哈希", source: "谁在我是？", lang: "translated", themes: ["philosophy", "presence"], moods: ["neutral"], brightness: ["balanced"] },

  // ---------- 埃克哈特·托利 ----------
  { id: 24, text: "当下时刻，是你唯一拥有的时间。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["presence", "philosophy"], moods: ["neutral", "warm"], brightness: ["light", "balanced"] },
  { id: 25, text: "臣服于当下，就是臣服于生命。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["acceptance", "presence"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 26, text: "你无法在当下之外找到自己。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["presence", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 27, text: "临在，是觉醒的开始。", author: "埃克哈特·托利", lang: "translated", themes: ["presence", "philosophy"], moods: ["neutral", "warm"], brightness: ["light"] },
  { id: 28, text: "内在的平静，不需要任何条件。", author: "埃克哈特·托利", source: "新世界", lang: "translated", themes: ["serenity", "acceptance"], moods: ["neutral", "cool"], brightness: ["balanced"] },

  // ---------- 哲学家 ----------
  { id: 29, text: "上善若水。水善利万物而不争，处众人之所恶，故几于道。", author: "老子", source: "道德经", lang: "zh", themes: ["nature", "philosophy", "serenity"], moods: ["neutral", "cool"], brightness: ["balanced"] },
  { id: 30, text: "知人者智，自知者明。胜人者有力，自胜者强。", author: "老子", source: "道德经", lang: "zh", themes: ["philosophy", "serenity"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 31, text: "天地有大美而不言。", author: "庄子", source: "庄子·知北游", lang: "zh", themes: ["nature", "serenity", "philosophy"], moods: ["neutral"], brightness: ["light"] },
  { id: 32, text: "未经省察的人生不值得过。", author: "苏格拉底", source: "申辩篇", lang: "translated", themes: ["philosophy"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 33, text: "我唯一知道的，就是我一无所知。", author: "苏格拉底", source: "申辩篇", lang: "translated", themes: ["philosophy", "serenity"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 34, text: "吾爱吾师，吾更爱真理。", author: "亚里士多德", lang: "translated", themes: ["philosophy", "freedom"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 35, text: "对爱情的渴望，对知识的追求，对人类苦难不可遏制的同情，这三种激情支配了我的一生。", author: "罗素", source: "我为什么而活着", lang: "translated", themes: ["love", "philosophy", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 36, text: "幸福的秘诀在于：让你的兴趣尽量广泛，对你关心的人与事尽量友善。", author: "罗素", source: "幸福之路", lang: "translated", themes: ["love", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 37, text: "凡是能够说的，都能够说清楚；凡是不能说的，就必须保持沉默。", author: "维特根斯坦", source: "逻辑哲学论", lang: "translated", themes: ["philosophy", "serenity"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 38, text: "语言的界限，就是世界的界限。", author: "维特根斯坦", source: "逻辑哲学论", lang: "translated", themes: ["philosophy"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 39, text: "每一个不曾起舞的日子，都是对生命的辜负。", author: "尼采", source: "查拉图斯特拉如是说", lang: "translated", themes: ["vitality", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 40, text: "在隆冬，我终于知道，我身上有一个不可战胜的夏天。", author: "加缪", source: "重返蒂巴萨", lang: "translated", themes: ["resilience", "hope"], moods: ["warm", "cool"], brightness: ["dark"] },
  { id: 41, text: "人是一根会思想的芦苇。", author: "帕斯卡", source: "思想录", lang: "translated", themes: ["philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 42, text: "我们都生活在阴沟里，但仍有人仰望星空。", author: "王尔德", source: "温德米尔夫人的扇子", lang: "translated", themes: ["hope", "philosophy"], moods: ["warm", "cool"], brightness: ["dark"] },
  { id: 43, text: "有两样东西，愈是经常和持久地思考它们，愈是使心灵充满敬畏：头上的星空和心中的道德律。", author: "康德", source: "实践理性批判", lang: "translated", themes: ["philosophy", "serenity"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 44, text: "人不能两次踏进同一条河流。", author: "赫拉克利特", lang: "translated", themes: ["time", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 45, text: "你拥有力量掌控你的内心，而非外部事物。", author: "马可·奥勒留", source: "沉思录", lang: "translated", themes: ["acceptance", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 46, text: "当你可以和不确定性共处时，无限的可能性就在生命中展开了。", author: "埃克哈特·托利", source: "当下的力量", lang: "translated", themes: ["acceptance", "hope"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 47, text: "那些杀不死我的，必使我更强大。", author: "尼采", source: "偶像的黄昏", lang: "translated", themes: ["resilience", "vitality"], moods: ["warm"], brightness: ["balanced"] },
  { id: 48, text: "参差多态，乃是幸福的本源。", author: "罗素", source: "幸福之路", lang: "translated", themes: ["hope", "love"], moods: ["warm"], brightness: ["light"] },
  { id: 49, text: "祸兮福之所倚，福兮祸之所伏。", author: "老子", source: "道德经", lang: "zh", themes: ["philosophy", "acceptance"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 50, text: "世界的意义必定在世界之外。", author: "维特根斯坦", source: "逻辑哲学论", lang: "translated", themes: ["philosophy"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 51, text: "登上顶峰的斗争本身，足以充实人的心灵。", author: "加缪", source: "西西弗神话", lang: "translated", themes: ["resilience", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 52, text: "只有当心灵安静下来，才能看见真理。", author: "克里希那穆提", source: "生命之书", lang: "translated", themes: ["serenity", "philosophy"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 53, text: "正念是一种力量，它带我们回到当下，安住于生命的每一刻。", author: "一行禅师", lang: "translated", themes: ["presence", "serenity"], moods: ["neutral", "warm"], brightness: ["light"] },

  // ---------- 更多哲学家 / 文学家（生命感悟） ----------
  { id: 54, text: "生如夏花之绚烂，死如秋叶之静美。", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["vitality", "serenity", "philosophy"], moods: ["warm", "neutral"], brightness: ["balanced"] },
  { id: 55, text: "天空没有留下翅膀的痕迹，但我已飞过。", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["freedom", "serenity"], moods: ["cool", "neutral"], brightness: ["light"] },
  { id: 56, text: "世界以痛吻我，要我报之以歌。", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["resilience", "hope"], moods: ["warm", "cool"], brightness: ["balanced"] },
  { id: 57, text: "即使被关在果壳之中，我仍自以为是无限宇宙之王。", author: "莎士比亚", source: "哈姆雷特", lang: "translated", themes: ["hope", "freedom", "philosophy"], moods: ["warm"], brightness: ["dark"] },
  { id: 58, text: "一个人可以被毁灭，但不能被打败。", author: "海明威", source: "老人与海", lang: "translated", themes: ["resilience", "vitality"], moods: ["warm"], brightness: ["balanced"] },
  { id: 59, text: "真正重要的东西，用眼睛是看不见的，只有用心才能看见。", author: "圣埃克苏佩里", source: "小王子", lang: "translated", themes: ["love", "philosophy"], moods: ["warm"], brightness: ["light"] },
  { id: 60, text: "死并非生的对立面，而是作为生的一部分永存。", author: "村上春树", source: "挪威的森林", lang: "translated", themes: ["philosophy", "time"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 61, text: "我思故我在。", author: "笛卡尔", source: "方法论", lang: "translated", themes: ["philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 62, text: "幸福是灵魂合乎德性的活动。", author: "亚里士多德", source: "尼各马可伦理学", lang: "translated", themes: ["philosophy", "hope"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 63, text: "我们不是因为事情困难而不敢做，而是因为不敢做，事情才变得困难。", author: "塞涅卡", source: "道德书简", lang: "translated", themes: ["resilience", "philosophy"], moods: ["warm"], brightness: ["light"] },
  { id: 64, text: "生活只能倒着被理解，但必须正着被经历。", author: "克尔凯郭尔", lang: "translated", themes: ["philosophy", "time"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 65, text: "有何胜利可言，挺住意味着一切。", author: "里尔克", source: "给青年诗人的信", lang: "translated", themes: ["resilience", "philosophy"], moods: ["cool"], brightness: ["dark"] },
  { id: 66, text: "你若要喜爱你自己的价值，你就得给世界创造价值。", author: "歌德", lang: "translated", themes: ["philosophy", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 67, text: "我心里一直都在暗暗设想，天堂应该是图书馆的模样。", author: "博尔赫斯", lang: "translated", themes: ["serenity", "philosophy"], moods: ["neutral", "warm"], brightness: ["balanced"] },
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
