# 考研数学 · 每日复习

> 一个为考研数学考生打造的全栈复习工具。支持每日 AI 生成统一复习题目、公式背诵、做题记录、错题本和章节掌握度统计。

## 功能特性

- **每日复习** — 每天 00:01 自动生成 5 道针对薄弱知识点的复习题（所有用户题目相同），支持手动即时生成
- **智能练习** — 支持选择题自动判分、填空/解答题自评，做题后立即查看答案与解析
- **错题本** — 自动记录错题，支持错题重做
- **收藏功能** — 收藏题目和公式，快速回顾
- **掌握度统计** — 按章节统计正确率，雷达图可视化
- **公式背诵** — 常用考研数学公式，支持 KaTeX 渲染
- **用户系统** — JWT 认证，数据严格隔离

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Pinia + Vue Router + KaTeX |
| 后端 | Node.js + Express + SQLite (sql.js WASM) |
| 认证 | JWT (jsonwebtoken) + bcryptjs |
| AI | MiniMax API (`MiniMax-M2.7`) |
| 定时任务 | node-cron |

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/pianhua/math-review.git
cd math-review
```

### 2. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..
```

### 3. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# 必填：JWT 密钥（生产环境务必更换为强随机字符串）
JWT_SECRET=your-super-secret-key-here

# 可选：MiniMax API Key（不配置则 AI 生成退化为题库智能抽取）
MINIMAX_API_KEY=sk-xxx
```

### 4. 初始化数据库

```bash
npm run init-db
```

### 5. 启动开发服务器

```bash
npm run dev
```

前端 `http://localhost:5173`，后端 `http://localhost:3000`，API 请求已通过 Vite proxy 自动转发。

## 项目结构

```
math-review/
├── src/                        # 前端源码
│   ├── api/                    # API 客户端模块
│   ├── pages/                  # 页面组件
│   │   ├── HomePage.vue        # 首页（今日复习、掌握度）
│   │   ├── PracticePage.vue    # 做题页面（支持选择/填空/解答）
│   │   ├── FormulaPage.vue     # 公式背诵
│   │   ├── ErrorsPage.vue      # 错题本
│   │   ├── MasteryPage.vue     # 掌握度统计（雷达图）
│   │   ├── LoginPage.vue       # 登录
│   │   └── RegisterPage.vue    # 注册
│   ├── stores/auth.js          # Pinia 认证状态
│   ├── utils/latex.js          # KaTeX 渲染工具
│   └── styles/main.css         # 全局样式
│
├── server/                     # 后端源码
│   ├── server.js               # Express 入口
│   ├── db.js                   # SQLite 连接与初始化
│   ├── init-db.js              # 数据库迁移与种子数据
│   ├── cron.js                 # 定时任务（每日复习生成）
│   ├── middleware/auth.js      # JWT 中间件
│   ├── routes/                 # API 路由
│   │   ├── auth.js             # 注册/登录/Me
│   │   ├── problems.js         # 题目 CRUD（多模式支持）
│   │   ├── attempts.js         # 做题记录
│   │   ├── bookmarks.js        # 收藏
│   │   ├── errors.js           # 错题本
│   │   ├── mastery.js          # 掌握度统计
│   │   ├── dailyReview.js      # 每日复习
│   │   └── formulas.js         # 公式
│   └── services/ai.js          # MiniMax AI 题目生成
│
├── package.json                # 前端依赖与脚本
├── vite.config.js              # Vite 配置（含 API proxy）
└── .env.example                # 环境变量模板
```

## 核心设计

### 每日复习生成逻辑

1. **收集数据**：分析全站用户最近做题记录，统计各章节正确率
2. **识别薄弱点**：正确率 `< 70%` 的章节标记为"薄弱"
3. **AI 生成**：调用 MiniMax API 生成 5 道针对性选择题（所有用户共享同一套题目）
4. **Fallback**：无 API Key 时，自动从题库按薄弱章节智能抽取

### 做题流程

| 题型 | 交互方式 | 判分 |
|------|----------|------|
| 选择题 | A/B/C/D 按钮点击 | 自动判断 |
| 填空题 | 单行输入 → 提交 → 显示答案+解析 → 自评 | 学生自评 |
| 解答题 | 多行输入 → 提交 → 显示答案+解析 → 自评 | 学生自评 |

### 数据隔离

- `daily_reviews` 表为**全局**（`review_date` 唯一），所有用户每日题目相同
- `attempts`、`bookmarks`、`errors`、`mastery_stats` 为**用户级**，严格按 `user_id` 过滤

## 数据库 Schema

- `users` — 用户
- `problems` — 题目（含 AI 生成标记 `is_ai_generated`）
- `formulas` — 公式
- `bookmarks` — 收藏
- `attempts` — 做题记录
- `errors` — 错题本（从 attempts 自动聚合）
- `daily_reviews` — 每日复习（全局）
- `mastery_stats` — 章节掌握度统计

详见 `server/db.js` 和 `server/init-db.js`。

## API 概览

| Method | Path | Auth | 说明 |
|--------|------|------|------|
| POST | `/api/auth/register` | 否 | 注册 |
| POST | `/api/auth/login` | 否 | 登录 |
| GET | `/api/auth/me` | 是 | 当前用户 |
| GET | `/api/formulas` | 是 | 公式列表 |
| GET | `/api/problems?mode=` | 是 | 题目列表（daily/all/chapter/bookmark/wrong） |
| POST | `/api/attempts` | 是 | 提交做题记录 |
| GET | `/api/bookmarks` | 是 | 收藏列表 |
| POST | `/api/bookmarks` | 是 | 添加收藏 |
| DELETE | `/api/bookmarks/:id` | 是 | 取消收藏 |
| GET | `/api/errors` | 是 | 错题本 |
| GET | `/api/mastery` | 是 | 掌握度统计 |
| GET | `/api/daily-review` | 是 | 今日复习 |
| POST | `/api/daily-review/generate` | 是 | 手动生成今日复习 |

## 开发说明

### 单独启动后端

```bash
cd server && node server.js
```

### 单独启动前端

```bash
npx vite
```

### 重新初始化数据库（会清空数据）

```bash
npm run init-db
```

### 前端代理配置

`vite.config.js` 中已配置 `/api` 代理到 `http://localhost:3000`，开发时无需处理跨域。

## 注意事项

- **JWT_SECRET**：生产环境必须设置为强随机字符串，切勿使用默认值
- **SQLite**：使用 `sql.js`（WASM 版），数据库以文件形式持久化在 `server/database.sqlite`
- **AI 题目**：每天调用 1 次 MiniMax API（与用户数无关），5 道题共享给所有用户，节省 Token

## License

MIT
