import PhotoAutomatBooth from '../../../components/tools/PhotoAutomatBooth';
import { toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('photo-automat');

export default function PhotoAutomatPage() {
  // html/body are overflow:hidden site-wide; this page owns a fixed booth.
  return (
    <div
      data-testid="photo-automat-page"
      style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#070605' }}
    >
      <PhotoAutomatBooth />
    </div>
  );
}
