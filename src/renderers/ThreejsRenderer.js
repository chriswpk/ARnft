import * as THREE from 'three'
import Utils from '../utils/Utils'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader';
      
export default class ThreejsRenderer {
  constructor (configData, canvasDraw, root, camera) {
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

    // postprocessing
    this.composer = new EffectComposer( this.renderer );

    const renderPass = new RenderPass( this.scene, this.camera );
    this.composer.addPass( renderPass );

    this.outlinePass = new OutlinePass( new THREE.Vector2( window.innerWidth, window.innerHeight ), this.scene, this.camera );
    this.composer.addPass(this.outlinePass);
    
    // this.effectFXAA = new ShaderPass( FXAAShader );
    // this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / window.innerWidth, 1 / window.innerHeight );
    // this.composer.addPass(this.effectFXAA);
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

    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( 45, 75, 75 );
    this.scene.add(dirLight);
    
    document.addEventListener('getMatrixGL_RH', (ev) => {
      this.root.visible = true
      const matrix = Utils.interpolate(ev.detail.matrixGL_RH)
      Utils.setMatrix(this.root.matrix, matrix)
    })

    document.addEventListener('nftTrackingLost', () => {
      this.root.visible = false
    })

    this.root.visible = false

    this.scene.add(this.root)
    document.addEventListener('getWindowSize', (ev) => {
      this.renderer.setSize(ev.detail.sw, ev.detail.sh)
      this.composer.setSize(ev.detail.sw, ev.detail.sh);
      // this.effectFXAA.uniforms[ 'resolution' ].value.set( 1 / ev.detail.sw, 1 / ev.detail.sh );
    })

    const setInitRendererEvent = new CustomEvent('onInitThreejsRendering', { detail: { renderer: this.renderer, scene: this.scene,  camera: this.camera } })
    document.dispatchEvent(setInitRendererEvent)
  }

  draw () {
    // this.renderer.render(this.scene, this.camera)
    this.composer.render();
  }

  // tick to be implemented
  /* tick () {
    this.draw()
    window.requestAnimationFrame(this.tick)
  }*/
}
