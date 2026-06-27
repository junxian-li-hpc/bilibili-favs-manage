# Implementation Plan: 适配新版 B 站收藏夹页面

## Overview

本计划将分阶段替换脚本中的 DOM 选择器，逐步适配新版 B 站收藏夹页面。每个阶段独立可测试，降低风险。

## Prerequisites

- [x] Chrome DevTools 探测完成，新版页面结构已记录
- [x] 设计文档完成，选择器映射表已建立
- [ ] 备份当前工作版本（`BilibiliFavsManage.js`）

## Phase 1: 收藏夹列表适配 ✅

**目标：** 修复收藏夹列表显示功能

### 1.1 修改 `getAllFavs()` 方法
**位置：** `BilibiliFavsManage.js` 约 788-793 行

```javascript
// 旧代码
getAllFavs() {
    let parentElement = document.getElementById('fav-createdList-container');
    let links = parentElement.querySelectorAll('a[href]');
    return links;
}

// 新代码
getAllFavs() {
    let parentElement = document.querySelector('.favlist-aside');
    if (!parentElement) {
        console.error('[BiliBili Favs] 找不到收藏夹侧边栏容器');
        return [];
    }
    let items = parentElement.querySelectorAll('.vui_sidebar-item');
    return items;
}
```

**验证：**
```javascript
// 在浏览器控制台测试
const favs = document.querySelectorAll('.favlist-aside .vui_sidebar-item');
console.log('收藏夹数量:', favs.length); // 应该是 74
```

### 1.2 修改 `getAllFavBtns()` 方法
**位置：** `BilibiliFavsManage.js` 约 795-799 行

```javascript
// 旧代码
getAllFavBtns() {
    let buttons = document.querySelectorAll('#fav-createdList-container .fav-item a');
    return buttons;
}

// 新代码
getAllFavBtns() {
    let buttons = document.querySelectorAll('.favlist-aside .vui_sidebar-item');
    if (buttons.length === 0) {
        console.error('[BiliBili Favs] 找不到收藏夹列表');
    }
    return buttons;
}
```

### 1.3 修改收藏夹名称提取逻辑
**位置：** 使用 `getAllFavs()` 的地方，需要更新如何提取名称

```javascript
// 旧方式：直接从 a 标签的 textContent 获取
favItem.textContent.trim()

// 新方式：从嵌套结构中提取
const titleEl = favItem.querySelector('.vui_sidebar-item-title .vui_ellipsis');
const favName = titleEl ? titleEl.textContent.trim() : '';
```

**验证：**
- 启动脚本
- 检查浮动面板的"源收藏夹"和"目标收藏夹"下拉框
- 应显示所有收藏夹名称（74 个）

---

## Phase 2: 批量操作入口适配

**目标：** 修复批量操作按钮和当前收藏夹名称获取

### 2.1 修改获取当前收藏夹名称
**位置：** `transferOneFav()` 方法，约 852 行

```javascript
// 旧代码
const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();

// 新代码
const titleEl = document.querySelector('.favlist-info-detail__title-row');
if (!titleEl) {
    this.ctl.appendInfo('Error: 无法获取当前收藏夹名称', this.errorCode);
    return;
}
const sourceFavName = titleEl.textContent.trim();
```

### 2.2 修改批量操作按钮点击
**位置：** `transferOneFav()` 方法，约 864-867 行

```javascript
// 旧代码
let batchOperationButton = document.querySelector('.filter-item.do-batch .text');
if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
    batchOperationButton.click();
}

// 新代码
let batchOperationButton = document.querySelector('.vui_button.favlist-info-batch');
if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
    this.ctl.appendInfo('点击[批量操作]按钮');
    batchOperationButton.click();
} else {
    this.ctl.appendInfo('Error: 找不到批量操作按钮', this.errorCode);
}
```

### 2.3 修改分页总数获取
**位置：** `transferOneFav()` 方法，约 858-859 行

