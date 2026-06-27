/**
 * 跨页面流程管理器
 * 处理从他人收藏夹复制视频到自己收藏夹的完整流程
 *
 * 流程概述（他人页面 → 自己页面）：
 *   1. 在他人页面：收集视频 BV 号 → 转换为 aid → 保存状态 → 跳转到自己页面
 *   2. 在自己页面：创建缺失的收藏夹 → 通过 API 添加视频 → 完成
 */

import { StateManager } from './StateManager.js';
import { PageDetector } from './PageDetector.js';
import { BilibiliAPI } from './BilibiliAPI.js';
import { delay } from '../utils/dom.js';
import { log, error, warn } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

export class CrossPageFlowManager {
  constructor(manager) {
    this.manager = manager;
  }

  /**
   * 开始跨页面流程：保存状态并跳转到自己页面
   * @param {Array<{source: string, target: string}>} tasks - 复制任务列表
   * @param {Array<number>} aids - 从源页面收集的视频 aid 数组
   * @returns {Promise<void>}
   */
  async startCrossPageFlow(tasks, aids) {
    log(`跨页面流程: 保存 ${aids.length} 个视频和 ${tasks.length} 个任务`);

    // 保存状态
    StateManager.saveState({
      phase: 'creating',
      tasks: tasks,
      aids: aids
    });

    // 跳转到自己的收藏夹页面
    const ownURL = PageDetector.getOwnFavListURL();
    if (!ownURL) {
      error('无法获取用户自己的收藏夹页面 URL');
      return;
    }

    log('========================================');
    log('即将跳转到自己的收藏夹页面');
    log('将自动创建缺失的收藏夹并添加视频');
    log('跳转倒计时: 3 秒...');
    log('========================================');

    await delay(3000);
    window.location.href = ownURL;
  }

  /**
   * 恢复跨页面流程（页面加载时调用）
   * @returns {Promise<boolean>} 是否处理了跨页面流程
   */
  async resumeFlow() {
    const state = StateManager.loadState();
    if (!state) {
      return false;
    }

    log('========================================');
    log('检测到跨页面流程状态');
    log(`阶段: ${state.phase}`);
    log(`待处理: ${state.tasks?.length || 0} 个任务, ${state.aids?.length || 0} 个视频`);
    log('========================================');

    if (state.phase === 'creating') {
      StateManager.clearState();
      await this.executeOnOwnPage(state);
      return true;
    }

    return false;
  }

  /**
   * 在自己页面执行：创建收藏夹 + 添加视频
   * @param {Object} state - 跨页面状态
   */
  async executeOnOwnPage(state) {
    const { tasks, aids } = state;

    if (!aids || aids.length === 0) {
      error('没有视频数据，无法继续');
      return;
    }

    // 1. 获取自己已有的收藏夹列表
    log('正在获取自己的收藏夹列表...');
    const ownFavs = await BilibiliAPI.getOwnFavoritesList();
    log(`自己的收藏夹: ${ownFavs.length} 个`);

    // 2. 收集需要创建的收藏夹名称
    const ownFavNames = ownFavs.map(f => f.title);
    const targetNames = [...new Set(tasks.map(t => t.target))];
    const missingNames = targetNames.filter(name => !ownFavNames.includes(name));

    // 3. 创建缺失的收藏夹
    const createdFavMap = new Map(); // name → id
    if (missingNames.length > 0) {
      log(`需要创建 ${missingNames.length} 个收藏夹: ${missingNames.join(', ')}`);

      for (const name of missingNames) {
        const favId = await BilibiliAPI.createFavoriteViaAPI(name);
        if (favId !== null) {
          createdFavMap.set(name, favId);
          log(`✓ 创建收藏夹 [${name}] 成功 (ID: ${favId})`);
        } else {
          error(`✗ 创建收藏夹 [${name}] 失败`);
        }
        await delay(CONFIG.DELAY.MIDDLE);
      }
    }

    // 4. 重新获取收藏夹列表（包含新创建的）
    const updatedFavs = await BilibiliAPI.getOwnFavoritesList();
    const favNameToId = new Map();
    for (const fav of updatedFavs) {
      favNameToId.set(fav.title, fav.id);
    }

    // 5. 为每个任务添加视频到目标收藏夹
    let totalSuccess = 0;
    let totalFailed = 0;

    for (let i = 0; i < tasks.length; i++) {
      const { source, target } = tasks[i];
      const targetFavId = favNameToId.get(target);

      if (!targetFavId) {
        error(`找不到目标收藏夹 [${target}]，跳过`);
        totalFailed += aids.length;
        continue;
      }

      log(`[${i + 1}/${tasks.length}] 添加 ${aids.length} 个视频到 [${target}] (ID: ${targetFavId})`);

      const result = await BilibiliAPI.addVideosToFavorites(aids, targetFavId);
      totalSuccess += result.success;
      totalFailed += result.failed;

      log(`  结果: 成功 ${result.success}, 失败 ${result.failed}`);

      if (i < tasks.length - 1) {
        await delay(CONFIG.DELAY.MIDDLE);
      }
    }

    // 6. 输出最终结果
    log('========================================');
    log(`跨页面流程完成！`);
    log(`视频: 成功 ${totalSuccess}, 失败 ${totalFailed}`);
    log(`收藏夹: 新建 ${createdFavMap.size} 个`);
    log('========================================');
  }
}
