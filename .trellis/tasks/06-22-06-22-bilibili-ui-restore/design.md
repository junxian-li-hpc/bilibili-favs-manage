# 技术设计

## 1. 架构总览

### 1.1 模块划分

本次重构涉及以下模块：

```
src/
├── core/
│   ├── FavoriteManager.js       [修改] 添加批量复制方法
│   ├── BilibiliAPI.js            [修改] 添加过滤逻辑
│   ├── StateManager.js           [新增] 状态持久化管理
│   └── CrossPageFlowManager.js   [新增] 跨页面流程管理
├── ui/
│   ├── FloatingPanel.js          [大幅修改] 恢复复选框列表 UI
│   ├── UIComponents.js           [保持] CheckboxItem 已存在
│   └── EventHandlers.js          [修改] 添加全选事件处理
├── utils/
│   └── storage.js                [已存在] localStorage 封装
└── main.js                       [修改] 添加跨页面流程恢复逻辑
```

### 1.2 模块依赖关系

```
main.js
  ├─> FavoriteManager
  │     ├─> BilibiliAPI (过滤收藏夹)
  │     ├─> CrossPageFlowManager (跨页面流程)
  │     └─> StateManager (状态持久化)
  └─> FloatingPanel
        ├─> UIComponents (CheckboxItem)
        ├─> EventHandlers (toggleSelectAll)
        └─> FavoriteManager (批量复制)

CrossPageFlowManager
  ├─> StateManager (保存/恢复状态)
  ├─> PageDetector (页面类型检测)
  ├─> BilibiliAPI (创建收藏夹)
  └─> FavoriteManager (批量复制)
```

---

## 2. 新增模块设计

### 2.1 StateManager - 状态持久化管理

**文件路径：** `src/core/StateManager.js`

**职责：** 封装跨页面状态的保存、加载、验证和清除逻辑，支持 GM API 和 localStorage 降级策略。

#### 类接口定义

```javascript
export class StateManager {
  /**
   * 保存跨页面状态
   * @param {Object} state - 状态对象
   * @returns {boolean} 是否成功
   */
  static saveState(state)

  /**
   * 加载跨页面状态
   * @returns {Object|null} 状态对象，失效或不存在则返回 null
   */
  static loadState()

  /**
   * 清除状态
   */
  static clearState()

  /**
   * 检查状态是否过期
   * @param {Object} state - 状态对象
   * @returns {boolean}
   */
  static isStateExpired(state)
}
```

#### 状态数据结构

```javascript
{
  phase: 'idle' | 'creating' | 'copying',  // 执行阶段
  returnURL: string,                        // 原页面 URL
  tasks: [                                  // 复制任务列表
    {
      source: string,                       // 源收藏夹名称
      target: string                        // 目标收藏夹名称
    }
  ],
  timestamp: number                         // 保存时间戳（毫秒）
}
```

#### GM API 降级策略

```javascript
static saveState(state) {
  const data = {
    ...state,
    timestamp: Date.now()
  };
  
  // 优先使用 GM_setValue
  if (typeof GM_setValue !== 'undefined') {
    GM_setValue('bilibili_cross_page_state', JSON.stringify(data));
    return true;
  }
  
  // 降级到 localStorage
  try {
    localStorage.setItem('bilibili_cross_page_state', JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('状态保存失败:', e);
    return false;
  }
}
```

**状态过期时间：** 30 分钟（1800000 毫秒）

**参考位置：** 当前 `src/utils/storage.js` 已有 localStorage 实现（超时 10 分钟），需要扩展为支持 GM API 并延长超时时间。

---

### 2.2 CrossPageFlowManager - 跨页面流程管理

**文件路径：** `src/core/CrossPageFlowManager.js`

**职责：** 协调跨页面创建收藏夹的完整流程，管理状态机转换，处理页面跳转和错误恢复。

#### 状态机设计

```
[idle] ──────> [creating] ──────> [copying] ──────> [idle]
   ^              │                   │                 │
   │              │ (跳转到自己页面)  │ (跳回原页面)   │
   │              v                   v                 v
   └────────────────────────────────────────────────────┘
                        (完成或失败)
```

**状态转换触发点：**
- `idle → creating`: 用户点击"开始批量复制"，检测到需要创建收藏夹
- `creating → copying`: 在自己页面完成收藏夹创建
- `copying → idle`: 回到原页面完成复制任务

