/**
 * BiliBili 收藏夹批量管理工具 - 入口文件
 * Version: 2.0
 */

import { FavoriteManager } from './core/FavoriteManager.js';
import { PageDetector } from './core/PageDetector.js';
import { FloatingPanel } from './ui/FloatingPanel.js';
import { log, setLoggerPanel } from './utils/logger.js';

// 等待页面加载完成
function waitForPageLoad() {
  return new Promise(resolve => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve);
    }
  });
}

// 主函数
async function main() {
  await waitForPageLoad();

  log('脚本启动 v2.0');

  // 创建管理器实例
  const manager = new FavoriteManager();

  // 初始化并检测页面版本
  if (!manager.initialize()) {
    log('页面版本不支持，脚本退出');
    return;
  }

  // 检测页面类型
  const isOwnPage = PageDetector.isOwnPage();
  log('页面类型:', isOwnPage ? '我的收藏夹' : '他人的收藏夹');

  // 检查是否需要恢复跨页面流程
  const handledCrossPage = await manager.crossPageFlow.resumeFlow();
  if (handledCrossPage) {
    // 跨页面流程已处理，不再显示面板
    log('跨页面流程执行完毕');
    return;
  }

  // 获取所有收藏夹名称
  const favorites = manager.getAllFavoriteNames();
  log('检测到收藏夹:', favorites.length, '个');

  if (favorites.length > 0) {
    log('收藏夹列表:', favorites.slice(0, 5).join(', '), favorites.length > 5 ? '...' : '');
  }

  // 初始化浮动面板 UI
  const panel = new FloatingPanel(manager);

  // 设置日志面板，让 panel.init() 中的日志也能输出到面板
  setLoggerPanel(panel);

  panel.init();

  // 将管理器和面板实例挂载到全局，方便控制台调用
  window.BiliFavManager = manager;
  window.BiliFavPanel = panel;

  log('脚本已就绪！浮动面板已显示');
  log('控制台使用方法:');
  log('1. 复制单个收藏夹: await BiliFavManager.copyFavorite("源收藏夹", "目标收藏夹")');
  log('2. 批量复制: await BiliFavManager.batchCopy([{source: "源1", target: "目标1"}, ...])');
  log('3. 获取收藏夹列表: BiliFavManager.getAllFavoriteNames()');
}

// 启动脚本
main().catch(err => {
  console.error('[BiliBili Favs] 脚本启动失败:', err);
});
