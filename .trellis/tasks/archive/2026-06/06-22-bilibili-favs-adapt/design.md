# Design: 适配新版 B 站收藏夹页面

## Architecture Overview

B 站收藏夹页面已从旧版 DOM 结构迁移到基于 VUI 组件库的新架构。本次适配的核心是更新所有 DOM 选择器，保持脚本逻辑不变。

## Key Changes

### 1. 选择器映射表

| 功能 | 旧版选择器 | 新版选择器 | 备注 |
|------|-----------|-----------|------|
| 收藏夹列表容器 | `#fav-createdList-container` | `.favlist-aside` | 侧边栏容器 |
| 收藏夹项 | `#fav-createdList-container .fav-item a` | `.favlist-aside .vui_sidebar-item` | 共 74 项 |
| 收藏夹名称 | 通过 `a` 标签的 `textContent` | `.vui_sidebar-item-title .vui_ellipsis` | 嵌套结构 |
| 收藏夹数量 | - | `.vui_sidebar-item-postfix` | 新增，可选 |
| 当前激活收藏夹 | - | `.vui_sidebar-item--active` | class 标记 |
| 当前收藏夹标题 | `.favInfo-details .fav-name` | `.favlist-info-detail__title-row` | 右侧面板 |
| 批量操作按钮 | `.filter-item.do-batch .text` | `.vui_button.favlist-info-batch` | 文本"批量操作" |
| 视频卡片 | `.small-item` | `.bili-video-card` | 351 个 |
| 视频 checkbox | - | `.bili-card-checkbox` | 批量模式显示 |
| 视频 checkbox 选中状态 | - | `.bili-card-checkbox--checked` | class 标记 |
| 全选按钮 | `.icon-selece-all` | `.vui_checkbox` | label 元素，文本"全选" |
| 复制至按钮 | `.icon-copy` | `button:contains('复制至')` | 批量模式下显示，class: `vui_button action-btn` |
| 移动至按钮 | - | `button:contains('移动至')` | 批量模式下显示 |
| 收藏夹选择弹窗 | `.edit-video-modal` | `.vui_dialog--content.fav-modify-modal-content` | 点击"复制至"后弹出 |
| 目标收藏夹列表容器 | `.target-favlist-container` | `.modify-fav-list` | 弹窗内列表容器 |
| 目标收藏夹列表项 | `.target-favitem` | `.modify-fav-item` (label 元素) | 每个收藏夹项 |
| 收藏夹名称 | `.fav-name` | `.modify-fav-item__title` | 收藏夹标题 |
| 收藏夹 Radio | - | `input[type="radio"].vui_radio--input-original` | value 是收藏夹 ID |
| 新建收藏夹按钮 | `.fake-fav-input` | `.modify-fav-add` | div 元素，文本"新建收藏夹" |
| 新建对话框 | - | `.fav-collapse-modal-content` | 新建收藏夹对话框 |
| 新建收藏夹输入框 | `.add-fav-input` | `input.add-fav-input` | placeholder: "快来给你的收藏夹命名吧" |
| 新建描述输入框 | - | `textarea.add-fav-input` | 可选 |
| 新建确认按钮 | `.fav-add-btn` | `button:contains('创建')` | class: `vui_button vui_button--blue` |
| 确定按钮 | `.btn-content` | 主对话框内 `button.vui_button--blue` | 文本"确定" |
| 成功提示 | - | `.vui_toast` | 文本"操作成功" |
| 分页容器 | `.be-pager` | `.vui_pagenation` | - |
| 下一页按钮 | `.be-pager-next` | `.vui_pagenation` 内按钮 | 需测试 |

### 2. 核心方法修改清单

#### `getAllFavs()` - 获取所有收藏夹链接
```javascript
// 旧版
let parentElement = document.getElementById('fav-createdList-container');
let links = parentElement.querySelectorAll('a[href]');

// 新版
let parentElement = document.querySelector('.favlist-aside');
let items = parentElement.querySelectorAll('.vui_sidebar-item');
// 从每个 item 中提取 href（如果需要）或从 data 属性中获取
```

#### `getAllFavBtns()` - 获取所有收藏夹按钮
```javascript
// 旧版
let buttons = document.querySelectorAll('#fav-createdList-container .fav-item a');

// 新版
let items = document.querySelectorAll('.favlist-aside .vui_sidebar-item');
// 收藏夹项本身就是可点击的，可能不是 a 标签
```

#### `transferOneFav()` - 转移单个收藏夹
**当前收藏夹名称：**
```javascript
// 旧版
const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();

// 新版
const sourceFavName = document.querySelector('.favlist-info-detail__title-row').textContent.trim();
```

**分页总数：**
```javascript
// 旧版
const totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');

// 新版
// 需要从 .vui_pagenation 中提取，可能结构不同
```

**点击批量操作：**
```javascript
// 旧版
let batchOperationButton = document.querySelector('.filter-item.do-batch .text');

// 新版
let batchOperationButton = document.querySelector('.vui_button.favlist-info-batch');
```

