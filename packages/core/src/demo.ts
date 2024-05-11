import Player from './player/index'
import lrc from '../ttml/golden hour.txt'
import audioUrl from '../ttml/golden hour.m4a'

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
    player.setTime({
      time: +timeInputEl.value,
    })
  }
}

console.log('player', player)

if(currentEl) {
  currentEl.onclick = () => {
    console.log(player.getCurrentLrcLine());
    // console.log(player.lrc._getTransformLrc())
  }
}

const url = audioUrl

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
