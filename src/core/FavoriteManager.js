/**
 * 收藏夹管理器
 * 负责批量复制收藏夹的核心逻辑
 */

import { BilibiliAPI } from './BilibiliAPI.js';
import { PageDetector } from './PageDetector.js';
import { delay } from '../utils/dom.js';
import { log, error, warn } from '../utils/logger.js';
import { Storage } from '../utils/storage.js';
import { CONFIG } from '../config/config.js';

export class FavoriteManager {
  constructor() {
    this.api = BilibiliAPI;
  }

  /**
   * 初始化：检测页面版本
   * @returns {boolean} 是否为支持的页面版本
   */
  initialize() {
    log('脚本版本:', CONFIG.SCRIPT.VERSION);
    return this.api.detectPageVersion();
  }

  /**
   * 获取所有收藏夹名称列表
   * @returns {Array<string>} 收藏夹名称数组
   */
  getAllFavoriteNames() {
    const favorites = this.api.getAllFavorites();
    const names = [];

    for (const fav of favorites) {
      const name = this.api.getFavoriteName(fav);
      if (name) {
        names.push(name);
      }
    }

    return names;
  }

  /**
   * 复制单个收藏夹
   * @param {string} sourceFavName - 源收藏夹名称
   * @param {string} targetFavName - 目标收藏夹名称
   * @returns {Promise<boolean>} 是否成功
   */
  async copyFavorite(sourceFavName, targetFavName) {
    log(`开始复制收藏夹 [${sourceFavName}] 到 [${targetFavName}]`);

    // 1. 点击源收藏夹
    const clickSuccess = await this.api.clickFavorite(sourceFavName);
    if (!clickSuccess) {
      return false;
    }

    await delay(CONFIG.DELAY.SHORT);

    // 2. 获取当前收藏夹信息
    const currentName = this.api.getCurrentFavoriteName();
    if (!currentName) {
      return false;
    }

    const totalPages = this.api.getTotalPages();
    log(`收藏夹 [${currentName}] 共 ${totalPages} 页`);

    // 3. 进入批量操作模式
    const batchSuccess = await this.api.clickBatchOperationButton();
    if (!batchSuccess) {
      error('无法进入批量操作模式');
      return false;
    }

    // 4. 逐页复制
    for (let page = 1; page <= totalPages; page++) {
      log(`正在处理第 ${page}/${totalPages} 页`);

      const pageSuccess = await this.copyOnePage(targetFavName);
      if (!pageSuccess) {
        error(`第 ${page} 页复制失败`);
        return false;
      }

      // 如果不是最后一页，点击下一页
      if (page < totalPages) {
        const nextSuccess = await this.api.clickNextPage();
        if (!nextSuccess) {
          warn(`无法跳转到第 ${page + 1} 页`);
          break;
        }
      }
    }

    log(`✓ 收藏夹 [${sourceFavName}] 复制完成`);
    return true;
  }

  /**
   * 复制当前页的视频
   * @param {string} targetFavName - 目标收藏夹名称
   * @returns {Promise<boolean>} 是否成功
   */
  async copyOnePage(targetFavName) {
    // 0. 确保批量模式激活
    const batchActive = await this.api.ensureBatchModeActive();
    if (!batchActive) {
      error('无法进入批量模式');
      return false;
    }

    // 1. 全选
    if (!this.api.clickSelectAll()) {
      return false;
    }
    await delay(CONFIG.DELAY.SHORT);

    // 2. 点击复制按钮
    if (!await this.api.clickCopyButton()) {
      return false;
    }

    // 3. 等待对话框
    const dialog = await this.api.waitForDialog();
    if (!dialog) {
      error('对话框未出现');
      return false;
    }

    // 4. 检查目标收藏夹是否存在
    const exists = this.api.isFavoriteExistInDialog(dialog, targetFavName);

    if (!exists) {
      // 检测页面类型
      const isOwnPage = PageDetector.isOwnPage();

      if (!isOwnPage) {
        log('检测到在别人的页面，需要跨页面创建收藏夹');
        // 关闭对话框
        const cancelBtn = dialog.querySelector('button:not(.vui_button--blue)');
        if (cancelBtn) {
          cancelBtn.click();
          await delay(CONFIG.DELAY.SHORT);
        }

        // 启动跨页面流程
        return await this.handleCrossPageCreate(targetFavName);
      }

      // 在自己页面，直接创建
      log(`目标收藏夹 [${targetFavName}] 不存在，尝试创建`);
      const createSuccess = await this.createNewFavorite(dialog, targetFavName);
      if (!createSuccess) {
        error('创建收藏夹失败');
        return false;
      }
    }

    // 5. 选择目标收藏夹
    await delay(CONFIG.DELAY.SHORT);
    if (!this.api.selectFavoriteInDialog(dialog, targetFavName)) {
      return false;
    }

    // 6. 点击确定
    await delay(CONFIG.DELAY.SHORT);
    return await this.api.clickConfirmButton(dialog);
  }

