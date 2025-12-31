"use client";
import React, { useState } from 'react';
import AgentCard from '../../components/ai-agents/AgentCard';


const categories = [
  'All',
  'CONTENT AGENTS',
  'KEYWORD INTELLIGENCE AGENTS',
  'TECH SEO & SITE HEALTH AGENTS',
];

export default function AiAgentsClient({ agents }: { agents: any[] }) {
  const [category, setCategory] = useState(categories[0]);
  const filtered = category === 'All'
    ? agents
    : agents.filter((a) => a.category === category);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Agents</h1>
        <select
          className="border rounded px-3 py-2"
          value={category}
          onChange={e => setCategory(e.target.value)}
        >
          {categories.map(cat => (
            <option key={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}