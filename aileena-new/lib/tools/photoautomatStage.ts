/** Photoautomat street stage: the cabinet in metres, a velvet curtain to pull, and the wet machine behind the front panel. */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { composeSheet, simulationFrame } from './photoautomat';
import { BOOTH, bathAt } from './photoautomatData';
import {
  CABIN_INKS,
  STREET_INKS,
  paintGlow,
  paintGraffiti,
  paintLabel,
  paintPlate,
  paintPoster,
  paintRedWall,
  paintRubber,
  paintSetts,
  paintSign,
  paintSky,
  paintSteel,
  paintSticker,
  paintVelvet,
  paintWeave,
  STICKER_KINDS,
  type StickerKind,
} from './photoautomatPaint';

export type BoothStageState = {
  curtain: boolean;
  spin: boolean;
  xray: boolean;
  /** -1 while nothing is in the chemistry. */
  bath: number;
  /** Machine seconds since the strip left the camera. */
  clock: number;
  /** Where the finished strip is: still in the machine, waiting in the delivery slot, or in the visitor's hand. */
  strip: 'none' | 'slot' | 'held';
};

export type BoothStageOptions = {
  onState: (state: BoothStageState) => void;
  onEntered: () => void;
};

export type BoothStageHandle = {
  toggleCurtain: () => void;
  toggleSpin: () => void;
  toggleXray: () => void;
  enter: () => void;
  /** Runs the strip through the baths in `wallMs`, then leaves it in the slot. */
  develop: (sheet: HTMLCanvasElement, wallMs: number) => Promise<void>;
  /** Lifts the strip out of the slot and holds it up to look at. */
  takeStrip: () => void;
  reset: () => void;
  dispose: () => void;
};

/** Cabinet, metres. 1.95 × 1.02 stands on the published 2 m². */
const W = 1.95;
const D = 1.02;
const H = 2.16;
const T = 0.03;
const PLINTH = 0.05;
const FLOOR = 0.08;
const X0 = -W / 2;
const X1 = W / 2;
const Z0 = -D / 2;
const Z1 = D / 2;
const PART_X = -0.03;
const DOOR_X0 = 0.1;
const DOOR_X1 = 0.86;
const DOOR_TOP = 1.84;
const DOOR_MID = (DOOR_X0 + DOOR_X1) / 2;
const SIGN_Y0 = 1.88;
const SIGN_Y1 = 2.12;
/** The sitter's stool, inside the lens' fixed focus. */
const SEAT_X = PART_X + T / 2 + (BOOTH.lensDistanceM[0] + BOOTH.lensDistanceM[1]) / 2;
const SEAT_Y = 0.52;
const GLASS_Y = 1.2;

const CURTAIN_Z = Z1 - 0.075;
const CURTAIN_TOP = 1.77;
const CURTAIN_HEM = 0.7;
const CURTAIN_HALF = (DOOR_X1 - DOOR_X0) / 2 + 0.015;
const CURTAIN_BUNDLE = 0.11;
const CURTAIN_LIFT = 0.85;
const PLEATS = 9;
const CLOTH_U = 96;
const CLOTH_V = 30;
const OPEN_AT = 0.85;

/** Wet machine: one arm carries the strip round a ring of tanks and back to the slot. */
const WORKS_X = -0.5;
const WORKS_Z = -0.02;
const RING = 0.25;
const TANK_BASE = 0.47;
const TANK_H = 0.42;
const ARM_Y = 1.22;
const DUNK = 0.36;
const STEP = (Math.PI * 2) / (BOOTH.baths.length + 1);
const SLOT_X = WORKS_X;
const SLOT_Y = 1.07;
const LIQUIDS = [0xb8782a, 0xd8c860, 0x8fb4c8, 0x9fd0e0];

const HOME_TARGET = new THREE.Vector3(0, 1.08, 0);
const HOME_DIR = new THREE.Vector3(0.36, 0.17, 1).normalize();
const TAP_PX = 6;
const TAP_MS = 400;

type CurtainMode = 'left' | 'right' | 'up';
type Role = 'body' | 'door' | 'strip';

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function smooth(a: number, b: number, v: number) {
  const k = clamp01((v - a) / (b - a));
  return k * k * (3 - 2 * k);
}

