# Frontend Developer TODO

## Context
- **Target Framework**: Vue 3 (Composition API)
- **Styling**: Vanilla CSS (Scoped) / Tailwind CSS concepts
- **Goal**: 优化导航栏收缩状态的体验，增加图标并将收缩状态的胶囊变成圆形，同时移除内嵌的 Admin 入口。

## Implementation Plan

- [ ] **FE-PLAN-2.1 [导航栏结构更新]**:
  - **Scope**: `src/App.vue` 中的 `<nav class="top-nav">`。
  - **Components**: Navigation Pills.
  - **Task**: 
    - 移除 Admin 对应的按钮节点。
    - 为每个 `nav-pill` 内新增对应的 SVG 小图标。

- [ ] **FE-PLAN-2.2 [导航栏样式更新]**:
  - **Scope**: `src/App.vue` `<style scoped>`。
  - **State**: 收缩状态 `.nav-scrolled:not(:hover)`。
  - **Task**: 
    - 调整收缩状态下的 padding，使其宽度与高度一致（例如 `padding: 10px`），从而在 `border-radius: 999px` 下变成一个完美的圆形。
    - 确保 `nav-text` 的 `max-width` 变为 0 时的平滑过渡。

## Implementation Items

- [ ] **FE-ITEM-2.1 [App.vue 移除 Admin]**:
  - 删除包含 `Admin` 字样及相关点击事件的 `<button>` 元素。

- [ ] **FE-ITEM-2.2 [App.vue 添加图标]**:
  - 首页 (Home): 添加 Feather icons 的 Home 图标 (`<svg>`)
  - 提示词优化 (Prompt): 添加 Edit 笔图标
  - 图片生成 (Image): 添加 Image 图标
  - 案例画廊 (Gallery): 添加 Layout 图标
  - 历史记录 (History): 添加 Clock/History 图标

- [ ] **FE-ITEM-2.3 [App.vue 收缩圆形样式]**:
  - 修改 CSS：
  ```css
  .top-nav.nav-scrolled:not(:hover) .nav-pill {
    padding: 10px; /* 10px 使得 20px 图标 + 20px padding = 40px 高宽 -> 圆形 */
    gap: 0;
  }
  ```
  - 给图标添加统一类名 `.nav-icon` 以保证 `flex-shrink: 0` 和居中。
  ```css
  .nav-icon {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  ```

## Proposed Code Changes

### `src/App.vue` (模板部分)
```html
        <button type="button" class="nav-pill" :class="{ 'selected-pill': currentView === 'landing' }" @click="router.push('/')">
          <span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></span>
          <span class="nav-text">首页</span>
        </button>
        <!-- 其他同理添加 <span class="nav-icon">...</span> -->
        <!-- Admin 按钮移除 -->
```

### `src/App.vue` (样式部分)
```css
.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 覆盖原有的 padding，使收缩时成圆形 */
.top-nav.nav-scrolled:not(:hover) .nav-pill {
  padding: 10px; /* 原来是 10px 14px */
  gap: 0;
}
```

## Backend Bug Fix

- [x] **BE-FIX-1.1 [优化 VLM 错误提示]**:
  - **Scope**: `server/index.mjs` 中的 `optimizePrompt` 方法。
  - **Task**: 当用户上传参考图片但当前配置的语言模型不支持图片解析（抛出 upstream JSON error）时，捕获异常并返回友好的中文提示：“当前配置的大模型不支持图片解析，请更换为视觉大模型（VLM）或移除参考图片后重试。”，避免暴露原始的 `{"error":{"message":"..."}}` 字符串。

- [x] **BE-FIX-1.2 [切换至 Google AI Studio VLM]**:
  - **Scope**: `server/data/config.json` 配置文件。
  - **Task**: 将 prompt 的 API 地址更改为 `https://generativelanguage.googleapis.com/v1beta/openai`，将模型修改为 `gemini-3-flash-preview`，并更新相应的 API Key，从而赋予系统视觉语言处理能力。
- [x] **FE-ITEM-2.4 [Admin 独立网页视图]**:
  - **Scope**: `src/App.vue` 中的全局布局 (`nav`, `footer`, 背景动画等)。
  - **Task**: 应用户要求，取消在 Footer 中放置入口。直接通过路由判断 (`currentView === 'admin'`) 隐藏顶栏导航、全局底部、动态背景和回到顶部按钮，使得 `/#/admin` 成为一个完全独立、无其他前台元素的纯粹登录管理网页。
