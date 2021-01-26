import Utils from './utils/Utils'
import Container from './utils/html/Container'
import Stats from 'stats.js'
import ThreejsRenderer from './renderers/ThreejsRenderer'
import BabylonjsRenderer from './renderers/BabylonjsRenderer'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { CSS3DObject } from "three/examples//jsm/renderers/CSS3DRenderer";

function VideoElement(id, x, y, z, ry) {
  const div = document.createElement("div");
  div.style.width = "480px";
  div.style.height = "360px";
  div.style.backgroundColor = "#000";

  const iframe = document.createElement("iframe");
  iframe.style.width = "480px";
  iframe.style.height = "360px";
  iframe.style.border = "0px";
  iframe.src = ["https://www.youtube.com/embed/", id, "?rel=0"].join("");
  div.appendChild(iframe);

  const object = new CSS3DObject(div);
  object.position.set(x, y, z);
  object.rotation.y = ry;

  return object;
}

export default class ARnft {
  constructor (width, height, config, renderType) {
    this.width = width
    this.height = height
    if (renderType === 'three') {
      this.renderer = null
      this.root = new THREE.Object3D()
      this.cssRoot = new THREE.Object3D()
      this.root.matrixAutoUpdate = false
      this.cssRoot.matrixAutoUpdate = false
    } else if (renderType === 'babylon') {
      this.root = null
    }
    this.config = config
    this.listeners = {}
    this.version = '0.8.4'
    console.log('ARnft ', this.version)
  }

  _initialize (markerUrl, stats, camera) {
    console.log('ARnft init() %cstart...', 'color: yellow; background-color: blue; border-radius: 4px; padding: 2px')
    const root = this.root
    const cssRoot = this.cssRoot
    const config = this.config
    let data
    if (typeof(config) == 'object') {
      data = Utils.jsonObjParser(config)
    } else {
      data = Utils.jsonParser(config)
    }

    data.then((configData) => {
      Container.createLoading(configData)
      Container.createStats(stats)
      const containerObj = Container.createContainer()
      const container = containerObj.container
      const canvas = containerObj.canvas

      let statsMain, statsWorker

      if (stats) {
        statsMain = new Stats()
        statsMain.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        document.getElementById('stats1').appendChild(statsMain.dom)

        statsWorker = new Stats()
        statsWorker.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
        document.getElementById('stats2').appendChild(statsWorker.dom)
      }

      const statsObj = {
        statsMain: statsMain,
        statsWorker: statsWorker,
        stats: stats
      }

      Utils.getUserMedia(configData).then((video) => {
        Utils._startWorker(
          container,
          markerUrl,
          video,
          video.videoWidth,
          video.videoHeight,
          canvas,
          () => {
            if (statsObj.stats) {
              statsObj.statsMain.update()
            }
          },
          () => {
            if (statsObj.stats) {
              statsObj.statsWorker.update()
            }
          },
          configData)
      })

      if (configData.renderer.type === 'three') {
        const renderer = new ThreejsRenderer(configData, canvas, root, camera, cssRoot, container)
        renderer.initRenderer()
        this.renderer = renderer
        const setRendererEvent = new CustomEvent('onAfterInitThreejsRendering', { detail: { renderer: renderer } })
        document.dispatchEvent(setRendererEvent)
        const tick = () => {
          renderer.draw()
          window.requestAnimationFrame(tick)
        }
        tick()
      } else if (configData.renderer.type === 'babylon') {
        const renderer = new BabylonjsRenderer(configData, canvas, root)
        renderer.initRenderer()
        const tick = () => {
          renderer.draw()
          window.requestAnimationFrame(tick)
        }
        tick()
      }
    })
    return this
  }

  static async init (width, height, markerUrl, config, stats, camera) {
    const nft = new ARnft(width, height, config)
    return await nft._initialize(markerUrl, stats, camera)
  }

  add (obj) {
    const root = this.root
    document.addEventListener('getNFTData', (ev) => {
      var msg = ev.detail
      obj.position.y = (msg.height / msg.dpi * 2.54 * 10) / 2.0
      obj.position.x = (msg.width / msg.dpi * 2.54 * 10) / 2.0
    })
    root.add(obj)
  }

  addB () {
    //let scene = BabylonjsRenderer.getScene()
    //console.log(scene);
    //var box = new BABYLON.Mesh.CreateBox("box", {height: 5}, scene)
    //box.parent = BabylonjsRenderer.getRoot()
  }

  addModel (url, x, y, z, scale, rx, ry, rz) {
    const root = this.root
    let model

    /* Load Model */
    const threeGLTFLoader = new GLTFLoader()

    threeGLTFLoader.load(url, gltf => {
      model = gltf.scene
      model.traverse((object) => {
        if (object.isMesh) object.material.transparent = false;
      })
      model.scale.set(scale, scale, scale)
      model.rotation.x = Math.PI / 2
      model.position.x = x
      model.position.y = y
      model.position.z = z
      model.rotateX(rx)
      model.rotateY(ry)
      model.rotateZ(rz)

      root.add(model)
    })
  }

  addImage (url, color, scale) {
    const root = this.root
    const texture = new THREE.TextureLoader().load(url)
    const mat = new THREE.MeshLambertMaterial({ color: color, map: texture })
    const planeGeom = new THREE.PlaneGeometry(1, 1, 1, 1)
    const plane = new THREE.Mesh(planeGeom, mat)
    plane.scale.set(scale, scale, scale)
    document.addEventListener('getNFTData', (ev) => {
      var msg = ev.detail
      plane.position.y = (msg.height / msg.dpi * 2.54 * 10) / 2.0
      plane.position.x = (msg.width / msg.dpi * 2.54 * 10) / 2.0
    })
    root.add(plane)
  }

  addVideo (id, scale) {
    const root = this.root
    var ARVideo = document.getElementById(id)
    var texture = new THREE.VideoTexture(ARVideo)
    var mat = new THREE.MeshLambertMaterial({ color: 0xbbbbff, map: texture })
    ARVideo.play()
    var planeGeom = new THREE.PlaneGeometry(1, 1, 1, 1)
    var plane = new THREE.Mesh(planeGeom, mat)
    plane.scale.set(scale, scale, scale)
    document.addEventListener('getNFTData', (ev) => {
      var msg = ev.detail
      plane.position.y = (msg.height / msg.dpi * 2.54 * 10) / 2.0
      plane.position.x = (msg.width / msg.dpi * 2.54 * 10) / 2.0
    })
    root.add(plane)
  }

  addYoutubeVideo(id, x, y, z, ry) {
    const cssRoot = this.cssRoot;

    const group = new THREE.Group();
    group.add(VideoElement(id, x, y, z, ry));

    console.log("Added video");

    document.addEventListener('getNFTData', (ev) => {
      var msg = ev.detail
      group.position.y = (msg.height / msg.dpi * 2.54 * 10) / 2.0
      group.position.x = (msg.width / msg.dpi * 2.54 * 10) / 2.0
    })

    cssRoot.add(group);
  }

  dispatchEvent (event) {
    const listeners = this.listeners[event.name]
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        listeners[i].call(this, event)
      }
    }
  }

  addEventListener (name, callback) {
    if (!this.listeners[name]) {
      this.listeners[name] = []
    }
    this.listeners[name].push(callback)
  };

  removeEventListener (name, callback) {
    if (this.listeners[name]) {
      const index = this.listeners[name].indexOf(callback)
      if (index > -1) {
        this.listeners[name].splice(index, 1)
      }
    }
  };

  _teardownVideo (video) {
    video.srcObject.getVideoTracks()[0].stop()
    video.srcObject = null
    video.src = null
  };
}
