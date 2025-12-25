# 外部数据库连接 - 技术方案

## 一、架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├──────────────────┬──────────────────┬───────────────────────────┤
│  DatabaseSwitcher │   Data Studio    │      Agent Chat           │
│    (Sidebar)      │                  │                           │
└────────┬─────────┴────────┬─────────┴─────────────┬─────────────┘
         │                  │                        │
         ▼                  ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Zustand Store (useDatabaseStore)               │
│              selectedDatabaseId | databases[]                    │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend APIs                             │
├─────────────────┬─────────────────┬─────────────────────────────┤
│ /api/databases  │ /api/database   │     /api/chat               │
│   (CRUD)        │ /query /schema  │  (动态注入 schema)           │
└────────┬────────┴────────┬────────┴────────────┬────────────────┘
         │                 │                      │
         ▼                 ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Database Connection Manager (lib/db-manager.ts)     │
│                    getConnection(databaseId)                     │
└────────┬────────────────────────────────────────────────────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐  ┌───────────────┐
│System │  │External DBs   │
│ DB    │  │(PostgreSQL)   │
│(Prisma)│  │               │
└───────┘  └───────────────┘
```

---

## 二、数据模型变更

### Prisma Schema 新增

```prisma
model external_databases {
  id              BigInt    @id @default(autoincrement())
  name            String
  host            String
  port            Int       @default(5432)
  database        String
  username        String
  password        String    // 明文存储（用于连接）
  ssl_enabled     Boolean   @default(false)
  created_by      BigInt?
  row_created_at  DateTime? @default(now()) @db.Timestamptz(6)
  row_updated_at  DateTime? @db.Timestamptz(6)
  creator         users?    @relation(fields: [created_by], references: [id])
  custom_charts   custom_charts[]
}
```

### 关联变更

- `custom_charts` 添加 `database_id` 字段（chart 绑定特定数据库）
- `custom_dashboards` **不添加** `database_id`（dashboard 可包含不同数据库的 charts）

---

## 三、核心模块

### 1. 数据库连接管理器

**文件**: `lib/db-manager.ts`

**职责**:

- 管理外部数据库连接池
- 提供统一的查询接口
- 连接缓存与复用

**核心接口**:

```typescript
interface DatabaseManager {
  getConnection(databaseId: string): Promise<PoolClient>
  executeQuery(databaseId: string, sql: string): Promise<QueryResult>
  getSchema(databaseId: string): Promise<TableSchema[]>
  testConnection(config: ConnectionConfig): Promise<boolean>
}
```

### 2. 全局状态管理

**文件**: `stores/database-store.ts`

**职责**:

- 存储当前选中的数据库 ID
- 管理数据库列表缓存
- 提供切换/刷新操作

**核心状态**:

```typescript
interface DatabaseStore {
  selectedDatabaseId: string | null
  databases: ExternalDatabase[]
  isLoading: boolean
  setSelectedDatabase: (id: string | null) => void
  fetchDatabases: () => Promise<void>
}
```

### 3. DatabaseSwitcher 组件

**文件**: `components/sidebar/database-switcher.tsx`

**职责**:

- 显示当前选中的数据库
- 提供下拉选择切换
- 空状态提示创建数据库

**UI 参考**: `components/sidebar/team-switcher.tsx`

### 4. 动态 Schema 注入

**背景**: 当前 `agent/chat-database-agent.ts` 中 `DATABASE_SCHEMA` 是硬编码的，需要改为动态获取

**方案**:

```
┌──────────────────────────────────────────────────────────────┐
│                      /api/chat                                │
│                                                               │
│  1. 接收 databaseId 参数                                      │
│  2. 调用 db-manager.getSchema(databaseId) 获取表结构          │
│  3. 格式化 schema 为 Markdown                                 │
│  4. 动态拼接 SYSTEM_PROMPT + schema                          │
│  5. 传递给 streamText                                        │
└──────────────────────────────────────────────────────────────┘
```

**相关函数**:

```typescript
// lib/agent-prompt.ts
function buildSystemPrompt(schema: TableSchema[]): string
function formatSchemaAsMarkdown(schema: TableSchema[]): string
```

### 5. 数据库 URL 解析

**文件**: `lib/db-url-parser.ts`

**职责**: 前端支持输入 PostgreSQL URL，自动解析为各字段

**URL 格式**:

```
postgresql://username:password@host:port/database?sslmode=require
```

**核心函数**:

```typescript
interface ParsedDatabaseUrl {
  host: string
  port: number
  database: string
  username: string
  password: string
  sslEnabled: boolean
}

