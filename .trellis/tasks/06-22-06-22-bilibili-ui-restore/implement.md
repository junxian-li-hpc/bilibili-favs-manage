# 实施计划

## 概述

本任务恢复旧版复选框列表 UI，修复跨页面创建收藏夹流程，过滤"我追的合集/收藏夹"。
实施顺序：Phase 1（过滤） → Phase 2（UI 恢复） → Phase 3（跨页面流程） → Phase 4（构建测试）

## 实施顺序

按以下阶段顺序实施，每个阶段可独立验证。

---

## Phase 1: 过滤逻辑（最小变更，先验证基础能力）

### 目标
只显示"我创建的收藏夹"，过滤掉"我追的合集/收藏夹"和"其他收藏"。

### 1.1 修改 BilibiliAPI.js

**文件:** `src/core/BilibiliAPI.js`

**新增方法 `getCreatedFavorites()`（在 line 46 之后插入）:**

```javascript
/**
 * 获取"我创建的收藏夹"分组中的收藏夹项（过滤"我追的"和"其他收藏"）
 * @returns {Array<Element>} 收藏夹项数组
 */
static getCreatedFavorites() {
  const sidebar = document.querySelector(SELECTORS.FAVORITES_SIDEBAR);
  if (!sidebar) {
    error('找不到收藏夹侧边栏容器');
    return [];
  }

  const allNodes = Array.from(sidebar.childNodes);
  const favorites = [];
  let inCreatedSection = false;

  for (const node of allNodes) {
    // 检测"我创建的收藏夹"文本节点
    if (node.nodeType === Node.TEXT_NODE && 
        node.textContent.trim() === '我创建的收藏夹') {
      inCreatedSection = true;
      continue;
    }

    // 检测分隔标记（"我追的"或"其他收藏"）
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text === '我追的合集/收藏夹' || text === '其他收藏') {
        inCreatedSection = false;
        continue;
      }
    }

    // 收集"我创建的收藏夹"分组中的 .vui_sidebar-item
    if (inCreatedSection && 
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList && node.classList.contains('vui_sidebar-item')) {
      favorites.push(node);
    }
  }

  log('过滤结果: 总数', allNodes.filter(n => n.classList?.contains('vui_sidebar-item')).length, 
      '→ 我创建的', favorites.length);
  
  return favorites;
}
```

**修改现有方法 `getAllFavorites()`（line 31-45）:**

Before:
```javascript
static getAllFavorites() {
  const parentElement = document.querySelector(SELECTORS.FAVORITES_SIDEBAR);
  if (!parentElement) {
    error('找不到收藏夹侧边栏容器', SELECTORS.FAVORITES_SIDEBAR);
    return [];
  }

  const items = parentElement.querySelectorAll(SELECTORS.FAVORITES_ITEM);
  // 延迟日志：只有在 logger 已初始化时才输出
  if (typeof log === 'function') {
    // 使用 setTimeout 延迟到下一个事件循环，确保 panel 已初始化
    setTimeout(() => log('找到收藏夹数量:', items.length), 0);
  }
  return items;
}
```

After:
```javascript
static getAllFavorites() {
  // 调用 getCreatedFavorites() 进行过滤
  return this.getCreatedFavorites();
}
```

**验证检查点:**
- [ ] 控制台日志显示过滤前后的收藏夹数量（例如：`过滤结果: 总数 50 → 我创建的 20`）
- [ ] 输出面板日志显示正确的收藏夹数量
- [ ] 不应该抛出任何错误

---

## Phase 2: 恢复复选框列表 UI

### 目标
移除下拉框选择器，恢复旧版的复选框列表 UI，每个收藏夹一行（复选框 + 名称标签 + 目标输入框）。

### 2.1 修改 FloatingPanel.js - 移除下拉框相关代码

**文件:** `src/ui/FloatingPanel.js`

**Step 1: 移除属性定义（line 44-45）**

Before:
```javascript
this.sourceSelect = null;
this.targetSelect = null;
```

After:
```javascript
// 已移除 sourceSelect 和 targetSelect（改用复选框列表）
this.favCheckboxItemList = [];  // 新增：复选框项列表
```

**Step 2: 修改 createLeftPanel() 方法（line 100-116）**

Before:
```javascript
createLeftPanel() {
  const leftPanel = UIComponents.createSubDiv('left-panel', 'left');
  leftPanel.style.flexGrow = '0';
  leftPanel.style.backgroundColor = '#f5f5f5';
  leftPanel.style.flexDirection = 'column';

  // 创建按钮面板
  const btnPanel = this.createButtonPanel();
  leftPanel.appendChild(btnPanel);

  // 创建选择器面板
  const selectorPanel = this.createSelectorPanel();
  leftPanel.appendChild(selectorPanel);

  return leftPanel;
}
```

After:
```javascript
createLeftPanel() {
  const leftPanel = UIComponents.createSubDiv('left-panel', 'left');
  leftPanel.style.flexGrow = '0';
  leftPanel.style.backgroundColor = '#f5f5f5';
  leftPanel.style.flexDirection = 'column';

  // 创建按钮面板
  const btnPanel = this.createButtonPanel();
  leftPanel.appendChild(btnPanel);

  // 创建收藏夹面板（复选框列表）
  const favPanel = this.createFavPanel();
  leftPanel.appendChild(favPanel);

  return leftPanel;
}
```

