/**
 * 跨页面状态持久化工具
 * 使用 localStorage 保存和恢复状态
 */

export class Storage {
  static KEYS = {
    CROSS_PAGE_STATE: 'bilibili_fav_cross_page_state'
  };

  /**
   * 保存跨页面状态
   * @param {Object} state - 状态对象
   */
  static saveCrossPageState(state) {
    const data = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(this.KEYS.CROSS_PAGE_STATE, JSON.stringify(data));
  }

  /**
   * 加载跨页面状态
   * @returns {Object|null}
   */
  static loadCrossPageState() {
    const data = localStorage.getItem(this.KEYS.CROSS_PAGE_STATE);
    if (!data) return null;

    try {
      const state = JSON.parse(data);
      // 状态超过 10 分钟失效
      if (Date.now() - state.timestamp > 10 * 60 * 1000) {
        this.clearCrossPageState();
        return null;
      }
      return state;
    } catch (e) {
      console.error('[Storage] 解析状态失败:', e);
      return null;
    }
  }

  /**
   * 清除跨页面状态
   */
  static clearCrossPageState() {
    localStorage.removeItem(this.KEYS.CROSS_PAGE_STATE);
  }
}
