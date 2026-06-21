# Bilibili 收藏夹批量管理工具 v1.0

批量复制 B 站收藏夹的油猴脚本，已适配新版 VUI 组件库。

## 功能特性

- ✅ 适配新版 B 站收藏夹页面（VUI 组件库）
- ✅ 批量复制收藏夹
- ✅ 自动处理分页
- ✅ 支持创建新收藏夹
- ✅ 模块化代码结构

## 项目结构

```
bilibili-favs-manage/
├── src/                      # 源代码（模块化）
│   ├── core/                 # 核心业务逻辑
│   │   ├── BilibiliAPI.js    # B 站页面 API 封装
│   │   └── FavoriteManager.js # 收藏夹管理器
│   ├── ui/                   # UI 组件（待完善）
│   ├── utils/                # 工具函数
│   │   ├── dom.js            # DOM 操作工具
│   │   └── logger.js         # 日志工具
│   ├── config/               # 配置
│   │   ├── selectors.js      # DOM 选择器配置
│   │   └── config.js         # 应用配置
│   └── main.js               # 入口文件
├── dist/                     # 构建输出
│   └── BilibiliFavsManage.user.js
├── test/                     # 测试文件
│   └── module-test.js
├── BilibiliFavsManage.js     # 原始单文件版本（v1.0）
├── package.json
├── rollup.config.js
└── README.md
```

## 快速开始

### 方式 1: 使用原始单文件版本（推荐）

直接使用 `BilibiliFavsManage.js`，这是完整的单文件版本，包含浮动面板 UI。

1. 复制 `BilibiliFavsManage.js` 的内容
2. 在 B 站收藏夹页面打开浏览器控制台
3. 粘贴并运行

### 方式 2: 使用模块化版本（开发中）

模块化版本目前是核心功能的重构，UI 组件尚未完全迁移。

#### 安装依赖

```bash
npm install
```

#### 构建

```bash
# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build
```

构建输出：`dist/BilibiliFavsManage.user.js`

## 使用方法

### 原始版本（带 UI）

脚本运行后会在页面显示浮动面板：

1. 在"源收藏夹"下拉框选择要复制的收藏夹
2. 在"目标收藏夹"下拉框选择或输入目标收藏夹名称
3. 点击"开始批量复制"按钮
4. 查看输出面板的日志

### 模块化版本（控制台 API）

脚本会将管理器实例挂载到 `window.BiliFavManager`：

```javascript
// 获取所有收藏夹名称
const favorites = BiliFavManager.getAllFavoriteNames();
console.log(favorites);

// 复制单个收藏夹
await BiliFavManager.copyFavorite("源收藏夹", "目标收藏夹");

// 批量复制
await BiliFavManager.batchCopy([
  { source: "源收藏夹1", target: "目标收藏夹1" },
  { source: "源收藏夹2", target: "目标收藏夹2" }
]);
```

## 已知问题

### ⚠️ 别人收藏夹页面无法新建收藏夹

在复制别人的收藏夹时，B 站的"复制至"对话框中**没有"新建收藏夹"选项**。这是 B 站的权限限制。

**解决方案：**
1. 先在自己的收藏夹页面手动创建好目标收藏夹
2. 再返回别人的页面执行复制

**未来优化方向：**
- 自动检测缺失的收藏夹
- 自动跳转到自己的页面创建
- 再返回执行复制

详见：`.trellis/tasks/06-22-bilibili-favs-adapt/research/BUG-FOUND-OTHER-USER-PAGE.md`

## 开发说明

### 代码结构

- **配置层** (`config/`) - 所有选择器和配置集中管理
- **工具层** (`utils/`) - 可复用的工具函数
- **核心层** (`core/`) - 业务逻辑封装
- **UI 层** (`ui/`) - 用户界面组件（待迁移）

### 添加新功能

1. 如果是新的 DOM 操作，在 `BilibiliAPI.js` 中添加方法
2. 如果是新的业务逻辑，在 `FavoriteManager.js` 中添加
3. 如果需要新的选择器，在 `config/selectors.js` 中定义

### 测试

```bash
# 在浏览器控制台运行测试（需要在 B 站收藏夹页面）
# 注意：需要将 test/module-test.js 中的 import 语句改为实际路径
```

## 版本历史

### v1.0 (2026-06-22)
- ✅ 适配新版 B 站收藏夹页面（VUI 组件库）
- ✅ 更新所有 DOM 选择器（20+ 个）
- ✅ 优化浮动面板尺寸（600x500px）
- ✅ 代码重构：模块化结构（方案 A）

### v0.6 (2026-06-22)
- 初始适配新版页面

## 技术栈

- **构建工具**: Rollup
- **代码规范**: ES6 Modules
- **目标格式**: IIFE (Immediately Invoked Function Expression)

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关文档

- [重构说明](REFACTOR.md) - 详细的重构计划和进度
- [设计文档](.trellis/tasks/06-22-bilibili-favs-adapt/design.md) - 选择器映射表
- [实施计划](.trellis/tasks/06-22-bilibili-favs-adapt/implement.md) - 分阶段实施计划

## License

MIT
