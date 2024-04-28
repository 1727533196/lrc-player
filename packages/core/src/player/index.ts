import Lrc from './lrc'
import Logger from '../logger'
import { LyricsLine, Yrc } from '../types/type'

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
  protected curLineAllTextEl: HTMLCollectionOf<HTMLDivElement> | null = null // 当前元素
  protected curLrcLine: LyricsLine | null = null // 当前逐字歌词
  protected lastAnimations: Array<Animation> = [] // 上一行动画实例集合
  protected curAnimations: Array<Animation> = [] // 当前行动画实例集合
  protected curLrcIndex: number = 0 // 当前行进行到的逐字歌词索引
  protected animation: Animation | null = null
  constructor(el: HTMLElement) {
    this.lrc = new Lrc(el, {
      getCurrentLrcLine: this.getCurrentLrcLine,
      updateTime: this.updateTime,
    })
    this.audio = new Audio()
    // 绑定事件处理方法到类的实例上
  }
  play = async () => {
    if (this.isPlaying) {
      return
    }
    try {
      await this.audio.play()
      this.timeupdate()
      this.isPlaying = true
      if(this.animation) {
        this.animation.play()
      }
    } catch (e) {
      Logger.error('调用play方法时抛出了异常：', e)
      return e
    }
  }
  pause = () => {
    if (!this.isPlaying) {
      return
    }
    try {
      this.audio.pause()
      this.clearTimeupdate()
      this.isPlaying = false
      if(this.animation) {
        this.animation.pause()
      }
    } catch (e) {
      Logger.error('调用pause方法时抛出了异常：', e)
    }
  }
  updateVolume = (volume: number) => {
    this.audio.volume = volume
  }
  updateIndex = (index: number) => {
    this.index = index
    this.lastAnimations.forEach(animation => {
      animation.cancel()
    })
    this.lrc._moveScroll(index)
  }
  getIndex = () => {
    return this.index
  }
  updateTime = (time: number, index?: number) => {
    if (!this.audio.src) {
      return
    }
    this.audio.currentTime = time
    if (index) {
      this.updateIndex(index)
    } else {
      this.updateIndex(this.getCurrentLrcLine().index)
    }
  }
  /* 更新url, 更新歌词，从而使其重新渲染 */
  updateAudioUrl = (url: string, lrc: string) => {
    // 移除旧的事件监听器
    this.audio.removeEventListener('canplaythrough', () =>
      this.onCanPlayThroug(),
    )

    this.audio.src = url
    this.updateIndex(0)
    this.pause()
    this.lrc._updateLrc(lrc)

    // 监听audio是否加载完毕
    this.audio.addEventListener('canplaythrough', () => this.onCanPlayThroug())
  }
  timeupdate() {
    const updateTime = () => {
      const currentTime = +this.audio.currentTime.toFixed(2)
      const lrc = this.lrc._getLrc()

      const index = this.getIndex()
      this.curLrcLine = lrc[index] // 当前逐字歌词
      const curLineEl = this.lrc.playerItem[index] // 当前元素

      //0  5 >= 6  index = 0++ 在第一个检查完之后index就为1了，实际上应该等待过渡结束后
      //1  6 >= 7  index = 1++ 同理，实际上应该等待过渡结束后
      // 不++的话会导致一直进入这个判断。解决办法：
      if (currentTime >= this.curLrcLine.time) {
        curLineEl.classList.add('y-current-line')
        this.curLineAllTextEl =
          curLineEl.children as HTMLCollectionOf<HTMLDivElement>

        this.disposeAnimationProcess(
          this.curLineAllTextEl,
          this.curLrcLine.yrc,
          0,
          (index, animate) => {
            this.curLrcIndex = index
            this.animation = animate
          },
        ).then((animations) => {
          this.lastAnimations = animations as Array<Animation>
          this.lastAnimations.forEach(animation => {
            animation.cancel()
          })
          curLineEl.classList.remove('y-current-line')
        })

        this.updateIndex(this.getIndex() + 1)
      }

      this._core.animationFrameId = requestAnimationFrame(updateTime)
    }

    // 取消上一次请求
    cancelAnimationFrame(this._core.animationFrameId!)

    // 发起新的请求
    this._core.animationFrameId = requestAnimationFrame(updateTime)
  }
  protected disposeAnimationProcess(
    els: HTMLCollectionOf<HTMLDivElement>,
    yrcRule: Yrc[],
    index: number,
    onChange?: (index: number, animate: Animation) => void,
  ): Promise<Array<Animation | string>> {
    const curContextAnimations: Array<Animation> = []
    return new Promise((resolve, reject) => {
      const process = (index: number) => {
        if (!els) {
          return reject(`disposeAnimationProcess：els元素为空, value: ${els}`)
        }
        if (!yrcRule) {
          return reject(
            `disposeAnimationProcess：yrcRule为空, value: ${yrcRule}`,
          )
        }
        if (index >= yrcRule.length) {
          return resolve(curContextAnimations)
        }
        // 当前逐字元素
        const textEl = els[index]
        const curYrcRule = yrcRule[index]
        const glowYrc = curYrcRule.glowYrc
        // 处理辉光歌词
        if (glowYrc) {
          for (let o = 0; o < glowYrc.length; o++) {}
        }

        const [keyframes, options] = this.getLrcAnimationRule(
          curYrcRule.transition * 1000,
        )
        const animate = textEl.animate(keyframes, options)
        textEl.animate(
          [{ transform: 'translateY(0px)' }, { transform: 'translateY(-2px)' }],
          {
            duration: 700,
            fill: 'forwards',
          },
        )
        curContextAnimations.push(animate)
        onChange?.(index, animate)

        // 在动画完成后执行处理
        animate.finished.then(() => {

          process(++index)
        })
      }
      process(index)
    })
  }
  protected getLrcAnimationRule(
    duration: number,
  ): [Keyframe[], KeyframeAnimationOptions] {
    return [
      [{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }],
      {
        duration,
        fill: 'forwards',
      },
    ]
  }
  protected clearTimeupdate() {
    cancelAnimationFrame(this._core.animationFrameId!)
  }
  protected getCurrentLrcLine() {
    const lrc = this.lrc._getLrc()
    const currentTime = +this.audio.currentTime.toFixed(2)

    return lrc.find((item, index) => {
      // 获取第一行
      if (index === 0 && currentTime <= item.time) {
        return item
      }
      const nextItem = lrc[index + 1]
      // 获取最后一行
      if (!nextItem) {
        return item
      }
      if (currentTime >= item.time && currentTime < nextItem.time) {
        return item
      }
    }) as LyricsLine
  }
  protected async onCanPlayThroug() {
    try {
      await this.play()
    } catch (error) {
      Logger.error('更新歌词时播放失败：', error)
    }
  }
}

export default Player
