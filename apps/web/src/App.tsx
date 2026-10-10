import { useEffect, useState } from "react";
import { fetchMeta, fetchPalette, generate, switchAbstract, switchAnimal, switchQuote } from "./api";
import type { AbstractStyle, AnimalResult, GenerateResult, Meta, Palette, Quote } from "./types";
import { UploadZone } from "./components/UploadZone";
import { ColorChips } from "./components/ColorChips";
import { StylePicker } from "./components/StylePicker";
import { AnimalPanel } from "./components/AnimalPanel";
import { QuotePanel } from "./components/QuotePanel";
import { composePoster, svgToDataUri } from "./lib/poster";

const DEFAULT_META: Meta = {
  animals: {
    warm: ["柴犬", "橘猫", "小鹿", "兔子", "熊猫", "龙猫"],
    cool: ["雪狐", "企鹅", "鲸鱼", "猫头鹰", "海豹", "白兔"],
    neutral: ["仓鼠", "水獭", "海豹", "熊猫", "刺猬", "树懒"],
  },
  styles: ["aurora", "mondrian", "gradients", "flow"],
  styleLabels: { aurora: "极光幻梦", mondrian: "蒙德里安", gradients: "柔光渐变", flow: "流体涟漪" },
};

type Phase = "idle" | "ready" | "generating" | "done";
type BusyKey = "" | "animal" | "quote" | "abstract";

