import { chipLiveKw, powerShareSum, trayKit, TRAY_KITS } from '../lib/ai-factory/chips';
import type { RackVariant } from '../lib/ai-factory/rack-facts';
import { simulatePlant } from '../lib/ai-factory/simulate';
import { hallPose, usesSidecar, usesWhips } from '../lib/ai-factory/viewport';
import { CAMERA_MODES, FAB_LINE, FILM_WAYPOINTS, SITE, SCALE_FACTS, filmCam, filmCuts, filmHoldMs, latLonToUnit, nextFilmWaypoint, scaleAim } from '../lib/ai-factory/world';

const gapsOff = { coolingAc: false, gridDelay: false, schedulerTail: false, modularClaims: false };

function assert(name: string, ok: boolean, detail = '') {
  if (!ok) throw new Error(`FAIL ${name} ${detail}`);
  console.log(`PASS ${name}${detail ? ` ${detail}` : ''}`);
}

const gb300 = simulatePlant({
  variant: 'GB300 NVL72',
  powerPath: 'legacy-ac',
  rackCount: 40,
  aiLoad: 92,
  cooling: 60,
  ambient: 30,
  gaps: gapsOff,
  focusRack: 0,
});

assert('gb300 has 18 compute cells', gb300.computeCells.length === 18);
assert('gb300 has 9 switch cells', gb300.switchCells.length === 9);
assert('gb300 has 8 shelves', gb300.shelfCells.length === 8);
assert(
  'gb300 busbar tension: required A exceeds published 1400A',
  gb300.requiredA > 1400,
  `${gb300.requiredA.toFixed(0)}A vs 1400A at ${gb300.itKwPerRack.toFixed(1)} kW`,
);
assert('gb300 residual is counted', gb300.residualKw > 0.5, `${gb300.residualKw.toFixed(2)} kW`);

const cool = simulatePlant({
  variant: 'GB300 NVL72',
  powerPath: 'legacy-ac',
  rackCount: 40,
  aiLoad: 92,
  cooling: 92,
  ambient: 24,
  gaps: gapsOff,
  focusRack: 0,
});
assert('more cooling lowers return temp', cool.returnC < gb300.returnC, `${cool.returnC.toFixed(1)} < ${gb300.returnC.toFixed(1)}`);

const aisle = simulatePlant({
  variant: 'GB300 NVL72',
  powerPath: 'legacy-ac',
  rackCount: 40,
  aiLoad: 92,
  cooling: 60,
  ambient: 30,
  gaps: gapsOff,
  focusRack: 3,
});
assert(
  'hot-aisle focus raises compute kW vs edge-cold rack 0',
  aisle.computeCells[0].kw > gb300.computeCells[0].kw,
  `${aisle.computeCells[0].kw.toFixed(2)} > ${gb300.computeCells[0].kw.toFixed(2)}`,
);
assert('hall focus marks rack 3', aisle.hall[3].focused && aisle.hall[3].aisle === 'hot');

const vr = simulatePlant({
  variant: 'VR NVL72',
  powerPath: '800v-sidecar',
  rackCount: 44,
  aiLoad: 90,
  cooling: 54,
  ambient: 34,
  gaps: { coolingAc: true, gridDelay: true, schedulerTail: true, modularClaims: true },
  focusRack: 3,
});
assert('vr has 4 shelves', vr.shelfCells.length === 4);
assert('vr compute hotter than nameplate share when tail pins', vr.computeCells.some((cell) => cell.kw > vr.computeCells[1].kw));
assert('vr live metrics exist', vr.live.length >= 6 && vr.coolingLive.length >= 6);
assert('vr conversion lower than legacy-ac', vr.conversionKwPerRack < aisle.conversionKwPerRack * 0.7);

const gb200 = simulatePlant({
  variant: 'GB200 NVL72',
  powerPath: 'legacy-ac',
  rackCount: 32,
  aiLoad: 70,
  cooling: 70,
  ambient: 26,
  gaps: gapsOff,
  focusRack: 1,
});
assert('gb200 published busbar is 2900A', gb200.publishedA === 2900);

