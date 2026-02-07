// Tower Scout - Ultimate Scalable Database Structure
// Projects: Hyper-early luxury condo opportunities

export const projects = [
  {
    id: "cora-merrick-park",
    name: "Cora Merrick Park",
    slug: "cora-merrick-park",
    
    // Signal Timing
    signal: {
      stage: "Active Sales", // Pre-Demo | Demo | Planning | Approved | Active Sales | Construction | Delivery
      firstDetected: "2025-02-01",
      salesLaunch: "2025-10-01",
      groundbreaking: null,
      completion: "2028",
      daysBeforeMarket: 0, // Currently active
      earlySignalScore: 85, // 0-100 based on Days Before Market × GDV
    },

    // Location
    location: {
      address: "4241 Aurora Street",
      city: "Coral Gables",
      state: "FL",
      zip: "33146",
      neighborhood: "Merrick Park",
      submarket: "Coral Gables",
      coordinates: { lat: 25.7331, lng: -80.2634 },
      walkScore: 92,
      transitScore: 78,
      proximity: {
        downtown_miami: "20 min",
        miami_beach: "25 min",
        airport: "15 min",
        nearest_transit: "Coconut Grove Metrorail (1.2 mi)"
      }
    },

    // Product
    product: {
      type: "Luxury Wellness Condominium",
      subtype: "Boutique High-Rise",
      units: {
        total: 74,
        mix: {
          "1bed": { count: 30, sqft: "678-950", price: "$900K-$1.4M" },
          "2bed": { count: 30, sqft: "1,200-1,800", price: "$1.8M-$2.8M" },
          "3bed": { count: 14, sqft: "2,200-2,651", price: "$3.2M-$4M+" }
        }
      },
      stories: 12,
      height: "145 ft",
      avgUnitSize: "1,450 sqft",
      totalSqft: 107300,
      pricePerSqft: { min: "$620", avg: "$850", max: "$1,200" },
      amenities: [
        "WELL Certified Building",
        "Spa with infrared sauna & hydrotherapy pools",
        "Rooftop wellness terrace",
        "Fitness center with yoga studio",
        "Meditation gardens",
        "Concierge services",
        "Private dining room",
        "Pet spa"
      ],
      parking: "2 spaces/unit included",
      completion: "2028 (estimated)",
      architectStyle: "Contemporary Mediterranean"
    },

    // Financials
    financials: {
      gdv: {
        value: 175000000, // $175M estimated sellout
        currency: "USD",
        perUnit: 2365000,
        confidence: "High"
      },
      landCost: {
        amount: 15000000,
        perUnit: 202702,
        source: "Public records estimate"
      },
      hardCosts: {
        estimated: 85000000,
        perSqft: 792,
        perUnit: 1148649
      },
      softCosts: {
        estimated: 25000000,
        breakdown: {
          financing: 8000000,
          marketing: 5000000,
          legal: 3000000,
          architecture: 4000000,
          other: 5000000
        }
      },
      totalProjectCost: 125000000,
      projectedProfit: 50000000,
      margin: 28.6,
      financing: {
        equity: "Constellation Group + Boschetti Group",
        constructionLoan: null, // Self-financed or not disclosed
        permanentLoan: null
      }
    },

    // Market Context
    market: {
      compProjects: [
        { name: "Villa Valencia", distance: "0.8 mi", psf: "$1,100", status: "Delivered 2022" },
        { name: "The Gables Condo", distance: "1.2 mi", psf: "$950", status: "Active" }
      ],
      absorption: {
        rate: "12 units/month",
        monthsOfInventory: 4.2,
        marketVelocity: "Strong"
      },
      demographics: {
        targetBuyer: "Empty nesters, second-home buyers, UM families",
        avgIncome: "$350K+",
        primaryOrigins: ["Miami", "NYC", "Latin America"]
      },
      competitiveAdvantages: [
        "First WELL-certified building in Coral Gables",
        "Steps from Shops at Merrick Park",
        "Boutique scale (74 units)",
        "Contemporary Mediterranean design"
      ]
    },

    // Team
    team: {
      developer: {
        name: "Constellation Group & The Boschetti Group",
        website: "https://theboschettigroup.com",
        trackRecord: "1.5M+ sqft developed in South Florida",
        principals: [
          { name: "Eduardo Otaola", title: "Principal", email: null, phone: null, linkedin: "eduardo-otaola" },
          { name: "Jose Boschetti", title: "CEO / Managing Principal", email: null, phone: null, linkedin: "jose-boschetti" }
        ]
      },
      architect: {
        name: "Arquitectonica",
        website: "https://arquitectonica.com",
        principals: ["Bernardo Fort-Brescia", "Laurinda Spear"],
        projectLead: null
      },
      interiorDesigner: {
        name: "Urban Robot Associates",
        website: "https://urbanrobot.net",
        principals: ["Giancarlo Pietri", "Justine Velez", "Sebastian Velez"]
      },
      salesMarketing: {
        firm: "Douglas Elliman Development Marketing",
        website: "https://elliman.com",
        team: [
          { name: "Jay Phillip Parker", title: "CEO FL Region / President DEDM", priority: "CRITICAL" },
          { name: "Susan de França", title: "President & CEO, DE Development Marketing", priority: "CRITICAL" },
          { name: "Karen Mansour", title: "Senior Executive", priority: "HIGH" }
        ],
        salesGallery: {
          address: "4200 Laguna Street, Coral Gables",
          status: "Open",
          phone: "305-320-4241"
        }
      },
      landscapeArchitect: null,
      wellnessConsultant: "Lamarca Well"
    },

    // Stakeholders (Sales & Marketing Focus)
    stakeholders: {
      tier1: [
        { 
          name: "Jay Phillip Parker", 
          role: "CEO FL Region / President DEDM", 
          company: "Douglas Elliman Development Marketing", 
          priority: "CRITICAL",
          contactPriority: 1,
          why: "Controls all sales & marketing decisions, budgets, and vendor selection",
          linkedin: "jayphillipparker",
          email: null,
          phone: null,
          lastContacted: null,
          notes: "Former attorney, joined Elliman 2013. Focus on luxury new development."
        },
        { 
          name: "Susan de França", 
          role: "President & CEO", 
          company: "DE Development Marketing", 
          priority: "CRITICAL",
          contactPriority: 2,
          why: "National head of new development - sets standards for all projects",
          linkedin: "susan-defranca",
          email: null,
          phone: null,
          lastContacted: null,
          notes: "Oversees $87B+ global portfolio. Based in NYC."
        },
        { 
          name: "Eduardo Otaola", 
          role: "Principal", 
          company: "Constellation Group", 
          priority: "HIGH",
          contactPriority: 3,
          why: "Developer principal - leads Cora project, makes tech decisions",
          linkedin: "eduardo-otaola",
          email: null,
          phone: null,
          lastContacted: null,
          notes: "Coral Gables specialist. Active on LinkedIn with development updates."
        },
        { 
          name: "Jose Boschetti", 
          role: "CEO / Managing Principal", 
          company: "The Boschetti Group", 
          priority: "HIGH",
          contactPriority: 4,
          why: "Co-developer with 30+ years experience in South Florida",
          linkedin: "jose-boschetti",
          email: null,
          phone: null,
          lastContacted: null,
          notes: "Quality construction focus. Active in Coral Gables community."
        }
      ],
      tier2: [
        { name: "Giancarlo Pietri", role: "Principal", company: "Urban Robot Associates", priority: "MEDIUM", why: "Interior design lead - influences sales gallery experience" },
        { name: "Justine Velez", role: "Principal", company: "Urban Robot Associates", priority: "MEDIUM", why: "Design collective co-founder" },
        { name: "Bernardo Fort-Brescia", role: "Co-Founder / Principal", company: "Arquitectonica", priority: "MEDIUM", why: "Legendary architect; design story influencer" },
        { name: "Laurinda Spear", role: "Co-Founder / Principal", company: "Arquitectonica", priority: "MEDIUM", why: "Architectural design principal" },
        { name: "Karen Mansour", role: "Senior Executive", company: "Douglas Elliman DEDM", priority: "HIGH", why: "Palm Beach/Broward new development" }
      ],
      tier3: [
        { name: "Sebastian Velez", role: "Principal", company: "Urban Robot Associates", priority: "LOW", why: "Architecture & landscape" },
        { name: "JJ Wood", role: "Principal", company: "Urban Robot Associates", priority: "LOW", why: "Urban design lead" }
      ]
    },

    // Media & News
    news: [
      { date: "2025-10-15", headline: "Sales Gallery Officially Opens at Cora Merrick Park", source: "PROFILEmiami", url: null },
      { date: "2025-10-15", headline: "Sales Open at Cora Merrick Park - Prices from $900K", source: "South Florida Agent Magazine", url: null },
      { date: "2025-04-07", headline: "Constellation & Boschetti Launch CORA Merrick Park", source: "Coral Gables Community News", url: null },
      { date: "2025-02-01", headline: "Cora Coral Gables Launches Sales", source: "CondoBlackBook", url: null }
    ],

    // Links
    links: {
      website: "https://coramerrickpark.com",
      salesGallery: "https://coramerrickpark.com",
      brokerSite: "https://www.elliman.com",
      pressKit: null,
      floorPlans: "https://coramerrickpark.com/residences",
      renderings: null
    },

    // Step Inc. Tracking
    stepInc: {
      status: "Qualified", // Qualified | Contacted | Meeting Scheduled | Proposal Sent | Contract | Active
      interestLevel: "High",
      nextAction: "Reach out to Jay Phillip Parker",
      assignedTo: null,
      notes: "Active sales = urgent need for visualization tools. Wellness positioning aligns with Step's immersive experience."
    }
  }
];

