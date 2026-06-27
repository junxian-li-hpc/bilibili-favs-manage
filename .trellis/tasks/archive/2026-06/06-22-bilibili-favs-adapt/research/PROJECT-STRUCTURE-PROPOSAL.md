# 项目结构优化和代码拆分建议

## 当前问题分析

### 1. 当前结构
```
bilibili-favs-manage/
├── BilibiliFavsManage.js (962 行，单文件)
├── archived-code/ (废弃代码)
├── publish-version/ (发布版本)
├── images/ (截图)
└── readme.md
```

### 2. 主要问题
1. **单文件过大** - 962 行代码，包含多个类和功能模块
2. **职责混杂** - UI 逻辑、业务逻辑、DOM 操作混在一起
3. **难以维护** - 修改一个功能可能影响其他部分
4. **发布不友好** - Greasy Fork 需要手动合并文件

## 推荐的项目结构

### 方案 A：模块化开发 + 构建工具（推荐）

适合长期维护和功能扩展：

```
bilibili-favs-manage/
├── src/                          # 源代码（模块化）
│   ├── core/                     # 核心业务逻辑
│   │   ├── BilibiliAPI.js        # B 站 API 封装（DOM 选择器）
│   │   ├── FavManager.js         # 收藏夹管理核心逻辑
│   │   └── BatchCopier.js        # 批量复制逻辑
│   ├── ui/                       # UI 组件
│   │   ├── FloatingPanel.js      # 浮动面板
│   │   ├── CheckboxList.js       # Checkbox 列表
│   │   └── OutputConsole.js      # 输出控制台
│   ├── utils/                    # 工具函数
│   │   ├── dom.js                # DOM 操作辅助
│   │   ├── delay.js              # 延迟工具
│   │   └── logger.js             # 日志工具
│   ├── config/                   # 配置
│   │   └── selectors.js          # 选择器配置（集中管理）
│   └── main.js                   # 入口文件
├── dist/                         # 构建输出
│   └── BilibiliFavsManage.user.js
├── build/                        # 构建脚本
│   └── bundle.js                 # Rollup/Webpack 配置
├── test/                         # 测试
│   └── *.test.js
├── docs/                         # 文档
│   ├── API.md
│   └── CHANGELOG.md
├── package.json                  # 依赖管理
├── rollup.config.js              # 构建配置
└── README.md
```

**优点：**
- 代码结构清晰，易于维护
- 模块独立，便于测试
- 支持 ES6+ 特性
- 自动化构建和发布

**缺点：**
- 需要学习构建工具（Rollup 推荐，比 Webpack 轻量）
- 开发流程稍复杂

### 方案 B：轻量级拆分（折中方案）

保持简单，适合快速迭代：

```
bilibili-favs-manage/
├── src/
│   ├── 00-header.js              # UserScript 元数据
│   ├── 01-config.js              # 配置和选择器
│   ├── 02-utils.js               # 工具函数
│   ├── 03-ui-components.js       # UI 组件类
│   ├── 04-event-handlers.js      # 事件处理
│   ├── 05-bilibili-api.js        # B 站 DOM 操作
│   ├── 06-fav-manager.js         # 核心业务逻辑
│   └── 99-main.js                # 初始化入口
├── dist/
│   └── BilibiliFavsManage.user.js
├── build.sh                      # 简单的合并脚本
└── README.md
```

**合并脚本示例（build.sh）：**
```bash
#!/bin/bash
cat src/00-header.js > dist/BilibiliFavsManage.user.js
cat src/01-config.js >> dist/BilibiliFavsManage.user.js
cat src/02-utils.js >> dist/BilibiliFavsManage.user.js
cat src/03-ui-components.js >> dist/BilibiliFavsManage.user.js
cat src/04-event-handlers.js >> dist/BilibiliFavsManage.user.js
cat src/05-bilibili-api.js >> dist/BilibiliFavsManage.user.js
cat src/06-fav-manager.js >> dist/BilibiliFavsManage.user.js
cat src/99-main.js >> dist/BilibiliFavsManage.user.js
echo "Build complete: dist/BilibiliFavsManage.user.js"
```

**优点：**
- 简单易懂，无需学习构建工具
- 文件拆分清晰
- 发布时手动合并或用简单脚本

**缺点：**
- 不支持 ES6 模块
- 无法使用现代化的依赖管理

### 方案 C：保持单文件（不推荐）

```
bilibili-favs-manage/
├── BilibiliFavsManage.js         # 单文件，通过注释分区
└── README.md
```

仅通过注释分隔不同部分，适合非常简单的脚本。

---

## 针对 Greasy Fork 发布的特殊考虑

### Greasy Fork 要求
1. **单文件上传** - 必须是完整的 `.user.js` 文件
2. **UserScript 元数据** - 必须在文件顶部
3. **外部资源限制** - 不能使用 `@require` 加载外部库（除非是白名单）