```javascript
// 旧代码
const totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');
const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim().split(':')[0]) : 1;

// 新代码 - 方案 A：从分页组件中提取
const paginationEl = document.querySelector('.vui_pagenation');
let totalPages = 1;
if (paginationEl) {
    // 尝试从分页按钮中找到最大页码
    const pageButtons = paginationEl.querySelectorAll('button');
    const pageNumbers = [];
    pageButtons.forEach(btn => {
        const num = parseInt(btn.textContent.trim());
        if (!isNaN(num)) {
            pageNumbers.push(num);
        }
    });
    totalPages = pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
} else {
    totalPages = 1; // 单页
}

// 新代码 - 方案 B：从"共 X 页"文本中提取
const pageInfoText = document.querySelector('.vui_pagenation')?.textContent || '';
const match = pageInfoText.match(/共\s*(\d+)\s*页/);
totalPages = match ? parseInt(match[1]) : 1;
```

**验证：**
- 选择一个收藏夹
- 点击脚本的"开始批量复制"
- 检查日志输出是否显示正确的收藏夹名称和总页数

---

## Phase 3: 全选和复制至适配

**目标：** 修复全选和复制至按钮

### 3.1 修改全选按钮点击
**位置：** `saveCollection()` 方法，约 891 行

```javascript
// 旧代码
document.querySelector('.icon-selece-all').parentNode.click();

// 新代码
const selectAllCheckbox = document.querySelector('.vui_checkbox');
if (selectAllCheckbox) {
    this.ctl.appendInfo('点击[全选]');
    selectAllCheckbox.click();
} else {
    this.ctl.appendInfo('Error: 找不到全选按钮', this.errorCode);
}
```

### 3.2 修改复制至按钮点击
**位置：** `saveCollection()` 方法，约 895 行

```javascript
// 旧代码
document.querySelector('.icon-copy').parentNode.click();

// 新代码
// 通过文本内容查找按钮
const allButtons = document.querySelectorAll('button');
let copyBtn = null;
for (const btn of allButtons) {
    if (btn.textContent.trim() === '复制至') {
        copyBtn = btn;
        break;
    }
}

if (copyBtn) {
    this.ctl.appendInfo('点击[复制至]按钮');
    copyBtn.click();
} else {
    this.ctl.appendInfo('Error: 找不到复制至按钮', this.errorCode);
}
```

**验证：**
- 执行批量复制
- 观察是否能正确全选和打开复制弹窗

---

## Phase 4: 弹窗内操作适配 ✅

**目标：** 适配收藏夹选择弹窗内的操作

### 4.1 弹窗结构（已探测完成）

**完整流程验证：**
- ✅ 点击"复制至" → 弹出收藏夹选择弹窗
- ✅ 收藏夹列表显示正常
- ✅ 可以选择已有收藏夹
- ✅ 可以新建收藏夹（输入名称并创建）
- ✅ 点击确定后复制成功，显示"操作成功"提示

**核心选择器：**
```javascript
// 主弹窗
const dialog = document.querySelector('.vui_dialog--content.fav-modify-modal-content');

// 收藏夹列表容器
const listContainer = dialog.querySelector('.modify-fav-list');

// 收藏夹列表项（label 元素）
const favItems = dialog.querySelectorAll('.modify-fav-item');

// 获取收藏夹名称
const favName = favItem.querySelector('.modify-fav-item__title').textContent.trim();

// 选择收藏夹（点击 radio）
const radio = favItem.querySelector('input[type="radio"]');
radio.click();

// 新建收藏夹按钮（div 元素）
const createBtn = dialog.querySelector('.modify-fav-add');

// 新建收藏夹输入框
const nameInput = document.querySelector('input.add-fav-input');

// 输入名称（需要完整的事件链）
nameInput.focus();
nameInput.value = '';
for (let char of newFavName) {
    nameInput.value += char;
    nameInput.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
    await delay(50);
}
nameInput.dispatchEvent(new Event('change', { bubbles: true }));

// 点击创建按钮
const createConfirmBtn = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.trim() === '创建');
createConfirmBtn.click();

// 主弹窗确定按钮
const confirmBtn = dialog.querySelector('button.vui_button--blue');
confirmBtn.click();
```