#### 关键方法

```javascript
export class CrossPageFlowManager {
  constructor(manager) {
    this.manager = manager; // FavoriteManager 实例
  }

  /**
   * 启动跨页面流程：保存状态并跳转
   * @param {Array} tasks - 复制任务列表 [{source, target}, ...]
   * @returns {Promise<void>}
   */
  async startCrossPageFlow(tasks)

  /**
   * 在自己页面创建缺失的收藏夹
   * @param {Array} targetNames - 目标收藏夹名称列表
   * @returns {Promise<boolean>}
   */
  async createMissingFavorites(targetNames)

  /**
   * 恢复并执行跨页面流程
   * @returns {Promise<boolean>} 是否处理了跨页面流程
   */
  async resumeCrossPageFlow()

  /**
   * 检查任务列表中哪些收藏夹需要创建
   * @param {Array} tasks - 复制任务列表
   * @returns {Array<string>} 需要创建的收藏夹名称
   */
  getMissingFavorites(tasks)
}
```

#### 关键流程伪代码

**启动跨页面流程：**

```javascript
async startCrossPageFlow(tasks) {
  // 1. 检查是否在别人页面
  if (PageDetector.isOwnPage()) {
    log('已在自己页面，无需跳转');
    return false;
  }

  // 2. 保存状态
  StateManager.saveState({
    phase: 'creating',
    returnURL: window.location.href,
    tasks: tasks,
    timestamp: Date.now()
  });

  // 3. 跳转到自己的收藏夹页面
  const ownURL = PageDetector.getOwnFavListURL();
  log('跳转到自己页面创建收藏夹:', ownURL);
  await delay(3000); // 倒计时提示
  window.location.href = ownURL;
}
```

**恢复跨页面流程：**

```javascript
async resumeCrossPageFlow() {
  // 1. 加载状态
  const state = StateManager.loadState();
  if (!state || StateManager.isStateExpired(state)) {
    return false; // 无状态或已过期
  }

  // 2. 根据 phase 执行对应逻辑
  if (state.phase === 'creating') {
    // 在自己页面：创建收藏夹
    const targetNames = state.tasks.map(t => t.target);
    const missingNames = this.getMissingFavorites(targetNames);
    
    if (missingNames.length > 0) {
      await this.createMissingFavorites(missingNames);
    }
    
    // 更新状态并跳回
    StateManager.saveState({
      ...state,
      phase: 'copying'
    });
    
    await delay(3000);
    window.location.href = state.returnURL;
    return true;
  }
  
  if (state.phase === 'copying') {
    // 回到原页面：继续复制
    log('继续执行批量复制...');
    await this.manager.batchCopy(state.tasks);
    
    // 清除状态
    StateManager.clearState();
    return true;
  }
  
  return false;
}
```

**错误处理：**

- 如果创建收藏夹失败：记录日志，清除状态，提示用户手动创建
- 如果状态过期：自动清除，按正常流程初始化
- 如果跳转 URL 无效：提示错误，清除状态

---

## 3. 现有模块修改

### 3.1 BilibiliAPI - 过滤逻辑

**文件路径：** `src/core/BilibiliAPI.js`

**修改点：** 添加 `getCreatedFavorites()` 方法，过滤掉"我追的合集/收藏夹"和"其他收藏"。

#### DOM 结构分析

根据 snapshot 文件（`.trellis/tasks/archive/2026-06/06-22-bilibili-favs-adapt/research/bilibili-favs-snapshot.txt`）：

```
uid=1_81 StaticText "我创建的收藏夹"
uid=1_83 StaticText "默认收藏夹"
uid=1_84 StaticText "4953"
...
uid=1_124 StaticText "232"
uid=1_125 StaticText "我追的合集/收藏夹"  <-- 分隔标记
uid=1_126 StaticText "买瓜宇宙"
uid=1_127 StaticText "13"
```

**关键发现：**
1. "我创建的收藏夹" 和 "我追的合集/收藏夹" 是 **StaticText**（纯文本节点）
2. 它们不是 `.vui_sidebar-item`，而是作为分隔标记
3. 收藏夹项（`.vui_sidebar-item`）与分隔标记是兄弟节点关系

#### getCreatedFavorites() 方法设计

**位置：** `src/core/BilibiliAPI.js` 新增方法

