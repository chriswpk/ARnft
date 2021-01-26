import * as THREE from 'three'
import Utils from '../utils/Utils'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer'

export default class ThreejsRenderer {
  constructor (configData, canvasDraw, root, camera, cssRoot, cssContainer) {
    this.root = root
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasDraw,
      context: configData.renderer.context,
      alpha: configData.renderer.alpha,
      premultipliedAlpha: configData.renderer.premultipliedAlpha,
      antialias: configData.renderer.antialias,
      stencil: configData.renderer.stencil,
      precision: configData.renderer.precision,
      depth: configData.renderer.depth,
      logarithmicDepthBuffer: configData.renderer.logarithmicDepthBuffer
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.scene = new THREE.Scene()
    if (camera === true) {
      this.camera = new THREE.PerspectiveCamera( configData.camera.fov, configData.camera.ratio, configData.camera.near, configData.camera.far );
    } else {
      this.camera = new THREE.Camera()
    }

    // Create css3d renderer
    this.cssRoot = cssRoot;
    this.cssRenderer = new CSS3DRenderer({ alpha: true });
    this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
    this.cssRenderer.domElement.style.position = "absolute";
    this.cssRenderer.domElement.style.top = 0;
    this.cssRenderer.domElement.style.zIndex = 2;
    cssContainer.appendChild(this.cssRenderer.domElement);
    this.cssScene = new THREE.Scene();
  }

  initRenderer () {
    this.camera.matrixAutoUpdate = false
    document.addEventListener('getProjectionMatrix', (ev) => {
      Utils.setMatrix(this.camera.projectionMatrix, ev.detail.proj)
    })
    this.scene.add(this.camera)

    const light = new THREE.AmbientLight(0xffffff)
    this.scene.add(light)

    // const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
    // hemiLight.position.set( 0, 0, 0 );
    // this.scene.add( hemiLight );

    // const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    // dirLight.position.set( 45, 75, 75 );
    // this.scene.add(dirLight);
    
    document.addEventListener('getMatrixGL_RH', (ev) => {
      this.root.visible = true
      this.cssRoot.visible = true
      const matrix = Utils.interpolate(ev.detail.matrixGL_RH)
      Utils.setMatrix(this.root.matrix, matrix)
      Utils.setMatrix(this.cssRoot.matrix, matrix)
    })

    document.addEventListener('nftTrackingLost', () => {
      this.root.visible = false
      this.cssRoot.visible = false
    })

    this.root.visible = false
    this.cssRoot.visible = false

    this.scene.add(this.root)
    this.cssScene.add(this.cssRoot)
    document.addEventListener('getWindowSize', (ev) => {
      this.renderer.setSize(ev.detail.sw, ev.detail.sh)
      this.cssRenderer.setSize(ev.detail.sw, ev.detail.sh)
    })

    const setInitRendererEvent = new CustomEvent('onInitThreejsRendering', { detail: { renderer: this.renderer, scene: this.scene,  camera: this.camera, cssScene: this.cssScene } })
    document.dispatchEvent(setInitRendererEvent)
  }

  draw () {
    this.renderer.render(this.scene, this.camera)
    this.cssRenderer.render(this.cssScene, this.camera)
  }

  // tick to be implemented
  /* tick () {
    this.draw()
    window.requestAnimationFrame(this.tick)
  }*/
}