### 4.2 修改目标收藏夹列表获取
**位置：** `saveCollection()` 方法，约 898-900 行

```javascript
// 旧代码
const targetFavList = document.querySelectorAll('.target-favlist-container .fav-name');

// 新代码
const dialog = document.querySelector('.vui_dialog--content.fav-modify-modal-content');
if (!dialog) {
    this.ctl.appendInfo('Error: 找不到收藏夹选择弹窗', this.errorCode);
    return;
}

// 等待弹窗完全加载
await this.delay(this.delayTimeShort);

const targetFavList = dialog.querySelectorAll('.modify-fav-item__title');
if (targetFavList.length === 0) {
    this.ctl.appendInfo('Error: 弹窗中没有收藏夹列表', this.errorCode);
    return;
}
```

### 4.3 修改检查同名收藏夹
**位置：** `saveCollection()` 方法，约 901-907 行

```javascript
// 旧代码
let hasSameNameFav = false;
targetFavList.forEach(function (targetFav) {
    if (targetFav.textContent.trim() === targetFavName) {
        hasSameNameFav = true;
    }
});

// 新代码
let hasSameNameFav = false;
targetFavList.forEach((titleEl) => {
    if (titleEl.textContent.trim() === targetFavName) {
        hasSameNameFav = true;
    }
});
```

### 4.4 修改新建收藏夹流程
**位置：** `saveCollection()` 方法，约 908-922 行

```javascript
// 旧代码
if (!hasSameNameFav) {
    this.ctl.appendInfo("创建新的收藏夹：[" + targetFavName + "]");
    this.ctl.appendInfo("点击[新建收藏夹]按钮");
    document.querySelector('.fake-fav-input').click();
    await this.delay(this.delayTimeMiddle);

    this.ctl.appendInfo("输入新收藏夹名称：[" + targetFavName + "]");
    const inputText = document.querySelector('.add-fav-input');
    inputText.value = targetFavName;
    inputText.dispatchEvent(new Event('input', { bubbles: true }));
    await this.delay(this.delayTimeShort);

    this.ctl.appendInfo("点击[新建]按钮");
    document.querySelector('.fav-add-btn').click();
}

// 新代码
if (!hasSameNameFav) {
    this.ctl.appendInfo("创建新的收藏夹：[" + targetFavName + "]");
    
    // 点击新建收藏夹按钮
    this.ctl.appendInfo("点击[新建收藏夹]按钮");
    const createBtn = dialog.querySelector('.modify-fav-add');
    if (!createBtn) {
        this.ctl.appendInfo('Error: 找不到新建收藏夹按钮', this.errorCode);
        return;
    }
    createBtn.click();
    await this.delay(this.delayTimeMiddle);

    // 输入收藏夹名称（需要完整的事件链）
    this.ctl.appendInfo("输入新收藏夹名称：[" + targetFavName + "]");
    const nameInput = document.querySelector('input.add-fav-input');
    if (!nameInput) {
        this.ctl.appendInfo('Error: 找不到名称输入框', this.errorCode);
        return;
    }
    
    // 模拟真实输入
    nameInput.focus();
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('focus', { bubbles: true }));
    
    for (let i = 0; i < targetFavName.length; i++) {
        const char = targetFavName[i];
        nameInput.value += char;
        nameInput.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
        await this.delay(50);
    }
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
    
    await this.delay(this.delayTimeShort);

    // 点击创建按钮
    this.ctl.appendInfo("点击[创建]按钮");
    const createConfirmBtn = Array.from(document.querySelectorAll('button'))
        .find(btn => btn.textContent.trim() === '创建');
    
    if (!createConfirmBtn || createConfirmBtn.disabled) {
        this.ctl.appendInfo('Error: 创建按钮不可用', this.errorCode);
        return;
    }
    createConfirmBtn.click();
    await this.delay(this.delayTimeMiddle); // 等待返回主对话框
}
```

