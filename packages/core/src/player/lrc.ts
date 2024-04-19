import { parseYrc } from '../utils'
import Logger from '../logger'
import { LyricsLine } from '../types/type.ts'

class Lrc {
  lrcVal: LyricsLine[] | null = null
  el: HTMLElement | null = null
  constructor(el: HTMLElement) {
    this._initEl(el)
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
    this._renderLrc(this.lrcVal)
  }
  _renderLrc(lrc: LyricsLine[]) {
    if (!this.el) {
      return Logger.error(`渲染歌词时检查到el为空：${this.el}`)
    }
    console.log(lrc)

    const playerContainer = document.createElement('div')
    playerContainer.className = 'y-player-container'
    this.el.appendChild(playerContainer)

    playerContainer.innerHTML = lrc
      .map(
        (line) =>
          `<div class="y-player-item">${line.yrc
            .map((segment) => {
              return `<span class="y-text">${segment.text}</span>`
            })
            .join(' ')}</div>`,
      )
      .join('\n')
  }
}

export default Lrc
