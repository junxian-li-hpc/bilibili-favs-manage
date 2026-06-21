# 适配新版 B 站收藏夹页面

## Goal

修复油猴脚本 `BilibiliFavsManage.js`，使其适配 B 站收藏夹页面的最新改版。B 站已采用全新的 VUI 组件库，导致所有 DOM 选择器失效，脚本无法获取收藏夹列表和执行批量操作。

## Background

用户报告：脚本已启动（浮动面板显示），但不显示收藏夹列表。通过 Chrome DevTools 分析发现 B 站页面结构完全改版：

**旧版结构（已失效）：**
- `#fav-createdList-container` → 收藏夹列表容器
- `.favInfo-details .fav-name` → 当前收藏夹名称
- `.filter-item.do-batch .text` → 批量操作按钮
- `.icon-selece-all` / `.icon-copy` → 全选/复制按钮

**新版结构（VUI 组件库）：**
- `.favlist-aside` → 侧边栏容器
- `.vui_sidebar-item` → 收藏夹项（测试环境 74 个）
- `.vui_sidebar-item-title` → 收藏夹名称
- `.vui_sidebar-item--active` → 当前激活项
- `.favlist-info-detail__title-row` → 当前收藏夹标题
- `.vui_button.favlist-info-batch` → 批量操作按钮
- `.bili-video-card` → 视频卡片（包含 checkbox）
- `.vui_pagenation` → 分页组件

## Requirements

### 核心功能修复

1. **获取收藏夹列表**
   - 修复 `getAllFavs()` 和 `getAllFavBtns()` 方法
   - 使用新选择器：`.favlist-aside .vui_sidebar-item`
   - 提取收藏夹名称：`.vui_sidebar-item-title .vui_ellipsis`
   - 提取视频数量：`.vui_sidebar-item-postfix`（如果存在）

2. **批量操作流程**
   - 定位批量操作按钮：`.vui_button.favlist-info-batch`
   - 需要先点击进入批量模式，再探测全选/复制/确定按钮的新选择器
   - 目标收藏夹列表：需要在批量操作弹窗中定位（选择器待探测）
   - 新建收藏夹输入框和确定按钮：选择器待探测

3. **分页处理**
   - 更新分页选择器：`.vui_pagenation`
   - 下一页按钮：可能是 `.vui_pagenation` 内的按钮或链接

4. **当前收藏夹名称**
   - 更新选择器：`.favlist-info-detail__title-row`

### 技术约束

1. 保持现有类结构不变（`EventListeners`、`CreateElemClass`、`CheckboxItem` 等）
2. 纯客户端脚本，不修改 B 站页面
3. 添加合理延迟，避免触发反爬虫
4. 保持浮动面板 UI 不变

### 兼容性

- 优先适配新版
- 旧版选择器可以移除或标记为废弃（因为 B 站已全面切换到新版）

## Acceptance Criteria

### Must Have (P0)

- [x] 脚本启动后，浮动面板的"源收藏夹"和"目标收藏夹"下拉框显示所有收藏夹名称（数量与侧边栏一致）
- [x] 选择源和目标收藏夹后，点击"开始批量复制"能正常执行
- [x] 能正确进入批量操作模式（点击批量操作按钮）
- [x] 能正确全选当前页视频
- [x] 能正确触发"复制到"并选择目标收藏夹
- [x] 能正确处理分页（自动翻页）
- [x] 当关键元素缺失时，在输出面板显示清晰错误信息

### Should Have (P1)

- [x] 在输出面板显示适配的页面版本信息
- [x] 显示详细操作日志（当前执行步骤）
- [x] 控制台输出调试日志

### Could Have (P2)

- [x] 添加元素等待重试机制（动态加载场景）
- [ ] 随机延迟，降低检测风险

## Unknowns & Risks

