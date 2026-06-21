# 浏览器用户脚本（UserScript）开发规范

## 概述

本文档记录浏览器用户脚本开发的构建系统、模块化架构、页面交互模式和常见问题解决方案。

## 1. 构建系统配置

### 1.1 Rollup 配置

#### 依赖选择
```json
{
  "devDependencies": {
    "@rollup/plugin-node-resolve": "^15.2.3",
    "@rollup/plugin-terser": "^0.4.4",      // ✅ 使用官方版本
    "rollup": "^4.9.6",
    "rollup-plugin-banner2": "^1.2.2"
  }
}
```

**避免的错误**：
```json
{
  "devDependencies": {
    "rollup-plugin-terser": "^7.0.2"  // ❌ 不兼容 Rollup 4.x
  }
}
```

#### 配置文件模板
```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import banner from 'rollup-plugin-banner2';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/script.user.js',
    format: 'iife',  // 立即执行函数，浏览器兼容
    name: 'ScriptName'
  },
  plugins: [
    resolve(),
    banner(() => `// ==UserScript==
// @name         脚本名称
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  功能描述
// @author       作者
// @match        https://example.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

`),
    // terser()  // 调试时注释掉，发布时启用
  ]
};
```

### 1.2 UserScript 元数据规范

**必需字段**：
- `@name`: 脚本名称（支持中文）
- `@namespace`: 命名空间（通常用 tampermonkey.net）
- `@version`: 版本号（遵循语义化版本）
- `@match`: URL 匹配模式（精确到目标页面）
- `@grant`: 权限声明（`none` 表示无特殊权限）

**可选但推荐**：
- `@description`: 功能描述
- `@author`: 作者信息
- `@license`: 许可证类型

## 2. 模块化架构设计

### 2.1 目录结构

```
src/
├── config/
│   ├── config.js         # 应用配置（延迟、常量）
│   └── selectors.js      # DOM 选择器集中管理
├── core/
│   ├── API.js            # 页面交互 API 封装
│   └── Manager.js        # 业务逻辑管理
├── ui/
│   ├── EventHandlers.js  # 事件处理
│   ├── UIComponents.js   # UI 组件工厂
│   └── Panel.js          # 主界面类
├── utils/
│   ├── dom.js            # DOM 工具函数
│   ├── logger.js         # 日志工具
│   └── storage.js        # 状态持久化
└── main.js               # 入口文件
```

### 2.2 职责分离原则

#### API 层（core/API.js）
**职责**：封装所有 DOM 查询和页面操作

**示例**：
```javascript
export class PageAPI {
  static getElement(selector) {
    const el = document.querySelector(selector);
    if (!el) {
      console.error(`Element not found: ${selector}`);
    }
    return el;
  }

  static clickButton(selector) {
    const btn = this.getElement(selector);
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  }
}
```

#### 业务层（core/Manager.js）
**职责**：处理业务流程和状态管理

**示例**：
```javascript
export class Manager {
  constructor() {
    this.api = PageAPI;
  }

  async performAction(data) {
    // 业务逻辑
    if (!this.api.clickButton('.target')) {
      return false;
    }
    // ...
    return true;
  }
}
```

#### UI 层（ui/）
**职责**：界面交互和事件处理

**示例**：
```javascript
export class Panel {
  constructor(manager) {
    this.manager = manager;  // 依赖注入
  }

  init() {
    this.createUI();
    this.attachEvents();
  }

  async onButtonClick() {
    await this.manager.performAction({...});
  }
}
```

#### 工具层（utils/）
**职责**：通用功能（日志、存储、DOM 工具）

**原则**：无业务逻辑，可跨项目复用

### 2.3 跨模块集成模式

#### 依赖注入
```javascript
// main.js
const manager = new Manager();
const panel = new Panel(manager);  // UI 依赖 Manager
panel.init();
```

#### 后期绑定（Logger 模式）
```javascript
// utils/logger.js
let globalPanel = null;

export function setLoggerPanel(panel) {
  globalPanel = panel;
}

export function log(message) {
  console.log(`[App] ${message}`);
  if (globalPanel) {
    globalPanel.appendLog(message);
  }
}

// main.js
setLoggerPanel(panel);  // ⚠️ 必须在 panel.init() 之前
panel.init();
```