**Step 3: 删除整个 createSelectorPanel() 方法（line 178-235）**

删除从 `createSelectorPanel() {` 到对应的 `}` 的所有内容。

---

### 2.2 修改 FloatingPanel.js - 新增复选框列表方法

**文件:** `src/ui/FloatingPanel.js`

**新增方法（在 createLeftPanel() 之后，line 116 后插入）:**

```javascript
/**
 * 创建收藏夹面板（复选框列表）
 */
createFavPanel() {
  const favPanel = document.createElement('div');
  favPanel.className = 'fav-panel';
  favPanel.style.display = 'flex';
  favPanel.style.flexDirection = 'column';
  favPanel.style.padding = '10px';
  favPanel.style.border = '1px solid #ccc';
  favPanel.style.backgroundColor = '#fff';
  favPanel.style.flexGrow = '1';
  favPanel.style.overflow = 'auto';

  // 标题行
  const titleRow = document.createElement('div');
  titleRow.style.display = 'flex';
  titleRow.style.justifyContent = 'space-between';
  titleRow.style.marginBottom = '10px';

  const srcTitle = document.createElement('h4');
  srcTitle.textContent = '源收藏夹';
  srcTitle.style.margin = '0';
  srcTitle.style.fontWeight = 'bold';

  const dstTitle = document.createElement('h4');
  dstTitle.textContent = '目标收藏夹';
  dstTitle.style.margin = '0';
  dstTitle.style.fontWeight = 'bold';

  titleRow.appendChild(srcTitle);
  titleRow.appendChild(dstTitle);
  favPanel.appendChild(titleRow);

  // 创建复选框项列表
  this.favCheckboxItemList = this.createFavCheckboxItems();
  for (const item of this.favCheckboxItemList) {
    favPanel.appendChild(item.checkboxContainer);
  }

  return favPanel;
}

/**
 * 创建复选框项列表
 */
createFavCheckboxItems() {
  const items = [];
  for (const favName of this.favorites) {
    const checkboxItem = new CheckboxItem(favName);
    items.push(checkboxItem);
  }
  return items;
}

/**
 * 获取选中的复制任务列表
 * @returns {Array<{source: string, target: string}>}
 */
getSelectedTasks() {
  const tasks = [];
  for (const item of this.favCheckboxItemList) {
    if (item.getCheckboxValue()) {
      tasks.push({
        source: item.getLabelValue(),
        target: item.getInputTextValue()
      });
    }
  }
  return tasks;
}
```

---

### 2.3 修改 FloatingPanel.js - 更新按钮面板

**文件:** `src/ui/FloatingPanel.js`

**修改 createButtonPanel() 方法（line 148-175）:**

Before:
```javascript
createButtonPanel() {
  const btnPanel = document.createElement('div');
  btnPanel.className = 'btn-panel';
  btnPanel.style.display = 'flex';
  btnPanel.style.border = '1px solid #ccc';
  btnPanel.style.backgroundColor = '#e8e8e8';
  btnPanel.style.flexDirection = 'column';

  const startBatchTransferButton = UIComponents.createButton('开始批量复制', () => {
    this.startBatchTransfer();
  });

  this.minimizeButton = UIComponents.createButton('点我最小化', () => {
    EventHandlers.toggleMinimize(this);
  });

  const destroyButton = UIComponents.createButton('点我销毁', () => {
    this.floatingPanel.remove();
  });

  btnPanel.appendChild(startBatchTransferButton);
  btnPanel.appendChild(this.minimizeButton);
  btnPanel.appendChild(destroyButton);

  this.startBatchTransferButton = startBatchTransferButton;

  return btnPanel;
}
```

After:
```javascript
createButtonPanel() {
  const btnPanel = document.createElement('div');
  btnPanel.className = 'btn-panel';
  btnPanel.style.display = 'flex';
  btnPanel.style.border = '1px solid #ccc';
  btnPanel.style.backgroundColor = '#e8e8e8';
  btnPanel.style.flexDirection = 'column';

  // 全选按钮
  this.selectAllButton = UIComponents.createButton('点我全选', () => {
    this.toggleSelectAll();
  });

  const startBatchTransferButton = UIComponents.createButton('开始批量复制', () => {
    this.startBatchTransfer();
  });

  this.minimizeButton = UIComponents.createButton('点我最小化', () => {
    EventHandlers.toggleMinimize(this);
  });

  const destroyButton = UIComponents.createButton('点我销毁', () => {
    this.floatingPanel.remove();
  });

  btnPanel.appendChild(this.selectAllButton);
  btnPanel.appendChild(startBatchTransferButton);
  btnPanel.appendChild(this.minimizeButton);
  btnPanel.appendChild(destroyButton);

  this.startBatchTransferButton = startBatchTransferButton;

  return btnPanel;
}
```

**新增 toggleSelectAll() 方法（在 createButtonPanel() 之后插入）:**

