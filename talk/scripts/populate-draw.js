// once this has run, all the vertex data should be calculated
class PopulateDrawSlide {
  constructor (selector) {
    this.el = document.querySelector(selector)

    const h1 = document.createElement('h1')
    h1.innerText = 'Collect some data'
    this.el.appendChild(h1)

    const h2 = document.createElement('h2')
    h2.innerText = '.'
    this.el.appendChild(h2)

    let positions = []
    let orientations = []


    let polling = false

    const callback = {}

    callback.handler = (gamepad) => {
      console.log("handle", gamepad)
    };

    new SlideBuilder(this.el)
      .hidden(() => {
        polling = false
      })
      .shown(() => {
        callback.handler = (gamepad) => {
          h2.innerText =
            Array.from(gamepad.pose.position)
              .map(p => p.toFixed(4))
              .join(', ')
        }

        if(!polling) {
          polling = true
          let last = -1
          const poll = () => {
            if(!polling) return
            requestAnimationFrame(poll)
            const gamepad = remoteVR.getGamepads()[0]
            if(gamepad && (gamepad.timestamp != last)) {
              last = gamepad.timestamp
              if(callback.handler) callback.handler(gamepad)
            }
          }
          poll()
        }
      })
      .fragments([

        () => {
          h1.innerText = 'Collecting'

          positions = []
          orientations = []
          callback.handler = (gamepad) => {
            positions.push(
              Array.from(gamepad.pose.position)
            )
            orientations.push(
              Array.from(gamepad.pose.orientation)
            )

            h2.innerText = positions.length + ' samples'
          }
        },

        () => {
          h1.innerText = 'Done'
          callback.handler = () => {}

          localforage.setItem('positions', positions)
          localforage.setItem('orientations', orientations)
        }
      ])


  }
}
