import ToolsArcadePage from '../../components/tools/ToolsArcadePage';
import type { Metadata } from 'next';
import { t } from '../../lib/translations';

export const metadata: Metadata = { title: 'Tools', description: t.EN.tools.body };

export default function ToolsPage() {
  return <ToolsArcadePage />;
}
