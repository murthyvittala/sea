"use client";
import React, { useState } from 'react';

const options = [
  { label: 'Last 1 week', value: 7 },
  { label: 'Last 15 days', value: 15 },
  { label: 'Last 1 Month', value: 30 },
  { label: 'Last 45 days', value: 45 },
];

export default function ContentDecay() {
  const [selected, setSelected] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleRunAgent = () => {
    setLoading(true);
    // TODO: Add agent logic here
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <>
      <div className="w-full font-bold pb-[30px]">
        Choose a timeframe for your content decay analysis. A 1-month selection will compare the most recent 30 days of data to the preceding 30-day period.
      </div>
      <div className="flex flex-col gap-6 max-w-md">
        <select
          id="date-range"
          className="w-full border border-slate-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={selected}
          onChange={e => setSelected(Number(e.target.value))}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          className={`mt-4 px-6 py-2 font-bold rounded-lg shadow transition-colors duration-200
            bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400
            text-white border-2 border-transparent
            hover:from-purple-700 hover:via-blue-600 hover:to-cyan-500
            hover:border-blue-300
            disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
          disabled={loading}
          onClick={handleRunAgent}
        >
          <span className="inline-flex items-center gap-2 text-white">
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                borderRadius: '50%',
                width: 32,
                height: 32,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" fill="#6366F1" />
                <rect x="6" y="14" width="12" height="6" rx="3" fill="#06b6d4" />
                <rect x="10" y="16" width="4" height="2" rx="1" fill="#fff" />
              </svg>
            </span>
            {loading ? 'Running...' : 'Run Agent'}
          </span>
        </button>
      </div>
    </>
  );
}
