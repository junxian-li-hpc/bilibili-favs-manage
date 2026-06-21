/**
 * 浮动面板
 * 管理浮动面板的生命周期和交互
 */

import { UIComponents, CheckboxItem } from './UIComponents.js';
import { EventHandlers } from './EventHandlers.js';
import { PageDetector } from '../core/PageDetector.js';

export class FloatingPanel {
  constructor(manager) {
    this.manager = manager; // FavoriteManager 实例

    // 延迟时间
    this.delayTimeShort = 500;
    this.delayTimeMiddle = 1000;
    this.delayTimeLong = 2000;

    // 消息类型
    this.errorCode = 0;
    this.normalCode = 1;
    this.startBatchCode = 2;
    this.startSingleCode = 3;
    this.endSingleCode = 4;
    this.endBatchCode = 5;
    this.onePageCode = 6;
    this.warnCode = 7;

    // 面板宽度比例
    this.leftWidth = '35%';
    this.rightWidth = '63%';

    // 状态变量
    this.isDragging = false;
    this.resizeable = false;
    this.scrollTopEnabled = true;

    // UI 元素
    this.panel = null;
    this.floatingPanel = null;
    this.leftPanel = null;
    this.rightPanel = null;
    this.outputTextBox = null;
    this.sourceSelect = null;
    this.targetSelect = null;

    // 按钮
    this.selectAllButton = null;
    this.minimizeButton = null;
    this.startBatchTransferButton = null;

    // 收藏夹列表
    this.favorites = [];
  }

  /**
   * 初始化并显示面板
   */
  init() {
    this.loadFavorites();
    this.floatingPanel = this.createFloatingPanel();
    document.body.appendChild(this.floatingPanel);
    this.recordPanelSize();
    this.appendLog('浮动面板已创建', this.normalCode);
    this.showPageTypeIndicator();
  }

  /**
   * 加载收藏夹列表
   */
  loadFavorites() {
    this.favorites = this.manager.getAllFavoriteNames();
  }

  /**
   * 显示页面类型指示器
   */
  showPageTypeIndicator() {
    const isOwnPage = PageDetector.isOwnPage();
    const pageType = isOwnPage ? '我的收藏夹' : '他人的收藏夹';
    const color = isOwnPage ? '#00a000' : '#ff8800';
    this.appendLog(`当前页面: ${pageType}`, this.normalCode);

    // 更新标题颜色
    const titleElements = this.floatingPanel.querySelectorAll('h3');
    for (const title of titleElements) {
      if (title.textContent === '输出信息') {
        title.style.color = color;
      }
    }
  }

  /**
   * 创建左侧面板
   */
  createLeftPanel() {
    const leftPanel = UIComponents.createSubDiv('left-panel', 'left');
    leftPanel.style.flexGrow = '0';
    leftPanel.style.backgroundColor = '#f5f5f5';
    leftPanel.style.flexDirection = 'column';

    // 创建按钮面板
    const btnPanel = this.createButtonPanel();
    leftPanel.appendChild(btnPanel);

    // 创建选择器面板
    const selectorPanel = this.createSelectorPanel();
    leftPanel.appendChild(selectorPanel);

    return leftPanel;
  }

  /**
   * 创建右侧面板
   */
  createRightPanel() {
    const textContainer = document.createElement('div');
    const textDiv = UIComponents.createSubDiv('div');

    const hintText = document.createElement('h3');
    hintText.style.fontWeight = 'bold';
    hintText.textContent = '输出信息';

    textDiv.appendChild(hintText);
    textContainer.appendChild(textDiv);

    this.outputTextBox = UIComponents.createOutputTextBox();
    this.outputTextBox.style.backgroundColor = '#fff';

    const rightPanel = UIComponents.createSubDiv('right-panel', 'right');
    rightPanel.style.backgroundColor = '#fafafa';
    rightPanel.style.overflowX = 'hidden';
    rightPanel.style.flexDirection = 'column';
    rightPanel.appendChild(textContainer);
    rightPanel.appendChild(this.outputTextBox);

    return rightPanel;
  }

