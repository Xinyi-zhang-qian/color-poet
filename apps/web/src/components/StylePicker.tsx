import type { AbstractStyle } from "../types";

interface Props {
  styles: AbstractStyle[];
  labels: Record<AbstractStyle, string>;
  current: AbstractStyle;
  onChange: (s: AbstractStyle) => void;
}

export function StylePicker({ styles, labels, current, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {styles.map((s) => (
        <button
          key={s}
          className={"btn !px-4 !py-1.5 text-sm " + (current === s ? "btn-primary" : "btn-ghost")}
          onClick={() => onChange(s)}
        >
          {labels[s]}
        </button>
      ))}
    </div>
  );
}
