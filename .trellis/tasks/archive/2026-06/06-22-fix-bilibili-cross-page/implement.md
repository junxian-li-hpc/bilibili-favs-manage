# Implementation Plan: B 站收藏夹脚本完善

## Overview

本实施计划按照从低风险到高风险的顺序，逐步完成所有功能。每个阶段独立可测试。

## Prerequisites

- [x] PRD 完成
- [x] Design 完成
- [ ] 安装依赖：`npm install`
- [ ] 备份当前代码：`cp BilibiliFavsManage.js BilibiliFavsManage.js.backup2`

## Phase 1: 构建系统验证 ✅ 优先级最高

**目标：** 确保现有代码能成功构建，产生可用的 UserScript。

### 1.1 安装依赖并执行构建

```bash
# 安装依赖
npm install

# 执行构建
npm run build

# 检查产物
ls -lh dist/BilibiliFavsManage.user.js
```

**预期结果：**
- `dist/BilibiliFavsManage.user.js` 文件生成
- 文件包含 UserScript header
- 文件大小合理（预计 20-50KB）

**验证：**
- [ ] 构建无报错
- [ ] 产物文件存在
- [ ] 产物包含正确的 UserScript header

### 1.2 测试构建产物

1. 在油猴管理界面安装 `dist/BilibiliFavsManage.user.js`
2. 访问 B 站收藏夹页面
3. 打开控制台，检查日志输出
4. 验证全局对象 `window.BiliFavManager` 是否存在

**预期结果：**
- 脚本加载成功
- 控制台输出版本信息和收藏夹数量
- 可以通过控制台调用 API

**如果失败：**
- 检查 rollup.config.js 配置
- 检查 src/main.js 的导入路径
- 添加调试日志定位问题

---

## Phase 2: UI 模块迁移

**目标：** 将浮动面板代码从 `BilibiliFavsManage.js` 迁移到 `src/ui/`。

### 2.1 创建 UIComponents.js

**文件：** `src/ui/UIComponents.js`

**内容：** 从 `BilibiliFavsManage.js` 的 `CreateElemClass` 提取以下方法：
- `createSubDiv()`
- `createButton()`
- `createOutputTextBox()`
- `createCheckbox()`
- 所有 UI 元素创建的静态方法

**验证：**
- [ ] 文件创建完成
- [ ] 导出所有必要的函数

### 2.2 创建 EventHandlers.js

**文件：** `src/ui/EventHandlers.js`

**内容：** 从 `EventListeners` 提取：
- `mouseDown()` / `dragOnPanel()` / `stopDragOnPanel()`
- `toggleMinimize()`
- `toggleSelectAll()`
- 所有事件处理函数

**验证：**
- [ ] 文件创建完成
- [ ] 处理 `this` 上下文绑定问题

### 2.3 创建 FloatingPanel.js

**文件：** `src/ui/FloatingPanel.js`

**职责：**
- 组合 UIComponents 和 EventHandlers
- 管理面板生命周期
- 与 FavoriteManager 交互

**核心方法：**
```javascript
init()           // 初始化面板
destroy()        // 销毁面板
appendLog()      // 输出日志
updateProgress() // 更新进度
```

**验证：**
- [ ] 文件创建完成
- [ ] 类结构完整

### 2.4 修改 main.js 集成 UI

**修改：** `src/main.js`

```javascript
import { FloatingPanel } from './ui/FloatingPanel.js';
import { FavoriteManager } from './core/FavoriteManager.js';

async function main() {
  await waitForPageLoad();
  
  const manager = new FavoriteManager();
  if (!manager.initialize()) return;
  
  // 🆕 初始化 UI
  const panel = new FloatingPanel(manager);
  panel.init();
  
  window.BiliFavManager = manager;
  window.BiliFavPanel = panel;
}
```

**验证：**
- [ ] 构建成功
- [ ] 浮动面板显示
- [ ] 所有按钮可点击

---

## Phase 3: 页面检测和存储工具

**目标：** 实现跨页面流程的基础设施。

### 3.1 创建 storage.js

**文件：** `src/utils/storage.js`

**实现：** 按照 design.md 中的 API 设计编写

**验证：**
- [ ] 保存和加载状态成功
- [ ] 过期状态自动清理
- [ ] 控制台测试通过

