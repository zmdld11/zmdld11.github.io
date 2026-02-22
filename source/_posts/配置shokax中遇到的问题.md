---
title: 配置shokax中遇到的问题
date: 2026-02-22 10:25:30
tags: [技术,难题]
---

# 配置shokaX中遇到的问题

第一次配置hexo主题，被图片卡了大半天。

## 报错```image_list must have at least 6 items```

### 具体描述：

按照使用ShokaX即食罐头安装

```shell
git clone https://github.com/theme-shoka-x/shokax-can --depth=1
cd shokax-can
pnpm install
hexo s # 如果报错更换为 pnpm dlx hexo s
```

会在创建过程中出现以下报错：
```shell
image_list must have at least 6 items
    at randomBG (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\themes\shokax\scripts\helpers\engine.js:19:13)
    at Object.<anonymous> (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\themes\shokax\scripts\helpers\engine.js:81:12)
    at eval (eval at wrap (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\pug-runtime@3.0.1\node_modules\pug-runtime\wrap.js:6:10), <anonymous>:482:14)
    at template (eval at wrap (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\pug-runtime@3.0.1\node_modules\pug-runtime\wrap.js:6:10), <anonymous>:977:7)
    at _View._compiled (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\hexo@7.3.0_chokidar@3.6.0\node_modules\hexo\dist\theme\view.js:120:67)
    at _View.render (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\hexo@7.3.0_chokidar@3.6.0\node_modules\hexo\dist\theme\view.js:37:21)
    at C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\hexo@7.3.0_chokidar@3.6.0\node_modules\hexo\dist\hexo\index.js:60:29
    at tryCatcher (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\bluebird@3.7.2\node_modules\bluebird\js\release\util.js:16:23)
    at C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\bluebird@3.7.2\node_modules\bluebird\js\release\method.js:15:34
    at RouteStream._read (C:\Users\ROG\Desktop\MyFilm\MyBlog\shokax-can\node_modules\.pnpm\hexo@7.3.0_chokidar@3.6.0\node_modules\hexo\dist\hexo\router.js:43:9)
    at Readable.read (node:internal/streams/readable:737:12)
    at resume_ (node:internal/streams/readable:1260:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:89:21)
```

### 解决办法：

在```shokax-can/source/_data```中新建```images.yml```，输入图片路径

```txt
- /images/xxx.jpg
- /images/xxx.png
... (至少6张图片)
```

并在source文件夹下新建images文件夹，将图片文件放入（文件名需要一一对应）。

```- /```为source文件夹，需要根据实际情况新建文件夹，能正确读取即可。
