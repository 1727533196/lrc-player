// 解析逐字歌词
import {LyricsFragment, LyricsLine} from '../types/type'

export function parseYrc(yrc: string) {
  const result: LyricsLine[] = []
  let obj: LyricsLine = {
    time: 0,
    duration: 0,
    index: 0,
    yrc: [],
  }

  let startIndex = 0
  let endIndex = 0
  let index = 0 // 每行歌词的index
  let startCount = 0 // 当前扫描到的{数量
  let endCount = 0 // 当前扫描到的}数量
  let isEnd = true
  for (let i = 0; i < yrc.length; i++) {
    const target = yrc[i]
    if (target === '{') {
      if (isEnd) {
        startIndex = i
      }
      startCount++
      isEnd = false
    } else if (target === '}') {
      endCount++
      if (startCount === endCount) {
        endIndex = i
        isEnd = true
        startCount = 0
        endCount = 0
      }
    } else if (target === '[' && isEnd) {
      startIndex = i
      obj = { time: 0, duration: 0, index: 0, yrc: [] }
      result.push(obj)
    } else if (target === ']' && isEnd) {
      endIndex = i
      const [time, duration] = yrc.slice(startIndex + 1, endIndex).split(',').map(item => +item / 1000)
      obj.time = time
      obj.duration = duration
      obj.index = index++

      // 如果当前和下一次的间隔时间超过10秒，则塞入一个空数据
      if (i < yrc.length - 1) {
        const nextStartIndex = yrc.indexOf('[', i + 1)
        const nextEndIndex = yrc.indexOf(']', i + 1)
        const [nextTime] = yrc.slice(nextStartIndex + 1, nextEndIndex).split(',').map(item => +item / 1000)

        if ((nextTime - +(obj.time + duration).toFixed(2)) > 8) {
          result.push({
            time: 0,
            duration: 0,
            index: 0,
            wait: true,
            yrc: []
          })
        }
      }

    } else if (target === '(' && isEnd) {
      startIndex = i
    } else if (target === ')' && isEnd) {
      endIndex = i
      const [cursor, transition] = yrc.slice(startIndex + 1, endIndex).split(',').map(item => +item / 1000)
      let text: string = ''

      for (let o = i + 1; o < yrc.length; o++) {
        if (['[', '('].includes(yrc[o])) {
          break
        }
        text += yrc[o]
      }
      let glowYrc: LyricsFragment[] | null = null
      if(transition >= 1 && text.trim().length > 0) {

        glowYrc = []
        const len = text.length
        const average = transition / len
        for(let i = 0; i < len; i++) {
          glowYrc.push({
            text: text[i],
            transition: average,
            cursor: cursor + average * i,
          })
        }
      }

      obj.yrc.push({
        text,
        transition,
        cursor,
        glowYrc,
      })
    }
  }
  return result
}

export function getLrcAnimationRule(
  duration: number,
  key: 'lrc' | 'floatStart' | 'floatEnd' | 'glow',
): [Keyframe[], KeyframeAnimationOptions] {
  const rule = {
    lrc: [
      [{ backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%' }],
      {
        duration,
        fill: 'forwards',
      },
    ],
    floatStart: [
      [{ transform: 'translateY(0px)' }, { transform: 'translateY(-2px)' }],
      {
        duration: duration,
        fill: 'forwards',
      },
    ],
    floatEnd: [
      [{ transform: 'translateY(-2px)' }, { transform: 'translateY(0px)' }],
      {
        duration: duration,
        fill: 'forwards',
      },
    ],
    glow: [
      [{ textShadow: '0 0 10px rgba(255, 255, 255, 0)' }, { textShadow: '0 0 10px rgba(255, 255, 255, 0.7)' }],
      {
        duration: duration,
        fill: 'forwards',
      },
    ]
  }

  return rule[key] as [Keyframe[], KeyframeAnimationOptions];
}

export function isString(value: unknown) {
  return typeof value === 'string'
}

export function isObject(value: unknown) {
  return value && typeof value === 'object'
}
