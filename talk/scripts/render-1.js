window.Render1 = (function(Reveal) {

  function getData() {
    return Promise.all([
      localforage.getItem('points'),
      localforage.getItem('colors'),
      localforage.getItem('normals'),
      localforage.getItem('positions'),
      localforage.getItem('orientations'),
    ])
    .then(([points, colors, normals, positions, orientations]) => {
      const data = new Float32Array((positions.length-1)*6)
      let l = null
      positions.forEach((p, i) => {
        if(!l) return l = p;

        data[i*6 + 0] = p[0]
        data[i*6 + 1] = p[1]
        data[i*6 + 2] = p[2]

        // data[i*6 + 3] = l[0]
        // data[i*6 + 4] = l[1]
        // data[i*6 + 5] = l[2]

        const quat = new Quaternion(orientations[i])
        const by = quat.rotateVector([0,0.03,0])

        data[i*6 + 3] = p[0] + by[0]
        data[i*6 + 4] = p[1] + by[1]
        data[i*6 + 5] = p[2] + by[2]

        l = p

      })

      // console.log('----', data)
      return data
      //
      // var data = []
      // for (var i = 0; i < points.length;i+=3) {
      //   data.push(
      //     points[i], points[i+1], points[i+2],
      //     colors[i], colors[i+1], colors[i+2],
      //     normals[i], normals[i+1], normals[i+2],
      //   )
      // }
      //
      // return data

    })
  }



  function create(selector) {

    const root = document.querySelector(selector)

    const canvas = document.createElement('canvas')
    canvas.width = Reveal.getConfig().width
    canvas.height = Reveal.getConfig().height
    root.appendChild(canvas)

    const builder = new SlideBuilder(root)

    builder.shown(() => {
      console.log("render-1")
      getData()
        .then(data => {

          // no references, so should be collected
          const gl = canvas.getContext('webgl')

          gl.enable(gl.DEPTH_TEST)

          // create shaders
          const vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

          gl.shaderSource(vertex_shader,`
            attribute vec3 a_position;
            attribute vec3 a_color;
            void main() {
              gl_Position = vec4(a_position, 1.0);
            }
          `)

          gl.shaderSource(fragment_shader,`
            precision mediump float;
            void main() {
              gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
            }
          `)

          gl.compileShader(vertex_shader)
          gl.compileShader(fragment_shader)


          // Send attribute data to GPU
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)


          const program = gl.createProgram()

          gl.attachShader(program, vertex_shader)
          gl.attachShader(program, fragment_shader)

          gl.linkProgram(program)
          gl.useProgram(program)

          const a_position = gl.getAttribLocation(program, 'a_position')

          gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 4*3, 0)

          // Draw stuff
          gl.enableVertexAttribArray(a_position)
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, data.length/9)

        })

    })

  }

  return create

})(window.Reveal)
