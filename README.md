# 🐍 VALORANT SNAKE · 无畏贪吃蛇

一个使用 **原生 JavaScript + Canvas** 实现的**无畏契约（VALORANT）风格**贪吃蛇小游戏：战术红 × 暗夜蓝配色、斜切角 HUD、尖刺技能球、战术目镜蛇头。零依赖、单页面，可直接部署到 Vercel。

👉 在线试玩：`（部署完成后把 Vercel 生成的地址填在这里）`

## ✨ 功能特性

- 🎮 方向键 / WASD 控制蛇的移动
- ⏸️ 空格键暂停 / 继续，R 键随时重开
- 📈 吃到技能球加击杀数（每个 +10），回合速度逐渐加快
- 🏆 最佳记录（localStorage 本地保存）
- 📱 移动端支持滑动手势操作
- 🔊 WebAudio 合成音效（吃球提示音、阵亡音，无需音频文件）
- 💥 撞墙 / 撞到自己判定「任务失败」
- 🎨 无畏契约式视觉：`#FF4655` 战术红 / `#0F1923` 暗夜蓝、V 形 Logo、斜切角按钮、四角战术括号、脉动尖刺球、待机动画

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| HTML5 | 页面结构 |
| CSS3 | 界面样式（无畏契约风格：斜切角、战术网格背景、Teko 字体） |
| JavaScript (ES5) | 游戏逻辑（无任何框架和依赖） |
| Canvas 2D | 游戏画面渲染（尖刺技能球、目镜蛇头、脉动动画） |
| WebAudio API | 合成音效（无需音频文件） |
| localStorage | 最佳成绩持久化 |

## 📁 项目结构

```
snake-game/
├── index.html   # 页面结构（游戏画布、战术 HUD、遮罩层）
├── style.css    # 样式（无畏契约视觉语言）
├── game.js      # 游戏核心逻辑（约 400 行，含详细注释）
└── README.md    # 项目说明（本文件）
```

## 🚀 本地运行

项目是纯静态页面，**不需要安装任何东西**：

**方法一：直接双击** `index.html` 用浏览器打开即可。

**方法二（推荐）：** 用本地服务器运行：

```bash
# 进入项目目录后，任选一种方式
python -m http.server 8080   # Python
npx serve .                  # Node.js
```

然后访问 `http://localhost:8080`。

## 📤 上传到 GitHub

### 前置准备
1. 注册 [GitHub](https://github.com) 账号
2. 安装 [Git](https://git-scm.com/downloads)，完成后配置身份：

```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 步骤

**1. 在 GitHub 上新建仓库**

点击右上角 `+` → `New repository`，名称如 `snake-game`，选择 **Public**，**不要**勾选自动生成 README（本地已有），点击 `Create repository`。

**2. 在本地初始化并推送**

在 `snake-game` 项目目录下打开终端：

```bash
git init
git add .
git commit -m "feat: 贪吃蛇游戏初始版本"
git branch -M main
git remote add origin https://github.com/你的用户名/snake-game.git
git push -u origin main
```

> 如果提示登录，按引导完成 GitHub 身份验证即可。

## ▲ 部署到 Vercel

### 方式一：网页导入（最简单，推荐新手）

1. 注册 / 登录 [Vercel](https://vercel.com)（可直接用 GitHub 账号登录）
2. 点击 **Add New... → Project**
3. 找到 `snake-game` 仓库，点击 **Import**
4. 配置页面保持默认（Vercel 会自动识别为静态网站，Framework Preset 选 `Other` 即可），点击 **Deploy**
5. 等待约 30 秒部署完成，即可获得在线地址：`https://snake-game-你的用户名.vercel.app`

### 方式二：命令行 CLI

```bash
npm i -g vercel
vercel login        # 首次使用需要登录
vercel --prod       # 在项目目录下执行，发布生产环境
```

### 更新版本

以后每次修改代码，只要推送到 GitHub：

```bash
git add .
git commit -m "update: 修改说明"
git push
```

Vercel 会**自动检测到新提交并重新部署**，无需任何手动操作。

## 🎯 游戏规则

| 按键 / 手势 | 功能 |
|------|------|
| ↑ ↓ ← → 或 W A S D | 控制方向 |
| 空格 | 暂停 / 继续 |
| R | 重新部署（重开） |
| 手机滑动 | 控制方向 |

- 每吞噬一个技能球记 **10 击杀**，回合速度提升一级
- 蛇撞到墙壁或自己的身体即「任务失败」
- 蛇不能 180° 掉头

## ❓ 常见问题

**Q：部署后打开是 404？**
确认仓库根目录下有 `index.html`，且推送已经完成（`git push` 后刷新 GitHub 页面能看到文件）。

**Q：Vercel 部署失败？**
本项目是纯静态站，一般不会失败。若失败请检查 Framework Preset 是否为 `Other`、Output Directory 是否为空（默认根目录）。

**Q：想改网格大小 / 速度？**
编辑 `game.js` 顶部的常量：`COLS`（列数）、`ROWS`（行数）、`BASE_INTERVAL`（初始速度，数值越小越快）。