```javascript
/**
 * 切换全选状态
 */
toggleSelectAll() {
  if (this.selectAllButton.textContent === '点我全选') {
    for (const item of this.favCheckboxItemList) {
      item.checkbox.checked = true;
    }
    this.selectAllButton.textContent = '点我全部取消';
  } else {
    for (const item of this.favCheckboxItemList) {
      item.checkbox.checked = false;
    }
    this.selectAllButton.textContent = '点我全选';
  }
}
```

---

### 2.4 修改 FloatingPanel.js - 重写 startBatchTransfer()

**文件:** `src/ui/FloatingPanel.js`

**重写 startBatchTransfer() 方法（line 306-351）:**

Before:
```javascript
async startBatchTransfer() {
  const source = this.sourceSelect.value;
  const targetFromInput = this.targetInput.value.trim();
  const targetFromSelect = this.targetSelect.value;

  // 优先使用输入框的值
  const target = targetFromInput || targetFromSelect;

  if (!source) {
    this.appendLog('错误: 请选择源收藏夹', this.errorCode);
    return;
  }

  if (!target) {
    this.appendLog('错误: 请选择或输入目标收藏夹', this.errorCode);
    return;
  }

  if (source === target) {
    this.appendLog('错误: 源收藏夹和目标收藏夹不能相同', this.errorCode);
    return;
  }

  this.appendLog(`开始复制: ${source} → ${target}`, this.startBatchCode);

  // 禁用按钮
  this.startBatchTransferButton.disabled = true;
  this.startBatchTransferButton.textContent = '复制中...';

  try {
    const success = await this.manager.copyFavorite(source, target);
    if (success) {
      this.appendLog('✓ 复制完成!', this.endBatchCode);
    } else {
      this.appendLog('✗ 复制失败', this.errorCode);
    }
  } catch (err) {
    this.appendLog(`✗ 复制出错: ${err.message}`, this.errorCode);
    console.error(err);
  } finally {
    // 恢复按钮
    this.startBatchTransferButton.disabled = false;
    this.startBatchTransferButton.textContent = '开始批量复制';
  }
}
```

After:
```javascript
async startBatchTransfer() {
  // 获取选中的复制任务
  const tasks = this.getSelectedTasks();

  if (tasks.length === 0) {
    this.appendLog('错误: 请至少勾选一个源收藏夹', this.errorCode);
    return;
  }

  this.appendLog(`开始批量复制，共 ${tasks.length} 个任务`, this.startBatchCode);

  // 禁用按钮
  this.startBatchTransferButton.disabled = true;
  this.selectAllButton.disabled = true;
  this.startBatchTransferButton.textContent = '复制中...';

  try {
    // 调用 FavoriteManager 的批量复制方法
    await this.manager.batchCopy(tasks);
    this.appendLog('✓ 批量复制完成!', this.endBatchCode);
  } catch (err) {
    this.appendLog(`✗ 批量复制出错: ${err.message}`, this.errorCode);
    console.error(err);
  } finally {
    // 恢复按钮
    this.startBatchTransferButton.disabled = false;
    this.selectAllButton.disabled = false;
    this.startBatchTransferButton.textContent = '开始批量复制';
  }
}
```

**验证检查点:**
- [ ] 左侧面板显示复选框列表，不再显示下拉框
- [ ] 每个复选框项包含：复选框、名称标签、目标输入框
- [ ] "点我全选"按钮可以切换全选/全部取消状态
- [ ] 目标输入框默认值为源收藏夹名称
- [ ] 可以勾选多个收藏夹，修改各自的目标名称
- [ ] 点击"开始批量复制"后，依次处理所有勾选项
- [ ] 输出面板显示每个任务的进度

---

## Phase 3: 跨页面流程

### 目标
实现跨页面创建收藏夹流程：在别人页面无法创建收藏夹时，自动跳转到自己页面批量创建，然后返回继续复制。

### 3.1 新建 StateManager.js

**文件:** `src/core/StateManager.js`（新建）

```javascript
/**
 * 跨页面状态管理器
 * 使用 GM_setValue/GM_getValue 持久化状态
 */

const STATE_KEY = 'bilibili_fav_cross_page_state';
const STATE_EXPIRE_TIME = 30 * 60 * 1000; // 30 分钟

export class StateManager {
  /**
   * 保存跨页面状态
   * @param {Object} state - 状态对象
   */
  static saveState(state) {
    const data = {
      ...state,
      timestamp: Date.now()
    };
    
    // 如果 GM_setValue 可用，使用 GM API；否则使用 localStorage
    if (typeof GM_setValue !== 'undefined') {
      GM_setValue(STATE_KEY, JSON.stringify(data));
    } else {
      localStorage.setItem(STATE_KEY, JSON.stringify(data));
    }
  }

  /**
   * 加载跨页面状态
   * @returns {Object|null}
   */
  static loadState() {
    let dataStr = null;
    
    // 尝试从 GM API 读取
    if (typeof GM_getValue !== 'undefined') {
      dataStr = GM_getValue(STATE_KEY, null);
    } else {
      dataStr = localStorage.getItem(STATE_KEY);
    }
    
    if (!dataStr) return null;

    try {
      const state = JSON.parse(dataStr);
      
      // 检查是否过期
      if (Date.now() - state.timestamp > STATE_EXPIRE_TIME) {
        this.clearState();
        return null;
      }
      
      return state;
    } catch (e) {
      console.error('[StateManager] 解析状态失败:', e);
      return null;
    }
  }

  /**
   * 清除跨页面状态
   */
  static clearState() {
    if (typeof GM_deleteValue !== 'undefined') {
      GM_deleteValue(STATE_KEY);
    } else {
      localStorage.removeItem(STATE_KEY);
    }
  }

  /**
   * 检查状态是否存在
   * @returns {boolean}
   */
  static hasState() {
    return this.loadState() !== null;
  }
}
```

