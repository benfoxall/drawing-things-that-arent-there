window.RenderStrip = (function(Reveal) {

  function create(selector) {

    const root = document.querySelector(selector)

    const canvas = document.createElement('canvas')
    canvas.width = Reveal.getConfig().width
    canvas.height = Reveal.getConfig().height
    root.appendChild(canvas)

    const builder = new SlideBuilder(root)

    let CAMERA_POSITION

    builder
    .shown(() => {
      console.log("render-strip")
      data.toVectorStrip()
        .then(data => {
          // console.log("DATA", data)

          // no references, so should be collected
          const gl = canvas.getContext('webgl')

          gl.enable(gl.DEPTH_TEST)

          // create shaders
          const vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

          gl.shaderSource(vertex_shader,`
            attribute vec3 a_position;

            uniform mat4 u_model;
            uniform mat4 u_view;
            uniform mat4 u_projection;

            void main() {
              gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
            }
          `)

          gl.shaderSource(fragment_shader,`
            void main() {
              gl_FragColor = vec4(1,1,1, 1);
            }
          `)

          gl.compileShader(vertex_shader)
          gl.compileShader(fragment_shader)


          // Send attribute data to GPU
          gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)


          const program = gl.createProgram()

          gl.attachShader(program, vertex_shader)
          gl.attachShader(program, fragment_shader)

          gl.linkProgram(program)
          gl.useProgram(program)

          const a_position = gl.getAttribLocation(program, 'a_position')
          // const a_color = gl.getAttribLocation(program, 'a_color')

          gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 4*3, 0)
          // gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 4*9, 4*3)


          // projection matrix
          const u_model = gl.getUniformLocation(program, 'u_model')
          const u_view = gl.getUniformLocation(program, 'u_view')
          const u_projection = gl.getUniformLocation(program, 'u_projection')

          const modelMatrix = mat4.create()
          gl.uniformMatrix4fv(u_model, false, modelMatrix)

          const viewMatrix = mat4.create()
          gl.uniformMatrix4fv(u_view, false, viewMatrix)

          const projectionMatrix = mat4.create()

          const ratio = gl.canvas.clientWidth / gl.canvas.clientHeight
          mat4.perspective(projectionMatrix, Math.PI/2, ratio, 0.1, 10)
          gl.uniformMatrix4fv(u_projection, false, projectionMatrix)


          // Draw stuff
          gl.enableVertexAttribArray(a_position)

          // gl.drawArrays(gl.TRIANGLES, 0, 9)


          function render(t) {
            if(stopped) return
            else requestAnimationFrame(render)

            let pose = null

            try {
              pose = remoteVR.getGamepads()[0].pose
              window.camera = pose
            } catch (e) {}

            if(pose) {
              const pos = pose.position


              mat4.identity(viewMatrix)

              mat4.translate(viewMatrix, viewMatrix,
                [-pos[0], -pos[1], -pos[2]]
              )

              mat4.fromRotationTranslation(viewMatrix, pose.orientation, pos)

              mat4.invert(viewMatrix, viewMatrix)

              gl.uniformMatrix4fv(u_view, false, viewMatrix)

              CAMERA_POSITION = pos
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, data.length/3)
          }

          stopped = false
          render()

        })
    })
    .hidden(() => {
      console.log("HIDDEN")
      stopped = true

      console.log("STORING CAMERA POSITION", CAMERA_POSITION)
      localforage.setItem('camera_position', CAMERA_POSITION)

      // 0.742116391658783, 0.4881299138069153, 1.7520594596862793
    })

  }

  return create
})(window.Reveal)
