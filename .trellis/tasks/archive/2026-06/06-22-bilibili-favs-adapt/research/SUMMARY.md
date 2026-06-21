# Research Summary: B 站新版页面结构分析

## 探测时间
2026-06-22

## 测试环境
- URL: https://space.bilibili.com/1660244464/favlist?fid=2908363364&ftype=create&ctype=21
- 收藏夹: NmLf (803 个视频)
- 总收藏夹数: 74 个

## 页面结构分析

### 1. 收藏夹侧边栏
```
.favlist-aside (侧边栏容器)
  └─ .vui_sidebar-item (收藏夹项，共 74 个)
      ├─ .vui_sidebar-item-title (标题容器)
      │   └─ .vui_ellipsis.multi-mode (收藏夹名称文本)
      └─ .vui_sidebar-item-postfix (视频数量，可选)
      
当前激活的收藏夹会有额外的 class: .vui_sidebar-item--active
```

**验证结果：**
```javascript
document.querySelectorAll('.favlist-aside .vui_sidebar-item').length
// 返回: 74
```

### 2. 主内容区域
```
.space-main.route_favlist (主容器)
  ├─ .favlist-info (收藏夹信息区)
  │   ├─ .favlist-info-detail__title-row (当前收藏夹名称: "NmLf")
  │   └─ .vui_button.favlist-info-batch (批量操作按钮，文本: "批量操作")
  │
  └─ 视频列表区域
      ├─ .bili-video-card (视频卡片，测试时有 39 个)
      │   ├─ .bili-video-card__cover (封面区)
      │   │   └─ .bili-card-checkbox (批量模式下显示的 checkbox)
      │   │       └─ .bili-card-checkbox__inner (可点击的内部元素)
      │   └─ .bili-video-card__details (详情区)
      │       └─ .bili-video-card__title (标题)
      │
      └─ .vui_pagenation (分页组件)
```

### 3. 批量操作模式

**触发方式：**
点击 `.vui_button.favlist-info-batch` 按钮

**模式激活后的变化：**
1. 视频卡片上的 checkbox 显示（`.bili-card-checkbox--visible`）
2. 出现全选控件（`.vui_checkbox`，label 元素，文本"全选"）
3. 出现操作按钮：
   - "复制至" (`button.vui_button.action-btn`)
   - "移动至" (`button.vui_button.action-btn`)

**全选操作：**
```javascript
// 点击全选
document.querySelector('.vui_checkbox').click();

// 验证选中状态
document.querySelectorAll('.bili-card-checkbox--checked').length
// 返回: 39 (当前页所有视频)
```

**Checkbox 结构：**
- 不是 `<input type="checkbox">`
- 是一个 SVG 图标的 div 容器
- 通过 class `.bili-card-checkbox--checked` 标识选中状态
- 点击 `.bili-card-checkbox__inner` 可以切换选中状态

### 4. 收藏夹选择弹窗 ⚠️

**触发方式：**
点击"复制至"按钮后弹出

**初步发现：**
- 弹窗存在，已通过截图确认显示了收藏夹列表
- 使用 `.vui_dialog` 相关类名
- 具体内部结构需要进一步手动探测

**待确认的选择器：**
- [ ] 弹窗容器
- [ ] 收藏夹列表容器
- [ ] 收藏夹列表项
- [ ] 收藏夹名称元素
- [ ] 新建收藏夹按钮
- [ ] 新建收藏夹输入框
- [ ] 确定按钮
- [ ] 取消按钮

### 5. 分页组件

**容器：** `.vui_pagenation`

**待确认：**
- [ ] 总页数提取方式
- [ ] 下一页按钮选择器
- [ ] 当前页标识
- [ ] 最后一页判断方式

测试环境显示了分页信息："共 21 页 / 803 个"

## 核心差异对比

| 功能点 | 旧版 | 新版 | 状态 |
|--------|------|------|------|
| 收藏夹列表容器 | `#fav-createdList-container` | `.favlist-aside` | ✅ 已验证 |
| 收藏夹项 | `.fav-item a` | `.vui_sidebar-item` | ✅ 已验证 |
| 收藏夹名称 | `a` 的 `textContent` | `.vui_sidebar-item-title .vui_ellipsis` | ✅ 已验证 |
| 当前收藏夹 | `.favInfo-details .fav-name` | `.favlist-info-detail__title-row` | ✅ 已验证 |
| 批量操作按钮 | `.filter-item.do-batch .text` | `.vui_button.favlist-info-batch` | ✅ 已验证 |
| 全选按钮 | `.icon-selece-all` | `.vui_checkbox` | ✅ 已验证 |
| 视频 checkbox | (内置) | `.bili-card-checkbox` | ✅ 已验证 |
| 复制至按钮 | `.icon-copy` | `button:contains('复制至')` | ✅ 已验证 |
| 收藏夹选择弹窗 | `.edit-video-modal` | `.vui_dialog` (待详细探测) | ⚠️ 部分确认 |
| 分页容器 | `.be-pager` | `.vui_pagenation` | ⚠️ 待测试 |
| 下一页按钮 | `.be-pager-next` | (待确认) | ⚠️ 待测试 |

## 关键发现

1. **组件库完全更换**
   - 旧版：自定义 class 命名
   - 新版：VUI 组件库（`vui_` 前缀）

2. **Checkbox 实现方式变化**
   - 旧版：可能使用原生 input
   - 新版：自定义 SVG 图标，无 input 元素

3. **批量模式需要显式激活**
   - 旧版：可能直接显示批量操作按钮
   - 新版：需要先点击"批量操作"按钮进入批量模式

4. **动态渲染特征明显**
   - 点击后需要等待元素出现
   - 建议所有操作后添加延迟和元素检查

## 下一步行动

### 高优先级（阻塞实施）
1. 手动探测收藏夹选择弹窗的完整结构
2. 测试分页组件的交互方式

### 中优先级
1. 测试收藏夹项的点击方式（是否需要点击子元素）
2. 测试新建收藏夹的完整流程

### 低优先级
1. 测试错误场景（网络慢、元素加载失败等）
2. 优化延迟时间

## 工具 & 命令

**快速测试选择器：**
```javascript
// 收藏夹列表
document.querySelectorAll('.favlist-aside .vui_sidebar-item').length

// 当前收藏夹名称
document.querySelector('.favlist-info-detail__title-row').textContent.trim()

// 批量操作按钮
document.querySelector('.vui_button.favlist-info-batch')

// 进入批量模式
document.querySelector('.vui_button.favlist-info-batch').click()

// 全选
document.querySelector('.vui_checkbox').click()

// 检查选中数量
document.querySelectorAll('.bili-card-checkbox--checked').length

// 点击复制至
Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '复制至').click()
```

## 附件

- `bilibili-favs-snapshot.txt` - 完整的页面可访问性树快照
- `batch-mode-screenshot.png` - 批量模式下的页面截图（含弹窗）
