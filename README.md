> This is a fork project from [**pen**](https://github.com/utatti/pen).
（这是fork自[**pen**](https://github.com/utatti/pen)的一个项目。）

在原作者的基础上做了一定改写：

+ 引入`jsx`，重写了主要文件。
+ 变更了使用的部分依赖，主要包含`babel`、`eslint`和`mocha`等相关配置。
+ 绘制作为静态资源服务器时的页面样式。
+ 添加了作为静态资源服务器时对文件夹的支持。

```bash
npm install -g @everseenflash/mypen
# preview one markdown file
mypen xxx.md
# watch current directory (can be used by npx commands without install globally)
npx @everseenflash/mypen
```
