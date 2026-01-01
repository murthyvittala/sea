"use client";
import React from 'react';

export default function ResultsTable({ data }: { data: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-xs mb-2">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-100">Type</th>
            <th className="border px-2 py-1 bg-gray-100">Pillar</th>
            <th className="border px-2 py-1 bg-gray-100">Cluster</th>
            <th className="border px-2 py-1 bg-gray-100">Keywords</th>
            <th className="border px-2 py-1 bg-gray-100">Traffic Volume</th>
            <th className="border px-2 py-1 bg-gray-100">Estimated Traffic</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td className="border px-2 py-1">{row.type}</td>
              <td className="border px-2 py-1">{row.pillar}</td>
              <td className="border px-2 py-1">{row.cluster}</td>
              <td className="border px-2 py-1">{Array.isArray(row.keywords) ? row.keywords.join(', ') : row.keywords}</td>
              <td className="border px-2 py-1">{row.traffic_volume}</td>
              <td className="border px-2 py-1">{row.estimated_traffic}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
