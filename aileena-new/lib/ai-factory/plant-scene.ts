import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { ChipId, TrayKind } from './chips';
import { trayKit } from './chips';
import type { PowerPath } from './plant';
import type { InspectId, RackFace } from './rack-inspectors';
import type { RackFactSheet, RackStackSegment } from './rack-facts';
import type { HallRack, PlantSim } from './simulate';
import {
  HALL_SLOTS,
  RACK_D,
  RACK_H,
  RACK_W,
  SIDECAR_W,
  U_HEIGHT,
  cduPose,
  hallPose,
  usesOverheadBusway,
  usesSidecar,
  usesWhips,
} from './viewport';
import { buildCampus, buildGlobe, isHallLayer, scaleAim, studioGridTexture, type CameraMode } from './world';

export type { CameraMode } from './world';

export type PlantSceneInput = {
  model: PlantSim;
  fact: RackFactSheet;
  face: RackFace;
  inspectId: InspectId;
  powerPath: PowerPath;
  cameraMode: CameraMode;
  openKind: TrayKind;
  openChip: ChipId;
  openTrayIndex: number;
};

export type PlantSceneHandle = {
  update: (input: PlantSceneInput) => void;
  dispose: () => void;
};

type Click = {
  kind: 'hall' | 'tray' | 'rear' | 'chip' | 'world' | 'cabinet';
  id: number | InspectId | ChipId | CameraMode | 'door' | 'campus' | 'hall';
  face?: RackFace;
  trayIndex?: number;
  trayKind?: TrayKind;
};

const TRAY_KIND_COLOR: Record<RackStackSegment['kind'], number> = {
  management: 0x2a3330,
  power: 0x1a1714,
  compute: 0x14181c,
  switch: 0x121820,
  cooling: 0x173038,
  blank: 0x0d0e10,
};

function noiseTexture(size: number, tint: [number, number, number], grit = 38) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const n = grit + Math.random() * (255 - grit);
    image.data[i] = tint[0] * n;
    image.data[i + 1] = tint[1] * n;
    image.data[i + 2] = tint[2] * n;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function pcbTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#0d1f18';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(196, 164, 72, 0.28)';
  ctx.lineWidth = 1;
  for (let y = 8; y < size; y += 14) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (y % 28 === 0 ? 4 : -3));
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(196, 164, 72, 0.45)';
  for (let i = 0; i < 80; i += 1) {
    ctx.fillRect((i * 37) % size, (i * 19) % size, 3, 3);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(2, 3);
  texture.anisotropy = 8;
  return texture;
}

function perforatedTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#14171a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#050607';
  for (let y = 6; y < size; y += 10) {
    for (let x = 6; x < size; x += 10) {
      ctx.beginPath();
      ctx.arc(x, y, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.repeat.set(3, 8);
  texture.anisotropy = 8;
  return texture;
}

function metal(color: number, extras: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.86,
    roughness: 0.28,
    envMapIntensity: 1.15,
    ...extras,
  });
}

function thermalColor(score: number) {
  const t = Math.min(1, Math.max(0, score / 100));
  return new THREE.Color().setHSL(0.48 - t * 0.46, 0.42, 0.18 + t * 0.16);
}