// Filtered out projects (not luxury for-sale condos)
export const skippedProjects = [
  {
    id: "helm-design-district",
    name: "Helm Design District",
    location: "220 NE 43rd St, Miami",
    type: "Mixed-Use Rental",
    units: "278 (40% affordable)",
    gdv: 0,
    skipReason: "RENTAL - 40% affordable units under Live Local Act",
    skipCategory: "rental"
  },
  {
    id: "the-dune",
    name: "The Dune at Federal Highway",
    location: "Boynton Beach",
    type: "Mixed-Income Rental",
    units: "336 (198 workforce)",
    gdv: 0,
    skipReason: "RENTAL - Workforce housing, 'attainable' apartments/townhomes",
    skipCategory: "rental"
  },
  {
    id: "legacy-park-ii",
    name: "Legacy Park II",
    location: "Fort Myers",
    type: "Affordable Senior Rental",
    units: 130,
    gdv: 55000000,
    skipReason: "RENTAL - Affordable senior housing ($574-$1,608/mo)",
    skipCategory: "affordable"
  }
];

// Project pipeline (hyper-early signals)
export const pipeline = [
  // Template for adding new projects
  // Copy and fill in details
];

// Market indicators
export const marketIndicators = {
  miamiDade: {
    luxuryCondoInventory: 2450,
    monthsOfSupply: 8.2,
    avgPricePerSqft: 1150,
    priceChangeYoY: "+3.5%",
    absorptionRate: "185 units/month",
    newPermits2025: 42,
    gdvPipeline: 12500000000 // $12.5B
  }
};

// Helper functions
export function formatCurrency(amount) {
  if (!amount) return "N/A";
  if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

export function calculateEarlySignalScore(daysBeforeMarket, gdv) {
  // Formula: Days Before Market × GDV ($M) / 1000
  const gdvInMillions = gdv / 1000000;
  const score = (daysBeforeMarket * gdvInMillions) / 1000;
  return Math.min(Math.round(score), 100);
}

export function getContactPriorityList(projects) {
  const allContacts = [];
  
  projects.forEach(project => {
    if (project.stakeholders?.tier1) {
      project.stakeholders.tier1.forEach(contact => {
        allContacts.push({
          ...contact,
          project: project.name,
          projectId: project.id,
          projectStage: project.signal.stage,
          projectGDV: project.financials?.gdv?.value
        });
      });
    }
  });
  
  return allContacts.sort((a, b) => a.contactPriority - b.contactPriority);
}