  /**
   * 创建按钮面板
   */
  createButtonPanel() {
    const btnPanel = document.createElement('div');
    btnPanel.className = 'btn-panel';
    btnPanel.style.display = 'flex';
    btnPanel.style.border = '1px solid #ccc';
    btnPanel.style.backgroundColor = '#e8e8e8';
    btnPanel.style.flexDirection = 'column';

    const startBatchTransferButton = UIComponents.createButton('开始批量复制', () => {
      this.startBatchTransfer();
    });

    this.minimizeButton = UIComponents.createButton('点我最小化', () => {
      EventHandlers.toggleMinimize(this);
    });

    const destroyButton = UIComponents.createButton('点我销毁', () => {
      this.floatingPanel.remove();
    });

    btnPanel.appendChild(startBatchTransferButton);
    btnPanel.appendChild(this.minimizeButton);
    btnPanel.appendChild(destroyButton);

    this.startBatchTransferButton = startBatchTransferButton;

    return btnPanel;
  }

  /**
   * 创建选择器面板
   */
  createSelectorPanel() {
    const selectorPanel = document.createElement('div');
    selectorPanel.style.display = 'flex';
    selectorPanel.style.flexDirection = 'column';
    selectorPanel.style.padding = '10px';
    selectorPanel.style.border = '1px solid #ccc';
    selectorPanel.style.backgroundColor = '#fff';
    selectorPanel.style.flexGrow = '1';
    selectorPanel.style.overflow = 'auto';

    // 源收藏夹标题
    const sourceTitle = document.createElement('h4');
    sourceTitle.textContent = '源收藏夹:';
    sourceTitle.style.margin = '5px 0';
    selectorPanel.appendChild(sourceTitle);

    // 源收藏夹下拉框
    this.sourceSelect = UIComponents.createSelect(this.favorites);
    this.sourceSelect.style.marginBottom = '15px';
    selectorPanel.appendChild(this.sourceSelect);

    // 目标收藏夹标题
    const targetTitle = document.createElement('h4');
    targetTitle.textContent = '目标收藏夹:';
    targetTitle.style.margin = '5px 0';
    selectorPanel.appendChild(targetTitle);

    // 目标收藏夹输入框
    const targetInput = document.createElement('input');
    targetInput.type = 'text';
    targetInput.placeholder = '输入新收藏夹名称';
    targetInput.style.width = '100%';
    targetInput.style.padding = '5px';
    targetInput.style.fontSize = '14px';
    targetInput.style.border = '1px solid #ccc';
    targetInput.style.borderRadius = '3px';
    targetInput.style.boxSizing = 'border-box';
    selectorPanel.appendChild(targetInput);

    this.targetInput = targetInput;

    // 目标收藏夹下拉框
    this.targetSelect = UIComponents.createSelect(this.favorites);
    this.targetSelect.style.marginTop = '10px';
    selectorPanel.appendChild(this.targetSelect);

    // 添加提示文本
    const hintText = document.createElement('p');
    hintText.style.fontSize = '12px';
    hintText.style.color = '#666';
    hintText.style.marginTop = '10px';
    hintText.textContent = '提示: 可选择已有收藏夹或输入新名称';
    selectorPanel.appendChild(hintText);

    return selectorPanel;
  }

  /**
   * 创建浮动面板
   */
  createFloatingPanel() {
    const floP = document.createElement('div');
    floP.classList.add('floating-panel');
    floP.style.position = 'fixed';
    floP.style.top = '50px';
    floP.style.left = '50px';
    floP.style.width = '600px';
    floP.style.height = '500px';
    floP.style.backgroundColor = '#ffffff';
    floP.style.border = '2px solid #ccc';
    floP.style.borderRadius = '5px';
    floP.style.padding = '0px';
    floP.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    floP.style.zIndex = '99999';
    floP.style.display = 'flex';

    // 创建左右面板
    this.leftPanel = this.createLeftPanel();
    this.rightPanel = this.createRightPanel();

    floP.appendChild(this.leftPanel);
    floP.appendChild(this.rightPanel);

    // 绑定事件
    floP.addEventListener('mousedown', (e) => EventHandlers.mouseDown(this, e));
    floP.addEventListener('mouseup', () => EventHandlers.stopDragOnPanel(this));
    floP.addEventListener('mousemove', (e) => EventHandlers.dragOnPanel(this, e));

    document.body.addEventListener('mousemove', (e) => EventHandlers.mouseMove(this, e));
    document.body.addEventListener('mouseup', () => EventHandlers.stopResizeOnBody(this));

    return floP;
  }

