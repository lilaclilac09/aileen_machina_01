import ChipGuessTool from '../../../components/tools/ChipGuessTool';
import { NOINDEX, toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('chip-guess', { robots: NOINDEX });

export default function ChipGuessPage() {
  return <ChipGuessTool />;
}
