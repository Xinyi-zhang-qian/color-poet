import { config, hasDashscopeKey } from "../config.js";

const SUBMIT_URL = `${config.dashscopeBase}/api/v1/services/aigc/text2image/image-synthesis`;
const taskUrl = (id: string) => `${config.dashscopeBase}/api/v1/tasks/${id}`;

type TaskStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED" | "UNKNOWN";

interface TaskOutput {
  task_id: string;
  task_status: TaskStatus;
  results?: { url: string }[];
  code?: string;
  message?: string;
}

export interface GenerateOptions {
  prompt: string;
  size?: string;
  n?: number;
  seed?: number;
  negativePrompt?: string;
}

export interface GeneratedImage {
  url: string;
  buffer: Buffer;
}

function assertKey(): void {
  if (!hasDashscopeKey()) {
    throw new Error("未配置 DASHSCOPE_API_KEY，请在 .env 中填写阿里云百炼 API Key");
  }
}

/** 提交异步文生图任务，返回 task_id */
export async function submitText2Image(opts: GenerateOptions): Promise<string> {
  assertKey();
  const body: Record<string, unknown> = {
    model: config.wanxModel,
    input: { prompt: opts.prompt },
    parameters: {
      size: opts.size ?? "1024*1024",
      n: opts.n ?? 1,
      ...(opts.seed !== undefined ? { seed: opts.seed } : {}),
      ...(opts.negativePrompt ? { negative_prompt: opts.negativePrompt } : {}),
    },
  };

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.dashscopeApiKey}`,
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({}))) as { output?: { task_id?: string }; message?: string; code?: string };
  if (!res.ok || !json.output?.task_id) {
    const detail = json.message ?? JSON.stringify(json);
    throw new Error(`万相任务提交失败(${res.status})：${detail}`);
  }
  return json.output.task_id;
}

/** 查询异步任务状态 */
export async function getTask(taskId: string): Promise<TaskOutput> {
  assertKey();
  const res = await fetch(taskUrl(taskId), {
    headers: { Authorization: `Bearer ${config.dashscopeApiKey}` },
  });
  const json = (await res.json().catch(() => ({}))) as { output?: Partial<TaskOutput>; message?: string };
  if (!res.ok) {
    throw new Error(`万相任务查询失败(${res.status})：${json.message ?? JSON.stringify(json)}`);
  }
  const out = json.output ?? {};
  return {
    task_id: out.task_id ?? taskId,
    task_status: out.task_status ?? "UNKNOWN",
    results: out.results,
    code: out.code,
    message: out.message,
  };
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`下载生成图片失败(${res.status})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error("下载到的图片数据异常");
  return buf;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 提交并轮询直到成功，返回图片 URL 与二进制数据（转存到本地内存） */
export async function generateImage(opts: GenerateOptions, timeoutMs = 180_000): Promise<GeneratedImage> {
  const taskId = await submitText2Image(opts);
  const deadline = Date.now() + timeoutMs;
  let lastStatus = "";

  while (Date.now() < deadline) {
    await sleep(3000);
    const out = await getTask(taskId);
    lastStatus = out.task_status;

    if (out.task_status === "SUCCEEDED") {
      const url = out.results?.[0]?.url;
      if (!url) throw new Error("任务成功但未返回图片链接");
      const buffer = await downloadImage(url);
      return { url, buffer };
    }
    if (out.task_status === "FAILED" || out.task_status === "CANCELED") {
      throw new Error(out.message ?? `图像生成${out.task_status === "FAILED" ? "失败" : "被取消"}`);
    }
    // PENDING / RUNNING 继续轮询
  }
  throw new Error(`图像生成超时（最后状态：${lastStatus}）`);
}