  /**
   * 创建新收藏夹
   * @param {Element} dialog - 对话框元素
   * @param {string} favName - 收藏夹名称
   * @returns {Promise<boolean>} 是否成功
   */
  async createNewFavorite(dialog, favName) {
    // 1. 点击新建收藏夹按钮
    if (!await this.api.clickCreateFavoriteButton(dialog)) {
      return false;
    }

    // 2. 输入收藏夹名称
    if (!await this.api.inputFavoriteName(favName)) {
      return false;
    }

    // 3. 点击创建按钮
    if (!await this.api.clickCreateButton()) {
      return false;
    }

    log(`✓ 创建收藏夹 [${favName}] 成功`);
    return true;
  }

  /**
   * 批量复制收藏夹
   * @param {Array<{source: string, target: string}>} copyList - 复制列表
   * @returns {Promise<void>}
   */
  async batchCopy(copyList) {
    log('开始批量复制，共', copyList.length, '个任务');

    for (let i = 0; i < copyList.length; i++) {
      const { source, target } = copyList[i];
      log(`\n[${i + 1}/${copyList.length}] ${source} → ${target}`);

      await this.copyFavorite(source, target);

      // 任务间延迟
      if (i < copyList.length - 1) {
        await delay(CONFIG.DELAY.MIDDLE);
      }
    }

    log('\n批量复制完成！');
  }

  /**
   * 处理跨页面创建收藏夹
   * @param {string} targetFavName - 目标收藏夹名称
   * @returns {Promise<boolean>}
   */
  async handleCrossPageCreate(targetFavName) {
    // 保存状态
    Storage.saveCrossPageState({
      action: 'create_favorite',
      targetFavName: targetFavName,
      returnURL: window.location.href,
      sourceFavName: this.api.getCurrentFavoriteName()
    });

    // 跳转到用户自己的页面
    const ownURL = PageDetector.getOwnFavListURL();
    if (!ownURL) {
      error('无法获取用户自己的收藏夹页面 URL');
      return false;
    }

    log(`即将跳转到自己的收藏夹页面以创建 [${targetFavName}]`);
    log('完成后将自动返回并继续复制');
    log('跳转倒计时: 3 秒...');

    await delay(3000);
    window.location.href = ownURL;

    return false; // 当前流程中断
  }

  /**
   * 恢复跨页面流程
   * @returns {Promise<void>}
   */
  async resumeCrossPageFlow() {
    const state = Storage.loadCrossPageState();
    if (!state) return;

    log('========================================');
    log('检测到跨页面流程状态，继续执行');
    log(`操作: ${state.action}`);
    log(`收藏夹: ${state.targetFavName}`);
    log('========================================');

    if (state.action === 'create_favorite') {
      // 在自己页面创建收藏夹
      const createSuccess = await this.createFavoriteOnOwnPage(state.targetFavName);

      if (createSuccess) {
        log(`✓ 收藏夹 [${state.targetFavName}] 创建成功`);
        log('返回原页面继续复制...');
        log('跳转倒计时: 3 秒...');

        await delay(3000);
        Storage.clearCrossPageState();
        window.location.href = state.returnURL;
      } else {
        error(`创建收藏夹 [${state.targetFavName}] 失败`);
        log('请手动创建收藏夹后重试');
        Storage.clearCrossPageState();
      }
    }
  }

  /**
   * 在自己页面创建收藏夹（通过批量模式对话框）
   * @param {string} favName - 收藏夹名称
   * @returns {Promise<boolean>}
   */
  async createFavoriteOnOwnPage(favName) {
    log('开始创建收藏夹流程...');

    // 1. 点击第一个收藏夹（确保有内容可操作）
    const allFavs = this.api.getAllFavorites();
    if (allFavs.length === 0) {
      error('找不到任何收藏夹');
      return false;
    }

    log('点击第一个收藏夹');
    allFavs[0].click();
    await delay(CONFIG.DELAY.MIDDLE);

    // 2. 进入批量操作模式
    log('进入批量操作模式');
    const batchSuccess = await this.api.clickBatchOperationButton();
    if (!batchSuccess) {
      error('无法进入批量模式');
      return false;
    }

    // 3. 点击复制按钮打开对话框
    log('点击复制按钮');
    if (!await this.api.clickCopyButton()) {
      return false;
    }

    // 4. 等待对话框
    const dialog = await this.api.waitForDialog();
    if (!dialog) {
      error('对话框未出现');
      return false;
    }

    // 5. 创建新收藏夹
    const createSuccess = await this.createNewFavorite(dialog, favName);
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
}
