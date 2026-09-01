# 幻乐笔记

一个轻量级移动端笔记应用，移动端使用 React Native (Expo)，后端使用 Express + Prisma + MySQL。

## 功能

### 核心功能
- **账号系统**：邮箱/用户名注册、登录、修改昵称、修改密码
- **笔记管理**：创建、编辑、删除、收藏（置顶）
- **本地持久化登录**：JWT token 存 AsyncStorage，自动续期

### 扩展功能
- **Markdown 文本编辑**：纯文本输入，支持 Markdown 语法（前端展示）
- **标签系统**：每篇笔记可贴多个标签，按标签筛选
- **关键词搜索**：标题 + 内容模糊匹配
- **回收站**：软删除 + 恢复 + 永久删除 + 一键清空
- **收藏快捷过滤**：列表页一键查看所有置顶笔记
- **下拉刷新**：列表页/回收站支持手动刷新

## 技术栈

### 后端 (server/)
| 库 | 版本 | 用途 |
|---|---|---|
| Express | ^4.21 | HTTP 框架 |
| Prisma | ^5.22 | ORM |
| MySQL | 8.x | 数据库 |
| jsonwebtoken | ^9.0 | JWT 签发/校验 |
| bcryptjs | ^2.4 | 密码哈希 |
| zod | ^3.23 | 请求参数校验 |
| helmet / cors / morgan | latest | 安全/跨域/日志 |

### 前端 (mobile/)
| 库 | 版本 | 用途 |
|---|---|---|
| expo | ~51.0 | Expo SDK |
| react-native | 0.74.5 | 跨端渲染 |
| @react-navigation | ^6 | 路由（native-stack + bottom-tabs）|
| zustand | ^4.5 | 状态管理 |
| @react-native-async-storage/async-storage | ^1.23 | 本地存储 |
| react-native-reanimated / gesture-handler | latest | 交互底层依赖 |

## 目录结构

```
clound_note/
├── server/                          # 后端
│   ├── prisma/
│   │   ├── schema.prisma           # 数据模型
│   │   └── seed.ts                  # 演示数据
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts             # 注册/登录/资料/密码
│   │   │   ├── notes.ts            # 笔记 CRUD + 回收站
│   │   │   └── tags.ts             # 标签 CRUD
│   │   ├── middlewares/
│   │   │   ├── auth.ts             # JWT 鉴权
│   │   │   └── error.ts            # 统一错误处理
│   │   ├── lib/prisma.ts           # Prisma 客户端单例
│   │   ├── utils/
│   │   │   ├── jwt.ts              # JWT 工具
│   │   │   └── ApiError.ts         # 自定义错误类
│   │   └── index.ts                # Express 入口
│   ├── .env.example
│   └── package.json
│
└── mobile/                          # 前端
    ├── src/
    │   ├── lib/
    │   │   ├── api.ts               # fetch 封装 + API 调用
    │   │   ├── storage.ts           # token / user 持久化
    │   │   └── config.ts            # API 地址等配置
    │   ├── stores/
    │   │   ├── authStore.ts         # 登录/注册/用户
    │   │   └── noteStore.ts         # 笔记/标签/回收站
    │   ├── screens/
    │   │   ├── LoginScreen.tsx
    │   │   ├── RegisterScreen.tsx
    │   │   ├── NotesListScreen.tsx  # 列表 + 搜索 + 过滤
    │   │   ├── NoteEditorScreen.tsx # 编辑 + 收藏 + 标签
    │   │   ├── TrashScreen.tsx      # 回收站
    │   │   └── SettingsScreen.tsx   # 资料修改 + 密码 + 标签管理
    │   ├── components/
    │   │   ├── NoteCard.tsx
    │   │   ├── EmptyState.tsx
    │   │   └── TagChip.tsx
    │   ├── navigation/AppNavigator.tsx
    │   └── theme.ts
    ├── App.tsx
    ├── app.json
    ├── babel.config.js
    ├── tsconfig.json
    └── package.json
```

## 快速开始

### 1. 准备 MySQL