---

### 3.2 新建 CrossPageFlowManager.js

**文件:** `src/core/CrossPageFlowManager.js`（新建）

```javascript
/**
 * 跨页面流程管理器
 * 处理跨页面创建收藏夹的完整流程
 */

import { StateManager } from './StateManager.js';
import { PageDetector } from './PageDetector.js';
import { BilibiliAPI } from './BilibiliAPI.js';
import { delay } from '../utils/dom.js';
import { log, error } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

export class CrossPageFlowManager {
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * 开始跨页面流程：保存状态并跳转到自己页面
   * @param {Array<{source: string, target: string}>} tasks - 复制任务列表
   * @returns {Promise<void>}
   */
  async startCrossPageFlow(tasks) {
    // 获取需要创建的收藏夹列表
    const currentFavs = this.manager.getAllFavoriteNames();
    const missingFavs = tasks
      .map(t => t.target)
      .filter((name, index, self) => self.indexOf(name) === index) // 去重
      .filter(name => !currentFavs.includes(name)); // 过滤已存在的

    if (missingFavs.length === 0) {
      log('所有目标收藏夹均已存在，无需跨页面创建');
      return;
    }

    log(`检测到 ${missingFavs.length} 个收藏夹需要创建:`, missingFavs.join(', '));

    // 保存状态
    StateManager.saveState({
      phase: 'creating',
      returnURL: window.location.href,
      tasks: tasks,
      missingFavs: missingFavs
    });

    // 跳转到自己的收藏夹页面
    const ownURL = PageDetector.getOwnFavListURL();
    if (!ownURL) {
      error('无法获取用户自己的收藏夹页面 URL');
      return;
    }

    log('========================================');
    log('即将跳转到自己的收藏夹页面批量创建收藏夹');
    log('完成后将自动返回并继续复制');
    log('跳转倒计时: 3 秒...');
    log('========================================');

    await delay(3000);
    window.location.href = ownURL;
  }

  /**
   * 在自己页面批量创建收藏夹
   * @param {Array<string>} favNames - 收藏夹名称列表
   * @returns {Promise<boolean>}
   */
  async batchCreateFavorites(favNames) {
    log('========================================');
    log('开始批量创建收藏夹');
    log(`共 ${favNames.length} 个: ${favNames.join(', ')}`);
    log('========================================');

    for (let i = 0; i < favNames.length; i++) {
      const favName = favNames[i];
      log(`[${i + 1}/${favNames.length}] 创建收藏夹: ${favName}`);

      const success = await this.createSingleFavorite(favName);
      if (!success) {
        error(`创建收藏夹 [${favName}] 失败`);
        return false;
      }

      // 创建间隔延迟
      if (i < favNames.length - 1) {
        await delay(CONFIG.DELAY.MIDDLE);
      }
    }

    log('✓ 批量创建完成!');
    return true;
  }

  /**
   * 创建单个收藏夹（通过批量模式对话框）
   * @param {string} favName - 收藏夹名称
   * @returns {Promise<boolean>}
   */
  async createSingleFavorite(favName) {
    // 1. 点击第一个收藏夹（确保有内容可操作）
    const allFavs = BilibiliAPI.getAllFavorites();
    if (allFavs.length === 0) {
      error('找不到任何收藏夹');
      return false;
    }

    allFavs[0].click();
    await delay(CONFIG.DELAY.MIDDLE);

    // 2. 进入批量操作模式
    const batchSuccess = await BilibiliAPI.clickBatchOperationButton();
    if (!batchSuccess) {
      error('无法进入批量模式');
      return false;
    }

    // 3. 点击复制按钮打开对话框
    if (!await BilibiliAPI.clickCopyButton()) {
      return false;
    }

    // 4. 等待对话框
    const dialog = await BilibiliAPI.waitForDialog();
    if (!dialog) {
      error('对话框未出现');
      return false;
    }

    // 5. 创建新收藏夹
    const createSuccess = await this.manager.createNewFavorite(dialog, favName);
    if (!createSuccess) {
      // 关闭对话框
      const cancelBtn = dialog.querySelector('button:not(.vui_button--blue)');
      if (cancelBtn) cancelBtn.click();
      return false;
    }

    // 6. 关闭对话框
    await delay(CONFIG.DELAY.SHORT);
    const cancelBtn = dialog.querySelector('button:not(.vui_button--blue)');
    if (cancelBtn) {
      cancelBtn.click();
      await delay(CONFIG.DELAY.SHORT);
    }

    return true;
  }

  /**
   * 恢复跨页面流程（页面加载时调用）
   * @returns {Promise<boolean>} 是否处理了跨页面流程
   */
  async resumeFlow() {
    const state = StateManager.loadState();
    if (!state) {
      return false; // 没有跨页面状态
    }

    log('========================================');
    log('检测到跨页面流程状态');
    log(`阶段: ${state.phase}`);
    log('========================================');

    if (state.phase === 'creating') {
      // 在自己页面，执行批量创建
      const success = await this.batchCreateFavorites(state.missingFavs);

      if (success) {
        // 更新状态：准备返回复制
        StateManager.saveState({
          ...state,
          phase: 'copying'
        });

        log('========================================');
        log('收藏夹创建完成，返回原页面继续复制');
        log('跳转倒计时: 3 秒...');
        log('========================================');

        await delay(3000);
        window.location.href = state.returnURL;
      } else {
        error('收藏夹创建失败，请手动创建后重试');
        StateManager.clearState();
      }

      return true;
    } else if (state.phase === 'copying') {
      // 回到原页面，继续复制流程
      log('========================================');
      log('已返回原页面，继续复制流程');
      log('========================================');

      // 清除状态
      StateManager.clearState();

      // 自动触发复制流程
      await this.manager.batchCopy(state.tasks);

      return true;
    }

    return false;
  }
}
```

