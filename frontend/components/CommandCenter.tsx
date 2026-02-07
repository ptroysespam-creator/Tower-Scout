'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { init, tx } from '@instantdb/react';
import { Agentation } from 'agentation';
import {
    LayoutTemplate, Settings, Search, Menu, X, Bookmark, Activity, Filter,
    ArrowUpRight, MapPin, Briefcase, Trophy, Building2, BarChart3,
    ChevronRight, ChevronDown, ChevronUp, ArrowUpDown, Zap, Globe, Share2,
    TrendingUp, CheckCircle2, DollarSign, PieChart, ExternalLink, Users,
    Map as MapIcon, Maximize2, Plus, Minus, Navigation, Loader2, Link as LinkIcon, ImageIcon,
    Table as TableIcon
} from 'lucide-react';
import { mockProjects, mockSources } from '@/lib/demoData';

// --- DATABASE CONFIG ---
const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID || "3cda2be8-9300-4cbd-bfad-6d77d3118ced";
const db = init({ appId: APP_ID });
const USE_DEMO_DATA = true; // Set to false when InstantDB is fully configured

// --- TYPES ---
type SystemStatus = 'live' | 'syncing' | 'error';
type Tab = 'dashboard' | 'projects' | 'map' | 'favorites' | 'settings';
type SortOption = 'smart_rank' | 'newest' | 'gdv_high';

interface TimelineEvent {
    id: string;
    date: string;
    source: string;
    title: string;
    type: 'permit' | 'financial' | 'system';
    url: string;
}

interface Stakeholder {
    name: string;
    role: string;
    raw: string;
}

interface Project {
    id: string;
    name: string;
    address: string;
    city: string;
    developer: string;
    architect: string;
    lender: string;
    salesTeam: string;
    individuals: string[]; // Raw strings from DB
    stakeholderList: Stakeholder[]; // Parsed objects for Table
    gdv: string;
    gdvValue: number;
    floors: number;
    units: number;
    stage: string;
    expectedDelivery: string;
    firstDetected: string;
    firstDetectedTime: number;
    latestUpdate: string;
    latestUpdateTime: number;
    isNew: boolean;
    image: string;
    gallery: string[];
    description: string | null;
    isFavorite: boolean;
    unitMix?: { type: string; count: number; avgPrice: string }[];
    timeline: TimelineEvent[];
    sourceLinks: string[];
    coordinates: { lat: number; lng: number } | null;
}

interface FilterChip {
    id: string;
    type: 'search' | 'stage' | 'region';
    value: string;
    label: string;
}

interface ColumnConfig {
    id: 'identity' | 'vitals' | 'stakeholders' | 'dates' | 'status';
    label: string;
    width: number;
}

// --- UTILS ---
let leafletLoaderPromise: Promise<any> | null = null;
const loadLeaflet = () => {
    if (typeof window === 'undefined') return Promise.reject("Window not defined");
    if ((window as any).L) return Promise.resolve((window as any).L);
    if (!leafletLoaderPromise) {
        leafletLoaderPromise = new Promise((resolve, reject) => {
            if (document.querySelector('script[src*="leaflet.js"]')) {
                const checkInterval = setInterval(() => {
                    if ((window as any).L) { clearInterval(checkInterval); resolve((window as any).L); }
                }, 100);
                return;
            }
            const link = document.createElement("link"); link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
            const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true;
            script.onload = () => resolve((window as any).L); script.onerror = reject; document.body.appendChild(script);
        });
    }
    return leafletLoaderPromise;
};

const parseGDV = (str: string) => {
    if (!str || str === 'TBD') return 0;
    const clean = str.replace(/[^0-9.]/g, '');
    let val = parseFloat(clean);
    if (str.includes('B')) val *= 1e9; else if (str.includes('M')) val *= 1e6;
    return val || 0;
};

// --- HELPER: PARSE STAKEHOLDERS ---
const parseStakeholders = (people: string[]): Stakeholder[] => {
    if (!people || !Array.isArray(people)) return [];
    return people.map(raw => {
        // Try to parse "Name (Role)" format
        const match = raw.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
            return { name: match[1].trim(), role: match[2].trim(), raw };
        }
        return { name: raw, role: "Principal", raw };
    });
};