#### `saveCollection()` - 保存收藏
**全选：**
```javascript
// 旧版
document.querySelector('.icon-selece-all').parentNode.click();

// 新版
document.querySelector('.vui_checkbox').click();
```

**复制至：**
```javascript
// 旧版
document.querySelector('.icon-copy').parentNode.click();

// 新版
// 找到文本为"复制至"的按钮
let copyBtn = Array.from(document.querySelectorAll('button'))
  .find(btn => btn.textContent.trim() === '复制至');
copyBtn.click();
```

**目标收藏夹列表、新建收藏夹等：**
- 需要等待弹窗出现后进一步探测选择器
- 弹窗可能使用 `.vui_dialog` 或类似的容器

**下一页：**
```javascript
// 旧版
const nextPageBtn = document.querySelector('.be-pager-next');

// 新版
// 需要从 .vui_pagenation 中找到下一页按钮
```

### 3. 批量操作流程

新版批量操作流程（已验证）：

1. 点击"批量操作"按钮（`.vui_button.favlist-info-batch`）
   - 视频卡片上显示 checkbox（`.bili-card-checkbox`）
   - 出现"全选"checkbox（`.vui_checkbox`）
   - 出现"复制至"和"移动至"按钮（`button:contains('复制至')`）

2. 点击"全选"
   - 所有视频卡片的 checkbox 被选中
   - checkbox 增加 class：`.bili-card-checkbox--checked`
   - 实测：39 个视频被选中

3. 点击"复制至"
   - 弹出收藏夹选择弹窗（`.vui_dialog--content.fav-modify-modal-content`）
   - 标题显示："将39个视频复制至"

4. 选择目标收藏夹或新建 ✅ 已验证
   - **收藏夹列表容器：** `.modify-fav-list`
   - **收藏夹列表项：** `.vui_radio-group` 或 `.modify-fav-item`（label 元素）
   - **收藏夹名称：** `.modify-fav-item__title`
   - **收藏夹数量：** `.modify-fav-item__count`
   - **Radio 输入：** `input[type="radio"].vui_radio--input-original`（value 是收藏夹 ID）
   - **选中状态：** `.vui_radio--checked` class
   - **新建收藏夹按钮：** `.modify-fav-add`（div 元素，文本"新建收藏夹"）

5. 新建收藏夹流程 ✅ 已验证
   - 点击 `.modify-fav-add` 后弹出新对话框（`.vui_dialog--content.fav-collapse-modal-content`）
   - **名称输入框：** `input.add-fav-input`（placeholder: "快来给你的收藏夹命名吧"）
   - **描述输入框：** `textarea.add-fav-input`（placeholder: "可以简单描述下你的收藏夹"）
   - **创建按钮：** `button:contains('创建')`（`.vui_button.vui_button--blue`，初始禁用）
   - **输入触发：** 需要完整的 input 事件链（focus → keydown → input → keyup → change）才能启用创建按钮
   - 创建成功后返回主对话框，新收藏夹出现在列表中

6. 点击"确定" ✅ 已验证
   - **确定按钮：** 主对话框内的 `button.vui_button--blue`（文本"确定"）
   - 点击后执行复制操作
   - 弹窗关闭
   - 显示成功提示：`.vui_toast`（文本"操作成功"）

### 4. 完整选择器映射（补充）

2. **分页组件详细结构**
   - 如何从 `.vui_pagenation` 中提取总页数
   - 下一页按钮的准确选择器
   - 是否有最后一页标识

3. **收藏夹项的点击方式**
   - `.vui_sidebar-item` 是否直接可点击
   - 是否需要点击其中的子元素
   - 点击后如何等待页面加载完成

## Implementation Strategy

### Phase 1: 选择器替换（核心适配）
1. 更新 `getAllFavs()` 和 `getAllFavBtns()` 方法
2. 更新 `transferOneFav()` 中的选择器
3. 更新 `saveCollection()` 中的全选和复制至选择器

### Phase 2: 弹窗探测与适配
1. 使用浏览器手动触发完整流程，记录弹窗结构
2. 更新弹窗相关的所有选择器
3. 测试新建收藏夹流程

### Phase 3: 分页适配
1. 探测 `.vui_pagenation` 的结构
2. 更新分页相关逻辑

### Phase 4: 测试与优化
1. 在真实环境测试完整复制流程
2. 添加错误处理和日志
3. 优化延迟时间

## Risks & Mitigation

1. **动态加载风险**
   - 新版页面可能大量使用 Vue/React 动态渲染
   - 缓解：在每个关键操作后添加 `await delay()` 和元素存在检查

2. **弹窗结构未知**
   - 收藏夹选择弹窗的结构尚未完全探测
   - 缓解：先完成前置步骤，再逐步探测弹窗

3. **class 名称变化**
   - VUI 组件库可能更新，class 名称可能变化
   - 缓解：优先使用稳定的 class（如 `vui_` 前缀），添加降级选择器

## Rollout Plan

1. 在测试环境验证选择器的正确性
2. 逐个方法替换并测试
3. 完成弹窗适配后进行端到端测试
4. 发布新版本到油猴脚本平台
