window.Render2 = (function(Reveal) {

  function getData() {
    return Promise.all([
      localforage.getItem('points'),
      localforage.getItem('colors'),
      localforage.getItem('normals'),
    ])
    .then(([points, colors, normals]) => {
      console.log(points, colors, normals)

      points =
         [0.8238003849983215, 0.7257097959518433,   0.8714955449104309,
          0.5960744023323059, 0.2074313759803772,   0.7143247127532959,
          0.770990788936615,  0.1968545913696289,   1.1442639827728271,
          0.8439422249794006, 0.70318204164505,     0.7576677799224854,
          0.8495920300483704, 0.2312665581703186,   1.1555135250091553,
          1.1697092056274414, 0.14608311653137207,  0.7013485431671143,
          0.8650380969047546, 0.6367772817611694,   0.7751699686050415,
          0.7047187685966492, 0.12472134828567505,  0.4848278760910034,
          1.3115885257720947, 0.046153247356414795, 0.6813715696334839]


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

    builder.shown(() => {
      console.log("render-2")
      getData()
        .then(data => {

          // no references, so should be collected
          const gl = canvas.getContext('webgl')

          // create shaders
          const vertex_shader = gl.createShader(gl.VERTEX_SHADER)
          const fragment_shader = gl.createShader(gl.FRAGMENT_SHADER)

          gl.shaderSource(vertex_shader,`
            uniform mat4 u_model;
            uniform mat4 u_view;
            uniform mat4 u_projection;


            attribute vec3 a_position;
            attribute vec3 a_color;
            varying vec3 v_color;
            void main() {
              gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
              v_color = a_color;
            }
          `)

          gl.shaderSource(fragment_shader,`
            precision mediump float;
            varying vec3 v_color;
            void main() {
              gl_FragColor = vec4(v_color, 1);
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
          const a_color = gl.getAttribLocation(program, 'a_color')

          gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 4*9, 0)
          gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 4*9, 4*3)


          // projection matrix
          const u_model = gl.getUniformLocation(program, 'u_model')
          const u_view = gl.getUniformLocation(program, 'u_view')
          const u_projection = gl.getUniformLocation(program, 'u_projection')

          const ratio = gl.canvas.clientWidth / gl.canvas.clientHeight
          const projectionMatrix = mat4.create()
          mat4.perspective(projectionMatrix, Math.PI/2, ratio, 0.1, 5)
          gl.uniformMatrix4fv(u_projection, false, projectionMatrix)

          const viewMatrix = mat4.create()
          mat4.translate(viewMatrix, viewMatrix, [0, 0, -2] )
          gl.uniformMatrix4fv(u_view, false, viewMatrix)

          const modelMatrix = mat4.create()
          // mat4.translate(modelMatrix, modelMatrix, [-1, 0, -1.5] )
          gl.uniformMatrix4fv(u_model, false, modelMatrix)


          // Draw stuff
          gl.enableVertexAttribArray(a_position)
          gl.enableVertexAttribArray(a_color)

          gl.drawArrays(gl.TRIANGLES, 0, 9)

        })


    })

  }

  return create
})(window.Reveal)
