# 幻乐笔记 部署文档(宝塔面板版)

本文档以宝塔面板为主要部署环境,覆盖后端 (server/) Node.js 服务 + MySQL 数据库 + Nginx 反代 + HTTPS 证书一条龙。前端打包为 APK / IPA 后用户安装即可。

---

## 一、服务器环境准备

### 1.1 系统要求

- Linux 服务器(CentOS 7+ / Ubuntu 18.04+ / Debian 10+)
- 1 核 2G 内存起步(推荐 2 核 4G)
- 已开放端口:80、443、22,可选 3000(仅调试)

### 1.2 安装宝塔面板

SSH 连上服务器,执行官方安装脚本:

```bash
# Ubuntu / Debian
wget -O install.sh https://download.bt.cn/install/install-ubuntu_6.0.sh && bash install.sh ed8484bec

# CentOS
yum install -y wget && wget -O install.sh https://download.bt.cn/install/install_6.0.sh && sh install.sh ed8484bec
```

安装完成后,宝塔会显示 **面板地址、账号、密码**,保存好。

### 1.3 软件商店装必备组件

登录宝塔面板 → 左侧 **软件商店**,搜索并安装:

| 软件 | 必装 | 版本 | 说明 |
|---|---|---|---|
| **Nginx** | ✓ | 1.22+ | 反向代理 |
| **MySQL** | ✓ | 5.7 或 8.0 | 数据库 |
| **PM2 管理器** | ✓ | 最新 | Node.js 进程守护(自带 Node) |
| **Linux 工具箱** | 可选 | | 包含 swap/防火墙等 |

> **PM2 管理器** 自带 Node.js 模块管理功能,装上它就有 Node + PM2,不需要单独装 Node。

---

## 二、后端部署 (server/)

### 2.1 创建数据库

宝塔面板 → **数据库** → **添加数据库**:

| 字段 | 值 |
|---|---|
| 数据库名 | `clound_note` |
| 用户名 | `clound_note` |
| 密码 | 点"随机密码"生成强密码,保存 |
| 访问权限 | **本地服务器**(不要选所有人) |
| 字符集 | `utf8mb4` |
| 排序规则 | `utf8mb4_unicode_ci` |

> 后端和数据库在同一服务器,选"本地服务器"即可,3306 端口不对外开。

### 2.2 上传代码

**方式 A:Git 拉取(推荐)**

宝塔 → **文件** → 进入 `/www/wwwroot/` → 右上角终端(SSH):

```bash
cd /www/wwwroot
git clone https://github.com/wrysunny-oss/Notes.git clound_note
cd clound_note/server
```

> 如果 git clone SSL 失败,先 `git config --global http.sslBackend openssl` 或 `GIT_SSL_NO_VERIFY=1 git clone ...`

**方式 B:本地上传压缩包**

本地把项目 zip → 宝塔文件管理上传到 `/www/wwwroot/` → 右键解压。

### 2.3 配置 .env

宝塔文件管理进入 `/www/wwwroot/clound_note/server/`,找到 `.env.example`,右键复制为 `.env`,再编辑 `.env`:

```env
# MySQL 连接(用 2.1 创建的库和密码)
DATABASE_URL="mysql://clound_note:你的强密码@localhost:3306/clound_note"

# JWT 密钥,32 字节随机串
JWT_SECRET="用下面命令生成"

PORT=3000
CLIENT_ORIGIN="https://你的域名"
```

生成 JWT_SECRET(在宝塔终端跑):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 安装依赖 + 初始化数据库

宝塔 → 终端:

```bash
cd /www/wwwroot/clound_note/server
npm install --omit=dev   # 装生产依赖,跳过 dev 减小体积
# 如果 npm install 卡住,改用淘宝源:
# npm config set registry https://registry.npmmirror.com

npx prisma generate
npx prisma db push       # 把 schema 推到 MySQL
npm run seed             # 写演示数据(可选)
```

> **MySQL TEXT 字段不能 default 的问题**:本项目 schema 已避开此限制,直接 `db push` 即可。如果用 `prisma migrate dev` 报 `Error 1101`,改用 `db push`。

### 2.5 PM2 启动后端服务

宝塔 → **软件商店** → 找到 **PM2 管理器** → **设置** → **模块管理**:

1. Node 版本选 **20.x**,点切换
2. 切到 **项目** 标签 → **添加项目**:

| 字段 | 值 |
|---|---|
| 项目名称 | `clound-note-server` |
| 运行目录 | `/www/wwwroot/clound_note/server` |
| 启动文件 | `dist/index.js`(先 build) 或 `src/index.ts`(用 tsx) |
| 启动选项 | 留空 |
| Node 版本 | 20.x |

**先 build 再启动**(推荐生产用):

```bash
cd /www/wwwroot/clound_note/server
npm run build     # 编译 TS → dist/
```

回到 PM2 管理器 → 添加项目,**启动文件填** `dist/index.js`,点启动。

**或者直接 PM2 命令行启动**:

```bash
cd /www/wwwroot/clound_note/server
pm2 start dist/index.js --name clound-note-server -i 1
pm2 save
pm2 startup        # 开机自启
```

### 2.6 验证后端

```bash
curl http://localhost:3000/api/notes
# 期望返回 {"error":"未授权"} 或类似 401,说明服务起来了
```

PM2 状态查看:

```bash
pm2 status
pm2 logs clound-note-server --lines 100
```

---

## 三、Nginx 反向代理 + HTTPS

### 3.1 创建网站

宝塔 → **网站** → **添加站点**:

| 字段 | 值 |
|---|---|
| 域名 | `api.your-domain.com`(需要先把域名 A 记录解析到服务器 IP) |
| 根目录 | `/www/wwwroot/clound_note`(随便,反代不读这个) |
| PHP 版本 | 纯静态 |
| 数据库 | 不创建 |

### 3.2 配置反向代理

进入网站设置 → **反向代理** → **添加反向代理**:

| 字段 | 值 |
|---|---|
| 代理名称 | `api` |
| 目标 URL | `http://127.0.0.1:3000` |
| 发送域名 | `$host` |
| 代理目录 | 留空(整站) |

保存后,访问 `http://api.your-domain.com/api/notes` 应该看到 401 错误,说明反代生效。

**手动配置(可选,如果想完全控制 Nginx 配置)**:

宝塔 → 网站 → 设置 → 配置文件,在 `server { ... }` 内加:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 300s;
}
```

保存 → 重载 Nginx。

### 3.3 申请 SSL 证书(强制 HTTPS)

宝塔 → 网站设置 → **SSL** → **Let's Encrypt**:

1. 勾选域名 → 申请
2. 申请成功后,勾选 **强制 HTTPS**(自动把 HTTP 跳转到 HTTPS)

> iOS App 强制 ATS,必须 HTTPS 才能请求。这一步必做。
> Let's Encrypt 证书 90 天到期,宝塔会自动续签。

### 3.4 配置 CORS

后端 `.env` 已经设了 `CLIENT_ORIGIN`,如果用了反代,需要确认域名匹配:

```env
CLIENT_ORIGIN="https://你的前端域名"   # 如果前端是 web 版
# 移动端 App 不在 CORS 范围(非浏览器),可留空
```

改完 `.env` 必须 `pm2 restart clound-note-server`。

---

## 四、移动端构建 (mobile/)

### 4.1 修改 API 地址

编辑 [mobile/src/lib/config.ts](mobile/src/lib/config.ts),改成生产域名:

```ts
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.your-domain.com/api'
```

或者构建时注入:

```bash
# Bash / Zsh
EXPO_PUBLIC_API_BASE_URL=https://api.your-domain.com/api npx eas build --platform android

# PowerShell
$env:EXPO_PUBLIC_API_BASE_URL='https://api.your-domain.com/api'
npx eas build --platform android
```

### 4.2 用 EAS 构建原生包(推荐)

在本地开发机(不是服务器)上:

```bash
cd mobile
npm install
npm i -g eas-cli
eas login                # Expo 账号登录
eas build:configure      # 首次会生成 eas.json
```

`eas.json` 改成生产配置:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://api.your-domain.com/api"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "staging": {
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://staging-api.your-domain.com/api"
      }
    }
  }
}
```

构建:

```bash
eas build --profile production --platform android   # 产出 APK
eas build --profile production --platform ios       # 产出 IPA(需 Apple Dev 账号)
```

构建完成 Expo 会给你下载链接,APK 直接安装,IPA 需 TestFlight 或上架 App Store。

### 4.3 本地构建(不用 EAS)

需要 Android Studio / Xcode:

```bash
# Android APK
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
# APK 输出到 android/app/build/outputs/apk/release/
```

### 4.4 构建 Web 版(可选)

如果想要 Web 端:

```bash
npx expo export --platform web
# 输出到 dist/
```

把 `dist/` 上传到宝塔,新建一个网站托管静态文件即可。

---

## 五、安全清单