// --- MAIN SHELL ---
export default function TowerScoutShell() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [activeFilters, setActiveFilters] = useState<FilterChip[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [sortMode, setSortMode] = useState<SortOption>('smart_rank');

    // Use InstantDB or Demo Data
    const dbQuery = db.useQuery({
        projects: { $: { limit: 5000, order: { serverCreatedAt: 'desc' } }, signals: {} }
    });
    
    // Determine data source
    const isLoading = USE_DEMO_DATA ? false : dbQuery.isLoading;
    const error = USE_DEMO_DATA ? null : dbQuery.error;
    const data = USE_DEMO_DATA 
        ? { projects: mockProjects, sources: mockSources }
        : dbQuery.data;

    // --- DATA MAPPING & DEDUPLICATION ---
    const projects: Project[] = useMemo(() => {
        const rawList = data?.projects || [];
        const groups: Record<string, any[]> = {};

        // 1. Group by Name
        rawList.forEach((p: any) => {
            const key = p.name ? p.name.trim().toLowerCase() : "unknown";
            // Filter Completed Projects and Unknowns
            if (key === "unknown") return;
            if (p.status_stage === 'Complete' || p.status_stage === 'Completed') return;

            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });

        // 2. Merge & Construct
        return Object.values(groups).map(group => {
            const base = group[0]; // Use first as base

            // Merge Collections
            let uniqueSignals: Record<string, any> = {};
            let uniqueLinks = new Set<string>();
            let allIndividuals = new Set<string>();
            let allImages = new Set<string>();

            const isValidLink = (l: string) => {
                try {
                    return l && l.startsWith('http') && new URL(l).pathname.length > 1 && !l.includes('localhost');
                } catch { return false; }
            };

            group.forEach(p => {
                // Links
                if (isValidLink(p.source_url)) uniqueLinks.add(p.source_url);
                if (p.sourceLinks && Array.isArray(p.sourceLinks)) p.sourceLinks.forEach((l: string) => {
                    if (isValidLink(l)) uniqueLinks.add(l);
                });

                // Signals
                (p.signals || []).forEach((s: any) => {
                    uniqueSignals[s.id] = s;
                    if (isValidLink(s.url)) uniqueLinks.add(s.url);
                });

                // People
                (p.key_people || []).forEach((person: string) => allIndividuals.add(person));

                // Images
                if (p.image_url) allImages.add(p.image_url);
            });

            const mergedSignals = Object.values(uniqueSignals);

            // Dates
            // Dates (Safe Parsing)
            const dateObjs = mergedSignals.map((s: any) => s.article_date ? new Date(s.article_date).getTime() : (s.created_at ? new Date(s.created_at).getTime() : NaN)).filter(t => !isNaN(t));
            group.forEach(p => { if (p.serverCreatedAt) dateObjs.push(new Date(p.serverCreatedAt).getTime()); });
            if (dateObjs.length === 0) dateObjs.push(Date.now());

            const firstTs = Math.min(...dateObjs);
            const lastTs = Math.max(...dateObjs);

            // Helper: Find first valid value
            const val = (k: string) => group.find(p => p[k])?.[k];

            // Coords: Prioritize 'location' > 'coordinates'
            let coords = null;
            for (const p of group) {
                if (p.location?.lat) { coords = { lat: p.location.lat, lng: p.location.lng }; break; }
                if (p.coordinates?.lat) { coords = { lat: p.coordinates.lat, lng: p.coordinates.lng }; break; }
            }

            const derivedCity = val('city') || val('address')?.split(',')[1]?.trim() || "Unknown";

            return {
                id: base.id, // Primary ID
                name: val('name') || "Unknown",
                address: val('address') || "Unknown",
                city: derivedCity,
                developer: val('developer') || "Unknown",
                architect: val('architect') || "Unknown",
                lender: val('lender') || "TBD",
                salesTeam: val('sales_team') || "TBD",

                individuals: Array.from(allIndividuals),
                stakeholderList: parseStakeholders(Array.from(allIndividuals)),

                gdv: val('gdv') || "TBD",
                gdvValue: parseGDV(val('gdv')),
                floors: val('stats')?.stories || val('floors') || 0,
                units: val('stats')?.units || val('units') || 0,
                stage: val('status_stage') || "Planning",
                expectedDelivery: val('delivery_date') || "TBD",

                firstDetected: new Date(firstTs).toLocaleDateString(),
                firstDetectedTime: firstTs,
                latestUpdate: new Date(lastTs).toLocaleDateString(),
                latestUpdateTime: lastTs, // Used for sorting 'newest'

                isNew: (Date.now() - firstTs) / 86400000 < 30, // "New" if article is < 30 days old
                image: val('image_url') || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
                gallery: Array.from(allImages),
                description: val('description') || null,

                timeline: mergedSignals.map((s: any) => ({
                    id: s.id,
                    date: s.article_date ? new Date(s.article_date).toLocaleDateString() : new Date(s.created_at).toLocaleDateString(),
                    source: s.url ? new URL(s.url).hostname.replace('www.', '') : 'System',
                    title: "Signal Detected",
                    url: s.url,
                    type: 'system' as const
                })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

                sourceLinks: Array.from(uniqueLinks),
                coordinates: coords,
                isFavorite: false
            };
        });
    }, [data]);

    // --- LOGIC: FILTER & SORT ---
    const processedProjects = useMemo(() => {
        let result = [...projects];

        // 1. Filter
        if (activeFilters.length > 0) {
            result = result.filter(p => activeFilters.every(f => {
                const val = f.value.toLowerCase();
                if (f.type === 'search') {
                    // Deep search
                    return (
                        p.name.toLowerCase().includes(val) ||
                        p.developer.toLowerCase().includes(val) ||
                        p.address.toLowerCase().includes(val) ||
                        p.city.toLowerCase().includes(val)
                    );
                }
                if (f.type === 'stage') return p.stage.toLowerCase() === val;
                return true;
            }));
        }

        // 2. Sort
        result.sort((a, b) => {
            if (sortMode === 'smart_rank') {
                const now = Date.now();
                // Weight: GDV (Value) + Recency (Freshness)
                const daysA = Math.max(0, (now - a.firstDetectedTime) / 86400000);
                const daysB = Math.max(0, (now - b.firstDetectedTime) / 86400000);
                const scoreA = (a.gdvValue || 1e7) / Math.pow(daysA + 1, 1.5);
                const scoreB = (b.gdvValue || 1e7) / Math.pow(daysB + 1, 1.5);
                return scoreB - scoreA;
            }
            if (sortMode === 'newest') return b.firstDetectedTime - a.firstDetectedTime;
            if (sortMode === 'gdv_high') return b.gdvValue - a.gdvValue;
            return 0;
        });

        return result;
    }, [projects, activeFilters, sortMode]);

    // --- HANDLERS ---
    useEffect(() => {
        const handleResize = () => { setIsMobile(window.innerWidth < 1024); if (window.innerWidth >= 1024) setIsMobileMenuOpen(false); };
        window.addEventListener('resize', handleResize); handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const toggleSidebar = () => setIsSidebarExpanded(!isSidebarExpanded);
    const addFilter = (type: 'search' | 'stage', value: string, label?: string) => {
        setActiveFilters(p => [...p, { id: Math.random().toString(36), type, value, label: label || value }]); setSearchInput('');
    };
    const removeFilter = (id: string) => setActiveFilters(p => p.filter(f => f.id !== id));

    if (isLoading) return <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-zinc-500 font-mono animate-pulse">INITIALIZING TOWER SCOUT...</div>;
    if (error) return <div className="h-screen w-full bg-[#050505] flex items-center justify-center text-red-500 font-mono">SYSTEM ERROR: CONNECTION LOST</div>;

    return (
        <>
            <div className="relative flex h-screen w-full bg-[#050505] text-zinc-100 font-sans overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/5 rounded-full blur-[120px]" /><div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-600/5 rounded-full blur-[120px]" /></div>

                <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#050505] border-r border-white/5 transition-all duration-300 ease-in-out ${isMobile ? (isMobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full w-64') : (isSidebarExpanded ? 'w-64' : 'w-20')}`}>
                    <div className={`flex h-16 items-center border-b border-white/5 shrink-0 ${isSidebarExpanded ? 'px-6 justify-between' : 'justify-center'}`}>
                        <div className={`flex items-center overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-violet-600 text-white font-bold text-sm">TS</div><span className="ml-4 font-bold text-sm tracking-wider uppercase whitespace-nowrap">Tower Scout</span></div>
                        {!isMobile && <button onClick={toggleSidebar} className="text-zinc-500 hover:text-white p-2"><Menu size={20} /></button>}
                        {isMobile && <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-white p-2"><X size={20} /></button>}
                    </div>
                    <nav className="flex-1 py-6 px-3 flex flex-col gap-1">
                        <GlassNavItem icon={<LayoutTemplate size={20} />} label="Dashboard" isActive={activeTab === 'dashboard'} expanded={isSidebarExpanded || isMobile} onClick={() => setActiveTab('dashboard')} />
                        <GlassNavItem icon={<MapIcon size={20} />} label="Asset Map" isActive={activeTab === 'map'} expanded={isSidebarExpanded || isMobile} onClick={() => setActiveTab('map')} />
                        <GlassNavItem icon={<Building2 size={20} />} label="Projects" isActive={activeTab === 'projects'} expanded={isSidebarExpanded || isMobile} onClick={() => setActiveTab('projects')} />
                        <GlassNavItem icon={<Bookmark size={20} />} label="Watchlist" isActive={activeTab === 'favorites'} expanded={isSidebarExpanded || isMobile} onClick={() => setActiveTab('favorites')} />
                        <div className="my-4 border-t border-white/5 mx-3" />
                        <GlassNavItem icon={<Settings size={20} />} label="Settings" isActive={activeTab === 'settings'} expanded={isSidebarExpanded || isMobile} onClick={() => setActiveTab('settings')} />
                    </nav>
                </aside>

                {isMobile && isMobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />}

                <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${isMobile ? 'ml-0' : (isSidebarExpanded ? 'ml-64' : 'ml-20')}`}>
                    <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-40">
                        <div className="flex items-center gap-6 flex-1 max-w-xl">
                            {isMobile && <button onClick={() => setIsMobileMenuOpen(true)} className="text-zinc-400"><Menu size={22} /></button>}
                            <div className="relative w-full">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                                <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchInput.trim() && addFilter('search', searchInput.trim(), `Search: "${searchInput}"`)} className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2 pl-10 pr-4 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/30 transition-all" placeholder="Search developments, developers, agents..." />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <SystemStatusBadge status={'live'} />
                            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] text-zinc-400">ME</div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto bg-[#050505] relative">
                        {activeTab === 'dashboard' && <div className="p-8"><DashboardView projects={processedProjects} activeFilters={activeFilters} removeFilter={removeFilter} addFilter={addFilter} sortMode={sortMode} setSortMode={setSortMode} onSelectProject={setSelectedProject} /></div>}
                        {activeTab === 'map' && <div className="absolute inset-0 top-0 left-0 right-0 bottom-0"><RealMapView projects={processedProjects} onSelectProject={setSelectedProject} /></div>}
                        {(activeTab === 'projects' || activeTab === 'favorites') && (
                            <div className="p-8"><ProjectsView projects={activeTab === 'favorites' ? processedProjects.filter(p => p.isFavorite) : processedProjects} onSelectProject={setSelectedProject} activeFilters={activeFilters} removeFilter={removeFilter} addFilter={addFilter} sortMode={sortMode} setSortMode={setSortMode} /></div>
                        )}
                        {activeTab === 'settings' && <div className="p-8"><SettingsView /></div>}
                    </main>
                </div>

                <ProjectDrawer project={selectedProject} onClose={() => setSelectedProject(null)} />
                {projects && <GlobalSyncFooter projects={projects} />}
            </div>
            <Agentation />
        </>
    );
}

// --- VIEWS ---

function DashboardView({ projects, activeFilters, removeFilter, addFilter, sortMode, setSortMode, onSelectProject }: any) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-white">Command Center</h1>
                <p className="text-sm text-zinc-500 mt-1">Market pulse and harvester performance.</p>
            </div>
            <DashboardMetrics projects={projects} />
            <DynamicChart projects={projects} />
            <ProjectsView projects={projects} onSelectProject={onSelectProject} activeFilters={activeFilters} removeFilter={removeFilter} addFilter={addFilter} sortMode={sortMode} setSortMode={setSortMode} />
        </div>
    );
}

