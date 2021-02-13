import * as THREE from 'three'
import Utils from '../utils/Utils'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';

const defaultOutlineParams = {
  edgeStrength: 3.0,
  edgeGlow: 0.0,
  edgeThickness: 1.0,
  pulsePeriod: 0,
  usePatternTexture: false
};

export default class ThreejsRenderer {
  constructor(configData, canvasDraw, root, camera) {
    this.clock = new THREE.Clock();
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
      logarithmicDepthBuffer: configData.renderer.logarithmicDepthBuffer,
      powerPreference: configData.renderer.powerPreference || 'default'
    })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.scene = new THREE.Scene()
    if (camera === true) {
      console.log(`Camera NF: ${eval(configData.camera.fov)} ${eval(configData.camera.ratio)}`)
      this.camera = new THREE.PerspectiveCamera( eval(configData.camera.fov), eval(configData.camera.ratio), parseInt(configData.camera.near), parseInt(configData.camera.far));
    } else {
      this.camera = new THREE.Camera()
    }
    
    // if (!configData.outline)
    //   configData.outline = defaultOutlineParams;
    
    // postprocessing
    // this.composer = new EffectComposer( this.renderer );

    // const renderPass = new RenderPass( this.scene, this.camera );
    // this.composer.addPass( renderPass );

    // this.outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.scene, this.camera);
    // this.outlinePass.edgeStrength = Number(configData.outline.edgeStrength);
    // this.outlinePass.edgeGlow = Number( configData.outline.edgeGlow );
    // this.outlinePass.edgeThickness = Number( configData.outline.edgeThickness );
    // this.outlinePass.pulsePeriod = Number(configData.outline.pulsePeriod);
    // this.outlinePass.visibleEdgeColor.set(configData.outline.visibleEdgeColor || '#ffffff');
    // this.outlinePass.hiddenEdgeColor.set(configData.outline.hiddenEdgeColor  || '#190a05');
    // this.composer.addPass(this.outlinePass);

    this.mixers = [];
  }

  initRenderer () {
    this.camera.matrixAutoUpdate = false
    document.addEventListener('getProjectionMatrix', (ev) => {
      Utils.setMatrix(this.camera.projectionMatrix, ev.detail.proj)
    })

    // document.addEventListener('setOutline', (ev) => {
    //   this.outlinePass.edgeStrength = Number(ev.edgeStrength);
    //   this.outlinePass.edgeGlow = Number(ev.edgeGlow);
    //   this.outlinePass.edgeThickness = Number(ev.edgeThickness);
    //   this.outlinePass.pulsePeriod = Number(ev.pulsePeriod);
    // });

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
      const matrix = Utils.interpolate(ev.detail.matrixGL_RH)
      Utils.setMatrix(this.root.matrix, matrix)
    })

    document.addEventListener('nftTrackingLost', () => {
      this.root.visible = false
    })

    this.root.visible = false

    this.scene.add(this.root)
    document.addEventListener('getWindowSize', (ev) => {
      // this.camera.aspect = ev.detail.sw / ev.detail.sh;
      // this.camera.updateProjectionMatrix();

      this.renderer.setSize(ev.detail.sw, ev.detail.sh)
      // this.composer.setSize(ev.detail.sw, ev.detail.sh);

    })

    const setInitRendererEvent = new CustomEvent('onInitThreejsRendering', {
      // detail: { renderer: this.renderer, root: this.root, scene: this.scene, camera: this.camera, outlinePass: this.outlinePass, mixers: this.mixers }
      detail: { renderer: this.renderer, root: this.root, scene: this.scene, camera: this.camera, mixers: this.mixers }
    })
    document.dispatchEvent(setInitRendererEvent)
  }

  draw () {
    const dt = this.clock.getDelta();

    for (let index = 0; index < this.mixers.length; index++) {
      const element = this.mixers[index];
      element.update( dt );
    }

    this.renderer.render(this.scene, this.camera)
    // this.composer.render();
  }

  // tick to be implemented
  /* tick () {
    this.draw()
    window.requestAnimationFrame(this.tick)
  }*/
}
