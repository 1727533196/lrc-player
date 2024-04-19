import Player from './player/index.ts'
import whistle from '../ttml/whistle.txt'

const player = new Player(document.querySelector('#app'))

fetch(whistle)
  .then((response) => response.text())
  .then((data) => player.updateLrc(data))
