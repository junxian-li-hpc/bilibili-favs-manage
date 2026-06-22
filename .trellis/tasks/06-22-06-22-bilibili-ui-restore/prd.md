# 修复 B 站收藏夹脚本 UI 功能退化和现存 Bug

## Goal

恢复旧版复选框列表 UI 功能，修复跨页面创建收藏夹流程，过滤"我追的合集/收藏夹"，完善状态持久化机制。

## Background

项目已完成两轮开发（归档任务 `06-22-bilibili-favs-adapt` 和 `06-22-fix-bilibili-cross-page`）：

**已完成的工作：**
- ✅ 新版 B 站页面选择器适配（VUI 组件库）
- ✅ 代码模块化重构（`src/` 目录结构）
- ✅ 浮动面板 UI 迁移到 `src/ui/`
- ✅ 跨页面流程初步实现（v1.1）
- ✅ 批量模式状态管理

**当前问题：**

### 1. UI 功能严重退化 ❌

**旧版 UI（v0.x）：**
- 左侧面板显示**所有收藏夹的复选框列表**
- 每个复选框项包含：
  - 复选框（用于选择源收藏夹）
  - 收藏夹名称标签
  - 目标收藏夹输入框（可以为每个源指定不同的目标名称）
- 用户可以勾选多个源收藏夹，每个源可以复制到不同的目标
- 支持批量多对多复制

**新版 UI（v1.1）：**
- 左侧面板只有**两个下拉框**：
  - 源收藏夹下拉框
  - 目标收藏夹输入框 + 下拉框
- 一次只能选择一个源收藏夹
- 只支持单对单复制
- **功能大幅退化**，用户体验严重下降

### 2. 跨页面流程逻辑错误 ❌

**问题场景：**
用户在**别人的收藏夹页面**，想复制收藏夹到自己的新建收藏夹中。

**当前实现的问题：**
- 脚本在别人页面时，无法获取用户自己的收藏夹列表
- 无法判断目标收藏夹是否需要创建
- 跨页面流程的时机和逻辑不正确

**正确的流程应该是：**
1. 用户在别人页面勾选源收藏夹，填写目标名称
2. 点击"开始批量复制"
3. 脚本**保存当前状态**（选中的收藏夹、目标名称、当前页面 URL）
4. **无条件跳转**到用户自己的收藏夹页面
5. 到了自己页面后，**对比两个列表**：
   - 用户填写的目标收藏夹列表
   - 用户实际拥有的收藏夹列表
6. **批量创建**所有缺失的收藏夹
7. **自动跳回**原页面（使用保存的 URL）
8. 继续执行复制流程

### 3. 显示"我追的合集/收藏夹" ❌

**问题：**
侧边栏显示的收藏夹包含两个分类：
1. "我创建的收藏夹"（可以复制）
2. "我追的合集/收藏夹"（无法复制，B 站平台限制）

**当前实现：**
- `BilibiliAPI.getAllFavorites()` 返回所有 `.vui_sidebar-item`
- 没有过滤逻辑
- 面板列表中显示了"我追的合集/收藏夹"，但这些无法复制

**用户期望：**
- 面板列表只显示"我创建的收藏夹"部分
- "我追的合集/收藏夹"不应该出现在列表中
- 脚本内部可以保存这些数据，但不要显示给用户

### 4. 状态持久化机制不完善 ❌

**跨页面流程需要保存的状态：**
- 用户勾选的源收藏夹列表
- 每个源收藏夹对应的目标收藏夹名称
- 原页面 URL（用于跳回）
- 当前执行阶段（等待用户操作 / 正在创建收藏夹 / 正在复制）

**当前实现：**
- v1.1 有初步的跨页面流程代码
- 但状态管理不完整
- 需要使用 `GM_setValue` / `GM_getValue` 进行持久化

## Requirements

### P0 - 恢复旧版 UI 功能

#### 1. 复选框列表 UI

**目标：** 完全恢复旧版的复选框列表 UI