export default function App() {
  const [meta, setMeta] = useState<Meta>(DEFAULT_META);
  const [phase, setPhase] = useState<Phase>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
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
    setPalette(null);
    setAbstractSvg("");
    setAnimal(null);
    setQuote(null);
    setAnimalChoice("");
    setError("");
  }

  async function onFile(f: File) {
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

  function applyResult(res: GenerateResult) {
    setPalette(res.palette);
    setAbstractSvg(res.abstractSvg);
    setAnimal(res.animal);
    setQuote(res.quote);
  }

  async function onGenerate() {
    if (!file) return;
    setPhase("generating");
    setError("");
    try {
      const res = await generate(file, {
        animal: animalChoice.trim() || undefined,
        style,
        seed: Date.now(),
      });
      applyResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("ready");
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
    if (!file) return;
    const target = name ?? animalChoice;
    setBusy("animal");
    setError("");
    try {
      const res = await switchAnimal(file, {
        animal: target.trim() || undefined,
        seed: Date.now(),
      });
      setAnimal(res.animal);
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
      a.download = "色彩诗卡-" + animal.name + ".png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const animalChips = (meta.animals[palette?.mood ?? "neutral"] ?? meta.animals.neutral).slice(0, 6);

  return (
    <div className="min-h-screen">
      <div className="app-bg" />

      <main className="relative max-w-6xl mx-auto px-5 py-10">
        {/* 头部 */}
        <header className="text-center mb-10 fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wide">
            色彩诗卡 <span className="text-2xl md:text-3xl text-white/40 font-normal">· ColorPoet</span>
          </h1>
          <p className="mt-4 text-white/55 max-w-2xl mx-auto leading-relaxed">
            上传一张照片，AI 提取主色调，绘一幅抽象色彩，配一只可爱动漫动物，题一句经典名句
          </p>
        </header>

        {/* 上传 / 配置 */}
        {phase !== "done" && (
          <section className="max-w-2xl mx-auto fade-up">
            {phase === "idle" && <UploadZone onFile={onFile} />}

            {(phase === "ready" || phase === "generating") && (
              <div className="glass p-6">
                <div className="flex gap-5 items-center">
                  {previewUrl && <img src={previewUrl} alt="预览" className="w-28 h-28 rounded-xl object-cover shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/50">已选择照片</p>
                    <button
                      className="text-sm text-white/70 underline underline-offset-4 mt-1 hover:text-white"
                      onClick={reset}
                    >
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
                  <label className="text-sm text-white/60">想要什么动物？</label>
                  <div className="flex gap-2 mt-2">
                    <input
                      value={animalChoice}
                      onChange={(e) => setAnimalChoice(e.target.value)}
                      placeholder="留空让 AI 决定，或输入任意动物"
                      className="flex-1 min-w-[160px] px-4 py-2 rounded-full bg-white/8 border border-white/15 text-sm focus:outline-none focus:border-amber-300/60 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {animalChips.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAnimalChoice(a)}
                        className="px-2.5 py-1 rounded-full text-xs bg-white/8 border border-white/10 hover:bg-white/16 transition-colors"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="text-sm text-white/60">抽象画风格</label>
                  <div className="mt-2">
                    <StylePicker styles={meta.styles} labels={meta.styleLabels} current={style} onChange={setStyle} />
                  </div>
                </div>

                <button
                  className="btn btn-primary w-full justify-center mt-7 !py-3 text-base"
                  onClick={onGenerate}
                  disabled={phase === "generating"}
                >
                  {phase === "generating" ? "正在创作…" : "✨ 生成我的色彩诗卡"}
                </button>
              </div>
            )}

            {phase === "generating" && (
              <div className="mt-10 text-center fade-up">
                <div className="inline-block w-11 h-11 rounded-full border-2 border-white/15 border-t-amber-300 animate-spin" />
                <p className="mt-5 loading-shimmer text-lg">正在调配色彩 · 召唤伙伴 · 寻找诗句…</p>
                <p className="text-xs text-white/40 mt-2">首次生成约需 10~60 秒（含 AI 绘图）</p>
              </div>
            )}
          </section>
        )}

        {/* 结果展示 */}
        {phase === "done" && palette && animal && quote && (
          <section className="fade-up">
            <div className="glass p-5 mb-6 flex flex-wrap items-center gap-5 justify-between">
              <div className="flex items-center gap-4 flex-1 min-w-[260px]">
                {previewUrl && <img src={previewUrl} alt="原图" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                <div className="flex-1 min-w-[220px]">
                  <ColorChips palette={palette} />
                </div>
              </div>
              <button className="btn btn-ghost shrink-0" onClick={reset}>
                ↑ 上传新照片
              </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* 抽象色彩 */}
              <div className="glass glass-hover p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-white/60">抽象色彩</h3>
                  <span className="text-xs text-white/40">{meta.styleLabels[style]}</span>
                </div>
                <div className="img-frame aspect-square">
                  <img src={svgToDataUri(abstractSvg)} alt="抽象色彩画" />
                </div>
                <div className="mt-4">
                  <StylePicker
                    styles={meta.styles}
                    labels={meta.styleLabels}
                    current={style}
                    onChange={(s) => onChangeStyle(s)}
                  />
                </div>
              </div>

              {/* 动漫动物 */}
              <div className="glass glass-hover p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-white/60">动漫伙伴</h3>
                  <button
                    className="text-xs text-white/50 hover:text-white transition-colors disabled:opacity-50"
                    onClick={() => onChangeAnimal()}
                    disabled={busy === "animal"}
                  >
                    {busy === "animal" ? "生成中…" : "↻ 换一只"}
                  </button>
                </div>
                <AnimalPanel animal={animal} paletteHex={palette.colors.map((c) => c.hex)} />
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {animalChips.map((a) => (
                    <button
                      key={a}
                      onClick={() => onChangeAnimal(a)}
                      disabled={busy === "animal"}
                      className="px-2.5 py-1 rounded-full text-xs bg-white/8 border border-white/10 hover:bg-white/16 transition-colors disabled:opacity-50"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* 名句 */}
              <div className="glass glass-hover p-4 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm text-white/60">题一句</h3>
                </div>
                <div className="flex-1">
                  <QuotePanel quote={quote} onRefresh={onChangeQuote} />
                </div>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="flex flex-wrap gap-4 justify-center mt-9">
              <button className="btn btn-primary !px-7" onClick={onDownload}>
                ⬇ 下载诗卡
              </button>
              <button className="btn btn-ghost" onClick={onGenerate}>
                🔄 全部重新生成
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-8 text-center text-rose-300 text-sm bg-rose-500/10 border border-rose-400/20 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <footer className="text-center text-white/30 text-xs mt-20">
          色彩诗卡 ColorPoet · 抽象色彩 × 通义万相 × 经典名句
        </footer>
      </main>
    </div>
  );
}
