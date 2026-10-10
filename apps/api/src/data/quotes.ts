import type { Mood, Brightness } from "../lib/palette.js";

export type Theme =
  | "hope" | "love" | "serenity" | "resilience" | "time"
  | "nature" | "freedom" | "nostalgia" | "vitality" | "philosophy";

export type Lang = "zh" | "translated" | "classical";

export interface Quote {
  id: number;
  text: string;
  author: string;
  /** 出处（作品/篇名），无法确证时省略 */
  source?: string;
  lang: Lang;
  themes: Theme[];
  moods: Mood[];
  brightness: Brightness[];
}

/**
 * 精选名句库：现代诗 + 哲学家/文学家名言为主，少量古典诗词点缀。
 * 全部为真实可查证的经典句子，标注作者与出处。
 */
export const QUOTES: Quote[] = [
  // ---------- 现代诗 · 中文 ----------
  { id: 1, text: "从明天起，做一个幸福的人，喂马、劈柴，周游世界", author: "海子", source: "面朝大海，春暖花开", lang: "zh", themes: ["hope", "nature", "freedom"], moods: ["warm"], brightness: ["light"] },
  { id: 2, text: "我只愿面朝大海，春暖花开", author: "海子", source: "面朝大海，春暖花开", lang: "zh", themes: ["hope", "serenity", "nature"], moods: ["warm"], brightness: ["light"] },
  { id: 3, text: "黑夜给了我黑色的眼睛，我却用它寻找光明", author: "顾城", source: "一代人", lang: "zh", themes: ["hope", "philosophy"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 4, text: "卑鄙是卑鄙者的通行证，高尚是高尚者的墓志铭", author: "北岛", source: "回答", lang: "zh", themes: ["philosophy"], moods: ["cool"], brightness: ["dark"] },
  { id: 5, text: "从前的日色变得慢，车，马，邮件都慢，一生只够爱一个人", author: "木心", source: "从前慢", lang: "zh", themes: ["love", "time", "serenity"], moods: ["warm"], brightness: ["balanced"] },
  { id: 6, text: "你站在桥上看风景，看风景的人在楼上看你", author: "卞之琳", source: "断章", lang: "zh", themes: ["philosophy", "serenity"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 7, text: "我达达的马蹄是美丽的错误，我不是归人，是个过客", author: "郑愁予", source: "错误", lang: "zh", themes: ["nostalgia", "love"], moods: ["cool"], brightness: ["balanced"] },
  { id: 8, text: "你是爱，是暖，是希望，你是人间的四月天", author: "林徽因", source: "你是人间的四月天", lang: "zh", themes: ["love", "hope", "vitality"], moods: ["warm"], brightness: ["light"] },
  { id: 9, text: "轻轻的我走了，正如我轻轻的来", author: "徐志摩", source: "再别康桥", lang: "zh", themes: ["serenity", "nostalgia"], moods: ["neutral", "cool"], brightness: ["balanced"] },
  { id: 10, text: "乡愁是一湾浅浅的海峡，我在这头，大陆在那头", author: "余光中", source: "乡愁", lang: "zh", themes: ["nostalgia", "love"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 11, text: "岁月不饶人，我亦未曾饶过岁月", author: "木心", lang: "zh", themes: ["time", "vitality"], moods: ["warm", "neutral"], brightness: ["balanced"] },
  { id: 12, text: "如何让你遇见我，在我最美丽的时刻", author: "席慕蓉", source: "一棵开花的树", lang: "zh", themes: ["love", "vitality"], moods: ["warm"], brightness: ["light"] },
  { id: 13, text: "我们准备着深深地领受，那些意想不到的奇迹", author: "冯至", source: "十四行集", lang: "zh", themes: ["hope", "serenity"], moods: ["neutral"], brightness: ["balanced"] },

  // ---------- 现代诗 · 外国（中译） ----------
  { id: 14, text: "生如夏花之绚烂，死如秋叶之静美", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["vitality", "serenity", "philosophy"], moods: ["warm", "neutral"], brightness: ["balanced"] },
  { id: 15, text: "世界以痛吻我，要我报之以歌", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["resilience", "hope"], moods: ["warm", "cool"], brightness: ["balanced"] },
  { id: 16, text: "天空没有留下翅膀的痕迹，但我已飞过", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["freedom", "serenity", "philosophy"], moods: ["cool", "neutral"], brightness: ["light"] },
  { id: 17, text: "如果你因失去了太阳而流泪，那么你也将失去群星了", author: "泰戈尔", source: "飞鸟集", lang: "translated", themes: ["hope", "philosophy"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 18, text: "我喜欢你是寂静的，仿佛你消失了一样", author: "聂鲁达", source: "二十首情诗", lang: "translated", themes: ["love", "serenity"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 19, text: "我心里一直都在暗暗设想，天堂应该是图书馆的模样", author: "博尔赫斯", lang: "translated", themes: ["serenity", "philosophy"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 20, text: "有何胜利可言，挺住意味着一切", author: "里尔克", lang: "translated", themes: ["resilience", "philosophy"], moods: ["cool"], brightness: ["dark"] },
  { id: 21, text: "我的心略大于整个宇宙", author: "佩索阿", lang: "translated", themes: ["philosophy", "freedom"], moods: ["neutral", "cool"], brightness: ["balanced"] },
  { id: 22, text: "世界让我遍体鳞伤，但伤口长出的却是翅膀", author: "阿多尼斯", lang: "translated", themes: ["resilience", "hope"], moods: ["warm", "cool"], brightness: ["balanced"] },
  { id: 23, text: "冬天来了，春天还会远吗", author: "雪莱", source: "西风颂", lang: "translated", themes: ["hope", "time"], moods: ["cool", "warm"], brightness: ["dark"] },

  // ---------- 哲学家 / 文学家名言 ----------
  { id: 24, text: "对爱情的渴望，对知识的追求，对人类苦难不可遏制的同情", author: "罗素", source: "我为什么而活着", lang: "translated", themes: ["love", "philosophy", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 25, text: "未经省察的人生不值得过", author: "苏格拉底", source: "申辩篇", lang: "translated", themes: ["philosophy"], moods: ["cool"], brightness: ["dark"] },
  { id: 26, text: "每一个不曾起舞的日子，都是对生命的辜负", author: "尼采", source: "查拉图斯特拉如是说", lang: "translated", themes: ["vitality", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 27, text: "谁终将声震人间，必长久深自缄默；谁终将点燃闪电，必长久如云漂泊", author: "尼采", lang: "translated", themes: ["resilience", "philosophy"], moods: ["cool"], brightness: ["dark"] },
  { id: 28, text: "在隆冬，我终于知道，我身上有一个不可战胜的夏天", author: "加缪", source: "重返蒂巴萨", lang: "translated", themes: ["resilience", "hope", "vitality"], moods: ["warm", "cool"], brightness: ["dark"] },
  { id: 29, text: "登上顶峰的斗争本身，足以充实人的心灵", author: "加缪", source: "西西弗神话", lang: "translated", themes: ["resilience", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 30, text: "一个人可以被毁灭，但不能被打败", author: "海明威", source: "老人与海", lang: "translated", themes: ["resilience", "vitality"], moods: ["warm"], brightness: ["balanced"] },
  { id: 31, text: "我们都生活在阴沟里，但仍有人仰望星空", author: "王尔德", source: "温德米尔夫人的扇子", lang: "translated", themes: ["hope", "philosophy"], moods: ["cool", "warm"], brightness: ["dark"] },
  { id: 32, text: "爱自己是终身浪漫的开始", author: "王尔德", lang: "translated", themes: ["love", "vitality"], moods: ["warm"], brightness: ["light"] },
  { id: 33, text: "你的孩子，其实不是你的孩子", author: "纪伯伦", source: "先知", lang: "translated", themes: ["philosophy", "love"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 34, text: "爱不占有，也不被占有，因为爱在爱中满足了", author: "纪伯伦", source: "先知", lang: "translated", themes: ["love", "philosophy"], moods: ["warm", "neutral"], brightness: ["balanced"] },
  { id: 35, text: "记忆是相会的一种形式，忘记是自由的一种形式", author: "纪伯伦", source: "沙与沫", lang: "translated", themes: ["time", "freedom", "philosophy"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 36, text: "世界上只有一种真正的英雄主义，就是认清了生活的真相后还依然热爱它", author: "罗曼·罗兰", source: "米开朗琪罗传", lang: "translated", themes: ["resilience", "hope", "love"], moods: ["warm"], brightness: ["balanced"] },
  { id: 37, text: "即使被关在果壳之中，我仍自以为是无限宇宙之王", author: "莎士比亚", source: "哈姆雷特", lang: "translated", themes: ["hope", "freedom", "philosophy"], moods: ["warm"], brightness: ["dark"] },
  { id: 38, text: "你若要喜爱你自己的价值，你就得给世界创造价值", author: "歌德", lang: "translated", themes: ["philosophy", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 39, text: "我步入丛林，因为我希望生活得有意义", author: "梭罗", source: "瓦尔登湖", lang: "translated", themes: ["nature", "philosophy", "freedom"], moods: ["neutral", "warm"], brightness: ["light"] },
  { id: 40, text: "生命中曾经有过的所有灿烂，原来终究，都需要用寂寞来偿还", author: "马尔克斯", source: "百年孤独", lang: "translated", themes: ["time", "philosophy", "nostalgia"], moods: ["cool", "neutral"], brightness: ["dark"] },

  // ---------- 中国作家 / 哲人 ----------
  { id: 41, text: "愿中国青年都摆脱冷气，只是向上走", author: "鲁迅", source: "热风·随感录四十一", lang: "zh", themes: ["hope", "vitality"], moods: ["warm"], brightness: ["light"] },
  { id: 42, text: "其实地上本没有路，走的人多了，也便成了路", author: "鲁迅", source: "故乡", lang: "zh", themes: ["hope", "philosophy"], moods: ["warm", "neutral"], brightness: ["balanced"] },
  { id: 43, text: "生命是一袭华美的袍，爬满了蚤子", author: "张爱玲", source: "天才梦", lang: "zh", themes: ["philosophy"], moods: ["cool"], brightness: ["dark"] },
  { id: 44, text: "心若没有栖息的地方，到哪里都是流浪", author: "三毛", lang: "zh", themes: ["serenity", "philosophy"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 45, text: "死是一件不必急于求成的事，死是一个必然会降临的节日", author: "史铁生", source: "我与地坛", lang: "zh", themes: ["philosophy", "time"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 46, text: "那一年我二十一岁，在我一生的黄金时代", author: "王小波", source: "黄金时代", lang: "zh", themes: ["vitality", "time"], moods: ["warm"], brightness: ["light"] },
  { id: 47, text: "人生不如意之事十有八九，常想一二，不思八九", author: "林清玄", lang: "zh", themes: ["serenity", "philosophy"], moods: ["neutral", "warm"], brightness: ["balanced"] },
  { id: 48, text: "不乱于心，不困于情，不畏将来，不念过往", author: "丰子恺", lang: "zh", themes: ["serenity", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 49, text: "人间烟火气，最抚凡人心", author: "汪曾祺", lang: "zh", themes: ["nature", "serenity", "love"], moods: ["warm"], brightness: ["light"] },
  { id: 50, text: "这个人也许永远不回来了，也许明天回来", author: "沈从文", source: "边城", lang: "zh", themes: ["nostalgia", "love"], moods: ["cool", "neutral"], brightness: ["balanced"] },
  { id: 51, text: "人本过客来无处，休说故里在何方", author: "林语堂", lang: "zh", themes: ["time", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 52, text: "我们曾如此渴望命运的波澜，到最后才发现：人生最曼妙的风景，竟是内心的淡定与从容", author: "杨绛", lang: "zh", themes: ["serenity", "philosophy"], moods: ["neutral", "warm"], brightness: ["balanced"] },

  // ---------- 古典（少量点缀，意境极佳） ----------
  { id: 53, text: "人有悲欢离合，月有阴晴圆缺，此事古难全", author: "苏轼", source: "水调歌头", lang: "classical", themes: ["time", "philosophy", "nostalgia"], moods: ["neutral", "cool"], brightness: ["balanced"] },
  { id: 54, text: "回首向来萧瑟处，归去，也无风雨也无晴", author: "苏轼", source: "定风波", lang: "classical", themes: ["serenity", "philosophy"], moods: ["neutral"], brightness: ["balanced"] },
  { id: 55, text: "行到水穷处，坐看云起时", author: "王维", source: "终南别业", lang: "classical", themes: ["serenity", "nature", "philosophy"], moods: ["neutral"], brightness: ["light"] },
  { id: 56, text: "采菊东篱下，悠然见南山", author: "陶渊明", source: "饮酒", lang: "classical", themes: ["serenity", "nature"], moods: ["warm", "neutral"], brightness: ["light"] },
  { id: 57, text: "海上生明月，天涯共此时", author: "张九龄", source: "望月怀远", lang: "classical", themes: ["nostalgia", "nature", "serenity"], moods: ["cool", "neutral"], brightness: ["dark"] },
  { id: 58, text: "落霞与孤鹜齐飞，秋水共长天一色", author: "王勃", source: "滕王阁序", lang: "classical", themes: ["nature", "vitality"], moods: ["warm", "cool"], brightness: ["light"] },
  { id: 59, text: "天生我材必有用，千金散尽还复来", author: "李白", source: "将进酒", lang: "classical", themes: ["vitality", "hope"], moods: ["warm"], brightness: ["light"] },
  { id: 60, text: "会当凌绝顶，一览众山小", author: "杜甫", source: "望岳", lang: "classical", themes: ["hope", "vitality"], moods: ["warm"], brightness: ["light"] },
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
