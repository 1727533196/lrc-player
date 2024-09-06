interface Props {
  getPlayStatus: () => boolean
  stop: (status: boolean) => void
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
        this.props.stop(true)
      } else {
        if(this.props.getPlayStatus()) {
          this.props.stop(false)
        }
      }
    })
  }
}

export default EventHandler
