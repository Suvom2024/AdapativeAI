'use client';

import MaterialIcon from '../MaterialIcon';

interface AIInsightsSidebarProps {
  currentStrategy?: string;
  masteredConcepts?: string[];
  gapDetection?: { issue: string; recommendation: string };
  reasoningPath?: Array<{ step: string; status: 'completed' | 'current' | 'pending' }>;
}

export default function AIInsightsSidebar({ 
  currentStrategy = "You're effectively using systematic approaches",
  masteredConcepts = ["Core Concepts", "Problem Solving"],
  gapDetection,
  reasoningPath = []
}: AIInsightsSidebarProps) {
  return (
    <aside className="w-[380px] 2xl:w-[420px] bg-white text-slate-600 flex flex-col z-30 shadow-2xl relative overflow-hidden border-l border-slate-200 backdrop-blur-xl hidden xl:flex">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-100/60 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-purple-100/60 rounded-full blur-[80px] pointer-events-none"></div>
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative">
            <div className="size-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
            <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75"></div>
          </div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 font-display">Real-time AI Insights</h2>
        </div>
        <p className="text-xs text-slate-500 font-medium">Analyzing your solving patterns...</p>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar relative z-10">
        {/* Current Strategy */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-indigo-600">
            <span>Current Strategy</span>
            <MaterialIcon name="lightbulb" className="text-[16px]" />
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:bg-white hover:shadow-md hover:border-indigo-200 transition-all group">
            <p className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">
              {currentStrategy}. <span className="text-indigo-700 font-semibold bg-indigo-50 px-1 rounded">Keep going!</span>
            </p>
            <div className="mt-4 flex gap-1.5 opacity-80">
              <div className="h-1 flex-1 rounded-full bg-indigo-500 shadow-sm"></div>
              <div className="h-1 flex-1 rounded-full bg-indigo-500 shadow-sm"></div>
              <div className="h-1 flex-1 rounded-full bg-slate-200"></div>
            </div>
          </div>
        </div>
        
        {/* Recently Mastered */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-emerald-600">
            <span>Recently Mastered</span>
            <MaterialIcon name="check_circle" className="text-[16px]" />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {masteredConcepts.map((concept, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-default shadow-sm"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
        
        {/* Gap Detection */}
        {gapDetection && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-amber-600">
              <span>Gap Detection</span>
              <MaterialIcon name="warning" className="text-[16px]" />
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 hover:bg-amber-50/80 hover:shadow-sm transition-colors">
              <div className="flex gap-4">
                <div className="p-2 bg-amber-100 rounded-lg h-fit text-amber-600">
                  <MaterialIcon name="timelapse" className="text-[20px]" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">{gapDetection.issue}</p>
                  <button className="text-xs text-amber-700 hover:text-amber-800 font-bold underline decoration-amber-200 underline-offset-4 decoration-2 hover:decoration-amber-400 transition-all">
                    {gapDetection.recommendation}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Reasoning Path */}
        {reasoningPath.length > 0 && (
          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-6">Your Reasoning Path</h3>
            <div className="relative pl-6 border-l border-slate-200 ml-2 space-y-8">
              {reasoningPath.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-[29px] top-1 size-3 rounded-full ring-4 ring-white transition-colors shadow-sm ${
                    step.status === 'completed' 
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                      : step.status === 'current'
                      ? 'bg-indigo-600 animate-pulse'
                      : 'bg-slate-300 group-hover:bg-slate-400'
                  }`}></div>
                  {step.status === 'current' && (
                    <div className="absolute -left-[29px] top-1 size-3 rounded-full bg-indigo-600 animate-ping opacity-30"></div>
                  )}
                  <div className={`text-xs ${
                    step.status === 'current' 
                      ? 'px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 w-fit shadow-sm' 
                      : ''
                  }`}>
                    <span className={`font-bold block mb-0.5 ${
                      step.status === 'completed' ? 'text-emerald-600' :
                      step.status === 'current' ? 'text-indigo-700' :
                      'opacity-70'
                    }`}>{step.step}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-6 border-t border-slate-100 bg-white/90 backdrop-blur-md z-20">
        <button className="w-full relative overflow-hidden rounded-xl group p-[1px] shadow-sm hover:shadow-md transition-all">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-white rounded-[11px] px-4 py-3.5 flex items-center justify-center gap-2 group-hover:bg-opacity-90 transition-colors">
            <MaterialIcon name="auto_awesome" className="text-[18px] text-indigo-600" />
            <span className="text-sm font-bold text-indigo-700">Generate Hint</span>
          </div>
        </button>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </aside>
  );
}

