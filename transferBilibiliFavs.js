// 使用 await 和 async 实现批量转移收藏夹功能

class BatchTransfer {

    constructor() {
        this.delayTimeShort = 500;
        this.delayTimeMiddle = 1000;
        // this.favLinks = this.getAllFavLinks(); // 调用 getAllFav的返回值获得所有链接 
        this.favBtns = this.getAllFavBtns(); // 调用 getAllFav的返回值获得所有链接 
        this.selectedFavs = []


        // 创建浮动面板
        const floatingPanel = document.createElement("div");
        floatingPanel.classList.add("floating-panel");
        floatingPanel.style.position = "fixed";
        floatingPanel.style.top = "50px";
        floatingPanel.style.right = "50px";
        floatingPanel.style.backgroundColor = "#ffffff";
        floatingPanel.style.border = "1px solid #ccc";
        floatingPanel.style.borderRadius = "5px";
        floatingPanel.style.padding = "10px";
        floatingPanel.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        floatingPanel.style.zIndex = "9999";

        // 创建左侧面板
        const leftPanel = document.createElement("div");
        leftPanel.classList.add("left-panel");
        leftPanel.style.float = "left"; // 左浮动，使其在左侧
        leftPanel.style.width = "40%"; // 左侧面板占据浮动面板的一半宽度
        floatingPanel.appendChild(leftPanel);



        // 创建右侧面板
        const rightPanel = document.createElement("div");
        rightPanel.classList.add("right-panel");
        rightPanel.style.float = "right"; // 右浮动，使其在右侧
        rightPanel.style.width = "60%"; // 右侧面板占据浮动面板的一半宽度
        floatingPanel.appendChild(rightPanel);


        // 创建开始批量转移按钮
        const startBatchTransferButton = document.createElement("button");
        startBatchTransferButton.textContent = "开始批量转移";
        startBatchTransferButton.classList.add("btn");
        startBatchTransferButton.style.margin = "5px";

        // 创建开始转移当前收藏夹按钮
        const startTransferCurrentButton = document.createElement("button");
        startTransferCurrentButton.textContent = "开始转移当前收藏夹";
        startTransferCurrentButton.classList.add("btn");
        startTransferCurrentButton.style.margin = "5px";

        // 创建输出文本框
        const outputTextBox = document.createElement("textarea");
        outputTextBox.style.width = "340px";
        outputTextBox.style.height = "400px";
        outputTextBox.style.marginTop = "10px";
        outputTextBox.style.resize = "none";


        //创建全选按钮，点击全选按钮，将所有的收藏夹都选中，然后按钮名字变成点我全部取消，再点击一次，全部取消
        const selectAllButton = document.createElement("button");
        selectAllButton.textContent = "点我全选";
        selectAllButton.classList.add("btn");
        selectAllButton.style.margin = "5px";
        selectAllButton.addEventListener("click", function () {
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
        }.bind(this));


        // final 绑定
        this.outputTextBox = outputTextBox;
        this.selectAllButton = selectAllButton;
        this.startBatchTransferButton = startBatchTransferButton;
        this.startTransferCurrentButton = startTransferCurrentButton;
        this.startBatchTransferButton.addEventListener("click", this.initiateBatchOperation.bind(this));
        this.startTransferCurrentButton.addEventListener("click", this.transferOneFav.bind(this));


        // 将按钮和文本框添加到浮动面板中
        leftPanel.appendChild(selectAllButton);
        leftPanel.appendChild(startBatchTransferButton);
        leftPanel.appendChild(startTransferCurrentButton);

        //在floatingPanel中添加多选按钮，将favBtns中的收藏夹名字全部列出来，让用户自己选择需要保存哪些收藏夹。favBtns中每个按钮有title属性，使用 <ul>添加到floatingPanel中，每个ul都选中
        this.ulList = [];
        for (const btn of this.favBtns) {
            const ul = document.createElement("ul");
            ul.innerHTML = "<input type='checkbox' id='checkBox' name='checkBox' value='" + btn.title + "' />" + btn.title;
            this.ulList.push(ul);
            leftPanel.appendChild(ul);
        }

        rightPanel.appendChild(outputTextBox);

        this.floatingPanel = floatingPanel;
        // this.outputTextBox.scrollTop = this.outputTextBox.scrollHeight;

        document.body.insertBefore(this.floatingPanel, document.body.firstChild);
    }


    //封装一个函数，接收一个 textarea，以及信息，然后每次将 info添加到textarea中，并且自动滚动
    appendInfoToTextarea(textarea, info) {
        // Append info to the textarea
 
        let currentDate = new Date();
        let formattedDate = currentDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        textarea.value += formattedDate + ':';
        textarea.value += info + '\n';

        // Scroll to the bottom
        textarea.scrollTop = textarea.scrollHeight;
    }