### 推荐工作流

**开发阶段：**
- 使用模块化代码（方案 A 或 B）
- 本地测试时直接引用源文件

**发布阶段：**
- 使用构建工具合并成单文件
- 自动添加 UserScript 元数据
- 压缩代码（可选）

**示例：Rollup 配置（rollup.config.js）**
```javascript
import { terser } from 'rollup-plugin-terser';
import banner from 'rollup-plugin-banner2';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/BilibiliFavsManage.user.js',
    format: 'iife',
    name: 'BilibiliFavsManager'
  },
  plugins: [
    banner(() => {
      return `// ==UserScript==
// @name         Bilibili 收藏夹批量管理
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  批量复制 B 站收藏夹
// @author       Your Name
// @match        https://space.bilibili.com/*/favlist*
// @grant        none
// ==/UserScript==
`;
    }),
    // terser() // 可选：压缩代码
  ]
};
```

---

## UI 优化建议

### 当前 UI 问题
1. **浮动面板不够现代** - 手动拖拽和调整大小体验一般
2. **操作反馈不够明显** - 用户不清楚脚本正在做什么
3. **错误提示不友好** - 技术性错误信息对普通用户不友好

### UI 优化方向（后续任务）

#### 1. 使用现代 UI 框架风格
- 参考 B 站自己的 VUI 组件风格
- 使用圆角、阴影、动画过渡
- 响应式布局

#### 2. 改进交互流程
**当前流程：**
```
选择源收藏夹 → 选择目标收藏夹 → 点击开始 → 等待 → 查看日志
```

**优化后流程：**
```
1. 侧边栏按钮（小图标）
2. 点击后展开面板
3. 可视化选择收藏夹（卡片形式，带预览）
4. 进度条 + 实时状态
5. 完成后通知（类似 B 站原生通知）
```

#### 3. 具体优化点

**浮动面板：**
- 改为侧边抽屉（Drawer）
- 添加收起/展开动画
- 固定位置（右下角或右侧）

**收藏夹选择：**
- 当前：下拉框
- 优化：卡片网格 + 搜索过滤
- 显示收藏夹封面和视频数量

**进度显示：**
- 当前：文本日志滚动
- 优化：进度条 + 当前状态 + 预计剩余时间
- 可以暂停/恢复

**错误处理：**
- 当前：红色文本 + 技术错误
- 优化：友好提示 + 解决建议
- 例如："页面结构可能已更新，请刷新页面重试"

#### 4. UI 框架选择

**纯 CSS + 原生 JS（推荐）**
- 无依赖，轻量
- 使用 CSS Variables 管理主题
- 使用 CSS Animations

**轻量级框架（可选）**
- Preact（React 的轻量替代，3KB）
- Lit（Web Components，5KB）

---

## 实施建议

### 第一阶段：功能修复（当前任务）
- 先完成新版适配
- 保持当前单文件结构
- 不做大规模重构

### 第二阶段：代码重构
1. 采用**方案 B（轻量级拆分）**
2. 拆分成 8 个文件
3. 编写简单的合并脚本
4. 迁移测试

### 第三阶段：UI 优化
1. 设计新的 UI 布局
2. 使用 B 站 VUI 风格
3. 改进交互流程
4. 添加动画和过渡

### 第四阶段：工具化（可选）
- 如果项目复杂度继续增长
- 引入 Rollup + Babel
- 采用**方案 A（模块化开发）**

---

## 快速行动建议

**当前任务：** 先把适配完成，不重构

**下一个任务：** 创建以下结构
```
src/
  ├── config-selectors.js    # 集中管理所有选择器（新旧对比）
  ├── bilibili-api.js        # 封装所有 DOM 操作
  ├── fav-copier.js          # 复制逻辑
  ├── ui-panel.js            # UI 相关
  └── main.js                # 入口
build.sh                     # cat src/*.js > dist/output.js
```

**预期收益：**
- 选择器集中管理，未来改版只需修改一个文件
- 业务逻辑和 DOM 操作分离，便于测试
- 代码复用性提高

---

## 总结

| 方案 | 复杂度 | 维护性 | 适合场景 |
|------|--------|--------|----------|
| 方案 A：模块化 + 构建工具 | 高 | 优秀 | 长期维护，多人协作 |
| 方案 B：轻量级拆分 | 低 | 良好 | 中小型项目，快速迭代 |
| 方案 C：单文件 | 最低 | 差 | 一次性脚本，不推荐 |

**我的建议：**
1. **现在**：完成适配，不重构
2. **适配完成后**：采用**方案 B**，拆分成 5-8 个文件
3. **UI 优化**：单独的任务，参考 B 站 VUI 风格
4. **长期**：如果功能继续扩展，升级到**方案 A**
