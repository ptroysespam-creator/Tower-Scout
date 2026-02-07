import React from 'react';

const projects = [
  {
    id: 1,
    name: "Cora Merrick Park",
    location: "Coral Gables, Miami",
    address: "4241 Aurora Street",
    type: "Luxury Wellness Condominiums",
    status: "Active Sales",
    units: 74,
    stories: 12,
    priceRange: "$900K - $4M+",
    delivery: "2028 (est.)",
    developers: ["Constellation Group", "The Boschetti Group"],
    architect: "Arquitectonica",
    interiorDesign: "Urban Robot Associates",
    salesBroker: "Douglas Elliman Development Marketing",
    wellnessConsultant: "Lamarca Well",
    interestScore: "★★★★★",
    interestReason: "ACTIVE SALES - Luxury for-sale condos with wellness positioning",
    stakeholders: {
      tier1: [
        { name: "Eduardo Otaola", role: "Principal", company: "Constellation Group", priority: "HIGH", note: "Developer principal - leads Cora project" },
        { name: "Jose Boschetti", role: "CEO / Managing Principal", company: "The Boschetti Group", priority: "HIGH", note: "30+ years experience; co-developer on Cora" },
        { name: "Jay Phillip Parker", role: "CEO FL Region / President DEDM", company: "Douglas Elliman Development Marketing", priority: "CRITICAL", note: "Controls all sales & marketing decisions" },
        { name: "Susan de França", role: "President & CEO", company: "DE Development Marketing", priority: "CRITICAL", note: "National head of new development marketing" },
      ],
      tier2: [
        { name: "Giancarlo Pietri", role: "Principal", company: "Urban Robot Associates", priority: "MEDIUM", note: "Interior design lead for Cora" },
        { name: "Justine Velez", role: "Principal", company: "Urban Robot Associates", priority: "MEDIUM", note: "Design collective co-founder" },
        { name: "Bernardo Fort-Brescia", role: "Co-Founder / Principal", company: "Arquitectonica", priority: "MEDIUM", note: "Legendary architect; design story influencer" },
        { name: "Laurinda Spear", role: "Co-Founder / Principal", company: "Arquitectonica", priority: "MEDIUM", note: "Architectural design principal" },
        { name: "Karen Mansour", role: "Senior Executive", company: "Douglas Elliman DEDM", priority: "HIGH", note: "Palm Beach/Broward new development" },
      ],
      tier3: [
        { name: "Sebastian Velez", role: "Principal", company: "Urban Robot Associates", priority: "LOW", note: "Architecture & landscape" },
        { name: "JJ Wood", role: "Principal", company: "Urban Robot Associates", priority: "LOW", note: "Urban design lead" },
      ]
    },
    keyLinks: [
      { label: "Project Website", url: "https://coramerrickpark.com" },
      { label: "Sales Gallery", url: "https://coramerrickpark.com" },
      { label: "Douglas Elliman Listing", url: "https://www.elliman.com" },
    ],
    recentNews: [
      { date: "Oct 2025", headline: "Sales Gallery Officially Opens at Cora Merrick Park", source: "PROFILEmiami" },
      { date: "Oct 2025", headline: "Sales Open at Cora Merrick Park - Prices from $900K", source: "South Florida Agent Magazine" },
      { date: "Apr 2025", headline: "Constellation & Boschetti Launch CORA Merrick Park", source: "Coral Gables Community News" },
      { date: "Feb 2025", headline: "Cora Coral Gables Launches Sales", source: "CondoBlackBook" },
    ]
  }
];

const skippedProjects = [
  {
    name: "Helm Design District",
    location: "220 NE 43rd St, Miami",
    reason: "RENTAL - 40% affordable units under Live Local Act",
    units: "278 (40% affordable)",
    type: "Mixed-Use Rental"
  },
  {
    name: "The Dune at Federal Highway",
    location: "Boynton Beach",
    reason: "RENTAL - Workforce housing, 'attainable' apartments/townhomes",
    units: "336 (198 workforce)",
    type: "Mixed-Income Rental"
  },
  {
    name: "Legacy Park II",
    location: "Fort Myers",
    reason: "RENTAL - Affordable senior housing ($574-$1,608/mo)",
    units: 130,
    type: "Affordable Senior Rental"
  }
];

