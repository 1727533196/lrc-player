import WordRender from './wordRender'
import Logger from '../logger'
import {LyricsLine} from '../types/type'
import EventHandler from "./eventHandler";
import '../styles/index.less'
import AnimationProcess from "./animationProcess";

interface Core {
  animationFrameId: number | null
  updateTimeStatus: 'close' | 'open' // 音乐timeupdate事件是否打开
  wordType: WordType
  timer: number
}

interface Options {
  click: (time: number, index: number) => void

}

export type WordType = 'yrc' | 'lrc'

// 需要重置的数据
const replaceable = {
  updateTimeStatus: 'close' as 'close' | 'open'  // 明确类型
}

class Player {
  audio: HTMLAudioElement
  wordRender: WordRender
  animationProcess: AnimationProcess
  eventHandler: EventHandler
  isPlaying: boolean = false
  _core: Core = {
    animationFrameId: null,
    ...replaceable,
    wordType: 'lrc',
    timer: 0,
  }
  index: number = 0 // 当前行
  lastIndex: number = 0 // 上一次的index

  constructor(options: Options) {
    this.init(options)
  }
  mount(el: Element, audio: any) {
    if(!audio) {
      return Logger.error('在调用mount方法时没用提供audio: ', audio)
    }
    this.audio = audio
    this.wordRender._initEl(el)
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
    this.wordRender = new WordRender({
      getCurrentLrcLine: this.getCurrentLrcLine,
      setTime: this.syncIndex,
      click: options.click,
    })

    this.eventHandler = new EventHandler({
      setTime: this.syncIndex,
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
      const {updateTimeStatus, wordType} = this._core
      this.isPlaying = true

      if(wordType === 'lrc') {
        this.animationProcess.dispatchAnimation('play')
        // 没有逐字歌词接力，并且updateTime还是为关闭状态时，
        //   那么这个时候除了更新歌曲就没有在开启的另一种办法了，所以这里需要手动再次开启
        const animations = this.animationProcess.getAnimations()
        if(!animations.length && updateTimeStatus === 'close') {
          this.timeupdate()
        }
      } else {
        if(updateTimeStatus === 'close') {
          this.timeupdate()
        }
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
      this.clearTimeupdate()
      this.isPlaying = false

      if(this._core.wordType === 'lrc') {
        this.animationProcess.dispatchAnimation('pause')
      } else {

      }
    } catch (e) {
      Logger.error('调用pause方法时抛出了异常：', e)
    }
  }
  updateIndex = (index: number, force = false) => {
    this.lastIndex = this.index
    this.index = index
    this.wordRender._moveScroll(index, force)
  }
  getIndex = () => {
    return this.index
  }
  syncIndex = (index?: number) => {
    let sequence = 0
    const wordType = this._core.wordType
    // 两种情况，附带index的通常是点击歌词，没有的一般是快进
    if (index) {
      this.updateIndex(index)
    } else {
      const targetIndex = this.getCurrentLrcLine().index
      this.updateIndex(targetIndex)

      // 当没有明确的index指引时，这个时候我们要找到index，并且定位到逐字
      if(wordType === 'lrc') {
        sequence = this.getLyricsIndexByCharacter(targetIndex);
      }
    }
    if(wordType === 'lrc') {
      this.animationProcess.dispatchAnimation('cancel')
    } else {

    }
    this.play()
    this.timeupdate(sequence)
  }
  getTime = () => {
    return +this.audio.currentTime.toFixed(2)
  }
  /* 更新url, 更新歌词，从而使其重新渲染  yrc 表示逐行，lrc表示逐字 */
  updateAudioLrc = async (lrc: LyricsLine[], type: 'yrc' | 'lrc') => {
    this.pause()

    this._core.wordType = type

    this.wordRender._updateLrc(lrc, type)
    this.updateIndex(0, true)
    this.uninstall()
    this.play()
    this.timeupdate()
  }
  timeupdate(sequence: number = 0) {
    let someCondition = true
    this._core.updateTimeStatus = 'open'
    const updateTime = () => {
      const currentTime = this.getTime()
      const lrc = this.wordRender._getLrc()
      const index = this.getIndex()
      const time = lrc[index].time

      if (currentTime >= time) {
        const curLineEl = this.wordRender.playerItem[index] // 当前元素
        const wordType = this._core.wordType

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
        if(wordType === 'lrc') {
          const yrc = lrc[index].yrc
          this.animationProcess.disposeLrcAnimationProcess(
            curLineEl,
            yrc,
            sequence,
          ).then(() => {
            this.updateIndex(this.getIndex() + 1)
            this.timeupdate()
          })
        } else if(wordType === 'yrc') {


          const duration = lrc[index].duration - (currentTime- time)

          curLineEl.classList.add('y-current-line')
          clearTimeout(this._core.timer)

          this._core.timer = setTimeout(() => {
            curLineEl.classList.remove('y-current-line')
            this.updateIndex(this.getIndex() + 1)
            this.timeupdate()
          }, duration * 1000)

        }


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
    clearTimeout(this._core.timer)
    cancelAnimationFrame(this._core.animationFrameId!)
  }
  // 获取当前正在进行的逐字索引, 一行歌词中的某个逐字定位
  protected getLyricsIndexByCharacter(index: number) {
    const yrc = this.wordRender._getLrc()[index]?.yrc
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
    const lrc = this.wordRender._getLrc()
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
}

export default Player