  /**
   * 记录面板大小
   */
  recordPanelSize() {
    const fPW = this.floatingPanel.offsetWidth;
    const fPH = this.floatingPanel.offsetHeight;

    if (this.originFPW === undefined) {
      this.originRPW = this.rightPanel.offsetWidth;
      this.originRPH = this.rightPanel.offsetHeight;

      this.originFPW = fPW;
      this.originFPH = fPH;

      this.minW = this.leftPanel.offsetWidth;
      this.minH = this.floatingPanel.querySelector('.btn-panel').offsetHeight;
    }

    this.floatingPanel.style.width = fPW + 'px';
    this.floatingPanel.style.height = fPH + 'px';
  }

  /**
   * 记录隐藏前的面板大小
   */
  recordHiddenPanelSize() {
    this.hiddenWidth = this.floatingPanel.offsetWidth;
    this.hiddenHeight = this.floatingPanel.offsetHeight;
  }

  /**
   * 开始批量复制
   */
  async startBatchTransfer() {
    const source = this.sourceSelect.value;
    const targetFromInput = this.targetInput.value.trim();
    const targetFromSelect = this.targetSelect.value;

    // 优先使用输入框的值
    const target = targetFromInput || targetFromSelect;

    if (!source) {
      this.appendLog('错误: 请选择源收藏夹', this.errorCode);
      return;
    }

    if (!target) {
      this.appendLog('错误: 请选择或输入目标收藏夹', this.errorCode);
      return;
    }

    if (source === target) {
      this.appendLog('错误: 源收藏夹和目标收藏夹不能相同', this.errorCode);
      return;
    }

    this.appendLog(`开始复制: ${source} → ${target}`, this.startBatchCode);

    // 禁用按钮
    this.startBatchTransferButton.disabled = true;
    this.startBatchTransferButton.textContent = '复制中...';

    try {
      const success = await this.manager.copyFavorite(source, target);
      if (success) {
        this.appendLog('✓ 复制完成!', this.endBatchCode);
      } else {
        this.appendLog('✗ 复制失败', this.errorCode);
      }
    } catch (err) {
      this.appendLog(`✗ 复制出错: ${err.message}`, this.errorCode);
      console.error(err);
    } finally {
      // 恢复按钮
      this.startBatchTransferButton.disabled = false;
      this.startBatchTransferButton.textContent = '开始批量复制';
    }
  }

  /**
   * 输出日志到面板
   */
  appendLog(info, type = this.normalCode) {
    this.appendInfoToTextarea(this.outputTextBox, info, type);
  }

  /**
   * 将信息追加到文本区域
   */
  appendInfoToTextarea(textarea, info, type = this.normalCode) {
    let currentDate = new Date();
    let timezoneOffset = currentDate.getTimezoneOffset();
    let timezoneOffsetMilliseconds = timezoneOffset * 60 * 1000;
    let userCurrentDate = new Date(currentDate.getTime() - timezoneOffsetMilliseconds);
    let formattedDate = userCurrentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');

    let textColor;
    let brCnt = 1;

    switch (type) {
      case this.errorCode:
        textColor = 'red';
        break;
      case this.normalCode:
        textColor = 'black';
        break;
      case this.endBatchCode:
        brCnt++;
      case this.startBatchCode:
        brCnt++;
        textColor = 'blue';
        break;
      case this.endSingleCode:
        brCnt++;
      case this.startSingleCode:
        textColor = 'green';
        break;
      case this.onePageCode:
        textColor = 'purple';
        info += '--------------';
        break;
      case this.warnCode:
        textColor = 'orange';
        break;
      default:
        textColor = 'black';
        break;
    }

    const span = document.createElement('span');
    span.style.color = textColor;
    span.textContent = formattedDate + ': ' + info;

    textarea.appendChild(span);
    for (let i = 0; i < brCnt; i++) {
      textarea.appendChild(document.createElement('br'));
    }

    // 自动滚动到底部
    if (this.scrollTopEnabled) {
      textarea.scrollTop = textarea.scrollHeight;
    }
  }

  /**
   * 销毁面板
   */
  destroy() {
    if (this.floatingPanel) {
      this.floatingPanel.remove();
      this.floatingPanel = null;
    }
  }
}
