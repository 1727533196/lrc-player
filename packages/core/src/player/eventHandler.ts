interface Utils {
  setTime: (options: {
    time?: number
    index?: number
  }) => void
  clearTimeupdate: () => void
  isPlaying: boolean
}

class EventHandler {
  utils: Utils
  constructor(utils: Utils) {
    this.utils = utils
    this.disposeVisibility()
  }
  disposeVisibility() {
    document.addEventListener('visibilitychange', () => {
      const state = document.visibilityState
      if(state === 'hidden') {
        this.utils.clearTimeupdate()
      } else {
        if(this.utils.isPlaying) {
          this.utils.setTime({})
        }
      }
    })
  }
}

export default EventHandler
