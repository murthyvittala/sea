'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Segment {
  id: number;
  name: string;
  pattern: string;
}


export default function PromptAndSegment() {
  const [userId, setUserId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [outputRows, setOutputRows] = useState<any[]>([]);
  const [outputRaw, setOutputRaw] = useState<string>('');
  const [streaming, setStreaming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [payloadPreview, setPayloadPreview] = useState<any>(null);
  // Step-by-step output state for steps (move to top-level)
  const [stepOutputs, setStepOutputs] = useState<any[]>([]);
  // Validation state
  const [keywordError, setKeywordError] = useState<string | null>(null);

  // Get current user_id from session
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session?.user?.id) setUserId(session.user.id);
    }
    fetchUser();
  }, [supabase]);

  // Fetch segments for user
  useEffect(() => {
    if (!userId) return;
    setLoadingSegments(true);
    supabase
      .from('segments')
      .select('id, name, pattern')
      .eq('user_id', userId)
      .then(({ data }) => {
        setSegments(data || []);
        setLoadingSegments(false);
      });
  }, [userId, supabase]);

  // Fetch queries when segment changes
  useEffect(() => {
    if (!userId || !selectedPattern) return;
    setLoadingQueries(true);
    supabase
      .from('gsc_data')
      .select('query, impressions')
      .eq('user_id', userId)
      .like('page', `%${selectedPattern}%`)
      .order('impressions', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!data) return;
        const uniqueQueries: string[] = [];
        for (const row of data) {
          if (row.query && !uniqueQueries.includes(row.query)) {
            uniqueQueries.push(row.query);
            if (uniqueQueries.length >= 20) break;
          }
        }
        setPrompt(uniqueQueries.join('\n'));
        setLoadingQueries(false);
      });
  }, [selectedPattern, userId, supabase]);

  // Helper: Parse keywords from prompt textarea
  function getKeywordsFromPrompt(prompt: string) {
    return prompt
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(keyword => ({ keyword }));
  }

  // Helper: Get API URL from env
  const API_URL = process.env.NEXT_PUBLIC_CONTENT_CLUSTER_API_URL || '';

  // Helper: Get session_id (simple random for demo, replace with real session)
  function getSessionId() {
    return Math.random().toString(36).substring(2) + Date.now();
  }


  // Helper: Format output for each step (move to component scope)
  function formatStepOutput(stepObj: any) {
    if (!stepObj || !stepObj.step) return null;
    switch (stepObj.step) {
      case 'keywords': {
        // Table of keywords
        return (
          <div className="mb-4">
            <div className="font-semibold text-blue-700 mb-1">Gathered the below keywords list:</div>
            <table className="w-full border text-xs mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100">Keyword</th>
                  <th className="border px-2 py-1 bg-gray-100">Avg Monthly Searches</th>
                  <th className="border px-2 py-1 bg-gray-100">Is Brand</th>
                </tr>
              </thead>
              <tbody>
                {stepObj.keywords?.map((kw: any, i: number) => (
                  <tr key={i}>
                    <td className="border px-2 py-1">{kw.text}</td>
                    <td className="border px-2 py-1">{kw.avg_monthly_searches}</td>
                    <td className="border px-2 py-1">{kw.is_brand ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'clusters': {
        // Table of clusters
        const clusters = stepObj.clusters || {};
        return (
          <div className="mb-4">
            <div className="font-semibold text-blue-700 mb-1">Clusters created:</div>
            <table className="w-full border text-xs mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1 bg-gray-100">Cluster</th>
                  <th className="border px-2 py-1 bg-gray-100">Keywords</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(clusters).map(([cluster, kws]: any, i: number) => (
                  <tr key={i}>
                    <td className="border px-2 py-1 font-semibold">{cluster}</td>
                    <td className="border px-2 py-1">{Array.isArray(kws) ? kws.join(', ') : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case 'architecture': {
        // Show JSON as plain text, bold **...** and \n as new line
        let arch = stepObj.architecture || '';
        // Replace **text** with <b>text</b>
        arch = arch.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
        // Replace \n with <br/>
        arch = arch.replace(/\\n/g, '\n'); // handle escaped newlines
        arch = arch.replace(/\n/g, '<br/>');
        return (
          <div className="mb-4">
            <div className="font-semibold text-blue-700 mb-1">Architecture created:</div>
            <div className="bg-gray-50 p-2 text-xs overflow-x-auto max-h-60" dangerouslySetInnerHTML={{ __html: arch }} />
          </div>
        );
      }
      case 'briefs': {
        // Show briefs as text, bold **...** and \n as new line
        const briefs = stepObj.briefs || {};
        return (
          <div className="mb-4">
            <div className="font-semibold text-blue-700 mb-1">Generated Briefs:</div>
            {Object.entries(briefs).map(([k, v]: any, i: number) => {
              let txt = v;
              txt = txt.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
              txt = txt.replace(/\\n/g, '\n');
              txt = txt.replace(/\n/g, '<br/>');
              return (
                <div key={i} className="mb-4">
                  <div className="font-semibold text-gray-700 mb-1">{k}</div>
                  <div className="bg-gray-50 p-2 text-xs overflow-x-auto max-h-60" dangerouslySetInnerHTML={{ __html: txt }} />
                </div>
              );
            })}
          </div>
        );
      }
      default:
        return null;
    }
  }

  // Run Agent: POST payload, handle SSE stream
  const handleRunAgent = async () => {
    if (!API_URL) {
      alert('API URL not set in .env');
      return;
    }
    if (!userId || !prompt.trim()) {
      alert('User ID or seed keyword missing');
      return;
    }
    setStreaming(true);
    setOutputRows([]);
    setOutputRaw('');
    const payload = {
      seed_keyword: prompt.trim(),
      user_id: userId,
      session_id: getSessionId(),
    };
    setPayloadPreview(payload); // <-- Save payload for display

    // Use fetch for POST SSE
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.body) {
      setStreaming(false);
      setOutputRaw('No response body');
      return;
    }
    const reader = response.body.getReader();
    let buffer = '';
    let rows: any[] = [];

    // Helper: Add step output
    function addStepOutput(stepObj: any) {
      setStepOutputs(prev => [...prev, stepObj]);
    }

    // Streaming logic with step-by-step messages
    setStepOutputs([]); // reset steps
    let currentStep = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      buffer += chunk;
      setOutputRaw(prev => prev + chunk);
      // Try to parse SSE events (assuming each event is a JSON line or data: ...)
      const lines = buffer.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('data:')) {
          try {
            const json = JSON.parse(line.replace('data:', '').trim());
            // Step-by-step messages
            if (json.step && json.step !== currentStep) {
              currentStep = json.step;
              switch (json.step) {
                case 'keywords':
                  addStepOutput({ type: 'msg', text: 'Analysing & Gathering keywords ideas...' });
                  break;
                case 'clusters':
                  addStepOutput({ type: 'msg', text: 'Creating the Cluster ideas...' });
                  break;
                case 'architecture':
                  addStepOutput({ type: 'msg', text: 'Creating Pillar and Cluster pages...' });
                  break;
                case 'briefs':
                  addStepOutput({ type: 'msg', text: 'Generating final Pillar and Cluster pages...' });
                  break;
                default:
                  break;
              }
            }
            // After data for each step
            addStepOutput({ type: 'step', data: json });
          } catch {}
        }
      }
      buffer = lines[lines.length - 1]; // keep last incomplete line
    }
    setStreaming(false);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Output table above controls */}
      {streaming && (
        <div className="mb-4 flex justify-end">
          <div className="max-w-xl w-full">
            <div
              className="bg-white border border-gray-300 rounded-lg shadow p-4 text-right"
              style={{ wordBreak: 'break-word' }}
            >
              <span className="block text-gray-800 mb-2">Content cluster agent is now working on the seed keywords you have given:</span>
              <span className="inline-block text-gray-900 text-xs" style={{ background: 'none', border: 'none', padding: 0 }}>
                {prompt.trim() ? prompt.trim().split('\n').map((kw, i) => (
                  <span key={i} style={{ display: 'inline-block', marginRight: 8 }}>{kw}</span>
                )) : <span className="text-gray-400">No keywords provided.</span>}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step-by-step output rendering (always show if there is output) */}
      {stepOutputs.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {stepOutputs.map((item, idx) => {
            if (item.type === 'msg') {
              return <div key={idx} className="text-gray-600 font-semibold mb-1">{item.text}</div>;
            }
            if (item.type === 'step') {
              return <div key={idx}>{formatStepOutput(item.data)}</div>;
            }
            return null;
          })}
        </div>
      )}

      {/* Controls: prompt and segment side by side */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-semibold mb-2" htmlFor="prompt">
            Please input keywords (upto 10 keywords, as comma separated) as prompt
          </label>
          <textarea
            id="prompt"
            className="w-full border border-slate-300 rounded-lg p-3 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={prompt}
            onChange={(e) => {
              const val = e.target.value;
              setPrompt(val);
              // Validation: no more than 10 comma-separated keywords
              const keywords = val
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);
              if (keywords.length > 10) {
                setKeywordError('Please enter no more than 10 keywords (comma separated).');
              } else {
                setKeywordError(null);
              }
            }}
            placeholder="Enter upto 10 keywords, as comma separated values..."
          />
          {keywordError && (
            <div className="text-red-600 text-xs mt-1">{keywordError}</div>
          )}
        </div>
        {/* Removed segment label and dropdown as requested */}
      </div>

      {/* Run Agent Button */}
      <div>
        <button
          className={`mt-4 px-6 py-2 font-bold rounded-lg shadow transition-colors duration-200
            bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400
            text-white border-2 border-transparent
            hover:from-purple-700 hover:via-blue-600 hover:to-cyan-500
            hover:border-blue-300
            disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
          disabled={!prompt.trim() || streaming || !!keywordError}
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
            Run Agent
          </span>
        </button>
      </div>
    </div>
  );
}