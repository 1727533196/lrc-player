

class EventHandler {
  constructor() {
    this.disposeVisibility()
  }
  disposeVisibility() {
    document.addEventListener('visibilitychange', () => {
      const state = document.visibilityState
      if(state === 'hidden') {
        console.log('隐藏')
      } else {
        console.log('显示')
      }
    })
  }
}

export default EventHandler
