"use client";
import { useState } from "react";

export default function DetailsButton({ agent }: { agent: any }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        className="text-blue-600 underline text-sm"
        type="button"
        onClick={() => setShow((v) => !v)}
      >
        Details
      </button>
      {show && (
        <div
          className="absolute left-0 top-full mt-2 z-30 w-80 p-4 bg-white border border-gray-200 rounded shadow-lg text-sm"
          onMouseLeave={() => setShow(false)}
        >
          {agent.purpose && (
            <div>
              <strong>Purpose:</strong> {agent.purpose}
            </div>
          )}
          {agent.description && (
            <div className="mt-2">
              <strong>Description:</strong> {agent.description}
            </div>
          )}
          {agent.advantages && Array.isArray(agent.advantages) && agent.advantages.length > 0 && (
            <div className="mt-2">
              <strong>Advantages:</strong>
              <ul className="list-disc ml-5">
                {agent.advantages.map((adv: string, i: number) => (
                  <li key={i}>{adv}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
