// 解析逐字歌词
import {LrcAnimationRuleKey} from '../types/type'

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

export function addClass(el: HTMLElement) {
  el.classList.add('y-current-line')
}
export function removeClass(el: HTMLElement) {
  el.classList.remove('y-current-line')
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
