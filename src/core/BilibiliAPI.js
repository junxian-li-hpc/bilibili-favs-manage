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

    const allNodes = Array.from(sidebar.childNodes);
    const favorites = [];
    let inCreatedSection = false;

    for (const node of allNodes) {
      // 检测"我创建的收藏夹"文本节点
      if (node.nodeType === Node.TEXT_NODE &&
          node.textContent.trim() === '我创建的收藏夹') {
        inCreatedSection = true;
        continue;
      }

      // 检测分隔标记（"我追的"或"其他收藏"）
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text === '我追的合集/收藏夹' || text === '其他收藏') {
          inCreatedSection = false;
          continue;
        }
      }

      // 收集"我创建的收藏夹"分组中的 .vui_sidebar-item
      if (inCreatedSection &&
          node.nodeType === Node.ELEMENT_NODE &&
          node.classList && node.classList.contains('vui_sidebar-item')) {
        favorites.push(node);
      }
    }

    // 计算过滤前的总数（用于日志）
    const totalCount = sidebar.querySelectorAll(SELECTORS.FAVORITES_ITEM).length;

    // 延迟日志：只有在 logger 已初始化时才输出
    if (typeof log === 'function') {
      // 使用 setTimeout 延迟到下一个事件循环，确保 panel 已初始化
      setTimeout(() => {
        log('过滤结果: 总数', totalCount, '→ 我创建的', favorites.length);
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
}
