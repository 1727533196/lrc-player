import {html, parseYrc} from '../utils'
import Logger from '../logger'
import { LyricsLine } from '../types/type'

interface Utils {
  getCurrentLrcLine: () => LyricsLine
  setTime: (time: number, index?: number) => void
}

type Target = HTMLDivElement | HTMLSpanElement
class Lrc {
  lrcVal: LyricsLine[] | null = null
  el: HTMLElement | null = null
  utils: Utils
  playerItem: NodeListOf<HTMLDivElement & {children: HTMLCollectionOf<HTMLSpanElement>}>
  playerContainer: HTMLDivElement
  constructor(el: HTMLElement, utils: Utils) {
    this._initEl(el)
    this.utils = utils
  }

  _initEl(el: HTMLElement) {
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
  _updateLrc(lrc: string) {
    this.lrcVal = parseYrc(lrc)
    console.log('this.lrcVal', this.lrcVal)
    if(!this.lrcVal) {
      return Logger.error('_updateLrc：歌词解析时为空：', this.lrcVal)
    }
    this._renderLrc(this.lrcVal)
  }
  _renderLrc(lrc: LyricsLine[]) {
    if (!this.el) {
      return Logger.error(`渲染歌词时检查到el为空：${this.el}`)
    }

    let playerScroll = this.el.querySelector('.y-player-scroll') as HTMLDivElement
    if(!playerScroll) {
      this.playerContainer = document.createElement('div')
      this.playerContainer.className = 'y-player-container'

      playerScroll = document.createElement('div')
      playerScroll.className = 'y-player-scroll'

      this.playerContainer.appendChild(playerScroll)
      this.el.appendChild(this.playerContainer)

      playerScroll.addEventListener('click', (event) => {
        // 获取事件触发的目标元素
        const targetElement = event.target as Target;
        let el = targetElement
        if (targetElement.classList.contains('y-text')) {
          el = targetElement.parentElement as Target;
        }
        if(el.dataset.index) {
          const index = +el.dataset!.index as number
          this.utils.setTime(this._getLrc()[index].time, index)
        } else {
          Logger.error('事件处理程序click：index为空', el.dataset.index)
        }

      })
    }

    playerScroll!.innerHTML = lrc.map((line) => {
      if(!line.wait) {
        return this._generateLyricsLineHtml(line)
      } else {
        return this._generateWaitHtml()
      }
    }).join('\n')

    this.playerItem = this.el!.querySelectorAll('.y-player-container .y-player-scroll .y-player-item')
  }
  _generateWaitHtml() {
    const waitHtml = `
      <div class="y-wait-item">
        <div class="y-wait"></div>
        <div class="y-wait"></div>
        <div class="y-wait"></div>
      </div>
    `
    return waitHtml
  }
  _moveScroll(index: number) {
    const curLine = this._getCurLine(index)

    if(this.playerContainer) {
      const scrollHalfHeight = this.playerContainer.clientHeight / 2
      const lineHalfHeight = curLine.clientHeight / 2
      const lineTop = curLine.offsetTop

      this.playerContainer.scrollTo({
        behavior: 'smooth',
        top: (lineTop - (scrollHalfHeight - lineHalfHeight) + 100),
      });
    }

  }
  _getCurLine(index: number) {
    return this.playerItem[index]
  }
  _getCurTextEls(index: number) {
    return this.playerItem[index].children
  }
  _generateLyricsLineHtml(line: LyricsLine) {
    const lyricsLineHtml = `<div data-index=${line.index} class="y-player-item">${
        line.yrc.map((segment) => {
          return `<span class="y-text">${segment.text}</span>`
        }).join(' ')
    }</div>`

    return lyricsLineHtml
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
      playerScroll.innerHTML = html`<div>
        <h2 style="color: darkred">${err}</h2>
      </div>`
    }
  }
  // 重新获取当前进行时元素
  _getTransformLrc() {
    const currentLrcLine = this.utils.getCurrentLrcLine()
    return this.playerItem[currentLrcLine.index]
  }
  // 返回一个promise，过渡完成时resolve
  _startAnimation(el: HTMLElement, keyframes: any, options: any) {
    return el.animate(keyframes, options).finished
  }
}

export default Lrc
