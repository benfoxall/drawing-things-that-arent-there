function TrianglesSlide(selector) {

  const root = document.querySelector(selector)

  for(let part of root.querySelectorAll('#TRIANGLES, #TRIANGLE_STRIP')) {

    let i = 0;
    for(let path of part.querySelectorAll('path')) {
      path.style.transitionDelay = (i+=0.5) + 's'
    }
  }

  // #TRIANGLES *, #TRIANGLE_STRIP_2 *, #TRIANGLE_STRIP *, #POINTS_2 *

  function show(what) {
    what.forEach(d => {
      for(let path of root.querySelectorAll(`#${d} path`)){
        path.style.opacity = 1
      }
    })
  }
  function hide(what) {
    what.forEach(d => {
      for(let path of root.querySelectorAll(`#${d} path`)){
        path.style.opacity = 0
      }
    })
  }

  new SlideBuilder(root)
    .fragments([
      () => {
        show(['TRIANGLES'])
      },
      () => {
        hide(['TRIANGLES'])
      },
      () => {
        show(['TRIANGLE_STRIP'])
      },
      () => {
        hide(['TRIANGLE_STRIP'])
      },
      () => {
        show(['POINTS_2'])
      },
      () => {
        show(['TRIANGLE_STRIP_2'])
      },

    ])

}