**常见错误**：
```javascript
// ❌ 错误顺序
panel.init();
setLoggerPanel(panel);  // init 期间的日志会丢失
```

## 3. 页面交互模式

### 3.1 跨页面流程设计

**场景**：需要在不同页面间传递状态（如跳转到另一个页面执行操作后返回）

**方案**：localStorage + 时间戳 + 过期机制

**实现**：
```javascript
// utils/storage.js
export class Storage {
  static KEYS = {
    CROSS_PAGE_STATE: 'app_cross_page_state'
  };

  static saveCrossPageState(state) {
    const data = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(this.KEYS.CROSS_PAGE_STATE, JSON.stringify(data));
  }

  static loadCrossPageState() {
    const data = localStorage.getItem(this.KEYS.CROSS_PAGE_STATE);
    if (!data) return null;

    try {
      const state = JSON.parse(data);
      // 10 分钟过期
      if (Date.now() - state.timestamp > 10 * 60 * 1000) {
        this.clearCrossPageState();
        return null;
      }
      return state;
    } catch (e) {
      return null;
    }
  }

  static clearCrossPageState() {
    localStorage.removeItem(this.KEYS.CROSS_PAGE_STATE);
  }
}

// 使用示例
// 页面 A
Storage.saveCrossPageState({
  action: 'create_item',
  data: {name: 'test'},
  returnURL: window.location.href
});
window.location.href = 'https://example.com/target';

// 页面 B（目标页面）
const state = Storage.loadCrossPageState();
if (state && state.action === 'create_item') {
  // 执行操作
  await createItem(state.data);
  
  // 返回
  Storage.clearCrossPageState();
  window.location.href = state.returnURL;
}
```

### 3.2 页面类型检测

**场景**：判断当前页面的所有者（如：判断是自己还是别人的主页）

**方案**：URL UID 提取 + Cookie 登录 UID 对比

**实现**：
```javascript
export class PageDetector {
  static getCurrentPageUID() {
    // 从 URL 提取：https://example.com/user/123456/profile
    const match = window.location.pathname.match(/\/user\/(\d+)\//);
    return match ? match[1] : null;
  }

  static getLoginUserUID() {
    // 方案 1: 从 Cookie 获取
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'UserID') {
        return value;
      }
    }

    // 方案 2: 从页面状态获取（备选）
    if (window.__INITIAL_STATE__?.userId) {
      return String(window.__INITIAL_STATE__.userId);
    }

    return null;
  }

  static isOwnPage() {
    const pageUID = this.getCurrentPageUID();
    const loginUID = this.getLoginUserUID();
    return pageUID && loginUID && pageUID === loginUID;
  }
}
```

### 3.3 动态 UI 状态管理

**问题**：现代网站使用 Vue/React，操作后 UI 状态可能改变（如模态框关闭、按钮消失）

**解决方案**：每次操作前检测 + 自动恢复

**实现**：
```javascript
export class PageAPI {
  static isBatchModeActive() {
    return !!document.querySelector('.batch-mode-indicator');
  }

  static async ensureBatchModeActive() {
    if (this.isBatchModeActive()) {
      return true;
    }

    // 重新进入批量模式
    const btn = document.querySelector('.enter-batch-mode');
    if (btn) {
      btn.click();
      await delay(500);
      return this.isBatchModeActive();
    }

    return false;
  }

  async performBatchAction() {
    // ⚠️ 关键：操作前确保状态正确
    if (!await this.ensureBatchModeActive()) {
      console.error('无法进入批量模式');
      return false;
    }

    // 执行操作
    // ...
  }
}
```

## 4. UI 组件设计

### 4.1 拖拽面板实现

**核心原理**：记录鼠标相对位置，mousemove 时计算新坐标

**实现**：
```javascript
export class EventHandlers {
  static mouseDown(event, panel, context) {
    context.isDragging = true;
    context.startX = event.clientX - panel.offsetLeft;
    context.startY = event.clientY - panel.offsetTop;
  }

  static dragOnPanel(event, panel, context) {
    if (!context.isDragging) return;
    
    const newLeft = event.clientX - context.startX;
    const newTop = event.clientY - context.startY;
    
    panel.style.left = newLeft + 'px';
    panel.style.top = newTop + 'px';
  }

  static stopDrag(context) {
    context.isDragging = false;
  }
}

// 使用
const context = {isDragging: false, startX: 0, startY: 0};
panel.addEventListener('mousedown', (e) => 
  EventHandlers.mouseDown(e, panel, context));
document.addEventListener('mousemove', (e) => 
  EventHandlers.dragOnPanel(e, panel, context));
document.addEventListener('mouseup', () => 
  EventHandlers.stopDrag(context));
```

