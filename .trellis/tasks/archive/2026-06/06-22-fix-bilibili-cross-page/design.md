# Technical Design: B 站收藏夹脚本完善

## Overview

本设计文档描述如何解决跨页面新建收藏夹、批量模式状态管理、UI 模块化迁移和构建系统完善的技术方案。

## Architecture

### 当前架构

```
项目根目录/
├── BilibiliFavsManage.js          # 原始完整版本（1131 行，待弃用）
├── src/                            # 模块化源码
│   ├── main.js                     # 入口文件（无 UI）
│   ├── config/
│   │   ├── selectors.js            # DOM 选择器配置
│   │   └── config.js               # 全局配置
│   ├── core/
│   │   ├── BilibiliAPI.js          # DOM 交互 API
│   │   └── FavoriteManager.js      # 业务逻辑
│   ├── utils/
│   │   ├── dom.js                  # DOM 工具函数
│   │   └── logger.js               # 日志工具
│   └── ui/                         # 空目录（待迁移）
├── dist/                           # 构建产物（空）
├── rollup.config.js                # 打包配置
└── package.json                    # 项目配置
```

### 目标架构

```
项目根目录/
├── src/
│   ├── main.js                     # 入口：初始化 UI + Manager
│   ├── config/
│   │   ├── selectors.js            # ✅ 已有
│   │   └── config.js               # ✅ 已有
│   ├── core/
│   │   ├── BilibiliAPI.js          # ✅ 已有，需要扩展
│   │   ├── FavoriteManager.js      # ✅ 已有，需要扩展
│   │   └── PageDetector.js         # 🆕 页面类型检测
│   ├── ui/
│   │   ├── FloatingPanel.js        # 🆕 浮动面板主类
│   │   ├── UIComponents.js         # 🆕 UI 组件工厂
│   │   └── EventHandlers.js        # 🆕 事件处理
│   └── utils/
│       ├── dom.js                  # ✅ 已有
│       ├── logger.js               # ✅ 已有
│       └── storage.js              # 🆕 状态持久化
├── dist/
│   └── BilibiliFavsManage.user.js  # 构建产物
└── BilibiliFavsManage.js           # 备份，标记为废弃
```

## Component Design

### 1. PageDetector - 页面类型检测

**职责：** 检测当前页面是否为登录用户自己的收藏夹页面。

**API 设计：**

```javascript
export class PageDetector {
  /**
   * 获取当前页面的用户 UID
   * @returns {string|null} 页面所有者的 UID
   */
  static getCurrentPageUID() {
    // 从 URL 提取：https://space.bilibili.com/123456/favlist
    const match = window.location.pathname.match(/\/space\.bilibili\.com\/(\d+)/);
    return match ? match[1] : null;
  }

  /**
   * 获取登录用户的 UID
   * @returns {string|null} 登录用户的 UID
   */
  static getLoginUserUID() {
    // 方案 A：从 cookie 中提取 DedeUserID
    // 方案 B：从页面导航栏的用户信息中提取
    // 方案 C：从 window.__INITIAL_STATE__ 中提取（如果存在）
  }

  /**
   * 检测当前页面是否为用户自己的页面
   * @returns {boolean}
   */
  static isOwnPage() {
    const pageUID = this.getCurrentPageUID();
    const loginUID = this.getLoginUserUID();
    return pageUID && loginUID && pageUID === loginUID;
  }

  /**
   * 生成用户自己的收藏夹页面 URL
   * @returns {string|null}
   */
  static getOwnFavListURL() {
    const loginUID = this.getLoginUserUID();
    return loginUID ? `https://space.bilibili.com/${loginUID}/favlist` : null;
  }
}
```

**技术细节：**

- **UID 获取方案优先级：**
  1. Cookie `DedeUserID`（最可靠）
  2. `window.__INITIAL_STATE__.mid`（如果存在）
  3. 导航栏用户头像的链接（备选）

### 2. Storage - 跨页面状态持久化

**职责：** 保存和恢复跨页面流程的状态。

**API 设计：**

```javascript
export class Storage {
  static KEYS = {
    CROSS_PAGE_STATE: 'bilibili_fav_cross_page_state'
  };

