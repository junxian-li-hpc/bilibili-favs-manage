// 使用 await 和 async 实现批量转移收藏夹功能

class ControlPanel {
    constructor() {
        this.delayTimeShort = 500;
        this.delayTimeMiddle = 1000;
        // 消息类型
        this.errorCode = 0;
        this.normalCode = 1;
        this.startBatchCode = 2;
        this.startSingleCode = 3;
        this.endSingleCode = 4;
        this.endBatchCode = 5;

        this.onePageCode = 6;

        // this.favLinks = this.getAllFavLinks(); // 调用 getAllFav的返回值获得所有链接，没有用到
        this.favBtns = this.getAllFavBtns(); // 调用 getAllFav的返回值获得所有链接 
        this.selectedFavs = []

        const floatingPanel = this.createFloatingPanel();
        const leftPanel = this.createLeftPanel();
        const rightPanel = this.createRightPanel();
        const startBatchTransferButton = this.createStartBatchTransferButton();
        const startTransferCurrentButton = this.createStartTransferCurrentButton();
        const outputTextBox = this.createOutputTextBox();
        const selectAllButton = this.createSelectAllButton();
        const minimizeButton = this.createMinimizeButton();
        const destroyButton = this.createDestroyButton();
    }
}
class BatchTransfer {

    constructor() {
        this.delayTimeShort = 500;
        this.delayTimeMiddle = 1000;
        // 消息类型
        this.errorCode = 0;
        this.normalCode = 1;
        this.startBatchCode = 2;
        this.startSingleCode = 3;
        this.endSingleCode = 4;
        this.endBatchCode = 5;

        this.onePageCode = 6;

        // this.favLinks = this.getAllFavLinks(); // 调用 getAllFav的返回值获得所有链接，没有用到
        this.favBtns = this.getAllFavBtns(); // 调用 getAllFav的返回值获得所有链接 
        this.selectedFavs = []

        const floatingPanel = this.createFloatingPanel();
        const leftPanel = this.createLeftPanel();
        const rightPanel = this.createRightPanel();
        const startBatchTransferButton = this.createStartBatchTransferButton();
        const startTransferCurrentButton = this.createStartTransferCurrentButton();
        const outputTextBox = this.createOutputTextBox();
        const selectAllButton = this.createSelectAllButton();
        const minimizeButton = this.createMinimizeButton();
        const destroyButton = this.createDestroyButton();

        const ulList = this.iterateFavs();



        leftPanel.appendChild(selectAllButton);
        leftPanel.appendChild(startBatchTransferButton);
        leftPanel.appendChild(startTransferCurrentButton);
        leftPanel.appendChild(minimizeButton);
        leftPanel.appendChild(destroyButton);

        for (const ul of ulList) {
            leftPanel.appendChild(ul);
        }

        rightPanel.appendChild(outputTextBox);
        floatingPanel.appendChild(leftPanel);
        floatingPanel.appendChild(rightPanel);

        this.outputTextBox = outputTextBox;
        this.selectAllButton = selectAllButton;
        this.startBatchTransferButton = startBatchTransferButton;
        this.startTransferCurrentButton = startTransferCurrentButton;
        this.ulList = ulList;
        this.minimizeButton = minimizeButton;

        this.destroyButton = destroyButton;

        this.rightPanel = rightPanel;
        this.leftPanel = leftPanel;
        this.floatingPanel = floatingPanel;


        document.body.insertBefore(this.floatingPanel, document.body.firstChild);
    }

    createDestroyButton() {
        const destroyButton = document.createElement("button");
        destroyButton.innerText = "点我销毁";
        destroyButton.addEventListener("click", () => {
            this.floatingPanel.remove();
        });
        return destroyButton;
    }

    // Function to create a destroy button
    createMinimizeButton() {
        // Create a button element
        const minimizeButton = document.createElement("button");
        minimizeButton.innerText = "点我最小化";

        // Add click event listener to the minimizeButton
        minimizeButton.addEventListener("click", () => {
            if (minimizeButton.textContent === "点我最小化") {
                this.rightPanel.remove();
                minimizeButton.textContent = "点我打开面板";
            } else {
                this.floatingPanel.appendChild(this.rightPanel);
                document.body.insertBefore(this.floatingPanel, document.body.firstChild);
                minimizeButton.textContent = "点我最小化";
            }
        });

        return minimizeButton;
    }