部署生产前逐项检查:

- [ ] **JWT_SECRET** 用 32 字节随机串,不是 `123456`
- [ ] **MySQL** 选"本地服务器"访问,3306 端口在宝塔安全组不开公网
- [ ] **数据库密码** 强密码,不是 root 默认
- [ ] **CORS** `CLIENT_ORIGIN` 严格限定前端域名,不用 `*`
- [ ] **HTTPS** 全链路,Lets Encrypt 已申请 + 强制 HTTPS 开启
- [ ] **宝塔防火墙** 只开 22(SSH)、80、443,3000 不对公网
- [ ] **/api/auth/login** 加 rate limit(每 IP 每分钟 ≤ 10 次),防爆破
- [ ] **`.env` 文件权限** `chmod 600 .env`,只 root 可读
- [ ] **数据库备份** 宝塔 → 计划任务 → 添加 → MySQL 整库备份,每日凌晨,保留 7 份
- [ ] **PM2 日志** 别无限增长,`pm2 install pm2-logrotate`

---

## 六、日常运维

### 6.1 更新代码

宝塔终端:

```bash
cd /www/wwwroot/clound_note
git pull origin main
cd server
npm install --omit=dev
npx prisma generate
npx prisma db push       # 如果 schema 改了
npm run build
pm2 restart clound-note-server
```

### 6.2 查看日志

```bash
pm2 logs clound-note-server --lines 200
# 实时日志
pm2 logs clound-note-server
```

宝塔面板 → 文件管理进 `/www/wwwroot/clound_note/server/logs/` 也能看应用日志(如果配了 morgan)。

### 6.3 重启服务

宝塔 → PM2 管理器 → 项目 → 重启按钮。
或命令行:

```bash
pm2 restart clound-note-server
pm2 reload clound-note-server    # 零停机
```

### 6.4 数据库管理

宝塔面板 → 数据库 → 管理(phpMyAdmin),图形化查看 / 改库。

或者命令行:

```bash
mysql -u clound_note -p
use clound_note;
show tables;
select * from User;
```

### 6.5 OTA 热更新

改完前端代码不重新发包,直接推 JS bundle:

```bash
eas update --branch production --message "fix: 编辑保存 bug"
```

App 启动时自动拉新 bundle(配置 `app.json` 的 `updates` 字段后)。

---

## 七、API 接口速查

> 所有 `/api/notes`、`/api/tags`、`/api/auth/me`、`/api/auth/change-password` 需要 `Authorization: Bearer <token>` header

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/auth/register` | 注册,返回 token |
| POST | `/api/auth/login` | 登录,返回 token |
| GET | `/api/auth/me` | 获取当前用户 |
| PUT | `/api/auth/profile` | 修改昵称 |
| PUT | `/api/auth/change-password` | 修改密码 |
| GET | `/api/notes?search=&tagId=&pinned=&deleted=` | 查询笔记 |
| POST | `/api/notes` | 创建笔记 |
| GET | `/api/notes/:id` | 获取单条 |
| PUT | `/api/notes/:id` | 修改 |
| DELETE | `/api/notes/:id` | 软删除(进回收站) |
| POST | `/api/notes/:id/restore` | 恢复 |
| DELETE | `/api/notes/trash/empty` | 清空回收站 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/tags` | 新建标签 |
| PUT | `/api/tags/:id` | 修改标签 |
| DELETE | `/api/tags/:id` | 删除标签 |

---

## 八、常见问题

### Q1: `prisma migrate dev` 报 `Error 1101: BLOB/TEXT column can't have a default value`

MySQL 不允许 TEXT 列设 `DEFAULT ''`。**解决**:用 `npx prisma db push` 代替 `migrate dev`。

### Q2: 真机访问后端报 `Network Error` / `TypeError: Network request failed`

排查清单:

1. 手机和电脑/服务器在同一网络(或者用线上域名)
2. `API_BASE_URL` 用 HTTPS 域名(本地调试用 IP,生产用域名)
3. 后端 `CLIENT_ORIGIN` 包含前端来源(仅 web 端需要,App 不受 CORS 限制)
4. 宝塔 → 安全 → 防火墙:3000 端口只对 127.0.0.1 开放,不对公网(走 Nginx 反代)
5. iOS 强制 ATS,必须 HTTPS

### Q3: iOS 真机 HTTP 请求失败

iOS ATS 强制 HTTPS。三个方案:

