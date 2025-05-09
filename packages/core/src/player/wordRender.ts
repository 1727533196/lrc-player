import {formattingTime, smoothScrollTo} from '../utils'
import Logger from '../logger'
import {LyricsLine, YrcLine} from '../types/type'
import {OnMapKey, WordType} from "./index";

interface Props {
  getCurrentLrcLine: () => LyricsLine
  click: (time: number, index: number) => void
  event: {[key in OnMapKey]?: () => void}
}

type Target = HTMLDivElement | HTMLSpanElement
class WordRender {
  lrcVal: LyricsLine[] | null = null
  el: Element | null = null
  props: Props
  playerItem: NodeListOf<HTMLDivElement & {children: HTMLCollectionOf<HTMLSpanElement>}>
  playerContainer: HTMLDivElement
  hintEl: HTMLDivElement | null // 时间提示元素缓存
  timer: number
  isUserWheel: boolean = false
  wordType: WordType
  constructor(props: Props) {
    this.props = props
  }

  _initEl(el: Element) {
    try {
      if (!el) {
        throw `el元素不存在：${el}`
      }
      this.el = el
    } catch (err) {
      Logger.error(err)
    }
  }
  /* 更新歌词数据源，并且渲染 */
  _updateLrc(lrc: LyricsLine[], type: WordType) {
    this.lrcVal = lrc
    this.wordType = type
    if(!this.lrcVal) {
      return Logger.error('_updateLrc：歌词解析时为空：', this.lrcVal)
    }
    this._renderLrc(this.lrcVal)
  }
  _renderLrc(lrc: LyricsLine[] | YrcLine[]) {
    if (!this.el) {
      return Logger.error(`渲染歌词时检查到el为空：${this.el}, 请确保已调用mount方法以挂载元素`)
    }

    let playerScroll = this.el.querySelector('.y-player-scroll') as HTMLDivElement
    if(!playerScroll) {
      this.playerContainer = document.createElement('div')
      this.playerContainer.className = 'y-player-container'

      playerScroll = document.createElement('div')
      playerScroll.className = 'y-player-scroll'

      this.playerContainer.appendChild(playerScroll)
      this.el.appendChild(this.playerContainer)

      this._scroll(this.playerContainer)
      this._click(playerScroll)
    }

    playerScroll!.innerHTML = lrc.map((line) => {
      if(!line.wait) {
        if(this.wordType === 'lrc') {
          return this._generateLyricsLineHtml(line as  LyricsLine)
        } else if(this.wordType === 'yrc') {
          return this._generateYrcLineHtml(line as  YrcLine)
        }
      } else {
        return this._generateWaitHtml(line)
      }
    }).join('\n')

    this.playerItem = this.el!.querySelectorAll('.y-player-container .y-player-scroll > *')

    this.playerItem.forEach(el => {
      if(el.classList.contains('y-player-item')) {
        this._mouseenter(el)
        this._mouseleave(el)
      }
    })
  }
  _generateYrcLineHtml(line: YrcLine) {
    const YrcLineHtml = `
      <div data-index=${line.index} class="y-player-item y-yrc-item">
      <span class="y-text">${line.text}</span>
</div>
    `
    return YrcLineHtml
  }
  _generateLyricsLineHtml(line: LyricsLine) {
    const lyricsLineHtml = `<div data-index=${line.index} class="y-player-item">${
      line.yrc.map((segment) => {
        const glowYrc = segment.glowYrc
        if(glowYrc) {
          return `<div class="y-glow-yrc">${glowYrc.map((glow) => {
            return `<span class="y-text">${glow.text}</span>`
          }).join('')}</div>`
        }
        return `<span class="y-text">${segment.text}</span>`
      }).join(' ')
    }</div>`

    return lyricsLineHtml
  }
  _generateWaitHtml(line: LyricsLine |  YrcLine) {
    const waitHtml = `
      <div style="height: 0;padding: 0 60px; opacity: 0" data-index=${line.index} class="y-wait-item">
        <div class="y-wait"></div>
        <div class="y-wait"></div>
        <div class="y-wait"></div>
      </div>
    `
    return waitHtml
  }
  _moveScroll(index: number, force = false) {
    if(this.isUserWheel && !force) {
      return
    }
    const curLine = this._getCurLine(index)

    if(this.playerContainer) {
      const scrollHalfHeight = this.playerContainer.clientHeight / 2
      const lineHalfHeight = curLine.clientHeight / 2
      const lineTop = curLine.offsetTop
      const top = (lineTop - (scrollHalfHeight - lineHalfHeight) + 100)

      const scroll = this.props.event.scroll
      if(scroll) {
        scroll(this.playerContainer, top)
      } else {
        smoothScrollTo(this.playerContainer, top, 400, 'power1.out')
      }
      // this.playerContainer.scrollTo({
      //   behavior: 'smooth',
      //   top
      // });
    }
  }
  _getCurLine(index: number) {
    return this.playerItem[index]
  }
  _getCurTextEls(index: number) {
    return this.playerItem[index].children
  }
  _getLrc(): LyricsLine[] {
    return this.lrcVal || []
  }
  _rednerErrorLrc(err: string) {
    if(!this.el) {
      return
    }
    let playerScroll = this.el.querySelector('.y-player-scroll')
    if(playerScroll) {
      playerScroll.innerHTML = `<div>
        <h2 style="color: darkred">${err}</h2>
      </div>`
    }
  }
  _renderTime(time: number) {
    if(!this.hintEl) {
      this.hintEl = document.createElement('div')
      this.hintEl.className = 'y-hint-time'
    }

    this.hintEl.innerText = formattingTime(time)

    return this.hintEl
  }
  _mouseenter(el: HTMLDivElement) {
    el.addEventListener('mouseenter', (event) => {
      // 获取事件触发的目标元素
      let target = event.target as Target;
      let el = this.findCorrectEl(target)

      const index = +el.dataset.index!
      const hintEl = this._renderTime(this._getLrc()[index].time * 1000)
      if(!el.contains(hintEl)) {
        el.appendChild(hintEl)
      }
    })
  }
  _mouseleave(el: HTMLDivElement) {
    el.addEventListener('mouseleave', (event) => {
      let target = event.target as Target

      if(this.hintEl && target.contains(this.hintEl)) {
        target.removeChild(this.hintEl)
      }
    })
  }
  _scroll(el: HTMLDivElement) {
    el.addEventListener('wheel', () => {
      this.isUserWheel = true

      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.isUserWheel = false
      }, 3000)
    })
  }
  _click(playerScroll: HTMLDivElement) {
    playerScroll.addEventListener('click', (event) => {
      // 获取事件触发的目标元素
      let target = event.target as Target;
      let el = this.findCorrectEl(target)

      if(el.dataset.index) {
        const index = +el.dataset!.index as number
        const time = this._getLrc()[index].time

        this.props.click(time, index)
      } else {
        Logger.error('事件处理程序click：index为空', el.dataset.index)
      }

    })
  }
  findCorrectEl(targetElement: HTMLElement) {
    let result = targetElement
    if (!targetElement.classList.contains('y-player-item')) {
      for(let i = 0; i < 5; i++) {
        targetElement = targetElement.parentElement as Target
        if(targetElement && targetElement.classList.contains('y-player-item')) {
          result = targetElement
          break
        }
      }
    }
    return result
  }
}

export default WordRender
