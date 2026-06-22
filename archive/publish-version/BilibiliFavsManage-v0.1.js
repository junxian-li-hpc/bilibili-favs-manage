// ==UserScript==
// @name         bilibili 收藏夹批量复制
// @namespace    http://tampermonkey.net/
// @version      2024-02-13 v0.1
// @description  批量复制bilibili收藏夹!
// @author       You
// @match        https://space.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @license      MIT
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/487232/bilibili%20%E6%94%B6%E8%97%8F%E5%A4%B9%E6%89%B9%E9%87%8F%E5%A4%8D%E5%88%B6.user.js
// @updateURL https://update.greasyfork.org/scripts/487232/bilibili%20%E6%94%B6%E8%97%8F%E5%A4%B9%E6%89%B9%E9%87%8F%E5%A4%8D%E5%88%B6.meta.js
// ==/UserScript==

(function() {
    'use strict';

class ControlPanel {
    constructor(favBtns) {
        this.delayTimeShort = 500;
        this.delayTimeMiddle = 1000;

        this.errorCode = 0;
        this.normalCode = 1;
        this.startBatchCode = 2;
        this.startSingleCode = 3;
        this.endSingleCode = 4;
        this.endBatchCode = 5;
        this.onePageCode = 6;

        this.leftWidth = "35%";
        this.rightWidth = "63%";
        this.minW = "550";
        this.minH = "420";

        this.favBtns = favBtns;
        const ulList = this.iterateFavs();

        const btnPanel = this.createSubPanel("btn-panel",);
        const selectAllButton = this.createButton("点我全选", this.toggleSelectAll.bind(this));
        const startBatchTransferButton = this.createButton("开始批量转移");
        const startTransferCurrentButton = this.createButton("开始转移当前收藏夹");
        const minimizeButton = this.createButton("点我最小化", this.toggleMinimize.bind(this), "minimize-btn");
        const destroyButton = this.createButton('点我销毁', () => {
            this.floatingPanel.remove();
        });
        btnPanel.style.flexDirection = 'column';
        btnPanel.style.display = 'flex';
        btnPanel.appendChild(selectAllButton);
        btnPanel.appendChild(startBatchTransferButton);
        btnPanel.appendChild(startTransferCurrentButton);
        btnPanel.appendChild(minimizeButton);
        btnPanel.appendChild(destroyButton);

        const srcFavPanel = this.createSubPanel("src-fav-panel", "left", "48%");
        const dstFavPanel = this.createSubPanel("dst-fav-panel", "right", "48%");
        const favPanel = this.createSubPanel("fav-panel", "left", "100%");
        favPanel.appendChild(srcFavPanel);
        favPanel.appendChild(dstFavPanel);
        srcFavPanel.appendChild(document.createElement("h3")).textContent = "源收藏夹";
        dstFavPanel.appendChild(document.createElement("h3")).textContent = "目标收藏夹";
        for (const ul of ulList) {
            srcFavPanel.appendChild(ul);
            dstFavPanel.appendChild(ul.cloneNode(true));
        }
        this.leftPanel = this.createSubPanel("left-panel", "left");

        this.leftPanel.appendChild(btnPanel);
        this.leftPanel.appendChild(favPanel);



        this.rightPanel = this.createSubPanel("right-panel", "right");
        this.rightPanel.style.flexGrow = "1";
        this.rightPanel.style.display = "flex"




        const outputTextBox = this.createOutputTextBox();

        this.rightPanel.appendChild(outputTextBox);

        this.floatingPanel = this.createFloatingPanel();
        this.floatingPanel.appendChild(this.leftPanel);
        this.floatingPanel.appendChild(this.rightPanel);



        this.outputTextBox = outputTextBox;
        this.selectAllButton = selectAllButton;
        this.startBatchTransferButton = startBatchTransferButton;
        this.startTransferCurrentButton = startTransferCurrentButton;
        this.ulList = ulList;
        this.minimizeButton = minimizeButton;
        this.destroyButton = destroyButton;


    }

    recordPanelSize() {
        this.minH = this.floatingPanel.offsetHeight;
        this.minW = this.floatingPanel.offsetWidth;

        this.floatingPanel.style.width = this.minW + "px";
        this.floatingPanel.style.height = this.minH + "px";
    }



    toggleSelectAll() {
        if (this.selectAllButton.textContent === "点我全选") {
            for (const ul of this.ulList) {
                ul.children[0].checked = true;
            }
            this.selectAllButton.textContent = "点我全部取消";
        } else {
            for (const ul of this.ulList) {
                ul.children[0].checked = false;
            }
            this.selectAllButton.textContent = "点我全选";
        }
    }

    toggleMinimize() {
        if (this.minimizeButton.textContent === "点我最小化") {

            this.rightPanel.remove();
            this.minimizeButton.textContent = "点我打开面板";
        } else {
            this.minimizeButton.textContent = "点我最小化";
            this.floatingPanel.appendChild(this.rightPanel);
        }
    }

    createButton(text, clickHandler, className = "btn") {
        const button = document.createElement("button");
        button.textContent = text;

        button.classList.add("btn");

        button.style.margin = "0px";
        button.style.padding = '0px 0px';
        button.style.fontSize = '14px';

        button.style.width = '150px';
        button.style.height = '40px';


        button.style.marginTop = '5px';
        button.style.marginLeft = '5px';

        if (clickHandler)
            button.addEventListener("click", clickHandler);

        return button;
    }


    createSubPanel(className, floatPos, width, height) {
        const subPanel = document.createElement("div");
        if (className)
            subPanel.classList.add(className);
        if (floatPos)
            subPanel.style.float = floatPos;
        if (width)
            subPanel.style.width = width;

        if (height) {
            subPanel.style.height = height;
        }

        subPanel.style.border = "1px solid #ccc";
        return subPanel;
    }


    createOutputTextBox() {


        const editableArea = document.createElement('div');


        editableArea.style.width = '340px';

        editableArea.style.border = '1px solid #ccc';
        editableArea.style.padding = '5px';
        editableArea.style.boxSizing = 'border-box';
        editableArea.contentEditable = true;
        editableArea.style.flexGrow = "1";


        editableArea.style.overflow = 'scroll';


        editableArea.style.maxHeight = "100%";

        editableArea.style.minHeight = "0";















        return editableArea;


    }


    createFloatingPanel() {


        const floatingPanel = document.createElement("div");
        floatingPanel.classList.add("floating-panel");
        floatingPanel.style.position = "fixed";
        floatingPanel.style.top = "50px";
        floatingPanel.style.left = "50px";
        floatingPanel.style.backgroundColor = "#ffffff";
        floatingPanel.style.border = "0px solid #ccc";
        floatingPanel.style.borderRadius = "5px";
        floatingPanel.style.padding = "0px";
        floatingPanel.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        floatingPanel.style.zIndex = "99999";


        floatingPanel.style.display = "flex";






        floatingPanel.style.userSelect = "none";
        floatingPanel.style.cursor = "move";


        let floP = floatingPanel;
        floP.addEventListener('mousedown', down)
        floP.addEventListener("mouseup", stopDragging);
        floP.addEventListener("mousemove", drag);


        document.body.addEventListener('mousemove', move.bind(this))
        document.body.addEventListener('mouseup', up)


        let isDragging = false;
        let offsetX, offsetY;


        let resizeable = false




        let direc = ''


        function up() {
            resizeable = false
        }
        function stopDragging() {
            isDragging = false;
        }



        function down(e) {

            let d = getDirection(e)


            if (d !== '') {
                resizeable = true
                isDragging = false
                direc = d

            } else {

                isDragging = true;
                offsetX = e.clientX - floatingPanel.getBoundingClientRect().left;
                offsetY = e.clientY - floatingPanel.getBoundingClientRect().top;


            }
        }


        function move(e) {
            let floP = this.floatingPanel;

            let d = getDirection(e)
            let cursor
            if (d === '') cursor = 'default';
            else cursor = d + '-resize';

            floP.style.cursor = cursor;

            if (resizeable) {

                let newWidth = floP.offsetWidth;
                let newHeight = floP.offsetHeight;

                let originTop = floP.offsetTop;
                let originLeft = floP.offsetLeft;
                let newTop = originTop;
                let newLeft = originLeft;



                if (direc.indexOf('w') !== -1) {
                    newWidth -= e.movementX;
                    newLeft += e.movementX;
                }

                if (direc.indexOf('n') !== -1) {
                    newHeight -= e.movementY;
                    newTop += e.movementY;
                }


                if (direc.indexOf('e') !== -1) {
                    newWidth += e.movementX;

                }


                if (direc.indexOf('s') !== -1) {
                    newHeight += e.movementY;
                }



                if (newWidth < this.minW) {
                    newWidth = this.minW;
                    newLeft = originLeft;
                }

                if (newHeight < this.minH) {
                    newHeight = this.minH;
                    newTop = originTop;
                }








                let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                let viewportHeight = window.innerHeight || document.documentElement.clientHeight;

                if (newLeft < 0 || newLeft + newWidth > viewportWidth) {
                    return
                }
                if (newTop < 0 || newTop + newHeight > viewportHeight) {
                    return
                }

                floP.style.width = newWidth + "px";
                floP.style.height = newHeight + "px";

                floP.style.top = newTop + "px";
                floP.style.left = newLeft + "px";



            }
        }


        function drag(e) {
            if (isDragging) {

                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;


                let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                let viewportHeight = window.innerHeight || document.documentElement.clientHeight;



                newLeft = Math.max(0, Math.min(newLeft, viewportWidth - floatingPanel.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, viewportHeight - floatingPanel.offsetHeight));



                floatingPanel.style.left = newLeft + "px";
                floatingPanel.style.top = newTop + "px";


            }
        }


        function getDirection(ev) {
            let dir = '';
            if (ev.clientX - floP.getBoundingClientRect().left < 15)
                dir += 'w';
            else if (floP.getBoundingClientRect().right - ev.clientX < 15)
                dir += 'e';

            if (ev.clientY - floP.getBoundingClientRect().top < 15)
                dir += 'n';
            else if (floP.getBoundingClientRect().bottom - ev.clientY < 15)
                dir += 's';
            return dir;

        }

        return floatingPanel;
    }
    appendInfo(info, type = this.normalCode) {
        this.appendInfoToTextarea(this.outputTextBox, info, type);
    }

    appendInfoToTextarea(textarea, info, type = this.normalCode) {



        let currentDate = new Date();
        let formattedDate = currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');

        let textColor;
        switch (type) {
            case this.errorCode:
                textColor = 'red';
                break;
            case this.normalCode:
                textColor = 'black';
                break;
            case this.startBatchCode:
                info += "\n\n";
            case this.endBatchCode:
                textColor = 'blue';
                break;
            case this.startSingleCode:
                info += "\n";
            case this.endSingleCode:
                textColor = 'green';
                break;
            default:
                textColor = 'black';
                break;
        }


        const span = document.createElement('span');
        span.style.color = textColor;
        span.textContent = formattedDate + ':' + info;


        textarea.appendChild(span);
        textarea.appendChild(document.createElement('br'));


        textarea.scrollTop = textarea.scrollHeight;
    }


    iterateFavs() {

        let ulList = []
        for (const btn of this.favBtns) {
            const ul = document.createElement("ul");
            ul.innerHTML = "<input type='checkbox' id='checkBox' name='checkBox' value='" + btn.title + "' />" + btn.title;
            ulList.push(ul);
        }
        return ulList;
    }


}
class BatchTransfer {

    constructor() {
        this.usage = "Hi，这是一个Bilibili 收藏夹管理工具，可以批量转移保存其他人的收藏夹视频，也可以批量转移自己的收藏夹视频（还未实现）。";
        this.delayTimeShort = 500;
        this.delayTimeMiddle = 1000;

        this.errorCode = 0;
        this.normalCode = 1;
        this.startBatchCode = 2;
        this.startSingleCode = 3;
        this.endSingleCode = 4;
        this.endBatchCode = 5;
        this.onePageCode = 6;


        this.favBtns = this.getAllFavBtns();
        this.selectedFavs = []

        this.ctl = new ControlPanel(this.favBtns);
        this.floatingPanel = this.ctl.floatingPanel;

        this.ctl.startBatchTransferButton.addEventListener("click", this.initiateBatchOperation.bind(this));
        this.ctl.startTransferCurrentButton.addEventListener("click", this.transferOneFav.bind(this));


        document.body.insertBefore(this.floatingPanel, document.body.firstChild);
        this.ctl.recordPanelSize();
    }




    getAllFavBtns() {
        let buttons = document.querySelectorAll('#fav-createdList-container .fav-item a');
        return buttons;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async initiateBatchOperation() {




        this.selectedFavs = [];
        for (const ul of this.ctl.ulList) {
            if (ul.children[0].checked) {
                this.selectedFavs.push(ul.children[0].value);
            }
        }

        await this.delay(this.delayTimeShort);
        this.ctl.appendInfo("开始批量转移", this.startBatchCode);

        for (const btn of this.favBtns) {

            if (!(this.selectedFavs.includes(btn.title)))
                continue;
            btn.click();
            await this.delay(this.delayTimeShort);
            await this.transferOneFav();
        }

        this.ctl.appendInfo("批量转移结束", this.endBatchCode);

    }

    async transferOneFav() {
        const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        const totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');
        const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim().split(':')[0]) : 0;
        this.ctl.appendInfo("开始转移收藏夹" + sourceFavName + ",一共" + totalPages + "页", this.startSingleCode);


        let batchOperationButton = document.querySelector('.filter-item.do-batch .text');
        if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
            batchOperationButton.click();
        } else {
            this.ctl.appendInfo("Error!!! 找不到'批量操作'按钮或按钮文本不匹配", this.errorCode);

        }
        await this.delay(this.delayTimeShort);
        await this.saveCollection(1, totalPages);
    }

    async saveCollection(currentPage, totalPages) {
        const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        if (currentPage > totalPages || totalPages == 0) {
            this.ctl.appendInfo("收藏夹" + sourceFavName + "转移结束", this.endSingleCode);
            return;
        }

        this.ctl.appendInfo("正在保存第" + currentPage + "页");

        this.ctl.appendInfo("点击'全选'按钮");
        document.querySelector('.icon-selece-all').parentNode.click();
        await this.delay(this.delayTimeShort);

        this.ctl.appendInfo("点击'复制到'按钮");
        document.querySelector('.icon-copy').parentNode.click();
        await this.delay(this.delayTimeShort);

        const targetFavList = document.querySelectorAll('.target-favlist-container .fav-name');
        let hasSameNameFav = false;

        targetFavList.forEach(function (targetFav) {
            if (targetFav.textContent.trim() === sourceFavName) {
                hasSameNameFav = true;
                return;
            }
        });

        if (!hasSameNameFav) {
            this.ctl.appendInfo("创建新的收藏夹：" + sourceFavName);
            this.ctl.appendInfo("点击'新建收藏夹'按钮");
            document.querySelector('.fake-fav-input').click();
            await this.delay(this.delayTimeMiddle);

            this.ctl.appendInfo("输入新收藏夹名称：" + sourceFavName);
            const inputText = document.querySelector('.add-fav-input');
            inputText.value = sourceFavName;
            inputText.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(this.delayTimeShort);

            this.ctl.appendInfo("点击'新建'按钮");
            document.querySelector('.fav-add-btn').click();
        }

        await this.delay(this.delayTimeShort);

        const targetFolderName = sourceFavName;
        this.ctl.appendInfo("点击目标收藏夹：" + targetFolderName);
        const favListContainer = document.querySelector('.target-favlist-container');
        const favItems = favListContainer.querySelectorAll('.target-favitem');

        favItems.forEach(function (item) {
            const folderNameElement = item.querySelector('.fav-name');
            if (folderNameElement && folderNameElement.textContent.trim() === targetFolderName) {
                folderNameElement.click();
                return;
            }
        });

        await this.delay(this.delayTimeShort);

        this.ctl.appendInfo("点击'确定'");
        const panel = document.querySelector('.edit-video-modal');
        const confirmBtn = panel.querySelector('.btn-content');
        confirmBtn.click();
        await this.delay(this.delayTimeShort);

        this.ctl.appendInfo("点击'下一页'按钮");
        const nextPageBtn = document.querySelector('.be-pager-next');
        nextPageBtn.click();
        await this.delay(this.delayTimeMiddle);
        await this.saveCollection(currentPage + 1, totalPages);
    }
}

setTimeout(function () {
    let bt = new BatchTransfer()
}, 3000);


    // Your code here...
})();