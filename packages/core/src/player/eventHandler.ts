interface Props {
  setTime: (options: {
    time?: number
    index?: number
  }) => void
  clearTimeupdate: () => void
  getPlayStatus: () => boolean
}

class EventHandler {
  props: Props
  constructor(props: Props) {
    this.props = props
    this.disposeVisibility()
  }
  disposeVisibility() {
    document.addEventListener('visibilitychange', () => {
      const state = document.visibilityState
      if(state === 'hidden') {
        this.props.clearTimeupdate()
      } else {
        if(this.props.getPlayStatus()) {
          this.props.setTime({})
        }
      }
    })
  }
}

export default EventHandler
