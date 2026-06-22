/**
 * 跨页面状态管理器
 * 使用 GM_setValue/GM_getValue 持久化状态
 */

const STATE_KEY = 'bilibili_fav_cross_page_state';
const STATE_EXPIRE_TIME = 30 * 60 * 1000; // 30 分钟

export class StateManager {
  /**
   * 保存跨页面状态
   * @param {Object} state - 状态对象
   */
  static saveState(state) {
    const data = {
      ...state,
      timestamp: Date.now()
    };

    // 如果 GM_setValue 可用，使用 GM API；否则使用 localStorage
    if (typeof GM_setValue !== 'undefined') {
      GM_setValue(STATE_KEY, JSON.stringify(data));
    } else {
      localStorage.setItem(STATE_KEY, JSON.stringify(data));
    }
  }

  /**
   * 加载跨页面状态
   * @returns {Object|null}
   */
  static loadState() {
    let dataStr = null;

    // 尝试从 GM API 读取
    if (typeof GM_getValue !== 'undefined') {
      dataStr = GM_getValue(STATE_KEY, null);
    } else {
      dataStr = localStorage.getItem(STATE_KEY);
    }

    if (!dataStr) return null;

    try {
      const state = JSON.parse(dataStr);

      // 检查是否过期
      if (Date.now() - state.timestamp > STATE_EXPIRE_TIME) {
        this.clearState();
        return null;
      }

      return state;
    } catch (e) {
      console.error('[StateManager] 解析状态失败:', e);
      return null;
    }
  }

  /**
   * 清除跨页面状态
   */
  static clearState() {
    if (typeof GM_deleteValue !== 'undefined') {
      GM_deleteValue(STATE_KEY);
    } else {
      localStorage.removeItem(STATE_KEY);
    }
  }

  /**
   * 检查状态是否存在
   * @returns {boolean}
   */
  static hasState() {
    return this.loadState() !== null;
  }
}
