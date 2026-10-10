import type { AnimalResult } from "../types";

const EMOJI: Record<string, string> = {
  "柴犬": "🐕", "橘猫": "🐱", "小猫": "🐱", "小鹿": "🦌", "兔子": "🐰", "白兔": "🐇",
  "熊猫": "🐼", "龙猫": "🐹", "柯基": "🐶", "小熊": "🐻", "雪狐": "🦊", "企鹅": "🐧",
  "小企鹅": "🐧", "鲸鱼": "🐳", "猫头鹰": "🦉", "海豹": "🦭", "雪鸮": "🦉", "北极熊": "🐻‍❄️",
  "仓鼠": "🐹", "水獭": "🦦", "刺猬": "🦔", "树懒": "🦥",
};

export function AnimalPanel({ animal, paletteHex }: { animal: AnimalResult; paletteHex: string[] }) {
  return (
    <div className="img-frame aspect-square relative">
      {animal.imageDataUri ? (
        <img src={animal.imageDataUri} alt={animal.name} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center"
          style={{
            background:
              "linear-gradient(135deg, " + (paletteHex[0] ?? "#3a3a4a") + ", " + (paletteHex[1] ?? "#1c1c28") + ")",
          }}
        >
          <span className="text-7xl floaty">{EMOJI[animal.name] ?? "🐾"}</span>
          <span className="text-white/95 font-medium text-lg">{animal.name}</span>
          <span className="text-xs text-white/60 leading-relaxed">
            配置 API Key 后，将用通义万相为你生成专属动漫{animal.name}
          </span>
        </div>
      )}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/45 backdrop-blur text-xs text-white/90">
        🐾 {animal.name}
      </div>
    </div>
  );
}
