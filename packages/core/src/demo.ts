import Player from './player/index'
import lrc from '../ttml/rap god.txt'

const player = new Player(document.querySelector('#app') as HTMLElement)

const initEl = document.querySelector('.btn.init') as HTMLButtonElement
const playEl = document.querySelector('.btn.play') as HTMLButtonElement
const pauseEl = document.querySelector('.btn.pause') as HTMLButtonElement

if(initEl) {
  initEl.addEventListener('click', async () => {
    const response = await fetch(lrc)
    const data = await response.text()
    player.updateAudioUrl('http://m801.music.126.net/20240424014152/647ea01ebabeef03e7bde26eb0f482cb/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/34854873805/216a/6eaf/3abc/12855295a3a821408659d5df44558850.flac', data)
  })
}

if(playEl) {
  playEl.addEventListener('click', async () => {
    player.play()
  })
}
if(pauseEl) {
  pauseEl.addEventListener('click', async () => {
    player.pause()
  })
}
