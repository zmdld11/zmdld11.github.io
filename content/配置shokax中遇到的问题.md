---
title: 配置shokax中遇到的问题
date: 2026-02-22 10:25:30
tags: [技术,难题]
categories: [杂谈, 技术]
comment: false
reward: false
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

`- /`为source文件夹，需要根据实际情况新建文件夹，能正确读取即可。

### 更新

实测并不需要6张图，只要有图就行，创建images.yml作为文章图，images_index.yml作为头图即可。

## 搜索功能线上无法使用

由于 Hexo 对于 ESM 的支持存在严重缺陷，而 Pagefind 仅支持 ESM 格式，ShokaX 无法在主题中内置其自动索引流程，你必须在每次构建后使用 CLI 进行索引，在每次`hexo g`完成后使用`pnpm dlx pagefind --site public`进行手动索引。

我以为写在package.json的GitHub page是能自动部署的（汗）。

### 解决办法：

打开/.github/workflows/pages.yml，在build的steps中Build和Upload Pages artifact中间加入：

```yml
- name: Build Pagefind search index
  run: pnpm dlx pagefind --site public
```

GitHub page将自动部署。

## 给音乐播放器nyx-player添加淡入淡出效果

shokax用的nya-player真心蛮好配的，config里true一下添加一下歌单链接就行了，但是无后座启动暂停着实有点难绷，得加入暂停的淡入淡出功能。

实现淡入淡出只要修改\themes\shokax\source\js\_app的player.ts即可。将原先的player.ts替换为如下：

```ts
import { CONFIG } from './globals/globalVars'
import 'nyx-player/style'

// 音频淡入淡出工具函数（支持取消）
const fadeAudio = (
  audio: HTMLAudioElement,
  targetVolume: number,
  duration: number = 500
): { promise: Promise<void>; cancel: () => void } => {
  let timer: any = null
  let cancelled = false

  const promise = new Promise<void>((resolve) => {
    const startVolume = audio.volume
    const volumeDiff = targetVolume - startVolume
    const steps = 20
    const stepDuration = duration / steps
    let currentStep = 0

    timer = setInterval(() => {
      if (cancelled) {
        clearInterval(timer)
        resolve()
        return
      }
      currentStep++
      audio.volume = startVolume + volumeDiff * (currentStep / steps)

      if (currentStep >= steps) {
        clearInterval(timer)
        audio.volume = targetVolume
        resolve()
      }
    }, stepDuration)
  })

  const cancel = () => {
    cancelled = true
    if (timer) clearInterval(timer)
  }

  return { promise, cancel }
}

export const initAudioPlayer = async function () {
  const urls = CONFIG.audio.map((item) => ({
    name: item.title,
    url: item.list[0],
  }))

  const { initPlayer } = await import('nyx-player')
  initPlayer(
    '#player',
    '#showBtn',
    urls,
    '#playBtn',
    'html[data-theme="dark"]',
    'shokax'
  )

  // 等待 audio 元素出现
  const checkAudio = setInterval(() => {
    const audioEl = document.querySelector<HTMLAudioElement>(
      '#MusicPlayerRoot audio'
    )
    if (audioEl) {
      clearInterval(checkAudio)
      enhanceAudioWithFade(audioEl)
    }
  }, 100)
}

function enhanceAudioWithFade(audioEl: HTMLAudioElement) {
  const originalPause = audioEl.pause.bind(audioEl)

  let currentFade: { cancel: () => void } | null = null
  let targetVolume = audioEl.volume // 用户设定的目标音量
  let isFading = false // 是否正在淡入淡出

  const cancelCurrentFade = () => {
    if (currentFade) {
      currentFade.cancel()
      currentFade = null
    }
    isFading = false
  }

  // 监听音量变化，更新目标音量（仅在非淡入淡出且非暂停时）
  audioEl.addEventListener('volumechange', () => {
    if (!isFading && !audioEl.paused) {
      targetVolume = audioEl.volume
    }
  })

  // 监听 play 事件（捕获阶段），开始淡入
  audioEl.addEventListener(
    'play',
    () => {
      // 取消任何正在进行的淡入淡出
      cancelCurrentFade()

      // 如果当前音量已经是目标音量，无需淡入（例如从暂停恢复且音量没变）
      if (audioEl.volume === targetVolume) {
        return
      }

      isFading = true
      // 强制从 0 开始淡入，确保平滑
      audioEl.volume = 0

      // 使用微任务或 setTimeout 确保音量设置生效，并避免与浏览器内部冲突
      setTimeout(async () => {
        if (!isFading) return // 可能被取消
        const fade = fadeAudio(audioEl, targetVolume, 300)
        currentFade = fade
        await fade.promise
        if (isFading) {
          isFading = false
          currentFade = null
        }
      }, 0)
    },
    { capture: true } // 捕获阶段优先执行
  )

  // 重写 pause 方法，先淡出再暂停
  audioEl.pause = async function () {
    // 如果已经暂停，忽略
    if (audioEl.paused) return

    cancelCurrentFade()
    isFading = true

    // 淡出到 0
    const fade = fadeAudio(audioEl, 0, 300)
    currentFade = fade
    await fade.promise

    // 确保淡出完成后真正暂停
    if (isFading) {
      originalPause.call(audioEl)
      isFading = false
      currentFade = null
    }
  }
}
```