  /**
   * 保存跨页面状态
   * @param {Object} state - 状态对象
   */
  static saveCrossPageState(state) {
    const data = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(this.KEYS.CROSS_PAGE_STATE, JSON.stringify(data));
  }

  /**
   * 加载跨页面状态
   * @returns {Object|null}
   */
  static loadCrossPageState() {
    const data = localStorage.getItem(this.KEYS.CROSS_PAGE_STATE);
    if (!data) return null;

    try {
      const state = JSON.parse(data);
      // 状态超过 10 分钟失效
      if (Date.now() - state.timestamp > 10 * 60 * 1000) {
        this.clearCrossPageState();
        return null;
      }
      return state;
    } catch (e) {
      return null;
    }
  }

  /**
   * 清除跨页面状态
   */
  static clearCrossPageState() {
    localStorage.removeItem(this.KEYS.CROSS_PAGE_STATE);
  }
}
```

**状态对象结构：**

```javascript
{
  action: 'create_favorite',  // 操作类型
  targetFavName: '目标收藏夹', // 要创建的收藏夹名称
  returnURL: 'https://...',   // 返回 URL
  sourceFavName: '源收藏夹',  // 源收藏夹名称（可选）
  timestamp: 1234567890       // 时间戳
}
```

### 3. BilibiliAPI 扩展

**新增方法：**

```javascript
export class BilibiliAPI {
  // ... 已有方法

  /**
   * 检查批量模式是否激活
   * @returns {boolean}
   */
  static isBatchModeActive() {
    return elementExists(SELECTORS.SELECT_ALL_CHECKBOX);
  }

  /**
   * 确保批量模式激活
   * @returns {Promise<boolean>}
   */
  static async ensureBatchModeActive() {
    if (this.isBatchModeActive()) {
      return true;
    }

    log('批量模式已退出，重新进入');
    return await this.clickBatchOperationButton();
  }

  /**
   * 检查目标收藏夹是否存在（在对话框中）
   * @param {Element} dialog - 对话框
   * @param {string} favName - 收藏夹名称
   * @returns {boolean}
   */
  static isFavoriteExistInDialog(dialog, favName) {
    const favList = this.getFavoriteListInDialog(dialog);
    return favList.some(fav => fav.name === favName);
  }
}
```

### 4. FavoriteManager 扩展

**新增跨页面流程方法：**

```javascript
export class FavoriteManager {
  // ... 已有方法

  /**
   * 复制当前页的视频（增强版，支持跨页面）
   * @param {string} targetFavName - 目标收藏夹名称
   * @returns {Promise<boolean>}
   */
  async copyOnePage(targetFavName) {
    // 1. 全选
    if (!this.api.clickSelectAll()) return false;
    await delay(CONFIG.DELAY.SHORT);

    // 2. 点击复制按钮
    if (!await this.api.clickCopyButton()) return false;

    // 3. 等待对话框
    const dialog = await this.api.waitForDialog();
    if (!dialog) {
      error('对话框未出现');
      return false;
    }

    // 4. 检查目标收藏夹是否存在
    const exists = this.api.isFavoriteExistInDialog(dialog, targetFavName);

    if (!exists) {
      // 🆕 检测页面类型
      const isOwnPage = PageDetector.isOwnPage();
      
      if (!isOwnPage) {
        log('检测到在别人的页面，需要跨页面创建收藏夹');
        // 关闭对话框
        const cancelBtn = dialog.querySelector('button:not(.vui_button--blue)');
        if (cancelBtn) cancelBtn.click();
        
        // 🆕 启动跨页面流程
        return await this.handleCrossPageCreate(targetFavName);
      }

      // 在自己页面，直接创建
      const createSuccess = await this.createNewFavorite(dialog, targetFavName);
      if (!createSuccess) return false;
    }

    // 5. 选择目标收藏夹
    await delay(CONFIG.DELAY.SHORT);
    if (!this.api.selectFavoriteInDialog(dialog, targetFavName)) return false;

    // 6. 点击确定
    await delay(CONFIG.DELAY.SHORT);
    return await this.api.clickConfirmButton(dialog);
  }

