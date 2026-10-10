import type { Quote } from "../types";

export function QuotePanel({ quote, onRefresh }: { quote: Quote; onRefresh: () => void }) {
  const langLabel = quote.lang === "classical" ? "古典诗词" : quote.lang === "translated" ? "译作" : "中文现代";
  return (
    <div className="glass p-7 flex flex-col justify-between h-full min-h-[320px]">
      <div>
        <div className="text-4xl leading-snug font-serif-cn">「{quote.text}」</div>
      </div>
      <div className="flex items-end justify-between gap-3 mt-8">
        <div>
          <div className="text-sm text-white/75">
            —— {quote.author}{quote.source ? "《" + quote.source + "》" : ""}
          </div>
          <div className="text-xs text-white/35 mt-1.5">{langLabel}</div>
        </div>
        <button className="btn btn-ghost !px-3.5 !py-1.5 text-sm shrink-0" onClick={onRefresh}>
          ↻ 换一句
        </button>
      </div>
    </div>
  );
}