### 4.5 修改选择目标收藏夹
**位置：** `saveCollection()` 方法，约 926-934 行

```javascript
// 旧代码
await this.delay(this.delayTimeShort);
this.ctl.appendInfo("点击目标收藏夹：[" + targetFavName + "]");
const favListContainer = document.querySelector('.target-favlist-container');
const favItems = favListContainer.querySelectorAll('.target-favitem');

favItems.forEach(function (item) {
    const folderNameElement = item.querySelector('.fav-name');
    if (folderNameElement && folderNameElement.textContent.trim() === targetFavName) {
        folderNameElement.click();
        return;
    }
});

// 新代码
await this.delay(this.delayTimeShort);
this.ctl.appendInfo("点击目标收藏夹：[" + targetFavName + "]");

// 确保在主对话框中
const mainDialog = document.querySelector('.vui_dialog--content.fav-modify-modal-content');
if (!mainDialog) {
    this.ctl.appendInfo('Error: 主对话框消失了', this.errorCode);
    return;
}

const favItems = mainDialog.querySelectorAll('.modify-fav-item');
let found = false;

for (const item of favItems) {
    const titleEl = item.querySelector('.modify-fav-item__title');
    if (titleEl && titleEl.textContent.trim() === targetFavName) {
        this.ctl.appendInfo(`找到目标收藏夹：[${targetFavName}]`);
        
        // 点击 radio 选中
        const radio = item.querySelector('input[type="radio"]');
        if (radio) {
            radio.click();
            found = true;
            break;
        }
    }
}

if (!found) {
    this.ctl.appendInfo(`Warning: 未找到收藏夹 [${targetFavName}]`, this.warnCode);
}
```

### 4.6 修改确定按钮点击
**位置：** `saveCollection()` 方法，约 941-943 行

```javascript
// 旧代码
await this.delay(this.delayTimeShort);
this.ctl.appendInfo("点击[确定]");
const panel = document.querySelector('.edit-video-modal');
const confirmBtn = panel.querySelector('.btn-content');
confirmBtn.click();

// 新代码
await this.delay(this.delayTimeShort);
this.ctl.appendInfo("点击[确定]");

const mainDialog = document.querySelector('.vui_dialog--content.fav-modify-modal-content');
if (!mainDialog) {
    this.ctl.appendInfo('Error: 主对话框消失了', this.errorCode);
    return;
}

// 查找蓝色确定按钮
const confirmBtn = mainDialog.querySelector('button.vui_button--blue');
if (!confirmBtn) {
    this.ctl.appendInfo('Error: 找不到确定按钮', this.errorCode);
    return;
}

confirmBtn.click();
await this.delay(this.delayTimeLong); // 等待复制完成

// 检查是否有成功提示
const toast = document.querySelector('.vui_toast');
if (toast && toast.textContent.includes('成功')) {
    this.ctl.appendInfo('✓ 复制成功');
} else {
    this.ctl.appendInfo('复制请求已发送，请检查结果');
}
```

---

## Phase 5: 分页适配

**目标：** 修复下一页按钮点击

### 5.1 修改下一页按钮点击
**位置：** `saveCollection()` 方法，约 947-950 行

```javascript
// 旧代码
const nextPageBtn = document.querySelector('.be-pager-next');
if(!nextPageBtn){
    this.ctl.appendInfo("Error!!! 找不到[下一页]按钮,判断为单页收藏夹.", this.errorCode);
    // ...
}
nextPageBtn.click();

// 新代码
const paginationEl = document.querySelector('.vui_pagenation');
if (!paginationEl) {
    this.ctl.appendInfo("判断为单页收藏夹", this.infoCode);
    return; // 结束
}

// 查找下一页按钮 - 方案 A：通过文本
const allButtons = paginationEl.querySelectorAll('button');
let nextBtn = null;
for (const btn of allButtons) {
    const text = btn.textContent.trim();
    if (text === '下一页' || text.includes('next') || text.includes('>')) {
        nextBtn = btn;
        break;
    }
}

// 方案 B：通过当前页码 +1
// 如果方案 A 找不到，尝试找到当前页码并点击下一个

if (nextBtn && !nextBtn.disabled) {
    this.ctl.appendInfo('点击[下一页]');
    nextBtn.click();
} else {
    this.ctl.appendInfo('已到最后一页或找不到下一页按钮', this.infoCode);
}
```

