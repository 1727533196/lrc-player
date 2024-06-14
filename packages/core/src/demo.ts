import Player from './player/index'
import '../dist/style.css'
import './style.css'
import lrc from '../yrc/sweet.txt'
import audioUrl from '../yrc/sweet.flac'

const player = new Player()

player.mount(document.querySelector('#app') as HTMLElement)

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

if(currentEl) {
  currentEl.onclick = () => {
    console.log(player.getCurrentLrcLine());
    // console.log(player.lrc._getTransformLrc())
  }
}

const url = audioUrl

player.updateVolume(0.05)
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
