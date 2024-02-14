// 使用 await 和 async 实现批量转移收藏夹功能

class EventListeners {

    static toggleSelectAll() {
        if (this.selectAllButton.textContent === "点我全选") {
            for (const chkbocItem of this.favCheckboxItemList) {
                chkbocItem.checkbox.checked = true;
            }
            this.selectAllButton.textContent = "点我全部取消";
        } else {
            for (const chkbocItem of this.favCheckboxItemList) {
                chkbocItem.checkbox.checked = false;
            }
            this.selectAllButton.textContent = "点我全选";
        }
    }
    static toggleSelectAll(selectAllButton, favCheckboxItemList) {
        if (selectAllButton.textContent === "点我全选") {
            for (const chkbocItem of favCheckboxItemList) {
                chkbocItem.checkbox.checked = true;
            }
            selectAllButton.textContent = "点我全部取消";
        } else {
            for (const chkbocItem of favCheckboxItemList) {
                chkbocItem.checkbox.checked = false;
            }
            selectAllButton.textContent = "点我全选";
        }
    }

    static toggleMinimize() {
        if (this.minimizeButton.textContent === "点我最小化") {
            // 记录最小化前的面板大小
            this.recordHiddenPanelSize();
            this.minimizeButton.textContent = "点我打开面板";
            // this.outputTextBox.style.width='0px'
            this.floatingPanel.style.width = this.leftPanel.offsetWidth + "px";
            // this.rightPanel.remove();

        } else {
            this.minimizeButton.textContent = "点我最小化";
            this.floatingPanel.appendChild(this.rightPanel);

        }
        // this.minimizeUpdatePanel();
    }

    // 鼠标松开时结束尺寸修改
    static stopResizeOnBody() {
        this.resizeable = false
    }
    static stopDragOnPanel() {
        this.isDragging = false;
    }


    // 鼠标按下时开启尺寸修改
    static mouseDown(e) {
        const floP = this.floatingPanel;
        let d = this.getDirection(e)
        // 当位置为四个边和四个角时才开启尺寸修改
        if (d !== '') {
            this.resizeable = true
            this.isDragging = false
            this.direction = d

        } else {
            // 开启拖动
            // 如果点中了按钮，或者点中了输入框，或者点中了 outputTextBox，不开启拖动

            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.classList.contains('output-text-box')) {
                // this.isDragging = false;
            }
            else {
                this.isDragging = true;
                this.offsetX = e.clientX - floP.getBoundingClientRect().left;
                this.offsetY = e.clientY - floP.getBoundingClientRect().top;
            }
        }
    }

    // 鼠标移动事件，修改大小
    static mouseMove(e) {
        let floP = this.floatingPanel;
        // console.log(e);
        let d = this.getDirection(e)

        // 修改鼠标显示效果
        let cursor
        if (d === '') cursor = 'default';
        else cursor = d + '-resize';
        floP.style.cursor = cursor;

        if (this.resizeable) {
            // 当开启尺寸修改时，鼠标移动会修改div尺寸
            const direc = this.direction;
            let newWidth = floP.offsetWidth;
            let newHeight = floP.offsetHeight;
            console.log("newWidth:" + newWidth + "  newHeight:" + newHeight);

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


            this.judgePanelSizeAndUpdate(newLeft, newTop, newWidth, newHeight, originTop, originLeft);



        }
    }


    static dragOnPanel(e) {
        if (this.isDragging) {
            const floP = this.floatingPanel;
            // 计算新的面板位置
            let newLeft = e.clientX - this.offsetX;
            let newTop = e.clientY - this.offsetY;

            this.judgePanelPosAndUpdate(newLeft, newTop);
        }
    }




}


