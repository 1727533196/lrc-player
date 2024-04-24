import Player from './player/index'
import lrc from '../ttml/rap god.txt'

const player = new Player(document.querySelector('#app') as HTMLElement)

const initEl = document.querySelector('.btn.init') as HTMLButtonElement
const playEl = document.querySelector('.btn.play') as HTMLButtonElement
const pauseEl = document.querySelector('.btn.pause') as HTMLButtonElement
const currentEl = document.querySelector('.btn.current') as HTMLButtonElement

if(currentEl) {
  currentEl.onclick = () => {
    console.log(player.getCurrentLrcLine());
    console.log(player.lrc._transformLrc())
  }
}

player.updateVolume(0.03)
if(initEl) {
  initEl.addEventListener('click', async () => {
    const response = await fetch(lrc)
    const data = await response.text()
    player.updateAudioUrl('http://m7.music.126.net/20240424234944/ee0e2f52e5bcf3d02390793bccde1e96/ymusic/obj/w5zDlMODwrDDiGjCn8Ky/13398482084/1aee/b5ad/b969/53afd1105e06422fa0521cadcf8aa23e.flac', data)
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
