'use client';

import React, { useState } from 'react';
import { 
  DollarSign, Building2, Activity, TrendingUp, MapPin, 
  Star, ArrowUpRight, Briefcase, BarChart3, Calendar,
  Zap, Globe, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import ProjectTable from './ProjectTable';

interface DashboardProps {
  projects: any[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelectProject: (project: any) => void;
}

export default function Dashboard({ 
  projects, 
  favoriteIds, 
  onToggleFavorite, 
  onSelectProject 
}: DashboardProps) {
  // Collapsible sections state
  const [pipelineExpanded, setPipelineExpanded] = useState(true);
  const [marketsExpanded, setMarketsExpanded] = useState(true);
  const [watchlistExpanded, setWatchlistExpanded] = useState(true);
  const [activityExpanded, setActivityExpanded] = useState(true);

  // Calculate metrics
  const totalGDV = projects.reduce((acc, p) => acc + (p.gdvValue || 0), 0);
  const totalProjects = projects.length;
  const newSignals = projects.filter(p => {
    const daysSince = (Date.now() - (p.firstDetectedTime || 0)) / 86400000;
    return daysSince < 7;
  }).length;
  
  const highValueTargets = projects.filter(p => {
    const gdv = p.gdvValue || 0;
    const ess = p.signal?.earlySignalScore || 0;
    return gdv > 500000000 && ess > 100000;
  }).length;

  // Get favorite projects
  const favoriteProjects = projects.filter(p => favoriteIds.has(p.id));

  // Pipeline by stage
  const stageCounts: Record<string, number> = {};
  projects.forEach(p => {
    const stage = p.stage || 'Unknown';
    stageCounts[stage] = (stageCounts[stage] || 0) + 1;
  });

  // Top markets
  const marketData: Record<string, { count: number; gdv: number }> = {};
  projects.forEach(p => {
    const city = p.city || 'Unknown';
    if (!marketData[city]) {
      marketData[city] = { count: 0, gdv: 0 };
    }
    marketData[city].count++;
    marketData[city].gdv += p.gdvValue || 0;
  });

  const topMarkets = Object.entries(marketData)
    .sort((a, b) => b[1].gdv - a[1].gdv)
    .slice(0, 5);

  const maxMarketGDV = topMarkets[0]?.[1].gdv || 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold tracking-tight text-white">Command Center</h1>
        <p className="text-sm text-zinc-500 mt-1">Real-time intelligence and pipeline overview</p>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          label="Total Pipeline GDV" 
          value={formatCurrency(totalGDV)}
          trend="Live Pipeline"
          icon={<DollarSign size={18} />}
          highlight
        />
        <MetricCard 
          label="Active Projects" 
          value={totalProjects.toString()}
          trend={`${newSignals} new this week`}
          icon={<Building2 size={18} />}
        />
        <MetricCard 
          label="New Signals (7d)" 
          value={newSignals.toString()}
          trend="Above average"
          trendUp
          icon={<Activity size={18} />}
        />
        <MetricCard 
          label="High-Value Targets" 
          value={highValueTargets.toString()}
          trend="Priority focus"
          icon={<TrendingUp size={18} />}
          alert={highValueTargets > 0}
        />
      </div>

      {/* Pipeline & Markets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-violet-500" />
              Pipeline by Stage
            </h3>
            <span className="text-xs text-zinc-500">{totalProjects} total</span>
          </div>
          {pipelineExpanded && (
            <div className="space-y-4">
              {Object.entries(stageCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([stage, count]) => {
                  const percentage = (count / totalProjects) * 100;
                  return (
                    <div key={stage} className="flex items-center gap-4">
                      <div className="w-24 text-xs text-zinc-400">{stage}</div>
                      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-violet-600 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="w-12 text-right text-xs font-mono text-white">{count}</div>
                    </div>
                  );
                })}
            </div>
          )}
          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setPipelineExpanded(!pipelineExpanded)}
            className="w-full mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {pipelineExpanded ? (
              <><ChevronUp size={14} /> Collapse</>
            ) : (
              <><ChevronDown size={14} /> Expand</>
            )}
          </button>
        </div>

        {/* Top Markets */}
        <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe size={16} className="text-violet-500" />
              Top Markets by GDV
            </h3>
            <span className="text-xs text-zinc-500">Top 5</span>
          </div>
          {marketsExpanded && (
            <div className="space-y-4">
              {topMarkets.map(([city, data], index) => {
                const percentage = (data.gdv / maxMarketGDV) * 100;
                return (
                  <div key={city} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-28">
                      <span className="text-xs text-zinc-500 w-4">{index + 1}</span>
                      <span className="text-xs text-zinc-300 truncate">{city}</span>
                    </div>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-white">{formatCurrency(data.gdv)}</div>
                      <div className="text-[10px] text-zinc-500">{data.count} projects</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setMarketsExpanded(!marketsExpanded)}
            className="w-full mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {marketsExpanded ? (
              <><ChevronUp size={14} /> Collapse</>
            ) : (
              <><ChevronDown size={14} /> Expand</>
            )}
          </button>
        </div>
      </div>

      {/* Watchlist Section */}
      {favoriteProjects.length > 0 && (
        <div className="p-6 rounded-xl bg-violet-500/5 border border-violet-500/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Star size={20} className="text-violet-400 fill-violet-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Your Watchlist</h3>
                <p className="text-xs text-zinc-500">{favoriteProjects.length} tracked projects</p>
              </div>
            </div>
            <button className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View All <ArrowUpRight size={12} />
            </button>
          </div>
          
          {watchlistExpanded && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteProjects.slice(0, 6).map(project => (
                <div 
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="p-4 bg-white/[0.03] border border-white/10 rounded-lg hover:border-violet-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <img 
                      src={project.image} 
                      alt={project.name}
                      className="w-16 h-16 rounded-lg object-cover border border-white/10"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate group-hover:text-violet-400 transition-colors">
                        {project.name}
                      </h4>
                      <p className="text-xs text-zinc-500 mt-0.5">{project.city}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-mono text-violet-400">{project.gdv}</span>
                        {project.dataQuality && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            project.dataQuality >= 90 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'
                          }`}>
                            Q{project.dataQuality}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Collapse/Expand Toggle */}
          <button
            onClick={() => setWatchlistExpanded(!watchlistExpanded)}
            className="w-full mt-4 pt-4 border-t border-violet-500/10 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {watchlistExpanded ? (
              <><ChevronUp size={14} /> Collapse</>
            ) : (
              <><ChevronDown size={14} /> Expand</>
            )}
          </button>
        </div>
      )}

      {/* Recent Activity */}
      <div className="p-6 rounded-xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Zap size={16} className="text-yellow-500" />
            Recent Activity
          </h3>
        </div>
        {activityExpanded && (
          <div className="space-y-3">
            {projects
              .sort((a, b) => (b.latestUpdateTime || 0) - (a.latestUpdateTime || 0))
              .slice(0, 5)
              .map(project => (
                <div key={project.id} className="flex items-center gap-4 p-3 bg-white/[0.02] rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
                    <Activity size={14} className="text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{project.name}</p>
                    <p className="text-xs text-zinc-500">New signal detected • {project.stage}</p>
                  </div>
                  <span className="text-xs text-zinc-600 font-mono">
                    {new Date(project.latestUpdateTime).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        )}
        {/* Collapse/Expand Toggle */}
        <button
          onClick={() => setActivityExpanded(!activityExpanded)}
          className="w-full mt-4 pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {activityExpanded ? (
            <><ChevronUp size={14} /> Collapse</>
          ) : (
            <><ChevronDown size={14} /> Expand</>
          )}
        </button>
      </div>

      {/* Full Project Table */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">All Projects</h3>
        <ProjectTable 
          projects={projects}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
          onSelectProject={onSelectProject}
        />
      </div>
    </div>
  );
}

// Helper Components
function MetricCard({ 
  label, 
  value, 
  trend, 
  trendUp, 
  highlight, 
  alert,
  icon 
}: { 
  label: string; 
  value: string; 
  trend: string;
  trendUp?: boolean;
  highlight?: boolean;
  alert?: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className={`p-5 rounded-xl border ${
      highlight ? 'bg-violet-600/10 border-violet-500/30' : 
      alert ? 'bg-red-500/5 border-red-500/20' :
      'bg-white/[0.02] border-white/10'
    }`}>
      <div className="flex justify-between mb-3">
        <div className={`p-2 rounded-lg ${
          highlight ? 'bg-violet-500 text-white' : 
          alert ? 'bg-red-500/20 text-red-400' :
          'bg-white/5 text-zinc-400'
        }`}>
          {icon}
        </div>
        {alert && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
      </div>
      <div className="text-2xl font-bold text-white font-mono">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{label}</div>
      {trend && (
        <div className={`text-[10px] mt-2 ${trendUp ? 'text-emerald-400' : 'text-zinc-500'}`}>
          {trendUp && '↑ '}{trend}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value}`;
}
