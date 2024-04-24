import { parseYrc } from '../utils'
import Logger from '../logger'
import { LyricsLine } from '../types/type'

interface Utils {
  getCurrentLrcLine: () => LyricsLine
}

class Lrc {
  lrcVal: LyricsLine[] | null = null
  el: HTMLElement | null = null
  utils: Utils
  playerItem: NodeList
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
    if(!this.lrcVal) {
      return Logger.error('_updateLrc：歌词解析时为空：', this.lrcVal)
    }
    this._renderLrc(this.lrcVal)
  }
  _renderLrc(lrc: LyricsLine[]) {
    if (!this.el) {
      return Logger.error(`渲染歌词时检查到el为空：${this.el}`)
    }

    const lastPlayerContainer = this.el.querySelector('.y-player-container')
    if(lastPlayerContainer) {
      this.el.removeChild(lastPlayerContainer)
    }

    const playerContainer = document.createElement('div')
    playerContainer.className = 'y-player-container'

    const playerScroll = document.createElement('div')
    playerScroll.className = 'y-player-scroll'

    playerContainer.appendChild(playerScroll)

    playerScroll.innerHTML = lrc
      .map(
        (line) =>
          `<div class="y-player-item">${line.yrc
            .map((segment) => {
              return `<span class="y-text">${segment.text}</span>`
            })
            .join(' ')}</div>`,
      )
      .join('\n')

    this.el.appendChild(playerContainer)

    this.playerItem = this.el!.querySelectorAll('.y-player-container .y-player-scroll .y-player-item')
  }
  _getLrc(): LyricsLine[] {
    return this.lrcVal || []
  }
  _transformLrc() {
    const currentLrcLine = this.utils.getCurrentLrcLine()
    return this.playerItem[currentLrcLine.index]
  }
}

export default Lrc
