# Seedance Prompt Studio

<p align="center">
  <strong>一个面向 AI 视频与图片创作的提示词工作台</strong>
</p>

<p align="center">
  将零散想法整理成结构化提示词，支持分镜拆解、画幅/时长控制、案例画廊、图片生成和后台配置管理。
</p>

<p align="center">
  <a href="#功能亮点">功能亮点</a> ·
  <a href="#快速启动">快速启动</a> ·
  <a href="#配置说明">配置说明</a> ·
  <a href="#联系作者">联系作者</a>
</p>

---

## 项目定位

Seedance Prompt Studio 是一个为短视频、广告片、产品展示、剧情分镜和图像创作准备的 AI 提示词生成工具。

它解决的问题很直接：很多创作者知道自己想拍什么，但很难把想法写成模型容易理解、结构清晰、镜头感明确的提示词。本项目把“自然语言想法”转成更适合 AI 视频/图片模型使用的创作指令，并提供案例沉淀和后台管理能力。

## 功能亮点

### 提示词优化

- 输入一句创意描述，生成更完整的视频提示词。
- 支持场景类型、视频时长、画幅比例等创作参数。
- 支持自定义秒数，适合更精细的分镜节奏控制。
- 支持参考图输入，让提示词更贴近指定画面风格。

### 分镜与多版本结果

- 自动拆解镜头动作、画面重点和转场逻辑。
- 输出多个提示词版本，方便对比和二次修改。
- 保留创作建议，帮助用户判断哪些描述更适合模型执行。

### 图片生成

- 支持从文本直接生成图片。
- 可选择画幅比例。
- 生成结果可以继续回流到编辑流程，便于反复打磨。

### 案例画廊

- 内置作品案例展示。
- 支持案例标题、标签、作者、日期、来源链接等信息。
- 适合沉淀优秀提示词、展示成片效果和搭建灵感库。

### 历史记录

- 本地保存最近的提示词优化记录。
- 支持从历史记录中继续编辑，减少重复输入。

### 后台管理

- 提供 `/#/admin` 管理入口。
- 可配置提示词模型、图片模型、API 地址和密钥。
- 可维护案例画廊内容。
- 密钥由后端读取，不需要直接写入公开前端页面。

## 适合谁用

- AI 视频创作者
- 短视频运营和内容团队
- 广告片、产品片、剧情片分镜策划
- 想把 Seedance、图像生成模型或其他多模态模型接入自己工作流的人
- 需要一个可本地部署、可二次开发的提示词工具项目的人

## 技术栈

- Vue 3
- TypeScript
- Vite
- Vue Router
- Express
- 本地 JSON 数据与环境变量配置

## 快速启动

```bash
npm install
npm run dev
```

`npm run dev` 会同时启动前端 Vite 服务和本地 Express 后端。

常用入口：

- 首页：`/`
- 提示词优化：`/#/studio`
- 图片生成：`/#/image`
- 案例画廊：`/#/discover`
- 历史记录：`/#/history`
- 后台管理：`/#/admin`

## 构建

```bash
npm run build
npm run preview
```

## 配置说明

环境变量示例在 [.env.example](./.env.example)。

本地开发时可创建：

```text
.env.local
.env.server.local
```

其中：

- `.env.local` 用于前端构建和本地开发变量。
- `.env.server.local` 用于后端密钥和管理密码。
- `SEEDANCE_ADMIN_PASSWORD` 控制后台登录密码。

注意：不要把真实 API Key 提交到公开仓库。本项目已通过 `.gitignore` 忽略 `*.local` 文件。

## 项目结构

```text
Seedance2
├─ public/              # 静态资源、二维码、展示图片和视频
├─ server/              # Express 后端与管理接口
├─ src/
│  ├─ api/              # 前端 API 调用
│  ├─ components/       # 页面组件
│  ├─ engine/           # 提示词与图片生成请求逻辑
│  ├─ pages/            # 页面视图
│  └─ utils/            # 工具函数
├─ package.json
└─ vite.config.ts
```

## 部署提示

- `VITE_APP_BASE_PATH` 可用于子路径部署，例如 `/seedance/`。
- `VITE_DEV_PROXY_TARGET` 只影响本地 `vite dev`。
- 生产环境不要把供应商 API Key 打进公开前端包。
- 面向公网部署时，建议使用服务端代理保护模型 API Key。

## 联系作者

如果你想交流 AI 视频提示词、Seedance 工作流、项目二次开发或合作需求，可以扫码联系我。

<p align="center">
  <img src="./public/qrcode.png" alt="作者微信二维码" width="220" />
</p>

---

<p align="center">
  Made for AI video creators and prompt workflow builders.
</p>