**签名：**
```javascript
/**
 * 获取用户创建的收藏夹（过滤"我追的"和"其他收藏"）
 * @returns {Array<Element>} 收藏夹元素数组
 */
static getCreatedFavorites()
```

**实现策略：**

```javascript
static getCreatedFavorites() {
  const sidebar = document.querySelector(SELECTORS.FAVORITES_SIDEBAR);
  if (!sidebar) {
    error('找不到收藏夹侧边栏');
    return [];
  }

  const allChildren = Array.from(sidebar.childNodes);
  const favorites = [];
  let inCreatedSection = false;

  for (const node of allChildren) {
    // 检测文本节点
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      
      // 进入"我创建的收藏夹"分组
      if (text === '我创建的收藏夹') {
        inCreatedSection = true;
        log('检测到"我创建的收藏夹"分组');
        continue;
      }
      
      // 退出分组（遇到其他分隔标记）
      if (text === '我追的合集/收藏夹' || text === '其他收藏') {
        inCreatedSection = false;
        log(`检测到分隔标记: ${text}，停止收集`);
        continue;
      }
    }
    
    // 收集"我创建的收藏夹"分组中的 .vui_sidebar-item
    if (inCreatedSection && 
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList.contains('vui_sidebar-item')) {
      favorites.push(node);
    }
  }
  
  log(`过滤后收藏夹数量: ${favorites.length}`);
  return favorites;
}
```

**替换现有方法：**

修改 `getAllFavorites()` 调用 `getCreatedFavorites()`：

```javascript
static getAllFavorites() {
  return this.getCreatedFavorites(); // 直接返回过滤后的结果
}
```

或者新增方法，保持 `getAllFavorites()` 不变（推荐，向后兼容）。

**边界情况处理：**
- 如果找不到"我创建的收藏夹"文本：返回空数组，记录警告日志
- 如果侧边栏为空：返回空数组
- 如果只有"我追的合集/收藏夹"：返回空数组

---

### 3.2 FloatingPanel - UI 恢复

**文件路径：** `src/ui/FloatingPanel.js`

**修改范围：** 大幅修改左侧面板，从下拉框模式恢复为复选框列表模式。

#### 移除的组件

**当前代码（第 179-233 行）：**
```javascript
createSelectorPanel() {
  // ...
  this.sourceSelect = UIComponents.createSelect(this.favorites);      // ❌ 删除
  this.targetInput = document.createElement('input');                 // ❌ 删除
  this.targetSelect = UIComponents.createSelect(this.favorites);      // ❌ 删除
  // ...
}
```

**移除的实例变量（第 44-45 行）：**
```javascript
this.sourceSelect = null;  // ❌ 删除
this.targetSelect = null;  // ❌ 删除
```

#### 新增的组件

**复选框列表：**

```javascript
// 新增实例变量
this.favCheckboxItemList = [];  // CheckboxItem 数组
this.favPanel = null;            // 收藏夹面板容器
```

**createFavPanel() 方法（参考旧版 BilibiliFavsManage.js 471-509 行）：**

```javascript
/**
 * 创建收藏夹复选框列表面板
 */
createFavPanel() {
  const favPanel = UIComponents.createSubDiv('fav-panel');
  favPanel.style.backgroundColor = '#fff';
  favPanel.style.overflow = 'auto';
  favPanel.style.flexDirection = 'column';
  favPanel.style.flexGrow = '1';
  favPanel.style.padding = '10px';

  // 标题行
  const headerDiv = UIComponents.createSubDiv('div');
  headerDiv.style.justifyContent = 'space-between';
  headerDiv.style.marginBottom = '10px';

  const srcText = document.createElement('h4');
  srcText.textContent = '源收藏夹';
  srcText.style.fontWeight = 'bold';
  srcText.style.margin = '0';

  const dstText = document.createElement('h4');
  dstText.textContent = '目标收藏夹';
  dstText.style.fontWeight = 'bold';
  dstText.style.margin = '0';

  headerDiv.appendChild(srcText);
  headerDiv.appendChild(dstText);
  favPanel.appendChild(headerDiv);

  // 添加所有复选框项
  for (const item of this.favCheckboxItemList) {
    favPanel.appendChild(item.checkboxContainer);
  }

  return favPanel;
}
```

**createFavCheckboxItems() 方法（参考旧版 511-518 行）：**

