import * as THREE from 'three';
import type { EvidenceLevel } from './rack-facts';
import type { HallPose } from './viewport';

export const CAMERA_MODES = ['satellite', 'campus', 'hall', 'cabinet', 'rack', 'open'] as const;
export type CameraMode = (typeof CAMERA_MODES)[number];

export const SITE = {
  name: 'assumption white-space campus',
  lat: 36.2,
  lon: -115.1,
  level: 'assumption' as EvidenceLevel,
  note: 'Stylized globe and aerial. Not live Maxar/Google tiles, not a real tenant site.',
};

export type ScaleFact = {
  title: string;
  summary: string;
  detail: string;
  level: EvidenceLevel;
};

export const SCALE_FACTS: Record<CameraMode, ScaleFact> = {
  satellite: {
    title: 'satellite',
    summary: 'Procedural globe. Pin marks the assumption campus.',
    detail: SITE.note,
    level: 'assumption',
  },
  campus: {
    title: 'campus aerial',
    summary: 'Warehouse, cooling yard, substation, parking.',
    detail: 'Layout is a modeling sketch so the camera can fly in. Not a surveyed site.',
    level: 'assumption',
  },
  hall: {
    title: 'white-space hall',
    summary: 'Same 48-slot hall the plant kernel already computes.',
    detail: 'Aisle heat and CDU count come from simulatePlant, not CFD.',
    level: 'derived',
  },
  cabinet: {
    title: 'closed cabinet',
    summary: 'Perforated door, status LED, handle — then open.',
    detail: 'Door geometry is procedural. LED tone follows rack thermal.',
    level: 'assumption',
  },
  rack: {
    title: 'open rack',
    summary: '18 compute + 9 switch trays, copper busbar, cables.',
    detail: 'U stack is source-backed. Cable routes are a modeling sketch.',
    level: 'source-backed',
  },
  open: {
    title: 'open tray',
    summary: 'GPU / CPU / HBM / DPU on one pulled 1U.',
    detail: 'Die layout follows public tray notes. Watts stay on the kernel.',
    level: 'source-backed',
  },
};

export function latLonToUnit(lat: number, lon: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -Math.sin(phi) * Math.cos(theta),
    Math.cos(phi),
    Math.sin(phi) * Math.sin(theta),
  );
}

export function earthTexture() {
  const width = 512;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  const ocean = ctx.createLinearGradient(0, 0, 0, height);
  ocean.addColorStop(0, '#0a1c33');
  ocean.addColorStop(0.5, '#123a55');
  ocean.addColorStop(1, '#0a1c33');
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, width, height);

  const land = (cx: number, cy: number, rx: number, ry: number, color: string) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  land(120, 90, 70, 42, '#2d5a3a');
  land(95, 130, 36, 28, '#3a6a40');
  land(250, 80, 90, 36, '#2f5340');
  land(280, 120, 50, 22, '#35563c');
  land(240, 150, 38, 40, '#3d5a32');
  land(400, 160, 48, 22, '#4a5a32');
  land(430, 70, 28, 18, '#2a4a38');

  ctx.fillStyle = 'rgba(255, 236, 180, 0.18)';
  for (let i = 0; i < 120; i += 1) {
    ctx.fillRect((i * 47) % width, 40 + ((i * 19) % 160), 1.4, 1.4);
  }

  const pin = latLonToCanvas(SITE.lat, SITE.lon, width, height);
  ctx.fillStyle = '#7ef0d8';
  ctx.beginPath();
  ctx.arc(pin.x, pin.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f4efe4';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function latLonToCanvas(lat: number, lon: number, width: number, height: number) {
  return {
    x: ((lon + 180) / 360) * width,
    y: ((90 - lat) / 180) * height,
  };
}

export function campusTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#3a3428';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#4a4334';
  for (let i = 0; i < 80; i += 1) {
    ctx.fillRect((i * 61) % size, (i * 29) % size, 18, 10);
  }
  ctx.strokeStyle = '#6a6252';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(0, 360);
  ctx.lineTo(512, 360);
  ctx.moveTo(180, 0);
  ctx.lineTo(180, 512);
  ctx.stroke();
  ctx.fillStyle = '#c9c2b0';
  ctx.fillRect(210, 150, 220, 130);
  ctx.fillStyle = '#8a8374';
  ctx.fillRect(214, 154, 212, 40);
  ctx.fillStyle = '#2a3a38';
  for (let i = 0; i < 6; i += 1) {
    ctx.beginPath();
    ctx.arc(80 + (i % 3) * 36, 200 + Math.floor(i / 3) * 36, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#2a2418';
  ctx.fillRect(40, 380, 90, 70);
  ctx.fillStyle = '#1a1814';
  for (let x = 320; x < 480; x += 14) {
    for (let y = 390; y < 470; y += 18) {
      ctx.fillRect(x, y, 10, 14);
    }
  }
  ctx.fillStyle = '#e8f6f0';
  ctx.font = '600 22px ui-sans-serif, system-ui';
  ctx.fillText('HALL', 270, 230);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function studioGridTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#07090c';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(80, 210, 190, 0.22)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= size; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  return texture;
}

function metal(color: number, extras: THREE.MeshPhysicalMaterialParameters = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.82,
    roughness: 0.3,
    envMapIntensity: 1.05,
    ...extras,
  });
}

