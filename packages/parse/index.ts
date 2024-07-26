
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

export function parseLrc(yrc: string) {
  yrc = yrc.replace(/[\r\n]/g, '');
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
        const total = +(obj.time + duration).toFixed(2)

        if ((nextTime - total) > 8) {
          // time = last.time + last.duration
          // duration = nextTime - time
          const waitDuration = +(nextTime - total).toFixed(2)
          const waitTransition = (+(waitDuration / 3).toFixed(2)) - 0.5

          result.push({
            time: total,
            duration: waitDuration,
            index: index,
            wait: true,
            yrc: Array(3).fill(0).map((_, index) => {
              return {
                text: '',
                transition: waitTransition,
                cursor: total + waitTransition * index,
                glowYrc: null,
                wait: true,
              }
            })
          })
          index++
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
      if(transition > 1 && text.trim().length > 2) {

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


// 时间反序列化 timeFormat: '11:02.410' = 662.41/s     5 * 60 = 300 + 02.410
function timeDeserialize(timeFormat: string) {
  const timeArr: string[] = timeFormat.split(':') // [11, 02, 41]
  let result: number = 0
  for(let i = 0; i < timeArr.length; i++) {
    if(i === 0) {
      result += +timeArr[i] * 60
    } else if(i === 1) {
      result += +`${timeArr[i]}`
    }
  }
  return result
}

export function parseYrc(lyric: string) {
  const result: Array<{time: number, text: string, index: number, duration: number, unrender: boolean}> & {notSupportedScroll?: boolean} = []
  const lyricArr = lyric.split(/\n/)
  lyricArr.pop() // 删除最后一行多余的

  // 会出现这两种情况, 所以要做处理
  // [00:24.46]春雨后太阳缓缓的露出笑容;  lyricArr[i].split(']') => ['[00:24.46', '春雨后太阳缓缓的露出笑容']
  // [03:05.32][01:28.24]这个夏天 融化了整个季节  => ['[03:05.32', '[01:28.24', '这个夏天 融化了整个季节']
  let isSort = false
  let overlookCount = 0

  for (let i = 0; i < lyricArr.length; i++) {
    if(lyricArr[i][0] === '{') {
      overlookCount++
      continue
    }
    let lyricItem = lyricArr[i].split(']')
    const text = lyricItem.pop() as string
    const index = i - overlookCount
    if(lyricItem[0] === undefined) {
      result.push({ time: 0, text: lyricArr[i], index, duration: 0, unrender: true })
      result.notSupportedScroll = true
      continue
    }
    let time = 0
    // [00:24.46]春雨后太阳缓缓的露出笑容 这种情况就可以直接赋值
    if(lyricItem.length > 1) {
      isSort || (isSort = true)
      for (let i = 0; i < lyricItem.length; i++) {
        time = timeDeserialize(lyricItem[i].replace('[', ''))
        result.push({ time, text, index, duration: 0, unrender: true })
      }
    } else {
      time = timeDeserialize(lyricItem[0].replace('[', ''))
      result.push({ time, text, index, duration: 0, unrender: true })
    }
  }
  if(isSort) {
    result.sort((a, b) => (a.time - b.time))
    for (let i = 0; i < result.length; i++) {
      result[i].index = i
    }
  }

  // 计算 duration
  for (let i = 0; i < result.length - 1; i++) {
    result[i].duration = result[i + 1].time - result[i].time;
  }

  return result
}
