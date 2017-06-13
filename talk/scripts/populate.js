const stubGamepad = (() => {

  return () => {
      const gamepad = remoteVR.getGamepads()[0]
      if(gamepad && gamepad.pose) {
        return gamepad.pose.position
      } else {
        return [-1,-1,-1]
      }
  }


  let x = 0, y = 0, z = 0
  let xv = Math.random(), yv = Math.random(), zv = Math.random()
  return () => {
    if(Math.random() < 0.01) {xv += Math.random() - .5} if(Math.random() < 0.01) {yv += Math.random() - .5} if(Math.random() < 0.01) {zv += Math.random() - .5}
    xv *= 0.9; yv *= 0.9; zv *= 0.9; x *= 0.97; y *= 0.97; z *= 0.97; x += xv; y += yv; z += zv;

    return [x, y, z]
  }

})()


// once this has run, all the vertex data should be calculated
class PopulateSlide {
  constructor (selector) {
    this.el = document.querySelector(selector)

    const format = (n) => {
      return (n).toString().slice(0,5)
    }


    const table = this.el.querySelector('table')
    const rows = this.rows = this.el.querySelectorAll('tr')
    const cells = this.el.querySelectorAll('td.d')



    // const colorData = []
    //
    //
    // function appendColor(i, color) {
    //
    //   const row = rows[i]
    //
    //   const [r,g,b] = Array.from({length: 3}, _ => {
    //     const td = document.createElement('td')
    //     td.className = 'c'
    //     td.style.color = color
    //     row.appendChild(td)
    //     return td
    //   })
    //
    //   const rgb = getComputedStyle(r).color.match(/(\d+), (\d+), (\d+)/)
    //   r.innerText = format(rgb[1] / 255)
    //   g.innerText = format(rgb[2] / 255)
    //   b.innerText = format(rgb[3] / 255)
    //
    //   colorData[i*3] = rgb[1] / 255
    //   colorData[i*3 + 1] = rgb[2] / 255
    //   colorData[i*3 + 2] = rgb[3] / 255
    // }
    //
    //
    //
    // appendColor(0, '#8610FA')
    // appendColor(1, '#FA8610')
    // appendColor(2, '#10FA86')
    //
    // appendColor(3, '#4ab0cc')
    // appendColor(4, '#4ab0cc')
    // appendColor(5, '#4ab0cc')
    //
    // appendColor(6, '#ff5792')
    // appendColor(7, '#ff5792')
    // appendColor(8, '#ff5792')
    //
    // console.log(colorData)
    // localforage.setItem('colors', colorData)


    // normals

    const calculateNormals = () => {
      const a = triangleNormal.apply(null, data.slice(0, 9))
      const b = triangleNormal.apply(null, data.slice(9, 18))
      const c = triangleNormal.apply(null, data.slice(18, 27))

      // flat faces
      const normals = [a,a,a,b,b,b,c,c,c]
        .reduce((a, b) => a.concat(b))
        .filter(n => isFinite(n))

      console.log("normals", normals)

      localforage.setItem('normals', normals)
    }



    let i = 0
    for(let c of this.el.querySelectorAll('td.c')) {
      c.style.transitionDelay = (i+=0.05) + 's'
    }

    const rm = this.el.querySelector('a[href="#rm"]')
    const sk = this.el.querySelector('a[href="#skip"]')

    rm.addEventListener('click', e => {
      e.preventDefault()
      localforage.removeItem('points')
      location.reload()
      // data = []
      // for(let cell of cells) cell.innerHTML = '&nbsp;'
    })


    // 9 * 3
    let data = []
    render()

    localforage.getItem('points')
      .then(_data => {
        data = _data || []
        render()
      })

    function render() {
      for (var i = 0; i < data.length; i++)
        cells[i].innerText = format(data[i])
    }


    let current_i = -1
    let current
    let raf


    let stop_polling;

    new SlideBuilder(this.el)
      .shown(() => {
        stop_polling = false
        const poll = () => {
          if(stop_polling) return
          requestAnimationFrame(poll)
          if(!current) return
          if(current_i < 0) return

          var d = stubGamepad()

          data[current_i * 3 + 0] = d[0]
          data[current_i * 3 + 1] = d[1]
          data[current_i * 3 + 2] = d[2]

          render()
        }
        poll()
      })
      .hidden(() => {
        stop_polling = true
      })
      .fragments(
        Array.from(this.rows)
          .map((row, i) => fragment => {
            current_i = i
            current = row

            localforage.setItem('points', data)
            calculateNormals()
            rm.style.opacity = '0'
            sk.style.opacity = '0'
          })
          .concat([() => {
            current_i = -1
            current = null

            localforage.setItem('points', data)
            calculateNormals()
          }

          // ,() => { table.classList.add('show-colors') }


        ])

      )
  }
}



// https://github.com/hughsk/triangle-normal
function triangleNormal(x0, y0, z0, x1, y1, z1, x2, y2, z2, output) {
  if (!output) output = []

  var p1x = x1 - x0
  var p1y = y1 - y0
  var p1z = z1 - z0

  var p2x = x2 - x0
  var p2y = y2 - y0
  var p2z = z2 - z0

  var p3x = p1y * p2z - p1z * p2y
  var p3y = p1z * p2x - p1x * p2z
  var p3z = p1x * p2y - p1y * p2x

  var mag = Math.sqrt(p3x * p3x + p3y * p3y + p3z * p3z)
  if (mag === 0) {
    output[0] = 0
    output[1] = 0
    output[2] = 0
  } else {
    output[0] = p3x / mag
    output[1] = p3y / mag
    output[2] = p3z / mag
  }

  return output
}
