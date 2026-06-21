# Changelog

All notable changes to this project will be documented in this file.

## [1.1] - 2026-06-22

### Added
- **跨页面自动创建收藏夹**：在别人的收藏夹页面复制时，能自动跳转到自己的页面创建收藏夹，然后返回继续复制
- **页面类型检测**：自动识别当前页面是自己还是他人的收藏夹（通过 UID 对比）
- **批量模式状态管理**：每页操作前自动检测并确保批量模式激活
- **状态持久化**：使用 localStorage 保存跨页面流程状态
- 新增 `PageDetector` 模块用于页面类型检测
- 新增 `Storage` 模块用于状态持久化

### Fixed
- **多页复制失败问题**：批量模式在第一页操作后退出，导致后续页面无法全选
- 在别人收藏夹页面无法创建新收藏夹的问题（通过跨页面流程解决）

### Changed
- 更新构建系统，修复 `rollup-plugin-terser` 依赖冲突
- 使用 `@rollup/plugin-terser` 替代旧版 terser 插件
- 模块化代码结构优化
- 更新 README 文档，添加详细的使用说明和开发指南

### Technical
- 扩展 `BilibiliAPI` 类：
  - `isBatchModeActive()` - 检查批量模式状态
  - `ensureBatchModeActive()` - 确保批量模式激活
  - `isFavoriteExistInDialog()` - 检查收藏夹是否存在
- 扩展 `FavoriteManager` 类：
  - `handleCrossPageCreate()` - 处理跨页面创建流程
  - `resumeCrossPageFlow()` - 恢复跨页面流程
  - `createFavoriteOnOwnPage()` - 在自己页面创建收藏夹
- 修改 `copyOnePage()` 方法以支持跨页面检测和批量模式检查

## [1.0] - 2026-06-22

### Added
- 适配新版 B 站页面（VUI 组件库）
- 完整更新所有 DOM 选择器
- 模块化代码结构（src/ 目录）
- Rollup 构建系统
- 详细的错误处理和日志输出

### Changed
- 所有选择器从旧版适配到新版
- 批量操作流程适配新版 UI
- 收藏夹对话框交互逻辑重写

### Technical
- 创建 `BilibiliAPI` 类封装所有 DOM 操作
- 创建 `FavoriteManager` 类处理业务逻辑
- 配置模块分离（`config/selectors.js`, `config/config.js`）
- 工具函数模块化（`utils/dom.js`, `utils/logger.js`）

## [0.6] - Previous release

### Added
- 适配 B 站 VUI 组件库
- 更新浮动面板尺寸为 600x500px

## [0.5] - 2024-02-15

### Added
- 自定义目标收藏夹功能
- UI 改进：可调整大小和移动位置

### Fixed
- 输出框自动滚动问题

## [0.1] - 2024-02-13

### Added
- 初始版本发布
- 批量复制收藏夹功能
- 自动创建同名收藏夹
- 可拖拽移动的浮动面板
- 单个收藏夹转移功能
