// 定义歌词片段的类型
export interface LyricsFragment {
  text: string
  transition: number
  cursor: number
}

// 定义歌词行的类型
export interface Yrc extends LyricsFragment{
  glowYrc: LyricsFragment[] | null
  wait?: boolean
}

export type LyricsLine = {
  time: number
  duration: number
  index: number
  yrc: Yrc[]
  wait?: boolean
}

export type LrcAnimationRuleKey = 'lrc' | 'floatStart' | 'floatEnd' | 'glow' | 'waitStart1' | 'waitStart2' | 'waitAnimate' | 'waitEnd1' | 'waitEnd2'