**UI 结构：**
```
左侧面板：
├── 按钮面板
│   ├── 点我全选 / 点我全部取消（切换按钮）
│   ├── 开始批量复制
│   ├── 点我最小化
│   └── 点我销毁
└── 收藏夹面板（可滚动）
    ├── 标题行
    │   ├── "源收藏夹"
    │   └── "目标收藏夹"
    └── 复选框项列表（每个收藏夹一项）
        ├── 复选框
        ├── 收藏夹名称标签
        └── 目标收藏夹输入框
```

**CheckboxItem 组件：**
- 复选框：用于选择源收藏夹
- 标签：显示源收藏夹名称
- 输入框：填写目标收藏夹名称
  - 默认值：与源收藏夹同名
  - 用户可以修改为不同名称

**全选/全部取消按钮：**
- 初始状态："点我全选"
- 点击后：所有复选框被勾选，按钮文本变为"点我全部取消"
- 再次点击：所有复选框取消勾选，按钮文本变回"点我全选"

**移除的组件：**
- ❌ 源收藏夹下拉框（`this.sourceSelect`）
- ❌ 目标收藏夹下拉框（`this.targetSelect`）
- ❌ 目标收藏夹输入框（`this.targetInput`）

**Acceptance Criteria：**
- [ ] 左侧面板显示所有收藏夹的复选框列表
- [ ] 每个复选框项包含：复选框、名称标签、目标输入框
- [ ] "点我全选"按钮可以切换全选/全部取消状态
- [ ] 复选框列表可滚动（收藏夹数量多时）
- [ ] 目标输入框默认值为源收藏夹名称
- [ ] UI 风格与旧版一致

#### 2. 批量复制逻辑

**复制模式：** 一对一复制

**流程：**
1. 用户勾选多个源收藏夹（如：A、B、C）
2. 用户为每个源填写目标名称（如：A→A'、B→B'、C→C）
3. 点击"开始批量复制"
4. 脚本依次处理每个勾选的复选框项：
   - 提取源收藏夹名称和目标收藏夹名称
   - 调用 `FavoriteManager.copyFavorite(source, target)`
5. 每个复制任务独立执行，互不影响

**支持的场景：**
- ✅ 多对多：A→A'、B→B'、C→C'
- ✅ 多对一（合并）：A→X、B→X、C→X（用户手动设置相同的目标）
- ✅ 同名复制：A→A、B→B
- ✅ 重命名复制：A→NewA

**Acceptance Criteria：**
- [ ] 可以勾选多个源收藏夹
- [ ] 每个源可以指定不同的目标名称
- [ ] 点击"开始批量复制"后，依次处理所有勾选项
- [ ] 输出面板显示每个复制任务的进度和结果
- [ ] 支持上述所有场景

### P0 - 修复跨页面创建收藏夹流程

#### 3. 跨页面状态管理

**使用 GM API 持久化状态：**

```javascript
// 状态结构
const crossPageState = {
  phase: 'idle' | 'creating' | 'copying',  // 当前执行阶段
  returnURL: string,                        // 原页面 URL
  tasks: [                                  // 复制任务列表
    {
      source: string,                       // 源收藏夹名称
      target: string,                       // 目标收藏夹名称
    }
  ],
  timestamp: number                         // 状态保存时间
};

// 保存状态
GM_setValue('bilibili_cross_page_state', JSON.stringify(crossPageState));

// 恢复状态
const state = JSON.parse(GM_getValue('bilibili_cross_page_state', 'null'));

// 清除状态
GM_deleteValue('bilibili_cross_page_state');
```

**状态过期机制：**
- 状态超过 30 分钟自动失效
- 避免跨会话的脏数据

**Acceptance Criteria：**
- [ ] 使用 `GM_setValue` / `GM_getValue` 保存和恢复状态
- [ ] 状态包含：phase、returnURL、tasks、timestamp
- [ ] 状态超过 30 分钟自动失效
- [ ] 页面刷新后能正确恢复状态

#### 4. 跨页面流程实现

**完整流程：**

