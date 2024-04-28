import Player from './player/index'
import lrc from '../ttml/rap god.txt'

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

console.log('player', player)

if(currentEl) {
  currentEl.onclick = () => {
    // console.log(player.getCurrentLrcLine());
    console.log(player.curLrcLine?.index);
    // console.log(player.lrc._getTransformLrc())
  }
}

const url = 'http://m7.music.126.net/20240428231337/29c62c16951328a7c2aad1cc0fe9c645/ymusic/5adc/296e/e69d/6f969adc6e235e640b64f9d31fa9225d.flac'

player.updateVolume(0.5)
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