### 3.2 创建 PageDetector.js

**文件：** `src/core/PageDetector.js`

**关键实现：**

```javascript
static getLoginUserUID() {
  // 方案 1: 从 Cookie 获取
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'DedeUserID') {
      return value;
    }
  }
  
  // 方案 2: 从页面状态获取（备选）
  if (window.__INITIAL_STATE__?.mid) {
    return String(window.__INITIAL_STATE__.mid);
  }
  
  return null;
}
```

**验证：**
- [ ] 能正确检测自己 vs 别人的页面
- [ ] 能生成正确的跳转 URL
- [ ] 在控制台测试各方法

---

## Phase 4: 扩展核心 API

**目标：** 为跨页面流程和批量模式管理添加必要的 API。

### 4.1 扩展 BilibiliAPI.js

**添加方法：**

```javascript
// 批量模式检测
static isBatchModeActive()
static async ensureBatchModeActive()

// 收藏夹存在性检查
static isFavoriteExistInDialog(dialog, favName)
```

**验证：**
- [ ] 方法实现正确
- [ ] 单独测试每个方法

### 4.2 扩展 FavoriteManager.js

**添加方法：**

```javascript
async handleCrossPageCreate(targetFavName)
async resumeCrossPageFlow()
async createFavoriteOnOwnPage(favName)
```

**修改方法：**
- `copyOnePage()` - 添加跨页面检测逻辑
- `copyFavorite()` - 添加批量模式状态检查

**验证：**
- [ ] 代码编译无错误
- [ ] 逻辑流程正确

---

## Phase 5: 实现跨页面流程

**目标：** 完整实现在别人页面创建收藏夹的跨页面流程。

### 5.1 实现 handleCrossPageCreate

**位置：** `src/core/FavoriteManager.js`

**流程：**
1. 保存当前状态到 localStorage
2. 显示提示信息（2 秒）
3. 跳转到用户自己的页面

**验证：**
- [ ] 状态保存成功
- [ ] 页面跳转正确

### 5.2 实现 resumeCrossPageFlow

**位置：** `src/core/FavoriteManager.js`

**流程：**
1. 检测 localStorage 中的状态
2. 如果有状态，执行恢复逻辑
3. 创建收藏夹
4. 跳转回原页面

**验证：**
- [ ] 页面加载时自动检测状态
- [ ] 收藏夹创建成功
- [ ] 返回原页面

### 5.3 实现 createFavoriteOnOwnPage

**策略：** 复用批量模式对话框

**流程：**
1. 点击任意收藏夹进入
2. 点击批量操作
3. 点击复制至
4. 点击新建收藏夹
5. 输入名称并创建
6. 关闭对话框

**验证：**
- [ ] 收藏夹创建成功
- [ ] 可以在侧边栏看到新收藏夹

### 5.4 集成到主流程

**修改：** `src/main.js`

在 `main()` 函数中添加：

```javascript
// 检查是否需要恢复跨页面流程
await manager.resumeCrossPageFlow();
```

**验证：**
- [ ] 完整流程测试通过

---

## Phase 6: 批量模式状态持久化

**目标：** 确保多页复制时批量模式不会丢失。

### 6.1 修改 copyOnePage

**位置：** `src/core/FavoriteManager.js`

**在方法开始添加：**

```javascript
async copyOnePage(targetFavName) {
  // 🆕 确保批量模式激活
  const batchActive = await this.api.ensureBatchModeActive();
  if (!batchActive) {
    error('无法进入批量模式');
    return false;
  }
  
  // ... 原有逻辑
}
```

**验证：**
- [ ] 多页收藏夹复制成功
- [ ] 日志显示批量模式重新激活

---

## Phase 7: UI 优化

**目标：** 改进用户体验和错误提示。

### 7.1 添加页面类型指示器

**位置：** `src/ui/FloatingPanel.js`

**实现：**
- 在面板顶部添加状态行
- 显示"当前页面：我的收藏夹"或"当前页面：他人的收藏夹"
- 不同颜色区分

**验证：**
- [ ] 指示器正确显示
- [ ] 样式美观

### 7.2 改进日志输出

**位置：** `src/utils/logger.js`

**增强：**
- 添加时间戳
- 区分日志级别（INFO/WARN/ERROR）
- 不同级别使用不同颜色