```
阶段 0: 用户在原页面操作
├── 用户在别人/自己的页面勾选收藏夹
├── 填写目标名称
└── 点击"开始批量复制"

阶段 1: 检测并保存状态
├── 检测当前页面类型（自己 vs 别人）
├── 提取勾选的复制任务列表
├── 检查是否需要跳转（是否有新建收藏夹需求）
└── 如果需要跳转：
    ├── 保存状态到 GM 存储
    │   ├── phase: 'creating'
    │   ├── returnURL: window.location.href
    │   ├── tasks: [{source, target}, ...]
    │   └── timestamp: Date.now()
    └── 跳转到用户自己的收藏夹页面

阶段 2: 在自己页面创建收藏夹
├── 页面加载时恢复状态
├── 检测 phase === 'creating'
├── 获取用户当前拥有的收藏夹列表
├── 对比 tasks 中的目标收藏夹，找出缺失的
├── 批量创建缺失的收藏夹
│   ├── 依次点击"新建收藏夹"
│   ├── 填写名称
│   ├── 点击"创建"
│   └── 等待创建完成
├── 更新状态：phase: 'copying'
└── 自动跳回原页面（使用 returnURL）

阶段 3: 在原页面继续复制
├── 页面加载时恢复状态
├── 检测 phase === 'copying'
├── 自动开始复制流程
│   └── 依次执行 tasks 中的复制任务
└── 复制完成后清除状态
```

**关键实现细节：**

1. **获取"自己的收藏夹页面" URL：**
   - 从导航栏"收藏"链接提取 `href`
   - 或从当前用户头像链接提取用户 ID

2. **批量创建收藏夹策略：**
   - 一次性创建所有缺失的收藏夹（减少跳转次数）
   - 创建顺序：按 tasks 列表中的出现顺序
   - 每个创建操作后添加延迟（避免触发反爬虫）

3. **页面加载时的状态恢复：**
   ```javascript
   async function main() {
     await waitForPageLoad();
     
     // 恢复状态
     const state = loadCrossPageState();
     if (state && !isStateExpired(state)) {
       if (state.phase === 'creating') {
         // 在自己页面，执行创建流程
         await handleCreatingPhase(state);
         return;
       } else if (state.phase === 'copying') {
         // 回到原页面，继续复制
         await handleCopyingPhase(state);
         return;
       }
     }
     
     // 正常初始化面板
     initializePanel();
   }
   ```

**Acceptance Criteria：**
- [ ] 用户在别人页面点击"开始批量复制"后，脚本自动跳转到自己页面
- [ ] 跳转后自动检测并创建缺失的收藏夹
- [ ] 创建完成后自动跳回原页面
- [ ] 跳回后自动继续复制流程
- [ ] 整个流程无需用户手动干预
- [ ] 输出面板显示每个阶段的详细日志

### P0 - 过滤"我追的合集/收藏夹"

#### 5. 收藏夹列表过滤

**DOM 结构分析：**

从实际页面 snapshot 看到：
```
uid=1_76 StaticText "我创建的收藏夹"
uid=1_78 StaticText "默认收藏夹"
uid=1_79 StaticText "4993"
uid=1_80 StaticText "测试文件夹"
...
uid=1_120 StaticText "zz"
uid=1_121 StaticText "232"
uid=1_122 StaticText "我追的合集/收藏夹"  <-- 分隔标记
uid=1_123 StaticText "买瓜宇宙"
uid=1_124 StaticText "13"
...
uid=1_224 StaticText "其他收藏"  <-- 另一个分类
```

**关键发现：**
1. "我创建的收藏夹" 和 "我追的合集/收藏夹" 是**纯文本节点**，不是 `.vui_sidebar-item`
2. 它们作为**分隔标记**，划分不同的收藏夹分组
3. 收藏夹项（`.vui_sidebar-item`）在 DOM 中与分隔标记是兄弟节点

**过滤策略：**

