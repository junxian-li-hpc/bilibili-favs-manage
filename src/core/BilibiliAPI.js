/**
 * B 站收藏夹页面 API 封装
 * 封装所有与 B 站页面 DOM 交互的操作
 */

import { SELECTORS, BUTTON_TEXTS } from '../config/selectors.js';
import { delay, waitForElement, findButtonByText, elementExists, getElementText } from '../utils/dom.js';
import { log, error, warn } from '../utils/logger.js';
import { CONFIG } from '../config/config.js';

export class BilibiliAPI {
  /**
   * 检测页面版本
   * @returns {boolean} 是否为新版页面
   */
  static detectPageVersion() {
    const isNewVersion = elementExists(SELECTORS.FAVORITES_SIDEBAR);
    log('页面版本:', isNewVersion ? '新版 (VUI)' : '未知版本');

    if (!isNewVersion) {
      warn('警告：页面结构可能不受支持，脚本可能无法正常工作');
    }

    return isNewVersion;
  }

  /**
   * 获取所有收藏夹项
   * @returns {Array<Element>} 收藏夹项列表
   */
  static getAllFavorites() {
    // 调用 getCreatedFavorites() 进行过滤
    return this.getCreatedFavorites();
  }

  /**
   * 获取"我创建的收藏夹"分组中的收藏夹项（过滤"我追的"和"其他收藏"）
   * @returns {Array<Element>} 收藏夹项数组
   */
  static getCreatedFavorites() {
    const sidebar = document.querySelector(SELECTORS.FAVORITES_SIDEBAR);
    if (!sidebar) {
      error('找不到收藏夹侧边栏容器');
      return [];
    }

    // 获取所有收藏夹项
    const allItems = Array.from(sidebar.querySelectorAll(SELECTORS.FAVORITES_ITEM));
    const favorites = [];
    let inCreatedSection = false;

    // 遍历侧边栏的所有子元素（包括文本节点）
    const allChildren = Array.from(sidebar.children);

    for (const child of allChildren) {
      const text = child.textContent.trim();

      // 检测分组标题（可能是任何元素，通过文本内容判断）
      if (text === '我创建的收藏夹') {
        inCreatedSection = true;
        log('检测到"我创建的收藏夹"分组');
        continue;
      }

      if (text === '我追的合集/收藏夹' || text === '其他收藏') {
        inCreatedSection = false;
        log(`检测到分隔标记: ${text}，停止收集`);
        continue;
      }

      // 如果是收藏夹项，且在"我创建的"分组中，则收集
      if (inCreatedSection && child.classList.contains('vui_sidebar-item')) {
        favorites.push(child);
      }
    }

    // 如果没有找到"我创建的收藏夹"标记，采用降级策略
    if (!inCreatedSection && favorites.length === 0) {
      warn('未找到"我创建的收藏夹"分组标记，使用降级策略');
      warn('将返回所有收藏夹项（包含"我追的合集/收藏夹"）');
      // 降级：返回所有收藏夹项
      return allItems;
    }

    // 延迟日志：只有在 logger 已初始化时才输出
    if (typeof log === 'function') {
      setTimeout(() => {
        log('过滤结果: 总数', allItems.length, '→ 我创建的', favorites.length);
      }, 0);
    }

    return favorites;
  }

  /**
   * 从收藏夹项中提取名称
   * @param {Element} favItem - 收藏夹项元素
   * @returns {string} 收藏夹名称
   */
  static getFavoriteName(favItem) {
    const titleEl = favItem.querySelector(SELECTORS.FAVORITES_ITEM_TITLE);
    return titleEl ? titleEl.textContent.trim() : '';
  }

  /**
   * 获取当前收藏夹名称
   * @returns {string|null} 当前收藏夹名称，如果找不到则返回 null
   */
  static getCurrentFavoriteName() {
    const titleEl = document.querySelector(SELECTORS.CURRENT_FAV_TITLE);
    if (!titleEl) {
      error('无法获取当前收藏夹名称');
      return null;
    }
    return titleEl.textContent.trim();
  }

