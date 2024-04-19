import Lrc from './lrc.ts'

class Player {
    audio: HTMLAudioElement
    lrc: Lrc
    constructor(src: string) {
        this.lrc = new Lrc()
        this.audio = new Audio(src)
    }
    play() {
        this.audio.play();
    }
    pause() {
        this.audio.pause();
    }
    /* 更新歌词，从而使其重新渲染 */
    updateLrc(lrc: string) {
        this.lrc._updateLrc(lrc)
    }
}

export default Player