function DashboardMetrics({ projects }: { projects: Project[] }) {
    const totalGDV = projects.reduce((acc, p) => acc + p.gdvValue, 0);
    const gdvLabel = totalGDV > 1e9 ? `$${(totalGDV / 1e9).toFixed(1)}B` : `$${(totalGDV / 1e6).toFixed(1)}M`;
    const totalProjects = projects.length;
    const now = new Date();
    const newSignals = projects.filter(p => (now.getTime() - p.firstDetectedTime) / 3600000 < 24).length;
    const cities = useMemo(() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => { if (p.city) counts[p.city] = (counts[p.city] || 0) + 1; });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const max = sorted[0]?.[1] || 1;
        return sorted.map(([c, v]) => ({ city: c, val: v, pct: (v / max) * 100 }));
    }, [projects]);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Tracked GDV" value={gdvLabel} trend="Live Estimate" context="Pipeline Value" trendUp icon={<DollarSign size={16} />} />
                <MetricCard label="Active Projects" value={totalProjects.toString()} trend="+14" context="vs last week" trendUp icon={<Building2 size={16} />} />
                <MetricCard label="New Signals (24h)" value={newSignals.toString()} trend="High Activity" context="above avg" trendUp highlight icon={<Activity size={16} />} />
                <div className="p-5 rounded-xl border bg-white/[0.02] border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2"><span className="text-xs text-zinc-400">Top Markets</span><BarChart3 size={14} className="text-zinc-600" /></div>
                    <div className="space-y-2">{cities.length > 0 ? cities.map((c, i) => (<div key={i} className="flex items-center gap-2"><div className="text-[10px] text-zinc-500 w-20 truncate">{c.city}</div><div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden"><div style={{ width: `${c.pct}%` }} className="h-full bg-violet-500/50 rounded-full" /></div><div className="text-[10px] font-mono text-zinc-300 w-4 text-right">{c.val}</div></div>)) : <div className="text-[10px] text-zinc-600 italic">No city data yet.</div>}</div>
                </div>
            </div>
        </div>
    );
}

// --- QUARTERLY CHART LOGIC ---
function DynamicChart({ projects }: { projects: Project[] }) {
    const data = useMemo(() => {
        // Group by Year-Quarter
        const groups: Record<string, number> = {};
        const now = new Date();
        // Init last 4 quarters + current
        for (let i = 4; i >= 0; i--) {
            const d = new Date(); d.setMonth(now.getMonth() - (i * 3));
            const q = Math.floor(d.getMonth() / 3) + 1;
            groups[`Q${q}-${d.getFullYear().toString().substr(2)}`] = 0;
        }

        projects.forEach(p => {
            const d = new Date(p.firstDetectedTime);
            const key = `Q${Math.floor(d.getMonth() / 3) + 1}-${d.getFullYear().toString().substr(2)}`;
            if (groups[key] !== undefined) groups[key]++;
        });

        const keys = Object.keys(groups);
        const max = Math.max(...Object.values(groups), 1);
        return keys.map(k => ({ label: k, val: groups[k], pct: Math.max(5, (groups[k] / max) * 100) }));
    }, [projects]);

    return (
        <div className="grid grid-cols-1 gap-6"><div className="p-6 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden"><div className="flex items-center justify-between mb-6"><h3 className="text-sm font-bold text-zinc-200">Launches by Quarter</h3><div className="flex gap-2"><span className="px-2 py-1 rounded bg-violet-500/10 text-[10px] text-violet-400 font-mono">NATIONAL</span></div></div><div className="h-48 flex items-end justify-between gap-4 px-4">{data.map((d, i) => (<div key={i} className="w-full flex flex-col items-center gap-2 group"><div className="w-full bg-zinc-800/20 rounded-t-sm relative h-full flex items-end"><div style={{ height: `${d.pct}%` }} className={`w-full rounded-t-sm transition-all duration-500 bg-violet-600/80 group-hover:bg-violet-500`} /></div><span className="text-[10px] text-zinc-600 font-mono uppercase">{d.label}</span></div>))}</div></div></div>
    )
}

function SettingsView() {
    const { data } = db.useQuery({ sources: { $: { limit: 100 } } });
    const sources = data?.sources || [];
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl"><div className="flex flex-col"><h1 className="text-2xl font-bold tracking-tight text-white">System Settings</h1><p className="text-sm text-zinc-500 mt-1">Configure sources and monitor harvester health.</p></div><div className="bg-white/[0.02] border border-white/5 rounded-xl overflow-hidden"><div className="px-6 py-4 border-b border-white/5 flex items-center justify-between"><h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2"><Activity size={16} className="text-violet-500" /> Source Intelligence Monitor</h3><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span><span className="text-xs text-zinc-400 font-mono">SYSTEM OPERATIONAL</span></div></div><div className="divide-y divide-white/5">{sources.map((s: any) => <SourceMonitorRow key={s.id} source={s} />)}</div></div></div>
    );
}