**方案 A：遍历侧边栏，检测分隔标记**
```javascript
function getCreatedFavorites() {
  const sidebar = document.querySelector('.favlist-aside');
  if (!sidebar) return [];
  
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
    if (node.nodeType === Node.TEXT_NODE && 
        (node.textContent.trim() === '我追的合集/收藏夹' ||
         node.textContent.trim() === '其他收藏')) {
      inCreatedSection = false;
      continue;
    }
    
    // 收集"我创建的收藏夹"分组中的 .vui_sidebar-item
    if (inCreatedSection && 
        node.nodeType === Node.ELEMENT_NODE &&
        node.classList.contains('vui_sidebar-item')) {
      favorites.push(node);
    }
  }
  
  return favorites;
}
```

**推荐方案：** 方案 A（更可靠，易于理解和维护）

**实施位置：**
- 修改 `BilibiliAPI.getAllFavorites()` 方法
- 或创建新方法 `BilibiliAPI.getCreatedFavorites()`

**Acceptance Criteria：**
- [ ] 面板列表只显示"我创建的收藏夹"分组中的收藏夹
- [ ] "我追的合集/收藏夹"和"其他收藏"不出现在列表中
- [ ] 过滤逻辑稳定，不受页面结构微调影响
- [ ] 控制台输出日志显示过滤前后的数量

### P1 - UI 优化和用户体验

#### 6. 页面类型指示器

**功能：** 在输出面板显示当前页面类型

**显示内容：**
- "当前页面: 我的收藏夹"（绿色）
- "当前页面: 他人的收藏夹"（橙色）

**用途：**
- 提示用户当前在哪种页面
- 提示跨页面流程的必要性

**Acceptance Criteria：**
- [ ] 脚本启动时显示页面类型
- [ ] 颜色编码：我的收藏夹（绿色）、他人的收藏夹（橙色）
- [ ] 显示在输出面板的顶部

#### 7. 详细操作日志

**日志级别：**
- INFO（黑色）：正常流程信息
- WARN（橙色）：警告信息
- ERROR（红色）：错误信息
- DEBUG（灰色）：调试信息（可选）

**关键日志点：**
- 脚本启动
- 检测到收藏夹数量
- 页面类型检测
- 开始批量复制
- 跨页面流程的每个阶段
- 每个收藏夹的复制结果
- 错误和异常

**时间戳格式：**
- `YYYY-MM-DD HH:mm:ss`（当前已有）

**Acceptance Criteria：**
- [ ] 所有关键操作都有日志输出
- [ ] 日志包含时间戳
- [ ] 日志按级别区分颜色
- [ ] 跨页面流程的每个阶段都有清晰的日志

### P2 - 代码优化和文档

#### 8. 代码重构

**目标：** 保持代码结构清晰，易于维护

**重构点：**
1. 将跨页面流程抽象为独立模块：`src/core/CrossPageFlowManager.js`
2. 将状态管理抽象为独立模块：`src/core/StateManager.js`
3. 更新 `FloatingPanel.js`，恢复复选框列表 UI
4. 更新 `FavoriteManager.js`，支持批量复制

**Acceptance Criteria：**
- [ ] 跨页面流程代码独立为 `CrossPageFlowManager` 类
- [ ] 状态管理代码独立为 `StateManager` 类
- [ ] `FloatingPanel` 类职责清晰，只负责 UI
- [ ] `FavoriteManager` 类职责清晰，只负责复制逻辑

#### 9. 文档更新

**需要更新的文档：**
- `readme.md`：添加跨页面流程说明
- `CHANGELOG.md`：记录 v2.0 的变更

**Acceptance Criteria：**
- [ ] `readme.md` 包含跨页面流程的说明
- [ ] `CHANGELOG.md` 记录了所有 P0 和 P1 功能
- [ ] 文档清晰易懂

## Technical Constraints

1. **纯客户端脚本**：所有逻辑在浏览器运行，不能修改 B 站服务端
2. **保持兼容性**：适配新版 B 站页面（VUI 组件库）
3. **模块化架构**：ES6 模块 + Rollup 打包
4. **油猴脚本规范**：最终产物符合 UserScript 格式
5. **状态持久化**：使用 `GM_setValue` / `GM_getValue` API
6. **避免反爬虫**：操作间添加合理延迟