function parseDatabaseUrl(url: string): ParsedDatabaseUrl | null
```

---

## 四、API 变更

### 新增 API

| 路径                       | 方法   | 描述               |
| -------------------------- | ------ | ------------------ |
| `/api/databases`           | GET    | 获取数据库列表     |
| `/api/databases`           | POST   | 创建数据库连接     |
| `/api/databases/[id]`      | GET    | 获取单个数据库详情 |
| `/api/databases/[id]`      | PUT    | 更新数据库连接     |
| `/api/databases/[id]`      | DELETE | 删除数据库连接     |
| `/api/databases/[id]/test` | POST   | 测试数据库连接     |

### 现有 API 改造

| 路径                   | 变更                                             |
| ---------------------- | ------------------------------------------------ |
| `/api/database/query`  | 新增 `databaseId` 参数                           |
| `/api/database/schema` | 新增 `databaseId` 查询参数                       |
| `/api/chat`            | 新增 `databaseId`，动态获取 schema 注入到 prompt |

---

## 五、相关文件清单

### 新增文件

```
lib/
  ├── db-manager.ts              # 数据库连接管理器
  ├── db-url-parser.ts           # 数据库 URL 解析
  └── agent-prompt.ts            # 动态 prompt 构建

stores/
  └── database-store.ts          # Zustand 状态管理

api-clients/
  └── databases.ts               # 数据库 API 客户端

app/api/databases/
  ├── route.ts                   # GET/POST 数据库列表
  └── [id]/
      ├── route.ts               # GET/PUT/DELETE 单个数据库
      └── test/
          └── route.ts           # POST 测试连接

app/(main)/databases/
  └── page.tsx                   # 数据库管理页面

components/
  └── sidebar/
      └── database-switcher.tsx  # 数据库切换组件
  └── databases/
      ├── database-list.tsx      # 数据库列表
      ├── database-form.tsx      # 创建/编辑表单（支持 URL 输入）
      └── database-test-button.tsx
```

### 需修改文件

```
prisma/
  └── schema.prisma              # 新增 external_databases 表

agent/
  └── chat-database-agent.ts     # 移除硬编码 schema，改用动态注入

app/api/database/
  ├── query/route.ts             # 支持 databaseId 参数
  └── schema/route.ts            # 支持 databaseId 参数

app/api/chat/
  └── route.ts                   # 动态获取 schema，注入 prompt

tools/
  └── database-query.ts          # 支持动态数据库连接

components/sidebar/
  └── app-sidebar.tsx            # 集成 DatabaseSwitcher

components/chat/
  └── chat-window.tsx            # 传递 databaseId

app/(main)/data-studio/
  └── page.tsx                   # 使用全局数据库状态

api-clients/
  └── database-query.ts          # 支持 databaseId 参数
```

---

## 六、实施顺序

1. **Phase 1 - 基础设施**

   - Prisma schema 变更
   - 数据库连接管理器
   - 数据库 URL 解析器
   - Zustand store

2. **Phase 2 - 数据库管理**

   - 数据库 CRUD API
   - 数据库管理页面（支持 URL 输入）
   - 连接测试功能

3. **Phase 3 - 功能改造**

   - DatabaseSwitcher 组件
   - query/schema API 改造
   - Data Studio 改造

4. **Phase 4 - Agent 集成**

   - 动态 prompt 构建函数
   - chat API 改造（动态注入 schema）
   - database-query tool 改造

---

## 七、安全考虑

- 数据库密码明文存储（连接需要）
- API 需要验证用户权限
- 列表接口不返回 password 字段
- SQL 注入防护（已有）