export default function TowerScoutDashboard() {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#0a0a0a', minHeight: '100vh', color: '#fff' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #333', padding: '24px 32px', backgroundColor: '#111' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
              <span style={{ color: '#f59e0b' }}>Tower</span> Scout
            </h1>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: 14 }}>Luxury Condominium Intelligence Dashboard</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '1px' }}>Active Projects</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#22c55e' }}>1</div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '32px' }}>
        {/* Filters / Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ backgroundColor: '#111', padding: 20, borderRadius: 12, border: '1px solid #222' }}>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Target Type</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>For-Sale Condos</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>$900K - $4M+ price range</div>
          </div>
          <div style={{ backgroundColor: '#111', padding: 20, borderRadius: 12, border: '1px solid #222' }}>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Priority Contacts</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Sales & Marketing</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Brokers, CMOs, Sales Directors</div>
          </div>
          <div style={{ backgroundColor: '#111', padding: 20, borderRadius: 12, border: '1px solid #222' }}>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Stage Focus</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>Active Sales</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Pre-construction / Sales gallery open</div>
          </div>
          <div style={{ backgroundColor: '#111', padding: 20, borderRadius: 12, border: '1px solid #222' }}>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Filtered Out</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#ef4444' }}>3 Rentals</div>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Skipped: Affordable/workforce</div>
          </div>
        </div>

        {/* Active Projects */}
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
          Active Opportunities
        </h2>

        {projects.map(project => (
          <div key={project.id} style={{ backgroundColor: '#111', borderRadius: 16, border: '1px solid #222', marginBottom: 32, overflow: 'hidden' }}>
            {/* Project Header */}
            <div style={{ padding: 24, borderBottom: '1px solid #222', backgroundColor: '#161616' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{project.name}</h3>
                    <span style={{ backgroundColor: '#f59e0b', color: '#000', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{project.status}</span>
                  </div>
                  <p style={{ margin: 0, color: '#888', fontSize: 14 }}>{project.address} • {project.location}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>{project.interestScore}</div>
                  <div style={{ fontSize: 12, color: '#666' }}>Interest Score</div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid #222' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.type}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Units</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.units} residences</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stories</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.stories}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Price Range</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.priceRange}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery</div>
                  <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>{project.delivery}</div>
                </div>
              </div>

              <div style={{ marginTop: 16, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 8, borderLeft: '3px solid #22c55e' }}>
                <span style={{ color: '#22c55e', fontSize: 12, fontWeight: 600 }}>✓ </span>
                <span style={{ fontSize: 13, color: '#ccc' }}>{project.interestReason}</span>
              </div>
            </div>

            {/* Team Section */}
            <div style={{ padding: 24 }}>
              <h4 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Key Stakeholders</h4>
              
              {/* Tier 1 - Critical */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Tier 1: Decision Makers (Contact First)
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {project.stakeholders.tier1.map((person, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, backgroundColor: '#1a1a1a', borderRadius: 8, border: '1px solid #333' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#000', flexShrink: 0 }}>
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 16, fontWeight: 600 }}>{person.name}</span>
                          <span style={{ fontSize: 11, color: '#f59e0b', border: '1px solid #f59e0b', padding: '2px 8px', borderRadius: 4 }}>{person.priority}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{person.role} • {person.company}</div>
                        <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{person.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier 2 - Important */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Tier 2: Key Influencers
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 12 }}>
                  {project.stakeholders.tier2.map((person, idx) => (
                    <div key={idx} style={{ padding: 14, backgroundColor: '#1a1a1a', borderRadius: 8, border: '1px solid #262626' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>{person.name}</span>
                        <span style={{ fontSize: 10, color: '#3b82f6', border: '1px solid #3b82f6', padding: '1px 6px', borderRadius: 4 }}>{person.priority}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>{person.role}</div>
                      <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{person.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tier 3 - Supporting */}
              {project.stakeholders.tier3.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Tier 3: Supporting Team
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {project.stakeholders.tier3.map((person, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', backgroundColor: '#1a1a1a', borderRadius: 6, fontSize: 12 }}>
                        <span style={{ fontWeight: 500 }}>{person.name}</span>
                        <span style={{ color: '#666', marginLeft: 6 }}>• {person.company}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Project Team Summary */}
            <div style={{ padding: '20px 24px', backgroundColor: '#0d0d0d', borderTop: '1px solid #222' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 48px' }}>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Developers</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{project.developers.join(" + ")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Architect</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{project.architect}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interior Design</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{project.interiorDesign}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sales & Marketing</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{project.salesBroker}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Wellness Consultant</div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginTop: 4 }}>{project.wellnessConsultant}</div>
                </div>
              </div>
            </div>

            {/* Recent News */}
            <div style={{ padding: 24, borderTop: '1px solid #222' }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 600, color: '#888' }}>Recent Coverage</h4>
              <div style={{ display: 'grid', gap: 12 }}>
                {project.recentNews.map((news, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 6 }}>
                    <span style={{ fontSize: 11, color: '#666', minWidth: 70 }}>{news.date}</span>
                    <span style={{ fontSize: 13 }}>{news.headline}</span>
                    <span style={{ fontSize: 11, color: '#666', marginLeft: 'auto' }}>{news.source}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div style={{ padding: '16px 24px', backgroundColor: '#161616', borderTop: '1px solid #222', display: 'flex', gap: 16 }}>
              {project.keyLinks.map((link, idx) => (
                <a 
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#3b82f6', fontSize: 13, textDecoration: 'none' }}
                >
                  {link.label} →
                </a>
              ))}
            </div>
          </div>
        ))}

        {/* Skipped Projects */}
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '40px 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
          Filtered Out (Not For-Sale Condos)
        </h2>
        
        <div style={{ display: 'grid', gap: 12 }}>
          {skippedProjects.map((proj, idx) => (
            <div key={idx} style={{ padding: 16, backgroundColor: '#111', borderRadius: 8, border: '1px solid #222', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 200 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{proj.name}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{proj.location}</div>
              </div>
              <div style={{ display: 'flex', gap: 24, flex: 1, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: 11, color: '#666' }}>Type: </span>
                  <span style={{ fontSize: 12 }}>{proj.type}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: '#666' }}>Units: </span>
                  <span style={{ fontSize: 12 }}>{proj.units}</span>
                </div>
              </div>
              <div style={{ padding: '6px 12px', backgroundColor: '#2a1a1a', borderRadius: 4, fontSize: 12, color: '#ef4444', border: '1px solid #3a1a1a' }}>
                {proj.reason}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #222', textAlign: 'center', color: '#666', fontSize: 12 }}>
          Tower Scout Dashboard • Step Inc. • {new Date().getFullYear()}
        </footer>
      </main>
    </div>
  );
}
