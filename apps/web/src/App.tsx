import { useEffect, useState } from "react";
import { fetchMeta, fetchPalette, generate, randomCard, switchAbstract, switchAnimal, switchQuote, textCard } from "./api";
import type { AbstractStyle, AnimalResult, GenerateResult, Meta, Palette, Quote } from "./types";
import { UploadZone } from "./components/UploadZone";
import { ColorChips } from "./components/ColorChips";
import { StylePicker } from "./components/StylePicker";
import { composePoster, svgToDataUri } from "./lib/poster";

const DEFAULT_META: Meta = {
  animals: {
    warm: ["柴犬", "橘猫", "小鹿", "兔子", "熊猫", "龙猫"],
    cool: ["雪狐", "企鹅", "鲸鱼", "猫头鹰", "海豹", "白兔"],
    neutral: ["仓鼠", "水獭", "海豹", "熊猫", "刺猬", "树懒"],
  },
  styles: ["aurora", "mondrian", "gradients", "flow", "oil", "vivid"],
  styleLabels: {
    aurora: "极光幻梦",
    mondrian: "蒙德里安",
    gradients: "柔光渐变",
    flow: "流体涟漪",
    oil: "油画质感",
    vivid: "绚烂霓虹",
  },
};

const EXAMPLES = [
  { file: "sunset.jpg", label: "🌅 夕阳" },
  { file: "ocean.jpg", label: "🌊 海洋" },
  { file: "forest.jpg", label: "🌲 森林" },
  { file: "aurora.jpg", label: "🌌 极光" },
];

const EMOJI: Record<string, string> = {
  "柴犬": "🐕", "橘猫": "🐱", "小猫": "🐱", "小鹿": "🦌", "兔子": "🐰", "白兔": "🐇",
  "熊猫": "🐼", "龙猫": "🐹", "柯基": "🐶", "小熊": "🐻", "雪狐": "🦊", "企鹅": "🐧",
  "小企鹅": "🐧", "鲸鱼": "🐳", "猫头鹰": "🦉", "海豹": "🦭", "雪鸮": "🦉", "北极熊": "🐻‍❄️",
  "仓鼠": "🐹", "水獭": "🦦", "刺猬": "🦔", "树懒": "🦥",
};

type Phase = "idle" | "ready" | "generating" | "done";
type BusyKey = "" | "animal" | "quote" | "abstract";
type CardMode = "image" | "text" | "random";

