import {LyricsFragment, Yrc} from "../types/type";
import {getLrcAnimationRule} from "../utils";
import {FLOAT_END_DURATION, FLOAT_START_DURATION} from "../enum";

interface Props {
  getTime: () => number
}

interface LrcAnimations {
  lrc: Animation
  float: Animation
}

class AnimationProcess {
  lrcAnimations: Map<HTMLSpanElement, LrcAnimations> = new Map() // 逐字动画集合
  animations: Array<Animation> = [] // 当前动画实例集合
  props: Props

  constructor(props: Props) {
    this.props = props
  }
  // 处理逐字歌词动画
  disposeLrcAnimationProcess(
    els: any,
    yrcRule: Yrc[] | LyricsFragment[],
    index: number,
    isGlow = false
  ) {
    if(!isGlow) {
      els.classList.add('y-current-line');
    }

    // 如果序列不是从0开始，则表示此次是快进操作，需要将序列前置添加上完成样式
    if(index !== 0) {
      const [keyframes, options] = getLrcAnimationRule(0, 'lrc',)
      const [floatKeyFrames, floatOptions] = getLrcAnimationRule(FLOAT_START_DURATION, 'floatStart')

      for(let i = 0; i < index; i++) {
        const el = els.children[i]
        const lrc = el.animate(keyframes, options)
        const float = el.animate(floatKeyFrames, floatOptions)

        this.lrcAnimations.set(el, {
          lrc,
          float,
        })
      }
    }

    return new Promise((resolve, reject) => {
      const process = (index: number) => {

        if (index >= yrcRule.length) {
          if(!isGlow) {
            els.classList.remove('y-current-line')
            this.recoveryAnimateStatus()
          }
          return resolve('')
        }
        // 当前逐字元素
        const textEl = els.children[index]
        const curYrcRule = yrcRule[index]

        // 处理辉光歌词
        if('glowYrc' in curYrcRule && (curYrcRule as Yrc).glowYrc) {
          const glowYrc = (curYrcRule as Yrc).glowYrc!
          this.disposeGlow()
          return this.disposeLrcAnimationProcess(textEl, glowYrc, 0, true).then(() => {
            process(++index)
          })
        }

        const delayTime = +(this.props.getTime() - curYrcRule.cursor).toFixed(2)
        const transition = curYrcRule.transition - delayTime > 0 ? (curYrcRule.transition - delayTime) * 1000 : curYrcRule.transition * 1000

        const lrcAnimate = textEl.animate(...getLrcAnimationRule(transition, 'lrc'));
        const floatAnimate = textEl.animate(...getLrcAnimationRule(FLOAT_START_DURATION, 'floatStart'));

        textEl.setAttribute('data-is-transition', 'true')

        this.animations = [lrcAnimate]

        this.lrcAnimations.set(textEl, {
          lrc: lrcAnimate,
          float: floatAnimate,
        })
        // 在动画完成后执行处理
        lrcAnimate.finished.then(() => {

          this.dispatchAnimation('clear')
          process(++index)
        }).catch((err: string) => {
          console.log(err)

          els.classList.remove('y-current-line')
          this.recoveryAnimateStatus()

          return reject()
        }).finally(() => {

        })
      }
      process(index)
    })
  }
  // 处理辉光歌词
  disposeGlow() {

  }
  dispatchAnimation(type: 'play' | 'pause' | 'cancel' | 'clear') {
    if(!this.animations.length) {
      return
    }
    if(type === 'play') {
      this.animations.forEach(animate => {
        animate.play()
      })
    } else if(type === 'pause') {
      this.animations.forEach(animate => {
        animate.pause()
      })
    } else if(type === 'cancel') {
      this.animations.forEach(animate => {
        animate.cancel()
      })
      this.animations = []
    } else if(type === 'clear') {
      this.animations = []
    }
  }
  clearAllAnimate() {
    const lrcAnimations = this.lrcAnimations

    lrcAnimations.forEach((value) => {
      value.lrc.cancel()
      value.float.cancel()
    })
    this.lrcAnimations.clear()

    this.animations.forEach((value) => {
      value.cancel()
    })
    this.animations = []
  }
  getAnimations() {
    return this.animations
  }
  // 动画结束后恢复状态
  protected recoveryAnimateStatus() {

    const lrcAnimations = this.lrcAnimations

    if(lrcAnimations.size === 0) {
      return
    }

    const [floatKeyFrames, floatOptions] = getLrcAnimationRule(FLOAT_END_DURATION, 'floatEnd')

    lrcAnimations.forEach((value, el) => {
      const { lrc, float } = value
      lrc.cancel()

      el.animate(floatKeyFrames, floatOptions).finished.then(() => {
        float.cancel()
      })
    })
    this.lrcAnimations.clear()
  }
}

export default AnimationProcess