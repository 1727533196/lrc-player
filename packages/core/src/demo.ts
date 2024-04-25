import Player from './player/index'
import lrc from '../ttml/搁浅.txt'

const player = new Player(document.querySelector('#app') as HTMLElement)

const initEl = document.querySelector('.btn.init') as HTMLButtonElement
const playEl = document.querySelector('.btn.play') as HTMLButtonElement
const pauseEl = document.querySelector('.btn.pause') as HTMLButtonElement
const currentEl = document.querySelector('.btn.current') as HTMLButtonElement

if(currentEl) {
  currentEl.onclick = () => {
    console.log(player.getCurrentLrcLine());
    console.log(player.lrc._getTransformLrc())
  }
}

const url = 'https://ws6.stream.qqmusic.qq.com/C400001TM1cF044EAg.m4a?guid=4651014208&vkey=1AD3A38F2D1AB94732ACED665487836B5F8FD1D852710248365D2BFDF7A7766D749787334CF21F9DC5952F18B54462CA7D42F9B559F2CD4C&uin=&fromtag=120032&src=C400004NmDtD4RcwiJ.m4a'

player.updateVolume(0.03)
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
