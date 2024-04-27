import Player from './player/index'
import lrc from '../ttml/golden hour.txt'

const player = new Player(document.querySelector('#app') as HTMLElement)

const initEl = document.querySelector('.btn.init') as HTMLButtonElement
const playEl = document.querySelector('.btn.play') as HTMLButtonElement
const pauseEl = document.querySelector('.btn.pause') as HTMLButtonElement
const currentEl = document.querySelector('.btn.current') as HTMLButtonElement
const setTimeEl = document.querySelector('.btn.set-time') as HTMLButtonElement
const timeInputEl = document.querySelector('.input-time') as HTMLInputElement

if(setTimeEl && timeInputEl) {
  setTimeEl.onclick = () => {
    console.log('timeInputEl.value', timeInputEl.value)
    player.updateTime(+timeInputEl.value)
  }
}

if(currentEl) {
  currentEl.onclick = () => {
    // console.log(player.getCurrentLrcLine());
    console.log(player.curLrcLine?.index);
    // console.log(player.lrc._getTransformLrc())
  }
}

const url = 'http://m701.music.126.net/20240428000050/cd1fd2bb55460e18e3f13b3df842a297/jdymusic/obj/wo3DlMOGwrbDjj7DisKw/15188765275/3a8b/fd07/b079/1bde5c89d7b5640f3869068772ba3eb0.flac'

player.updateVolume(0.7)
if(initEl) {
  initEl.addEventListener('click', async () => {
    const response = await fetch(lrc)
    const data = await response.text()
    player.updateAudioUrl(url, data)
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
