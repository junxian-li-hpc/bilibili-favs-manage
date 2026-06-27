# Bilibili 收藏夹批量管理工具

一个用于批量复制 B 站收藏夹的油猴脚本，支持跨页面自动创建收藏夹和多页批量复制。

## 特性

- ✅ 适配新版 B 站页面（VUI 组件库）
- ✅ 支持跨页面自动创建收藏夹（在别人的收藏夹页面也能复制到新收藏夹）
- ✅ 多页收藏夹批量复制（自动处理分页）
- ✅ 批量模式状态自动恢复
- ✅ 模块化代码结构，易于维护

## 版本历史

### v1.1 (2026-06-22)
- 🆕 **跨页面流程**：在别人的收藏夹页面也能复制到新建的收藏夹
- 🆕 **批量模式管理**：自动确保批量模式激活，解决多页复制失败问题
- 🆕 **页面类型检测**：自动识别当前页面是自己还是他人的收藏夹
- 🔧 **模块化重构**：采用 ES6 模块 + Rollup 构建

### v1.0 (2026-06-22)
- ✅ 适配新版 B 站页面（VUI 组件库）
- ✅ 更新所有 DOM 选择器
- ✅ 完善错误处理和日志输出

### v0.5 (2024-02-15)
- 自定义目标收藏夹功能

### v0.1 (2024-02-13)
- 初始版本

## 安装

### 方式 1：从 Greasyfork 安装（推荐）

[点击这里安装](https://greasyfork.org/zh-CN/scripts/487232-bilibili-%E6%94%B6%E8%97%8F%E5%A4%B9%E6%89%B9%E9%87%8F%E5%A4%8D%E5%88%B6)

### 方式 2：从构建产物安装

1. 确保已安装油猴（Tampermonkey）扩展
2. 下载 `dist/BilibiliFavsManage.user.js`
3. 在油猴管理界面点击"导入"，选择该文件

### 方式 3：从源码构建

```bash
# 安装依赖
npm install

# 构建
npm run build

# 产物位于 dist/BilibiliFavsManage.user.js
```

## 使用方法

### 控制台 API 模式

1. 打开 B 站收藏夹页面
2. 按 F12 打开控制台
3. 使用以下命令：

```javascript
// 复制单个收藏夹
await BiliFavManager.copyFavorite("源收藏夹名称", "目标收藏夹名称")

// 批量复制
await BiliFavManager.batchCopy([
  {source: "源收藏夹1", target: "目标收藏夹1"},
  {source: "源收藏夹2", target: "目标收藏夹2"}
])

// 获取所有收藏夹列表
BiliFavManager.getAllFavoriteNames()
```

### 跨页面复制流程

当你在**别人的收藏夹页面**复制到一个**不存在的收藏夹**时：

1. 脚本检测到需要创建新收藏夹
2. 自动保存当前状态
3. 跳转到你自己的收藏夹页面
4. 自动创建目标收藏夹
5. 自动返回原页面
6. 继续复制流程

**注意：** 跨页面流程会自动执行，请耐心等待页面跳转完成。

## 项目结构

```
bilibili-favs-manage/
├── src/                          # 源代码
│   ├── main.js                   # 入口文件
│   ├── config/                   # 配置
│   │   ├── selectors.js          # DOM 选择器
│   │   └── config.js             # 全局配置
│   ├── core/                     # 核心逻辑
│   │   ├── BilibiliAPI.js        # B 站页面 API 封装
│   │   ├── FavoriteManager.js    # 收藏夹管理器
│   │   └── PageDetector.js       # 页面类型检测
│   ├── utils/                    # 工具函数
│   │   ├── dom.js                # DOM 操作
│   │   ├── logger.js             # 日志工具
│   │   └── storage.js            # 状态持久化
│   └── ui/                       # UI 组件（待完善）
├── dist/                         # 构建产物
│   └── BilibiliFavsManage.user.js
├── rollup.config.js              # 打包配置
└── package.json                  # 项目配置
```

## 已知限制

1. **权限限制**：在别人的收藏夹页面，无法直接创建新收藏夹（B 站平台限制）
   - ✅ 已通过跨页面流程解决

2. **批量模式状态**：多页复制时批量模式可能退出
   - ✅ 已通过自动检测和重新进入解决

3. **操作延迟**：为避免触发反爬虫机制，操作间有延迟
   - 大收藏夹（1000+ 视频）可能需要数分钟

## 开发指南

### 环境要求

- Node.js 14+
- npm 6+

### 开发流程

```bash
# 1. 克隆仓库
git clone https://github.com/junxian-li-hpc/bilibili-favs-manage.git
cd bilibili-favs-manage

# 2. 安装依赖
npm install

# 3. 开发构建（监听模式）
npm run dev

# 4. 生产构建
npm run build

# 5. 代码检查
npm run lint
```

### 架构说明

- **BilibiliAPI**: 封装所有与 B 站页面交互的底层操作
- **FavoriteManager**: 业务逻辑层，处理复制流程
- **PageDetector**: 检测页面类型（自己 vs 他人）
- **Storage**: 跨页面状态持久化（localStorage）

### 添加新功能

1. 在对应模块添加方法（如 `BilibiliAPI.js` 或 `FavoriteManager.js`）
2. 更新 `main.js` 集成新功能
3. 执行 `npm run build` 重新构建
4. 在浏览器中测试

## 常见问题

### Q: 为什么在别人页面复制时会跳转？
A: 这是为了绕过 B 站的权限限制。只有在自己的页面才能创建新收藏夹。

### Q: 脚本没有启动怎么办？
A: 检查控制台是否有错误信息，确认页面 URL 匹配 `https://space.bilibili.com/*/favlist*`

### Q: 复制失败怎么办？
A: 检查控制台日志，常见原因：
- 网络问题
- 页面元素未加载完成
- 批量模式未激活

## 联系方式

- QQ 群: 524764959
- Email: ljx.1024@outlook.com
- GitHub: https://github.com/junxian-li-hpc/bilibili-favs-manage

## 许可证

MIT License
