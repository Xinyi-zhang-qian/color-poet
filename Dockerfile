FROM node:22-alpine

WORKDIR /app

# 启用 pnpm
RUN corepack enable

# 复制项目文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY tsconfig.base.json ./

# 安装依赖并构建
RUN pnpm install --frozen-lockfile
RUN pnpm build

ENV NODE_ENV=production
ENV PORT=8787

EXPOSE 8787

CMD ["node", "apps/api/dist/index.js"]
