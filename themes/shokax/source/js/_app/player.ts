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