### 4.2 缩放面板实现

**步骤**：
1. 检测鼠标位置判断在哪个边/角
2. 根据边/角设置不同的 cursor 样式
3. mousedown 时记录方向，mousemove 时计算新尺寸
4. 设置最小尺寸防止面板消失

**实现**：
```javascript
export class EventHandlers {
  static MIN_WIDTH = 300;
  static MIN_HEIGHT = 200;

  static detectResizeEdge(event, panel) {
    const rect = panel.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edgeSize = 10;

    const onLeft = x < edgeSize;
    const onRight = x > rect.width - edgeSize;
    const onTop = y < edgeSize;
    const onBottom = y > rect.height - edgeSize;

    if (onLeft && onTop) return 'nw-resize';
    if (onRight && onTop) return 'ne-resize';
    if (onLeft && onBottom) return 'sw-resize';
    if (onRight && onBottom) return 'se-resize';
    if (onLeft) return 'w-resize';
    if (onRight) return 'e-resize';
    if (onTop) return 'n-resize';
    if (onBottom) return 's-resize';

    return '';
  }

  static startResize(event, panel, context) {
    context.resizeDirection = this.detectResizeEdge(event, panel);
    if (!context.resizeDirection) return;

    context.isResizing = true;
    context.startX = event.clientX;
    context.startY = event.clientY;
    context.startWidth = panel.offsetWidth;
    context.startHeight = panel.offsetHeight;
  }

  static resize(event, panel, context) {
    if (!context.isResizing) return;

    const dx = event.clientX - context.startX;
    const dy = event.clientY - context.startY;

    let newWidth = context.startWidth;
    let newHeight = context.startHeight;

    if (context.resizeDirection.includes('e')) {
      newWidth = Math.max(this.MIN_WIDTH, context.startWidth + dx);
    }
    if (context.resizeDirection.includes('s')) {
      newHeight = Math.max(this.MIN_HEIGHT, context.startHeight + dy);
    }

    panel.style.width = newWidth + 'px';
    panel.style.height = newHeight + 'px';
  }
}
```

### 4.3 日志面板集成

**模式**：后期绑定 + 双路输出（console + UI）

**实现**：
```javascript
// utils/logger.js
let globalPanel = null;

export function setLoggerPanel(panel) {
  globalPanel = panel;
}

export function log(message, ...args) {
  console.log(`[App]`, message, ...args);
  if (globalPanel) {
    globalPanel.appendLog(message, 'info');
  }
}

export function error(message, ...args) {
  console.error(`[App]`, message, ...args);
  if (globalPanel) {
    globalPanel.appendLog(message, 'error');
  }
}

// main.js
const manager = new Manager();
const panel = new Panel(manager);

// ⚠️ 关键：必须在 panel.init() 之前调用
setLoggerPanel(panel);
panel.init();

log('面板初始化完成');  // 同时输出到 console 和 panel
```

**时序图**：
```
正确顺序：
1. setLoggerPanel(panel)
2. panel.init()
   └─> 内部调用 log() → 输出到 console 和 panel ✓

错误顺序：
1. panel.init()
   └─> 内部调用 log() → 只输出到 console ✗ (globalPanel 为 null)
2. setLoggerPanel(panel)  // 太晚了
```

## 5. 常见问题与解决方案

### 5.1 构建依赖冲突

**问题**：`rollup-plugin-terser` 不兼容 Rollup 4.x

**错误信息**：
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer rollup@"^2.0.0" from rollup-plugin-terser@7.0.2
```

**解决**：
```json
{
  "devDependencies": {
    "@rollup/plugin-terser": "^0.4.4"  // ✅ 使用官方版本
  }
}
```

```javascript
// rollup.config.js
import terser from '@rollup/plugin-terser';  // ✅ 正确导入

