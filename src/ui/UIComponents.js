/**
 * UI 组件工厂
 * 提供创建各种 UI 元素的静态方法
 */

export class UIComponents {
  static createButton(text, clickHandler, className = 'btn') {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add('btn');
    button.style.margin = '0px';
    button.style.padding = '0px 0px';
    button.style.fontSize = '14px';
    button.style.width = '150px';
    button.style.height = '40px';
    button.style.marginTop = '5px';
    button.style.marginLeft = '5px';

    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    }

    return button;
  }

  static createOutputTextBox() {
    const editableArea = document.createElement('div');
    editableArea.classList.add('output-text-box');
    editableArea.style.border = '1px solid #ccc';
    editableArea.style.padding = '5px';
    editableArea.style.boxSizing = 'border-box';
    editableArea.style.whiteSpace = 'nowrap';
    editableArea.style.minWidth = '300px';
    editableArea.contentEditable = true;
    editableArea.style.flexGrow = '1';
    editableArea.style.overflow = 'auto';

    editableArea.addEventListener('scroll', function () {
      this.scrollTopEnabled = false;
    });

    return editableArea;
  }

  static createSubDiv(className, floatPos, width, height) {
    const subPanel = document.createElement('div');
    subPanel.style.flexGrow = '1';
    subPanel.style.display = 'flex';
    subPanel.style.border = '1px solid #ccc';

    if (className) subPanel.classList.add(className);
    if (floatPos) subPanel.style.float = floatPos;
    if (width) subPanel.style.width = width;
    if (height) subPanel.style.height = height;

    return subPanel;
  }
}