    getAllFavLinks() {
        // 获取包含所需信息的父元素
        let parentElement = document.getElementById('fav-createdList-container');
        // 获取所有包含 href 属性的 a 标签
        let links = parentElement.querySelectorAll('a[href]');
        return links;
    }

    getAllFavBtns() {
        let buttons = document.querySelectorAll('#fav-createdList-container .fav-item a');
        return buttons;
        // 模拟点击每一个按钮
        buttons.forEach(function (button) {
            button.click(); // 模拟点击
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async initiateBatchOperation() {
        // this.favBtns[0].click();
        // await this.delay(this.delayTimeShort);

        //赋值  this.selectedFavs，从 this.ulList中获取选中的收藏夹
        this.selectedFavs = [];
        for (const ul of this.ulList) {
            if (ul.children[0].checked) {
                this.selectedFavs.push(ul.children[0].value);
            }
        }

        await this.delay(this.delayTimeShort);
        this.appendInfoToTextarea(this.outputTextBox, "开始批量转移。");

        // forEach 会立即执行回调函数
        // this.favBtns.forEach(async (btn) => {
        //     console.log("button ");
        //     btn.click();
        //     await this.delay(this.delayTimeShort);
        //     // await this.transferOneFav();
        // });


        for (const btn of this.favBtns) {
            // 如果收藏夹的名字没有选中，则继续循环

            if (!(this.selectedFavs.includes(btn.title)))
                continue;
            btn.click();
            this.appendInfoToTextarea(this.outputTextBox, "开始转移收藏夹" + btn.title);
            await this.delay(this.delayTimeShort);
            await this.transferOneFav();
        }

        this.appendInfoToTextarea(this.outputTextBox, "全部转移结束");

    }

    async transferOneFav() {
        const totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');
        const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim().split(':')[0]) : 0;
        this.appendInfoToTextarea(this.outputTextBox, "一共" + totalPages + "页");

        // 点击批量操作按钮
        let batchOperationButton = document.querySelector('.filter-item.do-batch .text');
        if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
            batchOperationButton.click();
        } else {
            this.appendInfoToTextarea(this.outputTextBox, "找不到批量操作按钮或按钮文本不匹配。");

        }
        await this.delay(this.delayTimeShort);
        await this.saveCollection(1, totalPages);
    }

    async saveCollection(currentPage, totalPages) {
        if (currentPage > totalPages || totalPages == 0) {
            this.appendInfoToTextarea(this.outputTextBox, "已保存到最后一页。");
            return;
        }

        this.appendInfoToTextarea(this.outputTextBox, "正在保存第" + currentPage + "页的收藏夹内容。");

        this.appendInfoToTextarea(this.outputTextBox, "点击全选按钮");
        document.querySelector('.icon-selece-all').parentNode.click();
        await this.delay(this.delayTimeShort);

        this.appendInfoToTextarea(this.outputTextBox, "点击复制到按钮");
        document.querySelector('.icon-copy').parentNode.click();
        await this.delay(this.delayTimeShort);

        const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        const targetFavList = document.querySelectorAll('.target-favlist-container .fav-name');
        let hasSameNameFav = false;

        targetFavList.forEach(function (targetFav) {
            if (targetFav.textContent.trim() === sourceFavName) {
                hasSameNameFav = true;
                return;
            }
        });

        if (!hasSameNameFav) {
            this.appendInfoToTextarea(this.outputTextBox, "创建新的收藏夹：" + sourceFavName);
            this.appendInfoToTextarea(this.outputTextBox, "点击新建收藏夹按钮");
            document.querySelector('.fake-fav-input').click();
            await this.delay(this.delayTimeMiddle);

            this.appendInfoToTextarea(this.outputTextBox, "输入新收藏夹名称：" + sourceFavName);
            const inputText = document.querySelector('.add-fav-input');
            inputText.value = sourceFavName;
            inputText.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(this.delayTimeShort);

            this.appendInfoToTextarea(this.outputTextBox, "点击新建按钮");
            document.querySelector('.fav-add-btn').click();
        }

        await this.delay(this.delayTimeShort);

        const targetFolderName = sourceFavName;
        this.appendInfoToTextarea(this.outputTextBox, "点击目标收藏夹：" + targetFolderName);
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

        this.appendInfoToTextarea(this.outputTextBox, "点击确定");
        const panel = document.querySelector('.edit-video-modal');
        const confirmBtn = panel.querySelector('.btn-content');
        confirmBtn.click();
        await this.delay(this.delayTimeShort);

        this.appendInfoToTextarea(this.outputTextBox, "点击下一页按钮");
        const nextPageBtn = document.querySelector('.be-pager-next');
        nextPageBtn.click();
        await this.delay(this.delayTimeMiddle);
        await this.saveCollection(currentPage + 1, totalPages);
    }
}


const batchTransfer = new BatchTransfer();