// --- PROJECT LIST ---

const DEFAULT_COLUMNS: ColumnConfig[] = [
    { id: 'identity', label: 'Identity', width: 320 },
    { id: 'dates', label: 'Signal', width: 140 },
    { id: 'vitals', label: 'Vitals', width: 192 },
    { id: 'stakeholders', label: 'Stakeholders', width: 280 },
    { id: 'status', label: 'Status', width: 192 },
];

function ProjectsView({ projects, onSelectProject, activeFilters, removeFilter, addFilter, sortMode, setSortMode }: any) {
    const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
    const handleResize = (colId: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); const startX = e.clientX; const colIndex = columns.findIndex(c => c.id === colId); const startWidth = columns[colIndex].width; const onMouseMove = (moveEvent: MouseEvent) => { const delta = moveEvent.clientX - startX; setColumns(prev => { const n = [...prev]; n[colIndex] = { ...n[colIndex], width: Math.max(100, startWidth + delta) }; return n; }); }; const onMouseUp = () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp); document.body.style.cursor = 'default'; }; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', onMouseUp); document.body.style.cursor = 'col-resize'; };
    const totalWidth = columns.reduce((acc, col) => acc + col.width, 0) + 80;

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div className="flex items-center gap-4"><div><h1 className="text-2xl font-bold tracking-tight text-white">Project Index</h1><p className="text-sm text-zinc-500 mt-1">Live updates from the Intelligence Network</p></div></div>
                <div className="flex items-center gap-3 w-full overflow-hidden relative z-30">
                    <div className="flex flex-col items-center justify-center px-5 py-2 bg-white/[0.02] border border-white/10 rounded-lg shrink-0"><span className="text-2xl font-bold text-white leading-none font-mono">{projects.length}</span><span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Projects</span></div>
                    <div className="h-10 w-px bg-white/10 mx-1 shrink-0" />
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 pr-2 w-full no-scrollbar">
                        {activeFilters?.map((f: any) => (<div key={f.id} className="flex items-center gap-2 px-2 py-1 rounded bg-violet-600/20 border border-violet-500/30 text-[10px] font-bold text-violet-300 animate-in zoom-in duration-200 shrink-0"><span>{f.label}</span><button onClick={() => removeFilter(f.id)}><X size={10} /></button></div>))}
                        <div className="relative group shrink-0"><button className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-white/10"><Filter size={14} /> Add Filter</button><div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl p-1 hidden group-hover:block z-50"><button onClick={() => addFilter('stage', 'Planning')} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5">Stage: Planning</button><button onClick={() => addFilter('stage', 'Construction')} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5">Stage: Construction</button></div></div>
                        <div className="relative group shrink-0"><button className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-medium text-zinc-400 hover:bg-white/10"><ArrowUpDown size={14} /> Sort: {sortMode}</button><div className="absolute right-0 top-full mt-2 w-48 bg-[#111] border border-white/10 rounded-lg shadow-xl p-1 hidden group-hover:block z-50"><button onClick={() => setSortMode('smart_rank')} className="w-full text-left px-3 py-2 text-xs text-violet-400 hover:bg-white/5">Smart Rank</button><button onClick={() => setSortMode('newest')} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5">Newest</button><button onClick={() => setSortMode('gdv_high')} className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-white/5">Highest Value</button></div></div>
                    </div>
                </div>
            </div>
            <div className="relative border border-white/5 rounded-xl bg-white/[0.01] overflow-hidden">
                <div className="overflow-x-auto pb-2 custom-scrollbar">
                    <div className="flex flex-col divide-y divide-white/5" style={{ minWidth: totalWidth }}>
                        <div className="flex items-center bg-white/[0.02] text-[10px] font-mono text-zinc-500 uppercase tracking-wider sticky top-0 z-10 h-10 border-b border-white/5">
                            {columns.map(col => (<div key={col.id} style={{ width: col.width }} className="shrink-0 h-full flex items-center px-4 relative border-r border-transparent group"><span className="group-hover:text-zinc-300 select-none">{col.label}</span><div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-violet-500/50 group-hover:bg-white/10" onMouseDown={(e) => handleResize(col.id, e)} /></div>))}
                            <div className="w-20 shrink-0 text-right pr-4 font-bold">Actions</div>
                        </div>
                        {projects.length === 0 ? <div className="p-8 text-center text-zinc-500 font-mono italic">Waiting for signals...</div> : projects.map((p: any) => <ProjectRowPrecision key={p.id} project={p} columns={columns} onSelect={() => onSelectProject(p)} />)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProjectRowPrecision({ project, columns, onSelect }: { project: Project, columns: ColumnConfig[], onSelect: () => void }) {
    const renderCell = (col: ColumnConfig) => {
        switch (col.id) {
            case 'identity': return (<div key={col.id} style={{ width: col.width }} className="shrink-0 flex items-center h-full border-r border-white/5 pl-2 overflow-hidden"><div className="w-16 h-10 shrink-0 rounded overflow-hidden border border-white/10 relative"><img src={project.image} className="w-full h-full object-cover" /></div><div className="flex flex-col justify-center ml-3 min-w-0 pr-4 flex-1"><h3 className="text-sm font-bold text-zinc-100 truncate">{project.name}</h3><div className="flex items-center gap-1 text-[11px] text-zinc-500 mt-0.5"><MapPin size={10} /><span className="truncate">{project.address}</span></div></div></div>);
            case 'dates': return (
                <div key={col.id} style={{ width: col.width }} className="shrink-0 px-4 flex flex-col justify-center h-full border-r border-white/5">
                    <div className="flex justify-between w-full mb-0.5"><span className="text-[9px] text-zinc-600 uppercase">First</span><span className="text-[10px] font-mono text-zinc-300">{project.firstDetected}</span></div>
                    <div className="flex justify-between w-full"><span className="text-[9px] text-zinc-600 uppercase">Latest</span><span className="text-[10px] font-mono text-violet-400 font-bold">{project.latestUpdate}</span></div>
                </div>
            );
            case 'vitals': return (<div key={col.id} style={{ width: col.width }} className="shrink-0 px-4 flex flex-col justify-center h-full border-r border-white/5 bg-white/[0.01]"><div className="flex justify-between mb-1"><span className="text-[10px] text-zinc-600 font-mono uppercase">GDV</span><span className="text-xs font-bold text-violet-400 font-mono ml-2">{project.gdv || "TBD"}</span></div><div className="flex justify-between"><span className="text-[10px] text-zinc-600 font-mono uppercase">Scale</span><div className="text-[11px] text-zinc-400 font-medium ml-2">{project.floors || "?"}fl / {project.units || "?"}u</div></div></div>);
            case 'stakeholders': return (<div key={col.id} style={{ width: col.width }} className="shrink-0 px-4 flex flex-col justify-center h-full border-r border-white/5"><div className="flex items-center gap-2 mb-1"><Briefcase size={10} className="text-zinc-600" /><span className="text-[11px] font-semibold text-zinc-300 truncate">{project.developer || "Unknown"}</span></div><div className="flex items-center gap-2"><Trophy size={10} className="text-zinc-600" /><span className="text-[10px] text-zinc-500 truncate">{project.salesTeam || "TBD"}</span></div></div>);
            case 'status': return (<div key={col.id} style={{ width: col.width }} className="shrink-0 flex items-center justify-between px-4 h-full bg-white/[0.01] border-r border-white/5"><div className="flex flex-col w-full"><div className="flex items-center gap-1.5 mb-1"><div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(project.stage)}`} /><span className="text-[10px] font-bold text-zinc-300 uppercase truncate">{project.stage}</span></div><span className="text-[9px] text-zinc-600 font-mono">Due {project.expectedDelivery}</span></div></div>);
            default: return null;
        }
    };
    return (
        <div onClick={onSelect} className="group flex items-center hover:bg-white/[0.04] transition-all duration-75 h-16 cursor-pointer relative border-b border-white/5">
            {project.isNew && <div className="absolute top-0 left-0 bg-violet-600 text-[8px] font-black text-white px-1.5 py-0.5 z-10 rounded-br shadow-lg">NEW</div>}
            {columns.map(col => renderCell(col))}
            <div className="w-20 shrink-0 flex items-center justify-center gap-1 h-full bg-white/[0.02]"><button onClick={(e) => { e.stopPropagation(); if (!USE_DEMO_DATA) { db.transact(tx.projects[project.id].update({ isFavorite: !project.isFavorite })); } }} className={`p-1.5 rounded-md transition-colors ${project.isFavorite ? 'text-violet-400 bg-violet-500/10' : 'text-zinc-600 hover:text-white'}`}><Bookmark size={16} fill={project.isFavorite ? "currentColor" : "none"} /></button><div className="p-1.5 text-zinc-600 hover:text-white rounded-md"><ChevronRight size={16} /></div></div>
        </div>
    );
}

function RealMapView({ projects, onSelectProject }: { projects: Project[], onSelectProject: (p: Project) => void }) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        loadLeaflet().then((L: any) => {
            setIsLoading(false);
            if (!mapContainerRef.current) return;
            const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView([39.8, -98.5], 4);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
            if (projects.length > 0) { const bounds = L.latLngBounds(projects.filter(p => p.coordinates).map(p => [p.coordinates!.lat, p.coordinates!.lng])); map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 }); }
            projects.forEach((p: Project) => {
                if (!p.coordinates) return;
                const html = `<div class="flex flex-col items-center transform hover:scale-110 transition-transform cursor-pointer"><div class="px-2 py-1 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-2 ${p.isNew ? 'bg-violet-600/90 border-violet-400 text-white' : 'bg-zinc-900/90 border-zinc-700 text-zinc-200'}"><span class="text-[10px] font-bold font-mono">${p.gdv || "N/A"}</span></div><div class="w-0.5 h-2 bg-white/30"></div></div>`;
                const marker = L.marker([p.coordinates!.lat, p.coordinates!.lng], { icon: L.divIcon({ html, className: '', iconSize: [60, 40], iconAnchor: [30, 40] }) }).addTo(map);
                marker.on('click', () => onSelectProject(p)); marker.on('mouseover', () => setHovered(p)); marker.on('mouseout', () => setHovered(null));
            });
        });
    }, [projects]);
    return (<div className="absolute inset-0 bg-[#09090b] overflow-hidden">{isLoading && <div className="absolute inset-0 flex items-center justify-center z-50"><Loader2 className="animate-spin text-violet-500" size={32} /></div>}<div ref={mapContainerRef} className="w-full h-full z-0" />{hovered && <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none animate-in fade-in slide-in-from-bottom-2"><div className="bg-[#0A0A0A]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-xl w-64"><div className="h-24 w-full rounded-lg overflow-hidden mb-3 relative"><img src={hovered.image} className="w-full h-full object-cover" /><span className="absolute bottom-2 left-2 text-[10px] font-bold text-white uppercase tracking-widest">{hovered.stage}</span></div><h3 className="text-sm font-bold text-white truncate">{hovered.name}</h3><div className="text-[10px] text-zinc-400">{hovered.address}</div></div></div>}<div className="absolute bottom-8 right-8 flex flex-col gap-2 z-[900]"><button className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:bg-zinc-800"><Plus size={20} /></button><button className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white hover:bg-zinc-800"><Minus size={20} /></button></div></div>);
}

function DossierMap({ project }: { project: Project }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { loadLeaflet().then((L: any) => { if (ref.current && project.coordinates) { const m = L.map(ref.current, { zoomControl: false, dragging: false, scrollWheelZoom: false, doubleClickZoom: false }).setView([project.coordinates.lat, project.coordinates.lng], 16); L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(m); L.circle([project.coordinates.lat, project.coordinates.lng], { color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.1, radius: 150 }).addTo(m); const i = L.divIcon({ html: `<div class="w-3 h-3 bg-white rounded-full border-2 border-violet-600 shadow-[0_0_10px_#7c3aed]"></div>`, className: '', iconSize: [12, 12] }); L.marker([project.coordinates.lat, project.coordinates.lng], { icon: i }).addTo(m); setTimeout(() => m.invalidateSize(), 200); } }); }, [project]);
    if (!project.coordinates) return <div className="w-full h-64 rounded-xl overflow-hidden border border-white/10 bg-[#111] flex items-center justify-center text-zinc-500 text-xs font-mono">LOCATION DATA UNAVAILABLE</div>;
    return <div className="w-full h-64 rounded-xl overflow-hidden relative group border border-white/10 bg-[#111]"><div ref={ref} className="w-full h-full z-0 pointer-events-none" /><div className="absolute top-4 right-4 flex gap-2"><div className="bg-black/60 px-2 py-1 rounded border border-white/10 text-[9px] font-mono text-zinc-400">{project.coordinates.lat.toFixed(4)} N</div><div className="bg-black/60 px-2 py-1 rounded border border-white/10 text-[9px] font-mono text-zinc-400">{project.coordinates.lng.toFixed(4)} W</div></div></div>;
}

// --- HELPER: Global Sync Time ---
function GlobalSyncFooter({ projects }: { projects: Project[] }) {
    const lastSync = useMemo(() => {
        if (projects.length === 0) return new Date();
        const max = Math.max(...projects.map(p => p.latestUpdateTime));
        return new Date(max);
    }, [projects]);
    return <div className="fixed bottom-2 right-2 z-50 text-[9px] font-mono text-zinc-600 bg-black/60 backdrop-blur px-2 py-1 rounded border border-white/5 pointer-events-none uppercase">System Live: {lastSync.toLocaleTimeString()}</div>
}

function ProjectDrawer({ project, onClose }: { project: Project | null, onClose: () => void }) {
    const [open, setOpen] = useState({ intelligence: true, stakeholders: true, links: true, gallery: true });
    if (!project) return null;
    const toggle = (k: keyof typeof open) => setOpen(p => ({ ...p, [k]: !p[k] }));
    return (<><div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} /><div className="fixed inset-y-0 right-0 z-50 w-full md:w-[600px] bg-[#0A0A0A] border-l border-zinc-800 shadow-2xl overflow-y-auto"><div className="relative h-72"><img src={project.image} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent" /><button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 rounded-full text-white"><X size={18} /></button><div className="absolute bottom-8 left-8"><h2 className="text-3xl font-bold text-white">{project.name}</h2></div></div><div className="p-8 space-y-8">
        <div className="flex items-center gap-8 border-b border-white/5 pb-6">
            <div className="flex flex-col gap-1"><span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">First Detected</span><span className="text-xs font-mono text-zinc-200">{project.firstDetected}</span></div>
            <div className="flex flex-col gap-1"><span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Latest Update</span><span className="text-xs font-mono text-violet-400 font-bold">{project.latestUpdate}</span></div>
            <div className="flex flex-col gap-1"><span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Sources</span><span className="text-xs font-mono text-zinc-200">{project.sourceLinks.length} Files</span></div>
        </div>
        <div className="space-y-4"><button onClick={() => toggle('intelligence')} className="w-full flex justify-between group"><h3 className="text-sm font-bold text-zinc-100 flex gap-2"><Zap size={16} className="text-violet-500" /> Intelligence Brief</h3>{open.intelligence ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{open.intelligence && (<div className="bg-white/[0.02] p-4 rounded-lg border border-white/5">{project.description ? <p className="text-sm leading-relaxed text-zinc-400">{project.description}</p> : <div className="flex flex-col gap-3"><div className="flex items-center gap-2 text-violet-400 text-xs font-bold animate-pulse"><Loader2 size={12} className="animate-spin" /> AI ANALYZING... (Est. {project.isNew ? '<2m' : '5m'})</div></div>}</div>)}</div><div className="space-y-4"><button onClick={() => toggle('stakeholders')} className="w-full flex justify-between group"><h3 className="text-sm font-bold text-zinc-100 flex gap-2"><TableIcon size={16} className="text-blue-500" /> Stakeholder Roster</h3>{open.stakeholders ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{open.stakeholders && (<div className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden"><table className="w-full text-left"><thead className="bg-white/[0.02] text-[10px] uppercase text-zinc-500 font-mono"><tr><th className="px-4 py-2">Role</th><th className="px-4 py-2">Entity / Person</th></tr></thead><tbody className="divide-y divide-white/5 text-xs text-zinc-300"><tr><td className="px-4 py-2 font-medium text-zinc-500">Developer</td><td className="px-4 py-2">{project.developer || "-"}</td></tr><tr><td className="px-4 py-2 font-medium text-zinc-500">Architect</td><td className="px-4 py-2">{project.architect || "-"}</td></tr><tr><td className="px-4 py-2 font-medium text-zinc-500">Sales</td><td className="px-4 py-2">{project.salesTeam || "-"}</td></tr><tr><td className="px-4 py-2 font-medium text-zinc-500">Lender</td><td className="px-4 py-2">{project.lender || "-"}</td></tr>{project.stakeholderList.map((p, i) => <tr key={i}><td className="px-4 py-2 font-medium text-zinc-500">{p.role}</td><td className="px-4 py-2">{p.name}</td></tr>)}</tbody></table></div>)}</div><div className="space-y-4"><button onClick={() => toggle('gallery')} className="w-full flex justify-between group"><h3 className="text-sm font-bold text-zinc-100 flex gap-2"><ImageIcon size={16} className="text-emerald-500" /> Renderings</h3>{open.gallery ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{open.gallery && (<div className="grid grid-cols-2 gap-2">{project.gallery.length > 0 ? project.gallery.map((img, i) => <div key={i} className="aspect-video rounded-lg overflow-hidden border border-white/5 relative group/img cursor-pointer"><img src={img} className="w-full h-full object-cover" /></div>) : <div className="col-span-2 p-8 border border-white/5 border-dashed rounded-lg flex flex-col items-center justify-center text-zinc-600 gap-2"><ImageIcon size={24} /><span className="text-xs">No additional renderings.</span></div>}</div>)}</div><div className="space-y-4"><button onClick={() => toggle('links')} className="w-full flex justify-between group"><h3 className="text-sm font-bold text-zinc-100 flex gap-2"><LinkIcon size={16} className="text-blue-500" /> Source Data Links</h3>{open.links ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>{open.links && (<div className="flex flex-col gap-2 bg-white/[0.02] border border-white/5 rounded-lg p-3">{project.sourceLinks.length > 0 ? project.sourceLinks.map((link, i) => <a key={i} href={link} target="_blank" className="flex items-center gap-3 p-2 hover:bg-white/5 rounded transition-colors group/link"><div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center text-zinc-500 text-xs font-bold">{i + 1}</div><div className="flex-1 min-w-0"><div className="text-xs text-zinc-300 truncate group-hover/link:text-blue-400">{link.length > 50 ? new URL(link).hostname + '/...' + link.slice(-15) : link}</div></div><ExternalLink size={12} className="text-zinc-600 group-hover/link:text-white" /></a>) : <span className="text-xs text-zinc-500 italic">No direct links available.</span>}</div>)}</div><div className="space-y-4 pt-4 border-t border-white/5"><h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2"><MapIcon size={16} className="text-zinc-400" /> Location Intelligence</h3><DossierMap project={project} /></div></div></div></>);
}

function MetricCard({ label, value, trend, context, trendUp, highlight, icon }: any) { return <div className={`p-5 rounded-xl border ${highlight ? 'bg-violet-900/10 border-violet-500/30' : 'bg-white/[0.02] border-white/5'}`}><div className="flex justify-between mb-4"><div className={`p-2 rounded-lg ${highlight ? 'bg-violet-500 text-white' : 'bg-white/5 text-zinc-400'}`}>{icon}</div>{highlight && <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />}</div><div className="text-2xl font-bold text-white font-mono">{value}</div><div className="text-xs text-zinc-500 mt-1">{label}</div></div> }
function SourceMonitorRow({ source }: any) { const active = (Date.now() - new Date(source.last_crawled || 0).getTime()) < 86400000; return <tr className="border-b border-white/5"><td className="px-6 py-3 flex gap-3 text-sm text-zinc-300"><Globe size={14} />{source.url}</td><td className="px-6 py-3">{active ? <span className="text-emerald-500 text-[10px] font-bold">ACTIVE</span> : <span className="text-zinc-500 text-[10px]">IDLE</span>}</td><td className="px-6 py-3 text-right text-xs font-mono text-violet-400">Next: ~15m</td></tr> }
function SystemStatusBadge({ status }: { status: SystemStatus }) { return <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-emerald-500/5"><div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-[10px] font-black tracking-widest text-emerald-400">LIVE</span></div> }
function GlassNavItem({ icon, label, isActive, expanded, onClick }: any) { return <button onClick={onClick} className={`group relative flex items-center h-12 transition-all rounded-xl ${isActive ? 'bg-violet-600/10 text-violet-400 border border-violet-500/20' : 'text-zinc-500 hover:text-white'} ${expanded ? 'px-4 w-full' : 'w-12 justify-center mx-auto'}`}><span className={`${isActive ? 'text-violet-400' : 'group-hover:text-white'}`}>{icon}</span>{expanded && <span className="ml-4 text-sm font-bold">{label}</span>}</button> }
function getStatusColor(stage: string) { switch (stage) { case 'Construction': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'; case 'Planning': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]'; default: return 'bg-zinc-500'; } }