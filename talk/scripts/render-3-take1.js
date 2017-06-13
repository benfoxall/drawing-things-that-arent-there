const N = 900

window.Render3 = (function(Reveal) {

  function getData() {
    return Promise.all([
      localforage.getItem('points'),
      localforage.getItem('colors'),
      localforage.getItem('normals'),
    ])
    .then(([points, colors, normals]) => {
      console.log(points, colors, normals)

      // points =
      //    [
      //     // 0,0,0,
      //     // 10,0,0,
      //     // 0,2,0,
      //     0.8238003849983215, 0.7257097959518433,   0.8714955449104309,
      //     0.5960744023323059, 0.2074313759803772,   0.7143247127532959,
      //     0.770990788936615,  0.1968545913696289,   1.1442639827728271,
      //
      //     0.8439422249794006, 0.70318204164505,     0.7576677799224854,
      //     0.8495920300483704, 0.2312665581703186,   1.1555135250091553,
      //     1.1697092056274414, 0.14608311653137207,  0.7013485431671143,
      //     0.8650380969047546, 0.6367772817611694,   0.7751699686050415,
      //     0.7047187685966492, 0.12472134828567505,  0.4848278760910034,
      //     1.3115885257720947, 0.046153247356414795, 0.6813715696334839]


      // points = []
      // colors = []
      // normals = []
      //
      for (var i = 27; i < N; i+=9) {
        const x1 = Math.random() - .5
        const y1 = Math.random() - .5
        const z1 = Math.random() - .5

        const x2 = x1 + (Math.random()-.5) * 0.2
        const y2 = y1 + (Math.random()-.5) * 0.2
        const z2 = z1 + (Math.random()-.5) * 0.2

        const x3 = x1 + (Math.random()-.5) * 0.2
        const y3 = y1 + (Math.random()-.5) * 0.2
        const z3 = z1 + (Math.random()-.5) * 0.2

        points.push(x1,y1,z1,x2,y2,z2,x3,y3,z3)

        const normal = triangleNormal(x1,y1,z1,x2,y2,z2,x3,y3,z3)
        normals.push(normal[0], normal[1], normal[2])
        normals.push(normal[0], normal[1], normal[2])
        normals.push(normal[0], normal[1], normal[2])

        colors.push(x1,y1,z1,x2,y2,z2,x3,y3,z3)
      }



      // const calculateNormals = (data) => {
      //   const a = triangleNormal.apply(null, data.slice(0, 9))
      //   const b = triangleNormal.apply(null, data.slice(9, 18))
      //   const c = triangleNormal.apply(null, data.slice(18, 27))
      //
      //   // flat faces
      //   const normals = [a,a,a,b,b,b,c,c,c]
      //     .reduce((a, b) => a.concat(b))
      //     .filter(n => isFinite(n))
      //
      //   console.log("normals", normals)
      //
      //   localforage.setItem('normals', normals)
      // }
      //
      // calculateNormals(points)


      var data = []
      for (var i = 0; i < points.length;i+=3) {
        data.push(
          points[i], points[i+1], points[i+2],
          colors[i], colors[i+1], colors[i+2],
          normals[i], normals[i+1], normals[i+2],
        )

      }
      console.log("NROMALS, ", normals)

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
    let stopped

    builder
      .hidden(() => {
        stopped = true
      })
      .shown(() => {
      console.log("render-3")
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
            attribute vec3 a_color;

            uniform mat4 u_projection;
            uniform mat4 u_model;
            uniform mat4 u_view;
            uniform mat4 u_normal_mat;

            varying vec3 normalInterp;
            varying vec3 vertPos;
            varying vec3 v_color;

            // uniform vec3 u_light_position;

            // uniform vec3 u_light_position;


            varying vec3 v_light_position;
            varying vec3 v_ben;
            varying vec3 v_ben2;


            uniform vec3 u_light_position;
            varying vec3 v_surfaceToLight;

            varying vec3 v_normal;



            void main(){

                mat4 modelview = u_view * u_model;

                gl_Position = u_projection * modelview * vec4(a_position, 1.0);

                // u_normal_mat = u_worldInverseTranspose

                v_normal = mat3(u_normal_mat) * a_normal;



                // compute the world position of the surfoace

                vec3 surfaceWorldPosition = mat3(modelview) * a_position;

                // vec3 surfaceWorldPosition = vec3(surfaceWorldPosition4)/ surfaceWorldPosition4.w;

                // compute the vector of the surface to the light
                // and pass it to the fragment shader
                v_surfaceToLight = u_light_position - surfaceWorldPosition;



                //
                //
                // vec4 vertPos4 = modelview * vec4(a_position, 1.0);
                // vertPos = vec3(vertPos4) / vertPos4.w;
                //
                // normalInterp = vec3(u_normal_mat * vec4(a_normal, 0.0));
                //
                // v_color = a_color;
                //
                // vec4 light_position4 = modelview * vec4(u_light_position, 1.0);
                // v_light_position = vec3(light_position4) / light_position4.w;
                //
                //
                // vec4 normal_position4 = modelview * vec4(a_normal, 1.0);
                // vec3 normal_position = vec3(normal_position4) / normal_position4.w;



                // FIND VECTOR FROM A_NORMAL TO (LIGHT-A_POSITION)
                // v_ben = (v_light_position - vertPos);
                // v_ben2 = normal_position; // (normal_position);




            }

          `)

          gl.shaderSource(fragment_shader,`
            precision mediump float;

            varying vec3 v_surfaceToLight;
            varying vec3 v_normal;

            //
            // varying vec3 normalInterp;
            // varying vec3 vertPos;
            // varying vec3 v_color;
            //
            // // uniform vec3 u_light_position;
            // varying vec3 v_light_position;
            // varying vec3 v_ben;
            // varying vec3 v_ben2;
            //
            // const vec3 lightPos = vec3(0.0,-2,-2.0);
            // const vec3 specColor = vec3(1.0, 1.0, 1.0);

            void main() {
              gl_FragColor = vec4(1,1,1,1);


              vec3 normal = normalize(v_normal);
              vec3 surfaceToLightDirection = normalize(v_surfaceToLight);

              float light = abs(dot(v_normal, surfaceToLightDirection));

              gl_FragColor = vec4(0.3,0.3,0.3,1.0) + (vec4(1,0,0,1) * light);


              // gl_FragColor = vec4(normal, 1);




                // vec3 normal = normalize(normalInterp);
                // vec3 lightDir = normalize(v_light_position - vertPos);
                // vec3 reflectDir = reflect(-lightDir, normal);
                // vec3 viewDir = normalize(-vertPos);
                //
                // float lambertian = max(dot(lightDir,normal), 0.0);
                // float specular = 0.0;
                //
                //
                // // lambertian = abs(lambertian);
                //
                // if(lambertian > 0.0) {
                //    float specAngle = max(dot(reflectDir, viewDir), 0.0);
                //    specular = pow(specAngle, 2.0);
                // }
                //
                // vec3 alt = vec3(1.0,1.0,1.0);
                // vec3 ambientColor = alt / 3.0;
                // vec3 diffuseColor = alt / 1.0;

                // gl_FragColor = vec4(
                //     ambientColor +
                //     lambertian * diffuseColor +
                //     specular * specColor
                //   , 1.0);

                // // only ambient
                // if(mode == 2)
                // gl_FragColor = vec4(ambientColor, 1.0);
                // // only diffuse
                // if(mode == 3)
                // gl_FragColor = vec4(lambertian*diffuseColor, 1.0);
                // // only specular
                // if(mode == 4)
                // gl_FragColor = vec4(specular*specColor, 1.0);



                // gl_FragColor.r = abs(vertPos.x - v_light_position.x);
                // gl_FragColor.g = vertPos.y - v_light_position.y;
                // gl_FragColor.b = vertPos.z - v_light_position.z;

                // gl_FragColor.r = v_ben.x;//max(dot(normalInterp,v_light_position), 0.0);

                // gl_FragColor.r = dot(normalize(v_ben), normalize(v_ben2));

                // gl_FragColor = vec4(v_ben2, 1);

                // max(dot(vertPos,v_light_position), 0.0);

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
          const a_color = gl.getAttribLocation(program, 'a_color')
          const a_normal = gl.getAttribLocation(program, 'a_normal')

          gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 4*9, 0)
          gl.vertexAttribPointer(a_color, 3, gl.FLOAT, false, 4*9, 4*3)
          gl.vertexAttribPointer(a_normal, 3, gl.FLOAT, false, 4*9, 4*6)


          // projection matrix
          const u_model = gl.getUniformLocation(program, 'u_model')
          const u_view = gl.getUniformLocation(program, 'u_view')
          const u_projection = gl.getUniformLocation(program, 'u_projection')
          const u_normal_mat = gl.getUniformLocation(program, 'u_normal_mat')
          const u_light_position = gl.getUniformLocation(program, 'u_light_position')


          const __camera = [
            // 0.742116391658783, 0.4881299138069153, 1.7520594596862793
            0,0,2
          ]


          // gl.enable(gl.CULL_FACE);
          // gl.cullFace(gl.BACK);

          const modelMatrix = mat4.create()
          // mat4.translate(modelMatrix, modelMatrix, [-1, 0, -1.5] )
          gl.uniformMatrix4fv(u_model, false, modelMatrix)

          const viewMatrix = mat4.create()
          mat4.translate(viewMatrix, viewMatrix, __camera.map(c => c*-1) )
          gl.uniformMatrix4fv(u_view, false, viewMatrix)

          const ratio = gl.canvas.clientWidth / gl.canvas.clientHeight
          const projectionMatrix = mat4.create()
          mat4.perspective(projectionMatrix, Math.PI/2, ratio, 0.1, 5)
          gl.uniformMatrix4fv(u_projection, false, projectionMatrix)


          const normalMatrix = mat4.create()
          gl.uniformMatrix4fv(u_normal_mat, false, normalMatrix)




          // Draw stuff
          gl.enableVertexAttribArray(a_position)
          gl.enableVertexAttribArray(a_color)
          gl.enableVertexAttribArray(a_normal)



          const u_point_light = gl.getUniformLocation(program, 'u_point_light')
          gl.uniformMatrix4fv(u_point_light, false, new Float32Array(1,1,1))


          // mat4.translate(modelMatrix, modelMatrix, [-1,0,-1.3] )






          function render(t) {
            if(stopped) return
            else requestAnimationFrame(render)

            // mat4.rotateY(modelMatrix, modelMatrix, 0.005 )
            // gl.uniformMatrix4fv(u_model, false, modelMatrix)

            const modelview = mat4.create()
            mat4.mul(modelview, modelMatrix, viewMatrix)
            mat4.invert(normalMatrix, modelview)
            mat4.transpose(normalMatrix, normalMatrix)
            gl.uniformMatrix4fv(u_normal_mat, false, normalMatrix)


            // gl.uniform3fv(u_light_position, [0,2*(Math.sin(t/1000)-.5),0])

            let pos = null

            try {
              pos = remoteVR.getGamepads()[0].pose.position
            } catch (e) {}

            if(pos) {
              // console.log("setting light", pos)
              // console.log("l")

              // gl.uniform3fv(u_light_position, [-pos[0], -pos[1], -pos[2]])
              gl.uniform3fv(u_light_position, pos)
            }

            gl.drawArrays(gl.TRIANGLES, 0, N/3)
          }

          stopped = false
          render()

        })


    })

  }

  return create
})(window.Reveal)
