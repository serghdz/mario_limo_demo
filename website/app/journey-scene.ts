import * as THREE from 'three';
import { assetUrl } from '@/lib/assets';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export async function createJourney(
  host: HTMLElement,
  onReady: () => void,
  onError: () => void,
  onProgress: (percent: number) => void,
) {
  let disposed = false,
    frame = 0,
    progress = 0,
    last = -1,
    active = true;
  let presented = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#091522');
  scene.fog = new THREE.FogExp2('#091522', 0.022);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.015, 160);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute(
    'aria-label',
    'Interactive limousine arrival and cabin tour',
  );
  renderer.domElement.setAttribute('role', 'img');
  host.appendChild(renderer.domElement);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const sourceEnvironment = await new EXRLoader().loadAsync(assetUrl('environments/blender-forest.exr'));
  sourceEnvironment.mapping = THREE.EquirectangularReflectionMapping;
  const env = pmrem.fromEquirectangular(sourceEnvironment);
  scene.environment = env.texture;
  scene.environmentIntensity = 1;
  sourceEnvironment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#b9d4ef', '#18202d', 0.25));
  const sun = new THREE.DirectionalLight('#fff2d6', 0.7);
  sun.position.set(-8, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -15;
  sun.shadow.camera.right = 15;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  const rim = new THREE.DirectionalLight('#8baad1', 0.3);
  rim.position.set(8, 7, -6);
  scene.add(rim);
  const mat = (color: string, roughness = 0.8) =>
    new THREE.MeshStandardMaterial({ color, roughness });
  const asphalt = mat('#172430'),
    pavement = mat('#293541'),
    building = mat('#122638'),
    trim = mat('#374655'),
    champagne = mat('#b8a27b');
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const box = (size: number[], pos: number[], material: THREE.Material) => {
    const o = new THREE.Mesh(geometry, material);
    o.scale.set(...(size as [number, number, number]));
    o.position.set(...(pos as [number, number, number]));
    o.receiveShadow = true;
    scene.add(o);
    return o;
  };
  box([100, 0.12, 110], [0, -0.15, 0], asphalt);
  box([5, 0.25, 80], [-4.4, -0.03, 0], pavement);
  box([4, 0.25, 80], [7, -0.03, 0], pavement);
  box([0.12, 0.28, 80], [-1.92, -0.02, 0], trim);
  const laneMarks = new THREE.InstancedMesh(geometry, champagne, 20);
  const instance = new THREE.Object3D();
  for (let i = 0; i < 20; i++) {
    instance.position.set(3, 0, -40 + i * 4);
    instance.scale.set(.065, .007, 1.8);
    instance.updateMatrix();
    laneMarks.setMatrixAt(i, instance.matrix);
  }
  scene.add(laneMarks);
  // A stylized block, deliberately not presented as a real Houston address.
  const windowMat = new THREE.MeshStandardMaterial({
    color: '#a99774',
    emissive: '#5b4930',
    emissiveIntensity: 0.5,
    roughness: 0.45,
  });
  const windowPositions: number[][] = [];
  for (let i = 0; i < 10; i++) {
    const z = -25 + i * 6,
      height = 4 + ((i * 7) % 5) * 1.6;
    const o = box([4, height, 4], [10, height / 2, z], building);
    o.castShadow = true;
    for (let f = 0; f < Math.floor(height / 1.5); f++)
      for (let w = 0; w < 3; w++)
        windowPositions.push([7.98, 0.9 + f * 1.4, z - 1.2 + w * 1.2]);
  }
  const cityWindows = new THREE.InstancedMesh(geometry, windowMat, windowPositions.length);
  windowPositions.forEach((position, i) => {
    instance.position.set(position[0], position[1], position[2]);
    instance.scale.set(.025, .65, .65);
    instance.updateMatrix();
    cityWindows.setMatrixAt(i, instance.matrix);
  });
  scene.add(cityWindows);
  box([4, 9, 5], [-10, 4.5, 15], building);
  const entrance = [
    box([2.6, 0.18, 4], [-5.5, 3.8, -1.2], trim),
  ];
  for (const z of [-16, 5, 19]) {
    box([0.055, 4, 0.055], [-3, 2, z], trim);
    box([0.55, 0.06, 0.22], [-3, 4, z], champagne);
    const l = new THREE.PointLight('#e6c99b', 7, 8, 2);
    l.position.set(-2.7, 3.85, z);
    scene.add(l);
  }
  const vehicle = new THREE.Group();
  vehicle.scale.setScalar(8);
  scene.add(vehicle);
  const decoder = new DRACOLoader();
  decoder.setDecoderPath(assetUrl('draco/'));
  decoder.setWorkerLimit(2);
  const loader = new GLTFLoader();
  loader.setDRACOLoader(decoder);
  let pivot: THREE.Object3D | undefined;
  const lights: THREE.PointLight[] = [];
  try {
    const gltf = await loader.loadAsync(assetUrl('models/limousine.glb?v=source-4k-2'), event => {
      if (event.total > 0) onProgress(Math.min(95, Math.round(event.loaded / event.total * 95)));
    });
    if (disposed)
      return { setProgress: () => {}, setActive: () => {}, dispose: () => {} };
    vehicle.add(gltf.scene);
    pivot = gltf.scene.getObjectByName('PassengerDoorPivot');
    if (!pivot) throw new Error('Passenger door pivot is missing');
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.castShadow = true;
      o.receiveShadow = true;
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of materials) {
        if (m instanceof THREE.MeshStandardMaterial) {
          m.envMapIntensity = 1;
          for (const texture of [m.map, m.normalMap, m.roughnessMap, m.metalnessMap]) {
            if (texture) texture.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
          }
          if (
            m.name.includes('LED') ||
            m.name.includes('star') ||
            m.name.includes('cabinet light')
          )
            m.emissiveIntensity = Math.min(m.emissiveIntensity, 4);
        }
      }
    });
    // Merge fixed meshes by material while keeping the moving door subtree intact.
    // The scene keeps its named pivot; there is no whole-model flattening.
    const root = gltf.scene.getObjectByName('LimousineRoot')!;
    const fixed: THREE.Mesh[] = [];
    const moving = new Set<THREE.Object3D>();
    pivot.traverse((o) => moving.add(o));
    root.traverse((o) => {
      if (
        o instanceof THREE.Mesh &&
        !moving.has(o) &&
        !Array.isArray(o.material) &&
        !o.material.transparent
      )
        fixed.push(o);
    });
    const batches = new Map<
      string,
      { material: THREE.Material; geometries: THREE.BufferGeometry[] }
    >();
    const inverse = root.matrixWorld.clone().invert();
    for (const mesh of fixed) {
      const material = mesh.material as THREE.Material;
      const g = mesh.geometry.clone();
      g.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
      for (const name of Object.keys(g.attributes))
        if (!['position', 'normal', 'uv'].includes(name))
          g.deleteAttribute(name);
      if (!g.getAttribute('uv'))
        g.setAttribute(
          'uv',
          new THREE.BufferAttribute(
            new Float32Array(g.getAttribute('position').count * 2),
            2,
          ),
        );
      const flat = g.index ? g.toNonIndexed() : g;
      const batch = batches.get(material.uuid) || { material, geometries: [] };
      batch.geometries.push(flat);
      batches.set(material.uuid, batch);
      mesh.removeFromParent();
      if (flat !== g) g.dispose();
    }
    for (const { material, geometries } of batches.values()) {
      const combined = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!combined) continue;
      const m = new THREE.Mesh(combined, material);
      m.name = 'Fixed ' + material.name;
      m.castShadow = true;
      m.receiveShadow = true;
      root.add(m);
    }
    // Lights are code-owned so their intensity is appropriate to browser world units.
    for (const [x, y, z, color, power] of [
      [-0.08, 0.25, -0.08, 0xff276c, 7],
      [0.08, 0.25, -0.08, 0x5879ff, 9],
      [-0.08, 0.25, -0.31, 0x3377ff, 9],
      [0.08, 0.25, -0.31, 0xff2288, 5],
      [0, 0.18, 0.015, 0xb5d6ff, 6],
    ] as const) {
      const l = new THREE.PointLight(color, power, 4, 2);
      l.userData.cabinIntensity = power;
      l.position.set(x, y, z);
      vehicle.add(l);
      lights.push(l);
    }
    host.dataset.model = 'ready';
    host.dataset.meshes = String(batches.size);
  } catch (error) {
    console.error('Limousine model failed to load', error);
    host.dataset.model = 'error';
    onError();
  }
  const resize = () => {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    last = -1;
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const initial = V(-10.4, 4.8, 10),
    arrival = V(-5.8, 2.7, 0.9),
    entry = V(-2.6, 1.656, -1.328),
    inside = V(0, 1.656, -1.76);
  function render() {
    if (disposed) return;
    frame = requestAnimationFrame(render);
    if (!active || document.hidden || Math.abs(last - progress) < 0.00002)
      return;
    const p = progress;
    last = p;
    entrance.forEach((o) => (o.visible = p > 0.32));
    vehicle.position.z = THREE.MathUtils.lerp(-10, 0, smooth(0, 0.33, p));
    const pos = initial.clone();
    const target = V(0, 1.25, -2.0);
    if (p < 0.33) {
      pos.z += vehicle.position.z;
      target.z += vehicle.position.z;
    } else if (p < 0.49) {
      const t = smooth(0.33, 0.49, p);
      pos.lerpVectors(initial, arrival, t);
      target.lerp(V(-0.45, 1.4, -0.8), t);
    } else if (p < 0.61) {
      const t = smooth(0.49, 0.61, p);
      pos.lerpVectors(arrival, entry, t);
      target.lerpVectors(V(-0.45, 1.4, -0.8), V(0, 1.656, -1.328), t);
    } else if (p < 0.77) {
      pos.copy(entry);
      target.set(0, 1.656, -1.328);
    } else {
      const t = smooth(0.77, 0.94, p);
      pos.lerpVectors(entry, V(-0.16, 1.656, -1.328), Math.min(t / 0.8, 1));
      if (t > 0.8)
        pos.lerpVectors(V(-0.16, 1.656, -1.328), inside, (t - 0.8) / 0.2);
      target.lerpVectors(
        V(0, 1.656, -1.328),
        V(0, 1.68, 0.3),
        smooth(0.79, 0.94, p),
      );
    }
    if (pivot)
      pivot.rotation.y = smooth(0.61, 0.76, p) * THREE.MathUtils.degToRad(72);
    const portrait = camera.aspect < 1 && host.clientWidth <= 720;
    // Center the complete exterior between the phone's title and controls.
    // Fade back to the original target before crossing the passenger doorway.
    if (portrait) {
      target.z += 1.3 * (1 - smooth(0.49, 0.61, p));
      pos.lerp(target, 0.3 * (1 - smooth(0.1, 0.4, p)));
      const arrivalRoom = 0.3 * smooth(0.3, 0.43, p) * (1 - smooth(0.49, 0.61, p));
      pos.sub(target).multiplyScalar(1 + arrivalRoom).add(target);
    }
    camera.position.copy(pos);
    camera.lookAt(target);
    const baseFov = THREE.MathUtils.lerp(42, 65, smooth(0.75, 0.94, p));
    camera.fov = Math.min(portrait ? 112 : 85, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov / 2)) * Math.max(1, 1.4 / camera.aspect))));
    if (portrait) camera.setViewOffset(host.clientWidth, host.clientHeight, 0, -host.clientHeight * 0.045, host.clientWidth, host.clientHeight);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    renderer.toneMappingExposure = THREE.MathUtils.lerp(
      1,
      1.05,
      smooth(0.76, 0.92, p),
    );
    scene.environmentIntensity = THREE.MathUtils.lerp(
      1,
      0.15,
      smooth(0.77, 0.9, p),
    );
    lights.forEach(light => { light.intensity = light.userData.cabinIntensity * THREE.MathUtils.lerp(0.03, 1, smooth(0.61, 0.84, p)); });
    renderer.render(scene, camera);
    if (!presented) { presented = true; onReady(); }
    host.dataset.progress = p.toFixed(3);
    host.dataset.doorAngle = (
      ((pivot?.rotation.y || 0) * 180) /
      Math.PI
    ).toFixed(1);
    host.dataset.drawCalls = String(renderer.info.render.calls);
  }
  render();
  const contextLost = (e: Event) => {
    e.preventDefault();
    onError();
  };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  return {
    setProgress: (value: number) => {
      progress = clamp(value);
    },
    setActive: (value: boolean) => {
      active = value;
      if (value) last = -1;
    },
    dispose: () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      decoder.dispose();
      env.dispose();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const ms = Array.isArray(o.material) ? o.material : [o.material];
          ms.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