---

### 3.3 修改 FavoriteManager.js

**文件:** `src/core/FavoriteManager.js`

**Step 1: 添加导入（在文件顶部）**

Before:
```javascript
import { BilibiliAPI } from './BilibiliAPI.js';
import { PageDetector } from './PageDetector.js';
import { delay } from '../utils/dom.js';
import { log, error, warn } from '../utils/logger.js';
import { Storage } from '../utils/storage.js';
import { CONFIG } from '../config/config.js';
```

After:
```javascript
import { BilibiliAPI } from './BilibiliAPI.js';
import { PageDetector } from './PageDetector.js';
import { CrossPageFlowManager } from './CrossPageFlowManager.js';
import { delay } from '../utils/dom.js';
import { log, error, warn } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';
```

**Step 2: 修改 constructor（line 14-16）**

Before:
```javascript
constructor() {
  this.api = BilibiliAPI;
}
```

After:
```javascript
constructor() {
  this.api = BilibiliAPI;
  this.crossPageFlow = new CrossPageFlowManager(this);
}
```

**Step 3: 修改 batchCopy() 方法（line 199-221）**

在方法开头添加跨页面检测逻辑：

Before:
```javascript
async batchCopy(copyList) {
  log('开始批量复制，共', copyList.length, '个任务');

  for (let i = 0; i < copyList.length; i++) {
    const { source, target } = copyList[i];
    log(`\n[${i + 1}/${copyList.length}] ${source} → ${target}`);

    await this.copyFavorite(source, target);

    // 任务间延迟
    if (i < copyList.length - 1) {
      await delay(CONFIG.DELAY.MIDDLE);
    }
  }

  log('\n批量复制完成！');
}
```

After:
```javascript
async batchCopy(copyList) {
  log('开始批量复制，共', copyList.length, '个任务');

  // 检测是否需要跨页面创建收藏夹
  const isOwnPage = PageDetector.isOwnPage();
  if (!isOwnPage) {
    // 在别人页面，检查是否有需要创建的收藏夹
    const currentFavs = this.getAllFavoriteNames();
    const needCreate = copyList.some(task => !currentFavs.includes(task.target));
    
    if (needCreate) {
      log('检测到在别人页面且需要创建新收藏夹');
      log('启动跨页面流程...');
      await this.crossPageFlow.startCrossPageFlow(copyList);
      return; // 跳转后中断当前流程
    }
  }

  // 正常复制流程
  for (let i = 0; i < copyList.length; i++) {
    const { source, target } = copyList[i];
    log(`\n[${i + 1}/${copyList.length}] ${source} → ${target}`);

    await this.copyFavorite(source, target);

    // 任务间延迟
    if (i < copyList.length - 1) {
      await delay(CONFIG.DELAY.MIDDLE);
    }
  }

  log('\n批量复制完成！');
}
```

**Step 4: 删除旧的跨页面方法（line 222-346）**

删除以下方法（已被 CrossPageFlowManager 替代）：
- `handleCrossPageCreate()` (line 222-251)
- `resumeCrossPageFlow()` (line 256-285)
- `createFavoriteOnOwnPage()` (line 292-346)

---

### 3.4 修改 main.js

**文件:** `src/main.js`

**修改 main() 函数（line 23-69）:**

Before:
```javascript
async function main() {
  await waitForPageLoad();

  log('脚本启动 v1.1');

  // 创建管理器实例
  const manager = new FavoriteManager();

  // 初始化并检测页面版本
  if (!manager.initialize()) {
    log('页面版本不支持，脚本退出');
    return;
  }

  // 检测页面类型
  const isOwnPage = PageDetector.isOwnPage();
  log('页面类型:', isOwnPage ? '我的收藏夹' : '他人的收藏夹');

  // 检查是否需要恢复跨页面流程
  await manager.resumeCrossPageFlow();

  // 获取所有收藏夹名称
  const favorites = manager.getAllFavoriteNames();
  log('检测到收藏夹:', favorites.length, '个');

  if (favorites.length > 0) {
    log('收藏夹列表:', favorites.slice(0, 5).join(', '), favorites.length > 5 ? '...' : '');
  }

  // 初始化浮动面板 UI
  const panel = new FloatingPanel(manager);

  // 设置日志面板，让 panel.init() 中的日志也能输出到面板
  setLoggerPanel(panel);

  panel.init();

  // 将管理器和面板实例挂载到全局，方便控制台调用
  window.BiliFavManager = manager;
  window.BiliFavPanel = panel;

  log('脚本已就绪！浮动面板已显示');
  log('控制台使用方法:');
  log('1. 复制单个收藏夹: await BiliFavManager.copyFavorite("源收藏夹", "目标收藏夹")');
  log('2. 批量复制: await BiliFavManager.batchCopy([{source: "源1", target: "目标1"}, ...])');
  log('3. 获取收藏夹列表: BiliFavManager.getAllFavoriteNames()');
}
```

