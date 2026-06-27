/**
 * DOM 选择器配置
 * 集中管理所有 B 站页面相关的选择器
 * 便于未来页面改版时快速适配
 */

export const SELECTORS = {
  // 收藏夹列表
  FAVORITES_SIDEBAR: '.favlist-aside',
  FAVORITES_ITEM: '.vui_sidebar-item',
  FAVORITES_ITEM_TITLE: '.vui_sidebar-item-title .vui_ellipsis',
  FAVORITES_ITEM_COUNT: '.vui_sidebar-item-postfix',
  FAVORITES_ITEM_ACTIVE: '.vui_sidebar-item--active',

  // 当前收藏夹信息
  CURRENT_FAV_TITLE: '.favlist-info-detail__title-row',

  // 批量操作
  BATCH_OPERATION_BTN: '.vui_button.favlist-info-batch',

  // 视频卡片
  VIDEO_CARD: '.bili-video-card',
  VIDEO_CHECKBOX: '.bili-card-checkbox',
  VIDEO_CHECKBOX_CHECKED: '.bili-card-checkbox--checked',

  // 批量操作工具栏
  SELECT_ALL_CHECKBOX: '.vui_checkbox',
  COPY_BUTTON_TEXT: '复制至',
  MOVE_BUTTON_TEXT: '移动至',

  // 收藏夹选择弹窗
  DIALOG_CONTAINER: '.vui_dialog--content.fav-modify-modal-content',
  FAV_LIST_CONTAINER: '.modify-fav-list',
  FAV_ITEM: '.modify-fav-item',
  FAV_ITEM_TITLE: '.modify-fav-item__title',
  FAV_ITEM_COUNT: '.modify-fav-item__count',
  FAV_RADIO_INPUT: 'input[type="radio"].vui_radio--input-original',
  FAV_RADIO_CHECKED: '.vui_radio--checked',

  // 新建收藏夹
  CREATE_FAV_BUTTON: '.modify-fav-add',
  CREATE_FAV_DIALOG: '.fav-collapse-modal-content',
  CREATE_FAV_NAME_INPUT: 'input.add-fav-input',
  CREATE_FAV_DESC_INPUT: 'textarea.add-fav-input',
  CREATE_FAV_CONFIRM_BTN_TEXT: '创建',

  // 确定按钮
  CONFIRM_BUTTON: 'button.vui_button--blue',

  // 提示消息
  TOAST: '.vui_toast',

  // 分页
  PAGINATION: '.vui_pagenation',
  NEXT_PAGE_TEXT: ['下一页', 'next', '>']
};

export const BUTTON_TEXTS = {
  BATCH_OPERATION: '批量操作',
  SELECT_ALL: '全选',
  COPY_TO: '复制至',
  MOVE_TO: '移动至',
  CREATE_NEW: '新建收藏夹',
  CREATE: '创建',
  CONFIRM: '确定',
  SUCCESS: '操作成功'
};