class CreateElemClass {
    constructor() {
        this.name = "CreateElemClass";
    }
    getName() {
        return this.name;
    }
    static createButton(text, clickHandler, className = "btn") {
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

    static createOutputTextBox() {

        // 创建一个 div 元素作为可编辑区域
        const editableArea = document.createElement('div');

        // 设置可编辑区域的样式
        editableArea.classList.add('output-text-box');
        editableArea.style.width = '200px'; // 设置固定宽度
        // editableArea.style.height = '400px'; // 设置固定高度
        editableArea.style.border = '1px solid #ccc'; // 边框样式
        editableArea.style.padding = '5px'; // 内边距
        editableArea.style.boxSizing = 'border-box'; // 盒模型
        editableArea.contentEditable = true; // 设置为可编辑
        editableArea.style.flexGrow = "1";
        // editableArea.style.flex = "0 0 auto";

        editableArea.style.overflow = 'scroll'; // 当内容溢出时显示滚动条
        editableArea.style.overflowX = 'scroll'; // 当内容溢出时显示滚动条
        editableArea.style.maxWidth = "100%"; // 设置最大宽度以触发水平滚动条
        editableArea.style.maxHeight = "100%"; // 设置最大高度以触发垂直滚动条
        editableArea.style.minWidth = "0";
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

    static createOutputTextBoxByInput() {
        // 创建一个 input 元素作为可编辑区域
        const editableInput = document.createElement('input');

        // 设置 input 元素的类型为文本
        editableInput.type = 'text';

        // 设置 input 元素的样式
        editableInput.style.width = '340px'; // 设置固定宽度
        editableInput.style.border = '1px solid #ccc'; // 边框样式
        editableInput.style.padding = '5px'; // 内边距
        editableInput.style.boxSizing = 'border-box'; // 盒模型
        editableInput.style.flexGrow = "1"; // 占据剩余空间

        // 设置 input 元素的其他样式或属性，如最大高度等
        editableInput.style.overflowY = 'auto'; // 隐藏垂直滚动条

        return editableInput;
    }



    static createSubDiv(className, floatPos, width, height) {
        const subPanel = document.createElement("div");
        subPanel.style.flexGrow = "1";
        subPanel.style.display = 'flex';
        subPanel.style.border = "1px solid #ccc"; // 添加边界线
        if (className)
            subPanel.classList.add(className);
        if (floatPos)
            subPanel.style.float = floatPos;
        if (width)
            subPanel.style.width = width;

        if (height) {
            subPanel.style.height = height;
        }


        return subPanel;
    }
}
class CheckboxItem {
    constructor(favName) {
        this.checkboxContainer = this.createCheckboxContainer(favName);
        this.checkbox = this.checkboxContainer.querySelector("input[type='checkbox']");
        this.label = this.checkboxContainer.querySelector("label");
        this.inputText = this.checkboxContainer.querySelector("input[type='text']");
    }

    createCheckboxContainer(favName) {
        const checkboxContainer = document.createElement("div");
        const checkboxDiv = CreateElemClass.createSubDiv("signal-panel");
        checkboxDiv.style.justifyContent = "space-between";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = `checkbox-${favName}`;

        // Create label element for the checkbox
        const label = document.createElement("label");
        label.textContent = favName;
        label.setAttribute("for", `checkbox-${favName}`);

        // Create input text element
        const inputText = document.createElement("input");
        inputText.type = "text";
        inputText.value = favName;
        // inputtext 居中显示
        inputText.style.textAlign = "center";

        // Append elements to checkboxDiv
        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        checkboxDiv.appendChild(inputText);

        // Append checkboxDiv to the container
        checkboxContainer.appendChild(checkboxDiv);

        return checkboxContainer;
    }

    getLabelValue() {
        return this.label.textContent;
    }

    getInputTextValue() {
        return this.inputText.value;
    }

    getCheckboxValue() {
        return this.checkbox.checked;
    }
}


class ControlPanel {
    constructor(favBtns, favulList) {
        this.createMembers(favBtns, favulList);
        this.leftPanel = this.createLeftPanel();
        this.rightPanel = this.createRightPanel();
        this.floatingPanel = this.createFloatingPanel();


    }

    createMembers(favBtns, favulList) {
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


        // 添加鼠标事件监听器以实现面板拖动
        this.isDragging = false;
        // 是否开启尺寸修改
        this.resizeable = false


        this.favBtns = favBtns;
        this.favulList = favulList;
        this.favCheckboxItemList = this.createFavCheckboxItems();
    }

    createLeftPanel() {
        this.btnContainer = this.cretaeButtonContainer();
        // this.favContainer = this.createFavContainer();
        this.favContainer = this.createFavPanel();
// 这里很神奇，因为btnContainer是一个普通 <div>， 里面包含了一个 btnPanel 的 <div>
// 但是我把 favContainer 直接赋值为 favPanel， 不再单独包裹一个 <div>， 因为普通的 div 好像会占据全部的高度。我给 favPanel设置的是可以有滚动条，所以不能原本是多高就多高，要可以滚动
        const leftPanel = CreateElemClass.createSubDiv("left-panel", "left");
        leftPanel.appendChild(this.btnContainer);
        leftPanel.appendChild(this.favContainer);
        leftPanel.style.flexGrow = "0";
        // leftPanel.style.display = "flex"

        // left and right set background color
        leftPanel.style.backgroundColor = "green";

        // leftPanel.style.color = "green";
        return leftPanel;
    }

    createRightPanel() {
        this.outputTextBox = CreateElemClass.createOutputTextBox();
        //OUTPUTTEXTBOX set color 粉色
        this.outputTextBox.style.backgroundColor = "pink";

        const rightPanel = CreateElemClass.createSubDiv("right-panel", "right");
        rightPanel.appendChild(this.outputTextBox);

        //让 this.rightPanel 的宽度随着this.floatingPanel的大小更改而改变
        rightPanel.style.flexGrow = "1";
        rightPanel.style.display = "flex"

        rightPanel.style.backgroundColor = "yellow";
        // this.rightPanel.style.color = "yellow";
        return rightPanel;
    }

    cretaeButtonContainer() {
        const btnContainer = document.createElement("div");
        this.btnPanel = this.createButtonPanel();
        btnContainer.appendChild(this.btnPanel);
        return btnContainer;
    }

    createButtonPanel() {
        const btnPanel = document.createElement("div");
        btnPanel.className = "btn-panel";
        // subPanel.style.flexGrow = "1";
        btnPanel.style.display = 'flex';
        btnPanel.style.border = "1px solid #ccc"; // 添加边界线

        //set background color purple
        btnPanel.style.backgroundColor = "purple";
        btnPanel.style.flexDirection = 'column';

        const selectAllButton = CreateElemClass.createButton("点我全选");
        selectAllButton.addEventListener("click", () => {
            EventListeners.toggleSelectAll(selectAllButton, this.favCheckboxItemList);
        });
        // const selectAllButton = CreateElemClass.createButton("点我全选", EventListeners.toggleSelectAll.bind(this));

        const startBatchTransferButton = CreateElemClass.createButton("开始批量转移");
        const startTransferCurrentButton = CreateElemClass.createButton("开始转移当前收藏夹");
        const minimizeButton = CreateElemClass.createButton("点我最小化", EventListeners.toggleMinimize.bind(this), "minimize-btn");
        const destroyButton = CreateElemClass.createButton('点我销毁', () => {
            this.floatingPanel.remove();
            //    从网页中移除面板，销毁this
            delete this;



        });

        btnPanel.appendChild(selectAllButton);
        btnPanel.appendChild(startBatchTransferButton);
        let showAll = false;
        if (showAll) {
            btnPanel.appendChild(startTransferCurrentButton); // 不需要这个
        }
        btnPanel.appendChild(minimizeButton);
        btnPanel.appendChild(destroyButton);

        this.selectAllButton = selectAllButton;
        this.minimizeButton = minimizeButton;
        this.startBatchTransferButton = startBatchTransferButton;
        this.startTransferCurrentButton = startTransferCurrentButton;

        // this.destroyButton = destroyButton;

        return btnPanel;
    }

    createFavContainer() {
        const favContainer = document.createElement("div");
        this.favPanel = this.createFavPanel();
        favContainer.appendChild(this.favPanel);
        return favContainer;
    }

    createFavPanel() {
        const favPanel = CreateElemClass.createSubDiv("fav-panel");
        // set background color
        favPanel.style.backgroundColor = "red";

        // favPanel自动添加滚动条
        favPanel.style.overflow = "auto";
        favPanel.style.flexDirection = 'column';

        // Create a div to contain the text elements
        const textContainer = document.createElement("div");

        const textDiv = CreateElemClass.createSubDiv("div");
        // Apply flexbox styling to the container to lay out its children horizontally
        textDiv.style.justifyContent = "space-between";

        const srcText = document.createElement("h3");
        // srcText.style.color = "red";
        srcText.style.fontWeight = "bold";
        srcText.textContent = "源收藏夹";

        const dstText = document.createElement("h3");
        // dstText.style.color = "red";
        dstText.style.fontWeight = "bold";
        dstText.textContent = "目标收藏夹";

        // Append h3 elements to the div container
        textDiv.appendChild(srcText);
        textDiv.appendChild(dstText);

        // Append the div container to favPanel
        textContainer.appendChild(textDiv);
        favPanel.appendChild(textContainer);

        for (const chkboxItem of this.favCheckboxItemList) {
            favPanel.appendChild(chkboxItem.checkboxContainer);
        }
        return favPanel;
    }

    createFavCheckboxItems() {
        let favCheckboxItemList = [];
        for (const ul of this.favulList) {
            const chkboxItem = new CheckboxItem(ul.textContent);
            favCheckboxItemList.push(chkboxItem);
        }
        return favCheckboxItemList;
    }

    getSelectedItems() {
        let selectedItems = [];
        for (const chkboxItem of this.favCheckboxItemList) {
            if (chkboxItem.getCheckboxValue()) {
                selectedItems.push(chkboxItem);
            }
        }
        return selectedItems;
    }

    recordPanelSize() {

        const fPW = this.floatingPanel.offsetWidth;
        const fPH = this.floatingPanel.offsetHeight;

        if (this.originRPW === undefined) {

            this.originRPW = this.rightPanel.offsetWidth;
            this.originRPH = this.rightPanel.offsetHeight;

            this.originBtnContainerW = this.btnContainer.offsetWidth;
            this.originBtnContainerH = this.btnContainer.offsetHeight;

            this.originFavContainerW = this.favContainer.offsetWidth;
            this.originFavContainerH = this.favContainer.offsetHeight;

            this.originFPW = fPW;
            this.originFPH = fPH;

            this.minW = this.originFPW;
            this.minW = this.leftPanel.offsetWidth;
            this.minH = this.originFPH;
            this.minH = this.btnPanel.offsetHeight;
            console.log('原始按钮面板高度:' + this.btnPanel.offsetHeight)
        }


        // console.log("fPW:" + fPW + "  fPH:" + fPH);
        // console.log("this.originRPW:" + this.originRPW + "  this.originRPH:" + this.originRPH);

        //这很重要
        this.floatingPanel.style.width = fPW + "px";
        this.floatingPanel.style.height = fPH + "px";

    }

    recordHiddenPanelSize() {
        this.hiddenRPW = this.rightPanel.offsetWidth;
        this.hiddenRPH = this.rightPanel.offsetHeight;
    }


    minimizeUpdatePanel() {
        if (this.rightPanel.offsetWidth === 0) {
            //隐藏了右手面板
            this.minW = this.minW - this.originRPW;
            const newW = this.floatingPanel.offsetWidth - this.hiddenRPW;
            // this.outputTextBox.style.width = '0px';
            this.floatingPanel.style.width = newW + "px";
        } else {
            //显示了右手面板
            this.minW = this.originFPW;
            console.log("最小化前rightW:" + this.hiddenRPW +"现在的面板宽度:" + this.floatingPanel.offsetWidth);
            this.floatingPanel.style.width = this.floatingPanel.offsetWidth + this.hiddenRPW + "px";
            console.log("显示后总宽度:" + this.floatingPanel.offsetWidth);
        }
    }

    judgePanelSizeAndUpdate(newLeft, newTop, newWidth, newHeight, originTop, originLeft) {

        const floP = this.floatingPanel;
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


        // 确保面板不会变得太小
        if (newWidth < this.minW) {
            newWidth = this.minW;
            newLeft = originLeft;
        }

        console.log("最小height: " + this.minH, " 新height: " + newHeight);
        if (newHeight < this.minH) {
            newHeight = this.minH;
            newTop = originTop;
        }
        // const panelRect = floP.getBoundingClientRect();
        // const contentRect = floP.getContentRect(); 
        // // Implement getContentRect() to calculate the dimensions of the content within the panel

        // // Calculate the new dimensions of the panel after resizing
        //  newWidth = Math.max(newWidth, contentRect.width);
        //  newWidth = Math.max(newHeight, contentRect.height);



        floP.style.width = newWidth + "px";
        floP.style.height = newHeight + "px";

        floP.style.top = newTop + "px";
        floP.style.left = newLeft + "px";


    }
    judgePanelPosAndUpdate(newLeft, newTop) {

        const floP = this.floatingPanel;
        // 获取视口的宽度和高度
        let viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        let viewportHeight = window.innerHeight || document.documentElement.clientHeight;


        // 确保面板不会移动到屏幕外边
        newLeft = Math.max(0, Math.min(newLeft, viewportWidth - floP.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, viewportHeight - floP.offsetHeight));


        // 更新面板位置
        floP.style.left = newLeft + "px";
        floP.style.top = newTop + "px";

        //也可以就让用户移动到外边，但是一松手就会回到里边
    }

    createFloatingPanel() {
        // div可修改的最小宽高
        const floP = document.createElement("div");
        // set background color
        floP.style.backgroundColor = "blue";
        floP.classList.add("floating-panel");
        floP.style.position = "fixed";
        floP.style.top = "50px";
        floP.style.left = "50px";
        floP.style.backgroundColor = "#ffffff";
        floP.style.border = "0px solid #ccc";
        floP.style.borderRadius = "5px";
        floP.style.padding = "0px";
        floP.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.1)";
        floP.style.zIndex = "99999";

        // floP.style.overflow = "auto";
        floP.style.display = "flex";


        //可以手动移动面板
        // floP.style.userSelect = "none";
        // floP.style.cursor = "move";


        floP.addEventListener('mousedown', EventListeners.mouseDown.bind(this));
        floP.addEventListener("mouseup", EventListeners.stopDragOnPanel.bind(this));
        floP.addEventListener("mousemove", EventListeners.dragOnPanel.bind(this));

        // body监听移动事件
        document.body.addEventListener('mousemove', EventListeners.mouseMove.bind(this))
        document.body.addEventListener('mouseup', EventListeners.stopResizeOnBody.bind(this));



        floP.appendChild(this.leftPanel);
        floP.appendChild(this.rightPanel);
        return floP;
    }

    // 获取鼠标所在div的位置
    getDirection(ev) {
        const floP = this.floatingPanel;
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
        this.favulList = this.iterateFavs(); // 调用 iterateFavs的返回值获得所有链接

        this.selectedItems = []
        // 创建控制面板-----------------------------------------------------
        this.ctl = new ControlPanel(this.favBtns, this.favulList);
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
    iterateFavs() {
        //在floatingPanel中添加多选按钮，将favBtns中的收藏夹名字全部列出来，让用户自己选择需要保存哪些收藏夹。favBtns中每个按钮有title属性，使用 <ul>添加到floatingPanel中，每个ul都选中
        let favulList = []
        for (const btn of this.favBtns) {
            const ul = document.createElement("ul");
            ul.innerHTML = "<input type='checkbox' id='checkBox' name='checkBox' value='" + btn.title + "' />" + btn.title;
            favulList.push(ul);
        }
        return favulList;
    }


    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    async initiateBatchOperation() {
        // this.favBtns[0].click();
        // await this.delay(this.delayTimeShort);

        //赋值  this.selectedItems，从 this.ulList中获取选中的收藏夹
        this.selectedItems = this.ctl.getSelectedItems();

        await this.delay(this.delayTimeShort);
        this.ctl.appendInfo("开始批量转移", this.startBatchCode);

        for (const item of this.selectedItems) {
            let srcFav = item.getLabelValue();
            let dstFav = item.getInputTextValue();

            // get the btn has srcFav
            let btn = null;
            this.favBtns.forEach(function (button) {
                if (button.title === srcFav) {
                    btn = button;
                    return;
                }
            });
            btn.click();
            await this.delay(this.delayTimeShort);
            await this.transferOneFav(srcFav, dstFav);
        }

        this.ctl.appendInfo("批量转移结束", this.endBatchCode);

    }

    async transferOneFav(sourceFavName, targetFavName) {

        if (sourceFavName === undefined) {
            const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        }
        if (targetFavName === undefined) {
            const targetFavName = sourceFavName;
        }

        const totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');
        const totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim().split(':')[0]) : 0;

        this.ctl.appendInfo("开始转移收藏夹" + sourceFavName + "到" + targetFavName, ",一共" + totalPages + "页", this.startSingleCode);

        // 点击批量操作按钮
        let batchOperationButton = document.querySelector('.filter-item.do-batch .text');
        if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
            batchOperationButton.click();
        } else {
            this.ctl.appendInfo("Error!!! 找不到'批量操作'按钮或按钮文本不匹配", this.errorCode);

        }
        await this.delay(this.delayTimeShort);
        await this.saveCollection(1, totalPages, sourceFavName, targetFavName); // 结束会自动调用下一页，直到最后一页保存结束
    }

