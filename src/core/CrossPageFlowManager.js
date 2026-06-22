/**
 * 跨页面流程管理器
 * 处理跨页面创建收藏夹的完整流程
 */

import { StateManager } from './StateManager.js';
import { PageDetector } from './PageDetector.js';
import { BilibiliAPI } from './BilibiliAPI.js';
import { delay } from '../utils/dom.js';
import { log, error } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

export class CrossPageFlowManager {
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * 开始跨页面流程：保存状态并跳转到自己页面
   * @param {Array<{source: string, target: string}>} tasks - 复制任务列表
   * @returns {Promise<void>}
   */
  async startCrossPageFlow(tasks) {
    // 获取需要创建的收藏夹列表
    const currentFavs = this.manager.getAllFavoriteNames();
    const missingFavs = tasks
      .map(t => t.target)
      .filter((name, index, self) => self.indexOf(name) === index) // 去重
      .filter(name => !currentFavs.includes(name)); // 过滤已存在的

    if (missingFavs.length === 0) {
      log('所有目标收藏夹均已存在，无需跨页面创建');
      return;
    }

    log(`检测到 ${missingFavs.length} 个收藏夹需要创建:`, missingFavs.join(', '));

    // 保存状态
    StateManager.saveState({
      phase: 'creating',
      returnURL: window.location.href,
      tasks: tasks,
      missingFavs: missingFavs
    });

    // 跳转到自己的收藏夹页面
    const ownURL = PageDetector.getOwnFavListURL();
    if (!ownURL) {
      error('无法获取用户自己的收藏夹页面 URL');
      return;
    }

    log('========================================');
    log('即将跳转到自己的收藏夹页面批量创建收藏夹');
    log('完成后将自动返回并继续复制');
    log('跳转倒计时: 3 秒...');
    log('========================================');

    await delay(3000);
    window.location.href = ownURL;
  }

  /**
   * 在自己页面批量创建收藏夹
   * @param {Array<string>} favNames - 收藏夹名称列表
   * @returns {Promise<boolean>}
   */
  async batchCreateFavorites(favNames) {
    log('========================================');
    log('开始批量创建收藏夹');
    log(`共 ${favNames.length} 个: ${favNames.join(', ')}`);
    log('========================================');

    for (let i = 0; i < favNames.length; i++) {
      const favName = favNames[i];
      log(`[${i + 1}/${favNames.length}] 创建收藏夹: ${favName}`);

      const success = await this.createSingleFavorite(favName);
      if (!success) {
        error(`创建收藏夹 [${favName}] 失败`);
        return false;
      }

      // 创建间隔延迟
      if (i < favNames.length - 1) {
        await delay(CONFIG.DELAY.MIDDLE);
      }
    }

    log('✓ 批量创建完成!');
    return true;
  }

  /**
   * 创建单个收藏夹（通过批量模式对话框）
   * @param {string} favName - 收藏夹名称
   * @returns {Promise<boolean>}
   */
  async createSingleFavorite(favName) {
    // 1. 点击第一个收藏夹（确保有内容可操作）
    const allFavs = BilibiliAPI.getAllFavorites();
    if (allFavs.length === 0) {
      error('找不到任何收藏夹');
      return false;
    }

    allFavs[0].click();
    await delay(CONFIG.DELAY.MIDDLE);

    // 2. 进入批量操作模式
    const batchSuccess = await BilibiliAPI.clickBatchOperationButton();
    if (!batchSuccess) {
      error('无法进入批量模式');
      return false;
    }

    // 3. 点击复制按钮打开对话框
    if (!await BilibiliAPI.clickCopyButton()) {
      return false;
    }

    // 4. 等待对话框
    const dialog = await BilibiliAPI.waitForDialog();
    if (!dialog) {
      error('对话框未出现');
      return false;
    }

    // 5. 创建新收藏夹
    const createSuccess = await this.manager.createNewFavorite(dialog, favName);
    if (!createSuccess) {
      // 关闭对话框
      const cancelBtn = dialog.querySelector('button:not(.vui_button--blue)');
      if (cancelBtn) cancelBtn.click();
      return false;
    }

    // 6. 关闭对话框
    await delay(CONFIG.DELAY.SHORT);
    const cancelBtn = dialog.querySelector('button:not(.vui_button--blue)');
    if (cancelBtn) {
      cancelBtn.click();
      await delay(CONFIG.DELAY.SHORT);
    }

    return true;
  }

  /**
   * 恢复跨页面流程（页面加载时调用）
   * @returns {Promise<boolean>} 是否处理了跨页面流程
   */
  async resumeFlow() {
    const state = StateManager.loadState();
    if (!state) {
      return false; // 没有跨页面状态
    }

    log('========================================');
    log('检测到跨页面流程状态');
    log(`阶段: ${state.phase}`);
    log('========================================');

    if (state.phase === 'creating') {
      // 在自己页面，执行批量创建
      const success = await this.batchCreateFavorites(state.missingFavs);

      if (success) {
        // 更新状态：准备返回复制
        StateManager.saveState({
          ...state,
          phase: 'copying'
        });

        log('========================================');
        log('收藏夹创建完成，返回原页面继续复制');
        log('跳转倒计时: 3 秒...');
        log('========================================');

        await delay(3000);
        window.location.href = state.returnURL;
      } else {
        error('收藏夹创建失败，请手动创建后重试');
        StateManager.clearState();
      }

      return true;
    } else if (state.phase === 'copying') {
      // 回到原页面，继续复制流程
      log('========================================');
      log('已返回原页面，继续复制流程');
      log('========================================');

      // 清除状态
      StateManager.clearState();

      // 自动触发复制流程
      await this.manager.batchCopy(state.tasks);

      return true;
    }

    return false;
  }
}
