window.Render3 = (function(Reveal) {

  let centroid = [0,0,0]

  function getData() {
    return Promise.all([
      localforage.getItem('points'),
      localforage.getItem('colors'),
      localforage.getItem('normals'),
    ])
    .then(([points, colors, normals]) => {
      console.log(points, colors, normals)

      const totals = [0,0,0]
      for (var i = 0; i < points.length;i+=3) {
        totals[0] += points[i]
        totals[1] += points[i+1]
        totals[2] += points[i+2]
      }

      centroid = totals.map(t => t/(points.length/3))
      console.log(centroid)

      var data = []
      for (var i = 0; i < points.length;i+=3) {
        data.push(
          points[i], points[i+1], points[i+2],
          colors[i], colors[i+1], colors[i+2],
          normals[i], normals[i+1], normals[i+2],
        )
      }

      return data
    })
  }


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
      console.log("render-2")
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
            attribute vec3 a_normal;

            uniform mat4 u_model;
            uniform mat4 u_view;
            uniform mat4 u_projection;

            uniform vec3 u_light;

            varying float intensity;

            void main() {
              gl_Position = u_projection  * u_model * u_view * vec4(a_position, 1.0);

              float dx = u_light.x - a_position.x;
              float dy = u_light.y - a_position.y;
              float dz = u_light.z - a_position.z;

              vec3 v_to_light = vec3(dx,dy,dz);

              intensity = abs(dx);//dot(v_to_light, a_normal);


              // vec4 position = u_model * u_view * vec4(a_position, 1.0);
              // vec4 normal = (u_model * u_view * vec4(a_normal, 1.0)) - position;

              // vec3 n = normal.xyz / normal.w;

              // intensity = max(dot(normalize(normal.xyz), normalize(u_light)),0.0);

              // intensity = max(dot(normal.xyz, u_light),0.0);
            }
          `)

          gl.shaderSource(fragment_shader,`
            precision mediump float;
            varying float intensity;

            void main() {
              gl_FragColor = vec4(intensity,0,0,1);// + vec4(1,0,0,1) * intensity;
            }
          `)

          gl.compileShader(vertex_shader)
          gl.compileShader(fragment_shader)

          ;[vertex_shader, fragment_shader].forEach(shader => {
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
              throw "Could not compile" +
                " shader:\n\n"+gl.getShaderInfoLog(shader);
            }
          })


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
          const a_normal = gl.getAttribLocation(program, 'a_normal')

          gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 4*9, 0)
          // gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 4*9, 4*3)
          gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 4*9, 4*6)


          // projection matrix
          const u_model = gl.getUniformLocation(program, 'u_model')
          const u_view = gl.getUniformLocation(program, 'u_view')
          const u_projection = gl.getUniformLocation(program, 'u_projection')
          const u_light = gl.getUniformLocation(program, 'u_light')

          const modelMatrix = mat4.create()
          gl.uniformMatrix4fv(u_model, false, modelMatrix)

          const viewMatrix = mat4.create()
          gl.uniformMatrix4fv(u_view, false, viewMatrix)

          const projectionMatrix = mat4.create()

          const ratio = gl.canvas.clientWidth / gl.canvas.clientHeight
          mat4.perspective(projectionMatrix, Math.PI/2, ratio, 0.1, 10)
          gl.uniformMatrix4fv(u_projection, false, projectionMatrix)

          const pos = [
            0.742116391658783, 0.4881299138069153, 1.7520594596862793
            // 0,0,2
          ]

          mat4.identity(viewMatrix)
          mat4.translate(viewMatrix, viewMatrix,
            [-pos[0], -pos[1], -pos[2]]
          )
          gl.uniformMatrix4fv(u_view, false, viewMatrix)


          // Draw stuff
          gl.enableVertexAttribArray(a_position)
          gl.enableVertexAttribArray(a_normal)


          gl.drawArrays(gl.TRIANGLES, 0, 9)


          function render(t) {
            if(stopped) return
            else requestAnimationFrame(render)

            let pos = null

            try {
              pos = remoteVR.getGamepads()[0].pose.position
            } catch (e) {}

            if(pos) {
              console.log("p", pos)
              window.pos = pos

              // const centroid = [-0.7227998971939087,
              //     0.852906346321106,
              //     0.9807480573654175
              //   ]

              // const centroid =   [
              //   -1.2972007989883423,
              //   0.5991548299789429,
              //   0.6534359455108643
              // ]

              // const light = pos.map((p,i) => p - centroid[i])
              console.log("LIGHT", pos)
              gl.uniform3fv(u_light, pos)
            }

            gl.drawArrays(gl.TRIANGLES, 0, 9)
          }

          stopped = false
          render()

        })
    })
    .hidden(() => {
      // console.log("HIDDEN")
      // stopped = true

      // console.log("STORING CAMERA POSITION", CAMERA_POSITION)
      // localforage.setItem('camera_position', CAMERA_POSITION)

      // 0.742116391658783, 0.4881299138069153, 1.7520594596862793
    })

  }

  return create
})(window.Reveal)