```javascript
/**
 * 根据收藏夹列表创建 CheckboxItem 实例
 */
createFavCheckboxItems() {
  const favCheckboxItemList = [];
  for (const favName of this.favorites) {
    const item = new CheckboxItem(favName);
    favCheckboxItemList.push(item);
  }
  return favCheckboxItemList;
}
```

**修改 createLeftPanel() 方法（第 99-116 行）：**

```javascript
createLeftPanel() {
  const leftPanel = UIComponents.createSubDiv('left-panel', 'left');
  leftPanel.style.flexGrow = '0';
  leftPanel.style.backgroundColor = '#f5f5f5';
  leftPanel.style.flexDirection = 'column';

  // 创建按钮面板
  const btnPanel = this.createButtonPanel();
  leftPanel.appendChild(btnPanel);

  // 创建收藏夹复选框列表面板（替换原来的 selectorPanel）
  this.favPanel = this.createFavPanel();
  leftPanel.appendChild(this.favPanel);

  return leftPanel;
}
```

**修改 init() 方法（第 59-71 行）：**

```javascript
init() {
  // 先获取收藏夹数据
  this.favorites = this.manager.getAllFavoriteNames();
  
  // 创建复选框项列表
  this.favCheckboxItemList = this.createFavCheckboxItems();

  // 创建面板
  this.floatingPanel = this.createFloatingPanel();
  document.body.appendChild(this.floatingPanel);
  this.recordPanelSize();

  // 日志输出
  this.appendLog('浮动面板已创建', this.normalCode);
  this.showPageTypeIndicator();
}
```

#### 修改按钮面板

**添加"全选"按钮（第 147-174 行 createButtonPanel）：**

```javascript
createButtonPanel() {
  // ...
  
  // 添加全选按钮（在"开始批量复制"之前）
  this.selectAllButton = UIComponents.createButton('点我全选', () => {
    EventHandlers.toggleSelectAll(this.selectAllButton, this.favCheckboxItemList);
  });

  const startBatchTransferButton = UIComponents.createButton('开始批量复制', () => {
    this.startBatchTransfer();
  });

  // ...

  btnPanel.appendChild(this.selectAllButton);
  btnPanel.appendChild(startBatchTransferButton);
  btnPanel.appendChild(this.minimizeButton);
  btnPanel.appendChild(destroyButton);

  // ...
}
```

#### 修改批量复制逻辑

**修改 startBatchTransfer() 方法（第 306-351 行）：**

```javascript
async startBatchTransfer() {
  // 1. 获取勾选的复选框项
  const selectedItems = this.getSelectedItems();
  
  if (selectedItems.length === 0) {
    this.appendLog('错误: 请至少勾选一个源收藏夹', this.errorCode);
    return;
  }

  // 2. 构建任务列表
  const tasks = [];
  for (const item of selectedItems) {
    const source = item.getLabelValue();      // 源收藏夹名称
    const target = item.getInputTextValue();  // 目标收藏夹名称（输入框值）
    
    if (source === target) {
      this.appendLog(`警告: 跳过同名复制 [${source}]`, this.warnCode);
      continue;
    }
    
    tasks.push({ source, target });
  }

  if (tasks.length === 0) {
    this.appendLog('错误: 没有有效的复制任务', this.errorCode);
    return;
  }

  this.appendLog(`开始批量复制，共 ${tasks.length} 个任务`, this.startBatchCode);

  // 3. 禁用按钮
  this.startBatchTransferButton.disabled = true;
  this.startBatchTransferButton.textContent = '复制中...';

  try {
    await this.manager.batchCopy(tasks);
    this.appendLog('✓ 批量复制完成!', this.endBatchCode);
  } catch (err) {
    this.appendLog(`✗ 批量复制出错: ${err.message}`, this.errorCode);
    console.error(err);
  } finally {
    // 恢复按钮
    this.startBatchTransferButton.disabled = false;
    this.startBatchTransferButton.textContent = '开始批量复制';
  }
}
```

**新增 getSelectedItems() 方法：**

```javascript
/**
 * 获取勾选的复选框项
 * @returns {Array<CheckboxItem>}
 */
getSelectedItems() {
  const selectedItems = [];
  for (const item of this.favCheckboxItemList) {
    if (item.getCheckboxValue()) {
      selectedItems.push(item);
    }
  }
  return selectedItems;
}
```

