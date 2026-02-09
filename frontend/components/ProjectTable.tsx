'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Star, Search, Filter, ArrowUpDown, MapPin, Briefcase, DollarSign, TrendingUp, Calendar, ChevronRight, Bookmark, Mail, Eye, Share2, Loader2 } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  developer: string;
  architect: string;
  gdv: string;
  gdvValue: number;
  units: number;
  floors: number;
  stage: string;
  expectedDelivery: string;
  firstDetected: string;
  firstDetectedTime: number;
  latestUpdate: string;
  latestUpdateTime: number;
  signal?: {
    earlySignalScore: number;
    daysBeforeMarket: number;
    confidence: number;
  };
  dataQuality?: number;
  isNew?: boolean;
  image: string;
  individuals?: string[];
  hasEnrichedData?: boolean;
  enrichmentETA?: number | null;
}

interface ProjectTableProps {
  projects: Project[];
  favoriteIds: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelectProject: (project: Project) => void;
  onContactDeveloper?: (project: Project) => void;
}

type SortField = 'name' | 'city' | 'stage' | 'gdv' | 'ess' | 'quality' | 'detected' | 'firstAnnouncement';
type SortDirection = 'asc' | 'desc';

// Stage groups for filtering
const stageGroups: Record<string, string[]> = {
  'Early Stages': ['Planning', 'Demo'],
  'Active Development': ['Construction'],
  'Sales & Delivery': ['Active Sales', 'Completed']
};

// Countdown timer component for enrichment ETA
function EnrichmentCountdown({ eta }: { eta: number }) {
  const [timeLeft, setTimeLeft] = useState(eta);
  
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  if (timeLeft <= 0) {
    return <span className="text-[10px] text-emerald-400">Ready to enrich</span>;
  }
  
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  return (
    <div className="flex items-center gap-1 text-[10px] text-amber-400">
      <Loader2 size={10} className="animate-spin" />
      <span>Enriching: {minutes}m {seconds}s</span>
    </div>
  );
}

