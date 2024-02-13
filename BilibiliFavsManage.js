// 使用 await 和 async 实现批量转移收藏夹功能

class ControlPanel {
    constructor(favBtns) {
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
        // this.leftPanel = this.createSubPanel("left-panel", "left", this.leftWidth);
        this.leftPanel.appendChild(btnPanel);
        this.leftPanel.appendChild(favPanel);



        this.rightPanel = this.createSubPanel("right-panel", "right");
        this.rightPanel.style.flexGrow = "1";
        this.rightPanel.style.display = "flex"
        // this.rightPanel.style.overflow = "auto";
        //让 this.rightPanel 的宽度随着this.floatingPanel的大小更改而改变


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
        //这很重要
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
            //将this.rightPanel从floatingPanel中移除
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
        //不需要边距
        button.style.margin = "0px";
        button.style.padding = '0px 0px';
        button.style.fontSize = '14px';
        //设置宽、高
        button.style.width = '150px';
        button.style.height = '40px';

        //修改和上边按钮的边距
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
        // 添加边界线
        subPanel.style.border = "1px solid #ccc";
        return subPanel;
    }


    createOutputTextBox() {

        // 创建一个 div 元素作为可编辑区域
        const editableArea = document.createElement('div');

        // 设置可编辑区域的样式
        editableArea.style.width = '340px'; // 设置固定宽度
        // editableArea.style.height = '400px'; // 设置固定高度
        editableArea.style.border = '1px solid #ccc'; // 边框样式
        editableArea.style.padding = '5px'; // 内边距
        editableArea.style.boxSizing = 'border-box'; // 盒模型
        editableArea.contentEditable = true; // 设置为可编辑
        editableArea.style.flexGrow = "1";
        // editableArea.style.flex = "0 0 auto";

        editableArea.style.overflow = 'scroll'; // 当内容溢出时显示滚动条
        // editableArea.style.overflowx = 'auto'; // 当内容溢出时显示滚动条
        // editableArea.style.maxWidth = "100%"; // 设置最大宽度以触发水平滚动条
        editableArea.style.maxHeight = "100%"; // 设置最大高度以触发垂直滚动条
        // editableArea.style.minWidth = "0";
        editableArea.style.minHeight = "0";


        // 通过 flex实现了，所以不需要事件了
        // 监听panel大小变化事件，并相应调整editableArea大小
        // const resizeObserver = new ResizeObserver(entries => {
        //     for (let entry of entries) {
        //         const { width, height } = entry.contentRect;
        //         editableArea.style.width = width + 'px';
        //         editableArea.style.height = height + 'px';
        //         console.log('right panel size:' + width + '  ' + height);
        //     }
        // });

        // resizeObserver.observe(this.rightPanel);

        return editableArea;


    }


    createFloatingPanel() {
        // div可修改的最小宽高

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

        // floatingPanel.style.overflow = "auto";
        floatingPanel.style.display = "flex";


        //让floatingPanel自适应内容


        //可以手动移动面板
        floatingPanel.style.userSelect = "none";
        floatingPanel.style.cursor = "move";


        let floP = floatingPanel;
        floP.addEventListener('mousedown', down)
        floP.addEventListener("mouseup", stopDragging);
        floP.addEventListener("mousemove", drag);

        // body监听移动事件
        document.body.addEventListener('mousemove', move.bind(this))
        document.body.addEventListener('mouseup', up)

        // 添加鼠标事件监听器以实现面板拖动
        let isDragging = false;
        let offsetX, offsetY;

        // 是否开启尺寸修改
        let resizeable = false
        // 鼠标按下时的坐标，并在修改尺寸时保存上一个鼠标的位置
        // let clientX, clientY

        // 鼠标按下时的位置，使用n、s、w、e表示
        let direc = ''

        // 鼠标松开时结束尺寸修改
        function up() {
            resizeable = false
        }
        function stopDragging() {
            isDragging = false;
        }


        // 鼠标按下时开启尺寸修改
        function down(e) {
            // console.log(e);
            let d = getDirection(e)
            // console.log(d);
            // 当位置为四个边和四个角时才开启尺寸修改
            if (d !== '') {
                resizeable = true
                isDragging = false
                direc = d

            } else {
                // 开启拖动
                isDragging = true;
                offsetX = e.clientX - floatingPanel.getBoundingClientRect().left;
                offsetY = e.clientY - floatingPanel.getBoundingClientRect().top;


            }
        }

        // 鼠标移动事件，修改大小
        function move(e) {
            let floP = this.floatingPanel;
            // console.log(e);
            let d = getDirection(e)
            let cursor
            if (d === '') cursor = 'default';
            else cursor = d + '-resize';
            // 修改鼠标显示效果
            floP.style.cursor = cursor;
            // 当开启尺寸修改时，鼠标移动会修改div尺寸
            if (resizeable) {

                let newWidth = floP.offsetWidth;
                let newHeight = floP.offsetHeight;

                let originTop = floP.offsetTop;
                let originLeft = floP.offsetLeft;
                let newTop = originTop;
                let newLeft = originLeft;

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


                // 确保面板不会变得太小
                if (newWidth < this.minW) {
                    newWidth = this.minW;
                    newLeft = originLeft;
                }

                if (newHeight < this.minH) {
                    newHeight = this.minH;
                    newTop = originTop;
                }

                // 并且要判断放大后是否会造成窗口溢出，如果溢出则不放大，比如鼠标从左侧拉伸，先缩小，缩小很多，这时候因为有最小面板控制逻辑，所以鼠标跑到了右边，这时候不松手，再向左放大，鼠标可以向左很多，导致面板跑到了左边，再继续放大，因为Left不变，所以面板会向右跑，这时候就会溢出


                // 所以需要判断的逻辑是：如果面板会跑到屏幕外边，则不修改面板大小


                // 获取视口的宽度和高度
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

                //也可以就让用户移动到外边，但是一松手就会回到里边
            }
        }

        // 获取鼠标所在div的位置
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
        //封装一个函数，接收一个 textarea，以及信息，然后每次将 info添加到textarea中，并且自动滚动
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


}
class BatchTransfer {

    constructor() {
        this.usage = "Hi，这是一个Bilibili 收藏夹管理工具，可以批量转移保存其他人的收藏夹视频，也可以批量转移自己的收藏夹视频（还未实现）。";
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

        this.ctl = new ControlPanel(this.favBtns);
        this.floatingPanel = this.ctl.floatingPanel;

        this.ctl.startBatchTransferButton.addEventListener("click", this.initiateBatchOperation.bind(this));
        this.ctl.startTransferCurrentButton.addEventListener("click", this.transferOneFav.bind(this));


        document.body.insertBefore(this.floatingPanel, document.body.firstChild);
        this.ctl.recordPanelSize();
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
        for (const ul of this.ctl.ulList) {
            if (ul.children[0].checked) {
                this.selectedFavs.push(ul.children[0].value);
            }
        }

        await this.delay(this.delayTimeShort);
        this.ctl.appendInfo("开始批量转移", this.startBatchCode);

        for (const btn of this.favBtns) {
            // 如果收藏夹的名字没有选中，则继续循环
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

        // 点击批量操作按钮
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


document.addEventListener("DOMContentLoaded", function () {
    // 在页面加载完毕后执行您的脚本
    // 例如，您可以在这里操作页面元素
    const bt = new BatchTransfer();
});