---

### 3.3 FavoriteManager - 批量复制

**文件路径：** `src/core/FavoriteManager.js`

**修改点：** 增强 `batchCopy()` 方法，与 `CrossPageFlowManager` 协作。

#### batchCopy() 方法修改

**当前实现（第 203-220 行）：** 已经存在，但需要增强跨页面流程检测。

**增强版本：**

```javascript
/**
 * 批量复制收藏夹
 * @param {Array<{source: string, target: string}>} tasks - 复制任务列表
 * @returns {Promise<void>}
 */
async batchCopy(tasks) {
  log('开始批量复制，共', tasks.length, '个任务');

  // 1. 检查是否需要跨页面创建收藏夹
  const isOwnPage = PageDetector.isOwnPage();
  if (!isOwnPage) {
    log('检测到在别人的页面，检查是否需要创建收藏夹...');
    
    // 获取当前已有的收藏夹
    const existingFavs = this.getAllFavoriteNames();
    const needCreate = tasks.some(task => !existingFavs.includes(task.target));
    
    if (needCreate) {
      log('需要创建收藏夹，启动跨页面流程');
      const crossPageManager = new CrossPageFlowManager(this);
      await crossPageManager.startCrossPageFlow(tasks);
      return; // 跳转后流程中断
    }
  }

  // 2. 正常批量复制流程
  for (let i = 0; i < tasks.length; i++) {
    const { source, target } = tasks[i];
    log(`\n[${i + 1}/${tasks.length}] ${source} → ${target}`);

    await this.copyFavorite(source, target);

    // 任务间延迟
    if (i < tasks.length - 1) {
      await delay(CONFIG.DELAY.MIDDLE);
    }
  }

  log('\n✓ 批量复制完成！');
}
```

**注意：** 需要在文件顶部导入 `CrossPageFlowManager`。

---

### 3.4 EventHandlers - 全选事件处理

**文件路径：** `src/ui/EventHandlers.js`

**修改点：** `toggleSelectAll()` 方法已存在（第 12-24 行），无需修改，已经支持传入参数。

**当前实现（参考）：**

```javascript
static toggleSelectAll(selectAllButton, favCheckboxItemList) {
  if (selectAllButton.textContent === '点我全选') {
    for (const chkboxItem of favCheckboxItemList) {
      chkboxItem.checkbox.checked = true;
    }
    selectAllButton.textContent = '点我全部取消';
  } else {
    for (const chkboxItem of favCheckboxItemList) {
      chkboxItem.checkbox.checked = false;
    }
    selectAllButton.textContent = '点我全选';
  }
}
```

**状态：** ✅ 已完成，无需修改。

---

### 3.5 main.js - 入口逻辑

**文件路径：** `src/main.js`

**修改点：** 在面板初始化前优先检查并恢复跨页面流程。

**当前实现（第 23-74 行）：** 已有 `manager.resumeCrossPageFlow()` 调用（第 42 行），但需要调整时序。

**修改后的 main() 函数：**

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

  // ⚠️ 优先检查是否需要恢复跨页面流程
  const crossPageManager = new CrossPageFlowManager(manager);
  const resumed = await crossPageManager.resumeCrossPageFlow();
  
  if (resumed) {
    // 跨页面流程已接管，不再初始化面板
    log('跨页面流程执行完毕');
    return;
  }

  // 正常初始化流程
  const favorites = manager.getAllFavoriteNames();
  log('检测到收藏夹:', favorites.length, '个');

  if (favorites.length > 0) {
    log('收藏夹列表:', favorites.slice(0, 5).join(', '), favorites.length > 5 ? '...' : '');
  }

  // 初始化浮动面板 UI
  const panel = new FloatingPanel(manager);
  setLoggerPanel(panel);
  panel.init();

  // 挂载到全局
  window.BiliFavManager = manager;
  window.BiliFavPanel = panel;

  log('脚本已就绪！浮动面板已显示');
}
```

**关键改动：**
1. 将 `resumeCrossPageFlow()` 提前到面板初始化之前
2. 如果跨页面流程返回 `true`（已处理），则直接 `return`，不再初始化面板
3. 只有正常流程才创建浮动面板

---

## 4. 数据流

### 4.1 正常复制流程（在自己页面）

```
用户操作
  └─> FloatingPanel.startBatchTransfer()
        ├─> 收集勾选的复选框项
        ├─> 构建任务列表 [{source, target}, ...]
        └─> FavoriteManager.batchCopy(tasks)
              ├─> 检测页面类型（isOwnPage = true）
              ├─> 逐个执行任务
              │     └─> FavoriteManager.copyFavorite(source, target)
              │           ├─> BilibiliAPI.clickFavorite(source)
              │           ├─> BilibiliAPI.clickBatchOperationButton()
              │           ├─> 逐页处理
              │           │     ├─> BilibiliAPI.clickSelectAll()
              │           │     ├─> BilibiliAPI.clickCopyButton()
              │           │     ├─> BilibiliAPI.waitForDialog()
              │           │     ├─> 检查目标收藏夹是否存在
              │           │     │     └─> 不存在则创建（BilibiliAPI.createNewFavorite）
              │           │     ├─> BilibiliAPI.selectFavoriteInDialog()
              │           │     └─> BilibiliAPI.clickConfirmButton()
              │           └─> BilibiliAPI.clickNextPage()
              └─> 完成
