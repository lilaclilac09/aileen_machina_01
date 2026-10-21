import AgentGatewayUse from '../../../../components/tools/AgentGatewayUse';
import type { Metadata } from 'next';
import { t } from '../../../../lib/translations';

export const metadata: Metadata = {
  title: `Agent-Gateway · ${t.EN.tools.agentGatewayUse.heading}`,
  description: t.EN.tools.agentGatewayUse.body,
};

export default function AgentGatewayUsePage() {
  return <AgentGatewayUse />;
}