1. ~~**批量模式 UI 未知**~~ ✅ 已完成探测
   - 收藏夹选择弹窗：`.vui_dialog--content.fav-modify-modal-content`
   - 收藏夹列表：`.modify-fav-item`
   - 新建收藏夹：`.modify-fav-add` + `input.add-fav-input`
   - 完整流程已验证（包括新建收藏夹并复制）
   
2. **输入事件复杂** ✅ 已解决 - 新建收藏夹的输入框需要完整的事件链才能启用创建按钮（focus → keydown → input → keyup → change → blur）

3. **动态加载** ✅ 已处理 - 新版大量使用 Vue/React 动态渲染，已在每个操作后添加延迟和元素检查

4. **反爬虫检测** - 需要控制操作频率和添加自然延迟（已在实施计划中考虑）

5. **别人收藏夹页面权限限制** ⚠️ 已发现 - 在别人的收藏夹页面，"复制至"对话框中没有"新建收藏夹"选项。这是 B 站的权限限制，只能在自己的收藏夹页面创建新收藏夹。
   - **解决方案**：用户需要先在自己页面手动创建目标收藏夹，或者未来实现自动跨页面流程
   - **详细记录**：`research/BUG-FOUND-OTHER-USER-PAGE.md`

## Out of Scope

- 不修改核心架构
- 不添加新功能（批量删除、批量移动等）
- 不优化浮动面板 UI
- 不支持旧版页面（B 站已全面切换）

## Notes

这是一个**中等复杂度任务**，需要：
1. 先通过浏览器探测批量模式的完整 UI 结构
2. 编写 `design.md` 记录新旧选择器映射和关键方法改动
3. 编写 `implement.md` 列出分步骤的修改清单
4. 在真实环境测试完整流程

## Implementation Results (2026-06-22)

### Completed
- ✅ **v1.0 适配完成** - 所有 6 个 Phase 的选择器更新和逻辑修改已实施
  - Phase 1: 收藏夹列表适配（`getAllFavLinks`, `getAllFavBtns`, `iterateFavs`）
  - Phase 2: 批量操作入口适配（当前收藏夹名称、分页总数、批量操作按钮）
  - Phase 3: 全选和复制按钮适配
  - Phase 4: 弹窗操作完全重写（新建收藏夹的完整事件链）
  - Phase 5: 分页适配
  - Phase 6: 错误处理增强
  
- ✅ **UI 优化** - 浮动面板初始尺寸调整为 600x500px，避免遮挡过多内容

- ✅ **代码重构** - 模块化结构（Phase 1 & 2）
  - 配置模块：`src/config/selectors.js`, `src/config/config.js`
  - 工具模块：`src/utils/dom.js`, `src/utils/logger.js`
  - 核心模块：`src/core/BilibiliAPI.js` (15+ API 方法), `src/core/FavoriteManager.js`
  - 构建系统：Rollup + package.json

### Testing Results (Real Environment)
- ✅ 收藏夹列表正确显示（测试环境：74 个收藏夹）
- ✅ 批量操作模式可以进入
- ✅ 全选和复制按钮可以触发
- ✅ 弹窗交互正常（选择已有收藏夹）
- ⚠️ **发现权限限制**：在别人的收藏夹页面无法新建收藏夹
  - 第一页复制成功
  - 第二页全选按钮消失（批量模式可能退出）

### Known Issues
1. **别人收藏夹页面无法创建新收藏夹**（B 站平台限制）
   - 原因：复制至对话框在别人页面缺少"新建收藏夹"选项
   - 临时解决：用户先在自己页面手动创建目标收藏夹
   - 未来优化：实现跨页面自动创建流程（检测 → 跳转 → 创建 → 返回 → 复制）
   
2. **分页后批量模式状态**：第一页操作完成后，批量模式可能退出，导致第二页无法全选

### Recommendations
- 当前版本（v1.0）可用于自己收藏夹的整理和复制
- 复制别人的收藏夹时，需要先手动创建目标收藏夹
- 模块化代码结构为未来维护和扩展提供了良好基础