After:
```javascript
async function main() {
  await waitForPageLoad();

  log('脚本启动 v2.0');

  // 创建管理器实例
  const manager = new FavoriteManager();

  // 初始化并检测页面版本
  if (!manager.initialize()) {
    log('页面版本不支持，脚本退出');
    return;
  }

  // 检测页面类型
  const isOwnPage = PageDetector.isOwnPage();
  log('页面类型:', isOwnPage ? '我的收藏夹' : '他人的收藏夹');

  // 检查是否需要恢复跨页面流程
  const handledCrossPage = await manager.crossPageFlow.resumeFlow();
  if (handledCrossPage) {
    // 跨页面流程已处理，不再显示面板
    log('跨页面流程执行完毕');
    return;
  }

  // 获取所有收藏夹名称
  const favorites = manager.getAllFavoriteNames();
  log('检测到收藏夹:', favorites.length, '个');

  if (favorites.length > 0) {
    log('收藏夹列表:', favorites.slice(0, 5).join(', '), favorites.length > 5 ? '...' : '');
  }

  // 初始化浮动面板 UI
  const panel = new FloatingPanel(manager);

  // 设置日志面板，让 panel.init() 中的日志也能输出到面板
  setLoggerPanel(panel);

  panel.init();

  // 将管理器和面板实例挂载到全局，方便控制台调用
  window.BiliFavManager = manager;
  window.BiliFavPanel = panel;

  log('脚本已就绪！浮动面板已显示');
  log('控制台使用方法:');
  log('1. 复制单个收藏夹: await BiliFavManager.copyFavorite("源收藏夹", "目标收藏夹")');
  log('2. 批量复制: await BiliFavManager.batchCopy([{source: "源1", target: "目标1"}, ...])');
  log('3. 获取收藏夹列表: BiliFavManager.getAllFavoriteNames()');
}
```

---

### 3.5 更新 rollup.config.js

**文件:** `rollup.config.js`

**修改 userscript header（line 14-26）:**

Before:
```javascript
banner(() => {
  return `// ==UserScript==
// @name         Bilibili 收藏夹批量管理
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  批量复制 B 站收藏夹（适配新版 VUI + 跨页面流程）
// @author       Your Name
// @match        https://space.bilibili.com/*/favlist*
// @grant        none
// @license      MIT
// ==/UserScript==

`;
}),
```

After:
```javascript
banner(() => {
  return `// ==UserScript==
// @name         Bilibili 收藏夹批量管理
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  批量复制 B 站收藏夹（复选框列表 + 跨页面流程 + 过滤"我追的"）
// @author       Your Name
// @match        https://space.bilibili.com/*/favlist*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @license      MIT
// ==/UserScript==

`;
}),
```

**验证检查点:**
- [ ] 新文件 StateManager.js 和 CrossPageFlowManager.js 已创建
- [ ] FavoriteManager.js 正确导入并使用 CrossPageFlowManager
- [ ] main.js 正确调用跨页面流程恢复逻辑
- [ ] rollup.config.js 中声明了 GM_setValue/GM_getValue/GM_deleteValue
- [ ] 代码编译无错误

---

## Phase 4: 构建和测试

### 4.1 构建验证

**执行构建命令:**

```bash
cd D:/myfile/01-my-project/projs/bilibili-favs-manage
npm run build
```

**检查构建产物:**

- [ ] `dist/BilibiliFavsManage.user.js` 文件已生成
- [ ] 文件头包含正确的 userscript metadata
- [ ] 文件头包含 `@grant GM_setValue`, `@grant GM_getValue`, `@grant GM_deleteValue`
- [ ] 文件大小合理（预计 30-50KB）
- [ ] 没有构建错误或警告

**检查 userscript header:**

打开 `dist/BilibiliFavsManage.user.js`，确认前几行为：

```javascript
// ==UserScript==
// @name         Bilibili 收藏夹批量管理
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  批量复制 B 站收藏夹（复选框列表 + 跨页面流程 + 过滤"我追的"）
// @author       Your Name
// @match        https://space.bilibili.com/*/favlist*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @license      MIT
// ==/UserScript==
```

---

### 4.2 端到端测试

#### 测试场景 1: 在自己页面批量复制（无跨页面流程）

**前置条件:**
- 打开自己的收藏夹页面：`https://space.bilibili.com/<你的UID>/favlist`
- 确保有至少 2 个收藏夹，每个收藏夹有至少 1 个视频

