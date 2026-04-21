export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full max-w-[90rem] mx-auto p-4 md:p-8 space-y-16 animate-pulse">
      
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
        <div className="w-full max-w-2xl space-y-4">
          <div className="h-12 w-3/4 bg-slate-800 rounded-2xl border border-white/5"></div>
          <div className="h-6 w-full bg-slate-800/50 rounded-xl border border-white/5"></div>
        </div>
        
        {/* Metric Widget Skeleton */}
        <div className="h-32 w-full md:w-80 bg-slate-800 rounded-3xl border border-white/5"></div>
      </div>

      {/* Title Shimmer */}
      <div className="h-8 w-64 bg-slate-800 rounded-xl border border-white/5"></div>

      {/* Grid Cards Shimmer (15 Placeholders) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="glass-card rounded-3xl p-6 h-[260px] flex flex-col justify-between border border-white/5">
            <div>
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-14 w-14 bg-slate-700/50 rounded-2xl shadow-inner"></div>
                <div className="h-6 w-48 bg-slate-700/50 rounded-lg"></div>
              </div>
              <div className="h-4 w-full bg-slate-700/30 rounded-lg mb-2"></div>
              <div className="h-4 w-3/4 bg-slate-700/30 rounded-lg"></div>
            </div>
            
            <div className="h-12 w-full bg-slate-800/40 border border-slate-700/50 rounded-xl"></div>
          </div>
        ))}
      </div>

    </div>
  );
}
