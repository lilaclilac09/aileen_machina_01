import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
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

export type PlantSceneInput = {
  model: PlantSim;
  fact: RackFactSheet;
  face: RackFace;
  inspectId: InspectId;
  powerPath: PowerPath;
  cameraMode: 'hall' | 'rack';
};

export type PlantSceneHandle = {
  update: (input: PlantSceneInput) => void;
  dispose: () => void;
};

type Click = {
  kind: 'hall' | 'tray' | 'rear';
  id: number | InspectId;
  face?: RackFace;
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
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(host.clientWidth, host.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07090b);
  scene.fog = new THREE.FogExp2(0x0a0d10, 0.032);

  const camera = new THREE.PerspectiveCamera(38, host.clientWidth / Math.max(host.clientHeight, 1), 0.08, 80);
  camera.position.set(11.2, 6.4, 12.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minDistance = 1.4;
  controls.maxDistance = 28;
  controls.target.set(0, 0.95, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const concrete = noiseTexture(256, [0.42, 0.41, 0.39], 70);
  concrete.repeat.set(18, 18);
  const steel = noiseTexture(128, [0.55, 0.58, 0.6], 90);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(42, 42),
    new THREE.MeshPhysicalMaterial({
      map: concrete,
      roughness: 0.72,
      metalness: 0.08,
      envMapIntensity: 0.35,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const tiles = new THREE.GridHelper(24, 32, 0x1c2422, 0x141918);
  tiles.position.y = 0.002;
  scene.add(tiles);

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
  const hallCabinets: THREE.Mesh[] = [];
  const hallDoors: THREE.Mesh[] = [];
  const sidecars: THREE.Mesh[] = [];
  const whips: THREE.Mesh[] = [];
  const cabinetGeo = new THREE.BoxGeometry(RACK_W, RACK_H, RACK_D);
  const doorGeo = new THREE.BoxGeometry(RACK_W - 0.06, RACK_H - 0.18, 0.02);
  const sidecarGeo = new THREE.BoxGeometry(SIDECAR_W, RACK_H, RACK_D * 0.82);
  const cabinetMat = metal(0x17191c, { roughness: 0.34, map: steel });
  for (let id = 0; id < HALL_SLOTS; id += 1) {
    const pose = hallPose(id);
    const cabinet = new THREE.Mesh(cabinetGeo, cabinetMat.clone());
    cabinet.position.set(pose.x, RACK_H / 2, pose.z);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    cabinet.userData = { kind: 'hall', id };
    const door = new THREE.Mesh(
      doorGeo,
      new THREE.MeshPhysicalMaterial({
        color: 0x0c1012,
        metalness: 0.15,
        roughness: 0.08,
        transmission: 0.18,
        thickness: 0.04,
        transparent: true,
        opacity: 0.92,
      }),
    );
    door.position.set(pose.x, RACK_H / 2, pose.z + RACK_D / 2 + 0.012);
    door.userData = { kind: 'hall', id };
    const sidecar = new THREE.Mesh(sidecarGeo, metal(0x2b2118, { roughness: 0.4 }));
    sidecar.position.set(pose.sidecarX, RACK_H / 2, pose.z);
    sidecar.castShadow = true;
    sidecar.userData = { kind: 'hall', id };
    const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.1, 8), metal(0x3b2a18, { roughness: 0.6 }));
    whip.position.set(pose.x + 0.22, 3.1, pose.z);
    hallCabinets.push(cabinet);
    hallDoors.push(door);
    sidecars.push(sidecar);
    whips.push(whip);
    hallGroup.add(cabinet, door, sidecar, whip);
  }
  scene.add(hallGroup);

  const cduGroup = new THREE.Group();
  const cdus: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const pose = cduPose(i);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.7, 1.15), metal(0x1d2a2c, { roughness: 0.38 }));
    body.position.set(pose.x, 0.85, pose.z);
    body.castShadow = true;
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

  const hero = new THREE.Group();
  scene.add(hero);
  const clickables: THREE.Object3D[] = [...hallCabinets, ...hallDoors, ...sidecars];

  function clearHero() {
    hero.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => material.dispose());
      }
    });
    hero.clear();
    clickables.length = 0;
    clickables.push(...hallCabinets, ...hallDoors, ...sidecars);
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
    const rails = new THREE.Mesh(new THREE.BoxGeometry(RACK_W + 0.04, RACK_H + 0.04, RACK_D + 0.04), frame);
    rails.position.set(0, RACK_H / 2, 0);
    addHeroMesh(rails);

    const inner = new THREE.Mesh(new THREE.BoxGeometry(RACK_W - 0.05, RACK_H - 0.08, RACK_D - 0.08), metal(0x0c0d0f, { roughness: 0.55 }));
    inner.position.set(0, RACK_H / 2, 0);
    addHeroMesh(inner);

    let cursor = RACK_H - 0.08;
    for (const segment of fact.frontStack) {
      const count = segment.kind === 'compute' || segment.kind === 'switch' || segment.kind === 'power' ? segment.units : 1;
      const unitH = (segment.units * U_HEIGHT) / count;
      for (let i = 0; i < count; i += 1) {
        cursor -= unitH;
        const tray = new THREE.Mesh(
          new THREE.BoxGeometry(RACK_W - 0.1, unitH - 0.004, RACK_D - 0.16),
          metal(TRAY_KIND_COLOR[segment.kind], { roughness: 0.22, metalness: 0.78 }),
        );
        tray.position.set(0, cursor + unitH / 2, 0.02);
        addHeroMesh(tray, { kind: 'tray', id: segment.kind, face: 'front' });

        if (segment.kind === 'compute' || segment.kind === 'switch') {
          const port = new THREE.Mesh(
            new THREE.BoxGeometry(0.22, Math.min(0.018, unitH * 0.4), 0.02),
            new THREE.MeshStandardMaterial({ color: 0x0b0b0b, emissive: 0x1ec8b8, emissiveIntensity: 0.35 }),
          );
          port.position.set(-0.16, cursor + unitH / 2, RACK_D / 2 - 0.09);
          addHeroMesh(port);
        }
      }
    }

    const busbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, RACK_H - 0.28, 0.07),
      metal(0xb87333, { roughness: 0.18, metalness: 1, emissive: 0x3a1808, emissiveIntensity: 0.15 }),
    );
    busbar.position.set(0, RACK_H / 2, -RACK_D / 2 + 0.08);
    addHeroMesh(busbar, { kind: 'rear', id: 'busbar', face: 'rear' });

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

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const desiredCam = new THREE.Vector3();
  const desiredTarget = new THREE.Vector3();
  let followCamera = true;
  let lastVariant = '';
  let lastMode: PlantSceneInput['cameraMode'] = 'hall';
  let lastFace: RackFace = 'front';
  let lastFocus = -1;

  function aimCamera(input: PlantSceneInput) {
    const pose = hallPose(input.model.focus.id);
    if (input.cameraMode === 'hall') {
      desiredCam.set(11.2, 6.4, 12.4);
      desiredTarget.set(0, 0.95, 0);
    } else if (input.face === 'rear') {
      desiredCam.set(pose.x, 1.45, pose.z - 2.55);
      desiredTarget.set(pose.x, 1.15, pose.z);
    } else {
      desiredCam.set(pose.x, 1.45, pose.z + 2.55);
      desiredTarget.set(pose.x, 1.15, pose.z);
    }
  }

  function update(input: PlantSceneInput) {
    if (input.fact.variant !== lastVariant) {
      buildHero(input.fact);
      lastVariant = input.fact.variant;
    }

    const pose = hallPose(input.model.focus.id);
    hero.position.set(pose.x, 0, pose.z);
    hero.visible = input.model.hall[input.model.focus.id]?.active ?? false;

    input.model.hall.forEach((rack: HallRack, id: number) => {
      const cabinet = hallCabinets[id];
      const door = hallDoors[id];
      const sidecar = sidecars[id];
      const whip = whips[id];
      cabinet.visible = rack.active && !rack.focused;
      door.visible = rack.active && !rack.focused;
      sidecar.visible = rack.active && usesSidecar(input.powerPath);
      whip.visible = rack.active && usesWhips(input.powerPath);
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

    busway.visible = usesOverheadBusway(input.powerPath);
    aisleFill.intensity = 1.1 + (input.model.thermalIndex / 100) * 3.4;
    aisleFill.color.set(input.model.status === 'hot' || input.model.status === 'power' ? 0xff6a3c : 0xffc27a);
    (scene.fog as THREE.FogExp2).density = 0.024 + (1 - input.model.flowMargin / 100) * 0.02;

    hero.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || !child.userData.kind) return;
      const selected =
        (child.userData.kind === 'tray' && child.userData.id === input.inspectId) ||
        (child.userData.kind === 'rear' && child.userData.id === input.inspectId);
      const material = child.material as THREE.MeshPhysicalMaterial;
      if (material.emissive) material.emissiveIntensity = selected ? 0.8 : material.emissiveIntensity;
    });

    if (input.cameraMode !== lastMode || input.face !== lastFace || input.model.focus.id !== lastFocus) {
      aimCamera(input);
      followCamera = true;
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
    if (data.kind === 'tray') onClick({ kind: 'tray', id: data.id, face: 'front' });
    if (data.kind === 'rear') onClick({ kind: 'rear', id: data.id, face: 'rear' });
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
      clearHero();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
