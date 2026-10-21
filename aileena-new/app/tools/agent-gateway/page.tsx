import AgentGatewayTool from '../../../components/tools/AgentGatewayTool';
import { toolMetadata } from '../../../lib/seo';

export const metadata = toolMetadata('agent-gateway');

export default function AgentGatewayPage() {
  return <AgentGatewayTool />;
}
