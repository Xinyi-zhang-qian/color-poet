import { useRef, useState } from "react";

export function UploadZone({ onFile }: { onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      className={"dropzone" + (dragging ? " dragging" : "")}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
      <div className="text-6xl floaty">🖼️</div>
      <div>
        <p className="text-lg font-medium text-stone-700">拖入或点击上传一张照片</p>
        <p className="text-sm text-stone-400 mt-1">支持 JPG / PNG，建议自然风景或生活照片</p>
      </div>
    </div>
  );
}
