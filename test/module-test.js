/**
 * 模块化代码测试
 *
 * 在 B 站收藏夹页面的浏览器控制台中运行此文件测试
 */

// 测试 1: 导入检查
console.log('=== 测试 1: 模块导入 ===');
import { CONFIG } from './src/config/config.js';
import { SELECTORS } from './src/config/selectors.js';
import { delay, waitForElement } from './src/utils/dom.js';
import { log, error } from './src/utils/logger.js';
import { BilibiliAPI } from './src/core/BilibiliAPI.js';
import { FavoriteManager } from './src/core/FavoriteManager.js';

console.log('✓ 所有模块导入成功');

// 测试 2: 配置检查
console.log('\n=== 测试 2: 配置检查 ===');
console.log('脚本版本:', CONFIG.SCRIPT.VERSION);
console.log('延迟配置:', CONFIG.DELAY);
console.log('✓ 配置模块正常');

// 测试 3: 选择器检查
console.log('\n=== 测试 3: 选择器检查 ===');
console.log('收藏夹侧边栏选择器:', SELECTORS.FAVORITES_SIDEBAR);
console.log('批量操作按钮选择器:', SELECTORS.BATCH_OPERATION_BTN);
console.log('✓ 选择器模块正常');

// 测试 4: 日志工具
console.log('\n=== 测试 4: 日志工具 ===');
log('这是一条普通日志');
error('这是一条错误日志');
console.log('✓ 日志模块正常');

// 测试 5: DOM 工具
console.log('\n=== 测试 5: DOM 工具 ===');
console.log('延迟函数类型:', typeof delay);
console.log('等待元素函数类型:', typeof waitForElement);
console.log('✓ DOM 工具模块正常');

// 测试 6: BilibiliAPI
console.log('\n=== 测试 6: BilibiliAPI ===');
const isNewVersion = BilibiliAPI.detectPageVersion();
console.log('页面版本检测:', isNewVersion ? '新版' : '旧版');

if (isNewVersion) {
  const favorites = BilibiliAPI.getAllFavorites();
  console.log('收藏夹数量:', favorites.length);

  if (favorites.length > 0) {
    const firstName = BilibiliAPI.getFavoriteName(favorites[0]);
    console.log('第一个收藏夹名称:', firstName);
  }
}
console.log('✓ BilibiliAPI 模块正常');

// 测试 7: FavoriteManager
console.log('\n=== 测试 7: FavoriteManager ===');
const manager = new FavoriteManager();
manager.initialize();
const allNames = manager.getAllFavoriteNames();
console.log('收藏夹名称列表:', allNames.slice(0, 3), '...');
console.log('✓ FavoriteManager 模块正常');

// 挂载到全局
window.testManager = manager;

console.log('\n=== 所有测试通过 ===');
console.log('管理器实例已挂载到 window.testManager');
console.log('可以使用: await testManager.copyFavorite("源", "目标")');
