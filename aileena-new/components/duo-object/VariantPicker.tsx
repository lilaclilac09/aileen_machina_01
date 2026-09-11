'use client';

import {
  DUO_LIGHTS,
  DUO_SKINS,
  DUO_TRACKS,
  type DuoLight,
  type DuoSkin,
} from '../../lib/duoObject';

type Props = {
  skin: DuoSkin;
  light: DuoLight;
  trackId: string;
  onSkin: (id: DuoSkin) => void;
  onLight: (id: DuoLight) => void;
  onTrack: (id: string) => void;
};

/** Five rooms, four lights, four records — pick, do not stack pages. */
export default function VariantPicker({
  skin,
  light,
  trackId,
  onSkin,
  onLight,
  onTrack,
}: Props) {
  return (
    <div className="duo-cluster" data-variants="">
      {DUO_SKINS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="duo-k"
          data-on={item.id === skin}
          title={item.intent}
          onClick={() => onSkin(item.id)}
        >
          {item.label}
        </button>
      ))}
      <span aria-hidden style={{ opacity: 0.2 }}>
        ·
      </span>
      {DUO_LIGHTS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="duo-k"
          data-on={item.id === light}
          title={item.intent}
          onClick={() => onLight(item.id)}
        >
          {item.label}
        </button>
      ))}
      <span aria-hidden style={{ opacity: 0.2 }}>
        ·
      </span>
      {DUO_TRACKS.map((item) => (
        <button
          key={item.id}
          type="button"
          className="duo-k"
          data-on={item.id === trackId}
          onClick={() => onTrack(item.id)}
        >
          {item.title.toLowerCase()}
        </button>
      ))}
    </div>
  );
}
