import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import GUI from 'lil-gui'
import vertex from './shaders/vertex.glsl'
import fragment from './shaders/fragment.glsl'
import {Fn, vec4} from "three/tsl"
import sphere360 from '../test2.jpg'
import earth from '../earth.jpg'
import dat from 'dat.gui'
import gsap from 'gsap'

function calcPosFromLatLonRad(lat, lon) {
  var phi   = (lat) * Math.PI / 180;
  var theta = (lon + 180) * Math.PI / 180;
  var theta1 = (270 - lon) * Math.PI / 180;
  let x = -Math.cos(phi) * Math.cos(theta);
  let y = Math.sin(phi);
  let z = Math.cos(phi) * Math.sin(theta);
  let vector = {x, y, z};
  let euler = new THREE.Euler(phi, theta1, 0, 'XYZ');
  let quaternion = new THREE.Quaternion().setFromEuler(euler);
  return {vector, quaternion};
}

let points = [
  {
    title: 'Kyiv',
    coords: {
      lat: 50.4501,
      lng: 30.5234
    },
    texture: sphere360
  },
  {
    title: 'Cancun',
    coords: {
      lat: 21.1619,
      lng: -86.8515
    },
    texture: sphere360
  },
  {
    title: 'Marseille',
    coords: {
      lat: 43.2965,
      lng: 5.3698
    },
    texture: sphere360
  },
]

export default class Sketch {
  constructor(options) {
    // this.scene = new THREE.Scene()
    this.scene360 = new THREE.Scene()
    this.scenePlanet = new THREE.Scene()
    this.sceneFinal = new THREE.Scene()
    
    this.container = options.dom
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(this.width, this.height)
    this.renderer.setClearColor(0xeeeeee, 1)
    this.renderer.physicallyCorrectLights = true;

    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      70, 
      // this.width / this.height, 
      window.innerWidth / window.innerHeight, 
      0.01, 
      1000
    )
    this.camera1 = new THREE.PerspectiveCamera(
      70, 
      // this.width / this.height, 
      window.innerWidth / window.innerHeight, 
      0.01, 
      1000
    )

    var frustumSize = 1;
    var aspect = window.innerWidth / window.innerHeight;
    this.cameraFinal = new THREE.OrthographicCamera(
      frustumSize / -2,
      frustumSize / 2,
      frustumSize / 2,
      frustumSize / -2,
      -1000,
      1000
    )
    this.camera.position.set(0, 0, 2)
    this.camera1.position.set(0, 0, 2)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls1 = new OrbitControls(this.camera1, this.renderer.domElement)
    this.time = 0

    this.isPlaying = true

    this.create360()
    this.createPlanet()
    this.createFinalScene()
    this.resize()
    this.render()
    this.setupResize()
    this.settings()
  }

  settings() {
    this.settings = {
      progress: 0,
    }
    this.gui = new dat.GUI()
    this.gui.add(this.settings, "progress", 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this))
  }

  resize() {
    this.width = this.container.offsetWidth
    this.height = this.container.offsetHeight
    this.renderer.setSize(this.width, this.height)
    this.camera.aspect = this.width / this.height
    
    // this.imageAspect = 853/1280;
    // let a1;
    // let a2;
    // if(this.height/this.width > this.imageAspect) {
    //     a1 = (this.height / this.width) * this.imageAspect;
    //     a2 = 1;
    // } else {
    //   a1 = 1;
    //   a2 = (this.height / this.width) / this.imageAspect;
    // }
    // this.material.uniforms.resolution.value.x = this.width;
    // this.material.uniforms.resolution.value.y = this.height;
    // this.material.uniforms.resolution.value.z = a1;
    // this.material.uniforms.resolution.value.w = a2;

    this.camera.updateProjectionMatrix()
  }

  create360() {
    this.geometry = new THREE.SphereGeometry(10, 30, 30)

    // DONT NEED THIS : Reverse the image texture
    let t = new THREE.TextureLoader().load(sphere360);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;

    this.sphere = new THREE.Mesh(
      this.geometry, 
      // this.material
      new THREE.MeshBasicMaterial({
        map: t,
        side: THREE.BackSide
      })
    )

    this.scene360.add(this.sphere)
  }

  createPlanet() {
    this.group = new THREE.Group()
    
    this.earth = new THREE.Mesh(
      new THREE.SphereGeometry(1, 30, 30),
      new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(earth),
        side: THREE.DoubleSide
      })
    )
    this.group.add(this.earth)
    this.scenePlanet.add(this.group)

    let list = document.getElementById('list');

    points.forEach(p => { 
      let coords = calcPosFromLatLonRad(p.coords.lat, p.coords.lng);

      let el = document.createElement('div');
      el.innerText = p.title;
      list.appendChild(el);

      let mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 20, 20),
        new THREE.MeshBasicMaterial({
          color: 0xff0000,
        })
      )
      this.group.add(mesh)
      mesh.position.copy(coords.vector)

      let animatedQuaternion = new THREE.Quaternion();
      let currentQuaternion = new THREE.Quaternion();

      el.addEventListener('click', () => {
        let o = {p: 0};
        currentQuaternion.copy(this.group.quaternion);
        gsap.to(o, {
          p: 1,
          duration: 1,
          onUpdate:() => {
            // console.log('o.p ', o.p);
            animatedQuaternion.slerpQuaternions(currentQuaternion, coords.quaternion, o.p);
            this.group.quaternion.copy(animatedQuaternion);
          }
        })
        gsap.to(this.settings, {
          duration: 1,
          delay: 0.5,
          progress: 1,
          // ease: 'power2.inOut',
          // onUpdate: () => {
          //   this.material.uniforms.progress.value = this.settings.progress;
          // }
        })
        let coords = calcPosFromLatLonRad(p.coords.lat, p.coords.lng);
        this.group.quaternion.copy(coords.quaternion);
      })
    })
  }

  createFinalScene() {
    this.texture360 = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    this.texturePlanet = new THREE.WebGLRenderTarget(this.width, this.height, {
      format: THREE.RGBFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    this.material = new THREE.ShaderMaterial({
      // extensions: { derivatives: true, fragDepth: true, drawBuffers: true },
      side: THREE.DoubleSide,
      uniforms: { 
        progress: { value: 0 },
        scene360: { value: null },
        scenePlanet: { value: null }
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      // wireframe: true
    })

    let geo = new THREE.PlaneGeometry(1, 1);
    let mesh = new THREE.Mesh(geo, this.material);

    this.sceneFinal.add(mesh);
  }

  stop() {
    this.isPlaying = false
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return
    this.time += 0.05
    // this.material.uniforms.time.value = this.time
    requestAnimationFrame(this.render.bind(this))

    this.renderer.setRenderTarget(this.texture360);
    this.renderer.render(this.scene360, this.camera);

    this.renderer.setRenderTarget(this.texturePlanet);
    this.renderer.render(this.scenePlanet, this.camera);

    this.material.uniforms.scene360.value = this.texture360.texture;
    this.material.uniforms.scenePlanet.value = this.texturePlanet.texture;
    this.material.uniforms.progress.value = this.settings.progress;

    this.renderer.setRenderTarget(null);
    this.renderer.render(this.sceneFinal, this.cameraFinal);
  }
}

new Sketch({
  dom: document.getElementById('container')
})
