# 代码重构说明

## 目录结构

```
bilibili-favs-manage/
├── src/                          # 源代码（模块化）
│   ├── core/                     # 核心业务逻辑
│   │   └── BilibiliAPI.js        # B 站 API 封装（DOM 选择器）
│   ├── ui/                       # UI 组件（待迁移）
│   ├── utils/                    # 工具函数
│   │   ├── dom.js                # DOM 操作辅助
│   │   └── logger.js             # 日志工具
│   ├── config/                   # 配置
│   │   ├── selectors.js          # 选择器配置（集中管理）
│   │   └── config.js             # 应用配置
│   └── main.js                   # 入口文件（待创建）
├── dist/                         # 构建输出
│   └── BilibiliFavsManage.user.js (构建后生成)
├── build/                        # 构建脚本（预留）
├── BilibiliFavsManage.js         # 原始单文件（保留）
├── package.json                  # 依赖管理
├── rollup.config.js              # 构建配置
└── README.md
```

## 已完成的模块

### 1. 配置模块
- **src/config/selectors.js** - 所有 DOM 选择器集中管理
- **src/config/config.js** - 应用配置（延迟、消息类型、面板配置等）

### 2. 工具模块
- **src/utils/dom.js** - DOM 操作辅助函数
  - `delay()` - 延迟函数
  - `waitForElement()` - 等待元素出现
  - `findButtonByText()` - 通过文本查找按钮
  - `elementExists()` - 检查元素是否存在
  - `getElementText()` - 获取元素文本

- **src/utils/logger.js** - 日志工具
  - `log()`, `error()`, `warn()`, `debug()`
  - `formatTime()` - 格式化时间

### 3. 核心业务模块
- **src/core/BilibiliAPI.js** - B 站页面 API 封装
  - 页面版本检测
  - 收藏夹列表操作
  - 批量操作流程
  - 对话框交互
  - 分页操作

## 待迁移的模块

### 4. UI 组件（需要从原文件迁移）
- `EventListeners` 类 - 事件监听器
- `CreateElemClass` 类 - 元素创建
- `CheckboxItem` 类 - Checkbox 项
- `ControlPanel` 类 - 控制面板
- 浮动面板相关逻辑

### 5. 批量复制核心逻辑（需要从原文件迁移）
- `BatchTransfer` 类 - 批量转移逻辑
- `transferOneFav()` - 单个收藏夹转移
- `saveCollection()` - 保存收藏

## 下一步计划

1. **迁移 UI 组件** - 将原文件中的 UI 相关类迁移到 `src/ui/` 目录
2. **迁移批量复制逻辑** - 将核心复制逻辑迁移到 `src/core/FavManager.js`
3. **创建入口文件** - `src/main.js` 组装所有模块
4. **安装依赖并构建** - `npm install && npm run build`
5. **测试构建产物** - 测试 `dist/BilibiliFavsManage.user.js`

## 优势

1. **选择器集中管理** - 未来改版只需修改 `selectors.js`
2. **业务逻辑和 DOM 操作分离** - 便于测试和维护
3. **代码复用性提高** - 工具函数可以在多处使用
4. **构建自动化** - 自动合并、添加 UserScript 元数据
5. **开发体验改善** - 模块化开发，清晰的职责划分

## 构建流程

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建生产版本
npm run build

# 输出文件：dist/BilibiliFavsManage.user.js
```