```bash
# 本地安装 MySQL 8.x，或用 Docker
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=clound_note \
  -p 3306:3306 \
  mysql:8
```

### 2. 启动后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填入实际的 DATABASE_URL / JWT_SECRET

npm install
npx prisma generate                  # 生成 Prisma Client
npx prisma db push                   # 把 schema 推到数据库（dev 用，会自动建库）
npm run seed                          # 写入演示账号
npm run dev                          # 监听 http://localhost:3000
```

> 注：用 `db push` 而不是 `migrate dev` 是因为 MySQL 8 严格模式不允许 TEXT 列设默认值，dev 阶段 db push 更省心。生产部署时再用 `prisma migrate dev` 生成正式迁移文件。

演示账号：`demo@clound.note` / `123456`，也可用 `demo` 作为用户名登录。

健康检查：访问 `http://localhost:3000/health` 应返回 `{"status":"ok",...}`

### 3. 启动前端

```bash
cd mobile
npm install

# 改 API 地址（指向你的电脑 IP，而非 localhost，因为模拟器/真机访问不到）
# 方式 1：编辑 src/lib/config.ts 里的默认 API_BASE_URL
# 方式 2：用环境变量（需配合 .env 文件 + EXPO_PUBLIC_API_BASE_URL）

npx expo start
# 按 i 打开 iOS 模拟器 / a 打开 Android 模拟器 / 扫码用 Expo Go 真机调试
```

> **真机调试注意**：模拟器里 `localhost` 指向宿主机；真机必须改成电脑的局域网 IP，例如 `http://192.168.1.100:3000/api`，且手机和电脑要在同一 WiFi。

## API 文档

Base URL: `/api`

| Method | Path | 鉴权 | 描述 |
|---|---|---|---|
| GET | /health | - | 健康检查 |
| POST | /auth/register | - | 注册（email/username/password）|
| POST | /auth/login | - | 登录（account=邮箱或用户名 + password）|
| GET | /auth/me | ✅ | 获取当前用户 |
| PUT | /auth/profile | ✅ | 修改昵称/头像 |
| PUT | /auth/password | ✅ | 修改密码 |
| GET | /notes?keyword=&tagId=&trashed=&pinnedOnly=&limit=&offset= | ✅ | 笔记列表（分页/搜索/过滤）|
| GET | /notes/:id | ✅ | 笔记详情 |
| POST | /notes | ✅ | 新建笔记 |
| PUT | /notes/:id | ✅ | 编辑笔记 |
| DELETE | /notes/:id | ✅ | 软删除（已删除则永久删除）|
| POST | /notes/:id/restore | ✅ | 从回收站恢复 |
| DELETE | /notes/trash/empty | ✅ | 清空回收站 |
| GET | /tags | ✅ | 标签列表 |
| POST | /tags | ✅ | 新建标签 |
| PUT | /tags/:id | ✅ | 修改标签 |
| DELETE | /tags/:id | ✅ | 删除标签 |

错误返回：`{ "code": "xxx", "message": "中文说明" }`，HTTP 状态码与错误一致。

## 数据模型

- **User**: id / email(唯一) / username(唯一) / passwordHash / nickname / avatar / 时间戳
- **Tag**: id / name / color / userId（每个用户标签名唯一）
- **Note**: id / title / content(LongText) / userId / pinned / deletedAt(软删除) / 时间戳，与 Tag 多对多
- **RevokedToken**: 用于登出 token 黑名单（已建表，留作后续接入）

## 后续可扩展

- [ ] 笔记版本历史（已有 `note_revision` 设计思路，加表即可）
- [ ] 离线编辑 + 增量同步（接 WatermelonDB 或自实现 `last_sync_at` 游标）
- [ ] 图片/附件上传（接对象存储或本地文件 + 静态资源服务）
- [ ] 多端共享/实时同步（Supabase Realtime 或 Socket.io）
- [ ] Markdown 渲染（接入 `react-native-markdown-display`）
- [ ] 笔记导出（PDF / Markdown 文件）
- [ ] 双因素认证、邮箱验证