- 后端配 HTTPS(宝塔 Let's Encrypt 一键)—— 推荐
- 用 ngrok 临时 HTTPS:`ngrok http 3000`
- 仅开发:`app.json` 加 `ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads = true`(上架会被拒)

### Q4: PM2 启动后端口 3000 没监听

```bash
pm2 logs clound-note-server --lines 100
# 常见报错:
# 1. DATABASE_URL 写错 → 改 .env 后 pm2 restart
# 2. 端口被占 → lsof -i:3000 查占用进程,kill 掉
# 3. dist/ 不存在 → 忘了 npm run build,先 build
```

### Q5: Nginx 反代后访问报 502 Bad Gateway

后端服务挂了或没起来:

```bash
pm2 status                  # 看 clound-note-server 是否 online
pm2 logs clound-note-server # 看报错
curl http://127.0.0.1:3000  # 直接打后端,绕过 Nginx
```

如果 `pm2 status` 显示 `errored` 或 `stopped`:

```bash
pm2 restart clound-note-server
```

### Q6: 宝塔面板 SSL 申请失败

常见原因:

1. 域名没解析到服务器 IP:`ping 你的域名` 看是否通
2. 80 端口没开:Let's Encrypt 走 HTTP-01 验证,需要 80 端口可达
3. 国内服务器 + `.cn` 域名可能要走 DNS 验证:宝塔 SSL 界面选 "DNS 验证" + "DNS API"(用阿里云 / 腾讯云 API key 自动续签)

### Q7: 数据库连接数过多(MySQL 8 默认 151)

宝塔 → 软件商店 → MySQL → 设置 → 配置修改,把 `max_connections` 改为 500,保存 → 重启 MySQL。

### Q8: 磁盘满了导致服务异常

```bash
df -h                   # 查磁盘占用
du -sh /www/wwwroot/*   # 找大目录
pm2 flush               # 清 PM2 日志
# 宝塔 → 文件 → 清理加速,清日志和备份
```

---

## 九、快速部署脚本(宝塔 SSH 终端)

把下面整段贴到宝塔终端,改三个变量后回车:

```bash
# ===== 改这三个变量 =====
DOMAIN="api.example.com"           # 你的域名
DB_PASSWORD="改成强密码"           # MySQL 密码
JWT_SECRET="改成32字节随机串"      # JWT 密钥
# =========================

# 装依赖(假设已装宝塔 + PM2 管理器 + MySQL + Nginx)
cd /www/wwwroot
git clone https://github.com/wrysunny-oss/Notes.git clound_note

# 建数据库(也可宝塔面板手动建)
mysql -uroot -p"你的root密码" <<EOF
CREATE DATABASE clound_note CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'clound_note'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL ON clound_note.* TO 'clound_note'@'localhost';
FLUSH PRIVILEGES;
EOF

# 后端配置
cd /www/wwwroot/clound_note/server
cp .env.example .env
sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"mysql://clound_note:${DB_PASSWORD}@localhost:3306/clound_note\"|" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"${JWT_SECRET}\"|" .env
sed -i "s|CLIENT_ORIGIN=.*|CLIENT_ORIGIN=\"https://${DOMAIN}\"|" .env

# 装依赖 + 初始化
npm install --omit=dev
npx prisma generate
npx prisma db push
npm run seed
npm run build

# PM2 启动
pm2 start dist/index.js --name clound-note-server -i 1
pm2 save
pm2 startup

echo "后端部署完成,接下来去宝塔面板配置反向代理 + SSL"
echo "1. 网站 → 添加站点 → 域名: ${DOMAIN}"
echo "2. 站点设置 → 反向代理 → 目标: http://127.0.0.1:3000"
echo "3. 站点设置 → SSL → Let's Encrypt → 申请 + 强制 HTTPS"
```

---

## 十、版本发布 Checklist

发版前确认:

- [ ] `server/package.json` 和 `mobile/app.json` 的 `version` 同步更新
- [ ] server `npm run build` 无 TS 错误
- [ ] mobile `npx tsc --noEmit` 无 TS 错误
- [ ] 关键流程手测:登录 → 新建笔记 → 编辑保存 → 收藏 → 加标签 → 删除 → 恢复 → 退出
- [ ] 服务器上 `git pull` + `npm run build` + `pm2 restart`
- [ ] App 用 EAS 构建 APK / IPA
- [ ] `git tag v1.0.0 && git push origin v1.0.0` 打 tag
- [ ] 后端先发布,App 再发布(避免 API 不兼容)
- [ ] OTA 更新走灰度:`eas update --branch staging` → 验证 → `eas update --branch production`