  /**
   * 🆕 处理跨页面创建收藏夹
   * @param {string} targetFavName - 目标收藏夹名称
   * @returns {Promise<boolean>}
   */
  async handleCrossPageCreate(targetFavName) {
    // 保存状态
    Storage.saveCrossPageState({
      action: 'create_favorite',
      targetFavName: targetFavName,
      returnURL: window.location.href,
      sourceFavName: this.api.getCurrentFavoriteName()
    });

    // 跳转到用户自己的页面
    const ownURL = PageDetector.getOwnFavListURL();
    if (!ownURL) {
      error('无法获取用户自己的收藏夹页面 URL');
      return false;
    }

    log(`跳转到自己的收藏夹页面以创建 [${targetFavName}]`);
    log('完成后将自动返回并继续复制');
    
    await delay(2000); // 给用户时间看到提示
    window.location.href = ownURL;
    
    return false; // 当前流程中断，等待页面跳转
  }

  /**
   * 🆕 恢复跨页面流程
   * @returns {Promise<void>}
   */
  async resumeCrossPageFlow() {
    const state = Storage.loadCrossPageState();
    if (!state) return;

    log('检测到跨页面流程状态，继续执行');
    log(`操作: ${state.action}, 收藏夹: ${state.targetFavName}`);

    if (state.action === 'create_favorite') {
      // 在自己页面创建收藏夹
      const createSuccess = await this.createFavoriteOnOwnPage(state.targetFavName);
      
      if (createSuccess) {
        log(`✓ 收藏夹 [${state.targetFavName}] 创建成功`);
        log('返回原页面继续复制...');
        
        await delay(2000);
        Storage.clearCrossPageState();
        window.location.href = state.returnURL;
      } else {
        error(`创建收藏夹 [${state.targetFavName}] 失败`);
        Storage.clearCrossPageState();
      }
    }
  }

  /**
   * 🆕 在自己页面创建收藏夹（无需先进入批量模式）
   * @param {string} favName - 收藏夹名称
   * @returns {Promise<boolean>}
   */
  async createFavoriteOnOwnPage(favName) {
    // 方案 A：通过 B 站原生 UI 创建（推荐）
    // 1. 定位"新建收藏夹"按钮（通常在侧边栏顶部）
    // 2. 点击打开创建对话框
    // 3. 输入名称并创建
    
    // 方案 B：通过批量模式的对话框创建
    // 1. 进入任意收藏夹的批量模式
    // 2. 打开"复制至"对话框
    // 3. 点击新建收藏夹
    
    // 实施方案 B（复用现有逻辑）
    // TODO: 实现细节
  }
}
```

### 5. FloatingPanel - UI 主类

**职责：** 管理浮动面板的生命周期和交互。

**API 设计：**

```javascript
export class FloatingPanel {
  constructor(manager) {
    this.manager = manager;  // FavoriteManager 实例
    this.panel = null;
    this.outputBox = null;
    this.favorites = [];
  }

  /**
   * 初始化并显示面板
   */
  init() {
    this.loadFavorites();
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
    this.attachEvents();
    this.showPageTypeIndicator();
  }

  /**
   * 创建面板 DOM
   */
  createPanel() {
    // 迁移自 CreateElemClass.createBigPanel()
  }

  /**
   * 🆕 显示页面类型指示器
   */
  showPageTypeIndicator() {
    const isOwnPage = PageDetector.isOwnPage();
    const indicator = this.panel.querySelector('.page-type-indicator');
    if (indicator) {
      indicator.textContent = isOwnPage ? '当前页面：我的收藏夹' : '当前页面：他人的收藏夹';
      indicator.style.color = isOwnPage ? '#00a000' : '#ff8800';
    }
  }

  /**
   * 加载收藏夹列表
   */
  loadFavorites() {
    this.favorites = this.manager.getAllFavoriteNames();
  }

  /**
   * 附加事件监听器
   */
  attachEvents() {
    // 迁移自 EventListeners
  }

  /**
   * 输出日志到面板
   */
  appendLog(message, type = 'info') {
    // 迁移自原始代码的 appendInfo 方法
  }
}
```

## Data Flow

### 正常流程（在自己页面）

```
用户选择源和目标 → 点击开始复制
  ↓
FavoriteManager.copyFavorite()
  ↓
进入批量模式
  ↓
逐页复制
  ↓
  copyOnePage() → 全选 → 复制至 → 选择/创建收藏夹 → 确定
  ↓
下一页（如果有）
  ↓
