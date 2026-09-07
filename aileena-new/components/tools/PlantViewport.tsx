'use client';

import { useEffect, useRef } from 'react';
import type { PowerPath } from '../../lib/ai-factory/plant';
import { mountPlantScene, type PlantSceneHandle } from '../../lib/ai-factory/plant-scene';
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
  onFocusRack,
  onInspect,
}: {
  model: PlantSim;
  fact: RackFactSheet;
  face: RackFace;
  inspectId: InspectId;
  powerPath: PowerPath;
  cameraMode: 'hall' | 'rack';
  onFocusRack: (id: number) => void;
  onInspect: (id: InspectId, face?: RackFace) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<PlantSceneHandle | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = mountPlantScene(host, (hit) => {
      if (hit.kind === 'hall') onFocusRack(Number(hit.id));
      else onInspect(hit.id as InspectId, hit.face);
    });
    sceneRef.current = scene;
    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [onFocusRack, onInspect]);

  useEffect(() => {
    sceneRef.current?.update({ model, fact, face, inspectId, powerPath, cameraMode });
  }, [cameraMode, face, fact, inspectId, model, powerPath]);

  return <div className="ai-factory-viewport" data-testid="ai-factory-viewport" ref={hostRef} />;
}
