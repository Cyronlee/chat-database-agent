# Chat Database Agent

[English](./README.md)

一个使用自然语言与数据库交互的 Next.js 应用程序。内置 AI 功能，帮助用户查询和可视化数据。

## 功能特性

### 🤖 AI 智能对话
使用自然语言与数据库对话，AI 驱动的智能查询。

![AI Agent](./public/img/agent.png)

### 📊 交互式仪表板
创建和自定义仪表板，使用多种图表类型可视化数据。

![Dashboard](./public/img/dashboard.png)

### 🔍 数据工作室
探索数据库架构，编写 SQL 查询并查看可视化结果。

![Data Studio](./public/img/data-studio.png)

## 技术栈

- **运行时**: Bun / Node.js
- **框架**: Next.js 15
- **语言**: TypeScript
- **样式**: Tailwind CSS, Shadcn/ui
- **数据库 ORM**: Prisma
- **AI**: Google Generative AI

## 快速开始

### 一键启动（推荐）

最简单的启动方式是使用启动脚本：

```bash
./start.sh
```

此脚本将：

1. 启动 **系统数据库**（PostgreSQL 端口 5433）- 存储用户数据和应用程序数据
2. 启动 **Northwind 数据库**（PostgreSQL 端口 5434）- 用于查询的示例数据库
3. 初始化并填充系统数据库（如果需要）
4. 启动 Next.js 开发服务器

**要求：**

- Docker（必须正在运行）
- 以下之一：bun、pnpm 或 npm

### 默认登录凭据

启动后，您可以使用以下凭据登录：

- **邮箱**: admin@example.com
- **密码**: 123456

Northwind 示例数据库将自动添加为外部数据库连接。

## 手动设置

### 1. 仅启动系统数据库

```bash
# 如果目录不存在，创建 db/system-database 目录
mkdir -p db/system-database

# 为 system-db 创建 Dockerfile
cat > db/system-database/Dockerfile << 'EOF'
FROM postgres:15-alpine

ENV POSTGRES_DB=chat_database_agent
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

EXPOSE 5432
EOF

# 构建并运行
docker build -t system-db-image -f db/system-database/Dockerfile db/system-database
docker run -d --name system-db -p 5433:5432 system-db-image
```

### 2. 仅启动 Northwind 数据库

```bash
# 构建并运行
docker build -t northwind-db-image -f db/northwind-database/Dockerfile db/northwind-database
docker run -d --name northwind-db -p 5434:5432 northwind-db-image
```

### 3. 配置环境变量

复制示例环境文件并更新：

```bash
cp .env.example .env
```

使用您的设置更新 `.env`：

```env
# Google Generative AI API Key
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key-here

# 系统数据库（用于用户数据和应用程序数据）
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/chat_database_agent?schema=public"
```

### 4. 初始化数据库

```bash
# 安装依赖
bun install

# 运行迁移
bun run prisma migrate deploy

# 填充数据库
bun run prisma db seed
```

### 5. 启动开发服务器

```bash
bun run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

## 数据库连接信息

| 数据库     | 主机      | 端口 | 数据库名            | 用户名   | 密码     |
| ---------- | --------- | ---- | ------------------- | -------- | -------- |
| 系统数据库 | localhost | 5433 | chat_database_agent | postgres | postgres |
| Northwind  | localhost | 5434 | northwind           | postgres | postgres |

## Docker 命令

### 停止数据库

```bash
docker stop system-db northwind-db
```

### 删除容器

```bash
docker rm system-db northwind-db
```

### 查看日志

```bash
docker logs system-db
docker logs northwind-db
```

### 重置数据库

```bash
# 停止并删除容器
docker stop system-db northwind-db
docker rm system-db northwind-db

# 删除镜像（可选，用于完全重建）
docker rmi system-db-image northwind-db-image

# 使用 start.sh 重新启动
./start.sh
```

## 项目结构

```
├── agent/              # AI 代理配置
├── api-clients/        # API 客户端函数
├── app/                # Next.js 应用目录
│   ├── (main)/         # 主应用程序路由
│   └── api/            # API 路由
├── components/         # React 组件
│   ├── ai-elements/    # AI 相关组件
│   ├── chart/          # 图表组件
│   ├── chat/           # 聊天组件
│   └── ui/             # Shadcn/ui 组件
├── db/                 # 数据库配置
│   ├── northwind-database/ # Northwind 示例数据库
│   └── system-database/    # 系统数据库配置
├── lib/                # 工具函数
├── prisma/             # Prisma 模式和迁移
└── tools/              # AI 工具
```

## 了解更多

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [Shadcn/ui 文档](https://ui.shadcn.com)
- [Google AI SDK](https://ai.google.dev)

