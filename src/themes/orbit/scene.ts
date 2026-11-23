import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  Group,
  HalfFloatType,
  IcosahedronGeometry,
  InstancedMesh,
  LineLoop,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  type Material,
  type Texture,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { createStage, type Stage } from '../../shared/stage'

/**
 * Orbit — Jateen is the sun, his five kinds of work are planets.
 *
 * The camera is never eased toward a target: every frame its position is read
 * straight off two Catmull-Rom splines (position + look-at) at a parameter that
 * comes from scroll progress. Planets only orbit while the visitor rests at the
 * very top; the moment they scroll, the system freezes, so the spline through the
 * planet viewpoints is stable for the whole tour.
 */

export type PlanetDef = {
  color: string
  color2: string
  color3: string
  atmo: string
  radius: number
  orbit: number
  speed: number
  phase: number
  /** 0 ocean world, 1 gas bands, 2 ice/cracked, 3 desert/rock */
  kind: number
  ring?: boolean
  moon?: boolean
  tilt?: number
}

export type ScrollState = { hero: number; tour: number; after: number }

export type OrbitScene = {
  setScroll: (s: ScrollState) => void
  setPointer: (x: number, y: number) => void
  /** DOM labels positioned over each planet while the hero is on screen. */
  bindLabels: (els: HTMLElement[], box: HTMLElement) => void
  dispose: () => void
}

/* ------------------------------------------------------------------ shaders */

const NOISE = /* glsl */ `
float hash(vec3 p){ p = fract(p*0.3183099+vec3(.1,.2,.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=0.5, s=0.0; for(int i=0;i<OCT;i++){ s+=a*vnoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; } return s; }
`

const planetVert = /* glsl */ `
varying vec3 vPosW; varying vec3 vNrmW; varying vec3 vPosL;
void main(){
  vPosL = normalize(position);
  vec4 w = modelMatrix * vec4(position,1.0);
  vPosW = w.xyz;
  vNrmW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`

const planetFrag = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uC; uniform vec3 uAtmo;
uniform float uKind; uniform float uSeed; uniform float uTime;
uniform vec3 uCenter; uniform float uRadius;
uniform vec3 uRingN; uniform vec2 uRing; // ring inner/outer in planet radii (0 = no ring)
varying vec3 vPosW; varying vec3 vNrmW; varying vec3 vPosL;
${NOISE}
void main(){
  vec3 p = vPosL * 2.2 + uSeed;
  vec3 col;
  float spec = 0.0;
  if (uKind < 0.5) {            // ocean world
    float n = fbm(p);
    float land = smoothstep(0.5, 0.56, n);
    col = mix(uA, uB, land);
    col = mix(col, uC, smoothstep(0.66, 0.78, n));
    float cloud = smoothstep(0.55, 0.75, fbm(p*1.6 + vec3(uTime*0.02, 0.0, 0.0)));
    col = mix(col, vec3(0.92), cloud*0.55);
    spec = (1.0-land)*(1.0-cloud);
  } else if (uKind < 1.5) {     // gas giant: warped bands
    float w = fbm(p*vec3(1.0,3.0,1.0));
    float b = sin(vPosL.y*14.0 + w*5.0);
    col = mix(uA, uB, smoothstep(-0.6, 0.6, b));
    col = mix(col, uC, smoothstep(0.55, 0.9, fbm(p*vec3(2.0,6.0,2.0))) * 0.6);
  } else if (uKind < 2.5) {     // ice: ridged cracks
    float r = 1.0 - abs(fbm(p*1.4)*2.0 - 1.0);
    col = mix(uA, uB, smoothstep(0.55, 0.95, r));
    col = mix(col, uC, smoothstep(0.62, 0.8, fbm(p*0.8)));
    spec = 0.35;
  } else {                      // dusty rock
    float n = fbm(p*1.2);
    col = mix(uA, uB, smoothstep(0.35, 0.7, n));
    col = mix(col, uC, smoothstep(0.7, 0.85, fbm(p*3.0))*0.7);
  }
  vec3 N = normalize(vNrmW);
  vec3 L = normalize(-vPosW); // the sun sits at the origin
  vec3 V = normalize(cameraPosition - vPosW);
  float nl = dot(N, L);
  float diff = smoothstep(-0.18, 0.55, nl);
  // ring shadow on the planet
  if (uRing.y > 0.0) {
    float d = dot(L, uRingN);
    if (abs(d) > 0.001) {
      float t = dot(uCenter - vPosW, uRingN) / d;
      if (t > 0.0) {
        float rr = length(vPosW + L*t - uCenter) / uRadius;
        float band = smoothstep(uRing.x, uRing.x+0.08, rr) * (1.0 - smoothstep(uRing.y-0.15, uRing.y, rr));
        diff *= 1.0 - 0.55*band*(0.6+0.4*sin(rr*40.0));
      }
    }
  }
  vec3 H = normalize(L + V);
  float sp = pow(max(dot(N, H), 0.0), 90.0) * spec * diff;
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.6);
  vec3 c = col * (0.035 + diff * 1.05) + sp * vec3(1.0, 0.9, 0.75) * 0.35;
  c += uAtmo * fres * (0.15 + 1.1 * smoothstep(-0.3, 0.6, nl));
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const atmoVert = /* glsl */ `
varying vec3 vNrmW; varying vec3 vPosW;
void main(){
  vec4 w = modelMatrix * vec4(position,1.0);
  vPosW = w.xyz; vNrmW = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const atmoFrag = /* glsl */ `