**测试步骤:**
1. 浮动面板显示
2. 检查左侧面板：
   - [ ] 显示复选框列表（不是下拉框）
   - [ ] 每个收藏夹一行：复选框 + 名称标签 + 目标输入框
   - [ ] 目标输入框默认值为源收藏夹名称
   - [ ] 只显示"我创建的收藏夹"（不显示"我追的合集/收藏夹"）
3. 点击"点我全选"：
   - [ ] 所有复选框被勾选
   - [ ] 按钮文本变为"点我全部取消"
4. 再次点击：
   - [ ] 所有复选框取消勾选
   - [ ] 按钮文本变回"点我全选"
5. 手动勾选 2 个收藏夹，修改目标名称为新名称
6. 点击"开始批量复制"：
   - [ ] 输出面板显示"开始批量复制，共 2 个任务"
   - [ ] 依次显示每个任务的进度（"[1/2] 源1 → 目标1"）
   - [ ] 每个任务完成后显示"✓ 复制完成"
   - [ ] 最后显示"批量复制完成！"
7. 检查实际结果：
   - [ ] 新收藏夹已创建
   - [ ] 视频已复制到新收藏夹

**预期结果:**
- 整个流程无跨页面跳转
- 所有任务成功完成
- 输出面板显示详细日志

---

#### 测试场景 2: 在别人页面批量复制（触发跨页面流程）

**前置条件:**
- 打开别人的收藏夹页面（例如某个 UP 主的收藏夹）
- 确保该页面有至少 1 个公开收藏夹

**测试步骤:**
1. 浮动面板显示
2. 检查输出面板：
   - [ ] 显示"当前页面: 他人的收藏夹"（橙色）
3. 勾选 1-2 个收藏夹，修改目标名称为新名称（确保这些名称在你自己的收藏夹中不存在）
4. 点击"开始批量复制"：
   - [ ] 输出面板显示"检测到在别人页面且需要创建新收藏夹"
   - [ ] 显示"启动跨页面流程..."
   - [ ] 显示"即将跳转到自己的收藏夹页面批量创建收藏夹"
   - [ ] 显示"跳转倒计时: 3 秒..."
5. 等待 3 秒后：
   - [ ] 页面自动跳转到你自己的收藏夹页面
6. 在自己页面：
   - [ ] 浮动面板不显示（或显示但立即开始执行）
   - [ ] 控制台/输出面板显示"检测到跨页面流程状态"
   - [ ] 显示"阶段: creating"
   - [ ] 显示"开始批量创建收藏夹"
   - [ ] 依次创建每个收藏夹
   - [ ] 显示"✓ 批量创建完成!"
   - [ ] 显示"收藏夹创建完成，返回原页面继续复制"
   - [ ] 显示"跳转倒计时: 3 秒..."
7. 等待 3 秒后：
   - [ ] 页面自动跳转回原页面（别人的收藏夹页面）
8. 回到原页面后：
   - [ ] 输出面板显示"已返回原页面，继续复制流程"
   - [ ] 自动开始复制流程
   - [ ] 依次显示每个任务的进度
   - [ ] 最后显示"批量复制完成！"
9. 检查实际结果：
   - [ ] 新收藏夹已创建在你的账号下
   - [ ] 视频已复制到新收藏夹

**预期结果:**
- 整个流程自动完成，无需用户手动干预
- 跨页面跳转 2 次（去自己页面 → 回原页面）
- 所有任务成功完成
- 状态正确持久化和恢复

---

#### 测试场景 3: 测试全选和过滤

**测试步骤:**
1. 打开自己的收藏夹页面
2. 检查左侧面板：
   - [ ] 收藏夹列表只显示"我创建的收藏夹"分组
   - [ ] "我追的合集/收藏夹"不显示
   - [ ] "其他收藏"不显示
3. 控制台查看日志：
   - [ ] 显示类似 `过滤结果: 总数 50 → 我创建的 20` 的日志
4. 点击"点我全选"，检查所有显示的收藏夹都被勾选

**预期结果:**
- 过滤逻辑正确
- 全选功能正常

---

#### 测试场景 4: 测试多页收藏夹

**前置条件:**
- 选择一个有 5+ 页的收藏夹

**测试步骤:**
1. 勾选该收藏夹
2. 填写目标名称
3. 点击"开始批量复制"
4. 观察输出面板：
   - [ ] 显示"共 X 页"
   - [ ] 依次显示"正在处理第 1/X 页"、"第 2/X 页"...
   - [ ] 每页完成后显示"✓ 复制成功"
   - [ ] 最后显示"✓ 收藏夹 [源] 复制完成"

**预期结果:**
- 所有页面都被处理
- 视频全部复制成功

---

## 回滚策略

### Phase 1 回滚

**问题:** 过滤逻辑不工作，或过滤掉了不该过滤的收藏夹

**回滚方法:**
1. 恢复 `BilibiliAPI.getAllFavorites()` 的原始实现（使用 `querySelectorAll` 直接返回所有项）
2. 删除 `getCreatedFavorites()` 方法
3. 重新构建

**验证:** 所有收藏夹（包括"我追的"）重新显示

---

### Phase 2 回滚

**问题:** 复选框 UI 不显示，或功能异常

