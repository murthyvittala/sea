// components/ai-agents/AgentCard.tsx
import React from 'react';
import Link from 'next/link';

interface Agent {
  id?: number;
  title?: string;
  purpose?: string;
  description?: string;
  advantages?: string;
  icon?: string;
}

type AgentCardProps = {
  agent: Agent;
};

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <div
      className="relative border border-slate-200 rounded-2xl shadow-md p-6 pt-8 flex flex-col items-center transition-transform hover:scale-[1.025] hover:shadow-xl duration-200 overflow-hidden w-auto min-h-[370px]"
      style={{ background: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)' }}
    >
      {/* Subtle pattern overlay for agentic look */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-10" style={{background: 'radial-gradient(circle at 30% 20%, #6366f1 0%, transparent 60%), radial-gradient(circle at 70% 80%, #06b6d4 0%, transparent 60%)'}} />
      <div className="w-24 h-24 flex items-center justify-center bg-gray-100 rounded-full mb-4">
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
      <h3 className="text-xl font-bold text-center">{agent.title}</h3>
      <p className="text-sm text-gray-600 mt-2 text-center">{agent.purpose}</p>
      <p className="text-gray-700 mt-2 text-center">{agent.description}</p>
      <Link href={`/ai-agents/${agent.id}`} passHref legacyBehavior>
        <a className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold shadow-md transition-all">
          View Agent
        </a>
      </Link>
    </div>
  );
}