```

### 4.2 跨页面复制流程（在别人页面）

**阶段 1：启动流程（在别人页面）**

```
用户操作
  └─> FloatingPanel.startBatchTransfer()
        ├─> 收集任务列表 [{source, target}, ...]
        └─> FavoriteManager.batchCopy(tasks)
              ├─> 检测页面类型（isOwnPage = false）
              ├─> 检测是否需要创建收藏夹
              └─> CrossPageFlowManager.startCrossPageFlow(tasks)
                    ├─> StateManager.saveState({ phase: 'creating', returnURL, tasks })
                    ├─> 获取自己的收藏夹页面 URL
                    └─> window.location.href = ownURL（页面跳转）
```

**阶段 2：创建收藏夹（在自己页面）**

```
页面加载
  └─> main()
        └─> CrossPageFlowManager.resumeCrossPageFlow()
              ├─> StateManager.loadState()
              ├─> 检测 phase === 'creating'
              ├─> 提取目标收藏夹列表
              ├─> getMissingFavorites()（对比现有收藏夹）
              └─> createMissingFavorites(missingNames)
                    ├─> 点击第一个收藏夹
                    ├─> 进入批量模式
                    ├─> 打开复制对话框
                    └─> 逐个创建收藏夹
                          ├─> BilibiliAPI.clickCreateFavoriteButton()
                          ├─> BilibiliAPI.inputFavoriteName()
                          ├─> BilibiliAPI.clickCreateButton()
                          └─> delay(1000)
              ├─> StateManager.saveState({ phase: 'copying' })
              └─> window.location.href = returnURL（跳回原页面）
```

**阶段 3：执行复制（回到原页面）**

```
页面加载
  └─> main()
        └─> CrossPageFlowManager.resumeCrossPageFlow()
              ├─> StateManager.loadState()
              ├─> 检测 phase === 'copying'
              └─> FavoriteManager.batchCopy(tasks)
                    ├─> 正常批量复制流程（同 4.1）
                    └─> StateManager.clearState()