完成
```

### 跨页面流程（在别人页面）

```
用户选择源和目标 → 点击开始复制
  ↓
FavoriteManager.copyFavorite()
  ↓
进入批量模式
  ↓
第一页复制
  ↓
  copyOnePage() → 全选 → 复制至 → 检测：目标收藏夹不存在 && 在别人页面
  ↓
保存状态到 localStorage
  ↓
跳转到自己的页面
  ↓
---（页面重新加载）---
  ↓
脚本启动 → 检测到跨页面状态
  ↓
resumeCrossPageFlow() → 创建收藏夹
  ↓
跳转回原页面
  ↓
---（页面重新加载）---
  ↓
用户重新点击"开始复制"（此时收藏夹已存在）
  ↓
正常复制流程
```

## Migration Strategy

### UI 迁移步骤

1. **Phase 1：提取 UI 组件工厂**
   - 将 `CreateElemClass` 的静态方法提取到 `UIComponents.js`
   - 保持 API 不变，纯迁移

2. **Phase 2：提取事件处理器**
   - 将 `EventListeners` 的方法提取到 `EventHandlers.js`
   - 处理 `this` 上下文绑定

3. **Phase 3：封装浮动面板**
   - 创建 `FloatingPanel` 类
   - 整合组件工厂和事件处理器
   - 对外提供简洁的 API

4. **Phase 4：集成到 main.js**
   - 修改 `main.js`，初始化 `FloatingPanel`
   - 测试完整功能

### 回滚策略

- 保留 `BilibiliFavsManage.js` 作为备份
- 如果模块化版本失败，可以快速回退到原始版本

## Tradeoffs & Decisions

### 决策 1：跨页面流程的实现方式

**选项 A：自动跳转**
- 优点：用户体验流畅，自动化程度高
- 缺点：状态管理复杂，可能失败
- **决定：采用此方案**，因为 B 站页面结构稳定

**选项 B：手动提示**
- 优点：实现简单，不会出错
- 缺点：用户体验差，需要手动操作
- **作为降级方案**

### 决策 2：UID 获取方式

**选项 A：Cookie `DedeUserID`**
- 优点：最可靠，油猴脚本可以直接访问
- 缺点：需要 `@grant document.cookie` 权限
- **决定：采用此方案**

**选项 B：从页面 DOM 提取**
- 优点：不需要额外权限
- 缺点：依赖页面结构，可能不稳定

### 决策 3：批量模式状态检测

**方案：** 每页操作前检测全选按钮是否存在
- 如果不存在，重新点击"批量操作"按钮
- 添加重试机制（最多 3 次）

### 决策 4：UI 迁移策略

**方案：** 先迁移再重构
- 第一阶段：逐类迁移，保持原有结构
- 第二阶段：如果时间允许，进行重构优化
- **决定：采用此方案**，降低风险

## Testing Strategy

### 单元测试场景

- `PageDetector.isOwnPage()` - 不同 URL 场景
- `Storage.saveCrossPageState()` / `loadCrossPageState()` - 状态持久化

### 集成测试场景

1. **在自己页面复制到新收藏夹**
   - 验证：收藏夹创建成功，视频复制成功

2. **在别人页面复制到新收藏夹**
   - 验证：跨页面流程启动，状态保存，收藏夹创建，返回原页面

3. **多页收藏夹复制**
   - 验证：批量模式状态持久化，所有页面复制成功

4. **构建验证**
   - 验证：`npm run build` 成功，产物可用

## Performance Considerations

- **延迟控制：** 保持现有延迟配置（SHORT/MIDDLE/LONG）
- **DOM 查询优化：** 复用选择器结果，避免重复查询
- **状态清理：** 跨页面状态及时清理，避免 localStorage 污染

## Security Considerations

- **XSS 防护：** 所有用户输入（收藏夹名称）需要 sanitize
- **权限最小化：** 只使用必要的 UserScript 权限
- **数据隔离：** localStorage key 使用唯一前缀，避免冲突

## Open Questions

1. ~~如何获取登录用户 UID？~~ → Cookie `DedeUserID`
2. ~~如何在自己页面创建收藏夹？~~ → 复用批量模式对话框
3. 构建产物体积是否需要压缩？ → 测试后决定
4. 是否需要添加单元测试框架？ → P2 任务，暂不实施
