// No React client imports in server component
import { getAgents } from '../../../lib/ai-agents';
import PromptAndSegmentWrapper from './PromptAndSegmentWrapper';
import DetailsButton from './DetailsButton';


export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const agents = await getAgents();
  const agent = agents.find((a: any) => String(a.id) === params.id);
  if (!agent) return <div className="p-8">Agent not found.</div>;

  return (
    <div className="w-full px-0">
      <div className="flex items-center mb-6 gap-6">
        <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full">
          {agent.icon ? (
            <span
              className="w-full h-full flex items-center justify-center"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              dangerouslySetInnerHTML={{ __html: agent.icon }}
              aria-label={agent.title}
            />
          ) : (
            <span className="text-3xl">🤖</span>
          )}
        </div>
        <div className="flex items-center gap-2 relative">
          <h1 className="text-2xl font-bold text-gray-900">{agent.title}</h1>
          <DetailsButton agent={agent} />
        </div>
      </div>
      <div className="mb-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">{agent.category}</div>
      

      {/* Prompt and Segment selection for agent 1 */}
      {String(agent.id) === '1' && (
        <div className="my-8">
          <PromptAndSegmentWrapper />
        </div>
      )}

      {/* <button className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 text-white font-bold rounded-xl shadow-lg hover:from-blue-700 hover:to-cyan-500 transition-all text-lg flex items-center gap-2">
        <span className="inline-block align-middle">🚀</span> Run Agent
      </button> */}
    </div>
  );
}
