import React, { useState } from 'react';
import { projects, skippedProjects, formatCurrency, getContactPriorityList } from '../data/projects';

export default function TowerScoutDashboard() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  const priorityContacts = getContactPriorityList(projects);
  const totalGDV = projects.reduce((sum, p) => sum + (p.financials?.gdv?.value || 0), 0);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #333', padding: '24px 32px', backgroundColor: '#111', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: '-1px' }}>
              <span style={{ color: '#f59e0b' }}>Tower</span> Scout
            </h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>Hyper-Early Luxury Condo Intelligence</p>
          </div>
          <div style={{ display: 'flex', gap: 32, textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Projects</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>{projects.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Pipeline GDV</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(totalGDV)}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Priority Contacts</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>{priorityContacts.length}</div>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1600, margin: '0 auto', padding: '32px' }}>
        
        {/* Dashboard Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
          <SummaryCard 
            title="Target Type" 
            value="For-Sale Condos" 
            subtitle="$900K - $10M+ range"
            color="#22c55e"
          />
          <SummaryCard 
            title="Stage Focus" 
            value="Pre-Construction" 
            subtitle="Demo → Planning → Sales"
            color="#f59e0b"
          />
          <SummaryCard 
            title="Signal Source" 
            value="Hyper-Early Alerts" 
            subtitle="Permits → Financing → Land"
            color="#3b82f6"
          />
          <SummaryCard 
            title="Priority Contact" 
            value="Sales & Marketing" 
            subtitle="Brokers, CMOs, Sales Directors"
            color="#8b5cf6"
          />
        </div>

        {/* Priority Contacts Section */}
        <Section title="🎯 Priority Contact List (Call These First)">
          <div style={{ display: 'grid', gap: 12 }}>
            {priorityContacts.slice(0, 6).map((contact, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                padding: 16, 
                backgroundColor: '#161616', 
                borderRadius: 8,
                border: '1px solid #333'
              }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  backgroundColor: getPriorityColor(contact.priority),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#000'
                }}>
                  {contact.contactPriority}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{contact.name}</span>
                    <span style={{ 
                      fontSize: 10, 
                      padding: '2px 8px', 
                      borderRadius: 4,
                      backgroundColor: getPriorityColor(contact.priority),
                      color: '#000',
                      fontWeight: 600
                    }}>
                      {contact.priority}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                    {contact.role} • {contact.company}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                    Project: {contact.project} ({contact.projectStage}) • GDV: {formatCurrency(contact.projectGDV)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 12, color: '#888' }}>{contact.why}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Active Projects */}
        <Section title="🔥 Active Opportunities">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </Section>

        {/* Skipped Projects */}
        <Section title="❌ Filtered Out (Not Our Target)">
          <div style={{ display: 'grid', gap: 8 }}>
            {skippedProjects.map((proj, idx) => (
              <div key={idx} style={{ 
                padding: 12, 
                backgroundColor: '#1a1a1a', 
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: 0.7
              }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{proj.name}</span>
                  <span style={{ color: '#666', marginLeft: 8 }}>• {proj.location}</span>
                </div>
                <span style={{ fontSize: 12, color: '#666' }}>{proj.type}</span>
                <span style={{ 
                  padding: '4px 8px', 
                  backgroundColor: '#2a1a1a', 
                  borderRadius: 4,
                  fontSize: 11,
                  color: '#ef4444'
                }}>
                  {proj.skipReason}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #333', textAlign: 'center', color: '#666', fontSize: 12 }}>
          Tower Scout Dashboard • Step Inc. • GDV-Based Prioritization • {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#fff' }}>{title}</h2>
      {children}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color }) {
  return (
    <div style={{ 
      backgroundColor: '#111', 
      padding: 20, 
      borderRadius: 12, 
      border: '1px solid #222',
      borderLeft: `3px solid ${color}`
    }}>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#666' }}>{subtitle}</div>
    </div>
  );
}

function ProjectCard({ project }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ 
      backgroundColor: '#111', 
      borderRadius: 16, 
      border: '1px solid #222', 
      marginBottom: 24,
      overflow: 'hidden'
    }}>
      {/* Project Header */}
      <div style={{ padding: 24, borderBottom: expanded ? '1px solid #222' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{project.name}</h3>
              <StageBadge stage={project.signal.stage} />
            </div>
            <p style={{ margin: 0, color: '#888', fontSize: 14 }}>
              {project.location.address} • {project.location.city}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Gross Development Value
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>
              {formatCurrency(project.financials?.gdv?.value)}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {project.product.units.total} units • {project.product.stories} stories
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: 16, 
          marginTop: 20,
          paddingTop: 20,
          borderTop: '1px solid #222'
        }}>
          <Metric label="Price Range" value={project.product.priceRange} />
          <Metric label="Price/Sqft" value={project.product.pricePerSqft?.avg} />
          <Metric label="Completion" value={project.product.completion} />
          <Metric label="Early Signal Score" value={`${project.signal.earlySignalScore}/100`} />
          <Metric label="Days to Market" value={project.signal.daysBeforeMarket === 0 ? 'ACTIVE' : project.signal.daysBeforeMarket} />
        </div>

        {/* Expand Button */}
        <button 
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 13
          }}
        >
          {expanded ? '← Collapse Details' : 'View Full Dossier →'}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div style={{ padding: 24, backgroundColor: '#0d0d0d' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid #333', paddingBottom: 12 }}>
            <TabButton label="Financials" />
            <TabButton label="Team & Contacts" />
            <TabButton label="Product" />
            <TabButton label="Market" />
            <TabButton label="News" />
          </div>

          {/* Financials Section */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, color: '#f59e0b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Financial Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <FinancialRow label="Gross Development Value" value={formatCurrency(project.financials?.gdv?.value)} />
              <FinancialRow label="Land Cost" value={formatCurrency(project.financials?.landCost?.amount)} />
              <FinancialRow label="Hard Costs" value={formatCurrency(project.financials?.hardCosts?.estimated)} />
              <FinancialRow label="Soft Costs" value={formatCurrency(project.financials?.softCosts?.estimated)} />
              <FinancialRow label="Total Project Cost" value={formatCurrency(project.financials?.totalProjectCost)} />
              <FinancialRow label="Projected Profit" value={formatCurrency(project.financials?.projectedProfit)} highlight />
              <FinancialRow label="Margin" value={`${project.financials?.margin}%`} highlight />
            </div>
          </div>

          {/* Team Section */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, color: '#f59e0b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Key Stakeholders
            </h4>
            
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 600, marginBottom: 8 }}>CRITICAL - Contact First</div>
              <div style={{ display: 'grid', gap: 8 }}>
                {project.stakeholders?.tier1?.map((person, idx) => (
                  <StakeholderRow key={idx} person={person} tier={1} />
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 8 }}>HIGH PRIORITY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 8 }}>
                {project.stakeholders?.tier2?.map((person, idx) => (
                  <StakeholderRow key={idx} person={person} tier={2} />
                ))}
              </div>
            </div>
          </div>

          {/* Product Section */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, color: '#f59e0b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Product Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Architect</div>
                <div style={{ fontSize: 14 }}>{project.team?.architect?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Interior Design</div>
                <div style={{ fontSize: 14 }}>{project.team?.interiorDesigner?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Sales Broker</div>
                <div style={{ fontSize: 14 }}>{project.team?.salesMarketing?.firm}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Sales Gallery</div>
                <div style={{ fontSize: 14 }}>{project.team?.salesMarketing?.salesGallery?.address}</div>
              </div>
            </div>
          </div>

          {/* News Section */}
          {project.news?.length > 0 && (
            <div>
              <h4 style={{ fontSize: 14, color: '#f59e0b', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Recent News
              </h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {project.news.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 6 }}>
                    <span style={{ fontSize: 12, color: '#666', minWidth: 80 }}>{item.date}</span>
                    <span style={{ fontSize: 13 }}>{item.headline}</span>
                    <span style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>{item.source}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StageBadge({ stage }) {
  const colors = {
    "Pre-Demo": "#666",
    "Demo": "#888",
    "Planning": "#3b82f6",
    "Approved": "#22c55e",
    "Active Sales": "#f59e0b",
    "Construction": "#8b5cf6",
    "Delivery": "#10b981"
  };

  return (
    <span style={{
      backgroundColor: colors[stage] || "#666",
      color: stage === "Active Sales" ? "#000" : "#fff",
      padding: '4px 12px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600
    }}>
      {stage}
    </span>
  );
}

function Metric({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{value || "N/A"}</div>
    </div>
  );
}

function FinancialRow({ label, value, highlight }) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '12px 16px', 
      backgroundColor: highlight ? '#1a1a1a' : '#161616',
      borderRadius: 6,
      border: highlight ? '1px solid #333' : 'none'
    }}>
      <span style={{ fontSize: 13, color: '#888' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: highlight ? '#f59e0b' : '#fff' }}>{value}</span>
    </div>
  );
}

function StakeholderRow({ person, tier }) {
  const borderColor = tier === 1 ? '#ef4444' : tier === 2 ? '#3b82f6' : '#666';
  
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 12, 
      padding: 12, 
      backgroundColor: '#161616', 
      borderRadius: 6,
      border: `1px solid ${borderColor}33`
    }}>
      <div style={{ 
        width: 36, 
        height: 36, 
        borderRadius: '50%', 
        backgroundColor: borderColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 700,
        color: '#000'
      }}>
        {person.name.split(' ').map(n => n[0]).join('')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{person.name}</span>
          <span style={{ fontSize: 10, color: borderColor, border: `1px solid ${borderColor}`, padding: '1px 6px', borderRadius: 4 }}>
            {person.priority}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>{person.role} • {person.company}</div>
        {person.why && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{person.why}</div>}
      </div>
    </div>
  );
}

function TabButton({ label }) {
  return (
    <button style={{
      padding: '8px 16px',
      backgroundColor: 'transparent',
      border: 'none',
      color: '#888',
      cursor: 'pointer',
      fontSize: 13,
      borderBottom: '2px solid transparent'
    }}>
      {label}
    </button>
  );
}

function getPriorityColor(priority) {
  switch(priority) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH': return '#f59e0b';
    case 'MEDIUM': return '#3b82f6';
    case 'LOW': return '#666';
    default: return '#666';
  }
}
