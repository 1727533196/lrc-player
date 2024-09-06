import Player from './player/index'
import '../dist/style.css'
import './style.css'
import text from '../yrc/sweet.txt'
import audioUrl from '../yrc/sweet.flac'
import {parseLrc} from '../../parse/index'

const player = new Player({
  click: (time, index) => {
    audio.currentTime = time
    audio.play()
  }
})
// setTimeout(() => {
//   player.stop(true)
//   setTimeout(() => {
//     player.stop(false)
//   }, 7000)
//   console.log('1111')
// }, 4000)
const audio = document.querySelector('audio')
audio.volume = 0.2
audio.src = audioUrl

audio.onplay = () => {
  player.play()
}

audio.onpause = () => {
  player.pause()
}

let lrc =
fetch(text).then(response => {
  response.text().then(data => {
    player.updateAudioLrc(lrc = parseLrc(data), 'lrc')
  })
})

player.mount(document.querySelector('.test') as HTMLElement, audio)

// player.on('scroll', (el, top) => {
//   el.scrollTo({
//     behavior: 'smooth',
//     top
//   });
// })

audio.onseeked = () => {
  player.syncIndex()
}

setTimeout(() => {
  player.on('scroll', (el, top) => {
    el.scrollTo({
      behavior: 'smooth',
      top
    });
  })
}, 4000)
