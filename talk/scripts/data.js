class Data {

  constructor() { }

  clear() {}


  set(positions, orientations) {

    console.log("setting new positions & orientations")

    return Promise.all([
      localforage.setItem('positions', positions),
      localforage.setItem('orientations', orientations)
    ])
  }

  get() {
    return Promise.all([
      localforage.getItem('positions'),
      localforage.getItem('orientations')
    ])
  }



  toVectors() {
    return this.get()
      // orientations not used, but meh
      .then(([positions, orientations]) => {
        const data = new Float32Array(positions.length*3)
        positions.forEach((p, i) => {
          i *= 3
          data[i++] = p[0]
          data[i++] = p[1]
          data[i++] = p[2]
        })

        return data
      })
  }

  toVectorStrip() {
    return this.get()
      .then(([positions, orientations]) => {

        const data = new Float32Array(positions.length*6)

        positions.forEach((p, i) => {

          data[i*6 + 0] = p[0]
          data[i*6 + 1] = p[1]
          data[i*6 + 2] = p[2]

          const quat = new Quaternion(orientations[i])
          const by = quat.rotateVector([0,0.0,0.04])

          data[i*6 + 3] = p[0] + by[0]
          data[i*6 + 4] = p[1] + by[1]
          data[i*6 + 5] = p[2] + by[2]

        })
        return data
      })
  }

  toVectorStripWithNormals() {
    return this.get()
      .then(([positions, orientations]) => {

        const data = new Float32Array(positions.length*12)

        positions.forEach((p, i) => {

          const quat = new Quaternion(orientations[i])
          const by = quat.rotateVector([0,0.0,0.04])

          const prior = positions[i-1] || [0,0,0]

          const n = triangleNormal(
            p[0], p[1], p[2],
            p[0] + by[0], p[1] + by[1], p[2] + by[1],
            prior[0], prior[1], prior[2]
          )

          // l = n

          let idx = i * 12

          // A
          data[idx++] = p[0]
          data[idx++] = p[1]
          data[idx++] = p[2]

          // A Normal
          data[idx++] = n[0]
          data[idx++] = n[1]
          data[idx++] = n[2]


          // B
          data[idx++] = p[0] + by[0]
          data[idx++] = p[1] + by[1]
          data[idx++] = p[2] + by[2]

          // B Normal (same)
          data[idx++] = n[0]
          data[idx++] = n[1]
          data[idx++] = n[2]

        })

        return data

      })
  }


  // ❤️ https://github.com/hughsk/triangle-normal ❤️
  triangleNormal(x0, y0, z0, x1, y1, z1, x2, y2, z2, output) {
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

}


const data = new Data()
