'use client';

import React, { useState } from 'react';
import { X, MapPin, Building2, DollarSign, Users, Calendar, ExternalLink, Phone, Mail, ChevronRight, Image as ImageIcon, FileText, TrendingUp, Briefcase, Award } from 'lucide-react';
import { Project, formatCurrency } from '@/lib/demoData';

interface ProjectDetailProps {
    project: Project;
    onClose: () => void;
}

export default function ProjectDetail({ project, onClose }: ProjectDetailProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'team' | 'timeline' | 'gallery'>('overview');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const stageColors: Record<string, string> = {
        'Planning': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'Demo': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'Construction': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        'Active Sales': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'Completed': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
    };

    const timelineTypeColors: Record<string, string> = {
        'permit': 'bg-blue-500/20 text-blue-400',
        'financial': 'bg-emerald-500/20 text-emerald-400',
        'system': 'bg-violet-500/20 text-violet-400'
    };

    // Mock gallery images for demo
    const galleryImages = project.gallery?.length > 0 ? project.gallery : [
        project.image,
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10">
                            <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{project.name}</h2>
                            <div className="flex items-center gap-2 text-sm text-zinc-400 mt-1">
                                <MapPin size={14} />
                                <span>{project.address}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${stageColors[project.stage] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}`}>
                            {project.stage}
                        </span>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} className="text-zinc-400" />
                        </button>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex items-center gap-1 p-2 border-b border-white/10 bg-white/[0.01]">
                    {[
                        { id: 'overview', label: 'Overview', icon: Building2 },
                        { id: 'financials', label: 'Financials', icon: DollarSign },
                        { id: 'team', label: 'Team & Contacts', icon: Users },
                        { id: 'timeline', label: 'Timeline', icon: Calendar },
                        { id: 'gallery', label: 'Gallery', icon: ImageIcon }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab.id 
                                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/30' 
                                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">GDV</div>
                                    <div className="text-2xl font-bold text-violet-400 font-mono">{project.gdv}</div>
                                </div>
                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Units</div>
                                    <div className="text-2xl font-bold text-white font-mono">{project.units}</div>
                                </div>
                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Floors</div>
                                    <div className="text-2xl font-bold text-white font-mono">{project.floors}</div>
                                </div>
                                <div className="p-4 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Delivery</div>
                                    <div className="text-2xl font-bold text-white font-mono">{project.expectedDelivery}</div>
                                </div>
                            </div>

                            {/* Description */}
                            {project.description && (
                                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                        <FileText size={18} className="text-violet-400" />
                                        Project Description
                                    </h3>
                                    <p className="text-zinc-300 leading-relaxed">{project.description}</p>
                                </div>
                            )}

                            {/* Product Details */}
                            {project.product && (
                                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Award size={18} className="text-violet-400" />
                                        Product Specifications
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Property Type</div>
                                            <div className="text-white font-medium">{project.product.type}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Price Range</div>
                                            <div className="text-emerald-400 font-mono font-medium">{project.product.priceRange}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Price Per Sq Ft</div>
                                            <div className="text-zinc-300 font-mono text-sm">
                                                {project.product.pricePerSqft.min} - {project.product.pricePerSqft.max}
                                                <span className="text-violet-400 ml-2">(avg: {project.product.pricePerSqft.avg})</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {project.product.amenities && (
                                        <div className="mt-4">
                                            <div className="text-xs text-zinc-500 uppercase mb-2">Amenities</div>
                                            <div className="flex flex-wrap gap-2">
                                                {project.product.amenities.map((amenity, i) => (
                                                    <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300">
                                                        {amenity}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Unit Mix */}
                            {project.unitMix && (
                                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Building2 size={18} className="text-violet-400" />
                                        Unit Mix
                                    </h3>
                                    <div className="space-y-3">
                                        {project.unitMix.map((unit, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                                                        {unit.count}
                                                    </div>
                                                    <span className="text-white font-medium">{unit.type}</span>
                                                </div>
                                                <span className="text-emerald-400 font-mono">{unit.avgPrice}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Core Team Overview */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase mb-2 flex items-center gap-2">
                                        <Briefcase size={14} /> Developer
                                    </div>
                                    <div className="text-white font-medium">{project.developer}</div>
                                </div>
                                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase mb-2 flex items-center gap-2">
                                        <Award size={14} /> Architect
                                    </div>
                                    <div className="text-white font-medium">{project.architect}</div>
                                </div>
                                <div className="p-4 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase mb-2 flex items-center gap-2">
                                        <TrendingUp size={14} /> Sales Team
                                    </div>
                                    <div className="text-white font-medium">{project.salesTeam}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FINANCIALS TAB */}
                    {activeTab === 'financials' && project.financials && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase mb-1">Land Cost</div>
                                    <div className="text-xl font-bold text-white font-mono">{formatCurrency(project.financials.landCost)}</div>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase mb-1">Hard Costs</div>
                                    <div className="text-xl font-bold text-white font-mono">{formatCurrency(project.financials.hardCosts)}</div>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl">
                                    <div className="text-xs text-zinc-500 uppercase mb-1">Soft Costs</div>
                                    <div className="text-xl font-bold text-white font-mono">{formatCurrency(project.financials.softCosts)}</div>
                                </div>
                                <div className="p-5 bg-white/[0.03] border border-white/10 rounded-xl md:col-span-2">
                                    <div className="text-xs text-zinc-500 uppercase mb-1">Total Project Cost</div>
                                    <div className="text-2xl font-bold text-violet-400 font-mono">{formatCurrency(project.financials.totalProjectCost)}</div>
                                </div>
                                <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                                    <div className="text-xs text-emerald-400 uppercase mb-1">Projected Profit</div>
                                    <div className="text-2xl font-bold text-emerald-400 font-mono">{formatCurrency(project.financials.projectedProfit)}</div>
                                    <div className="text-sm text-emerald-400/70 mt-1">{project.financials.margin}% margin</div>
                                </div>
                            </div>

                            {/* GDV Breakdown Chart */}
                            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-bold text-white mb-4">GDV Breakdown</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-zinc-400">Land Cost</span>
                                            <span className="text-white">{((project.financials.landCost / project.financials.totalProjectCost) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(project.financials.landCost / project.financials.totalProjectCost) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-zinc-400">Hard Costs</span>
                                            <span className="text-white">{((project.financials.hardCosts / project.financials.totalProjectCost) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(project.financials.hardCosts / project.financials.totalProjectCost) * 100}%` }} />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-zinc-400">Soft Costs</span>
                                            <span className="text-white">{((project.financials.softCosts / project.financials.totalProjectCost) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${(project.financials.softCosts / project.financials.totalProjectCost) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TEAM TAB */}
                    {activeTab === 'team' && (
                        <div className="space-y-6">
                            {/* Sales Gallery Info */}
                            {project.team?.salesMarketing?.salesGallery && (
                                <div className="p-6 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                                    <h3 className="text-lg font-bold text-violet-400 mb-4 flex items-center gap-2">
                                        <MapPin size={18} />
                                        Sales Gallery
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Address</div>
                                            <div className="text-white">{project.team.salesMarketing.salesGallery.address}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Status</div>
                                            <div className="text-emerald-400 font-medium">{project.team.salesMarketing.salesGallery.status}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-zinc-500 uppercase mb-1">Phone</div>
                                            <div className="text-white font-mono">{project.team.salesMarketing.salesGallery.phone}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Key Stakeholders */}
                            <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <Users size={18} className="text-violet-400" />
                                    Key Stakeholders
                                </h3>
                                <div className="space-y-3">
                                    {project.stakeholderList?.map((person, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {person.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-white font-medium">{person.name}</div>
                                                    <div className="text-sm text-zinc-500">{person.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                                    <Mail size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                                                    <Phone size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* All Team Members */}
                            {project.individuals && (
                                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-4">All Team Members</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {project.individuals.map((person, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-300">
                                                {person}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TIMELINE TAB */}
                    {activeTab === 'timeline' && (
                        <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Calendar size={18} className="text-violet-400" />
                                Project Timeline
                            </h3>
                            <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                                {project.timeline?.map((event, i) => (
                                    <div key={event.id} className="relative pl-10">
                                        <div className={`absolute left-2 top-1 w-4 h-4 rounded-full border-2 ${timelineTypeColors[event.type]} border-current`} />
                                        <div className="p-4 bg-white/[0.03] rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-bold text-white">{event.title}</span>
                                                <span className="text-xs text-zinc-500 font-mono">{event.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <span>Source: {event.source}</span>
                                                {event.url !== '#' && (
                                                    <a href={event.url} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline flex items-center gap-1">
                                                        View <ExternalLink size={10} />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* GALLERY TAB */}
                    {activeTab === 'gallery' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {galleryImages.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className="relative aspect-video rounded-xl overflow-hidden border border-white/10 hover:border-violet-500/50 transition-all group"
                                    >
                                        <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                    </button>
                                ))}
                            </div>

                            {/* Source Links */}
                            {project.sourceLinks && (
                                <div className="p-6 bg-white/[0.02] border border-white/10 rounded-xl">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <ExternalLink size={18} className="text-violet-400" />
                                        Source Links
                                    </h3>
                                    <div className="space-y-2">
                                        {project.sourceLinks.map((link, i) => (
                                            <a
                                                key={i}
                                                href={link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg hover:bg-white/5 transition-colors group"
                                            >
                                                <span className="text-zinc-300 text-sm truncate">{link}</span>
                                                <ChevronRight size={16} className="text-zinc-500 group-hover:text-violet-400" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Image Lightbox */}
                {selectedImage && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-8" onClick={() => setSelectedImage(null)}>
                        <button className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
                            <X size={32} />
                        </button>
                        <img src={selectedImage} alt="Gallery" className="max-w-full max-h-full object-contain rounded-lg" />
                    </div>
                )}
            </div>
        </div>
    );
}