```

---

## 5. 边界情况和错误处理

### 5.1 DOM 结构变化

**问题：** B 站可能再次改版，"我创建的收藏夹"文本可能不存在或位置变化。

**处理：**
- `getCreatedFavorites()` 找不到分隔标记时，返回空数组并记录警告日志
- 降级策略：如果找不到，可以回退到 `getAllFavorites()`（显示所有收藏夹）
- 日志输出：`过滤前数量 X，过滤后数量 Y`

```javascript
static getCreatedFavorites() {
  // ...
  
  if (favorites.length === 0) {
    warn('未找到"我创建的收藏夹"分组，可能页面结构已变化');
    warn('降级到显示所有收藏夹');
    return Array.from(sidebar.querySelectorAll(SELECTORS.FAVORITES_ITEM));
  }
  
  return favorites;
}
```

### 5.2 状态恢复失败

**场景：**
- 用户中途关闭浏览器
- 状态存储失败（localStorage/GM API 不可用）
- 状态过期（超过 30 分钟）

**处理：**
- `loadState()` 返回 `null` 时，正常初始化面板
- 状态过期时自动清除，记录日志
- 不影响正常使用流程

### 5.3 跨页面跳转被拦截

**问题：** 浏览器可能阻止自动跳转（弹窗拦截）。

**处理：**
- 使用 `window.location.href` 而不是 `window.open()`（更不容易被拦截）
- 跳转前显示 3 秒倒计时提示
- 如果用户手动阻止跳转，状态已保存，可以手动访问目标页面

### 5.4 创建收藏夹失败

**场景：**
- 网络错误
- 收藏夹名称违规
- 收藏夹数量达到上限

**处理：**
- `createMissingFavorites()` 中单个创建失败不影响其他
- 记录详细错误日志
- 提示用户："部分收藏夹创建失败，请手动创建后重试"
- 清除状态，避免死循环

```javascript
async createMissingFavorites(targetNames) {
  const results = [];
  
  for (const name of targetNames) {
    try {
      const success = await this.createFavoriteOnOwnPage(name);
      results.push({ name, success });
    } catch (err) {
      error(`创建收藏夹 [${name}] 失败:`, err.message);
      results.push({ name, success: false });
    }
  }
  
  const failedCount = results.filter(r => !r.success).length;
  if (failedCount > 0) {
    error(`${failedCount} 个收藏夹创建失败`);
    return false;
  }
  
  return true;
}
```

### 5.5 批量模式自动退出

**问题：** B 站可能在页面跳转后自动退出批量模式（`FavoriteManager.js` 第 109-113 行已有处理）。

**处理：**
- `ensureBatchModeActive()` 检测并重新进入
- 每页开始前都调用此方法

### 5.6 同名复制

**场景：** 用户勾选了源收藏夹 A，目标输入框也是 A。

**处理：**
- `startBatchTransfer()` 中跳过同名任务
- 记录警告日志：`警告: 跳过同名复制 [A]`

### 5.7 复选框项为空

**场景：** 过滤后收藏夹数量为 0。

**处理：**
- `init()` 中检测 `this.favCheckboxItemList.length === 0`
- 显示提示："未找到可复制的收藏夹，请检查页面"

```javascript
init() {
  this.favorites = this.manager.getAllFavoriteNames();
  this.favCheckboxItemList = this.createFavCheckboxItems();
  
  if (this.favCheckboxItemList.length === 0) {
    this.appendLog('警告: 未找到可复制的收藏夹', this.warnCode);
  }
  
  // ...
}
```

---

## 6. 关键代码位置参考

### 6.1 需要修改的文件和行号

| 文件 | 修改类型 | 行号 | 说明 |
|------|----------|------|------|
| `src/core/StateManager.js` | **新增** | N/A | 完整新文件 |
| `src/core/CrossPageFlowManager.js` | **新增** | N/A | 完整新文件 |
| `src/core/BilibiliAPI.js` | 新增方法 | 新增 | `getCreatedFavorites()` |
| `src/core/BilibiliAPI.js` | 修改方法 | 30-45 | `getAllFavorites()` 调用新方法 |
| `src/core/FavoriteManager.js` | 修改方法 | 203-220 | `batchCopy()` 增加跨页面检测 |
| `src/ui/FloatingPanel.js` | 删除代码 | 44-45, 196-233 | 移除下拉框相关代码 |
| `src/ui/FloatingPanel.js` | 新增方法 | 新增 | `createFavPanel()`, `createFavCheckboxItems()`, `getSelectedItems()` |
| `src/ui/FloatingPanel.js` | 修改方法 | 59-71 | `init()` 创建复选框列表 |
| `src/ui/FloatingPanel.js` | 修改方法 | 99-116 | `createLeftPanel()` 使用 favPanel |
| `src/ui/FloatingPanel.js` | 修改方法 | 147-174 | `createButtonPanel()` 添加全选按钮 |
| `src/ui/FloatingPanel.js` | 修改方法 | 306-351 | `startBatchTransfer()` 使用复选框 |
| `src/ui/EventHandlers.js` | 无需修改 | 12-24 | `toggleSelectAll()` 已支持 |
| `src/main.js` | 修改方法 | 23-74 | `main()` 优先检查跨页面流程 |

### 6.2 旧版实现参考

| 功能 | 文件 | 行号 |
|------|------|------|
| CheckboxItem 类 | `BilibiliFavsManage.js` | 260-311 |
| createFavPanel | `BilibiliFavsManage.js` | 471-509 |
| createFavCheckboxItems | `BilibiliFavsManage.js` | 511-518 |
| getSelectedItems | `BilibiliFavsManage.js` | 520-528 |
| toggleSelectAll | `BilibiliFavsManage.js` | 35-46 |

---

## 7. 实施顺序建议

### Phase 1: 过滤功能（P0，独立）

1. `src/core/BilibiliAPI.js` 添加 `getCreatedFavorites()` 方法
2. 修改 `getAllFavorites()` 调用新方法
3. 测试：检查面板是否只显示"我创建的收藏夹"

### Phase 2: UI 恢复（P0，核心）

1. `src/ui/FloatingPanel.js` 添加 `createFavPanel()`, `createFavCheckboxItems()`, `getSelectedItems()`
2. 修改 `init()`, `createLeftPanel()`, `createButtonPanel()`
3. 修改 `startBatchTransfer()` 使用复选框逻辑
4. 删除下拉框相关代码
5. 测试：检查 UI 是否恢复为复选框列表，全选按钮是否工作

### Phase 3: 状态管理（P0，基础设施）

1. `src/core/StateManager.js` 完整实现
2. 测试：状态保存、加载、过期机制

### Phase 4: 跨页面流程（P0，复杂）

1. `src/core/CrossPageFlowManager.js` 完整实现
2. `src/core/FavoriteManager.js` 修改 `batchCopy()`
3. `src/main.js` 修改 `main()`
4. 测试：完整的跨页面流程

### Phase 5: 优化和文档（P1-P2）

1. 完善日志输出
2. 添加页面类型指示器
3. 更新 README.md 和 CHANGELOG.md

---

## 8. 测试场景

### 8.1 功能测试

- [ ] 在自己的收藏夹页面，复选框列表显示正常
- [ ] "点我全选"按钮可以切换全选/取消全选
- [ ] 勾选多个收藏夹，每个可以填写不同的目标名称
- [ ] 批量复制成功（多对多场景）
- [ ] 在别人的收藏夹页面，点击"开始批量复制"后自动跳转
- [ ] 跳转到自己页面后自动创建缺失的收藏夹
- [ ] 创建完成后自动跳回原页面并继续复制
- [ ] 过滤后只显示"我创建的收藏夹"

### 8.2 边界测试

- [ ] 收藏夹数量为 0
- [ ] 收藏夹数量超过 50 个（滚动条测试）
- [ ] 状态超时 30 分钟后刷新页面
- [ ] 中途关闭浏览器后重新打开
- [ ] 创建收藏夹失败（名称重复）
- [ ] 同名复制（应跳过）
- [ ] 没有勾选任何复选框就点击"开始批量复制"

### 8.3 兼容性测试

- [ ] Chrome + Tampermonkey
- [ ] Firefox + Greasemonkey
- [ ] Edge + Tampermonkey

---

## 9. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| DOM 结构再次变化 | 中 | 高 | 添加降级策略，详细日志 |
| 跨页面跳转被拦截 | 低 | 中 | 使用 location.href，添加倒计时 |
| 状态持久化失败 | 低 | 中 | GM API 降级到 localStorage |
| 批量创建触发反爬虫 | 中 | 中 | 添加延迟（1-2 秒/个） |
| UI 复选框列表性能 | 低 | 低 | 收藏夹数量一般不超过 100 |

---

## 10. 后续优化方向

1. **性能优化：** 虚拟滚动（如果收藏夹超过 100 个）
2. **用户体验：** 跨页面流程添加进度条
3. **功能扩展：** 支持正则表达式批量重命名
4. **错误恢复：** 失败任务重试机制

---

## 附录：关键类型定义

```typescript
// CheckboxItem 实例
interface CheckboxItem {
  checkboxContainer: HTMLDivElement;
  checkbox: HTMLInputElement;
  label: HTMLLabelElement;
  inputText: HTMLInputElement;
  
  getLabelValue(): string;       // 源收藏夹名称
  getInputTextValue(): string;   // 目标收藏夹名称
  getCheckboxValue(): boolean;   // 是否勾选
}

// 复制任务
interface CopyTask {
  source: string;  // 源收藏夹名称
  target: string;  // 目标收藏夹名称
}

// 跨页面状态
interface CrossPageState {
  phase: 'idle' | 'creating' | 'copying';
  returnURL: string;
  tasks: CopyTask[];
  timestamp: number;
}
```