// 旧版（错误）：
// import { terser } from 'rollup-plugin-terser';  // ❌
```

### 5.2 选择器维护

**原则**：集中管理所有选择器

**实现**：
```javascript
// config/selectors.js
export const SELECTORS = {
  // 按功能模块分组
  FAVORITES: {
    SIDEBAR: '.favlist-aside',
    ITEM: '.vui_sidebar-item',
    ITEM_TITLE: '.vui_sidebar-item-title .vui_ellipsis'
  },
  BATCH_MODE: {
    BUTTON: '.vui_button.favlist-info-batch',
    SELECT_ALL: '.vui_checkbox'
  },
  DIALOG: {
    CONTAINER: '.vui_dialog--content',
    CONFIRM_BUTTON: 'button.vui_button--blue'
  }
};

// 使用
import { SELECTORS } from './config/selectors.js';
const sidebar = document.querySelector(SELECTORS.FAVORITES.SIDEBAR);
```

**好处**：
- 页面改版只需修改一个文件
- 易于查找和更新
- 避免硬编码分散

### 5.3 事件处理 this 绑定

**问题**：EventHandlers 中的 this 指向问题

**错误示例**：
```javascript
// ❌ this 指向不明确
class EventHandlers {
  mouseDown(event) {
    this.isDragging = true;  // this 是谁？
  }
}

panel.addEventListener('mousedown', handlers.mouseDown);  // this 丢失
```

**正确方案 1：静态方法 + 参数传递（推荐）**
```javascript
// ✅ 清晰明确
export class EventHandlers {
  static mouseDown(event, panel, context) {
    context.isDragging = true;
  }
}

panel.addEventListener('mousedown', (e) => 
  EventHandlers.mouseDown(e, panel, context));
```

**正确方案 2：bind 绑定**
```javascript
panel.addEventListener('mousedown', 
  handlers.mouseDown.bind(handlers));
```

## 6. 测试策略

### 6.1 构建验证

```bash
# 1. 构建
npm run build

# 2. 语法检查
node -c dist/*.user.js

# 3. 产物大小检查
ls -lh dist/

# 4. Header 检查
head -15 dist/*.user.js
```

**期望结果**：
- 构建无报错
- 产物大小 < 100KB（合理范围）
- UserScript header 完整

### 6.2 浏览器测试要点

**步骤**：
1. 在油猴管理界面安装脚本
2. 刷新目标页面
3. 打开控制台检查报错
4. 验证 UI 是否显示
5. 测试核心功能
6. 测试跨页面流程（如果有）

**检查清单**：
- [ ] 脚本加载成功
- [ ] 控制台无错误
- [ ] UI 正常显示
- [ ] 拖拽功能正常
- [ ] 缩放功能正常
- [ ] 核心业务流程通过
- [ ] 日志输出正常
- [ ] 跨页面流程正常

### 6.3 常见浏览器错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| `Uncaught ReferenceError: X is not defined` | 模块未正确导出/导入 | 检查 export/import |
| `Cannot read property of undefined` | DOM 元素未找到 | 添加 null 检查 |
| `Failed to execute 'querySelector'` | 选择器语法错误 | 检查选择器字符串 |
| 面板不显示 | CSS 被页面样式覆盖 | 使用 !important 或提高优先级 |

## 7. 最佳实践总结

### 7.1 DO（推荐做法）

✅ 使用 ES6 模块系统
✅ 选择器集中管理
✅ 分层架构（API/业务/UI/工具）
✅ 日志双路输出
✅ 添加延迟和重试机制
✅ 状态持久化带过期机制
✅ 最小尺寸限制（拖拽/缩放）

### 7.2 DON'T（避免）

❌ 硬编码选择器分散各处
❌ 业务逻辑混在 UI 代码中
❌ 忘记 null 检查
❌ 忽略异步操作的延迟
❌ 直接操作 DOM 不封装
❌ 日志只输出到控制台
❌ localStorage 不设过期时间

## 8. 版本更新指南

当目标网站改版时：

1. **检测改版范围**
   - 查看哪些 DOM 结构变化
   - 记录新旧选择器对照

2. **更新选择器**
   - 修改 `config/selectors.js`
   - 运行构建验证

3. **测试验证**
   - 逐功能测试
   - 记录遗漏的改动

4. **文档更新**
   - 更新 CHANGELOG
   - 更新版本号

## 相关资源

- [Rollup 官方文档](https://rollupjs.org/)
- [Tampermonkey 文档](https://www.tampermonkey.net/documentation.php)
- [UserScript 元数据规范](https://wiki.greasespot.net/Metadata_Block)
