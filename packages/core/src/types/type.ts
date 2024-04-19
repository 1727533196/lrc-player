// 定义歌词行的类型
export type LyricsLine = {
  time: number
  duration: number
  index: number
  yrc: {
    text: string
    transition: number
    cursor: number
  }[]
}