const origin = hallPose(0);
const hot = hallPose(3);
assert('hall poses are unique', origin.x !== hot.x && origin.z === hot.z);
assert('sidecar only on 800V path', usesSidecar('800v-sidecar') && !usesSidecar('legacy-ac'));
assert('legacy still has whips', usesWhips('legacy-ac') && !usesWhips('facility-hvdc'));

const gb300Kit = trayKit('GB300 NVL72', 'compute');
const gpu = gb300Kit.parts.find((part) => part.id === 'gpu');
const cpu = gb300Kit.parts.find((part) => part.id === 'cpu');
assert('gb300 compute has 4 GPUs', gpu?.count === 4);
assert('gb300 compute has 2 CPUs', cpu?.count === 2);
assert('gb300 compute shares sum to 1', Math.abs(powerShareSum(gb300Kit) - 1) < 0.001, `${powerShareSum(gb300Kit)}`);
assert(
  'chip live kW scales with tray',
  Boolean(gpu) && Math.abs(chipLiveKw(gb300.computeCells[0].kw, gpu!) - gb300.computeCells[0].kw * gpu!.shareOfTrayKw) < 1e-9,
);

(Object.keys(TRAY_KITS) as RackVariant[]).forEach((variant) => {
  (['compute', 'switch'] as const).forEach((kind) => {
    const kit = trayKit(variant, kind);
    assert(
      `${variant} ${kind} shares ~1`,
      Math.abs(powerShareSum(kit) - 1) < 0.001,
      `${powerShareSum(kit)}`,
    );
  });
});

assert('seven camera scales', CAMERA_MODES.length === 7);
assert('film waypoints match the scale ladder', FILM_WAYPOINTS.join(',') === CAMERA_MODES.join(','));
assert('film loops die to globe', nextFilmWaypoint('open') === 'satellite');
assert('film steps campus to wafer line', nextFilmWaypoint('campus') === 'wafer');
assert('open to satellite is a cut', filmCuts('open', 'satellite'));
assert('campus to hall is a cut', filmCuts('campus', 'hall'));
assert('wafer to hall is a cut', filmCuts('wafer', 'hall'));
assert('rack to satellite is a cut', filmCuts('rack', 'satellite'));
assert('campus to wafer dollies', !filmCuts('campus', 'wafer'));
assert('campus to satellite dollies', !filmCuts('campus', 'satellite'));
assert('satellite to campus dollies', !filmCuts('satellite', 'campus'));
assert('hall to cabinet dollies', !filmCuts('hall', 'cabinet'));
assert('film holds are cinematic', filmHoldMs('satellite') >= 3000 && filmHoldMs('open') >= 3000);
assert('wafer line is assumption', SCALE_FACTS.wafer.level === 'assumption');
assert('fab line has four stations', FAB_LINE.stations.length === 4);
assert('pack bay exits to hall', FAB_LINE.stations.find((station) => station.id === 'pack')?.click === 'hall');
assert('metro stays on wafer', FAB_LINE.stations.find((station) => station.id === 'metro')?.click === 'wafer');
assert('300mm FOUP aisle is assumption', FAB_LINE.waferMm === 300 && FAB_LINE.foupCount === 7 && FAB_LINE.level === 'assumption');
const orbit = filmCam('satellite', origin, 0);
assert('film satellite orbit stays outside the globe', orbit.cam.length() > 5);
assert('satellite site is assumption', SITE.level === 'assumption');
assert('satellite fact is assumption', SCALE_FACTS.satellite.level === 'assumption');
assert('rack fact stays source-backed', SCALE_FACTS.rack.level === 'source-backed');
const north = latLonToUnit(90, 0);
assert('north pole is +Y', north.y > 0.99);
const campusAim = scaleAim('campus', hallPose(0));
const cabinetAim = scaleAim('cabinet', hallPose(0));
const rackAim = scaleAim('rack', hallPose(0));
assert('campus camera is farther than cabinet', campusAim.cam.length() > cabinetAim.cam.length());
assert('rack camera is 3/4, not dead-front', Math.abs(rackAim.cam.x - origin.x) > 0.3);
assert('rack camera is closer than 2m', rackAim.cam.distanceTo(rackAim.target) < 2);

console.log('ai-factory plant kernel ok');
