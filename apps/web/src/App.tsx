import { useEffect, useMemo, useRef, useState } from "react";
import { fetchMeta, generate, randomCard, switchAbstract, textCard } from "./api";
import type { AbstractImageResult, AbstractStyle, GenerateResult, Meta, Palette, Quote } from "./types";
import { composePoster } from "./lib/poster";

const DEFAULT_META: Meta = {
  styles: ["fluid", "gradient", "watercolor", "aurora"],
  styleLabels: { fluid: "流体", gradient: "渐变", watercolor: "水彩", aurora: "极光" },
};

type Phase = "idle" | "generating" | "done";

export default function App() {
  const [meta, setMeta] = useState<Meta>(DEFAULT_META);
  const [phase, setPhase] = useState<Phase>("idle");
  const [palette, setPalette] = useState<Palette | null>(null);
  const [abstractImage, setAbstractImage] = useState<AbstractImageResult | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [style, setStyle] = useState<AbstractStyle>("gradient");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const lights = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      left: (i * 37 + 13) % 100,
      top: (i * 53 + 7) % 100,
      size: 5 + (i % 4) * 2,
      delay: ((i * 0.73) % 5).toFixed(2),
    }));
  }, []);

  useEffect(() => {
    fetchMeta().then(setMeta).catch(() => {});
  }, []);

  function applyResult(res: GenerateResult) {
    setPalette(res.palette);
    setAbstractImage(res.abstractImage);
    setQuote(res.quote);
  }

  function reset() {
    setPhase("idle");
    setPalette(null);
    setAbstractImage(null);
    setQuote(null);
    setTextInput("");
    setError("");
  }

  async function onRandom() {
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

  async function onText() {
    const t = textInput.trim();
    if (!t) return;
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

  async function onImage(file: File) {
    setPhase("generating");
    setError("");
    try {
      const res = await generate(file, { style, seed: Date.now() });
      applyResult(res);
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("idle");
    }
  }

  async function onChangeStyle(s: AbstractStyle) {
    if (!palette) return;
    setStyle(s);
    setBusy(true);
    setError("");
    try {
      const img = await switchAbstract(palette.colors.map((c) => c.hex), s, Date.now());
      setAbstractImage(img);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDownload() {
    if (!palette || !abstractImage || !quote) return;
    setError("");
    try {
      const blob = await composePoster({ palette, abstractImage, quote });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "生命之流彩-" + Date.now() + ".png";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  const longQuote = (quote?.text.length ?? 0) > 24;

  return (
    <div className="min-h-screen">
      <div className="app-bg" />
      <div className="lights">
        {lights.map((l, i) => (
          <span
            key={i}
            className="light"
            style={{
              left: l.left + "%",
              top: l.top + "%",
              width: l.size + "px",
              height: l.size + "px",
              animationDelay: l.delay + "s",
            }}
          />
        ))}
      </div>

      <main className="relative max-w-4xl mx-auto px-5 py-12">
        <header className="text-center mb-12 fade-up">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">生命之流彩</h1>
          <p className="mt-3 text-white/60 text-sm md:text-base tracking-[0.45em]">流彩盲盒 · Flow of Life</p>
          <p className="mt-7 text-white/60 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            抽一张卡，给生命一点惊喜，为此刻点亮一束光。
          </p>
        </header>

        {phase === "idle" && (
          <section className="max-w-md mx-auto flex flex-col gap-4 fade-up">
            <button className="glow-box p-6 text-center cursor-pointer" onClick={onRandom}>
              <span className="text-white text-lg font-medium">直接抽卡</span>
              <span className="text-white/45 text-sm block mt-1.5">随机配色，抽取此刻的卡片</span>
            </button>

            <div className="glow-box p-6 text-center">
              <span className="text-white text-lg font-medium">一句话抽卡</span>
              <input
                className="input-line text-center mt-4"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onText(); }}
                placeholder="说一句话，如：黄昏的海边"
              />
              <button className="btn btn-primary w-full mt-4" onClick={onText} disabled={!textInput.trim()}>
                抽卡
              </button>
            </div>

            <div className="glow-box p-6 text-center cursor-pointer" onClick={() => fileRef.current?.click()}>
              <span className="text-white text-lg font-medium">上传照片</span>
              <span className="text-white/45 text-sm block mt-1.5">点击上传，从照片取色</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ""; }}
              />
            </div>
          </section>
        )}

        {phase === "generating" && (
          <section className="mt-10 text-center fade-up">
            <div className="inline-block w-11 h-11 rounded-full border-2 border-white/15 border-t-white animate-spin" />
            <p className="mt-5 loading-shimmer text-lg">正在为你绘制这一张卡片…</p>
            <p className="text-xs text-white/40 mt-2">AI 作画中，约需 10~60 秒</p>
          </section>
        )}

        {phase === "done" && palette && abstractImage && quote && (
          <section className="flex flex-col items-center">
            <div className="card-reveal w-full max-w-[420px]">
              <div className="poem-card">
                <img src={abstractImage.dataUri} alt="抽象画" className="card-bg" />
                <div className="card-scrim" />
                <div className="card-logo">生命之流彩 · FLOW OF LIFE</div>
                <div className="card-quote">
                  <p className="card-quote-text" style={longQuote ? { fontSize: "1.15rem" } : undefined}>
                    「{quote.text}」
                  </p>
                  <p className="card-quote-author">
                    —— {quote.author}{quote.source ? "《" + quote.source + "》" : ""}
                  </p>
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

            <div className="glow-box px-5 py-4 mt-6 w-full max-w-[420px] fade-up flex flex-wrap items-center justify-center gap-2">
              {meta.styles.map((s) => (
                <button
                  key={s}
                  className={"btn " + (style === s ? "btn-primary" : "")}
                  onClick={() => onChangeStyle(s)}
                  disabled={busy}
                >
                  {meta.styleLabels[s]}
                </button>
              ))}
              <span className="mx-1 w-px h-6 bg-white/20" />
              <button className="btn" onClick={onDownload}>⬇ 下载</button>
              <button className="btn" onClick={reset}>↩ 返回</button>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-8 text-center text-white/80 text-sm bg-white/10 border border-white/15 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <footer className="text-center text-white/25 text-xs mt-20 tracking-wider">
          一切如其所是 · 处处都是丰盛 · 样样都是完美 · 爱无处不在
        </footer>
      </main>
    </div>
  );
}