---

## Phase 6: 错误处理与日志优化

**目标：** 提升脚本健壮性和可调试性

### 6.1 添加版本检测日志

在脚本启动时添加：

```javascript
// 在脚本初始化时
console.log('[BiliBili Favs] 脚本版本: v0.6 - 新版适配');
console.log('[BiliBili Favs] 检测页面版本...');

const isNewVersion = !!document.querySelector('.favlist-aside');
console.log('[BiliBili Favs] 页面版本:', isNewVersion ? '新版 (VUI)' : '未知版本');

if (!isNewVersion) {
    console.warn('[BiliBili Favs] 警告：页面结构可能不受支持');
}
```

### 6.2 添加元素等待辅助函数

```javascript
// 在类中添加辅助方法
async waitForElement(selector, timeout = 5000, parent = document) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const el = parent.querySelector(selector);
        if (el) {
            return el;
        }
        await this.delay(100);
    }
    return null;
}

// 使用示例
const dialog = await this.waitForElement('.vui_dialog', 3000);
if (!dialog) {
    this.ctl.appendInfo('Error: 弹窗未出现', this.errorCode);
    return;
}
```

### 6.3 增强错误提示

```javascript
// 在关键步骤失败时提供详细错误
if (!element) {
    this.ctl.appendInfo(
        `Error: 找不到元素 [${selector}]。页面可能已更新，请联系脚本作者。`,
        this.errorCode
    );
    console.error('[BiliBili Favs] 元素缺失:', selector);
    return;
}
```

---

## Validation Checklist

每个 Phase 完成后执行：

### Phase 1 验证
- [ ] 浮动面板显示所有收藏夹名称
- [ ] 收藏夹数量正确（与侧边栏一致）
- [ ] 可以从下拉框选择收藏夹

### Phase 2 验证
- [ ] 点击"开始批量复制"后能正确进入批量模式
- [ ] 日志显示正确的源收藏夹名称
- [ ] 日志显示正确的总页数

### Phase 3 验证
- [ ] 能够全选当前页面的所有视频
- [ ] 点击"复制至"后弹出收藏夹选择窗口

### Phase 4 验证
- [ ] 能在弹窗中看到所有收藏夹列表
- [ ] 能选择已有收藏夹
- [ ] 能新建收藏夹
- [ ] 点击"确定"后成功复制

### Phase 5 验证
- [ ] 第一页完成后能自动跳转到第二页
- [ ] 多页收藏夹能完整复制
- [ ] 单页收藏夹不会报错

### 完整流程验证
- [ ] 从收藏夹 A 完整复制到收藏夹 B
- [ ] 从收藏夹 A 完整复制到新建收藏夹 C
- [ ] 处理 1000 个视频的大收藏夹（多页）
- [ ] 处理只有几个视频的小收藏夹（单页）

---

## Rollback Plan

如果新版适配失败：
1. 从备份恢复 `BilibiliFavsManage.js`
2. 提示用户等待修复
3. 在 GitHub 或油猴平台说明问题

---

## Notes

- **优先级：** Phase 4 的弹窗适配是最关键且最不确定的部分，需要先手动探测
- **延迟调整：** 新版页面可能需要更长的加载时间，建议测试时适当增加延迟
- **测试环境：** 在自己的 B 站账号上测试，避免影响重要收藏夹
- **日志输出：** 所有关键步骤都应输出到浮动面板，方便调试