function ease(k: number) {
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

export function mountBoothStage(host: HTMLElement, options: BoothStageOptions): BoothStageHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const view = renderer.domElement;
  view.style.touchAction = 'none';
  host.appendChild(view);

  const trash: Array<{ dispose: () => void }> = [];
  const keep = <T extends { dispose: () => void }>(item: T) => {
    trash.push(item);
    return item;
  };
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const texture = (canvas: HTMLCanvasElement, color: boolean, repeat?: [number, number]) => {
    const map = keep(new THREE.CanvasTexture(canvas));
    if (color) map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAniso;
    if (repeat) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(repeat[0], repeat[1]);
    }
    return map;
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x08090c, 9, 30);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const sky = new THREE.CanvasTexture(paintSky());
  sky.mapping = THREE.EquirectangularReflectionMapping;
  sky.colorSpace = THREE.SRGBColorSpace;
  const environment = pmrem.fromEquirectangular(sky);
  scene.environment = environment.texture;
  scene.environmentIntensity = 2.1;
  scene.background = sky;
  scene.backgroundBlurriness = 0.03;
  scene.backgroundIntensity = 1;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.05, 80);
  const body = new THREE.Group();
  scene.add(body);
  const picks: THREE.Object3D[] = [];

  // Materials.
  const steelPaint = paintSteel(1024);
  const steelMap = texture(steelPaint.color, true, [1, 1]);
  const steelRough = texture(steelPaint.rough, false, [1, 1]);
  const steelInit = {
    map: steelMap,
    roughnessMap: steelRough,
    bumpMap: steelMap,
    bumpScale: 0.5,
    metalness: 1,
    roughness: 1,
    anisotropy: 0.55,
    anisotropyRotation: Math.PI / 2,
    vertexColors: true,
  };
  const steel = keep(new THREE.MeshPhysicalMaterial(steelInit));
  /** The machine bay's skin: the same steel, able to turn to glass for the x-ray. */
  const skin = keep(new THREE.MeshPhysicalMaterial(steelInit));
  const chrome = keep(new THREE.MeshStandardMaterial({ color: 0xe2e5e8, metalness: 1, roughness: 0.14 }));
  const dark = keep(new THREE.MeshStandardMaterial({ color: 0x0c0d0e, metalness: 0.3, roughness: 0.6 }));
  const enamel = keep(new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.6, roughness: 0.45 }));
  const fade: THREE.Material[] = [skin];
  /** Pictures stuck on that skin; they clear with it. */
  const stuckOn: THREE.Material[] = [];

  const tint = new THREE.Color();
  /** A slab with one texture tile per metre and grime rising from the pavement. */
  function slab(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
    role: Role | null = 'body',
  ) {
    const geometry = keep(new THREE.BoxGeometry(w, h, d));
    const uv = geometry.getAttribute('uv');
    const position = geometry.getAttribute('position');
    const spans: Array<[number, number]> = [
      [d, h],
      [d, h],
      [w, d],
      [w, d],
      [w, h],
      [w, h],
    ];
    const shift = (x * 0.37 + y * 0.53 + z * 0.71) % 1;
    const colors = new Float32Array(position.count * 3);
    for (let k = 0; k < position.count; k += 1) {
      const [su, sv] = spans[Math.floor(k / 4)];
      uv.setXY(k, uv.getX(k) * su + shift, uv.getY(k) * sv + shift * 0.6);
      const lift = 0.7 + 0.3 * smooth(0, 1.1, y + position.getY(k));
      tint.setScalar(lift);
      colors[k * 3] = tint.r;
      colors[k * 3 + 1] = tint.g;
      colors[k * 3 + 2] = tint.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (role) {
      mesh.userData.role = role;
      picks.push(mesh);
    }
    body.add(mesh);
    return mesh;
  }

  function add(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = body,
  ) {
    const mesh = new THREE.Mesh(keep(geometry), material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  /** A flat picture stuck on a surface. `facing` is the outward normal. */
  function decal(
    canvas: HTMLCanvasElement,
    width: number,
    x: number,
    y: number,
    z: number,
    facing: 'front' | 'back' | 'left' | 'right',
    init: THREE.MeshStandardMaterialParameters = {},
    turn = 0,
    order = 1,
  ) {
    const material = keep(
      new THREE.MeshStandardMaterial({
        map: texture(canvas, true),
        transparent: true,
        alphaTest: 0.02,
        roughness: 0.8,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2 * order,
        polygonOffsetUnits: -2 * order,
        ...init,
      }),
    );
    const mesh = add(new THREE.PlaneGeometry(width, (width * canvas.height) / canvas.width), material, x, y, z);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = facing === 'front' ? 0 : facing === 'back' ? Math.PI : facing === 'right' ? Math.PI / 2 : -Math.PI / 2;
    mesh.rotation.z = turn;
    mesh.receiveShadow = true;
    if ((facing === 'left' && x < X0) || (facing === 'front' && x < DOOR_X0 && z > Z1)) stuckOn.push(material);
    return mesh;
  }

  // Shell.
  const wallH = H - T - PLINTH;
  const wallY = PLINTH + wallH / 2;
  const doorH = DOOR_TOP - PLINTH;
  slab(W - 0.04, PLINTH, D - 0.04, 0, PLINTH / 2, 0, dark);
  slab(DOOR_X0 - X0, doorH, T, (X0 + DOOR_X0) / 2, PLINTH + doorH / 2, Z1 - T / 2, skin);
  slab(X1 - DOOR_X1, doorH, T, (DOOR_X1 + X1) / 2, PLINTH + doorH / 2, Z1 - T / 2, steel);
  slab(W, H - T - DOOR_TOP, T, 0, (DOOR_TOP + H - T) / 2, Z1 - T / 2, steel);
  slab(DOOR_X1 - DOOR_X0, FLOOR - PLINTH, T, DOOR_MID, (PLINTH + FLOOR) / 2, Z1 - T / 2, chrome);
  slab(W, wallH, T, 0, wallY, Z0 + T / 2, steel);
  slab(T, wallH, D - T * 2, X0 + T / 2, wallY, 0, skin);
  slab(T, wallH, D - T * 2, X1 - T / 2, wallY, 0, steel);
  slab(T, wallH, D - T * 2, PART_X, wallY, 0, steel, null);
  slab(W, T, D, 0, H - T / 2, 0, steel);
  slab(W + 0.1, 0.035, D + 0.2, 0, H + 0.0175, 0.06, steel);
  for (const x of [X0 + 0.012, DOOR_X0 - 0.012, DOOR_X1 + 0.012, X1 - 0.012]) {
    slab(0.024, doorH, 0.012, x, PLINTH + doorH / 2, Z1 + 0.006, steel, null);
  }

  // Lit header.
  const signW = W - 0.06;
  slab(signW + 0.03, SIGN_Y1 - SIGN_Y0 + 0.03, 0.05, 0, (SIGN_Y0 + SIGN_Y1) / 2, Z1 + 0.025, enamel);
  const signFace = add(
    new THREE.PlaneGeometry(signW, SIGN_Y1 - SIGN_Y0),
    keep(new THREE.MeshBasicMaterial({ map: texture(paintSign(), true), color: new THREE.Color(1.06, 1, 0.9) })),
    0,
    (SIGN_Y0 + SIGN_Y1) / 2,
    Z1 + 0.0505,
  );
  signFace.userData.role = 'body';
  picks.push(signFace);

  // Display case: strips this booth printed.
  const samples = [0, 1, 2].map((roll) =>
    composeSheet([0, 1, 2, 3].map((shot) => simulationFrame((shot + roll) % 4, (roll - 1) * 0.5, 180))),
  );
  const stripRatio = samples[0].height / samples[0].width;
  const stripH = BOOTH.stripWidthM * stripRatio;
  const caseW = 0.64;
  const caseH = 0.38;
  const caseX = X0 + 0.06 + caseW / 2;
  const caseY = 1.52;
  slab(caseW + 0.04, caseH + 0.04, 0.03, caseX, caseY, Z1 + 0.015, enamel, null);
  add(
    new THREE.PlaneGeometry(caseW, caseH),
    keep(new THREE.MeshStandardMaterial({ map: texture(paintPoster(samples), true), roughness: 0.7 })),
    caseX,
    caseY,
    Z1 + 0.0305,
  );
  add(
    new THREE.PlaneGeometry(caseW, caseH),
    keep(
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.03,
        metalness: 0,
        transparent: true,
        opacity: 0.1,
        envMapIntensity: 1.6,
        specularIntensity: 0.5,
        depthWrite: false,
      }),
    ),
    caseX,
    caseY,
    Z1 + 0.036,
  );

  // Delivery slot.
  const slotH = stripH + 0.04;
  slab(0.1, slotH + 0.04, 0.016, SLOT_X, SLOT_Y, Z1 + 0.008, chrome, null);
  add(new THREE.PlaneGeometry(0.066, slotH), dark, SLOT_X, SLOT_Y, Z1 + 0.0165);
  slab(0.078, 0.022, 0.014, SLOT_X, SLOT_Y - slotH / 2 + 0.004, Z1 + 0.024, chrome, null);
  decal(paintPlate(), 0.085, SLOT_X - 0.115, SLOT_Y + 0.01, Z1 + 0.001, 'front', { roughness: 0.35 });
  add(
    new THREE.SphereGeometry(0.006, 12, 8),
    keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 2.4, 0.5) })),
    SLOT_X - 0.115,
    SLOT_Y - 0.105,
    Z1 + 0.004,
  );
  for (const y of [0.78, 1.34]) {
    slab(0.03, 0.04, 0.006, SLOT_X + 0.19, y, Z1 + 0.003, dark, null);
  }

  // Service door and louvres on the machine end.
  const seam = keep(new THREE.MeshBasicMaterial({ color: 0x08090a }));
  for (const [depth, tall, y, z] of [
    [0.006, 1.5, 1.0, -0.36],
    [0.006, 1.5, 1.0, 0.36],
    [0.726, 0.006, 1.75, 0],
    [0.726, 0.006, 0.25, 0],
  ]) {
    add(new THREE.BoxGeometry(0.004, tall, depth), seam, X0 - 0.001, y, z);
  }
  for (let i = 0; i < 7; i += 1) {
    const louvre = add(new THREE.BoxGeometry(0.012, 0.012, 0.3), enamel, X0 - 0.006, 0.5 + i * 0.03, 0);
    louvre.rotation.z = 0.5;
  }
  add(new THREE.CylinderGeometry(0.014, 0.014, 0.01, 20), chrome, X0 - 0.005, 1.0, 0.3).rotation.z = Math.PI / 2;

  // Tags and stickers.
  decal(paintGraffiti(900, 1200, 3, STREET_INKS, 22), 0.8, X0 + 0.46, 0.68, Z1 + 0.0005, 'front', { roughness: 0.6 });
  decal(paintGraffiti(1000, 1300, 17, STREET_INKS, 26), 0.86, X1 + 0.0005, 1.02, 0, 'right', { roughness: 0.6 });
  decal(paintGraffiti(1500, 1100, 29, STREET_INKS, 32), 1.6, 0, 1.05, Z0 - 0.0005, 'back', { roughness: 0.6 });
  decal(paintGraffiti(700, 1200, 43, STREET_INKS, 20), 0.62, X0 - 0.0045, 1.28, 0.05, 'left', { roughness: 0.6 });
  const stuck: Array<[StickerKind, number, number, number, number, 'front' | 'right' | 'left' | 'back']> = [
    ['berlin', X0 + 0.24, 1.16, 0.17, -0.09, 'front'],
    ['orb', SLOT_X + 0.13, 1.21, 0.07, 0.2, 'front'],
    ['name', X0 + 0.66, 0.9, 0.15, 0.06, 'front'],
    ['four', X0 + 0.2, 0.84, 0.085, 0.16, 'front'],
    ['kotti', SLOT_X - 0.1, 0.78, 0.12, -0.14, 'front'],
    ['heart', (DOOR_X1 + X1) / 2, 1.33, 0.06, 0.1, 'front'],
    ['soft', (DOOR_X1 + X1) / 2, 1.1, 0.085, 1.52, 'front'],
    ['smile', (DOOR_X1 + X1) / 2 + 0.005, 0.86, 0.07, -0.2, 'front'],
    ['four', (DOOR_X1 + X1) / 2 - 0.004, 1.52, 0.06, -0.1, 'front'],
    ['kotti', 0.18, 1.5, 0.15, 0.08, 'right'],
    ['orb', -0.2, 1.22, 0.1, -0.2, 'right'],
    ['berlin', 0.08, 0.92, 0.2, 0.05, 'right'],
    ['smile', -0.3, 0.7, 0.09, 0.3, 'right'],
    ['name', 0.3, 1.9, 0.14, -0.04, 'left'],
    ['heart', 0.36, 0.7, 0.07, 0.24, 'left'],
    ['soft', 0.5, 1.6, 0.1, -0.1, 'back'],
    ['orb', -0.55, 1.2, 0.09, 0.15, 'back'],
  ];
  const paper = new Map<StickerKind, HTMLCanvasElement>(STICKER_KINDS.map((kind) => [kind, paintSticker(kind)]));
  stuck.forEach(([kind, a, y, width, turn, facing], index) => {
    const canvas = paper.get(kind)!;
    const order = 2 + (index % 3);
    if (facing === 'front') decal(canvas, width, a, y, Z1 + 0.001, facing, {}, turn, order);
    else if (facing === 'back') decal(canvas, width, a, y, Z0 - 0.001, facing, {}, turn, order);
    else if (facing === 'right') decal(canvas, width, X1 + 0.001, y, a, facing, {}, turn, order);
    else decal(canvas, width, X0 - 0.005, y, a, facing, {}, turn, order);
  });

  // Seat bay.
  const seatW = X1 - T - (PART_X + T / 2);
  const seatMid = (X1 - T + PART_X + T / 2) / 2;
  const redWall = paintRedWall(1536);
  const red = keep(new THREE.MeshStandardMaterial({ map: texture(redWall, true), roughness: 0.62, metalness: 0 }));
  const backWall = add(new THREE.PlaneGeometry(seatW, H - T - FLOOR), red, seatMid, (FLOOR + H - T) / 2, Z0 + T + 0.001);
  backWall.receiveShadow = true;
  const endWall = add(new THREE.PlaneGeometry(D - T * 2, H - T - FLOOR), red, X1 - T - 0.001, (FLOOR + H - T) / 2, 0);
  endWall.rotation.y = -Math.PI / 2;
  endWall.receiveShadow = true;
  decal(paintGraffiti(1400, 1800, 61, CABIN_INKS, 40), seatW * 0.96, seatMid, 1.05, Z0 + T + 0.002, 'front');
  decal(paintGraffiti(1400, 1800, 67, CABIN_INKS, 28), seatW * 0.9, seatMid + 0.02, 0.82, Z0 + T + 0.003, 'front', {}, -0.04, 2);
  decal(paintGraffiti(1100, 1600, 73, CABIN_INKS, 36), 0.92, X1 - T - 0.002, 1.02, 0, 'left');
  decal(paintGraffiti(900, 1400, 79, CABIN_INKS, 22), 0.7, X1 - T - 0.003, 0.78, -0.08, 'left', {}, 0.08, 2);
  const wallX = PART_X + T / 2;
  decal(paintGraffiti(1000, 1500, 91, CABIN_INKS, 24), 0.42, wallX + 0.003, 0.72, 0.22, 'right');
  decal(paintGraffiti(800, 1100, 97, CABIN_INKS, 16), 0.32, wallX + 0.003, 1.58, -0.2, 'right', {}, 0.1, 2);
  decal(paintGraffiti(700, 900, 103, CABIN_INKS, 12), 0.28, wallX + 0.003, 0.7, -0.24, 'right', {}, -0.12, 2);
  const mat = add(
    new THREE.BoxGeometry(seatW, FLOOR - PLINTH, D - T * 2),
    keep(
      new THREE.MeshStandardMaterial({
        color: 0x1a1a1c,
        roughness: 0.75,
        bumpMap: texture(paintRubber(), false, [9, 9]),
        bumpScale: 1.4,
      }),
    ),
    seatMid,
    (PLINTH + FLOOR) / 2,
    0,
  );
  mat.receiveShadow = true;
  (
    [
      ['heart', seatMid - 0.22, 1.48, 0.08, -0.18, 'front'],
      ['kotti', seatMid + 0.2, 0.86, 0.16, 0.1, 'front'],
      ['smile', seatMid - 0.3, 0.7, 0.09, 0.22, 'front'],
      ['name', seatMid + 0.04, 1.62, 0.18, -0.05, 'front'],
      ['four', seatMid + 0.28, 1.28, 0.07, 0.28, 'front'],
      ['berlin', 0.18, 1.4, 0.2, 0.06, 'left'],
      ['orb', -0.22, 0.72, 0.08, -0.2, 'left'],
      ['soft', 0.12, 1.58, 0.16, 0.08, 'right'],
    ] as Array<[StickerKind, number, number, number, number, 'front' | 'left' | 'right']>
  ).forEach(([kind, a, y, width, turn, facing], index) => {
    const canvas = paper.get(kind)!;
    if (facing === 'front') decal(canvas, width, a, y, Z0 + T + 0.004, facing, {}, turn, 3 + (index % 2));
    else if (facing === 'left') decal(canvas, width, X1 - T - 0.004, y, a, facing, {}, turn, 3);
    else decal(canvas, width, wallX + 0.004, y, a, facing, {}, turn, 3);
  });

  // Camera wall: glass, lens, flash panels, card slot.
  const glassFrame = add(new THREE.BoxGeometry(0.012, 0.34, 0.34), enamel, wallX + 0.006, GLASS_Y, 0);
  glassFrame.receiveShadow = true;
  const window_ = add(
    new THREE.PlaneGeometry(0.3, 0.3),
    keep(new THREE.MeshPhysicalMaterial({ color: 0x0d1114, roughness: 0.04, metalness: 0, clearcoat: 1, envMapIntensity: 2 })),
    wallX + 0.0125,
    GLASS_Y,
    0,
  );
  window_.rotation.y = Math.PI / 2;
  const barrel = add(new THREE.CylinderGeometry(0.036, 0.04, 0.03, 40), dark, wallX + 0.022, GLASS_Y, 0);
  barrel.rotation.z = Math.PI / 2;
  const frontLens = add(
    new THREE.SphereGeometry(0.05, 32, 12, 0, Math.PI * 2, 0, 0.62),
    keep(
      new THREE.MeshPhysicalMaterial({
        color: 0x16102a,
        roughness: 0.03,
        clearcoat: 1,
        iridescence: 1,
        iridescenceIOR: 1.8,
        envMapIntensity: 3,
      }),
    ),
    wallX - 0.004,
    GLASS_Y,
    0,
  );
  frontLens.rotation.z = -Math.PI / 2;
  const flashGlass = keep(new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5, emissive: 0xfff2d8, emissiveIntensity: 0.5 }));
  for (const z of [-0.29, 0.29]) {
    const panel = add(new THREE.PlaneGeometry(0.14, 0.5), flashGlass, wallX + 0.002, GLASS_Y, z);
    panel.rotation.y = Math.PI / 2;
  }
  const cardSlot = add(new THREE.BoxGeometry(0.004, 0.022, 0.3), dark, wallX + 0.002, GLASS_Y - 0.31, 0);
  cardSlot.receiveShadow = true;

  // Stool: screw column, steel foot, worn seat.
  const stool = new THREE.Group();
  stool.position.set(SEAT_X, 0, -0.04);
  body.add(stool);
  const seat = add(
    new THREE.LatheGeometry(
      [
        [0, SEAT_Y],
        [0.14, SEAT_Y],
        [0.152, SEAT_Y - 0.005],
        [0.156, SEAT_Y - 0.016],
        [0.156, SEAT_Y - 0.034],
        [0.148, SEAT_Y - 0.042],
        [0, SEAT_Y - 0.042],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      48,
    ),
    keep(new THREE.MeshPhysicalMaterial({ color: 0x23201d, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.5 })),
    0,
    0,
    0,
    stool,
  );
  seat.castShadow = true;
  seat.receiveShadow = true;
  const post = add(
    new THREE.CylinderGeometry(0.026, 0.026, SEAT_Y - FLOOR - 0.042, 24),
    keep(
      new THREE.MeshStandardMaterial({
        color: 0xcfd2d5,
        metalness: 1,
        roughness: 0.3,
        bumpMap: texture(paintWeave(), false, [1, 22]),
        bumpScale: 2,
      }),
    ),
    0,
    (SEAT_Y - 0.042 + FLOOR) / 2,
    0,
    stool,
  );
  post.castShadow = true;
  add(new THREE.CylinderGeometry(0.05, 0.11, 0.03, 32), chrome, 0, FLOOR + 0.015, 0, stool);
  const seatSticker = decal(paper.get('orb')!, 0.13, 0, SEAT_Y + 0.0015, 0, 'front', {}, 0.4, 2);
  stool.add(seatSticker);
  seatSticker.rotation.set(-Math.PI / 2, 0, 0.4);

  // Ceiling lamp.
  add(
    new THREE.CylinderGeometry(0.07, 0.07, 0.012, 32),
    keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 2.1, 1.6) })),
    seatMid,
    H - T - 0.007,
    0,
  );

  // Curtain: rod, rings, one cloth sheet reshaped whenever it moves.
  const drape = new THREE.Group();
  drape.position.set(DOOR_MID, 0, CURTAIN_Z);
  body.add(drape);
  const rod = add(new THREE.CylinderGeometry(0.008, 0.008, CURTAIN_HALF * 2 + 0.06, 16), chrome, 0, CURTAIN_TOP + 0.018, 0, drape);
  rod.rotation.z = Math.PI / 2;
  const ringCount = PLEATS + 3;
  const rings = new THREE.InstancedMesh(keep(new THREE.TorusGeometry(0.0135, 0.0026, 8, 20)), chrome, ringCount);
  drape.add(rings);
  const clothMaterial = keep(
    new THREE.MeshPhysicalMaterial({
      color: 0xa01220,
      map: texture(paintVelvet(256), true, [5, 3]),
      bumpMap: texture(paintWeave(), false, [60, 60]),
      bumpScale: 0.3,
      roughness: 0.95,
      metalness: 0,
      sheen: 1,
      sheenRoughness: 0.36,
      sheenColor: new THREE.Color(0xff4a58),
      side: THREE.DoubleSide,
    }),
  );
  const clothGeometry = keep(new THREE.PlaneGeometry(1, 1, CLOTH_U, CLOTH_V));
  const cloth = new THREE.Mesh(clothGeometry, clothMaterial);
  cloth.castShadow = true;
  cloth.receiveShadow = true;
  cloth.frustumCulled = false;
  drape.add(cloth);
  const doorPick = add(
    new THREE.PlaneGeometry(DOOR_X1 - DOOR_X0, DOOR_TOP - FLOOR),
    keep(new THREE.MeshBasicMaterial({ visible: false })),
    DOOR_MID,
    (DOOR_TOP + FLOOR) / 2,
    CURTAIN_Z,
  );
  doorPick.userData.role = 'door';
  picks.push(doorPick);

  const curtain = {
    p: 0,
    v: 0,
    target: 0,
    mode: 'left' as CurtainMode,
    held: false,
    grabU: 0.5,
    nudge: 0,
    open: false,
    dirty: true,
  };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ringMatrix = new THREE.Matrix4();
  const ringTurn = new THREE.Matrix4().makeRotationY(Math.PI / 2);

  function shapeCurtain(time: number) {
    const side = curtain.mode === 'up' ? 0 : curtain.p;
    const lift = curtain.mode === 'up' ? curtain.p : 0;
    const fromRight = curtain.mode === 'right';
    const sway = reducedMotion ? 0 : 1 - curtain.p;
    const position = clothGeometry.getAttribute('position');
    const height = CURTAIN_TOP - CURTAIN_HEM;
    let k = 0;
    for (let j = 0; j <= CLOTH_V; j += 1) {
      const v = j / CLOTH_V;
      const gather = clamp01(side - side * (1 - side) * 0.55 * v);
      const width = CURTAIN_HALF * 2 * (1 - gather) + CURTAIN_BUNDLE * gather;
      const fall = 0.012 + 0.018 * Math.pow(v, 0.7);
      for (let i = 0; i <= CLOTH_U; i += 1) {
        const u = i / CLOTH_U;
        const x = fromRight ? CURTAIN_HALF - (1 - u) * width : -CURTAIN_HALF + u * width;
        // Uneven pleats: spacing and depth both wander along the rail.
        const phase = (u + 0.03 * Math.sin(u * 8.2 + 1.1) + 0.012 * Math.sin(u * 19.5 + 0.4)) * PLEATS * Math.PI * 2;
        const depth = Math.min(0.046, fall * (1 + 0.32 * Math.sin(u * 13.8 + 0.9)) * (1 + 2.6 * gather));
        // Lifted by the hem: the cloth above hangs as before, the rest stacks into a roll under the hand.
        const reach = Math.min(1, Math.abs(u - curtain.grabU) * 1.5);
        const raised = lift * (1 - 0.5 * (1 - lift) * reach);
        const hem = 1 - CURTAIN_LIFT * raised;
        const hang = Math.max(0, hem - (1 - CURTAIN_LIFT) * Math.sqrt(raised));
        const roll = v > hang ? (v - hang) / (1 - hang) : 0;
        const y = CURTAIN_TOP - height * (v > hang ? hang + roll * (hem - hang) : v);
        const z =
          depth * (Math.sin(phase) + 0.26 * Math.sin(phase * 2 + 0.7 + v * 1.4)) +
          0.007 * Math.sin(u * 7.3 + v * 3.1) +
          raised * (0.02 * Math.sin(roll * Math.PI) + 0.014 * roll * Math.sin(roll * Math.PI * 9 + u * 5)) +
          sway * v * v * (0.006 * Math.sin(time * 0.8 + u * 4.2) + curtain.nudge * 0.02 * Math.sin(time * 7 + u * 2));
        position.setXYZ(k, x + sway * v * v * 0.002 * Math.sin(time * 0.6 + 1.7), y, z);
        k += 1;
      }
    }
    position.needsUpdate = true;
    clothGeometry.computeVertexNormals();
    const width = CURTAIN_HALF * 2 * (1 - side) + CURTAIN_BUNDLE * side;
    for (let i = 0; i < ringCount; i += 1) {
      const u = (i + 0.5) / ringCount;
      const x = fromRight ? CURTAIN_HALF - (1 - u) * width : -CURTAIN_HALF + u * width;
      ringMatrix.makeTranslation(x, CURTAIN_TOP + 0.018, 0).multiply(ringTurn);
      rings.setMatrixAt(i, ringMatrix);
    }
    rings.instanceMatrix.needsUpdate = true;
  }

  // Wet machine behind the front panel.
  const works = new THREE.Group();
  works.visible = false;
  body.add(works);
  const tankGlass = keep(
    new THREE.MeshStandardMaterial({ color: 0xcfd8dc, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false }),
  );
  const bench = add(new THREE.BoxGeometry(0.74, 0.03, 0.74), enamel, WORKS_X, TANK_BASE - 0.015, WORKS_Z, works);
  bench.receiveShadow = true;
  for (const [dx, dz] of [
    [-0.33, -0.33],
    [0.33, -0.33],
    [-0.33, 0.33],
    [0.33, 0.33],
  ]) {
    add(new THREE.BoxGeometry(0.03, TANK_BASE - PLINTH - 0.03, 0.03), enamel, WORKS_X + dx, (TANK_BASE - 0.03 + PLINTH) / 2, WORKS_Z + dz, works);
  }
  BOOTH.baths.forEach((name, index) => {
    const angle = STEP * (index + 1);
    const x = WORKS_X + RING * Math.sin(angle);
    const z = WORKS_Z + RING * Math.cos(angle);
    add(new THREE.CylinderGeometry(0.075, 0.075, TANK_H, 32, 1, true), tankGlass, x, TANK_BASE + TANK_H / 2, z, works);
    add(
      new THREE.CylinderGeometry(0.071, 0.071, TANK_H - 0.04, 32),
      keep(new THREE.MeshStandardMaterial({ color: LIQUIDS[index], roughness: 0.12 })),
      x,
      TANK_BASE + (TANK_H - 0.04) / 2,
      z,
      works,
    );
    const label = new THREE.Sprite(
      keep(new THREE.SpriteMaterial({ map: texture(paintLabel(name), true), transparent: true, depthTest: false })),
    );
    label.scale.set(0.24, 0.06, 1);
    label.position.set(x, TANK_BASE + TANK_H + 0.05 + (index % 2) * 0.075, z);
    label.renderOrder = 5;
    works.add(label);
  });
  add(new THREE.CylinderGeometry(0.018, 0.018, 1.0, 20), chrome, WORKS_X, TANK_BASE + 0.5, WORKS_Z, works);
  const cameraBox = add(new THREE.BoxGeometry(0.3, 0.3, 0.3), enamel, PART_X - 0.2, GLASS_Y, 0, works);
  cameraBox.castShadow = true;
  const throat = add(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 24), dark, PART_X - 0.04, GLASS_Y, 0, works);
  throat.rotation.z = Math.PI / 2;
  /** The arm turns about the shaft and slides down it to dunk. */
  const arm = new THREE.Group();
  arm.position.set(WORKS_X, ARM_Y, WORKS_Z);
  works.add(arm);
  add(new THREE.CylinderGeometry(0.034, 0.034, 0.05, 24), chrome, 0, 0, 0, arm);
  add(new THREE.BoxGeometry(0.016, 0.012, RING), chrome, 0, 0, RING / 2, arm);
  add(new THREE.BoxGeometry(0.05, 0.02, 0.012), dark, 0, -0.012, RING, arm);
  const safelight = new THREE.PointLight(0xff7a30, 0, 2.2, 2);
  safelight.position.set(WORKS_X, 1.6, 0.1);
  works.add(safelight);

  // The strip itself: print side, paper back, and a blank face that clears in the developer.
  const strip = new THREE.Group();
  strip.visible = false;
  body.add(strip);
  const printMaterial = keep(
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0.28 }),
  );
  const blankMaterial = keep(
    new THREE.MeshStandardMaterial({ color: 0xefe9da, roughness: 0.5, transparent: true, opacity: 1, depthWrite: false }),
  );
  const printFace = add(new THREE.PlaneGeometry(BOOTH.stripWidthM, stripH), printMaterial, 0, 0, 0.0004, strip);
  printFace.userData.role = 'strip';
  const blankFace = add(new THREE.PlaneGeometry(BOOTH.stripWidthM, stripH), blankMaterial, 0, 0, 0.0008, strip);
  blankFace.renderOrder = 2;
  const paperBack = add(
    new THREE.PlaneGeometry(BOOTH.stripWidthM, stripH),
    keep(new THREE.MeshStandardMaterial({ color: 0xe9e3d4, roughness: 0.6 })),
    0,
    0,
    -0.0004,
    strip,
  );
  paperBack.rotation.y = Math.PI;
  let stripTexture: THREE.Texture | null = null;

  // Pavement.
  const setts = paintSetts(1024);
  const tiles: [number, number] = [84, 84];
  const ground = new THREE.Mesh(
    keep(new THREE.CircleGeometry(40, 64)),
    keep(
      new THREE.MeshStandardMaterial({
        map: texture(setts.color, true, tiles),
        roughnessMap: texture(setts.rough, false, tiles),
        bumpMap: texture(setts.bump, false, tiles),
        bumpScale: 1.2,
        metalness: 0,
        envMapIntensity: 0.7,
      }),
    ),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const pool = (color: THREE.ColorRepresentation, w: number, d: number, x: number, z: number, opacity: number, blend: THREE.Blending) => {
    const mesh = new THREE.Mesh(
      keep(new THREE.PlaneGeometry(w, d)),
      keep(
        new THREE.MeshBasicMaterial({
          map: texture(paintGlow(), true),
          color,
          transparent: true,
          opacity,
          blending: blend,
          depthWrite: false,
          fog: false,
        }),
      ),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.004, z);
    mesh.renderOrder = 1;
    scene.add(mesh);
    return mesh;
  };
  pool(0x000000, W + 1.5, D + 1.5, 0, 0, 0.72, THREE.NormalBlending);
  pool(0xff2a30, 1.7, 2.2, DOOR_MID, Z1 + 0.8, 0.34, THREE.AdditiveBlending);
  pool(0xffe2a8, 3.4, 2.2, 0, Z1 + 1.0, 0.2, THREE.AdditiveBlending);

  // Light: a street lamp, sodium from the far corner, the header, the cabin lamp.
  scene.add(new THREE.HemisphereLight(0x50648c, 0x0e0b09, 0.8));
  const key = new THREE.DirectionalLight(0xd4e2ff, 2.3);
  key.position.set(-2.8, 5.4, 3.8);
  key.target.position.set(0, 0.9, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.8;
  key.shadow.camera.bottom = -2.2;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 14;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 3;
  scene.add(key, key.target);
  const sodium = new THREE.DirectionalLight(0xff9a48, 1.1);
  sodium.position.set(4.2, 3.4, -3.6);
  scene.add(sodium);
  const signLight = new THREE.PointLight(0xffe6b8, 2.2, 5, 2);
  signLight.position.set(0, 1.7, Z1 + 1.0);
  scene.add(signLight);
  const cabinLight = new THREE.PointLight(0xffd0b0, 4.2, 2.8, 2);
  cabinLight.position.set(seatMid, H - 0.2, 0.05);
  scene.add(cabinLight);
  const spill = new THREE.PointLight(0xff3038, 1.4, 2.6, 2);
  spill.position.set(DOOR_MID, 0.7, Z1 + 0.35);
  scene.add(spill);

  // Composer: bloom for the lit header and the cabin lamp.
  const target = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(4, 4), 0.26, 0.5, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // Looking around.
  const state: BoothStageState = { curtain: false, spin: false, xray: false, bath: -1, clock: 0, strip: 'none' };
  let sent = '';
  /** A strip is in the machine: the booth is not to be operated. */
  const busy = () => state.bath >= 0;
  function emit() {
    const next = JSON.stringify(state);
    if (next === sent) return;
    sent = next;
    options.onState({ ...state });
  }

  let width = 0;
  let height = 0;
  let homeDistance = 8;
  const homePosition = new THREE.Vector3();
  let awakeUntil = 0;
  const wake = (ms = 900) => {
    awakeUntil = Math.max(awakeUntil, performance.now() + ms);
  };

  const controls = new OrbitControls(camera, view);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.zoomToCursor = true;
  controls.rotateSpeed = 0.7;
  controls.zoomSpeed = 1.1;
  controls.minDistance = 0.4;
  controls.minPolarAngle = Math.PI * 0.16;
  controls.maxPolarAngle = Math.PI * 0.53;
  controls.autoRotateSpeed = 3.2;
  controls.target.copy(HOME_TARGET);
  controls.addEventListener('change', () => wake(300));

  type Flight = { fromP: THREE.Vector3; fromT: THREE.Vector3; toP: THREE.Vector3; toT: THREE.Vector3; t0: number; ms: number; done?: () => void };
  let flight: Flight | null = null;
  let inside = false;
  function fly(toP: THREE.Vector3, toT: THREE.Vector3, ms: number, done?: () => void) {
    flight = { fromP: camera.position.clone(), fromT: controls.target.clone(), toP: toP.clone(), toT: toT.clone(), t0: performance.now(), ms, done };
    controls.enabled = false;
    wake(ms + 400);
  }

  /** Where to stand so a subject `across` × `tall` metres fills the frame, whatever the screen's shape. */
  function vantage(subject: THREE.Vector3, direction: THREE.Vector3, across: number, tall: number) {
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const side = Math.atan(Math.tan(half) * camera.aspect);
    const distance = Math.max(tall / 2 / Math.tan(half), across / 2 / Math.tan(side));
    return subject.clone().addScaledVector(direction.normalize(), distance);
  }

  const box = new THREE.Box3(new THREE.Vector3(X0 - 0.14, -1, Z0 - 0.14), new THREE.Vector3(X1 + 0.14, H + 0.2, Z1 + 0.14));
  const outward = new THREE.Vector3();
  /** The lens stays on the street: above the pavement and out of the cabinet walls. */
  function keepOutside() {
    const p = camera.position;
    if (p.y < 0.14) p.y = 0.14;
    if (!box.containsPoint(p)) return;
    outward.set(p.x, 0, p.z);
    if (outward.lengthSq() < 1e-6) outward.set(0, 0, 1);
    outward.normalize();
    for (let i = 0; i < 80 && box.containsPoint(p); i += 1) p.addScaledVector(outward, 0.03);
  }

  function resize() {
    width = host.clientWidth;
    height = host.clientHeight;
    if (!width || !height) return;
    const aspect = width / height;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const half = THREE.MathUtils.degToRad(camera.fov / 2);
    const across = Math.atan(Math.tan(half) * aspect);
    const next = Math.max(1.4 / Math.tan(half), 1.3 / Math.tan(across));
    const atHome = !flight && !inside && camera.position.distanceTo(homePosition) < 0.01;
    homeDistance = next;
    homePosition.copy(HOME_TARGET).addScaledVector(HOME_DIR, homeDistance);
    if (state.strip !== 'held') controls.maxDistance = homeDistance * 1.2;
    if (atHome || camera.position.lengthSq() === 0) {
      camera.position.copy(homePosition);
      controls.target.copy(HOME_TARGET);
      camera.lookAt(HOME_TARGET);
    }
    renderer.setSize(width, height, false);
    const ratio = renderer.getPixelRatio();
    composer.setPixelRatio(ratio);
    composer.setSize(width, height);
    bloom.resolution.set(width * ratio * 0.5, height * ratio * 0.5);
    wake();
  }

  // X-ray: the machine bay's skin clears.
  const xray = { value: 0, target: 0 };
  function stepXray(dt: number) {
    if (xray.value === xray.target) return false;
    const next = xray.value + Math.sign(xray.target - xray.value) * dt * 2.4;
    xray.value = xray.target > xray.value ? Math.min(xray.target, next) : Math.max(xray.target, next);
    const solid = xray.value === 0;
    for (const material of fade) {
      if (material.transparent === solid) {
        material.transparent = !solid;
        material.depthWrite = solid;
        material.needsUpdate = true;
      }
      material.opacity = 1 - 0.9 * xray.value;
    }
    for (const material of stuckOn) material.opacity = 1 - 0.92 * xray.value;
    works.visible = xray.value > 0;
    safelight.intensity = 1.3 * xray.value;
    return true;
  }
  function setXray(on: boolean) {
    xray.target = on ? 1 : 0;
    state.xray = on;
    emit();
    wake();
  }

  // Development.
  type Run = { t0: number; wallMs: number; done: () => void; phase: 'bath' | 'deliver'; t1: number };
  let run: Run | null = null;
  const slotRest = new THREE.Vector3(SLOT_X, SLOT_Y + 0.006, Z1 + 0.02);
  const from = new THREE.Vector3();

  function hangStrip(angle: number, drop: number) {
    arm.rotation.y = angle;
    arm.position.y = ARM_Y - DUNK * drop;
    strip.position.set(WORKS_X + RING * Math.sin(angle), arm.position.y - 0.022 - stripH / 2, WORKS_Z + RING * Math.cos(angle));
    strip.rotation.set(0, angle, 0);
  }

  function stepRun(now: number) {
    if (!run) return false;
    if (run.phase === 'bath') {
      const machine = clamp01((now - run.t0) / run.wallMs) * BOOTH.developS;
      const share = BOOTH.developS / BOOTH.baths.length;
      const { bath } = bathAt(machine);
      const f = machine >= BOOTH.developS ? 1 : (machine - bath * share) / share;
      const angle = STEP * (bath + ease(smooth(0, 0.16, f)));
      const drop = ease(smooth(0.16, 0.27, f)) * (1 - ease(smooth(0.84, 0.95, f)));
      hangStrip(angle, drop);
      blankMaterial.opacity = bath === 0 ? 1 - smooth(0.27, 0.8, f) : 0;
      state.bath = bath;
      state.clock = Math.floor(machine);
      if (machine >= BOOTH.developS) {
        run.phase = 'deliver';
        run.t1 = now;
        from.copy(strip.position);
      }
      emit();
      return true;
    }
    const k = clamp01((now - run.t1) / 1500);
    const turn = ease(smooth(0, 0.4, k));
    const push = ease(smooth(0.4, 1, k));
    if (k < 0.4) {
      hangStrip(STEP * (BOOTH.baths.length + turn), 0);
      from.copy(strip.position);
    } else {
      strip.position.lerpVectors(from, slotRest, push);
      strip.rotation.set(0, 0, 0);
    }
    if (k >= 1) {
      const { done } = run;
      run = null;
      state.bath = -1;
      state.strip = 'slot';
      picks.push(printFace);
      setXray(false);
      const slot = new THREE.Vector3(SLOT_X, SLOT_Y, Z1);
      fly(vantage(slot, new THREE.Vector3(0.22, 0.1, 1), 0.46, 0.52), slot, 900, done);
    }
    return true;
  }

  // Taking the strip: it leaves the slot and is held where the header lights it, free to turn and zoom.
  const HAND = new THREE.Vector3(SLOT_X + 0.04, 1.34, Z1 + 0.7);
  let lift: { t0: number; from: THREE.Vector3 } | null = null;
  function looseLimits(held: boolean) {
    controls.minDistance = held ? 0.1 : 0.4;
    controls.maxDistance = held ? 0.9 : homeDistance * 1.2;
    controls.minPolarAngle = Math.PI * (held ? 0.2 : 0.16);
    controls.maxPolarAngle = Math.PI * (held ? 0.8 : 0.53);
  }
  function takeStrip() {
    if (state.strip !== 'slot' || flight) return;
    state.strip = 'held';
    emit();
    lift = { t0: performance.now(), from: strip.position.clone() };
    looseLimits(true);
    fly(vantage(HAND, new THREE.Vector3(0.12, 0.04, 1), 0.07, stripH * 1.5), HAND, 800);
  }
  function stepLift(now: number) {
    if (!lift) return false;
    const k = ease(clamp01((now - lift.t0) / 800));
    strip.position.lerpVectors(lift.from, HAND, k);
    strip.rotation.set(-0.08 * k, 0, 0.03 * k);
    if (k >= 1) lift = null;
    return true;
  }

  function clearStrip() {
    run = null;
    lift = null;
    looseLimits(false);
    strip.visible = false;
    state.bath = -1;
    state.clock = 0;
    state.strip = 'none';
    const at = picks.indexOf(printFace);
    if (at >= 0) picks.splice(at, 1);
    if (stripTexture) {
      stripTexture.dispose();
      stripTexture = null;
      printMaterial.map = null;
      printMaterial.emissiveMap = null;
      printMaterial.needsUpdate = true;
    }
  }

  // Pointer: the curtain takes drags that start on it; a still press is a tap; the rest looks around.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const probe = new THREE.Vector3();
  type Press = { id: number; x: number; y: number; t: number; role: Role | null; cloth: boolean; from: number; span: number; drop: number; moved: boolean };
  let press: Press | null = null;

  function hit(clientX: number, clientY: number) {
    const rect = view.getBoundingClientRect();
    pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, 1 - ((clientY - rect.top) / rect.height) * 2);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(picks, false)[0] ?? null;
  }

  function screenSpan(ax: number, ay: number, bx: number, by: number, z: number) {
    probe.set(ax, ay, z).project(camera);
    const x = probe.x;
    const y = probe.y;
    probe.set(bx, by, z).project(camera);
    return Math.hypot(((probe.x - x) * width) / 2, ((probe.y - y) * height) / 2);
  }

  /** Whether a point in the doorway lands on cloth: all of it when shut, only the gathered bundle when open. */
  function onCloth(point: THREE.Vector3) {
    const u = (point.x - DOOR_X0) / (DOOR_X1 - DOOR_X0);
    if (!curtain.open) return point.y > CURTAIN_HEM - 0.05 || curtain.p < 0.02;
    if (curtain.mode === 'up') return point.y > CURTAIN_TOP - 0.24;
    return curtain.mode === 'left' ? u < 0.22 : u > 0.78;
  }

  function onDown(event: PointerEvent) {
    if (event.button !== 0 || press || flight || inside) return;
    const first = hit(event.clientX, event.clientY);
    const role = (first?.object.userData.role as Role | undefined) ?? null;
    const clothGrab = role === 'door' && !!first && onCloth(first.point) && !busy();
    press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      t: performance.now(),
      role,
      cloth: clothGrab,
      from: curtain.p,
      span: Math.max(40, screenSpan(DOOR_X0, 1.2, DOOR_X1, 1.2, CURTAIN_Z)),
      drop: Math.max(40, screenSpan(DOOR_MID, CURTAIN_HEM, DOOR_MID, CURTAIN_TOP, CURTAIN_Z)),
      moved: false,
    };
    if (clothGrab && first) {
      controls.enabled = false;
      if (curtain.p < 0.02) curtain.grabU = clamp01((first.point.x - DOOR_X0) / (DOOR_X1 - DOOR_X0));
      curtain.held = true;
      curtain.v = 0;
      wake();
    }
  }

  function onMove(event: PointerEvent) {
    const grab = press;
    if (!grab || event.pointerId !== grab.id) return;
    const dx = event.clientX - grab.x;
    const dy = event.clientY - grab.y;
    if (!grab.moved) {
      if (Math.hypot(dx, dy) < TAP_PX) return;
      if (grab.cloth && grab.from < 0.02) {
        if (Math.abs(dx) >= Math.abs(dy)) curtain.mode = dx < 0 ? 'left' : 'right';
        else if (dy < 0) curtain.mode = 'up';
        else return;
      }
      grab.moved = true;
    }
    if (!grab.cloth) return;
    const pull = curtain.mode === 'up' ? -dy / (grab.drop * 0.8) : (curtain.mode === 'left' ? -dx : dx) / (grab.span * 0.85);
    curtain.p = clamp01(grab.from + pull);
    curtain.dirty = true;
    wake();
  }

  function setCurtainTarget(open: boolean) {
    if (curtain.p < 0.02 && open && !curtain.held) curtain.mode = 'left';
    curtain.target = open ? 1 : 0;
    wake(1600);
  }

  function tap(role: Role | null) {
    if (role === 'strip') takeStrip();
    else if (state.strip !== 'none') return;
    else if (role === 'door' && !busy()) {
      if (curtain.open) enter();
      else setCurtainTarget(true);
    } else if (!busy()) toggleSpin();
  }

  function onUp(event: PointerEvent) {
    const grab = press;
    if (!grab || event.pointerId !== grab.id) return;
    press = null;
    if (grab.cloth) {
      curtain.held = false;
      controls.enabled = !flight && !inside;
      if (grab.moved) setCurtainTarget(curtain.p > (grab.from > 0.5 ? 0.6 : 0.3));
      else if (event.type === 'pointerup') setCurtainTarget(curtain.target !== 1);
      return;
    }
    if (event.type === 'pointerup' && !grab.moved && performance.now() - grab.t < TAP_MS) tap(grab.role);
  }

  function stepCurtain(dt: number, time: number) {
    let moving = curtain.held || curtain.dirty;
    if (!curtain.held && (curtain.p !== curtain.target || curtain.v !== 0)) {
      const stiffness = 9;
      curtain.v += (-2 * stiffness * curtain.v - stiffness * stiffness * (curtain.p - curtain.target)) * dt;
      curtain.p = clamp01(curtain.p + curtain.v * dt);
      if (Math.abs(curtain.p - curtain.target) < 0.001 && Math.abs(curtain.v) < 0.02) {
        curtain.p = curtain.target;
        curtain.v = 0;
      }
      moving = true;
    }
    if (curtain.nudge > 0.001) {
      curtain.nudge *= Math.exp(-dt * 2.4);
      moving = true;
    }
    const swaying = !reducedMotion && curtain.p < 1 && state.spin;
    if (moving || swaying) shapeCurtain(time);
    curtain.dirty = false;
    const open = !curtain.held && curtain.target === 1 && curtain.p > OPEN_AT;
    if (open !== curtain.open) {
      curtain.open = open;
      state.curtain = open;
      emit();
    }
    return moving || swaying;
  }

  function toggleSpin() {
    if (flight || inside || busy() || state.strip !== 'none') return;
    state.spin = !state.spin;
    controls.autoRotate = state.spin;
    emit();
    wake();
  }

  function stopSpin() {
    state.spin = false;
    controls.autoRotate = false;
  }

  function enter() {
    if (flight || inside || busy()) return;
    stopSpin();
    setCurtainTarget(true);
    inside = true;
    emit();
    const wait = curtain.open ? 0 : 520;
    window.setTimeout(() => {
      const door = new THREE.Vector3(DOOR_MID, 1.02, Z1);
      fly(vantage(door, new THREE.Vector3(0, 0.06, 1), 1.0, 2.1), door, 650, () => {
        fly(new THREE.Vector3(DOOR_MID + 0.02, 1.16, Z1 - 0.12), new THREE.Vector3(PART_X, GLASS_Y - 0.06, -0.05), 620, () => {
          options.onEntered();
        });
      });
    }, wait);
  }

  const listen: Array<[string, (event: PointerEvent) => void]> = [
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onUp],
  ];
  // Capture phase, so the curtain can claim a press before the orbit controls see it.
  listen.forEach(([type, handler]) => view.addEventListener(type, handler as EventListener, true));

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  shapeCurtain(0);
  emit();

  /** Slow GPUs and software renderers get the plain pass at 1× instead of a stalled stage. */
  let lite = false;
  let slow = 0;
  function pace(gap: number) {
    if (lite || gap > 1000) return;
    slow = gap > 55 ? slow + 1 : 0;
    if (slow < 6) return;
    lite = true;
    renderer.setPixelRatio(1);
    resize();
  }

  let frame = 0;
  let last = performance.now();
  let drew = false;
  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const gap = now - last;
    const dt = Math.min(gap / 1000, 0.05);
    last = now;
    if (!width || !height) return;
    if (drew) pace(gap);
    let moving = false;
    if (flight) {
      const k = clamp01((now - flight.t0) / flight.ms);
      const e = ease(k);
      camera.position.lerpVectors(flight.fromP, flight.toP, e);
      controls.target.lerpVectors(flight.fromT, flight.toT, e);
      camera.lookAt(controls.target);
      moving = true;
      if (k >= 1) {
        const { done } = flight;
        flight = null;
        controls.enabled = !inside;
        done?.();
      }
    } else if (!inside) {
      if (state.strip !== 'held' && camera.position.distanceTo(controls.target) > homeDistance * 0.72) {
        controls.target.lerp(HOME_TARGET, 1 - Math.exp(-dt * 3));
      }
      moving = controls.update(dt) || moving;
      keepOutside();
    }
    moving = stepCurtain(dt, now / 1000) || moving;
    moving = stepXray(dt) || moving;
    moving = stepRun(now) || moving;
    moving = stepLift(now) || moving;
    drew = moving || now < awakeUntil;
    if (!drew) return;
    if (lite) renderer.render(scene, camera);
    else composer.render(dt);
  };
  frame = requestAnimationFrame(tick);

  return {
    toggleCurtain() {
      if (busy() || inside) return;
      setCurtainTarget(curtain.target !== 1);
    },
    toggleSpin,
    toggleXray() {
      if (busy()) return;
      setXray(!state.xray);
    },
    enter,
    develop(sheet, wallMs) {
      clearStrip();
      stopSpin();
      inside = false;
      stripTexture = new THREE.CanvasTexture(sheet);
      stripTexture.colorSpace = THREE.SRGBColorSpace;
      stripTexture.anisotropy = maxAniso;
      printMaterial.map = stripTexture;
      printMaterial.emissiveMap = stripTexture;
      printMaterial.needsUpdate = true;
      blankMaterial.opacity = 1;
      strip.visible = true;
      hangStrip(0, 0);
      state.bath = 0;
      setCurtainTarget(false);
      setXray(true);
      camera.position.copy(homePosition);
      controls.target.copy(HOME_TARGET);
      return new Promise<void>((resolve) => {
        const ring = new THREE.Vector3(WORKS_X + 0.02, 0.93, 0.1);
        fly(vantage(ring, new THREE.Vector3(-0.2, 0.42, 1), 0.84, 1.05), ring, 800, () => {
          run = { t0: performance.now(), wallMs, done: resolve, phase: 'bath', t1: 0 };
        });
      });
    },
    takeStrip,
    reset() {
      clearStrip();
      stopSpin();
      inside = false;
      flight = null;
      controls.enabled = true;
      curtain.p = 0;
      curtain.v = 0;
      curtain.target = 0;
      curtain.dirty = true;
      xray.target = 0;
      state.xray = false;
      camera.position.copy(homePosition);
      controls.target.copy(HOME_TARGET);
      camera.lookAt(HOME_TARGET);
      emit();
      wake();
    },
    dispose() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      listen.forEach(([type, handler]) => view.removeEventListener(type, handler as EventListener, true));
      controls.dispose();
      clearStrip();
      trash.forEach((item) => item.dispose());
      rings.dispose();
      composer.dispose();
      target.dispose();
      environment.dispose();
      sky.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      view.remove();
    },
  };
}
