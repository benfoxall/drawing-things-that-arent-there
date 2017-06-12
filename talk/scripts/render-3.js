window.Render3 = (function(Reveal) {

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
            // uniform mat4 u_model;
            // uniform mat4 u_view;
            // uniform mat4 u_projection;
            // uniform vec3 u_point_light;
            //
            // attribute vec3 a_position;
            // attribute vec3 a_color;
            // attribute vec3 a_normal;
            //
            // varying vec3 v_color;
            // varying float v_incidence;
            // varying vec3 v_surfaceToLight;
            // varying vec3 v_surfaceToCamera;
            //
            // varying vec4 v_normal;
            // varying vec4 v_eye;
            //
            // void main() {
            //   gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
            //   v_color = a_normal;
            //   v_color = a_color;
            //
            //   // v_normal = a_normal;
            //
            //
            //
            //   v_normal = normalize(u_view * vec4(a_normal, 1.0));
            //   v_eye = -(u_view * u_model * vec4(a_position, 1.0));
            //   // DataOut.eye = -(m_viewModel * position);
            //
            //
            //
            //
            //   // calculate orientation from the surface to the light
            //
            //   vec3 light = vec3(0,0,0);
            //
            //   vec4 delta =
            //     (u_view * u_model * vec4(a_position, 1.0)) -
            //     (u_view * u_model * vec4(a_normal, 1.0)) -
            //     (u_view * u_model * vec4(light, 1.0));
            //
            //   v_surfaceToLight = normalize(delta.xyz/delta.w).xyz;
            //
            //
            //   vec4 orient2 =
            //     (u_view * u_model * vec4(a_normal, 1.0)) -
            //     (u_view * u_model * vec4(0,0,0, 1.0));
            //   v_surfaceToCamera = normalize(orient2.xyz/orient2.w);
            //
            //
            //
            //   // v_surfaceToLight = normalize(u_point_light - (vec4(a_normal,1) * u_model).xyz);
            //
            //   // light_normal = a_normal.xyz, u_point_light
            //
            //   // v_incidence = max(dot(a_normal.xyz, u_point_light), 0.0);
            // }



            // uniform mat4 u_model;
            // uniform mat4 u_view;
            // uniform mat4 u_projection;
            // uniform vec3 u_point_light;


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

            void main(){

                mat4 modelview = u_view * u_model;

                gl_Position = u_projection * modelview * vec4(a_position, 1.0);
                vec4 vertPos4 = modelview * vec4(a_position, 1.0);
                vertPos = vec3(vertPos4) / vertPos4.w;

                normalInterp = vec3(u_normal_mat * vec4(a_normal, 0.0));

                v_color = a_color;
            }

          `)

          // u_normal_mat
          // mat4Invert(modelview, modelviewInv);
          // mat4Transpose(modelviewInv, normalmatrix);

          gl.shaderSource(fragment_shader,`
            // precision mediump float;
            // varying vec3 v_color;
            //
            // varying vec4 v_normal;
            // varying vec4 v_eye;
            // varying vec3 v_surfaceToLight;
            // varying vec3 v_surfaceToCamera;
            //
            // void main() {
            //
            //   vec3 n = v_normal.xyz / v_normal.w;
            //   vec3 l_dir = vec3(0,30,0);
            //   float intensity = max(dot(n,l_dir), 0.0);
            //
            //   vec3 h = normalize(l_dir + v_eye.xyz);
            //   float intSpec = dot(h,n) / 3.0;
            //
            //   vec3 color = vec3(1,1,1) * abs(intSpec);
            //
            //   gl_FragColor = vec4(color, 1);
            // }
            //

            precision mediump float;

            varying vec3 normalInterp;
            varying vec3 vertPos;
            varying vec3 v_color;

            // uniform int mode;

            const vec3 lightPos = vec3(1.0,1.0,1.0);
            const vec3 ambientColor = vec3(0.2, 0.0, 0.0);
            const vec3 diffuseColor = vec3(0.5, 0.0, 0.0);
            const vec3 specColor = vec3(0.0, 1.0, 1.0);

            void main() {
                vec3 normal = normalize(normalInterp);
                vec3 lightDir = normalize(lightPos - vertPos);
                vec3 reflectDir = reflect(-lightDir, normal);
                vec3 viewDir = normalize(-vertPos);

                float lambertian = max(dot(lightDir,normal), 0.0);
                float specular = 0.0;

                if(lambertian > 0.0) {
                   float specAngle = max(dot(reflectDir, viewDir), 0.0);
                   specular = pow(specAngle, 4.0);
                }



                gl_FragColor = vec4(v_color/2.0 +
                                  // lambertian*diffuseColor +
                                  specular*specColor, 1.0);

                // // only ambient
                // if(mode == 2) gl_FragColor = vec4(ambientColor, 1.0);
                // // only diffuse
                // if(mode == 3) gl_FragColor = vec4(lambertian*diffuseColor, 1.0);
                // // only specular
                // if(mode == 4) gl_FragColor = vec4(specular*specColor, 1.0);


                // gl_FragColor = vec4(lambertian*diffuseColor, 1.0);

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


          const modelMatrix = mat4.create()
          // mat4.translate(modelMatrix, modelMatrix, [-1, 0, -1.5] )
          gl.uniformMatrix4fv(u_model, false, modelMatrix)

          const viewMatrix = mat4.create()
          mat4.translate(viewMatrix, viewMatrix, [0, 0, -2] )
          gl.uniformMatrix4fv(u_view, false, viewMatrix)

          const ratio = gl.canvas.clientWidth / gl.canvas.clientHeight
          const projectionMatrix = mat4.create()
          mat4.perspective(projectionMatrix, Math.PI/2, ratio, 0.1, 5)
          gl.uniformMatrix4fv(u_projection, false, projectionMatrix)


          const normalMatrix = mat4.create()
          gl.uniformMatrix4fv(u_normal_mat, false, normalMatrix)



          const viewProjectionMatrix = mat4.create()
          mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix)

          const worldMatrix = mat4.create()

          const worldViewProjectionMatrix = mat4.create()
          mat4.multiply(worldViewProjectionMatrix, viewProjectionMatrix, worldMatrix)

          const worldInverseMatrix = mat4.create()
          mat4.invert(worldInverseMatrix, worldMatrix)

          const worldInverseTransposeMatrix = mat4.create()
          mat4.transpose(worldInverseTransposeMatrix, worldInverseMatrix)

          // IDENTITY
          console.log("TRANSPOSE", worldInverseTransposeMatrix)



          // Multiply the matrices.
          // var worldViewProjectionMatrix = m4.multiply(viewProjectionMatrix, worldMatrix);
          // var worldInverseMatrix = m4.inverse(worldMatrix);
          // var worldInverseTransposeMatrix = m4.transpose(worldInverseMatrix);
          //
          // // Set the matrices
          // gl.uniformMatrix4fv(worldViewProjectionLocation, false, worldViewProjectionMatrix);
          // gl.uniformMatrix4fv(worldInverseTransposeLocation, false, worldInverseTransposeMatrix);
          // gl.uniformMatrix4fv(worldLocation, false, worldMatrix);


          // Draw stuff
          gl.enableVertexAttribArray(a_position)
          gl.enableVertexAttribArray(a_color)
          gl.enableVertexAttribArray(a_normal)



          const u_point_light = gl.getUniformLocation(program, 'u_point_light')
          gl.uniformMatrix4fv(u_point_light, false, new Float32Array(1,1,1))



          function render(t) {
            if(stopped) return
            else requestAnimationFrame(render)

            mat4.rotateY(modelMatrix, modelMatrix, 0.01 )
            gl.uniformMatrix4fv(u_model, false, modelMatrix)

            // mat4.rotateX(viewMatrix, viewMatrix, 0.01 )
            // gl.uniformMatrix4fv(u_view, false, viewMatrix)

            // u_normal_mat
            // mat4Invert(modelview, modelviewInv);
            // mat4Transpose(modelviewInv, normalmatrix);

            const modelview = mat4.create()
            mat4.mul(modelview, modelMatrix, viewMatrix)

            mat4.invert(normalMatrix, modelview)
            mat4.transpose(normalMatrix, normalMatrix)

            // console.log(normalMatrix)

            gl.uniformMatrix4fv(u_normal_mat, false, normalMatrix)

            gl.drawArrays(gl.TRIANGLES, 0, 9)
          }

          stopped = false
          render()

        })


    })

  }

  return create
})(window.Reveal)
