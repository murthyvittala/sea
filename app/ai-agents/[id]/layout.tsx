'use client';

export default function AgentDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
