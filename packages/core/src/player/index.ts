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
  protected curLineAllTextEl: HTMLCollectionOf<HTMLDivElement> | null = null // 当前元素
  protected curLrcLine: LyricsLine | null = null // 当前逐字歌词
  protected curAnimation: Animation | null = null // 当前动画实例
  protected curAnimations: Array<Animation> = []
  constructor(el: HTMLElement) {
    this.lrc = new Lrc(el, {
      getCurrentLrcLine: this.getCurrentLrcLine,
      updateTime: this.updateTime,
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
      this.curAnimation?.play()
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
      this.curAnimation?.pause()
    } catch (e) {
      Logger.error('调用pause方法时抛出了异常：', e)
    }
  }
  updateVolume = (volume: number) => {
    this.audio.volume = volume
  }
  updateTime = (time: number, index?: number) => {
    this.audio.currentTime = time
    if(index) {
      this.index = index
    } else {
      this.index = this.getCurrentLrcLine().index
    }
    this.curAnimations.forEach(animation => {
      animation.cancel()
    })
    console.log('this.index', this.index)
  }
  /* 更新url, 更新歌词，从而使其重新渲染 */
  updateAudioUrl = (url: string, lrc: string) => {
    // 移除旧的事件监听器
    this.audio.removeEventListener("canplaythrough", () => this.onCanPlayThroug());

    this.audio.src = url
    this.index = 0
    this.pause()
    this.lrc._updateLrc(lrc)

    // 监听audio是否加载完毕
    this.audio.addEventListener("canplaythrough", () => this.onCanPlayThroug());
  }
  timeupdate() {
    let processed = false;
    const updateTime = () => {
      const currentTime = +this.audio.currentTime.toFixed(2)
      const lrc = this.lrc._getLrc()

      // const nextLrcLine = lrc[this.index+1]
      this.curLrcLine = lrc[this.index] // 当前逐字歌词
      const curLineEl = this.lrc.playerItem[this.index] // 当前元素

      //0  5 >= 6  index = 0++ 在第一个检查完之后index就为1了，实际上应该等待过渡结束后
      //1  6 >= 7  index = 1++ 同理，实际上应该等待过渡结束后
      // 不++的话会导致一直进入这个判断。解决办法：
      if(currentTime >= this.curLrcLine.time && !processed) {
        processed = true; // 标记为已处理

        console.log('this.index', this.index)

        curLineEl.classList.add('y-current-line')
        this.curLineAllTextEl = curLineEl.children as HTMLCollectionOf<HTMLDivElement>

        this.disposeAnimationProcess(0).then(() => {
          curLineEl.classList.remove('y-current-line')
          this.index++
          processed = false
        })

      }

      this._core.animationFrameId = requestAnimationFrame(updateTime);
    };

    // 取消上一次请求
    cancelAnimationFrame(this._core.animationFrameId!);

    // 发起新的请求
    this._core.animationFrameId = requestAnimationFrame(updateTime);
  }
  protected disposeAnimationProcess(index: number) {
    return new Promise((resolve, reject) => {
      const process = (index: number) => {
        if(!this.curLineAllTextEl) {
          return reject('disposeAnimationProcess：curLineAllTextEl元素为空')
        }
        if(!this.curLrcLine) {
          return reject('disposeAnimationProcess：curLrcLine为空')
        }
        if(index >= this.curLrcLine.yrc.length) {
          return resolve('')
        }
        // 当前逐字元素
        const textEl = this.curLineAllTextEl[index]
        const curYrcRule = this.curLrcLine.yrc[index]
        const glowYrc = curYrcRule.glowYrc
        // 处理辉光歌词
        if(glowYrc) {
          for(let o = 0; o < glowYrc.length; o++) {

          }
        }

        const [keyframes, options] = this.getLrcAnimationRule(curYrcRule.transition * 1000)
        const animate = textEl.animate(keyframes, options)
        textEl.animate([
          {transform: 'translateY(0px)'},
          {transform: 'translateY(-2px)'},
        ],   {
          duration: 700,
          fill: "forwards",
        })
        this.curAnimation = animate
        this.curAnimations.push(animate)

        // 在动画完成后执行处理
        animate.finished.then(() => {
          process(++index);
        });
      }
      process(index)
    })
  }
  protected getLrcAnimationRule(duration: number): [Keyframe[], KeyframeAnimationOptions] {
    return [
      [
        {backgroundSize: '0% 100%'},
        {backgroundSize: '100% 100%'},
      ],
      {
        duration,
        fill: "forwards",
      }
    ]
  }
  protected clearTimeupdate() {
    cancelAnimationFrame(this._core.animationFrameId!);
  }
  protected getCurrentLrcLine() {
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
  protected async onCanPlayThroug() {
    try {
      await this.play();
    } catch (error) {
      Logger.error('更新歌词时播放失败：', error)
    }
  }
}

export default Player
