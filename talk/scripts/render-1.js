window.Render1 = (function(Reveal) {

  function create(selector) {

    const root = document.querySelector(selector)

    const canvas = document.createElement('canvas')
    canvas.width = Reveal.getConfig().width
    canvas.height = Reveal.getConfig().height
    root.appendChild(canvas)

    const builder = new SlideBuilder(root)

    builder.shown(() => {
      console.log("render-1")
      // getData()
      data.toVectors()
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
          gl.drawArrays(gl.TRIANGLES, 0, data.length/9)

        })

    })

  }

  return create

})(window.Reveal)