uniform vec3 uAtmo; uniform vec3 uCenter; uniform float uR; uniform float uRs;
varying vec3 vNrmW; varying vec3 vPosW;
void main(){
  // distance of the view ray from the planet centre: glow fades from the surface to the shell edge
  vec3 D = normalize(vPosW - cameraPosition);
  float t = dot(uCenter - cameraPosition, D);
  vec3 q = cameraPosition + D * t;
  float d = length(q - uCenter);
  float x = clamp((d - uR) / (uRs - uR), 0.0, 1.0);
  float g = pow(1.0 - x, 2.6);
  float lit = smoothstep(-0.45, 0.55, dot(normalize(q - uCenter), normalize(-uCenter)));
  gl_FragColor = vec4(uAtmo * g * (0.08 + lit) * 1.25, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const ringVert = /* glsl */ `
varying vec3 vPosW; varying float vR;
uniform float uInner; uniform float uOuter;
void main(){
  vR = (length(position.xy) - uInner) / (uOuter - uInner);
  vec4 w = modelMatrix * vec4(position,1.0); vPosW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const ringFrag = /* glsl */ `
uniform vec3 uA; uniform vec3 uB; uniform vec3 uCenter; uniform float uRadius;
varying vec3 vPosW; varying float vR;
float h1(float x){ return fract(sin(x*127.1)*43758.5453); }
void main(){
  float r = vR;
  float bands = 0.55 + 0.45*sin(r*48.0 + sin(r*9.0)*2.0) * (0.6 + 0.4*h1(floor(r*36.0)));
  float gap = smoothstep(0.55, 0.57, r) * (1.0 - smoothstep(0.6, 0.62, r));
  float a = bands * smoothstep(0.0, 0.06, r) * (1.0 - smoothstep(0.9, 1.0, r)) * (1.0 - gap*0.85);
  // planet shadow on the ring
  vec3 L = normalize(-vPosW);
  vec3 oc = vPosW - uCenter;
  float b = dot(oc, L); float c = dot(oc, oc) - uRadius*uRadius;
  float disc = b*b - c;
  float shade = 1.0;
  if (disc > 0.0 && (-b - sqrt(disc)) > 0.0) shade = 0.12;
  vec3 col = mix(uA, uB, r) * (0.25 + 0.9*shade);
  gl_FragColor = vec4(col, a * 0.85);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const sunFrag = /* glsl */ `
uniform float uTime; uniform float uBoost;
varying vec3 vPosW; varying vec3 vNrmW; varying vec3 vPosL;
${NOISE}
void main(){
  vec3 p = vPosL*3.0;
  float n = fbm(p + vec3(0.0, uTime*0.05, uTime*0.03));
  float n2 = fbm(p*2.6 - vec3(uTime*0.04));
  vec3 V = normalize(cameraPosition - vPosW);
  float mu = max(dot(normalize(vNrmW), V), 0.0);
  vec3 deep = vec3(1.0, 0.28, 0.04);
  vec3 hot = vec3(1.0, 0.72, 0.32);
  vec3 col = mix(deep, hot, smoothstep(0.3, 0.75, n*0.7 + n2*0.5));
  col *= 0.65 + 0.55*pow(mu, 0.45);
  gl_FragColor = vec4(col * uBoost, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const glowFrag = /* glsl */ `
uniform vec3 uColor; uniform float uStrength;
varying vec2 vUv;
void main(){
  float d = length(vUv - 0.5) * 2.0;
  float g = pow(max(1.0 - d, 0.0), 2.4) + 0.35*pow(max(1.0 - d, 0.0), 8.0);
  gl_FragColor = vec4(uColor * g * uStrength, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`
const glowVert = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  // camera-facing quad
  vec4 mv = modelViewMatrix * vec4(0.0,0.0,0.0,1.0);
  float s = length(modelMatrix[0].xyz);
  mv.xy += position.xy * s;
  gl_Position = projectionMatrix * mv;
}`

const starVert = /* glsl */ `
attribute float aSize; attribute float aSeed; attribute vec3 aColor;
uniform float uTime; uniform float uDpr;
varying vec3 vColor; varying float vTw;
void main(){
  vColor = aColor;
  vTw = 0.65 + 0.35*sin(uTime*(0.6+aSeed*1.8) + aSeed*40.0);
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_PointSize = aSize * uDpr;
  gl_Position = projectionMatrix * mv;
}`
const starFrag = /* glsl */ `
varying vec3 vColor; varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);
  a = a*a;
  gl_FragColor = vec4(vColor * a * vTw, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`

const lineVert = /* glsl */ `
attribute float aAngle; varying float vA;
void main(){ vA = aAngle; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const lineFrag = /* glsl */ `
uniform float uPlanet; uniform vec3 uColor; uniform float uOpacity;
varying float vA;
void main(){
  float t = fract((uPlanet - vA) / 6.2831853);
  float a = 0.05 + 0.5*pow(1.0 - t, 6.0);
  gl_FragColor = vec4(uColor, a * uOpacity);
  #include <colorspace_fragment>
}`

/** One-off bake of the nebula into an equirect texture, sampled by the sky sphere. */
const nebulaFrag = /* glsl */ `
varying vec2 vUv;
${NOISE}
void main(){
  float u = vUv.x * 6.2831853; float th = (1.0 - vUv.y) * 3.1415926;
  vec3 d = vec3(-cos(u)*sin(th), cos(th), sin(u)*sin(th));
  float band = exp(-pow(d.y*2.6 + 0.35*sin(u*1.3), 2.0));          // a soft galactic band
  float n = fbm(d*2.2 + 4.0);
  float n2 = fbm(d*5.0 - 2.0);
  vec3 c = vec3(0.0);
  c += vec3(0.10, 0.12, 0.30) * smoothstep(0.35, 0.8, n) * (0.5 + band);
  c += vec3(0.28, 0.08, 0.26) * smoothstep(0.55, 0.85, n2) * band * 0.9;
  c += vec3(0.04, 0.16, 0.20) * smoothstep(0.5, 0.9, fbm(d*3.1 + 9.0)) * 0.8;
  c *= 0.26;
  gl_FragColor = vec4(c, 1.0);
}`

/* ------------------------------------------------------------------ helpers */

const lin = (hex: string) => new Color(hex)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}
const ease = (x: number) => {
  const t = clamp01(x)
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

type Key = { pos: Vector3; look: Vector3; sx: number; sy: number }

/* ------------------------------------------------------------------ scene */

export function createOrbitScene(canvas: HTMLCanvasElement, planets: PlanetDef[]): OrbitScene | null {
  const small = window.innerWidth < 700
  const OCT = small ? 3 : 4
  const defines = { OCT }

  const scene = new Scene()
  const camera = new PerspectiveCamera(small ? 50 : 38, 1, 0.1, 900)
  const disposables: { dispose: () => void }[] = []
  const track = <T extends { dispose: () => void }>(x: T) => {
    disposables.push(x)
    return x
  }

  let stage: Stage | null = null
  let composer: EffectComposer | null = null
  let bloom: UnrealBloomPass | null = null
  let useBloom = !small

  /* sky: baked nebula + two star layers */
  const skyMat = track(new ShaderMaterial({ side: BackSide, depthWrite: false, uniforms: { tMap: { value: null as Texture | null } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);}', fragmentShader: 'uniform sampler2D tMap; varying vec2 vUv; void main(){ gl_FragColor = texture2D(tMap, vUv); \n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}' }))
  const sky = new Mesh(track(new SphereGeometry(400, 48, 24)), skyMat)
  scene.add(sky)

  const starCount = small ? 1400 : 3200
  const sPos = new Float32Array(starCount * 3)
  const sSize = new Float32Array(starCount)
  const sSeed = new Float32Array(starCount)
  const sCol = new Float32Array(starCount * 3)
  const tints = [lin('#ffffff'), lin('#cfdcff'), lin('#ffe3c2'), lin('#b9c8ff')]
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  for (let i = 0; i < starCount; i++) {
    const r = 160 + rand() * 200
    const t = rand() * Math.PI * 2
    const u = rand() * 2 - 1
    const s = Math.sqrt(1 - u * u)
    sPos.set([r * s * Math.cos(t), r * u * 0.85, r * s * Math.sin(t)], i * 3)
    const big = rand() < 0.04
    sSize[i] = big ? 2.6 + rand() * 1.6 : 0.9 + rand() * 1.3
    sSeed[i] = rand()
    const c = tints[Math.floor(rand() * tints.length)]
    const k = big ? 1.4 : 0.5 + rand() * 0.6
    sCol.set([c.r * k, c.g * k, c.b * k], i * 3)
  }
  const sg = track(new BufferGeometry())
  sg.setAttribute('position', new BufferAttribute(sPos, 3))
  sg.setAttribute('aSize', new BufferAttribute(sSize, 1))
  sg.setAttribute('aSeed', new BufferAttribute(sSeed, 1))
  sg.setAttribute('aColor', new BufferAttribute(sCol, 3))
  const starMat = track(new ShaderMaterial({ vertexShader: starVert, fragmentShader: starFrag, uniforms: { uTime: { value: 0 }, uDpr: { value: 1 } }, transparent: true, depthWrite: false, blending: AdditiveBlending }))
  const stars = new Points(sg, starMat)
  scene.add(stars)

  /* sun */
  const sunMat = track(new ShaderMaterial({ vertexShader: planetVert, fragmentShader: sunFrag, defines, uniforms: { uTime: { value: 0 }, uBoost: { value: useBloom ? 1.3 : 1.2 } } }))
  const sun = new Mesh(track(new SphereGeometry(2.6, 64, 32)), sunMat)
  scene.add(sun)
  const quad = track(new PlaneGeometry(1, 1))
  const glowMat = track(new ShaderMaterial({ vertexShader: glowVert, fragmentShader: glowFrag, uniforms: { uColor: { value: lin('#ff9a3d') }, uStrength: { value: useBloom ? 0.32 : 0.85 } }, transparent: true, depthWrite: false, blending: AdditiveBlending }))
  const glow = new Mesh(quad, glowMat)
  glow.scale.setScalar(22)
  glow.renderOrder = 2
  scene.add(glow)
  const wideGlowMat = track(new ShaderMaterial({ vertexShader: glowVert, fragmentShader: glowFrag, uniforms: { uColor: { value: lin('#5a3bff') }, uStrength: { value: 0.07 } }, transparent: true, depthWrite: false, blending: AdditiveBlending }))
  const wideGlow = new Mesh(quad, wideGlowMat)
  wideGlow.scale.setScalar(90)
  scene.add(wideGlow)

  scene.add(new AmbientLight('#6070a0', 0.25))
  const sunLight = new PointLight('#ffd7a0', 3.2, 0, 0)
  scene.add(sunLight)

  /* planets */
  const sphere = track(new SphereGeometry(1, small ? 48 : 72, small ? 24 : 36))
  const bodies = planets.map((p) => {
    const holder = new Group() // orbital position
    const tilt = new Group()
    tilt.rotation.z = p.tilt ?? 0.2
    holder.add(tilt)
    scene.add(holder)
    const ringN = new Vector3(0, 1, 0).applyEuler(tilt.rotation)
    const mat = track(
      new ShaderMaterial({
        vertexShader: planetVert,
        fragmentShader: planetFrag,
        defines,
        uniforms: {
          uA: { value: lin(p.color) },
          uB: { value: lin(p.color2) },
          uC: { value: lin(p.color3) },
          uAtmo: { value: lin(p.atmo) },
          uKind: { value: p.kind },
          uSeed: { value: p.orbit * 1.37 },
          uTime: { value: 0 },
          uCenter: { value: new Vector3() },
          uRadius: { value: p.radius },
          uRingN: { value: ringN },
          uRing: { value: new Vector2(p.ring ? 1.45 : 0, p.ring ? 2.4 : 0) },
        },
      }),
    )
    const mesh = new Mesh(sphere, mat)
    mesh.scale.setScalar(p.radius)
    tilt.add(mesh)
    const atmoMat = track(new ShaderMaterial({ vertexShader: atmoVert, fragmentShader: atmoFrag, uniforms: { uAtmo: { value: lin(p.atmo) }, uCenter: { value: new Vector3() }, uR: { value: p.radius }, uRs: { value: p.radius * 1.28 } }, side: BackSide, transparent: true, depthWrite: false, blending: AdditiveBlending }))
    const atmo = new Mesh(sphere, atmoMat)
    atmo.scale.setScalar(p.radius * 1.28)
    holder.add(atmo)
    let ring: Mesh | null = null
    if (p.ring) {
      const inner = p.radius * 1.45
      const outer = p.radius * 2.4
      const rmat = track(new ShaderMaterial({ vertexShader: ringVert, fragmentShader: ringFrag, uniforms: { uInner: { value: inner }, uOuter: { value: outer }, uA: { value: lin(p.color2) }, uB: { value: lin(p.color3) }, uCenter: { value: new Vector3() }, uRadius: { value: p.radius } }, transparent: true, side: DoubleSide, depthWrite: false }))
      ring = new Mesh(track(new RingGeometry(inner, outer, 128, 1)), rmat)
      ring.rotation.x = -Math.PI / 2
      tilt.add(ring)
    }
    let moon: Mesh | null = null
    if (p.moon) {
      const mm = track(new ShaderMaterial({ vertexShader: planetVert, fragmentShader: planetFrag, defines, uniforms: { uA: { value: lin('#6d6a73') }, uB: { value: lin('#b9b6c2') }, uC: { value: lin('#e9e6f0') }, uAtmo: { value: lin('#000000') }, uKind: { value: 3 }, uSeed: { value: p.orbit }, uTime: { value: 0 }, uCenter: { value: new Vector3() }, uRadius: { value: 1 }, uRingN: { value: ringN }, uRing: { value: new Vector2(0, 0) } } }))
      moon = new Mesh(sphere, mm)
      moon.scale.setScalar(p.radius * 0.24)
      holder.add(moon)
    }
    // orbit line with a fading trail behind the planet
    const segs = 256
    const lp = new Float32Array(segs * 3)
    const la = new Float32Array(segs)
    for (let k = 0; k < segs; k++) {
      const a = (k / segs) * Math.PI * 2
      lp.set([Math.cos(a) * p.orbit, 0, Math.sin(a) * p.orbit], k * 3)
      la[k] = a
    }
    const lg = track(new BufferGeometry())
    lg.setAttribute('position', new BufferAttribute(lp, 3))
    lg.setAttribute('aAngle', new BufferAttribute(la, 1))
    const lmat = track(new ShaderMaterial({ vertexShader: lineVert, fragmentShader: lineFrag, uniforms: { uPlanet: { value: 0 }, uColor: { value: lin(p.atmo).lerp(lin('#ffffff'), 0.4) }, uOpacity: { value: 1 } }, transparent: true, depthWrite: false }))
    const line = new LineLoop(lg, lmat)
    scene.add(line)
    return { p, holder, tilt, mesh, mat, atmo, ring, moon, lmat, angle: p.phase, pos: new Vector3() }
  })

  /* asteroid belt between the 3rd and 4th orbit: one instanced draw call */
  const beltN = small ? 160 : 420
  const rock = track(new IcosahedronGeometry(1, 0))
  const rockMat = track(new MeshLambertMaterial({ color: '#6f6a7c', flatShading: true }))
  const belt = new InstancedMesh(rock, rockMat, beltN)
  const dummy = new Object3D()
  const r3 = planets[3]?.orbit ?? 15
  const r4 = planets[4]?.orbit ?? 19
  for (let i = 0; i < beltN; i++) {
    const a = rand() * Math.PI * 2
    const r = r3 + (r4 - r3) * (0.35 + rand() * 0.3) + (rand() - 0.5) * 0.8
    dummy.position.set(Math.cos(a) * r, (rand() - 0.5) * 0.5, Math.sin(a) * r)
    dummy.rotation.set(rand() * 6, rand() * 6, rand() * 6)
    dummy.scale.setScalar(0.025 + Math.pow(rand(), 4) * 0.11)
    dummy.updateMatrix()
    belt.setMatrixAt(i, dummy.matrix)
  }
  scene.add(belt)

  /* ---------------------------------------------------------------- camera path */

  const placePlanets = () => {
    for (const b of bodies) {
      b.pos.set(Math.cos(b.angle) * b.p.orbit, 0, Math.sin(b.angle) * b.p.orbit)
      b.holder.position.copy(b.pos)
      ;(b.mat.uniforms.uCenter.value as Vector3).copy(b.pos)
      ;((b.atmo.material as ShaderMaterial).uniforms.uCenter.value as Vector3).copy(b.pos)
      if (b.ring) {
        const rm = b.ring.material as ShaderMaterial
        ;(rm.uniforms.uCenter.value as Vector3).copy(b.pos)
      }
      b.lmat.uniforms.uPlanet.value = ((b.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
    }
  }

  const keys: Key[] = []
  const posCurve = new CatmullRomCurve3([new Vector3(), new Vector3()], false, 'centripetal')
  const lookCurve = new CatmullRomCurve3([new Vector3(), new Vector3()], false, 'centripetal')
  let aspect = 1

  /** Rebuild the keyframes from the (frozen) planet positions. Cheap: ~10 points. */
  const buildPath = () => {
    const phone = aspect < 0.8
    keys.length = 0
    // 0: the hero shot. Desktop: system sits right of the name. Phone: below it.
    keys.push(
      phone
        ? { pos: new Vector3(0, 46, 64), look: new Vector3(0, -2, 0), sx: 0, sy: -0.2 }
        : { pos: new Vector3(-4, 17, 44), look: new Vector3(-2, -1.5, 0), sx: 0.2, sy: 0.02 },
    )
    for (const b of bodies) {
      const r = b.p.radius * (b.p.ring ? 1.5 : 1)
      const out = new Vector3(b.pos.x, 0, b.pos.z).normalize()
      const tan = new Vector3(-out.z, 0, out.x)
      const d = r * (phone ? 8.4 : 6.2)
      const pos = b.pos
        .clone()
        .addScaledVector(tan, -d * 0.9)
        .addScaledVector(out, -d * 0.42)
        .add(new Vector3(0, r * (b.p.ring ? 1.9 : 1.1), 0))
      keys.push({ pos, look: b.pos.clone(), sx: phone ? 0 : 0.21, sy: phone ? 0.2 : 0 })
    }
    // overview behind the projects, then a low closing shot with the sun beside "let's build"
    keys.push(phone ? { pos: new Vector3(6, 80, 28), look: new Vector3(0, 0, 0), sx: 0, sy: 0 } : { pos: new Vector3(10, 62, 34), look: new Vector3(0, 0, 0), sx: -0.12, sy: 0 })
    keys.push(phone ? { pos: new Vector3(-2, 7, 18), look: new Vector3(0, 0.4, 0), sx: 0, sy: 0.27 } : { pos: new Vector3(-4, 6.5, 14.5), look: new Vector3(0, 0.6, 0), sx: 0.25, sy: 0.02 })
    posCurve.points = keys.map((k) => k.pos)
    lookCurve.points = keys.map((k) => k.look)
    posCurve.updateArcLengths()
    lookCurve.updateArcLengths()
  }

  /* ---------------------------------------------------------------- state */

  const scroll: ScrollState = { hero: 0, tour: 0, after: 0 }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const pointer = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }
  let orbitTime = 0
  let labelEls: HTMLElement[] = []
  let labelBox: HTMLElement | null = null
  let w = 1
  let h = 1
  const tmp = new Vector3()
  const right = new Vector3()
  const up = new Vector3()
  let slowFrames = 0
  let sampled = 0

  /** Map scroll to a position along the key list (0..keys-1). Dwell at each planet. */
  const pathParam = () => {
    const n = bodies.length
    if (scroll.after > 0) return n + ease(scroll.after) * 2
    if (scroll.tour > 0) {
      const t = scroll.tour * n
      const k = Math.min(n - 1, Math.floor(t))
      const q = t - k
      const from = k === 0 ? 0.32 : k
      if (still) return k + 1
      return from + (k + 1 - from) * ease(q / 0.5)
    }
    return still ? 0 : ease(scroll.hero) * 0.32
  }

  const curveAt = (curve: CatmullRomCurve3, s: number, out: Vector3) => curve.getPoint(Math.min(1, Math.max(0, s / (keys.length - 1))), out)

  const onFrame = ({ dt, time, width, height, still: isStill }: { dt: number; time: number; width: number; height: number; still: boolean }) => {
    w = width
    h = height
    // planets orbit only while the visitor rests at the top; then the system freezes
    const live = !isStill && scroll.hero < 0.002 && scroll.tour === 0 && scroll.after === 0
    if (live) {
      orbitTime += dt
      for (const b of bodies) b.angle = b.p.phase + orbitTime * b.p.speed
      placePlanets()
      buildPath()
    }
    for (const b of bodies) {
      b.mesh.rotation.y = time * 0.08 + b.p.orbit
      b.mat.uniforms.uTime.value = time
      if (b.moon) {
        const a = time * 0.5 + b.p.orbit
        b.moon.position.set(Math.cos(a) * b.p.radius * 2.6, Math.sin(a) * b.p.radius * 0.4, Math.sin(a) * b.p.radius * 2.6)
      }
    }
    belt.rotation.y = time * 0.012
    sunMat.uniforms.uTime.value = time
    sun.rotation.y = time * 0.03
    starMat.uniforms.uTime.value = time

    // camera straight off the splines
    const s = pathParam()
    curveAt(posCurve, s, camera.position)
    curveAt(lookCurve, s, tmp)
    const i0 = Math.min(keys.length - 1, Math.floor(s))
    const i1 = Math.min(keys.length - 1, i0 + 1)
    const f = smooth(s - i0)
    const sx = keys[i0].sx + (keys[i1].sx - keys[i0].sx) * f
    const sy = keys[i0].sy + (keys[i1].sy - keys[i0].sy) * f

    // pointer parallax: a critically damped spring (no overshoot, no float)
    const k = 40
    const c = 2 * Math.sqrt(k)
    pointer.vx += (k * (pointer.tx - pointer.x) - c * pointer.vx) * dt
    pointer.vy += (k * (pointer.ty - pointer.y) - c * pointer.vy) * dt
    pointer.x += pointer.vx * dt
    pointer.y += pointer.vy * dt
    camera.lookAt(tmp)
    const dist = camera.position.distanceTo(tmp)
    right.setFromMatrixColumn(camera.matrix, 0)
    up.setFromMatrixColumn(camera.matrix, 1)
    camera.position.addScaledVector(right, pointer.x * dist * 0.018).addScaledVector(up, -pointer.y * dist * 0.012)
    camera.lookAt(tmp)
    camera.setViewOffset(w, h, -w * sx, h * sy, w, h)

    // faint sun glow follows the sun across the screen
    glow.position.set(0, 0, 0)

    // labels
    if (labelBox && labelEls.length) {
      const show = scroll.hero < 0.25 && scroll.tour === 0
      labelBox.style.opacity = show ? String(1 - scroll.hero * 4) : '0'
      labelBox.style.visibility = show ? 'visible' : 'hidden'
      if (show) {
        bodies.forEach((b, i) => {
          const el = labelEls[i]
          if (!el) return
          tmp.copy(b.pos)
          tmp.y += b.p.radius * (b.p.ring ? 1.6 : 1.5)
          tmp.project(camera)
          const x = (tmp.x * 0.5 + 0.5) * w
          const y = (-tmp.y * 0.5 + 0.5) * h
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        })
      }
    }

    if (composer && useBloom) composer.render(dt)
    else stage?.renderer.render(scene, camera)

    // if this machine can't hold 60 with bloom, fall back to the cheap glow once
    if (useBloom && !isStill && dt > 0) {
      sampled++
      if (sampled > 30 && sampled < 200 && dt > 1 / 40) slowFrames++
      if (slowFrames > 25) {
        useBloom = false
        canvas.dataset.fx = 'glow'
        sunMat.uniforms.uBoost.value = 1.2
        glowMat.uniforms.uStrength.value = 1.0
      }
    }
  }

  stage = createStage(canvas, onFrame, {
    renderer: { antialias: true, alpha: false, powerPreference: 'high-performance' },
    onResize: (width, height) => {
      aspect = width / height
      camera.aspect = aspect
      camera.fov = aspect < 0.8 ? 50 : 38
      camera.updateProjectionMatrix()
      starMat.uniforms.uDpr.value = stage?.renderer.getPixelRatio() ?? 1
      if (composer) {
        composer.setPixelRatio(stage!.renderer.getPixelRatio())
        composer.setSize(width, height)
      }
      placePlanets()
      buildPath()
    },
  })
  if (!stage) {
    disposables.forEach((d) => d.dispose())
    return null
  }
  const renderer = stage.renderer
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.setClearColor('#060913')
  starMat.uniforms.uDpr.value = renderer.getPixelRatio()

  // bake the nebula once
  const nebulaRT = track(new WebGLRenderTarget(small ? 1024 : 1536, small ? 512 : 768, { type: HalfFloatType }))
  {
    const bakeScene = new Scene()
    const bakeMat = new ShaderMaterial({ defines: { OCT: 5 }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy*2.0,0.0,1.0);}', fragmentShader: nebulaFrag })
    const bq = new Mesh(quad, bakeMat)
    bq.frustumCulled = false
    bakeScene.add(bq)
    renderer.setRenderTarget(nebulaRT)
    renderer.render(bakeScene, new OrthographicCamera())
    renderer.setRenderTarget(null)
    bakeMat.dispose()
    skyMat.uniforms.tMap.value = nebulaRT.texture
  }

  if (useBloom) {
    const rt = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 })
    composer = new EffectComposer(renderer, rt)
    composer.addPass(new RenderPass(scene, camera))
    bloom = new UnrealBloomPass(new Vector2(256, 256), 0.75, 0.45, 0.92)
    // bloom at a third of the canvas resolution: soft glow doesn't need more
    const base = bloom.setSize.bind(bloom)
    bloom.setSize = (x: number, y: number) => base(Math.max(2, Math.round(x / 1.5)), Math.max(2, Math.round(y / 1.5)))
    composer.addPass(bloom)
    composer.addPass(new OutputPass())
    composer.setPixelRatio(renderer.getPixelRatio())
    composer.setSize(stage.width(), stage.height())
  }

  canvas.dataset.fx = useBloom ? 'bloom' : 'glow'
  placePlanets()
  buildPath()
  stage.invalidate()

  return {
    setScroll(s) {
      scroll.hero = s.hero
      scroll.tour = s.tour
      scroll.after = s.after
      stage?.invalidate()
    },
    setPointer(x, y) {
      pointer.tx = x
      pointer.ty = y
    },
    bindLabels(els, box) {
      labelEls = els
      labelBox = box
      stage?.invalidate()
    },
    dispose() {
      stage?.dispose()
      composer?.dispose()
      bloom?.dispose()
      disposables.forEach((d) => d.dispose())
      scene.traverse((o) => {
        const m = o as Mesh
        const mat = m.material as Material | Material[] | undefined
        if (mat) (Array.isArray(mat) ? mat : [mat]).forEach((x) => x.dispose())
      })
      belt.dispose()
    },
  }
}