  /**
   * 获取总页数
   * @returns {number} 总页数
   */
  static getTotalPages() {
    const pageInfoText = document.querySelector(SELECTORS.PAGINATION)?.textContent || '';
    const match = pageInfoText.match(/共\s*(\d+)\s*页/);
    return match ? parseInt(match[1]) : 1;
  }

  /**
   * 点击批量操作按钮
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickBatchOperationButton() {
    const button = document.querySelector(SELECTORS.BATCH_OPERATION_BTN);
    if (!button || button.textContent.trim() !== BUTTON_TEXTS.BATCH_OPERATION) {
      error('找不到批量操作按钮或按钮文本不匹配');
      return false;
    }

    log('点击批量操作按钮');
    button.click();
    await delay(CONFIG.DELAY.SHORT);
    return true;
  }

  /**
   * 点击全选按钮
   * @returns {boolean} 是否成功
   */
  static clickSelectAll() {
    const checkbox = document.querySelector(SELECTORS.SELECT_ALL_CHECKBOX);
    if (!checkbox) {
      error('找不到全选按钮');
      return false;
    }

    log('点击全选');
    checkbox.click();
    return true;
  }

  /**
   * 点击复制按钮
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickCopyButton() {
    const copyBtn = findButtonByText(BUTTON_TEXTS.COPY_TO);
    if (!copyBtn) {
      error('找不到复制至按钮');
      return false;
    }

    log('点击复制至按钮');
    copyBtn.click();
    await delay(CONFIG.DELAY.SHORT);
    return true;
  }

  /**
   * 等待对话框出现
   * @returns {Promise<Element|null>} 对话框元素
   */
  static async waitForDialog() {
    return await waitForElement(SELECTORS.DIALOG_CONTAINER, 3000);
  }

  /**
   * 获取对话框中的收藏夹列表
   * @param {Element} dialog - 对话框元素
   * @returns {Array<{element: Element, name: string}>} 收藏夹列表
   */
  static getFavoriteListInDialog(dialog) {
    const items = dialog.querySelectorAll(SELECTORS.FAV_ITEM);
    return Array.from(items).map(item => ({
      element: item,
      name: getElementText(SELECTORS.FAV_ITEM_TITLE, item)
    }));
  }

  /**
   * 在对话框中选择收藏夹
   * @param {Element} dialog - 对话框元素
   * @param {string} favName - 收藏夹名称
   * @returns {boolean} 是否成功
   */
  static selectFavoriteInDialog(dialog, favName) {
    const favList = this.getFavoriteListInDialog(dialog);

    for (const fav of favList) {
      if (fav.name === favName) {
        log(`找到目标收藏夹：[${favName}]`);
        const radio = fav.element.querySelector(SELECTORS.FAV_RADIO_INPUT);
        if (radio) {
          radio.click();
          return true;
        }
      }
    }

    warn(`未找到收藏夹 [${favName}]`);
    return false;
  }

  /**
   * 点击新建收藏夹按钮
   * @param {Element} dialog - 对话框元素
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickCreateFavoriteButton(dialog) {
    const createBtn = dialog.querySelector(SELECTORS.CREATE_FAV_BUTTON);
    if (!createBtn) {
      error('找不到新建收藏夹按钮');
      return false;
    }

    log('点击新建收藏夹按钮');
    createBtn.click();
    await delay(CONFIG.DELAY.MIDDLE);
    return true;
  }

  /**
   * 输入收藏夹名称（完整的事件链）
   * @param {string} name - 收藏夹名称
   * @returns {Promise<boolean>} 是否成功
   */
  static async inputFavoriteName(name) {
    const nameInput = document.querySelector(SELECTORS.CREATE_FAV_NAME_INPUT);
    if (!nameInput) {
      error('找不到名称输入框');
      return false;
    }

    log('输入新收藏夹名称:', name);

    // 模拟真实输入
    nameInput.focus();
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('focus', { bubbles: true }));

    for (let i = 0; i < name.length; i++) {
      const char = name[i];
      nameInput.value += char;
      nameInput.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      await delay(CONFIG.DELAY.INPUT_CHAR);
    }

    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    nameInput.dispatchEvent(new Event('blur', { bubbles: true }));

