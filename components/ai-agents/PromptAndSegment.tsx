'use client';
import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

// ErrorBoundary component for debug
function ErrorBoundary({ name, children }: { name: string, children: React.ReactNode }) {
  const [error, setError] = useState<Error | null>(null);
  if (error) {
    return <div style={{color:'red'}}>[ERROR in {name}]: {error.message}</div>;
  }
  try {
    return <>{children}</>;
  } catch (e: any) {
    setError(e);
    return <div style={{color:'red'}}>[ERROR in {name}]: {e.message}</div>;
  }
}

const ResultsTable = dynamic(() => import('./ResultsTable'), { ssr: false });
const D3Tree = dynamic(() => import('./D3tree'), { ssr: false });

interface Segment {
  id: number;
  name: string;
  pattern: string;
}


export default function PromptAndSegment() {
  // Store final specialist results
  const [specialistResults, setSpecialistResults] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [streaming, setStreaming] = useState(false);
  // Store raw JSONs received from backend
  const [rawAgentJsons, setRawAgentJsons] = useState<string[]>([]);
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
                {Object.entries(clusters)
                  .sort(([a], [b]) => {
                    // Match 'Cluster' followed by optional space and number, case-insensitive
                    const matchA = a.match(/cluster\s*(\d+)/i);
                    const matchB = b.match(/cluster\s*(\d+)/i);
                    if (matchA && matchB) {
                      const numA = parseInt(matchA[1], 10);
                      const numB = parseInt(matchB[1], 10);
                      return numA - numB;
                    }
                    return a.localeCompare(b);
                  })
                  .map(([cluster, kws]: any, i: number) => (
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
    setRawAgentJsons([]);
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
      alert('No response body');
      return;
    }
    const reader = response.body.getReader();
    let buffer = '';

    // Helper: Add step output
    function addStepOutput(stepObj: any) {
      setStepOutputs(prev => [...prev, stepObj]);
    }

    // Streaming logic with step-by-step messages
    setStepOutputs([]); // reset steps
    setRawAgentJsons([]); // reset raw jsons
    let currentStep = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = new TextDecoder().decode(value);
      buffer += chunk;
      // Try to parse SSE events (assuming each event is a JSON line or data: ...)
      const lines = buffer.split('\n');
      for (let line of lines) {
        line = line.trim();
        if (line.startsWith('data:')) {
          try {
            const jsonStr = line.replace('data:', '').trim();
            setRawAgentJsons(prev => [...prev, jsonStr]);
            const json = JSON.parse(jsonStr);
            // Step-by-step messages (optional, can keep or remove)
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
            // If we get the specialist stage and completed status, store results for table/graph
            if (json.stage === 'seo_content_specialist' && json.status === 'completed' && json.results) {
              console.log('[DEBUG] Received seo_content_specialist JSON:', json);
              setSpecialistResults(json.results);
            }
            // After data for each step
            addStepOutput({ type: 'step', data: json });
          } catch {}
        }
      }

    // Unconditional debug message to confirm render
    // (Move to render block, not inside streaming loop)

    // Specialist Results Table & Sunburst Graph (always at the bottom)
    // (Move to render block, not inside streaming loop)

      buffer = lines[lines.length - 1]; // keep last incomplete line
    }
    setStreaming(false);
  };

  return (
    <div className="flex flex-col gap-6 relative">
      {/* Unconditional debug message to confirm render */}
      <div style={{position:'fixed',bottom:0,right:0,zIndex:9999,background:'#eee',padding:'2px 8px',fontSize:'10px'}}>[DEBUG] PromptAndSegment rendered</div>


      {/* Output table above controls */}
      {(streaming || stepOutputs.length > 0) && (
        <div className="mb-4 flex justify-end">
          <div className="max-w-xl w-full">
            <div
              className="bg-white border border-gray-300 rounded-lg shadow p-4 text-right"
              style={{ wordBreak: 'break-word' }}
            >
              <span className="block text-gray-800 mb-2">Content cluster agents is now working on the seed keywords you have given:</span>
              <span className="inline-block text-gray-900 text-xs" style={{ background: 'none', border: 'none', padding: 0 }}>
                {prompt.trim() ? prompt.trim().split('\n').map((kw, i) => (
                  <span key={i} style={{ display: 'inline-block', marginRight: 8 }}>{kw}</span>
                )) : <span className="text-gray-400">No keywords provided.</span>}
              </span>
              {/* Step-by-step output rendering appended below initial message */}
              {stepOutputs.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 text-left">
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
            </div>
          </div>
        </div>
      )}
      
      {/*
      Raw JSON output from each agent stage
      {rawAgentJsons.length > 0 && (
        <div className="mb-4">
          <div className="font-semibold text-blue-700 mb-2">Raw JSON from each agent stage:</div>
          <pre className="bg-gray-100 p-2 text-xs overflow-x-auto max-h-60 rounded">
            {rawAgentJsons.map((json, idx) => (
              <div key={idx}>{json}</div>
            ))}
          </pre>
        </div>
      )}
      */}
      {/* Step-by-step output rendering moved above, under initial message */}

      {/* Progress Indicator Block */}
      {streaming && (
        <div className="flex justify-center items-center mt-8">
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 shadow">
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
            <span className="text-blue-700 font-semibold">AI Agents are working on your task...</span>
          </div>
        </div>
      )}

      {/* Specialist Results Table & Sunburst Graph (now just above prompt input) */}
      {/* --- Specialist Results Table Block START --- */}
      {specialistResults && (
        <>
          {/* <div style={{color:'red',fontWeight:'bold'}}>[DEBUG] specialistResults is truthy, rendering block</div> */}
          <div className="mt-8 p-6 bg-white border border-gray-300 rounded-lg shadow flex flex-col gap-8">
            <div>
              {/* <div className="font-bold text-lg mb-2">SEO Content Specialist Results</div>
              <pre className="bg-gray-100 p-2 text-xs mb-2">[DEBUG] Table Data: {JSON.stringify(specialistResults.graph_data, null, 2)}</pre> */}
              {Array.isArray(specialistResults.graph_data) && specialistResults.graph_data.length > 0 ? (
                <>
                  <div className="font-bold text-lg mb-2">Pillar and Cluster Pages Table</div>
                  <ResultsTable data={specialistResults.graph_data} />
                  {/* Sunburst Graph below the table */}
                  {specialistResults.sunburst_data && Array.isArray(specialistResults.sunburst_data.children) && specialistResults.sunburst_data.children.length > 0 ? (
                    <div className="mt-8">
                      <div className="font-bold text-lg mb-2">Pillar and clustar tree graph</div>
                      <D3Tree data={specialistResults.sunburst_data} />
                    </div>
                  ) : (
                    <div style={{color:'orange',fontWeight:'bold'}}>[DEBUG] No sunburst_data found or empty</div>
                  )}
                </>
              ) : (
                <div style={{color:'orange',fontWeight:'bold'}}>[DEBUG] No graph_data found or empty array</div>
              )}
            </div>
          </div>
          <script dangerouslySetInnerHTML={{__html:`console.log('[DEBUG] specialistResults in render:', ${JSON.stringify(specialistResults)})`}} />
        </>
      )}
      {/* --- Specialist Results Table Block END --- */}
      
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