'use client';

import { useEffect, useRef } from 'react';
import type { ChipId, TrayKind } from '../../lib/ai-factory/chips';
import type { PowerPath } from '../../lib/ai-factory/plant';
import { mountPlantScene, type CameraMode, type PlantSceneHandle } from '../../lib/ai-factory/plant-scene';
import type { InspectId, RackFace } from '../../lib/ai-factory/rack-inspectors';
import type { RackFactSheet } from '../../lib/ai-factory/rack-facts';
import type { PlantSim } from '../../lib/ai-factory/simulate';

export default function PlantViewport({
  model,
  fact,
  face,
  inspectId,
  powerPath,
  cameraMode,
  openKind,
  openChip,
  openTrayIndex,
  onFocusRack,
  onInspect,
  onOpenTray,
  onChip,
  onScale,
  filmPlaying,
  onUserControl,
}: {
  model: PlantSim;
  fact: RackFactSheet;
  face: RackFace;
  inspectId: InspectId;
  powerPath: PowerPath;
  cameraMode: CameraMode;
  openKind: TrayKind;
  openChip: ChipId;
  openTrayIndex: number;
  filmPlaying: boolean;
  onFocusRack: (id: number) => void;
  onInspect: (id: InspectId, face?: RackFace) => void;
  onOpenTray: (kind: TrayKind, index: number) => void;
  onChip: (id: ChipId) => void;
  onScale: (mode: CameraMode) => void;
  onUserControl: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PlantSceneHandle | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = mountPlantScene(
      host,
      (hit) => {
        if (hit.kind === 'world' && (hit.id === 'campus' || hit.id === 'hall')) onScale(hit.id);
        else if (hit.kind === 'cabinet') onScale('rack');
        else if (hit.kind === 'hall') onFocusRack(Number(hit.id));
        else if (hit.kind === 'chip') onChip(hit.id as ChipId);
        else if (hit.kind === 'tray' && (hit.trayKind === 'compute' || hit.trayKind === 'switch')) {
          onOpenTray(hit.trayKind, hit.trayIndex ?? 0);
        } else onInspect(hit.id as InspectId, hit.face);
      },
      onUserControl,
    );
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onChip, onFocusRack, onInspect, onOpenTray, onScale, onUserControl]);

  useEffect(() => {
    sceneRef.current?.update({
      model,
      fact,
      face,
      inspectId,
      powerPath,
      cameraMode,
      openKind,
      openChip,
      openTrayIndex,
      filmPlaying,
    });
  }, [cameraMode, face, fact, filmPlaying, inspectId, model, openChip, openKind, openTrayIndex, powerPath]);

  return <div className="ai-factory-viewport" data-testid="ai-factory-viewport" ref={hostRef} />;
}