    await delay(CONFIG.DELAY.SHORT);
    return true;
  }

  /**
   * 点击创建按钮
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickCreateButton() {
    const createConfirmBtn = findButtonByText(BUTTON_TEXTS.CREATE);

    if (!createConfirmBtn || createConfirmBtn.disabled) {
      error('创建按钮不可用');
      return false;
    }

    log('点击创建按钮');
    createConfirmBtn.click();
    await delay(CONFIG.DELAY.MIDDLE);
    return true;
  }

  /**
   * 点击确定按钮
   * @param {Element} dialog - 对话框元素
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickConfirmButton(dialog) {
    const confirmBtn = dialog.querySelector(SELECTORS.CONFIRM_BUTTON);
    if (!confirmBtn) {
      error('找不到确定按钮');
      return false;
    }

    log('点击确定');
    confirmBtn.click();
    await delay(CONFIG.DELAY.LONG);

    // 检查是否有成功提示
    const toast = document.querySelector(SELECTORS.TOAST);
    if (toast && toast.textContent.includes(BUTTON_TEXTS.SUCCESS)) {
      log('✓ 复制成功');
    } else {
      log('复制请求已发送，请检查结果');
    }

    return true;
  }

  /**
   * 点击下一页按钮
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickNextPage() {
    const paginationEl = document.querySelector(SELECTORS.PAGINATION);
    if (!paginationEl) {
      log('判断为单页收藏夹');
      return false;
    }

    const allButtons = paginationEl.querySelectorAll('button');
    let nextBtn = null;

    for (const btn of allButtons) {
      const text = btn.textContent.trim();
      if (SELECTORS.NEXT_PAGE_TEXT.some(t => text === t || text.includes(t))) {
        nextBtn = btn;
        break;
      }
    }

    if (nextBtn && !nextBtn.disabled) {
      log('点击下一页');
      nextBtn.click();
      await delay(CONFIG.DELAY.MIDDLE);
      return true;
    } else {
      log('已到最后一页或找不到下一页按钮');
      return false;
    }
  }

  /**
   * 点击指定的收藏夹
   * @param {string} favName - 收藏夹名称
   * @returns {Promise<boolean>} 是否成功
   */
  static async clickFavorite(favName) {
    const allFavs = this.getAllFavorites();

    for (const favItem of allFavs) {
      const name = this.getFavoriteName(favItem);
      if (name === favName) {
        log(`点击收藏夹：[${favName}]`);
        favItem.click();
        await delay(CONFIG.DELAY.SHORT);
        return true;
      }
    }

    error(`找不到收藏夹：[${favName}]`);
    return false;
  }

  /**
   * 检查批量模式是否激活
   * @returns {boolean}
   */
  static isBatchModeActive() {
    const checkbox = document.querySelector(SELECTORS.SELECT_ALL_CHECKBOX);
    return !!checkbox;
  }

  /**
   * 确保批量模式激活
   * @returns {Promise<boolean>}
   */
  static async ensureBatchModeActive() {
    if (this.isBatchModeActive()) {
      log('批量模式已激活');
      return true;
    }

    log('批量模式已退出，重新进入');
    return await this.clickBatchOperationButton();
  }

  /**
   * 检查目标收藏夹是否存在（在对话框中）
   * @param {Element} dialog - 对话框
   * @param {string} favName - 收藏夹名称
   * @returns {boolean}
   */
  static isFavoriteExistInDialog(dialog, favName) {
    const favList = this.getFavoriteListInDialog(dialog);
    return favList.some(fav => fav.name === favName);
  }

  // ========== API 直接操作方法 ==========

  /**
   * 从 Cookie 获取 CSRF Token (bili_jct)
   * @returns {string|null}
   */
  static getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'bili_jct') {
        return value;
      }
    }
    return null;
  }

  /**
   * 从当前页面收集视频 BV 号
   * @returns {Array<string>} BV 号数组
   */
  static collectVideoBvidsFromPage() {
    const bvids = [];
    const videoCards = document.querySelectorAll(SELECTORS.VIDEO_CARD);

    for (const card of videoCards) {
      const links = card.querySelectorAll('a[href*="/video/"]');
      for (const link of links) {
        const match = link.href.match(/\/video\/(BV\w+)/);
        if (match && !bvids.includes(match[1])) {
          bvids.push(match[1]);
          break; // 每个卡片只取一个
        }
      }
    }

    return bvids;
  }

  /**
   * 通过 API 获取视频的 aid
   * @param {string} bvid - BV 号
   * @returns {Promise<number|null>} 视频 aid
   */
  static async getVideoAid(bvid) {
    try {
      const resp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
        credentials: 'include'
      });
      const data = await resp.json();
      if (data.code === 0 && data.data) {
        return data.data.aid;
      }
      warn(`获取视频 ${bvid} 信息失败:`, data.message);
      return null;
    } catch (e) {
      error(`获取视频 ${bvid} 信息异常:`, e.message);
      return null;
    }
  }

  /**
   * 批量获取视频 aid
   * @param {Array<string>} bvids - BV 号数组
   * @returns {Promise<Array<number>>} aid 数组
   */
  static async batchGetVideoAids(bvids) {
    const aids = [];
    for (const bvid of bvids) {
      const aid = await this.getVideoAid(bvid);
      if (aid !== null) {
        aids.push(aid);
      }
      await delay(200); // 避免请求过快
    }
    return aids;
  }

  /**
   * 通过 API 获取用户自己的收藏夹列表
   * @returns {Promise<Array<{id: number, title: string, media_count: number}>>}
   */
  static async getOwnFavoritesList() {
    const cookies = document.cookie.split(';');
    let mid = null;
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'DedeUserID') {
        mid = value;
        break;
      }
    }

    if (!mid) {
      error('无法获取用户 UID');
      return [];
    }

    try {
      const resp = await fetch(
        `https://api.bilibili.com/x/v3/fav/folder/created/list-all?up_mid=${mid}`,
        { credentials: 'include' }
      );
      const data = await resp.json();
      if (data.code === 0 && data.data && data.data.list) {
        return data.data.list;
      }
      error('获取收藏夹列表失败:', data.message);
      return [];
    } catch (e) {
      error('获取收藏夹列表异常:', e.message);
      return [];
    }
  }

  /**
   * 通过 API 创建收藏夹
   * @param {string} title - 收藏夹名称
   * @returns {Promise<number|null>} 新建收藏夹的 ID
   */
  static async createFavoriteViaAPI(title) {
    const csrf = this.getCSRFToken();
    if (!csrf) {
      error('无法获取 CSRF Token');
      return null;
    }

    try {
      const body = new URLSearchParams({
        title: title,
        privacy: '0',  // 0=公开, 1=私密
        csrf: csrf
      });

      const resp = await fetch('https://api.bilibili.com/x/v3/fav/folder/add', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      const data = await resp.json();
      if (data.code === 0 && data.data) {
        log(`✓ 通过 API 创建收藏夹 [${title}] 成功, ID: ${data.data.id}`);
        return data.data.id;
      }
      error(`创建收藏夹 [${title}] 失败:`, data.message);
      return null;
    } catch (e) {
      error(`创建收藏夹 [${title}] 异常:`, e.message);
      return null;
    }
  }

  /**
   * 通过 API 批量添加视频到收藏夹
   * @param {Array<number>} aids - 视频 aid 数组
   * @param {number} targetFavId - 目标收藏夹 ID
   * @returns {Promise<{success: number, failed: number}>}
   */
  static async addVideosToFavorites(aids, targetFavId) {
    const csrf = this.getCSRFToken();
    if (!csrf) {
      error('无法获取 CSRF Token');
      return { success: 0, failed: aids.length };
    }

    let success = 0;
    let failed = 0;

    for (const aid of aids) {
      try {
        // B站收藏夹 API: resources 参数格式为 "aid:type"（type=2 表示视频）
        const body = new URLSearchParams({
          resources: `${aid}:2`,
          add_media_ids: targetFavId.toString(),
          csrf: csrf
        });

        const resp = await fetch('https://api.bilibili.com/x/v3/fav/resource/deal', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        const data = await resp.json();
        if (data.code === 0) {
          success++;
        } else {
          warn(`添加视频 aid=${aid} 失败:`, data.message);
          failed++;
        }

        await delay(300); // 请求间隔
      } catch (e) {
        error(`添加视频 aid=${aid} 异常:`, e.message);
        failed++;
      }
    }

    return { success, failed };
  }
}
