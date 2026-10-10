import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`缺少环境变量 ${name}，请复制 .env.example 为 .env 并填写`);
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  dashscopeApiKey: process.env.DASHSCOPE_API_KEY ?? "",
  wanxModel: process.env.WANX_MODEL ?? "wanx2.1-t2i-turbo",
  qwenModel: process.env.QWEN_MODEL ?? "qwen-plus",
  // 百炼地域（华北2北京）
  dashscopeBase: "https://dashscope.aliyuncs.com",
  uploadDir: new URL("./uploads/", import.meta.url).pathname,
  outputDir: new URL("./generated/", import.meta.url).pathname,
} as const;

export function hasDashscopeKey(): boolean {
  return config.dashscopeApiKey.length > 0 && !config.dashscopeApiKey.includes("xxxx");
}