**回滚方法:**
1. 恢复 `FloatingPanel.js` 到 Phase 2 之前的版本：
   - 恢复 `createSelectorPanel()` 方法
   - 恢复 `createLeftPanel()` 调用 `createSelectorPanel()`
   - 恢复 `startBatchTransfer()` 的单对单逻辑
   - 删除 `createFavPanel()`, `createFavCheckboxItems()`, `getSelectedTasks()`, `toggleSelectAll()` 方法
2. 恢复 `createButtonPanel()` 移除全选按钮
3. 重新构建

**验证:** 下拉框选择器重新显示，可以单对单复制

---

### Phase 3 回滚

**问题:** 跨页面流程不工作，或导致页面循环跳转

**回滚方法:**
1. 删除 `src/core/StateManager.js` 和 `src/core/CrossPageFlowManager.js`
2. 恢复 `FavoriteManager.js`:
   - 移除 `CrossPageFlowManager` 导入
   - 移除 `this.crossPageFlow` 初始化
   - 恢复 `batchCopy()` 方法到 Phase 3 之前的版本（移除跨页面检测）
3. 恢复 `main.js`:
   - 移除 `handledCrossPage` 检查
4. 恢复 `rollup.config.js`:
   - 移除 `@grant GM_setValue` 等声明
5. 重新构建

**验证:** 在别人页面无法创建收藏夹时，显示错误提示，但不跳转

---

### Phase 4 回滚

**问题:** 构建失败或产物无法使用

**回滚方法:**
1. 使用 git 恢复到上一个可工作的版本
2. 或逐个 Phase 回滚，直到构建成功

**验证:** `npm run build` 成功，产物可以在油猴中安装并运行

---

## 关键文件清单

### 需要修改的文件

| 文件路径 | 操作 | Phase |
|---------|------|-------|
| `src/core/BilibiliAPI.js` | 新增 `getCreatedFavorites()`，修改 `getAllFavorites()` | Phase 1 |
| `src/ui/FloatingPanel.js` | 大幅修改：移除下拉框，新增复选框列表 | Phase 2 |
| `src/core/StateManager.js` | **新建** | Phase 3 |
| `src/core/CrossPageFlowManager.js` | **新建** | Phase 3 |
| `src/core/FavoriteManager.js` | 修改 `batchCopy()`，删除旧跨页面方法 | Phase 3 |
| `src/main.js` | 修改 `main()` 函数 | Phase 3 |
| `rollup.config.js` | 更新 userscript header | Phase 3 |

### 不需要修改的文件

- `src/ui/UIComponents.js` - CheckboxItem 类已存在，可直接使用
- `src/ui/EventHandlers.js` - 已有 `toggleSelectAll()` 静态方法
- `src/core/PageDetector.js` - 功能完整
- `src/config/selectors.js` - 无需新增选择器
- `src/config/config.js` - 延迟配置已够用
- `src/utils/dom.js` - 工具函数完整
- `src/utils/logger.js` - 日志功能完整
- `src/utils/storage.js` - **可删除**（被 StateManager 替代）

---

## 实施注意事项

### 1. 代码风格一致性

- 保持与现有代码相同的缩进（2 空格）
- 使用 ES6 语法（import/export, async/await, 箭头函数）
- JSDoc 注释风格与现有代码一致

### 2. 错误处理

- 所有 DOM 操作都要检查元素是否存在
- 异步操作使用 try-catch
- 错误信息输出到控制台和输出面板

### 3. 延迟配置

- 短延迟（500ms）：点击后等待
- 中延迟（1000ms）：页面跳转、批量操作间隔
- 长延迟（2000ms）：复制确认后等待

### 4. GM API 降级

`StateManager` 已实现降级逻辑：
- 优先使用 `GM_setValue/GM_getValue/GM_deleteValue`
- 降级使用 `localStorage`
- 确保在非 GM 环境也能工作（方便开发调试）

### 5. 构建优化

- 开发时使用 `npm run dev`（watch 模式）
- 发布前使用 `npm run build`
- 可选：启用 terser 压缩（生产环境）

---

## 总结

### 实施顺序回顾

1. **Phase 1 (过滤)**: 最小变更，验证基础能力
2. **Phase 2 (UI)**: 恢复核心功能，最大价值
3. **Phase 3 (跨页面)**: 新功能，最复杂
4. **Phase 4 (测试)**: 端到端验证

### 预估工作量

- Phase 1: 30 分钟
- Phase 2: 1-2 小时
- Phase 3: 2-3 小时
- Phase 4: 1 小时

**总计:** 4.5-6.5 小时

### 风险提示

1. **DOM 结构变化**: B 站可能再次改版，分隔标记文本可能变化
   - 缓解：添加详细日志，方便调试
2. **跨页面时序**: 页面加载时机可能不稳定
   - 缓解：使用 `waitForPageLoad()`，添加状态超时机制
3. **反爬虫限制**: 快速操作可能触发限制
   - 缓解：合理的延迟配置

### 成功标准

- [ ] 所有 Phase 4 测试场景通过
- [ ] 在真实环境测试 10 次，成功率 ≥ 90%
- [ ] 代码构建无警告
- [ ] 输出日志清晰易读

---

**End of Implementation Plan**
