### 右侧面板自动更改大小的问题：
![picture 0](../images/99800ea18801780858583f5dae95248eb16435cc488426259a273697c85011f6.png)  
先放大，再缩小无法实现，猜测的原因：
rightPanel.style.width = "auto"，会自动适应内部元素的宽度，
但是内部的outputTextBox 绑定了事件，判断rightPanel大小更改时，适应其大小。

问题就出在这里：放大可以，因为 rightPanel 设置了 flex-grow: 1，所以 floatingPanel 放大， rightPanel 自动增长放大，outputTextBox 跟随绑定的事件放大。
缩小时，floatingPanel缩小，rightPanel不会缩写，因为 width="auto"， 只有它内部的outputTextBox缩小时，rightPanel才会缩小。 然而 outputTextBox 缩小的条件是：rightPanel缩小，所以就陷入了死循环。  
像OS中的死锁一样。英文名字叫做：Deadlock


```js
    this.rightPanel.style.display = "flex"
```

加上这么一句话就行了，哈哈，可能分析地不正确，但是解决了问题。


### overflow 和 flex-grow 的问题，不能自动添加scrollbar
右侧的输出框，添加内容后，会自动增长，但是不会自动添加滚动条。
但是如果先拖拽右侧面板，再添加内容，就会自动添加滚动条。
猜测是因为 floatingPanel没有设置 height， 当加载完 floatingPanel后，再设置 height，就会自动添加滚动条。
```js
    recordPanelSize() {
        this.minH = this.floatingPanel.offsetHeight;
        this.minW = this.floatingPanel.offsetWidth;
        //这很重要
        this.floatingPanel.style.width = this.minW + "px";
        this.floatingPanel.style.height = this.minH + "px";
    }
```