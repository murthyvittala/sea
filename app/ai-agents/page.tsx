// app/ai-agents/page.tsx
import { getAgents } from '../../lib/ai-agents';
import AiAgentsClient from './AiAgentsClient';

export default async function AiAgentsPage() {
  const agents = await getAgents();
  return <AiAgentsClient agents={agents || []} />;
}