export default function ProjectTable({ 
  projects, 
  favoriteIds, 
  onToggleFavorite, 
  onSelectProject,
  onContactDeveloper 
}: ProjectTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [minGDVFilter, setMinGDVFilter] = useState<number>(0);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  // Default sort by First Announcement (most recent first)
  const [sortField, setSortField] = useState<SortField>('firstAnnouncement');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Resizable column widths (in pixels)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
    project: 280,
    location: 140,
    stage: 120,
    financials: 120,
    stakeholders: 140,
    signal: 110,
    quality: 90,
    firstAnnouncement: 130,
    actions: 140
  });

  const [resizing, setResizing] = useState<{ field: string; startX: number; startWidth: number } | null>(null);

  const handleResizeStart = (field: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing({
      field,
      startX: e.clientX,
      startWidth: columnWidths[field] || 100
    });
  };

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!resizing) return;
    const diff = e.clientX - resizing.startX;
    const newWidth = Math.max(60, resizing.startWidth + diff);
    setColumnWidths(prev => ({ ...prev, [resizing.field]: newWidth }));
  };

  const handleResizeEnd = () => {
    setResizing(null);
  };

  // Get unique cities for filter
  const cities = useMemo(() => {
    const citySet = new Set(projects.map(p => p.city).filter(Boolean));
    return Array.from(citySet).sort();
  }, [projects]);

  // Get unique stages for filter
  const stages = useMemo(() => {
    const stageSet = new Set(projects.map(p => p.stage).filter(Boolean));
    return Array.from(stageSet).sort();
  }, [projects]);

  // Check if stage filter is a group
  const isStageGroup = (filter: string): boolean => {
    return Object.keys(stageGroups).includes(filter);
  };

  const getStagesInGroup = (group: string): string[] => {
    return stageGroups[group] || [];
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter(project => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matches = 
          project.name?.toLowerCase().includes(query) ||
          project.developer?.toLowerCase().includes(query) ||
          project.city?.toLowerCase().includes(query) ||
          project.address?.toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Stage filter - handle both individual stages and groups
      if (stageFilter !== 'all') {
        if (isStageGroup(stageFilter)) {
          const stagesInGroup = getStagesInGroup(stageFilter);
          if (!stagesInGroup.includes(project.stage || '')) return false;
        } else if (project.stage !== stageFilter) {
          return false;
        }
      }

      // City filter
      if (cityFilter !== 'all' && project.city !== cityFilter) return false;

      // GDV filter
      if (minGDVFilter > 0 && (project.gdvValue || 0) < minGDVFilter) return false;

      // Favorites filter
      if (onlyFavorites && !favoriteIds.has(project.id)) return false;

      return true;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'city':
          comparison = (a.city || '').localeCompare(b.city || '');
          break;
        case 'stage':
          comparison = (a.stage || '').localeCompare(b.stage || '');
          break;
        case 'gdv':
          comparison = (b.gdvValue || 0) - (a.gdvValue || 0);
          break;
        case 'ess':
          comparison = (b.signal?.earlySignalScore || 0) - (a.signal?.earlySignalScore || 0);
          break;
        case 'quality':
          comparison = (b.dataQuality || 0) - (a.dataQuality || 0);
          break;
        case 'detected':
          comparison = (b.firstDetectedTime || 0) - (a.firstDetectedTime || 0);
          break;
        case 'firstAnnouncement':
          comparison = (b.firstDetectedTime || 0) - (a.firstDetectedTime || 0);
          break;
      }
      return sortDirection === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [projects, searchQuery, stageFilter, cityFilter, minGDVFilter, onlyFavorites, favoriteIds, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage?.toLowerCase()) {
      case 'planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'demo': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'construction': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'active sales': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completed': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
      default: return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-blue-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatESS = (score: number) => {
    if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
    if (score >= 1000) return `${(score / 1000).toFixed(0)}K`;
    return score.toString();
  };

  return (
    <div className="w-full bg-[#0a0a0a] rounded-xl border border-white/10 overflow-hidden">
      {/* Header with Filters */}
      <div className="p-4 border-b border-white/10 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Project Index</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {filteredProjects.length} of {projects.length} projects
              {onlyFavorites && ' (favorites only)'}
            </p>
          </div>
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input
              type="text"
              placeholder="Search projects, developers, cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30"
            />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Stage Filter - Grouped */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/30"
          >
            <option value="all">All Stages</option>
            <optgroup label="By Group">
              {Object.keys(stageGroups).map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </optgroup>
            <optgroup label="Individual Stages">
              {stages.map(stage => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </optgroup>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/30"
          >
            <option value="all">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* GDV Filter */}
          <select
            value={minGDVFilter}
            onChange={(e) => setMinGDVFilter(Number(e.target.value))}
            className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-violet-500/30"
          >
            <option value={0}>All Values</option>
            <option value={100000000}>$100M+</option>
            <option value={500000000}>$500M+</option>
            <option value={1000000000}>$1B+</option>
          </select>

          {/* Favorites Toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              onlyFavorites 
                ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
                : 'bg-white/[0.03] border border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark size={14} className={onlyFavorites ? 'fill-current' : ''} />
            Favorites Only
          </button>

          {/* Clear Filters */}
          {(searchQuery || stageFilter !== 'all' || cityFilter !== 'all' || minGDVFilter > 0 || onlyFavorites) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStageFilter('all');
                setCityFilter('all');
                setMinGDVFilter(0);
                setOnlyFavorites(false);
              }}
              className="text-xs text-zinc-500 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div 
        className="overflow-x-auto"
        onMouseMove={handleResizeMove}
        onMouseUp={handleResizeEnd}
        onMouseLeave={handleResizeEnd}
      >
        <table className="w-full" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-white/[0.02] border-b border-white/10">
            <tr className="text-left">
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider relative group"
                style={{ width: columnWidths.project }}
              >
                Project
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('project', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white relative group"
                style={{ width: columnWidths.location }}
                onClick={() => handleSort('city')}
              >
                <div className="flex items-center gap-1">
                  Location
                  {sortField === 'city' && <ArrowUpDown size={12} />}
                </div>
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('location', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white relative group"
                style={{ width: columnWidths.stage }}
                onClick={() => handleSort('stage')}
              >
                <div className="flex items-center gap-1">
                  Stage
                  {sortField === 'stage' && <ArrowUpDown size={12} />}
                </div>
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('stage', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white relative group"
                style={{ width: columnWidths.financials }}
                onClick={() => handleSort('gdv')}
              >
                <div className="flex items-center gap-1">
                  Financials
                  {sortField === 'gdv' && <ArrowUpDown size={12} />}
                </div>
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('financials', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider relative group"
                style={{ width: columnWidths.stakeholders }}
              >
                Stakeholders
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('stakeholders', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white relative group"
                style={{ width: columnWidths.firstAnnouncement }}
                onClick={() => handleSort('firstAnnouncement')}
              >
                <div className="flex items-center gap-1">
                  First Announced
                  {sortField === 'firstAnnouncement' && <ArrowUpDown size={12} />}
                </div>
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('firstAnnouncement', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white relative group"
                style={{ width: columnWidths.signal }}
                onClick={() => handleSort('ess')}
              >
                <div className="flex items-center gap-1">
                  Signal
                  {sortField === 'ess' && <ArrowUpDown size={12} />}
                </div>
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('signal', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-white relative group"
                style={{ width: columnWidths.quality }}
                onClick={() => handleSort('quality')}
              >
                <div className="flex items-center gap-1">
                  Quality
                  {sortField === 'quality' && <ArrowUpDown size={12} />}
                </div>
                <div 
                  className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-violet-500/50 z-10"
                  onMouseDown={(e) => handleResizeStart('quality', e)}
                />
              </th>
              <th 
                className="px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider text-right"
                style={{ width: columnWidths.actions }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredProjects.map((project) => (
              <tr 
                key={project.id}
                className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                onClick={() => onSelectProject(project)}
              >
                {/* Project Identity */}
                <td className="px-4 py-4" style={{ width: columnWidths.project }}>
                  <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                      <img 
                        src={project.image} 
                        alt={project.name}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10"
                      />
                      {project.isNew && (
                        <span className="absolute -top-1 -left-1 bg-violet-600 text-[8px] font-bold text-white px-1.5 py-0.5 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
                      <p className="text-xs text-zinc-500 truncate">{project.address}</p>
                    </div>
                  </div>
                </td>

                {/* Location */}
                <td className="px-4 py-4" style={{ width: columnWidths.location }}>
                  <div className="flex items-center gap-1.5 text-sm text-zinc-300 truncate">
                    <MapPin size={14} className="text-zinc-600 shrink-0" />
                    <span className="truncate">{project.city}, {project.state}</span>
                  </div>
                </td>

                {/* Stage */}
                <td className="px-4 py-4" style={{ width: columnWidths.stage }}>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStageColor(project.stage)}`}>
                    {project.stage}
                  </span>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {project.expectedDelivery && `Delivery: ${project.expectedDelivery}`}
                  </div>
                </td>

                {/* Financials */}
                <td className="px-4 py-4" style={{ width: columnWidths.financials }}>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-violet-400 font-mono">{project.gdv}</div>
                    <div className="text-xs text-zinc-500">{project.units} units</div>
                    <div className="text-xs text-zinc-500">{project.floors} floors</div>
                  </div>
                </td>

                {/* Stakeholders */}
                <td className="px-4 py-4" style={{ width: columnWidths.stakeholders }}>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <Briefcase size={12} className="text-zinc-600 shrink-0" />
                      <span className="truncate">{project.developer}</span>
                    </div>
                    {project.individuals && project.individuals.length > 0 && (
                      <div className="text-[10px] text-zinc-500">
                        {project.individuals.length} key people
                      </div>
                    )}
                  </div>
                </td>

                {/* First Announcement */}
                <td className="px-4 py-4" style={{ width: columnWidths.firstAnnouncement }}>
                  <div className="space-y-1">
                    <div className="text-sm text-zinc-300">{project.firstDetected}</div>
                    <div className="text-[10px] text-zinc-500">
                      {(() => {
                        const daysSince = Math.floor((Date.now() - (project.firstDetectedTime || 0)) / 86400000);
                        if (daysSince < 7) return `${daysSince} days ago`;
                        if (daysSince < 30) return `${Math.floor(daysSince / 7)} weeks ago`;
                        if (daysSince < 365) return `${Math.floor(daysSince / 30)} months ago`;
                        return `${Math.floor(daysSince / 365)} years ago`;
                      })()}
                    </div>
                  </div>
                </td>

                {/* Signal */}
                <td className="px-4 py-4" style={{ width: columnWidths.signal }}>
                  {project.hasEnrichedData && project.signal ? (
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-white font-mono">
                        {formatESS(project.signal.earlySignalScore || 0)}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {project.signal.daysBeforeMarket || 365}d to market
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {project.signal.confidence || 70}% confidence
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-zinc-600 font-mono">--</div>
                      <div className="text-[10px] text-amber-500/70">AI enriching...</div>
                    </div>
                  )}
                </td>

                {/* Quality */}
                <td className="px-4 py-4" style={{ width: columnWidths.quality }}>
                  {project.hasEnrichedData ? (
                    <div className="flex items-center gap-2">
                      <div className={`text-sm font-bold font-mono ${getQualityColor(project.dataQuality || 0)}`}>
                        {project.dataQuality || 0}/100
                      </div>
                      {(project.dataQuality || 0) >= 90 && (
                        <span className="text-[10px] text-emerald-400">🏆</span>
                      )}
                    </div>
                  ) : project.enrichmentETA ? (
                    <EnrichmentCountdown eta={project.enrichmentETA} />
                  ) : (
                    <span className="text-[10px] text-zinc-500">Waiting for data...</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-4" style={{ width: columnWidths.actions }}>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(project.id);
                      }}
                      className={`p-1.5 rounded-lg transition-colors ${
                        favoriteIds.has(project.id)
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-zinc-600 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Star size={16} className={favoriteIds.has(project.id) ? 'fill-current' : ''} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onContactDeveloper?.(project);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project);
                      }}
                      className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="p-12 text-center">
          <div className="text-zinc-600 mb-2">
            <Search size={48} className="mx-auto" />
          </div>
          <h3 className="text-sm font-medium text-white mb-1">No projects found</h3>
          <p className="text-xs text-zinc-500">Try adjusting your filters or search query</p>
        </div>
      )}
    </div>
  );
}