**验证：**
- [ ] 日志清晰易读
- [ ] 时间戳正确

### 7.3 添加进度指示

**位置：** `src/ui/FloatingPanel.js`

**实现：**
- 显示"第 X/Y 页"
- 显示"已复制 N 个视频"

**验证：**
- [ ] 进度更新正确

---

## Phase 8: 文档和清理

**目标：** 完善文档，清理冗余代码。

### 8.1 更新 README.md

**添加章节：**
- 项目结构
- 构建步骤
- 使用说明
- 已知限制
- 开发指南

**验证：**
- [ ] 新用户能根据 README 快速上手

### 8.2 更新 rollup.config.js

**修改 UserScript header：**
- 版本号：1.1
- 描述：包含跨页面流程说明

**验证：**
- [ ] Header 信息正确

### 8.3 代码清理

**任务：**
- [ ] 确认 `BilibiliFavsManage.js` 标记为废弃（添加注释）
- [ ] 更新 `.gitignore` 排除 `dist/` 和 `node_modules/`
- [ ] 删除 `build/` 目录（如果未使用）

---

## Phase 9: 完整测试

**目标：** 在真实环境验证所有功能。

### 9.1 基础功能测试

**场景 1：在自己页面复制到现有收藏夹**
- [ ] 单页收藏夹复制成功
- [ ] 多页收藏夹复制成功

**场景 2：在自己页面复制到新收藏夹**
- [ ] 收藏夹自动创建
- [ ] 视频复制成功

### 9.2 跨页面流程测试

**场景 3：在别人页面复制到新收藏夹**
- [ ] 检测到需要跨页面
- [ ] 显示提示信息
- [ ] 跳转到自己页面
- [ ] 收藏夹创建成功
- [ ] 返回原页面
- [ ] 用户重新点击后复制成功

### 9.3 批量模式测试

**场景 4：大收藏夹（10+ 页）复制**
- [ ] 所有页面复制成功
- [ ] 批量模式不会丢失
- [ ] 日志显示完整过程

### 9.4 边界情况测试

- [ ] 网络慢时的表现
- [ ] 页面元素加载失败的处理
- [ ] 重复收藏夹名称的处理

---

## Rollback Plan

如果出现严重问题：

1. 恢复备份：`cp BilibiliFavsManage.js.backup2 BilibiliFavsManage.js`
2. 手动安装原始版本
3. 记录问题，后续修复

---

## Success Criteria Checklist

### P0 Must Have

**功能：**
- [ ] 在别人页面能复制到新收藏夹（跨页面流程）
- [ ] 多页收藏夹完整复制（批量模式持久化）
- [ ] 浮动面板正常显示（UI 迁移完成）

**构建：**
- [ ] `npm install && npm run build` 成功
- [ ] 产物可被油猴安装
- [ ] 脚本在 B 站正常工作

**代码：**
- [ ] `src/ui/` 包含完整 UI 代码
- [ ] `src/main.js` 初始化 UI
- [ ] 模块化结构清晰

### P1 Should Have

- [ ] 页面类型指示器显示
- [ ] 日志包含时间戳和级别
- [ ] README 文档完善

### P2 Could Have

- [ ] 随机延迟
- [ ] 操作摘要统计
- [ ] CHANGELOG

---

## Timeline Estimate

- Phase 1: 0.5 小时（构建验证）
- Phase 2: 2 小时（UI 迁移）
- Phase 3: 1 小时（基础设施）
- Phase 4: 1 小时（API 扩展）
- Phase 5: 2 小时（跨页面流程）
- Phase 6: 0.5 小时（批量模式）
- Phase 7: 1 小时（UI 优化）
- Phase 8: 0.5 小时（文档）
- Phase 9: 1 小时（测试）

**总计：** 约 9.5 小时

---

## Notes

- **风险最高的部分：** Phase 5（跨页面流程），需要仔细测试状态保存和恢复
- **最容易出错的部分：** Phase 2（UI 迁移），需要注意 `this` 绑定和事件处理
- **建议的工作顺序：** 严格按照 Phase 顺序执行，每个 Phase 完成后验证再继续
- **如果时间紧张：** P2 任务可以延后，先确保 P0 功能完整