export function mountPlantScene(
  host: HTMLElement,
  onClick: (hit: Click) => void,
): PlantSceneHandle {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090b);
  scene.fog = new THREE.FogExp2(0x0a0d10, 0.032);

  const camera = new THREE.PerspectiveCamera(38, host.clientWidth / Math.max(host.clientHeight, 1), 0.08, 120);
  camera.position.set(6.8, 3.15, 8.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 1.2;
  controls.maxDistance = 22;
  controls.target.set(0.2, 1.05, 0.4);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const concrete = noiseTexture(256, [0.38, 0.37, 0.35], 60);
  concrete.repeat.set(14, 14);
  const steel = noiseTexture(128, [0.55, 0.58, 0.6], 90);
  const perforate = perforatedTexture();
  const pcbMap = pcbTexture();

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 28),
    new THREE.MeshPhysicalMaterial({
      map: concrete,
      roughness: 0.78,
      metalness: 0.06,
      envMapIntensity: 0.28,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const tileGeo = new THREE.BoxGeometry(0.58, 0.03, 0.58);
  const tileMat = new THREE.MeshPhysicalMaterial({
    color: 0x2a2c2d,
    roughness: 0.55,
    metalness: 0.22,
    map: steel,
  });
  const tiles = new THREE.InstancedMesh(tileGeo, tileMat, 28 * 18);
  const tileDummy = new THREE.Object3D();
  let tileIndex = 0;
  for (let x = -8; x < 8; x += 1) {
    for (let z = -6; z < 6; z += 1) {
      tileDummy.position.set(x * 0.62 + 0.1, 0.016, z * 0.62);
      tileDummy.updateMatrix();
      tiles.setMatrixAt(tileIndex, tileDummy.matrix);
      tileIndex += 1;
    }
  }
  tiles.instanceMatrix.needsUpdate = true;
  tiles.receiveShadow = true;
  scene.add(tiles);

  const wallMat = new THREE.MeshPhysicalMaterial({ color: 0x101214, roughness: 0.9, metalness: 0.04, map: concrete });
  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(36, 7.2), wallMat);
  backWall.position.set(0, 3.4, -13);
  const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(28, 7.2), wallMat);
  leftWall.position.set(-16, 3.4, 0);
  leftWall.rotation.y = Math.PI / 2;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(36, 0.18, 28), metal(0x16181a, { roughness: 0.7 }));
  slab.position.set(0, 5.05, 0);
  scene.add(backWall, leftWall, slab);

  const key = new THREE.DirectionalLight(0xfff4e6, 2.15);
  key.position.set(8.5, 11, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 40;
  key.shadow.camera.left = -16;
  key.shadow.camera.right = 16;
  key.shadow.camera.top = 12;
  key.shadow.camera.bottom = -8;
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0x8ea8b8, 0x16120e, 0.55));
  const aisleFill = new THREE.PointLight(0xff7a3c, 0, 8, 1.6);
  aisleFill.position.set(0, 1.6, 0);
  scene.add(aisleFill);
  const coolFill = new THREE.PointLight(0x6fd0c8, 4.2, 18, 1.8);
  coolFill.position.set(-6, 4.2, -4);
  scene.add(coolFill);

  const ceiling = new THREE.Group();
  const fixtureMat = metal(0x1b1e20, { roughness: 0.4 });
  const ledMat = new THREE.MeshStandardMaterial({ color: 0xf3fff8, emissive: 0xdff7ee, emissiveIntensity: 2.4 });
  for (let i = -3; i <= 3; i += 1) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(16, 0.04, 0.12), fixtureMat);
    bar.position.set(0, 4.55, i * 2.2);
    const led = new THREE.Mesh(new THREE.BoxGeometry(15.4, 0.02, 0.05), ledMat);
    led.position.set(0, 4.52, i * 2.2);
    ceiling.add(bar, led);
  }
  const tray = new THREE.Mesh(new THREE.BoxGeometry(18, 0.05, 0.28), metal(0x2a2d2f, { roughness: 0.5 }));
  tray.position.set(0, 4.2, -1.1);
  ceiling.add(tray);
  scene.add(ceiling);

  const hallGroup = new THREE.Group();
  const hallClusters: THREE.Group[] = [];
  const hallCabinets: THREE.Mesh[] = [];
  const hallDoors: THREE.Mesh[] = [];
  const sidecars: THREE.Mesh[] = [];
  const whips: THREE.Mesh[] = [];
  const bodyGeo = new THREE.BoxGeometry(RACK_W - 0.04, RACK_H - 0.12, RACK_D - 0.06);
  const postGeo = new THREE.BoxGeometry(0.035, RACK_H, 0.035);
  const plinthGeo = new THREE.BoxGeometry(RACK_W + 0.04, 0.08, RACK_D + 0.04);
  const capGeo = new THREE.BoxGeometry(RACK_W + 0.02, 0.05, RACK_D + 0.02);
  const doorGeo = new THREE.BoxGeometry(RACK_W - 0.08, RACK_H - 0.28, 0.018);
  const sidecarGeo = new THREE.BoxGeometry(SIDECAR_W, RACK_H - 0.1, RACK_D * 0.78);
  const bodyMat = metal(0x15171a, { roughness: 0.3, map: steel });
  const postMat = metal(0x0d0e10, { roughness: 0.22 });
  for (let id = 0; id < HALL_SLOTS; id += 1) {
    const pose = hallPose(id);
    const cluster = new THREE.Group();
    cluster.position.set(pose.x, 0, pose.z);
    const cabinet = new THREE.Mesh(bodyGeo, bodyMat.clone());
    cabinet.position.y = RACK_H / 2;
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    cabinet.userData = { kind: 'hall', id };
    const plinth = new THREE.Mesh(plinthGeo, metal(0x0b0c0d, { roughness: 0.45 }));
    plinth.position.y = 0.04;
    const cap = new THREE.Mesh(capGeo, metal(0x1a1d20, { roughness: 0.28 }));
    cap.position.y = RACK_H - 0.02;
    const door = new THREE.Mesh(
      doorGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x171a1d,
        map: perforate,
        metalness: 0.72,
        roughness: 0.38,
        envMapIntensity: 0.9,
      }),
    );
    door.position.set(0, RACK_H / 2, RACK_D / 2 - 0.01);
    door.userData = { kind: 'hall', id };
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.18, 0.012),
      new THREE.MeshStandardMaterial({ color: 0x00c2b0, emissive: 0x00c2b0, emissiveIntensity: 1.4 }),
    );
    led.position.set(RACK_W / 2 - 0.06, RACK_H - 0.22, RACK_D / 2 + 0.002);
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(sx * (RACK_W / 2 - 0.01), RACK_H / 2, sz * (RACK_D / 2 - 0.01));
      cluster.add(post);
    }
    const sidecar = new THREE.Mesh(sidecarGeo, metal(0x2a1d12, { roughness: 0.36 }));
    sidecar.position.set(pose.sidecarX - pose.x, RACK_H / 2, 0);
    sidecar.castShadow = true;
    sidecar.userData = { kind: 'hall', id };
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, 0.42, 8), metal(0x2a2118, { roughness: 0.55 }));
    whip.position.set(0.18, RACK_H + 0.18, 0.1);
    hallClusters.push(cluster);
    hallCabinets.push(cabinet);
    hallDoors.push(door);
    sidecars.push(sidecar);
    whips.push(whip);
    cluster.add(cabinet, plinth, cap, door, led, sidecar, whip);
    hallGroup.add(cluster);
  }
  scene.add(hallGroup);

  const cduGroup = new THREE.Group();
  const cdus: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const pose = cduPose(i);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.92, 1.78, 1.22), metal(0x1a2628, { roughness: 0.32 }));
    body.position.set(pose.x, 0.89, pose.z);
    body.castShadow = true;
    const face = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.42, 0.03), metal(0x0e1213, { roughness: 0.2 }));
    face.position.set(pose.x, 1.15, pose.z + 0.63);
    cduGroup.add(face);
    const pipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 1.4, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0x1b6f78,
        metalness: 0.1,
        roughness: 0.06,
        transmission: 0.55,
        thickness: 0.2,
        transparent: true,
      }),
    );
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(pose.x - 0.7, 1.35, pose.z);
    cdus.push(body);
    cduGroup.add(body, pipe);
  }
  scene.add(cduGroup);

  const busway = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.09, 0.22), metal(0xc4552a, { roughness: 0.35, metalness: 0.9 }));
  busway.position.set(0, 3.55, 0);
  scene.add(busway);

  const globe = buildGlobe();
  scene.add(globe.group);
  const campus = buildCampus();
  scene.add(campus.group);
  const studioMap = studioGridTexture();
  const studio = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshBasicMaterial({ map: studioMap, transparent: true, opacity: 0.55 }),
  );
  studio.rotation.x = -Math.PI / 2;
  studio.position.y = -0.02;
  scene.add(studio);

  const fogGeo = new THREE.BufferGeometry();
  const fogCount = 720;
  const fogPos = new Float32Array(fogCount * 3);
  for (let i = 0; i < fogCount; i += 1) {
    fogPos[i * 3] = (Math.random() - 0.5) * 1.1;
    fogPos[i * 3 + 1] = 0.15 + Math.random() * 2.05;
    fogPos[i * 3 + 2] = -0.2 - Math.random() * 0.85;
  }
  fogGeo.setAttribute('position', new THREE.BufferAttribute(fogPos, 3));
  const heatFog = new THREE.Points(
    fogGeo,
    new THREE.PointsMaterial({
      color: 0xff7a3c,
      size: 0.028,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      sizeAttenuation: true,
    }),
  );
  scene.add(heatFog);
  const worldClickables = [...globe.clickables, ...campus.clickables];

  const hero = new THREE.Group();
  scene.add(hero);
  const openTray = new THREE.Group();
  scene.add(openTray);
  const clickables: THREE.Object3D[] = [...hallCabinets, ...hallDoors, ...sidecars, ...worldClickables];
  const computeTrayMeshes: THREE.Mesh[] = [];
  const switchTrayMeshes: THREE.Mesh[] = [];

  function resetHallClicks() {
    clickables.length = 0;
    clickables.push(...hallCabinets, ...hallDoors, ...sidecars, ...worldClickables);
  }

  function clearHero() {
    hero.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          const map = 'map' in material ? material.map : null;
          if (map && map !== perforate && map !== pcbMap && map !== steel && map !== concrete) map.dispose();
          material.dispose();
        });
      }
    });
    hero.clear();
    computeTrayMeshes.length = 0;
    switchTrayMeshes.length = 0;
    resetHallClicks();
  }

  function clearOpen() {
    for (let index = clickables.length - 1; index >= 0; index -= 1) {
      if (clickables[index].userData.kind === 'chip') clickables.splice(index, 1);
    }
    openTray.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          const map = 'map' in material ? material.map : null;
          if (map && map !== pcbMap) map.dispose();
          if (material !== pcbMap) material.dispose();
        });
      }
    });
    openTray.clear();
  }

  function faceLabel(text: string, fill = 'rgba(8, 10, 12, 0.88)', ink = '#f4efe4') {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = ink;
    ctx.font = '800 34px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 0.055),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
  }

  function fasciaTexture(label: string, fill: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, 10, 64);
    ctx.fillStyle = '#f4efe4';
    ctx.font = '800 40px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 22, 34);
    ctx.fillStyle = 'rgba(244,239,228,0.28)';
    ctx.fillRect(430, 16, 62, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  function addHeroMesh(mesh: THREE.Mesh, click?: Click) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (click) {
      mesh.userData = click;
      clickables.push(mesh);
    }
    hero.add(mesh);
  }

  function buildHero(fact: RackFactSheet) {
    clearHero();
    const frame = metal(0x121416, { roughness: 0.32 });
    const postGeo = new THREE.BoxGeometry(0.04, RACK_H, 0.04);
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ] as const) {
      const post = new THREE.Mesh(postGeo, frame);
      post.position.set(sx * (RACK_W / 2 - 0.01), RACK_H / 2, sz * (RACK_D / 2 - 0.01));
      addHeroMesh(post);
    }
    const cap = new THREE.Mesh(new THREE.BoxGeometry(RACK_W + 0.03, 0.05, RACK_D + 0.03), frame);
    cap.position.set(0, RACK_H - 0.02, 0);
    addHeroMesh(cap);
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(RACK_W + 0.04, 0.07, RACK_D + 0.04), metal(0x0b0c0d, { roughness: 0.45 }));
    plinth.position.set(0, 0.035, 0);
    addHeroMesh(plinth);
    const sideGeo = new THREE.BoxGeometry(0.012, RACK_H - 0.12, RACK_D * 0.42);
    for (const side of [-1, 1]) {
      const panel = new THREE.Mesh(sideGeo, metal(0x1a1c1f, { roughness: 0.4 }));
      panel.position.set(side * (RACK_W / 2 - 0.008), RACK_H / 2, -RACK_D * 0.22);
      addHeroMesh(panel);
    }
    const rear = new THREE.Mesh(new THREE.BoxGeometry(RACK_W - 0.08, RACK_H - 0.14, 0.012), metal(0x101214, { roughness: 0.5 }));
    rear.position.set(0, RACK_H / 2, -RACK_D / 2 + 0.03);
    addHeroMesh(rear);

    let cursor = RACK_H - 0.08;
    for (const segment of fact.frontStack) {
      const count = segment.kind === 'compute' || segment.kind === 'switch' || segment.kind === 'power' ? segment.units : 1;
      const unitH = (segment.units * U_HEIGHT) / count;
      for (let i = 0; i < count; i += 1) {
        cursor -= unitH;
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(RACK_W - 0.1, unitH - 0.004, RACK_D - 0.28),
          metal(TRAY_KIND_COLOR[segment.kind], { roughness: 0.22, metalness: 0.78 }),
        );
        tray.position.set(0, cursor + unitH / 2, -0.02);
        const trayKind = segment.kind === 'switch' ? 'switch' : segment.kind === 'compute' ? 'compute' : undefined;
        if (trayKind === 'compute') computeTrayMeshes.push(tray);
        if (trayKind === 'switch') switchTrayMeshes.push(tray);
        addHeroMesh(tray, {
          kind: 'tray',
          id: segment.kind,
          face: 'front',
          trayIndex: trayKind ? (trayKind === 'compute' ? computeTrayMeshes.length - 1 : switchTrayMeshes.length - 1) : undefined,
          trayKind,
        });

        const index = trayKind === 'switch' ? switchTrayMeshes.length : trayKind === 'compute' ? computeTrayMeshes.length : i + 1;
        const fasciaLabel =
          trayKind === 'switch'
            ? `NV${String(index).padStart(2, '0')}`
            : trayKind === 'compute'
              ? `C${String(index).padStart(2, '0')}`
              : segment.kind === 'power'
                ? `PSU ${i + 1}`
                : segment.kind === 'management'
                  ? 'OOB'
                  : '';
        if (fasciaLabel) {
          const fill =
            segment.kind === 'compute' ? '#1d3c40' : segment.kind === 'switch' ? '#17202a' : segment.kind === 'power' ? '#3a2a18' : '#24302c';
          const fascia = new THREE.Mesh(
            new THREE.BoxGeometry(RACK_W - 0.14, Math.max(unitH - 0.006, 0.012), 0.012),
            new THREE.MeshBasicMaterial({
              map: fasciaTexture(fasciaLabel, fill),
            }),
          );
          fascia.position.set(-0.01, cursor + unitH / 2, RACK_D / 2 - 0.086);
          addHeroMesh(fascia, {
            kind: 'tray',
            id: segment.kind,
            face: 'front',
            trayIndex: trayKind ? index - 1 : undefined,
            trayKind,
          });
          const led = new THREE.Mesh(
            new THREE.BoxGeometry(0.016, Math.min(0.012, unitH * 0.45), 0.01),
            new THREE.MeshStandardMaterial({ color: 0x1ec8b8, emissive: 0x1ec8b8, emissiveIntensity: 1.6 }),
          );
          led.position.set(-RACK_W / 2 + 0.1, cursor + unitH / 2, RACK_D / 2 - 0.078);
          addHeroMesh(led);
        }
        if (trayKind === 'compute') {
          const tooth = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, Math.min(0.008, unitH * 0.35), 0.03),
            metal(0xc47a32, { roughness: 0.18, metalness: 1, emissive: 0x5a2208, emissiveIntensity: 0.35 }),
          );
          tooth.position.set(RACK_W / 2 - 0.08, cursor + unitH / 2, 0.12);
          addHeroMesh(tooth, { kind: 'rear', id: 'busbar', face: 'rear' });
          if (index % 2 === 0) {
            const hose = new THREE.Mesh(
              new THREE.TubeGeometry(
                new THREE.QuadraticBezierCurve3(
                  new THREE.Vector3(-0.16, cursor + unitH / 2, -0.2),
                  new THREE.Vector3(-0.22, cursor + unitH / 2, -0.35),
                  new THREE.Vector3(-0.2, RACK_H / 2, -RACK_D / 2 + 0.14),
                ),
                8,
                0.004,
                5,
                false,
              ),
              new THREE.MeshPhysicalMaterial({
                color: 0x18757c,
                roughness: 0.08,
                metalness: 0.1,
                transmission: 0.35,
                transparent: true,
                opacity: 0.9,
              }),
            );
            addHeroMesh(hose, { kind: 'rear', id: 'manifold', face: 'rear' });
          }
          if (index % 3 === 0) {
            const whip = new THREE.Mesh(
              new THREE.TubeGeometry(
                new THREE.QuadraticBezierCurve3(
                  new THREE.Vector3(0.1, cursor + unitH / 2, -0.18),
                  new THREE.Vector3(0.16, cursor + 0.2, -0.4),
                  new THREE.Vector3(0, RACK_H - 0.12, -0.1),
                ),
                8,
                0.005,
                5,
                false,
              ),
              metal(0x1c1612, { roughness: 0.55 }),
            );
            addHeroMesh(whip);
          }
        }
      }
    }

    const door = new THREE.Mesh(
      new THREE.BoxGeometry(RACK_W - 0.06, RACK_H - 0.22, 0.02),
      new THREE.MeshPhysicalMaterial({
        color: 0x2a3036,
        map: perforate,
        metalness: 0.58,
        roughness: 0.42,
        envMapIntensity: 1.05,
        emissive: 0x0a1214,
        emissiveIntensity: 0.25,
      }),
    );
    door.position.set(0, RACK_H / 2, RACK_D / 2 + 0.01);
    addHeroMesh(door, { kind: 'cabinet', id: 'door', face: 'front' });
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.2, 0.035), metal(0xc4a24a, { roughness: 0.22 }));
    handle.position.set(RACK_W / 2 - 0.1, RACK_H / 2, RACK_D / 2 + 0.035);
    addHeroMesh(handle, { kind: 'cabinet', id: 'door', face: 'front' });
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.22, 0.02),
      new THREE.MeshStandardMaterial({ color: 0x00c2b0, emissive: 0x00c2b0, emissiveIntensity: 2.2 }),
    );
    badge.position.set(-RACK_W / 2 + 0.08, RACK_H - 0.28, RACK_D / 2 + 0.03);
    addHeroMesh(badge, { kind: 'cabinet', id: 'door', face: 'front' });
    for (let i = 0; i < 3; i += 1) {
      const lamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.03, 0.012),
        new THREE.MeshStandardMaterial({
          color: i === 2 ? 0xff6a3c : 0x1ec8b8,
          emissive: i === 2 ? 0xff6a3c : 0x1ec8b8,
          emissiveIntensity: 1.8,
        }),
      );
      lamp.position.set(-0.12 + i * 0.08, RACK_H - 0.22, RACK_D / 2 + 0.028);
      addHeroMesh(lamp, { kind: 'cabinet', id: 'door', face: 'front' });
    }
    const plate = faceLabel('NVL72', '#14110c', '#7ef0d8');
    plate.position.set(0, RACK_H - 0.18, RACK_D / 2 + 0.03);
    addHeroMesh(plate);
    plate.userData = { kind: 'cabinet', id: 'door' };
    for (const y of [0.45, 1.1, 1.75]) {
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.06, 10), metal(0x8a8f93, { roughness: 0.28 }));
      hinge.position.set(-RACK_W / 2 + 0.02, y, RACK_D / 2 + 0.02);
      addHeroMesh(hinge, { kind: 'cabinet', id: 'door', face: 'front' });
    }
    const vent = new THREE.Mesh(new THREE.BoxGeometry(RACK_W - 0.16, 0.08, 0.016), metal(0x1a1c1f, { roughness: 0.5, map: perforate }));
    vent.position.set(0, 0.22, RACK_D / 2 + 0.024);
    addHeroMesh(vent, { kind: 'cabinet', id: 'door', face: 'front' });

    const busbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, RACK_H - 0.24, 0.1),
      metal(0xb87333, { roughness: 0.16, metalness: 1, emissive: 0x5a2208, emissiveIntensity: 0.28 }),
    );
    busbar.position.set(0, RACK_H / 2, -RACK_D / 2 + 0.08);
    addHeroMesh(busbar, { kind: 'rear', id: 'busbar', face: 'rear' });
    const spine = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, RACK_H - 0.18, 0.09),
      metal(0xc47a32, { roughness: 0.12, metalness: 1, emissive: 0x6a2a08, emissiveIntensity: 0.45 }),
    );
    spine.position.set(RACK_W / 2 - 0.03, RACK_H / 2, 0.1);
    addHeroMesh(spine, { kind: 'rear', id: 'busbar', face: 'rear' });
    const spineTag = faceLabel('50V', '#5a2a0c', '#f4d7a8');
    spineTag.position.set(RACK_W / 2 + 0.01, RACK_H / 2, 0.16);
    spineTag.rotation.y = -Math.PI / 2;
    addHeroMesh(spineTag);

    for (const side of [-1, 1]) {
      const manifold = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, RACK_H - 0.35, 18),
        new THREE.MeshPhysicalMaterial({
          color: 0x18757c,
          metalness: 0.12,
          roughness: 0.05,
          transmission: 0.62,
          thickness: 0.25,
          transparent: true,
          opacity: 0.92,
        }),
      );
      manifold.position.set(side * 0.2, RACK_H / 2, -RACK_D / 2 + 0.14);
      addHeroMesh(manifold, { kind: 'rear', id: 'manifold', face: 'rear' });
    }

    for (let i = 0; i < 4; i += 1) {
      const cart = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.34, 0.08), metal(0x1a1c20, { roughness: 0.3 }));
      cart.position.set(-0.18 + (i % 2) * 0.36, 0.55 + Math.floor(i / 2) * 0.7, -RACK_D / 2 + 0.11);
      addHeroMesh(cart, { kind: 'rear', id: 'cartridge', face: 'rear' });
    }
  }

  function addOpenMesh(mesh: THREE.Mesh, chip?: ChipId) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (chip) {
      mesh.userData = { kind: 'chip', id: chip };
      clickables.push(mesh);
    }
    openTray.add(mesh);
  }

  function chipCaption(text: string) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.fillStyle = 'rgba(8, 10, 12, 0.78)';
    ctx.fillRect(0, 0, 256, 64);
    ctx.fillStyle = '#f4efe4';
    ctx.font = '600 26px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 32);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.14, 0.035),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2.6;
    return mesh;
  }

  function buildOpenTray(variant: RackFactSheet['variant'], kind: TrayKind) {
    clearOpen();
    const kit = trayKit(variant, kind);
    const has = (id: ChipId) => kit.parts.some((part) => part.id === id);

    const sled = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.018, 1.02), metal(0x121416, { roughness: 0.34 }));
    sled.position.set(0, 0.009, 0);
    addOpenMesh(sled);
    const rails = metal(0x8a8f93, { roughness: 0.22, metalness: 0.95 });
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 1.02), rails);
      rail.position.set(side * 0.29, 0.02, 0);
      addOpenMesh(rail);
    }

    const pcb = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.01, 0.92),
      new THREE.MeshPhysicalMaterial({
        map: pcbMap,
        color: 0x16352c,
        roughness: 0.55,
        metalness: 0.08,
      }),
    );
    pcb.position.set(0, 0.024, 0);
    addOpenMesh(pcb);

    const die = (w: number, h: number, d: number, color: number, x: number, z: number, chip: ChipId, glow = 0.2) => {
      const substrate = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.016, 0.004, d + 0.016),
        metal(0xc4a24a, { roughness: 0.35, metalness: 0.85 }),
      );
      substrate.position.set(x, 0.03, z);
      addOpenMesh(substrate, chip);
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        metal(color, { roughness: 0.2, metalness: 0.7, emissive: color, emissiveIntensity: glow }),
      );
      mesh.position.set(x, 0.032 + h / 2, z);
      addOpenMesh(mesh, chip);
    };

    const plate = (w: number, d: number, x: number, z: number) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.005, d),
        new THREE.MeshPhysicalMaterial({
          color: 0x1b8a86,
          metalness: 0.15,
          roughness: 0.06,
          transmission: 0.42,
          thickness: 0.06,
          transparent: true,
          opacity: 0.42,
        }),
      );
      mesh.position.set(x, 0.048, z);
      addOpenMesh(mesh, 'coldplate');
    };

    const caption = (text: string, x: number, z: number, chip: ChipId) => {
      const mesh = chipCaption(text);
      mesh.position.set(x, 0.062, z);
      addOpenMesh(mesh, chip);
    };

    if (kind === 'compute') {
      const gpuXs = [-0.14, 0.14];
      const gpuZs = [-0.08, 0.16];
      gpuXs.forEach((x) => {
        gpuZs.forEach((z) => {
          die(0.11, 0.016, 0.11, 0x1a1a1c, x, z, 'gpu', 0.35);
          if (has('hbm')) die(0.028, 0.012, 0.08, 0x3a3220, x + 0.078, z, 'hbm', 0.12);
          if (has('coldplate')) plate(0.12, 0.12, x, z);
        });
      });
      caption('GPU', -0.14, -0.08, 'gpu');
      die(0.1, 0.014, 0.1, 0x2a3038, -0.14, -0.32, 'cpu', 0.22);
      die(0.1, 0.014, 0.1, 0x2a3038, 0.14, -0.32, 'cpu', 0.22);
      if (has('coldplate')) {
        plate(0.11, 0.11, -0.14, -0.32);
        plate(0.11, 0.11, 0.14, -0.32);
      }
      caption('CPU', -0.14, -0.32, 'cpu');
      if (has('dpu')) {
        die(0.08, 0.012, 0.06, 0x14322c, -0.16, -0.4, 'dpu', 0.18);
        caption('DPU', -0.16, -0.4, 'dpu');
      }
      if (has('osfp')) {
        die(0.16, 0.02, 0.05, 0x0b0d10, 0.12, -0.42, 'osfp', 0.4);
        caption('OSFP', 0.12, -0.42, 'osfp');
      }
      if (has('pdb')) {
        die(0.09, 0.018, 0.07, 0x2b2118, 0, 0.38, 'pdb', 0.08);
        caption('PDB', 0, 0.38, 'pdb');
      }
    } else {
      die(0.14, 0.018, 0.14, 0x142028, -0.12, 0, 'nvswitch', 0.4);
      die(0.14, 0.018, 0.14, 0x142028, 0.12, 0, 'nvswitch', 0.4);
      if (has('coldplate')) {
        plate(0.15, 0.15, -0.12, 0);
        plate(0.15, 0.15, 0.12, 0);
      }
      caption('NVSW', -0.12, 0, 'nvswitch');
      if (has('pdb')) {
        die(0.08, 0.016, 0.06, 0x2b2118, 0, 0.34, 'pdb', 0.08);
        caption('PDB', 0, 0.34, 'pdb');
      }
    }

    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.04, 0.04), metal(0x101214, { roughness: 0.3 }));
    bezel.position.set(0, 0.028, -0.5);
    addOpenMesh(bezel);
    const clip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.05), metal(0xb87333, { roughness: 0.18, metalness: 1 }));
    clip.position.set(0, 0.03, 0.5);
    addOpenMesh(clip, has('pdb') ? 'pdb' : undefined);
    for (const side of [-1, 1]) {
      const qd = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.05, 12),
        new THREE.MeshPhysicalMaterial({
          color: 0x18757c,
          metalness: 0.12,
          roughness: 0.05,
          transmission: 0.5,
          thickness: 0.12,
          transparent: true,
        }),
      );
      qd.rotation.z = Math.PI / 2;
      qd.position.set(side * 0.22, 0.03, 0.48);
      addOpenMesh(qd, has('coldplate') ? 'coldplate' : undefined);
    }
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const desiredCam = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  let followCamera = true;
  let lastVariant = '';
  let lastMode: PlantSceneInput['cameraMode'] = 'hall';
  let lastFace: RackFace = 'front';
  let lastFocus = -1;
  let lastOpen = '';

  function aimCamera(input: PlantSceneInput) {
    const pose = hallPose(input.model.focus.id);
    const aim =
      input.cameraMode === 'rack' && input.face === 'rear'
        ? {
            cam: new THREE.Vector3(pose.x + 0.22, 1.2, pose.z - 1.35),
            target: new THREE.Vector3(pose.x, 1.1, pose.z - 0.52),
            near: 0.06,
            far: 80,
            min: 0.6,
            max: 8,
          }
        : scaleAim(input.cameraMode, pose);
    camera.fov = input.cameraMode === 'rack' ? 46 : 38;
    desiredCam.copy(aim.cam);
    desiredTarget.copy(aim.target);
    camera.near = aim.near;
    camera.far = aim.far;
    camera.updateProjectionMatrix();
    controls.minDistance = aim.min;
    controls.maxDistance = aim.max;
  }

  function update(input: PlantSceneInput) {
    if (input.fact.variant !== lastVariant) {
      buildHero(input.fact);
      lastVariant = input.fact.variant;
    }

    const pose = hallPose(input.model.focus.id);
    const hallLayer = isHallLayer(input.cameraMode);
    globe.group.visible = input.cameraMode === 'satellite';
    campus.group.visible = input.cameraMode === 'campus';
    studio.visible = input.cameraMode === 'satellite' || input.cameraMode === 'campus';
    floor.visible = hallLayer;
    tiles.visible = hallLayer;
    backWall.visible = hallLayer;
    leftWall.visible = hallLayer;
    slab.visible = hallLayer;
    ceiling.visible = hallLayer;
    hallGroup.visible = hallLayer;
    cduGroup.visible = hallLayer;
    heatFog.visible = hallLayer;
    heatFog.position.set(pose.x, 0, pose.z);
    (heatFog.material as THREE.PointsMaterial).opacity = 0.05 + (input.model.thermalIndex / 100) * 0.22;
    (heatFog.material as THREE.PointsMaterial).color.set(
      input.model.status === 'hot' || input.model.status === 'power' ? 0xff6a3c : 0xc4a24a,
    );
    scene.background = new THREE.Color(
      input.cameraMode === 'satellite' ? 0x020308 : input.cameraMode === 'campus' ? 0x10140f : 0x07090b,
    );
    scene.fog = hallLayer ? new THREE.FogExp2(0x0a0d10, 0.024 + (1 - input.model.flowMargin / 100) * 0.02) : null;

    hero.position.set(pose.x, 0, pose.z);
    hero.visible = hallLayer && (input.model.hall[input.model.focus.id]?.active ?? false);
    hero.traverse((child) => {
      if (child.userData.kind === 'cabinet') child.visible = input.cameraMode === 'cabinet';
    });

    const openKey = `${input.fact.variant}-${input.openKind}`;
    if (openKey !== lastOpen) {
      buildOpenTray(input.fact.variant, input.openKind);
      lastOpen = openKey;
    }
    openTray.visible = input.cameraMode === 'open';
    openTray.position.set(pose.x, 1.18, pose.z + 0.78);

    input.model.hall.forEach((rack: HallRack, id: number) => {
      const cabinet = hallCabinets[id];
      const door = hallDoors[id];
      const sidecar = sidecars[id];
      const whip = whips[id];
      const neighbors = input.cameraMode === 'hall';
      hallClusters[id].visible = hallLayer && neighbors && rack.active && !rack.focused;
      cabinet.visible = hallLayer && neighbors && rack.active && !rack.focused;
      door.visible = hallLayer && neighbors && rack.active && !rack.focused;
      sidecar.visible = hallLayer && rack.active && usesSidecar(input.powerPath);
      whip.visible = hallLayer && rack.active && usesWhips(input.powerPath);
      const material = cabinet.material as THREE.MeshPhysicalMaterial;
      material.color.copy(thermalColor(rack.thermal));
      material.emissive = thermalColor(rack.thermal).multiplyScalar(rack.focused ? 0.35 : 0.12);
      material.emissiveIntensity = rack.focused ? 0.55 : 0.18;
      (door.material as THREE.MeshPhysicalMaterial).emissiveIntensity = rack.thermal / 140;
      if (rack.focused) cabinet.scale.set(1.02, 1, 1.02);
      else cabinet.scale.set(1, 1, 1);
    });

    cdus.forEach((mesh, index) => {
      mesh.visible = index < input.model.cduCount;
      const material = mesh.material as THREE.MeshPhysicalMaterial;
      material.emissive = new THREE.Color(0x145c5a);
      material.emissiveIntensity = 0.15 + input.model.cduLoad * 0.4;
    });

    busway.visible = hallLayer && usesOverheadBusway(input.powerPath);
    aisleFill.visible = hallLayer;
    aisleFill.intensity = 1.1 + (input.model.thermalIndex / 100) * 3.4;
    aisleFill.color.set(input.model.status === 'hot' || input.model.status === 'power' ? 0xff6a3c : 0xffc27a);

    const trays = input.openKind === 'switch' ? switchTrayMeshes : computeTrayMeshes;
    trays.forEach((mesh, index) => {
      mesh.position.z = index === input.openTrayIndex && input.cameraMode === 'open' ? 0.18 : 0.02;
    });

    hero.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.userData.kind) return;
      const selected =
        (child.userData.kind === 'tray' && child.userData.id === input.inspectId) ||
        (child.userData.kind === 'rear' && child.userData.id === input.inspectId);
      const material = child.material as THREE.MeshPhysicalMaterial;
      if (material.emissive) material.emissiveIntensity = selected ? 0.8 : material.emissiveIntensity;
    });
    openTray.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || child.userData.kind !== 'chip') return;
      const material = child.material as THREE.MeshPhysicalMaterial;
      if (material.emissive) {
        material.emissiveIntensity = child.userData.id === input.openChip ? 1.15 : 0.22;
      }
    });

    if (input.cameraMode !== lastMode || input.face !== lastFace || input.model.focus.id !== lastFocus) {
      aimCamera(input);
      followCamera = true;
      camera.position.copy(desiredCam);
      controls.target.copy(desiredTarget);
      lastMode = input.cameraMode;
      lastFace = input.face;
      lastFocus = input.model.focus.id;
    }
  }

  function onPointer(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(clickables, false)[0];
    if (!hit) return;
    const data = hit.object.userData as Click;
    if (data.kind === 'hall') onClick({ kind: 'hall', id: Number(data.id) });
    if (data.kind === 'tray') {
      onClick({
        kind: 'tray',
        id: data.id,
        face: 'front',
        trayIndex: data.trayIndex,
        trayKind: data.trayKind,
      });
    }
    if (data.kind === 'rear') onClick({ kind: 'rear', id: data.id, face: 'rear' });
    if (data.kind === 'chip') onClick({ kind: 'chip', id: data.id });
    if (data.kind === 'world') onClick({ kind: 'world', id: data.id });
    if (data.kind === 'cabinet') onClick({ kind: 'cabinet', id: 'door', face: 'front' });
  }

  function onControlStart() {
    followCamera = false;
  }

  renderer.domElement.addEventListener('pointerdown', onPointer);
  controls.addEventListener('start', onControlStart);

  const resize = () => {
    const width = host.clientWidth;
    const height = Math.max(host.clientHeight, 1);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const observer = new ResizeObserver(resize);

  observer.observe(host);

  let frame = 0;
  const tick = () => {
    frame = requestAnimationFrame(tick);
    if (followCamera) {
      camera.position.lerp(desiredCam, 0.06);
      controls.target.lerp(desiredTarget, 0.08);
    }
    const fogAttr = heatFog.geometry.getAttribute('position');
    for (let i = 0; i < fogAttr.count; i += 1) {
      const y = fogAttr.getY(i) + 0.004;
      fogAttr.setY(i, y > 2.2 ? 0.12 : y);
    }
    fogAttr.needsUpdate = true;
    controls.update();
    renderer.render(scene, camera);
  };
  desiredCam.copy(camera.position);
  desiredTarget.copy(controls.target);
  tick();

  return {
    update,
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointer);
      controls.removeEventListener('start', onControlStart);
      controls.dispose();
      pmrem.dispose();
      concrete.dispose();
      steel.dispose();
      perforate.dispose();
      pcbMap.dispose();
      studioMap.dispose();
      globe.textures.forEach((texture) => texture.dispose());
      campus.textures.forEach((texture) => texture.dispose());
      fogGeo.dispose();
      (heatFog.material as THREE.PointsMaterial).dispose();
      clearOpen();
      clearHero();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
