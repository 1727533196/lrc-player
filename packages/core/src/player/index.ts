import Lrc from './lrc'
import Logger from "../logger";
import {LyricsLine} from "../types/type";

interface Core {
  animationFrameId: number | null
}

class Player {
  audio: HTMLAudioElement
  lrc: Lrc
  isPlaying: boolean = false
  _core: Core = {
    animationFrameId: null,
  }
  index: number = 0 // 当前行
  constructor(el: HTMLElement) {
    this.lrc = new Lrc(el, {
      getCurrentLrcLine: () => this.getCurrentLrcLine()
    })
    this.audio = new Audio()
    // 绑定事件处理方法到类的实例上
  }
  play = async () => {
    if(this.isPlaying) {
      return
    }
    try {
      await this.audio.play()
      this.timeupdate()
      this.isPlaying = true
    } catch (e) {
      Logger.error('调用play方法时抛出了异常：', e)
      return e
    }
  }
  pause = () => {
    if(!this.isPlaying) {
      return
    }
    try {
      this.audio.pause()
      this.clearTimeupdate()
      this.isPlaying = false
    } catch (e) {
      Logger.error('调用pause方法时抛出了异常：', e)
    }
  }
  updateVolume = (volume: number) => {
    this.audio.volume = volume
  }
  /* 更新url, 更新歌词，从而使其重新渲染 */
  updateAudioUrl = (url: string, lrc: string) => {
    // 移除旧的事件监听器
    this.audio.removeEventListener("canplaythrough", () => this.onCanPlayThroug(lrc));

    this.audio.src = url
    this.index = 0
    this.pause()

    // 监听audio是否加载完毕
    this.audio.addEventListener("canplaythrough", () => this.onCanPlayThroug(lrc));
  }
  clearTimeupdate() {
    cancelAnimationFrame(this._core.animationFrameId!);
  }
  timeupdate() {
    const updateTime = () => {
      const currentTime = +this.audio.currentTime.toFixed(2)
      const lrc = this.lrc._getLrc()
      const curLrcLine = lrc[this.index]
      const curLineEl = this.lrc.playerItem[this.index]

      if(currentTime >= curLrcLine.time) {
        curLineEl.classList.add('y-current-line')
        const curLineAllTextEl = curLineEl.children as HTMLCollectionOf<HTMLDivElement>
        for(let i = 0; i < curLineAllTextEl.length; i++) {
          const textEl = curLineAllTextEl[i]
          textEl.style.animation = `Test ${curLrcLine.yrc[i].transition}s linear`
        }
        this.index++
      }

      this._core.animationFrameId = requestAnimationFrame(updateTime);
    };

    // 取消上一次请求
    cancelAnimationFrame(this._core.animationFrameId!);

    // 发起新的请求
    this._core.animationFrameId = requestAnimationFrame(updateTime);
  }
  getCurrentLrcLine() {
    const lrc = this.lrc._getLrc()
    const currentTime = +this.audio.currentTime.toFixed(2)

    return lrc.find((item, index) => {
      // 获取第一行
      if(index === 0 && currentTime <= item.time) {
        return item
      }
      const nextItem = lrc[index+1]
      // 获取最后一行
      if(!nextItem) {
        return item
      }
      if(currentTime >= item.time && currentTime < nextItem.time) {
        return item
      }
    }) as LyricsLine
  }
  protected async onCanPlayThroug(lrc: string) {
    try {
      await this.play();
      this.lrc._updateLrc(lrc)
    } catch (error) {
      Logger.error('更新歌词时播放失败：', error)
    }
  }
}

export default Player
