# 生命之流彩 · Flow of Life ✨

> 一个盲盒抽卡应用：上传照片、说一句话，或直接抽取，用色彩与经典语录点亮此刻。

**一切如其所是，处处都是丰盛；样样都是完美，爱无处不在！**

「生命之流彩」是一个盲盒抽卡应用：上传一张照片、说一句话，或直接抽卡，AI 会从画面或文字中提取色彩搭配，生成一幅抽象画，再配上一句经典语录——用色彩与文字，给此刻的你一点启发与光亮。

---

## ✨ 三种抽卡方式

| 方式 | 说明 |
|------|------|
| 🎲 **直接抽卡** | 无需任何输入，一键随机生成和谐配色与卡片 |
| 💬 **一句话抽卡** | 输入一句话，通义千问感受意境，生成契合的配色与抽象画 |
| 🖼️ **照片抽卡** | 上传真实照片，提取主色调生成卡片 |

---

## ✨ 功能特性

- 🎨 **智能取色** — CIE Lab 色彩空间 + K-means 聚类，提取 6 个主色并判断情绪（暖/冷/中性、明/暗）
- 🖼️ **AI 抽象画** — 通义万相文生图，4 种风格 Prompt 模板：流体 / 渐变 / 水彩 / 极光
- 📜 **经典语录** — 64 条真实可查证的经典句子，按画面情绪匹配，标注作者与出处
- 🤖 **Agent 编排** — 感知 → 决策 → 执行 → 组装；通义千问增强意境理解，失败自动降级
- 🖥️ **抽卡式界面** — 黑白灰高级界面 + 发光框，诗句印在画中，可下载竖版诗卡海报

---

## 🛠️ 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 19 · Vite 6 · Tailwind CSS 4 · Canvas |
| 后端 | Node.js 22 · Fastify 5 · TypeScript · sharp |
| AI | 通义万相（图像生成）· 通义千问（意境理解） |
| 工程 | pnpm monorepo · GitHub Actions CI |

---

## 🚀 快速开始

### 1. 环境要求

- Node.js ≥ 20
- pnpm ≥ 9

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置 API Key

```bash
cp .env.example .env
```

编辑 `.env`，填入阿里云百炼 API Key（用于通义万相图像生成与通义千问文字分析）：

```env
DASHSCOPE_API_KEY=sk-你的密钥
```

> Key 获取地址：[百炼控制台](https://bailian.console.aliyun.com/) → API-KEY 管理。`.env` 已被 git 忽略，不会提交到仓库。
> 未配置 Key 时仍可运行（随机色板 + SVG 抽象画 + 名句）。

### 4. 启动

```bash
pnpm dev
```

- 前端：http://localhost:5173 （自动代理 `/api` 到后端）
- 后端：http://localhost:8787

---

## 🚢 部署上线

项目已打包为**单服务**（后端同时托管前端静态文件），可通过 Docker 或 Render 一键部署。

### 方式一：Render（推荐，免费）

1. 把仓库推到 GitHub（已完成）
2. 打开 [render.com](https://render.com)，New → Blueprint，选择本仓库
3. 仓库已含 `render.yaml`，会自动创建服务；在环境变量里填入 `DASHSCOPE_API_KEY` 即可

### 方式二：Docker

```bash
docker build -t color-poet .
docker run -p 8787:8787 --env-file .env color-poet
```

然后访问 http://localhost:8787

### 方式三：任意 Node 服务器

```bash
pnpm install
pnpm build
node apps/api/dist/index.js
```

---

## 📡 API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/generate` | 上传图片抽卡 |
| POST | `/api/text-card` | 一句话抽卡 |
| POST | `/api/random-card` | 直接抽卡（随机） |
| POST | `/api/palette` | 仅提取照片调色板 |
| POST | `/api/quote` | 换一句名句 |
| POST | `/api/abstract` | 切换抽象画风格 |
| GET | `/api/health` | 健康检查 |
| GET | `/api/meta` | 前端配置 |

---

## 📜 名句来源说明

语录库精选 64 条真实可查证的经典句子，主要来自老子、庄子、苏格拉底、亚里士多德、罗素、维特根斯坦、尼采、加缪、泰戈尔、莎士比亚、海明威、圣埃克苏佩里、村上春树等哲学家、文学家与诗人，也包括杨定一、一行禅师、克里希那穆提、拜伦·凯蒂、拉玛那·马哈希、埃克哈特·托利等人的作品。所有条目均标注作者与出处。

---

## 📄 License

[MIT](./LICENSE)