export default function App() {
  const [meta, setMeta] = useState<Meta>(DEFAULT_META);
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<CardMode>("image");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [textInput, setTextInput] = useState("");
  const [palette, setPalette] = useState<Palette | null>(null);
  const [abstractSvg, setAbstractSvg] = useState("");
  const [animal, setAnimal] = useState<AnimalResult | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [style, setStyle] = useState<AbstractStyle>("aurora");
  const [animalChoice, setAnimalChoice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<BusyKey>("");

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => {});
  }, []);

  function reset() {
    setPhase("idle");
    setFile(null);
    setPreviewUrl("");
    setTextInput("");
    setPalette(null);
    setAbstractSvg("");
    setAnimal(null);
    setQuote(null);
    setAnimalChoice("");
    setError("");
  }

  async function onFile(f: File) {
    setMode("image");
    setFile(f);
    setError("");
    setPhase("ready");
    setPreviewUrl(URL.createObjectURL(f));
    setPalette(null);
    setAnimal(null);
    setQuote(null);
    setAbstractSvg("");
    fetchPalette(f).then(setPalette).catch(() => {});
  }

  async function onLoadExample(fileName: string) {
    setError("");
    try {
      const res = await fetch("/examples/" + fileName);
      const blob = await res.blob();
      await onFile(new File([blob], fileName, { type: "image/jpeg" }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function applyResult(res: GenerateResult) {
    setPalette(res.palette);
    setAbstractSvg(res.abstractSvg);
    setAnimal(res.animal);
    setQuote(res.quote);
  }

  async function onRandomCard() {
    setMode("random");
    setPhase("generating");
    setError("");
    try {
      const res = await randomCard({ style, seed: Date.now() });
      applyResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }

  async function onTextCard() {
    const t = textInput.trim();
    if (!t) return;
    setMode("text");
    setPhase("generating");
    setError("");
    try {
      const res = await textCard(t, { style, seed: Date.now() });
      applyResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }

  async function onGenerate() {
    setPhase("generating");
    setError("");
    try {
      let res: GenerateResult;
      if (mode === "image" && file) {
        res = await generate(file, { animal: animalChoice.trim() || undefined, style, seed: Date.now() });
      } else if (mode === "text") {
        res = await textCard(textInput.trim(), { style, seed: Date.now() });
      } else {
        res = await randomCard({ style, seed: Date.now() });
      }
      applyResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase(mode === "image" ? "ready" : "idle");
    }
  }

  async function onChangeStyle(s: AbstractStyle) {
    setStyle(s);
    if (!palette || phase !== "done") return;
    setBusy("abstract");
    setError("");
    try {
      const svg = await switchAbstract(palette.colors.map((c) => c.hex), s, Date.now());
      setAbstractSvg(svg);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function onChangeQuote() {
    if (!palette) return;
    setBusy("quote");
    setError("");
    try {
      const q = await switchQuote(palette.mood, palette.brightness, quote ? [quote.id] : []);
      setQuote(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function onChangeAnimal(name?: string) {
    setBusy("animal");
    setError("");
    try {
      const target = (name ?? animalChoice).trim() || undefined;
      if (mode === "image" && file) {
        const res = await switchAnimal(file, { animal: target, seed: Date.now() });
        setAnimal(res.animal);
      } else if (mode === "text") {
        const res = await textCard(textInput.trim(), { animal: target, style, seed: Date.now() });
        applyResult(res);
      } else {
        const res = await randomCard({ animal: target, style, seed: Date.now() });
        applyResult(res);
      }
      if (name) setAnimalChoice(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  async function onDownload() {
    if (!palette || !animal || !quote) return;
    setError("");
    try {
      const blob = await composePoster({ palette, abstractSvg, animal, quote });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "生命之流彩-" + animal.name + ".png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const animalChips = (meta.animals[palette?.mood ?? "neutral"] ?? meta.animals.neutral).slice(0, 6);
  const longQuote = (quote?.text.length ?? 0) > 22;
  const sourceLabel = mode === "image" ? "照片" : mode === "text" ? "一句话" : "随机";

  return (
    <div className="min-h-screen">
      <div className="app-bg" />

      <main className="relative max-w-3xl mx-auto px-5 py-10">
        <header className="text-center mb-10 fade-up">
          <div className="inline-flex items-center gap-3">
            <span className="text-3xl">✨</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-800">
              生命之流彩
              <span className="block text-sm md:text-base text-stone-500 font-normal mt-1 tracking-[0.28em]">
                Flow of Life · 用卡片点亮一束光
              </span>
            </h1>
          </div>
          <p className="mt-5 text-stone-500 max-w-xl mx-auto leading-relaxed text-sm">
            一切如其所是，处处都是丰盛
            <br />
            样样都是完美，爱无处不在！
          </p>
        </header>

        {phase !== "done" && (
          <section className="max-w-xl mx-auto fade-up">
            {phase === "idle" && (
              <div className="space-y-5">
                <div className="glass p-6 text-center">
                  <button className="btn btn-primary !px-8 !py-3 text-base" onClick={onRandomCard}>
                    ✨ 直接抽一张卡
                  </button>
                  <p className="text-xs text-stone-400 mt-3">无需上传，随机配色，抽取属于你此刻的卡片</p>
                </div>

                <div className="glass p-6">
                  <p className="text-sm text-stone-500 mb-3">💬 说一句话来抽卡</p>
                  <div className="flex gap-2">
                    <input
                      className="input-line"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") onTextCard(); }}
                      placeholder="比如：黄昏的海边，风很温柔"
                    />
                    <button className="btn btn-primary shrink-0" onClick={onTextCard} disabled={!textInput.trim()}>
                      抽卡
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-stone-500 mb-3">🖼️ 或者，上传一张照片</p>
                  <UploadZone onFile={onFile} />
                  <div className="mt-4 text-center">
                    <p className="text-xs text-stone-400 mb-3 tracking-widest">— 示例照片 —</p>
                    <div className="flex flex-wrap gap-3 justify-center">
                      {EXAMPLES.map((e) => (
                        <button
                          key={e.file}
                          onClick={() => onLoadExample(e.file)}
                          className="group overflow-hidden rounded-xl border border-stone-200 bg-white/70 hover:border-amber-300 transition-all hover:-translate-y-1 shadow-sm"
                        >
                          <img src={"/examples/" + e.file} alt={e.label} className="w-28 h-20 object-cover" />
                          <span className="block text-xs text-stone-600 py-1.5 group-hover:text-amber-700">{e.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(phase === "ready" || phase === "generating") && (
              <div className="glass p-6">
                <div className="flex gap-4 items-center">
                  {previewUrl && (
                    <img src={previewUrl} alt="预览" className="w-24 h-24 rounded-xl object-cover shrink-0 shadow" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-500">已选择照片</p>
                    <button className="text-sm text-stone-600 underline underline-offset-4 mt-1 hover:text-amber-700" onClick={reset}>
                      重新选择
                    </button>
                  </div>
                </div>

                {palette && (
                  <div className="mt-5">
                    <ColorChips palette={palette} />
                  </div>
                )}

                <div className="mt-5">
                  <label className="text-sm text-stone-500">想要什么动物？</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={animalChoice}
                      onChange={(e) => setAnimalChoice(e.target.value)}
                      placeholder="留空让 AI 决定，或输入任意动物"
                      className="input-line"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {animalChips.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAnimalChoice(a)}
                        className="px-2.5 py-1 rounded-full text-xs bg-white/80 border border-stone-200 text-stone-600 hover:bg-amber-50 hover:border-amber-300 transition-colors"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm text-stone-500">抽象画风格</label>
                  <div className="mt-2">
                    <StylePicker styles={meta.styles} labels={meta.styleLabels} current={style} onChange={setStyle} />
                  </div>
                </div>

                <button
                  className="btn btn-primary w-full justify-center mt-7 !py-3 text-base"
                  onClick={onGenerate}
                  disabled={phase === "generating"}
                >
                  {phase === "generating" ? "正在创作…" : "✨ 抽取我的卡片"}
                </button>
              </div>
            )}

            {phase === "generating" && (
              <div className="mt-10 text-center fade-up">
                <div className="inline-block w-11 h-11 rounded-full border-2 border-stone-200 border-t-amber-500 animate-spin" />
                <p className="mt-5 loading-shimmer text-lg">正在调色 · 召唤伙伴 · 寻找诗句…</p>
                <p className="text-xs text-stone-400 mt-2">首次生成约需 10~60 秒（含 AI 绘图）</p>
              </div>
            )}
          </section>
        )}

        {phase === "done" && palette && animal && quote && (
          <section className="flex flex-col items-center">
            <div className="card-reveal w-full max-w-[430px]">
              <div className="poem-card">
                <img src={svgToDataUri(abstractSvg)} alt="抽象色彩背景" className="card-bg" />
                <div className="card-scrim" />
                <div className="card-logo">✨ 生命之流彩 <small>FLOW OF LIFE</small></div>
                <div className="card-quote">
                  <p className="card-quote-text" style={longQuote ? { fontSize: "1.08rem" } : undefined}>
                    「{quote.text}」
                  </p>
                  <p className="card-quote-author">
                    —— {quote.author}{quote.source ? "《" + quote.source + "》" : ""}
                  </p>
                </div>
                <div className="card-animal">
                  {animal.imageDataUri ? (
                    <img src={animal.imageDataUri} alt={animal.name} />
                  ) : (
                    <div
                      className="card-animal-fallback"
                      style={{
                        background:
                          "linear-gradient(135deg, " + (palette.colors[0]?.hex ?? "#e8a05a") + ", " + (palette.colors[1]?.hex ?? "#c95f4a") + ")",
                      }}
                    >
                      {EMOJI[animal.name] ?? "🐾"}
                    </div>
                  )}
                </div>
                <div className="card-footer">
                  <div className="card-swatches">
                    {palette.colors.slice(0, 5).map((c) => (
                      <span key={c.hex} className="card-swatch-dot" style={{ background: c.hex }} />
                    ))}
                  </div>
                  <div className="card-en">ALL IS AS IT IS<br />ABUNDANCE EVERYWHERE</div>
                </div>
              </div>
            </div>

            <div className="glass p-5 mt-7 w-full max-w-[560px] fade-up">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-sm text-stone-500">抽象风格</span>
                <StylePicker
                  styles={meta.styles}
                  labels={meta.styleLabels}
                  current={style}
                  onChange={(s) => onChangeStyle(s)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button className="btn btn-ghost justify-center text-sm" onClick={() => onChangeAnimal()} disabled={busy === "animal"}>
                  {busy === "animal" ? "生成中…" : "🐾 换一只动物"}
                </button>
                <button className="btn btn-ghost justify-center text-sm" onClick={onChangeQuote} disabled={busy === "quote"}>
                  {busy === "quote" ? "换句中…" : "✍️ 换一句诗"}
                </button>
                <button className="btn btn-primary justify-center text-sm" onClick={onDownload}>
                  ⬇ 下载诗卡
                </button>
                <button className="btn btn-ghost justify-center text-sm" onClick={onGenerate}>
                  🔄 重新生成
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {animalChips.map((a) => (
                  <button
                    key={a}
                    onClick={() => onChangeAnimal(a)}
                    disabled={busy === "animal"}
                    className="px-2.5 py-1 rounded-full text-xs bg-white/80 border border-stone-200 text-stone-600 hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50"
                  >
                    {a}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-200/70">
                <div className="flex items-center gap-2">
                  {previewUrl && <img src={previewUrl} alt="原图" className="w-10 h-10 rounded-lg object-cover shadow" />}
                  <span className="text-xs text-stone-400">来源 · {sourceLabel} · {meta.styleLabels[style]}</span>
                </div>
                <button className="btn btn-ghost !py-1.5 !px-4 text-sm" onClick={reset}>
                  ↑ 回到首页
                </button>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-8 text-center text-rose-600 text-sm bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <footer className="text-center text-stone-400 text-xs mt-16">
          生命之流彩 · 用卡片点亮一束光
        </footer>
      </main>
    </div>
  );
}
