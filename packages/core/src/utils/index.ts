// 解析逐字歌词
import {LrcAnimationRuleKey, LyricsFragment, LyricsLine} from '../types/type'

export function parseYrc(yrc: string) {
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

export function getLrcAnimationRule(
  duration: number,
  key: LrcAnimationRuleKey,
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
      [
        { transform: 'translateY(0)' },
        { transform: `translateY(${-2}px)`}
      ],
      {
        duration: duration,
        fill: 'forwards',
      },
    ],
    waitStart1: [
      [
        {height: 0, padding: '0 60px'},
        {height: '15px', padding: '10px 60px'}
      ],
      {
        duration: duration,
        fill: "forwards",
      }
    ],
    waitStart2: [
      [
        {opacity: 0},
        {opacity: 1},
      ],
      {
        duration: duration,
        fill: "forwards",
        easing: 'ease-in-out',
        delay: 300,
      }
    ],
    waitEnd1: [
      [
        {height: '15px', padding: '10px 60px'},
        {height: 0, padding: '0 60px'},
      ],
      {
        duration: duration,
        fill: "forwards",
      }
    ],
    waitEnd2: [
      [
        {opacity: 1},
        {opacity: 0},
      ],
      {
        duration: duration,
        fill: "forwards",
        easing: 'ease-in-out',
      }
    ],
    waitAnimate: [
      [
        {backgroundColor: 'rgba(255,255,255, 0.1)'},
        {backgroundColor: 'rgba(255,255,255, 1)'},
      ],
      {
        duration: duration,
        fill: "forwards",
        easing: 'ease-in-out',
      }
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

export function formattingTime(msec: number) {
  let result = ''
  const sec = Math.floor(msec / 1000 % 60)
  const minute = Math.floor((msec / 1000 - sec) / 60)

  result = `${minute.toString().length <= 1
    ? '0'+minute : minute}:${sec.toString().length <= 1 ? '0' + sec : sec}`

  return result
}

/**
 * 使用 requestAnimationFrame 实现平滑滚动到指定位置
 * @param {HTMLElement} element - 需要滚动的元素
 * @param {number} targetTop - 目标滚动位置（相对于元素顶部）
 * @param {number} duration - 滚动时间（毫秒）
 * @param {function} easing - 缓动函数
 */
export function smoothScrollTo(element: HTMLElement, targetTop: number, duration: number, easing: 'linear' | 'power1.out' | 'easeInOutCubic') {
  // 常用的缓动函数
  function easeInOutCubic(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function linear(t: number) {
    return t;
  }

  function power1Out(t: number) {
    return 1 - Math.pow(1 - t, 1);
  }

  const easingConfig = {
    linear,
    easeInOutCubic,
    'power1.out': power1Out,
  }

  const startTop = element.scrollTop;
  const distance = targetTop - startTop;
  let startTime: number | null = null;

  function scrollStep(timestamp: number) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;
    const percent = Math.min(progress / duration, 1);

    element.scrollTop = startTop + distance * easingConfig[easing](percent);

    if (progress < duration) {
      requestAnimationFrame(scrollStep);
    }
  }

  requestAnimationFrame(scrollStep);
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}