    createFloatingPanel() {
        const floatingPanel = document.createElement("div");
        floatingPanel.classList.add("floating-panel");
        floatingPanel.style.position = "fixed";
        floatingPanel.style.top = "50px";
        // floatingPanel.style.right = "50px";
        floatingPanel.style.backgroundColor = "#ffffff";
        floatingPanel.style.border = "0px solid #ccc";
        floatingPanel.style.borderRadius = "5px";
        floatingPanel.style.padding = "0px";
        floatingPanel.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        floatingPanel.style.zIndex = "99999";

        //可以手动调整面板的大小
        // floatingPanel.style.resize = "both";
        // floatingPanel.style.overflow = "auto";

        //可以手动移动面板
        floatingPanel.style.userSelect = "none";
        floatingPanel.style.cursor = "move";


        let c = floatingPanel;
        // body监听移动事件
        document.body.addEventListener('mousemove', move)
        // 鼠标按下事件
        c.addEventListener('mousedown', down)
        // 鼠标松开事件
        document.body.addEventListener('mouseup', up)
        
        // 添加鼠标事件监听器以实现面板拖动
        let isDragging = false;
        let offsetX, offsetY;

        c.addEventListener("mouseup", stopDragging);

        c.addEventListener("mousemove", drag);


        function stopDragging() {
            isDragging = false;
        }

        function drag(e) {
            if (isDragging) {
                // 计算新的面板位置
                let newLeft = e.clientX - offsetX;
                let newTop = e.clientY - offsetY;

                // 获取视口的宽度和高度
                let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                let viewportHeight = window.innerHeight || document.documentElement.clientHeight;

                // 确保面板不会移动到屏幕外边
                newLeft = Math.max(0, Math.min(newLeft, viewportWidth - floatingPanel.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, viewportHeight - floatingPanel.offsetHeight));

                // 更新面板位置
                floatingPanel.style.left = newLeft + "px";
                floatingPanel.style.top = newTop + "px";
            }
        }




        // 是否开启尺寸修改
        let resizeable = false
        // 鼠标按下时的坐标，并在修改尺寸时保存上一个鼠标的位置
        let clientX, clientY
        // div可修改的最小宽高
        let minW = 580, minH = 400
        // 鼠标按下时的位置，使用n、s、w、e表示
        let direc = ''

        // 鼠标松开时结束尺寸修改
        function up() {
            resizeable = false
        }

        // 鼠标按下时开启尺寸修改
        function down(e) {
            console.log(e);
            let d = getDirection(e)
            console.log(d);
            // 当位置为四个边和四个角时才开启尺寸修改
            if (d !== '') {
                resizeable = true
                direc = d
                clientX = e.clientX
                clientY = e.clientY
            }else{
                // 开启拖动
                isDragging = true;
                offsetX = e.clientX - floatingPanel.getBoundingClientRect().left;
                offsetY = e.clientY - floatingPanel.getBoundingClientRect().top;
                
                
            }
        }

        // 鼠标移动事件
        function move(e) {
            // console.log(e);
            let d = getDirection(e)
            let cursor
            if (d === '') cursor = 'default';
            else cursor = d + '-resize';
            // 修改鼠标显示效果
            c.style.cursor = cursor;
            // 当开启尺寸修改时，鼠标移动会修改div尺寸
            if (resizeable) {
                console.log(direc, d, c.offsetHeight, c.offsetWidth, c.style.width, e.clientX, e.clientY, clientX, clientY, e.movementX, e.movementY)
                // 更新面板大小

                let newWidth = c.offsetWidth;
                let newHeight = c.offsetHeight;

                let newTop = c.offsetTop;
                let newLeft = c.offsetLeft;

                //左侧和上侧：
                // 鼠标按下的位置在左边，修改宽度
                if (direc.indexOf('w') !== -1) {
                    newWidth -= e.movementX;
                    newLeft += e.movementX;
                }
                // 鼠标按下的位置在上部，修改高度
                if (direc.indexOf('n') !== -1) {
                    newHeight -= e.movementY;
                    newTop += e.movementY;
                }

                // 鼠标按下的位置在右边，修改宽度
                if (direc.indexOf('e') !== -1) {
                    newWidth += e.movementX;

                }

                // 鼠标按下的位置在底部，修改高度
                if (direc.indexOf('s') !== -1) {
                    newHeight += e.movementY;
                }


                // 获取视口的宽度和高度
                let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                let viewportHeight = window.innerHeight || document.documentElement.clientHeight;

                // 确保面板不会移动到屏幕外边
                newLeft = Math.max(0, Math.min(newLeft, viewportWidth - floatingPanel.offsetWidth));
                newTop = Math.max(0, Math.min(newTop, viewportHeight - floatingPanel.offsetHeight));

                // 确保面板不会变得太小
                c.style.width = Math.max(minW, newWidth) + "px";
                c.style.height = Math.max(minH, newHeight) + "px";
                c.style.top = Math.max(0, newTop) + "px";
                c.style.left = Math.max(0, newLeft) + "px";



            }
        }

        // 获取鼠标所在div的位置
        function getDirection(ev) {
            let dir = '';
            if (ev.clientX - c.getBoundingClientRect().left < 15)
                dir += 'w';
            else if (c.getBoundingClientRect().right - ev.clientX < 15)
                dir += 'e';

            if (ev.clientY - c.getBoundingClientRect().top < 15)
                dir += 'n';
            else if (c.getBoundingClientRect().bottom - ev.clientY < 15)
                dir += 's';
            return dir;

        }

        return floatingPanel;
    }

