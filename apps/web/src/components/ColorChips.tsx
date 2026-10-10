import { useState } from "react";
import type { Palette } from "../types";

const moodLabels: Record<string, string> = { warm: "温暖", cool: "清冷", neutral: "中性" };
const brightLabels: Record<string, string> = { light: "明亮", dark: "深沉", balanced: "柔和" };

export function ColorChips({ palette }: { palette: Palette }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (hex: string) => {
    navigator.clipboard?.writeText(hex).catch(() => {});
    setCopied(hex);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-stone-500">主色调</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
          {moodLabels[palette.mood]} · {brightLabels[palette.brightness]}
        </span>
      </div>
      <div className="flex gap-2.5">
        {palette.colors.map((c) => (
          <button
            key={c.hex}
            className="swatch flex-1 h-16"
            style={{ background: c.hex }}
            onClick={() => copy(c.hex)}
            title="点击复制色值"
          >
            <span
              className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-mono whitespace-nowrap"
              style={{ color: c.textColor }}
            >
              {copied === c.hex ? "✓ 已复制" : c.hex}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
