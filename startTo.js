// 使用setTimeout
// 创建开始批量转移按钮元素
var startBatchTransferButton = document.createElement("button");
startBatchTransferButton.textContent = "开始批量转移";
startBatchTransferButton.style.fontSize = "20px";
startBatchTransferButton.style.padding = "10px 20px";
startBatchTransferButton.style.margin = "20px";
startBatchTransferButton.style.cursor = "pointer";

// 将按钮添加到页面主体
document.body.appendChild(startBatchTransferButton);

// 定义一个 Promise 包装的 setTimeout 函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 添加点击事件监听器
startBatchTransferButton.addEventListener("click", function () {
    // 获取最大页码数
    var totalPagesElement = document.querySelector('.be-pager-item[title^="最后一页"]');
    var totalPages = totalPagesElement ? parseInt(totalPagesElement.textContent.trim().split(':')[0]) : 0;
    console.log("一共" + totalPages + "页");

    // 从第一页开始保存收藏夹内容
    initiateBatchOperation(totalPages);
});

// 开始批量操作
function initiateBatchOperation(totalPages) {
    currentPage = 1;
    // 点击批量操作按钮
    var batchOperationButton = document.querySelector('.filter-item.do-batch .text');
    if (batchOperationButton && batchOperationButton.textContent.trim() === "批量操作") {
        batchOperationButton.click();

        // 等待批量操作按钮激活
        setTimeout(function () {
            saveCollection(currentPage, totalPages);
        }, 1000);

    } else {
        console.log("找不到批量操作按钮或按钮文本不匹配。");
    }
}




// 保存收藏夹内容
async function saveCollection(currentPage, totalPages) {
    // 如果已经保存到最后一页，则退出
    if (currentPage > totalPages || totalPages == 0) {
        console.log("已保存到最后一页。");
        return;
    }

    // 点击全选
    console.log("正在保存第" + currentPage + "页的收藏夹内容。")
    document.querySelector('.icon-selece-all').parentNode.click();

    // 等待全选按钮激活
    setTimeout(function () {
        // 点击复制
        document.querySelector('.icon-copy').parentNode.click();
        setTimeout(function () {
            // 获取被转移收藏夹的名字
            var sourceFavName = document.querySelector('.favInfo-details .fav-name').textContent.trim();

            // 获取自己的收藏夹列表
            var targetFavList = document.querySelectorAll('.target-favlist-container .fav-name');
            var hasSameNameFav = false;

            // 检查自己的收藏夹列表中是否有和被转移收藏夹名字一样的收藏夹
            targetFavList.forEach(function (targetFav) {
                if (targetFav.textContent.trim() === sourceFavName) {
                    hasSameNameFav = true;
                    return;
                }
            });

            // 如果没有同名的收藏夹，则创建一个新的收藏夹
            if (!hasSameNameFav) {
                // 点击新建收藏夹按钮
                console.log("正在创建新的收藏夹：" + sourceFavName);
                document.querySelector('.fake-fav-input').click();

                // 等待输入框出现
                setTimeout(function () {
                    // 输入收藏夹名字
                    var inputText = document.querySelector('.add-fav-input');
                    inputText.value = sourceFavName;
                    inputText.dispatchEvent(new Event('input', { bubbles: true }));

                    // var newBtn = document.querySelector('.fav-add-btn');
                    // newBtn.click();

                    // 点击新建按钮
                    setTimeout(function () {
                        document.querySelector('.fav-add-btn').click();
                        console.log("点击新建按钮完成");
                        console.log(document.querySelector('.fav-add-btn'));
                    }, 1000);
                    // 等待2秒钟，确保新建完成
                }, 500); // 等待2秒钟，确保输入框出现
            }
            //要点击收藏夹的名字

            // 获取收藏夹列表容器元素
            var favListContainer = document.querySelector('.target-favlist-container');
            // 获取所有收藏夹项元素
            var favItems = favListContainer.querySelectorAll('.target-favitem');

            // 定义目标收藏夹名字
            var targetFolderName = sourceFavName;

            // 遍历收藏夹项元素
            favItems.forEach(function (item) {
                // 获取收藏夹名字元素
                var folderNameElement = item.querySelector('.fav-name');
                if (folderNameElement && folderNameElement.textContent.trim() === targetFolderName) {
                    // 找到目标收藏夹，模拟单击
                    folderNameElement.click();
                    console.log("已点击收藏夹：" + targetFolderName);
                    // 在这里可以添加你想要执行的其他操作
                    // 结束循环
                    return;

                }
            });


            // // 点击确定
            setTimeout(function () {
                var panel = document.querySelector('.edit-video-modal');
                var confirmBtn = panel.querySelector('.btn-content');
                confirmBtn.click();
            }, 500);

        }, 500);

    });


    var nextPageBtn = document.querySelector('.be-pager-next');
    nextPageBtn.click();
    await delay(500); // 等待500毫秒，确保批量操作按钮已激活
    await saveCollection(currentPage + 1, totalPages);
}
