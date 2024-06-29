import Lrc from './lrc'
import Logger from '../logger'
import {LyricsLine} from '../types/type'
import EventHandler from "./eventHandler";
import '../styles/index.less'
import AnimationProcess from "./animationProcess";

interface Core {
  animationFrameId: number | null
  updateTimeStatus: 'close' | 'open' // 音乐timeupdate事件是否打开
}

interface Options {
  click: (time: number, index: number) => void

}

// 需要重置的数据
const replaceable = {
  updateTimeStatus: 'close' as 'close' | 'open'  // 明确类型
}

class Player {
  audio: HTMLAudioElement
  lrc: Lrc
  animationProcess: AnimationProcess
  eventHandler: EventHandler
  isPlaying: boolean = false
  _core: Core = {
    animationFrameId: null,
    ...replaceable,
  }
  index: number = 0 // 当前行
  lastIndex: number = 0 // 上一次的index

  constructor(options: Options) {
    this.init(options)
  }
  mount(el: HTMLElement, audio: any) {
    if(!audio) {
      return Logger.error('在调用mount方法时没用提供audio: ', audio)
    }
    this.audio = audio
    // 绑定事件处理方法到类的实例上
    // this.audio.addEventListener('error', this.handleAudioError)
    this.lrc._initEl(el)
  }
  uninstall = () => {
    this.clearTimeupdate();
    this.animationProcess.clearAllAnimate()
    this._core = {
      ...this._core,
      ...replaceable,
    }
  }
  protected init = (options: Options) => {
    this.lrc = new Lrc({
      getCurrentLrcLine: this.getCurrentLrcLine,
      setTime: this.setTime,
      click: options.click,
    })

    this.eventHandler = new EventHandler({
      setTime: this.setTime,
      clearTimeupdate: this.clearTimeupdate,
      getPlayStatus: this.getPlayStatus,
    })

    this.animationProcess = new AnimationProcess({
      getTime: this.getTime,
    })
  }
  getPlayStatus = () => this.isPlaying
  play = () => {
    if (this.isPlaying) {
      return
    }
    try {
      // await this.audio.play()
      this.isPlaying = true
      this.animationProcess.dispatchAnimation('play')
      // 没有逐字歌词接力，并且updateTime还是为关闭状态时，
      //   那么这个时候除了更新歌曲就没有在开启的另一种办法了，所以这里需要手动再次开启
      const {updateTimeStatus} = this._core
      const animations = this.animationProcess.getAnimations()
      if(!animations.length && updateTimeStatus === 'close') {
        this.timeupdate()
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
      // this.audio.pause()
      this.clearTimeupdate()
      this.isPlaying = false
      this.animationProcess.dispatchAnimation('pause')
    } catch (e) {
      Logger.error('调用pause方法时抛出了异常：', e)
    }
  }
  updateVolume = (volume: number) => {
    // this.audio.volume = volume
  }
  updateIndex = (index: number) => {
    this.lastIndex = this.index
    this.index = index
    this.lrc._moveScroll(index)
  }
  getIndex = () => {
    return this.index
  }
  syncIndex = (index?: number) => {
    let sequence = 0
    // 跳转时间时记得把animation清空掉，以防止play时调用
    // if(time) {
    //   // this.audio.currentTime = time
    //   cb(time)
    // }
    // 两种情况，附带index的通常是点击歌词，没有的一般是快进
    if (index) {
      this.updateIndex(index)
    } else {
      // 当没有明确的index指引时，这个时候我们要找到index，并且定位到逐字
      const targetIndex = this.getCurrentLrcLine().index
      this.updateIndex(targetIndex)
      sequence = this.getLyricsIndexByCharacter(targetIndex);
    }
    this.animationProcess.dispatchAnimation('cancel')
    this.play()
    this.timeupdate(sequence)
  }
  getTime = () => {
    return +this.audio.currentTime.toFixed(2)
  }
  /* 更新url, 更新歌词，从而使其重新渲染 */
  updateAudioLrc = async (lrc: LyricsLine[]) => {
    // 移除旧的事件监听器

    this.pause()
    this.lrc._updateLrc(lrc)
    this.updateIndex(0)

    this.uninstall()

    this.play()
    this.timeupdate()

  }
  timeupdate(sequence: number = 0) {
    let someCondition = true
    this._core.updateTimeStatus = 'open'
    const updateTime = () => {
      const currentTime = this.getTime()
      const lrc = this.lrc._getLrc()

      const index = this.getIndex()
      const curLineEl = this.lrc.playerItem[index] // 当前元素
      const yrc = lrc[index].yrc
      const time = lrc[index].time

      // console.log(index, curLineEl, yrc, time)
      //0  5 >= 6  index = 0++ 在第一个检查完之后index就为1了，实际上应该等待过渡结束后
      //1  6 >= 7  index = 1++ 同理，实际上应该等待过渡结束后
      // 不++的话会导致一直进入这个判断。解决办法：
      if (currentTime >= time) {
        if(lrc[index].wait) {
          // curLineEl.style.visibility = 'visible'
          // const [WaitFrames1, WaitOptions1] = getLrcAnimationRule(Wait_START_DURATION_1, 'waitStart1')
          // const [WaitFrames2, WaitOptions2] = getLrcAnimationRule(Wait_START_DURATION_2, 'waitStart2')
          // curLineEl.animate(WaitFrames1, WaitOptions1,).finished.then(() => {
          //   curLineEl.animate(
          //     WaitFrames2,
          //     WaitOptions2,
          //   )
          // })
        }

        someCondition = false
        this.animationProcess.disposeLrcAnimationProcess(
          curLineEl,
          yrc,
          sequence,
        ).then(() => {
          // console.log('done')
          this.updateIndex(this.getIndex() + 1)
          this.timeupdate()
        }).catch(() => {

        })


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
  protected clearTimeupdate = () => {
    this._core.updateTimeStatus = 'close'
    cancelAnimationFrame(this._core.animationFrameId!)
  }
  // 获取当前正在进行的逐字索引, 一行歌词中的某个逐字定位
  protected getLyricsIndexByCharacter(index: number) {
    const yrc = this.lrc._getLrc()[index]?.yrc
    const currentTime = this.getTime()

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
    const currentTime = this.getTime()

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