    // createFloatingPanel() {
    //     const floatingPanel = document.createElement("div");
    //     floatingPanel.classList.add("floating-panel");
    //     floatingPanel.style.position = "fixed";
    //     floatingPanel.style.top = "50px";
    //     floatingPanel.style.right = "50px";
    //     floatingPanel.style.backgroundColor = "#ffffff";
    //     floatingPanel.style.border = "1px solid #ccc";
    //     floatingPanel.style.borderRadius = "5px";
    //     floatingPanel.style.padding = "10px";
    //     floatingPanel.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
    //     floatingPanel.style.zIndex = "99999";

    //     //可以手动调整面板的大小
    //     // floatingPanel.style.resize = "both";
    //     // floatingPanel.style.overflow = "auto";

    //     //可以手动移动面板
    //     floatingPanel.style.userSelect = "none";
    //     floatingPanel.style.cursor = "move";

    //     // 添加鼠标事件监听器以实现面板调整大小
    //     // floatingPanel.addEventListener("resize", resizePanel);



    //     // 添加鼠标事件监听器以实现面板拖动
    //     let isDragging = false;
    //     let offsetX, offsetY;

    //     floatingPanel.addEventListener("mousedown", startDragging);
    //     floatingPanel.addEventListener("mouseup", stopDragging);
    //     floatingPanel.addEventListener("mousemove", drag);

    //     function startDragging(e) {
    //         isDragging = true;
    //         offsetX = e.clientX - floatingPanel.getBoundingClientRect().left;
    //         offsetY = e.clientY - floatingPanel.getBoundingClientRect().top;
    //     }

    //     function stopDragging() {
    //         isDragging = false;
    //     }

    //     function drag(e) {
    //         if (isDragging) {
    //             // 计算新的面板位置
    //             let newLeft = e.clientX - offsetX;
    //             let newTop = e.clientY - offsetY;

    //             // 获取视口的宽度和高度
    //             let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    //             let viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    //             // 确保面板不会移动到屏幕外边
    //             newLeft = Math.max(0, Math.min(newLeft, viewportWidth - floatingPanel.offsetWidth));
    //             newTop = Math.max(0, Math.min(newTop, viewportHeight - floatingPanel.offsetHeight));

    //             // 更新面板位置
    //             floatingPanel.style.left = newLeft + "px";
    //             floatingPanel.style.top = newTop + "px";
    //         }
    //     }
    //     function resizePanel(e) {
    //         // 更新面板大小
    //         const newWidth = floatingPanel.offsetWidth + e.movementX;
    //         const newHeight = floatingPanel.offsetHeight + e.movementY;

    //         // 确保面板不会变得太小
    //         floatingPanel.style.width = Math.max(100, newWidth) + "px";
    //         floatingPanel.style.height = Math.max(100, newHeight) + "px";
    //     }

    //     return floatingPanel;
    // }

    createLeftPanel() {
        const leftPanel = document.createElement("div");
        leftPanel.classList.add("left-panel");
        leftPanel.style.float = "left";
        leftPanel.style.width = "40%";
        return leftPanel;
    }

    // 创建右侧面板
    createRightPanel() {
        const rightPanel = document.createElement("div");
        rightPanel.classList.add("right-panel");
        rightPanel.style.float = "right";
        rightPanel.style.width = "60%";
        return rightPanel;
    }

    iterateFavs() {
        //在floatingPanel中添加多选按钮，将favBtns中的收藏夹名字全部列出来，让用户自己选择需要保存哪些收藏夹。favBtns中每个按钮有title属性，使用 <ul>添加到floatingPanel中，每个ul都选中
        let ulList = []
        for (const btn of this.favBtns) {
            const ul = document.createElement("ul");
            ul.innerHTML = "<input type='checkbox' id='checkBox' name='checkBox' value='" + btn.title + "' />" + btn.title;
            ulList.push(ul);
        }
        return ulList;
    }

    createStartBatchTransferButton() {
        const startBatchTransferButton = document.createElement("button");
        startBatchTransferButton.textContent = "开始批量转移";
        startBatchTransferButton.classList.add("btn");
        startBatchTransferButton.style.margin = "5px";
        startBatchTransferButton.addEventListener("click", this.initiateBatchOperation.bind(this));
        return startBatchTransferButton;
    }