export function buildGlobe() {
  const group = new THREE.Group();
  const map = earthTexture();
  const globe = new THREE.Mesh(
    new THREE.SphereGeometry(2.35, 64, 48),
    new THREE.MeshPhysicalMaterial({
      map,
      roughness: 0.62,
      metalness: 0.08,
      emissive: 0x041018,
      emissiveIntensity: 0.35,
    }),
  );
  globe.userData = { kind: 'world', id: 'campus' };
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.42, 48, 36),
    new THREE.MeshBasicMaterial({
      color: 0x6fd0c8,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    }),
  );
  const pinDir = latLonToUnit(SITE.lat, SITE.lon);
  const pin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.16, 10), metal(0x7ef0d8, { emissive: 0x1ec8b8, emissiveIntensity: 1.2 }));
  pin.position.copy(pinDir.multiplyScalar(2.42));
  pin.lookAt(0, 0, 0);
  pin.rotateX(Math.PI);
  pin.userData = { kind: 'world', id: 'campus' };
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.008, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0xf4efe4 }),
  );
  ring.position.copy(pin.position);
  ring.lookAt(0, 0, 0);
  group.add(globe, atmosphere, pin, ring);

  const stars = new THREE.BufferGeometry();
  const starPos = new Float32Array(900);
  for (let i = 0; i < 300; i += 1) {
    const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
    starPos[i * 3] = dir.x * (12 + Math.random() * 10);
    starPos[i * 3 + 1] = dir.y * (12 + Math.random() * 10);
    starPos[i * 3 + 2] = dir.z * (12 + Math.random() * 10);
  }
  stars.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  group.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: 0xd8e8f0, size: 0.035 })));
  return { group, clickables: [globe, pin], textures: [map] };
}

export function buildCampus() {
  const group = new THREE.Group();
  const map = campusTexture();
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 46),
    new THREE.MeshPhysicalMaterial({ map, roughness: 0.86, metalness: 0.04 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  const hall = new THREE.Mesh(new THREE.BoxGeometry(8.4, 2.6, 5.2), metal(0xc9c2b0, { roughness: 0.45, metalness: 0.15 }));
  hall.position.set(4.2, 1.3, -2.4);
  hall.castShadow = true;
  hall.userData = { kind: 'world', id: 'hall' };
  const roof = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.12, 5.4), metal(0x8a8374, { roughness: 0.5 }));
  roof.position.set(4.2, 2.66, -2.4);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.6, 0.08), metal(0x1a2220, { roughness: 0.35 }));
  door.position.set(4.2, 0.9, 0.22);
  door.userData = { kind: 'world', id: 'hall' };
  const cooling: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i += 1) {
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.4, 16), metal(0x1a3a38, { roughness: 0.28 }));
    tank.position.set(-8 + (i % 3) * 1.6, 0.7, -3 + Math.floor(i / 3) * 1.7);
    tank.castShadow = true;
    cooling.push(tank);
    group.add(tank);
  }
  const yard = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 2.1), metal(0x2a2418, { roughness: 0.4 }));
  yard.position.set(-9.5, 0.45, 6.2);
  group.add(ground, hall, roof, door, yard);
  return { group, clickables: [hall, door], textures: [map] };
}

export function scaleAim(mode: CameraMode, pose: HallPose) {
  if (mode === 'satellite') {
    return {
      cam: new THREE.Vector3(0.8, 1.15, 7.6),
      target: new THREE.Vector3(0, 0, 0),
      near: 0.2,
      far: 80,
      min: 4,
      max: 16,
    };
  }
  if (mode === 'campus') {
    return {
      cam: new THREE.Vector3(10, 14, 18),
      target: new THREE.Vector3(1, 0.4, 0),
      near: 0.2,
      far: 80,
      min: 6,
      max: 32,
    };
  }
  if (mode === 'cabinet') {
    return {
      cam: new THREE.Vector3(pose.x, 1.35, pose.z + 1.15),
      target: new THREE.Vector3(pose.x, 1.15, pose.z + 0.55),
      near: 0.08,
      far: 80,
      min: 0.6,
      max: 8,
    };
  }
  if (mode === 'open') {
    return {
      cam: new THREE.Vector3(pose.x + 0.55, 1.72, pose.z + 1.35),
      target: new THREE.Vector3(pose.x, 1.22, pose.z + 0.72),
      near: 0.08,
      far: 80,
      min: 0.5,
      max: 8,
    };
  }
  if (mode === 'hall') {
    return {
      cam: new THREE.Vector3(6.8, 3.15, 8.4),
      target: new THREE.Vector3(0.2, 1.05, 0.4),
      near: 0.08,
      far: 80,
      min: 1.2,
      max: 22,
    };
  }
  return {
    cam: new THREE.Vector3(pose.x, 1.45, pose.z + 2.55),
    target: new THREE.Vector3(pose.x, 1.15, pose.z),
    near: 0.08,
    far: 80,
    min: 0.8,
    max: 10,
  };
}

export function isHallLayer(mode: CameraMode) {
  return mode === 'hall' || mode === 'cabinet' || mode === 'rack' || mode === 'open';
}