## Acceptance Criteria Summary

### Must Have (P0)

**UI 功能恢复：**
- [ ] 左侧面板显示复选框列表（所有"我创建的收藏夹"）
- [ ] 每个复选框项包含：复选框、名称标签、目标输入框
- [ ] "点我全选"按钮正常工作
- [ ] 可以勾选多个源收藏夹，每个源可以指定不同的目标
- [ ] 点击"开始批量复制"后，依次处理所有勾选项

**跨页面流程：**
- [ ] 在别人页面点击"开始批量复制"后，自动跳转到自己页面
- [ ] 自动检测并批量创建缺失的收藏夹
- [ ] 创建完成后自动跳回原页面
- [ ] 跳回后自动继续复制流程
- [ ] 整个流程无需用户手动干预

**过滤功能：**
- [ ] 面板列表只显示"我创建的收藏夹"
- [ ] "我追的合集/收藏夹"和"其他收藏"不出现在列表中

**功能验证：**
- [ ] 在自己的收藏夹页面，能正常复制（无需跨页面）
- [ ] 在别人的收藏夹页面，能完整执行跨页面流程并成功复制
- [ ] 多页收藏夹（5+ 页）能完整复制
- [ ] 输出面板显示详细日志

### Should Have (P1)

- [ ] 输出面板显示页面类型指示器
- [ ] 详细的操作日志（时间戳、级别、颜色）
- [ ] 跨页面流程的每个阶段都有清晰的日志

### Could Have (P2)

- [ ] 代码重构为独立的 `CrossPageFlowManager` 和 `StateManager` 模块
- [ ] 文档更新（readme.md、CHANGELOG.md）

## Out of Scope

- 不支持旧版 B 站页面
- 不添加新功能（如批量删除、批量移动）
- 不实现服务端 API 调用
- 不处理登录态失效的情况
- 不优化浮动面板的样式和动画

## Unknowns & Risks

### 技术风险

1. **跨页面跳转的可靠性**
   - 自动跳转可能被浏览器拦截（弹窗阻止程序）
   - 缓解：使用 `window.location.href` 而不是 `window.open()`

2. **状态恢复的可靠性**
   - 页面加载时序问题可能导致状态恢复失败
   - 缓解：在 `main()` 函数开头优先检查状态

3. **批量创建收藏夹的稳定性**
   - 快速连续创建可能触发反爬虫
   - 缓解：每个创建操作后添加延迟（1-2 秒）

4. **DOM 结构变化**
   - B 站可能再次改版，分隔标记的文本或位置可能变化
   - 缓解：使用灵活的过滤策略，添加日志方便调试

### 用户体验风险

1. **跨页面跳转用户感知**
   - 自动跳转可能让用户困惑
   - 缓解：在输出面板显示明确的提示和进度

2. **操作耗时较长**
   - 大量收藏夹的复制可能需要数分钟
   - 缓解：显示详细的进度和时间估算

## Success Metrics

1. **功能完整性：** 所有 P0 验收标准通过
2. **用户体验：** 跨页面流程流畅，日志清晰
3. **代码质量：** 模块化结构清晰，易于维护
4. **稳定性：** 在真实环境测试 10 次，成功率 ≥ 90%

## Notes

- 这是一个**中等偏复杂的任务**，涉及：
  1. UI 重构（恢复复选框列表）
  2. 跨页面流程实现（状态管理、自动跳转）
  3. 数据过滤（识别分隔标记）
  
- 建议分步实施：
  1. 先恢复 UI（确保功能不退化）
  2. 再实现跨页面流程（新功能）
  3. 最后优化日志和文档

- 参考资料：
  - 归档任务：`.trellis/tasks/archive/2026-06/06-22-bilibili-favs-adapt/`
  - 归档任务：`.trellis/tasks/archive/2026-06/06-22-fix-bilibili-cross-page/`
  - 旧版实现：`BilibiliFavsManage.js`（1131 行，包含完整的复选框列表 UI）