    createStartTransferCurrentButton() {
        const startTransferCurrentButton = document.createElement("button");
        startTransferCurrentButton.textContent = "开始转移当前收藏夹";
        startTransferCurrentButton.classList.add("btn");
        startTransferCurrentButton.style.margin = "5px";
        startTransferCurrentButton.addEventListener("click", this.transferOneFav.bind(this));

        return startTransferCurrentButton;
    }


    createOutputTextBox() {

        // 创建一个 div 元素作为可编辑区域
        const editableArea = document.createElement('div');

        // 设置可编辑区域的样式
        editableArea.style.width = '340px'; // 设置固定宽度
        editableArea.style.height = '400px'; // 设置固定高度
        editableArea.style.overflow = 'auto'; // 当内容溢出时显示滚动条
        editableArea.style.border = '1px solid #ccc'; // 边框样式
        editableArea.style.padding = '5px'; // 内边距
        editableArea.style.boxSizing = 'border-box'; // 盒模型
        editableArea.contentEditable = true; // 设置为可编辑

        return editableArea;


    }

    createSelectAllButton() {
        const selectAllButton = document.createElement("button");
        selectAllButton.textContent = "点我全选";
        selectAllButton.classList.add("btn");
        selectAllButton.style.margin = "5px";
        selectAllButton.addEventListener("click", this.toggleSelectAll.bind(this));
        return selectAllButton;
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


    //封装一个函数，接收一个 textarea，以及信息，然后每次将 info添加到textarea中，并且自动滚动
    appendInfoToTextarea(textarea, info, type = this.normalCode) {
        // Append info to the textarea

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
                textColor = 'black'; // 默认为黑色
                break;
        }

        // 使用 span 标签包裹新添加的内容，并设置相应的颜色
        const span = document.createElement('span');
        span.style.color = textColor;
        span.textContent = formattedDate + ':' + info; // 包含日期和信息内容

        // 将新内容追加到 textarea
        textarea.appendChild(span);
        textarea.appendChild(document.createElement('br')); // 换行

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
        this.appendInfoToTextarea(this.outputTextBox, "开始批量转移", this.startBatchCode);

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
            await this.delay(this.delayTimeShort);
            await this.transferOneFav();
        }

        this.appendInfoToTextarea(this.outputTextBox, "批量转移结束", this.endBatchCode);

    }

    async transferOneFav() {
        const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        const totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');
        const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim().split(':')[0]) : 0;
        this.appendInfoToTextarea(this.outputTextBox, "开始转移收藏夹" + sourceFavName + ",一共" + totalPages + "页", this.startSingleCode);

        // 点击批量操作按钮
        let batchOperationButton = document.querySelector('.filter-item.do-batch .text');
        if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
            batchOperationButton.click();
        } else {
            this.appendInfoToTextarea(this.outputTextBox, "Error!!! 找不到'批量操作'按钮或按钮文本不匹配", this.errorCode);

        }
        await this.delay(this.delayTimeShort);
        await this.saveCollection(1, totalPages);
    }

    async saveCollection(currentPage, totalPages) {
        const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        if (currentPage > totalPages || totalPages == 0) {
            this.appendInfoToTextarea(this.outputTextBox, "收藏夹" + sourceFavName + "转移结束", this.endSingleCode);
            return;
        }

        this.appendInfoToTextarea(this.outputTextBox, "正在保存第" + currentPage + "页");

        this.appendInfoToTextarea(this.outputTextBox, "点击'全选'按钮");
        document.querySelector('.icon-selece-all').parentNode.click();
        await this.delay(this.delayTimeShort);

        this.appendInfoToTextarea(this.outputTextBox, "点击'复制到'按钮");
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
            this.appendInfoToTextarea(this.outputTextBox, "创建新的收藏夹：" + sourceFavName);
            this.appendInfoToTextarea(this.outputTextBox, "点击'新建收藏夹'按钮");
            document.querySelector('.fake-fav-input').click();
            await this.delay(this.delayTimeMiddle);

            this.appendInfoToTextarea(this.outputTextBox, "输入新收藏夹名称：" + sourceFavName);
            const inputText = document.querySelector('.add-fav-input');
            inputText.value = sourceFavName;
            inputText.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(this.delayTimeShort);

            this.appendInfoToTextarea(this.outputTextBox, "点击'新建'按钮");
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

        this.appendInfoToTextarea(this.outputTextBox, "点击'确定'");
        const panel = document.querySelector('.edit-video-modal');
        const confirmBtn = panel.querySelector('.btn-content');
        confirmBtn.click();
        await this.delay(this.delayTimeShort);

        this.appendInfoToTextarea(this.outputTextBox, "点击'下一页'按钮");
        const nextPageBtn = document.querySelector('.be-pager-next');
        nextPageBtn.click();
        await this.delay(this.delayTimeMiddle);
        await this.saveCollection(currentPage + 1, totalPages);
    }
}


const bt = new BatchTransfer();
