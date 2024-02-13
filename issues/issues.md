### 右侧面板自动更改大小的问题：
![picture 0](../images/99800ea18801780858583f5dae95248eb16435cc488426259a273697c85011f6.png)  
先放大，再缩小无法实现，猜测的原因：
rightPanel.style.width = "auto"，会自动适应内部元素的宽度，
但是内部的outputTextBox 绑定了事件，判断rightPanel大小更改时，适应其大小。

问题就出在这里：放大可以，因为 rightPanel 设置了 flex-grow: 1，所以 floatingPanel 放大， rightPanel 自动增长放大，outputTextBox 跟随绑定的事件放大。
缩小时，floatingPanel缩小，rightPanel不会缩写，因为 width="auto"， 只有它内部的outputTextBox缩小时，rightPanel才会缩小。 然而 outputTextBox 缩小的条件是：rightPanel缩小，所以就陷入了死循环。  
像OS中的死锁一样。英文名字叫做：Deadlock