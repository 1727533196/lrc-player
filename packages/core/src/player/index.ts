import Lrc from './lrc'
import Logger from '../logger'
import {LyricsFragment, LyricsLine, Yrc} from '../types/type'
import EventHandler from "./eventHandler";
import {FLOAT_END_DURATION, FLOAT_START_DURATION} from "../enum";
import {getLrcAnimationRule, isString} from "../utils";
import '../styles/index.less'

interface Core {
  animationFrameId: number | null
  curAnimations: WeakMap<object, CurContextAnimations> // 动画实例集合
  curLrcIndex: number // 当前行进行到的逐字歌词索引
  animation: Animation | null
}

type CurContextAnimations = {
  float: Array<Animation>
  schedule: Array<Animation>
}

class Player {
  audio: HTMLAudioElement
  lrc: Lrc
  isPlaying: boolean = false
  _core: Core = {
    animationFrameId: null,
    curAnimations: new WeakMap(),
    curLrcIndex: 0,
    animation: null,
  }
  index: number = 0 // 当前行
  lastIndex: number = 0 // 上一次的index

  constructor(el: HTMLElement) {
    this.lrc = new Lrc(el, {
      getCurrentLrcLine: this.getCurrentLrcLine,
      setTime: this.setTime,
    })
    const eventHandler = new EventHandler({
      setTime: this.setTime,
      clearTimeupdate: this.clearTimeupdate,
      isPlaying: this.isPlaying,
    })
    console.log('eventHandler', eventHandler)
    this.audio = new Audio()
    // 绑定事件处理方法到类的实例上
    this.audio.addEventListener('error', this.handleAudioError)
  }
  play = async () => {
    if (this.isPlaying) {
      return
    }
    try {
      await this.audio.play()
      this.isPlaying = true
      if(this._core.animation) {
        this._core.animation.play()
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
      if(this._core.animation) {
        this._core.animation.pause()
      }
    } catch (e) {
      Logger.error('调用pause方法时抛出了异常：', e)
    }
  }
  updateVolume = (volume: number) => {
    this.audio.volume = volume
  }
  updateIndex = (index: number) => {
    this.lastIndex = this.index
    this.index = index
    this.lrc._moveScroll(index)
  }
  getIndex = () => {
    return this.index
  }
  setTime = async (options: {
    time?: number
    index?: number
  }) => {
    if (!this.audio.src) {
      return
    }
    let sequence = 0
    // 跳转时间时记得把animation清空掉，以防止play时调用
    if(options.time) {
      this.audio.currentTime = options.time
    }
    // 两种情况，附带index的通常是点击歌词，没有的一般是快进
    if (options.index) {
      this.updateIndex(options.index)
    } else {
      // 当没有明确的index指引时，这个时候我们要找到index，并且定位到逐字
      const targetIndex = this.getCurrentLrcLine().index
      this.updateIndex(targetIndex)
      sequence = this.getLyricsIndexByCharacter(targetIndex);
    }
    this._core.animation?.cancel()
    this._core.animation = null
    await this.play()
    this.timeupdate(sequence)
  }
  /* 更新url, 更新歌词，从而使其重新渲染 */
  updateAudioUrl = (url: string, lrc: string) => {
    // 移除旧的事件监听器
    this.audio.removeEventListener('loadedmetadata', this.onCanPlayThroug)

    this.audio.src = url
    this.pause()
    this.lrc._updateLrc(lrc)
    this.updateIndex(0)

    this._core = {
      ...this._core,
      curAnimations: new WeakMap(),
      curLrcIndex: 0,
      animation: null,
    }

    // 监听audio是否加载完毕
    this.audio.addEventListener('loadedmetadata', this.onCanPlayThroug)
  }
  timeupdate(sequence: number = 0) {
    let someCondition = true
    const updateTime = () => {
      const currentTime = +this.audio.currentTime.toFixed(2)
      const lrc = this.lrc._getLrc()

      const index = this.getIndex()
      const curLineEl = this.lrc.playerItem[index] // 当前元素
      const yrc = lrc[index].yrc

      //0  5 >= 6  index = 0++ 在第一个检查完之后index就为1了，实际上应该等待过渡结束后
      //1  6 >= 7  index = 1++ 同理，实际上应该等待过渡结束后
      // 不++的话会导致一直进入这个判断。解决办法：
      if (currentTime >= lrc[index].time) {
        curLineEl.classList.add('y-current-line')

        this.disposeAnimationProcess(
          curLineEl.children,
          yrc,
          sequence,
          (index, animate) => {
            this._core.curLrcIndex = index
            this._core.animation = animate
          },
        ).then((animations) => {
          this._core.curAnimations.set(yrc, {
            float: animations.float,
            schedule: animations.schedule,
          });

          this.updateIndex(this.getIndex() + 1)
          this.timeupdate()
        }).catch((animations) => {

          if(isString(animations)) {
            console.error(animations)
          } else {
            // 获取当前的 yrc 对应的数组
            this._core.curAnimations.set(yrc, {
              float: animations.float,
              schedule: animations.schedule,
            });
          }
        }).finally(() => {
          curLineEl.classList.remove('y-current-line')
          sequence = 0
          this.canceledLastAnimation(yrc)
          this._core.curAnimations.delete(yrc)
        })

        someCondition = false
      }

      this._core.animationFrameId = requestAnimationFrame(() => {
        if(someCondition) {
          updateTime()
        }
      })
    }

    // 取消上一次请求
    this.clearTimeupdate()

    // 发起新的请求
    this._core.animationFrameId = requestAnimationFrame(updateTime)
  }
  protected disposeAnimationProcess(
    els: HTMLCollectionOf<HTMLSpanElement>,
    yrcRule: Yrc[] | LyricsFragment[],
    index: number,
    onChange?: (index: number, animate: Animation) => void,
  ): Promise<CurContextAnimations> {
    if (!els) {
      return Promise.reject(`disposeAnimationProcess：els元素为空, value: ${els}`)
    }
    if (!yrcRule) {
      return Promise.reject(
        `disposeAnimationProcess：yrcRule为空, value: ${yrcRule}`,
      )
    }

    const curContextAnimations: CurContextAnimations = {
      float: [],
      schedule: [],
    }
    // 取消正在进行的相同动画
    const animations = this._core.curAnimations.get(yrcRule);
    if (animations) {
      animations.schedule.forEach(animation => {
        animation.cancel();
      });
      animations.float.forEach(animation => {
        animation.cancel();
      });
    }

    // 如果序列不是从0开始，则表示此次是快进操作，需要将序列前置添加上完成样式
    if(index !== 0) {
      const [keyframes, options] = getLrcAnimationRule(0, 'lrc',)
      const [floatKeyFrames, floatOptions] = getLrcAnimationRule(FLOAT_START_DURATION, 'floatStart')

      for(let i = 0; i < index; i++) {
        const scheduleAnimate = els[i].animate(keyframes, options)
        const floatAnimate = els[i].animate(floatKeyFrames, floatOptions)
        curContextAnimations.schedule.push(scheduleAnimate)
        curContextAnimations.float.push(floatAnimate)

        onChange?.(index, scheduleAnimate)
      }
    }
    return new Promise((resolve, reject) => {
      const process = async (index: number) => {
        if (index >= yrcRule.length) {
          return resolve(curContextAnimations)
        }
        // 当前逐字元素
        const textEl = els[index]
        const curYrcRule = yrcRule[index]

        // 处理辉光歌词
        if('glowYrc' in curYrcRule && curYrcRule.glowYrc) {
          const glowYrc = curYrcRule.glowYrc

          return this.disposeAnimationProcess(
            textEl.children as HTMLCollectionOf<HTMLSpanElement>,
            glowYrc,
            0,
            onChange,
          ).then((animations) => {
            curContextAnimations.float.push(...animations.float)
            curContextAnimations.schedule.push(...animations.schedule)
            process(++index)
          }).catch((animations) => {
            if(isString(animations)) {
              console.error(animations)
            } else {
              // 获取当前的 yrc 对应的数组
              curContextAnimations.float.push(...animations.float)
              curContextAnimations.schedule.push(...animations.schedule)

              reject(curContextAnimations)
            }
          })
        }

        const delayTime = +(+this.audio.currentTime.toFixed(2) - curYrcRule.cursor).toFixed(2)
        const transition = delayTime > 0 ? (curYrcRule.transition - delayTime) * 1000 : curYrcRule.transition * 1000

        const scheduleAnimate = textEl.animate(...getLrcAnimationRule(transition, 'lrc',))
        const floatAnimate = textEl.animate(...getLrcAnimationRule(FLOAT_START_DURATION, 'floatStart'))
        textEl.setAttribute('data-is-transition', 'true')

        curContextAnimations.schedule.push(scheduleAnimate)
        curContextAnimations.float.push(floatAnimate)
        onChange?.(index, scheduleAnimate)

        // 在动画完成后执行处理
        scheduleAnimate.finished.then(() => {
          process(++index)
        }).catch(() => {
          return reject(curContextAnimations)
        })
      }
      process(index)
    })
  }
  protected canceledLastAnimation(key: object) {
    const animations = this._core.curAnimations.get(key)
    if(animations) {
      animations.schedule.forEach(animation => {
        animation.cancel()
      })

      const [floatKeyFrames, floatOptions] = getLrcAnimationRule(FLOAT_END_DURATION, 'floatEnd')
      animations.float.forEach(animation => {
        if(animation.effect) {
          // @ts-ignore
          const targetElement = animation.effect.target as HTMLSpanElement
          targetElement.animate(floatKeyFrames, floatOptions).finished.then(() => {
            animation.cancel()
          })
        }
      })
    }
  }
  protected clearTimeupdate = () => {
    cancelAnimationFrame(this._core.animationFrameId!)
  }
  // 获取当前正在进行的逐字索引
  protected getLyricsIndexByCharacter(index: number) {
    const yrc = this.lrc._getLrc()[index]?.yrc
    const currentTime = +this.audio.currentTime.toFixed(2)

    if(yrc) {
      return yrc.findIndex((item, index) => {
        if (index === 0 && currentTime <= item.cursor) {
          return item
        }
        const nextItem = yrc[index + 1]
        // 获取最后一行
        if (!nextItem) {
          return item
        }
        if (currentTime >= item.cursor && currentTime < nextItem.cursor) {
          return item
        }
      })
    }

    return 0
  }
  // 获取当前行
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
  protected onCanPlayThroug = async () => {
    try {
      await this.play()
      this.timeupdate()
    } catch (error) {
      Logger.error('更新歌词时播放失败：', error)
    }
  }
  protected handleAudioError = () => {
    const error = this.audio.error;
    if (error) {
      switch (error.code) {
        case error.MEDIA_ERR_NETWORK:
          this.lrc._rednerErrorLrc('网络错误，无法下载音频。')
          Logger.error('网络错误，无法下载音频。');
          break;
        case error.MEDIA_ERR_DECODE:
          this.lrc._rednerErrorLrc('音频解码失败。')
          Logger.error('音频解码失败。');
          break;
        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          this.lrc._rednerErrorLrc('音频格式不支持。')
          Logger.error('音频格式不支持。');
          break;
        default:
          this.lrc._rednerErrorLrc('音频加载出错。')
          Logger.error('音频加载出错。');
          break;
      }
    }
  };
}

export default Player