    async saveCollection(currentPage, totalPages, sourceFavName, targetFavName) {
        if (sourceFavName === undefined) {
            const sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();
        }
        if (targetFavName === undefined) {
            const targetFavName = sourceFavName;
        }

        if (currentPage > totalPages || totalPages == 0) {
            this.ctl.appendInfo("收藏夹" + sourceFavName + "转移到" + targetFavName + "结束", this.endSingleCode);
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
            if (targetFav.textContent.trim() === targetFavName) {
                hasSameNameFav = true;
                return;
            }
        });

        if (!hasSameNameFav) {
            this.ctl.appendInfo("创建新的收藏夹：" + targetFavName);
            this.ctl.appendInfo("点击'新建收藏夹'按钮");
            document.querySelector('.fake-fav-input').click();
            await this.delay(this.delayTimeMiddle);

            this.ctl.appendInfo("输入新收藏夹名称：" + targetFavName);
            const inputText = document.querySelector('.add-fav-input');
            inputText.value = targetFavName;
            inputText.dispatchEvent(new Event('input', { bubbles: true }));
            await this.delay(this.delayTimeShort);

            this.ctl.appendInfo("点击'新建'按钮");
            document.querySelector('.fav-add-btn').click();
        }

        await this.delay(this.delayTimeShort);

        this.ctl.appendInfo("点击目标收藏夹：" + targetFavName);
        const favListContainer = document.querySelector('.target-favlist-container');
        const favItems = favListContainer.querySelectorAll('.target-favitem');

        favItems.forEach(function (item) {
            const folderNameElement = item.querySelector('.fav-name');
            if (folderNameElement && folderNameElement.textContent.trim() === targetFavName) {
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
        await this.saveCollection(currentPage + 1, totalPages, sourceFavName, targetFavName);
    }
}


setTimeout(function () {
    let bt = new BatchTransfer()
}, 2000);
