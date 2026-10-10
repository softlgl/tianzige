### 田字格

原生 html+css+js 开发的字帖生成小工具，无需安装依赖，无任何构建流程。

#### 介绍

用 html 绘制的带拼音的田字格字帖。

在文本框输入汉字，页面会自动把每个汉字拆分到田字格的每一行里，并自动标注拼音（含多音字处理），按照标准 A4 规格排版，可直接打印或导出。

#### 功能

- 拼音标注：自动生成拼音并在四线三格中显示，支持多音字
- 格子样式：田字格 / 米字格切换
- 字号调节：60% ~ 100% 比例字号
- 描红设置：可选择每字描红 0 ~ 5 个或整行描红
- 笔顺图：可开关，在示范格旁展示分步笔顺小图；点击生字还可查看笔顺动画演示
- 保存导出：导出为图片 / PDF，或直接打印
- 表头：可填写姓名、日期

#### 效果图

![页面展示](https://github.com/softlgl/tianzige/blob/main/img/%E6%95%88%E6%9E%9C%E5%9B%BE.png)

米字格 + 整行描红：

![米字格整行描红](https://github.com/softlgl/tianzige/blob/main/img/%E6%95%88%E6%9E%9C%E5%9B%BE-%E7%B1%B3%E5%AD%97%E6%A0%BC.png)

点击生字查看笔顺动画演示：

![笔顺演示](https://github.com/softlgl/tianzige/blob/main/img/%E6%95%88%E6%9E%9C%E5%9B%BE-%E7%AC%94%E9%A1%BA%E6%BC%94%E7%A4%BA.png)

#### 使用方法

由于浏览器 `file://` 协议的同源策略会限制导出功能，请通过本地静态服务器运行：

- VS Code：安装 Live Server 插件，右键 `src/tianzige.html` → Open with Live Server
- Node.js：在项目根目录执行 `npx http-server src -p 8931`，然后访问 <http://localhost:8931/tianzige.html>
