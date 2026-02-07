// Complete Demo Data for Tower Scout Dashboard
// Full Cora-level detail for all projects

export interface TimelineEvent {
    id: string;
    date: string;
    source: string;
    title: string;
    type: 'permit' | 'financial' | 'system';
    url: string;
}

export interface Stakeholder {
    name: string;
    role: string;
    raw: string;
    priority?: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    email?: string;
    phone?: string;
}

export interface UnitMix {
    type: string;
    count: number;
    avgPrice: string;
    avgSqft?: number;
    pricePerSqft?: string;
}

export interface Financials {
    landCost: number;
    hardCosts: number;
    softCosts: number;
    totalProjectCost: number;
    projectedProfit: number;
    margin: number;
}

export interface Product {
    type: string;
    priceRange: string;
    pricePerSqft: { min: string; avg: string; max: string };
    amenities: string[];
    unitTypes?: string[];
    parking?: string;
}

export interface SalesGallery {
    address: string;
    status: 'Open' | 'By Appointment' | 'Coming Soon' | 'Closed';
    phone: string;
    hours?: string;
}

export interface DeveloperTeam {
    name: string;
    website: string;
    principals: { name: string; title: string; email?: string; phone?: string }[];
}

export interface SalesMarketingTeam {
    firm: string;
    team: { name: string; title: string; priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' }[];
    salesGallery: SalesGallery;
}

export interface Project {
    id: string;
    name: string;
    address: string;
    city: string;
    developer: string;
    architect: string;
    lender: string;
    salesTeam: string;
    individuals: string[];
    stakeholderList: Stakeholder[];
    gdv: string;
    gdvValue: number;
    floors: number;
    units: number;
    stage: 'Planning' | 'Demo' | 'Construction' | 'Active Sales' | 'Completed';
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
    unitMix?: UnitMix[];
    timeline: TimelineEvent[];
    sourceLinks: string[];
    coordinates: { lat: number; lng: number } | null;
    product?: Product;
    financials?: Financials;
    team?: {
        developer: DeveloperTeam;
        salesMarketing: SalesMarketingTeam;
    };
}

// Gallery images for projects
const projectGalleries: Record<string, string[]> = {
    "cora-merrick-park": [
        "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200"
    ],
    "villa-valencia-2": [
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1200"
    ],
    "the-ritz-carlton-south-beach": [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=1200"
    ],
    "biscayne-bay-tower": [
        "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=1200",
        "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&q=80&w=1200"
    ]
};

export const mockProjects: Project[] = [
    {
        id: "cora-merrick-park",
        name: "Cora Merrick Park",
        address: "4241 Aurora Street, Coral Gables",
        city: "Coral Gables",
        developer: "Constellation Group & The Boschetti Group",
        architect: "Arquitectonica",
        lender: "TBD",
        salesTeam: "Douglas Elliman Development Marketing",
        individuals: [
            "Eduardo Otaola (Principal, Constellation)",
            "Jose Boschetti (CEO, Boschetti Group)",
            "Jay Phillip Parker (CEO FL Region, Douglas Elliman)",
            "Susan de França (President, DE Development Marketing)",
            "Giancarlo Pietri (Principal, Urban Robot)",
            "Bernardo Fort-Brescia (Principal, Arquitectonica)"
        ],
        stakeholderList: [
            { name: "Jay Phillip Parker", role: "CEO FL Region, Douglas Elliman", priority: "CRITICAL", raw: "Jay Phillip Parker (CEO FL Region, Douglas Elliman)" },
            { name: "Susan de França", role: "President, DE Development Marketing", priority: "CRITICAL", raw: "Susan de França (President, DE Development Marketing)" },
            { name: "Eduardo Otaola", role: "Principal, Constellation", priority: "HIGH", raw: "Eduardo Otaola (Principal, Constellation)" },
            { name: "Jose Boschetti", role: "CEO, Boschetti Group", priority: "HIGH", raw: "Jose Boschetti (CEO, Boschetti Group)" },
            { name: "Giancarlo Pietri", role: "Principal, Urban Robot", priority: "MEDIUM", raw: "Giancarlo Pietri (Principal, Urban Robot)" },
            { name: "Bernardo Fort-Brescia", role: "Principal, Arquitectonica", priority: "MEDIUM", raw: "Bernardo Fort-Brescia (Principal, Arquitectonica)" }
        ],
        gdv: "$175M",
        gdvValue: 175000000,
        floors: 12,
        units: 74,
        stage: "Active Sales",
        expectedDelivery: "2028",
        firstDetected: "2/1/2025",
        firstDetectedTime: 1738368000000,
        latestUpdate: "10/15/2025",
        latestUpdateTime: 1760563200000,
        isNew: false,
        image: projectGalleries["cora-merrick-park"][0],
        gallery: projectGalleries["cora-merrick-park"],
        description: "Cora Merrick Park is a 74-unit luxury wellness condominium in Coral Gables. The 12-story building features WELL Certified design, Mediterranean-modern architecture by Arquitectonica, and interiors by Urban Robot Associates. Amenities include spa with infrared sauna, hydrotherapy pools, rooftop wellness terrace, and meditation gardens. Sales gallery opened October 2025.",
        isFavorite: false,
        unitMix: [
            { type: "1 Bedroom + Den", count: 30, avgPrice: "$1.1M", avgSqft: 1250, pricePerSqft: "$880" },
            { type: "2 Bedroom", count: 30, avgPrice: "$2.3M", avgSqft: 2100, pricePerSqft: "$1,095" },
            { type: "3 Bedroom", count: 14, avgPrice: "$3.6M", avgSqft: 3200, pricePerSqft: "$1,125" }
        ],
        timeline: [
            { id: "1", date: "2/1/2025", source: "CondoBlackBook", title: "Project First Detected", type: "system", url: "#" },
            { id: "2", date: "4/7/2025", source: "Coral Gables News", title: "Sales Launch Announced", type: "system", url: "#" },
            { id: "3", date: "6/15/2025", source: "Permits", title: "Construction Permit Approved", type: "permit", url: "#" },
            { id: "4", date: "10/15/2025", source: "PROFILEmiami", title: "Sales Gallery Opens", type: "system", url: "#" }
        ],
        sourceLinks: [
            "https://coramerrickpark.com",
            "https://profilemiamire.com/2025/10/cora-merrick-park-sales-gallery",
            "https://southfloridaagentmagazine.com/cora-merrick-park"
        ],
        coordinates: { lat: 25.7331, lng: -80.2634 },
        product: {
            type: "Luxury Wellness Condominium",
            priceRange: "$900K - $4M+",
            pricePerSqft: { min: "$620", avg: "$850", max: "$1,200" },
            amenities: [
                "WELL Certified Building",
                "Full-Service Spa & Sauna",
                "Infrared Therapy Rooms",
                "Hydrotherapy Pools",
                "Rooftop Wellness Terrace",
                "Meditation Gardens",
                "Private Fitness Center",
                "Yoga & Pilates Studio",
                "IV Therapy Lounge",
                "Cold Plunge Pools",
                "24/7 Concierge",
                "Valet Parking"
            ],
            unitTypes: ["1BR + Den", "2BR", "3BR"],
            parking: "1-2 spaces per unit, valet available"
        },
        financials: {
            landCost: 15000000,
            hardCosts: 85000000,
            softCosts: 25000000,
            totalProjectCost: 125000000,
            projectedProfit: 50000000,
            margin: 28.6
        },
        team: {
            developer: {
                name: "Constellation Group & The Boschetti Group",
                website: "https://theboschettigroup.com",
                principals: [
                    { name: "Eduardo Otaola", title: "Principal" },
                    { name: "Jose Boschetti", title: "CEO" }
                ]
            },
            salesMarketing: {
                firm: "Douglas Elliman Development Marketing",
                team: [
                    { name: "Jay Phillip Parker", title: "CEO FL Region", priority: "CRITICAL" },
                    { name: "Susan de França", title: "President", priority: "CRITICAL" }
                ],
                salesGallery: {
                    address: "4200 Laguna Street, Coral Gables, FL 33146",
                    status: "Open",
                    phone: "305-320-4241",
                    hours: "Mon-Sat 10am-6pm, Sun 12pm-5pm"
                }
            }
        }
    },
    {
        id: "villa-valencia-2",
        name: "Villa Valencia Residences",
        address: "321 Valencia Ave, Coral Gables",
        city: "Coral Gables",
        developer: "Valencia Development Group",
        architect: "Sieger Suarez",
        lender: "Wells Fargo",
        salesTeam: "One Sotheby's International Realty",
        individuals: [
            "Carlos Rodriguez (Principal, Valencia Development)",
            "Maria Gonzalez (Sales Director, One Sotheby's)",
            "Charles Sieger (Principal, Sieger Suarez)",
            "Fernando Suarez (Principal, Sieger Suarez)"
        ],
        stakeholderList: [
            { name: "Carlos Rodriguez", role: "Principal, Valencia Development", priority: "CRITICAL", raw: "Carlos Rodriguez (Principal, Valencia Development)" },
            { name: "Maria Gonzalez", role: "Sales Director, One Sotheby's", priority: "CRITICAL", raw: "Maria Gonzalez (Sales Director, One Sotheby's)" },
            { name: "Charles Sieger", role: "Principal, Sieger Suarez", priority: "HIGH", raw: "Charles Sieger (Principal, Sieger Suarez)" },
            { name: "Fernando Suarez", role: "Principal, Sieger Suarez", priority: "HIGH", raw: "Fernando Suarez (Principal, Sieger Suarez)" }
        ],
        gdv: "$420M",
        gdvValue: 420000000,
        floors: 24,
        units: 120,
        stage: "Construction",
        expectedDelivery: "2026",
        firstDetected: "1/15/2024",
        firstDetectedTime: 1705276800000,
        latestUpdate: "12/1/2025",
        latestUpdateTime: 1764451200000,
        isNew: false,
        image: projectGalleries["villa-valencia-2"][0],
        gallery: projectGalleries["villa-valencia-2"],
        description: "Villa Valencia Residences is an ultra-luxury boutique tower in the heart of Coral Gables. This 24-story development features Mediterranean-inspired architecture with modern amenities, private elevators, and expansive terraces. The building offers panoramic views of the Miami skyline and Biscayne Bay.",
        isFavorite: false,
        unitMix: [
            { type: "2 Bedroom", count: 45, avgPrice: "$2.8M", avgSqft: 1850, pricePerSqft: "$1,514" },
            { type: "3 Bedroom", count: 50, avgPrice: "$4.2M", avgSqft: 2800, pricePerSqft: "$1,500" },
            { type: "4 Bedroom Penthouse", count: 25, avgPrice: "$8.5M", avgSqft: 4500, pricePerSqft: "$1,889" }
        ],
        timeline: [
            { id: "1", date: "1/15/2024", source: "System", title: "Project First Detected", type: "system", url: "#" },
            { id: "2", date: "3/20/2024", source: "The Real Deal", title: "Valencia Group Announces Coral Gables Tower", type: "system", url: "#" },
            { id: "3", date: "6/1/2024", source: "Permits", title: "Construction Permit Approved", type: "permit", url: "#" },
            { id: "4", date: "8/15/2024", source: "Construction Weekly", title: "Groundbreaking Ceremony", type: "system", url: "#" },
            { id: "5", date: "12/1/2025", source: "Site Visit", title: "50% Construction Complete", type: "system", url: "#" }
        ],
        sourceLinks: [
            "https://villavalenciacoralgables.com",
            "https://therealdeal.com/miami/valencia-tower",
            "https://onesothebysrealty.com/villa-valencia"
        ],
        coordinates: { lat: 25.7456, lng: -80.2567 },
        product: {
            type: "Ultra-Luxury Boutique Condominium",
            priceRange: "$2.5M - $12M",
            pricePerSqft: { min: "$1,400", avg: "$1,600", max: "$2,200" },
            amenities: [
                "Private Elevator Access",
                "Rooftop Infinity Pool",
                "Private Wine Cellar",
                "Tennis Court",
                "Private Cinema",
                "Children's Playroom",
                "Business Center",
                "Pet Spa",
                "Electric Vehicle Charging",
                "24/7 Security",
                "Concierge Services"
            ],
            unitTypes: ["2BR", "3BR", "4BR Penthouse"],
            parking: "2-3 spaces per unit"
        },
        financials: {
            landCost: 35000000,
            hardCosts: 220000000,
            softCosts: 65000000,
            totalProjectCost: 320000000,
            projectedProfit: 100000000,
            margin: 23.8
        },
        team: {
            developer: {
                name: "Valencia Development Group",
                website: "https://valenciadev.com",
                principals: [
                    { name: "Carlos Rodriguez", title: "Principal" }
                ]
            },
            salesMarketing: {
                firm: "One Sotheby's International Realty",
                team: [
                    { name: "Maria Gonzalez", title: "Sales Director", priority: "CRITICAL" }
                ],
                salesGallery: {
                    address: "355 Alhambra Circle, Coral Gables, FL 33134",
                    status: "By Appointment",
                    phone: "305-456-7890"
                }
            }
        }
    },
    {
        id: "the-ritz-carlton-south-beach",
        name: "Ritz-Carlton Residences South Beach",
        address: "1 Collins Ave, Miami Beach",
        city: "Miami Beach",
        developer: "Lennar Corporation & Flag luxury Group",
        architect: "Arquitectonica",
        lender: "Bank of America",
        salesTeam: "Douglas Elliman Development Marketing",
        individuals: [
            "Stuart Miller (Executive Chairman, Lennar)",
            "Rick Beckwitt (CEO, Lennar)",
            "Jay Phillip Parker (CEO FL Region, Douglas Elliman)",
            "Susan de França (President, DE Development Marketing)"
        ],
        stakeholderList: [
            { name: "Stuart Miller", role: "Executive Chairman, Lennar", priority: "CRITICAL", raw: "Stuart Miller (Executive Chairman, Lennar)" },
            { name: "Rick Beckwitt", role: "CEO, Lennar", priority: "CRITICAL", raw: "Rick Beckwitt (CEO, Lennar)" },
            { name: "Jay Phillip Parker", role: "CEO FL Region, Douglas Elliman", priority: "CRITICAL", raw: "Jay Phillip Parker (CEO FL Region, Douglas Elliman)" },
            { name: "Susan de França", role: "President, DE Development Marketing", priority: "CRITICAL", raw: "Susan de França (President, DE Development Marketing)" }
        ],
        gdv: "$890M",
        gdvValue: 890000000,
        floors: 36,
        units: 212,
        stage: "Planning",
        expectedDelivery: "2029",
        firstDetected: "12/1/2025",
        firstDetectedTime: 1764451200000,
        latestUpdate: "12/15/2025",
        latestUpdateTime: 1766256000000,
        isNew: true,
        image: projectGalleries["the-ritz-carlton-south-beach"][0],
        gallery: projectGalleries["the-ritz-carlton-south-beach"],
        description: "The first Ritz-Carlton branded residences in South Beach. This iconic 36-story oceanfront tower will feature 212 ultra-luxury condominiums with full Ritz-Carlton service and amenities. Residents will enjoy private beach access, oceanfront pool, world-class spa, and legendary Ritz-Carlton concierge services.",
        isFavorite: false,
        unitMix: [
            { type: "1 Bedroom", count: 60, avgPrice: "$1.8M", avgSqft: 950, pricePerSqft: "$1,895" },
            { type: "2 Bedroom", count: 80, avgPrice: "$3.2M", avgSqft: 1650, pricePerSqft: "$1,939" },
            { type: "3 Bedroom", count: 50, avgPrice: "$5.8M", avgSqft: 2800, pricePerSqft: "$2,071" },
            { type: "4+ Bedroom Penthouse", count: 22, avgPrice: "$15M", avgSqft: 5500, pricePerSqft: "$2,727" }
        ],
        timeline: [
            { id: "1", date: "12/1/2025", source: "Miami Herald", title: "Ritz-Carlton Announces South Beach Tower", type: "system", url: "#" },
            { id: "2", date: "12/10/2025", source: "Planning Dept", title: "Pre-Application Meeting", type: "permit", url: "#" },
            { id: "3", date: "12/15/2025", source: "Lennar", title: "Design Development Begins", type: "system", url: "#" }
        ],
        sourceLinks: [
            "https://ritzcarltonresidencesmiami.com",
            "https://miamiherald.com/ritz-carlton-south-beach",
            "https://lennar.com/miami"
        ],
        coordinates: { lat: 25.7907, lng: -80.1300 },
        product: {
            type: "Ultra-Luxury Branded Residences",
            priceRange: "$1.5M - $25M",
            pricePerSqft: { min: "$1,800", avg: "$2,100", max: "$3,000" },
            amenities: [
                "Ritz-Carlton Hotel Services",
                "Private Beach Club",
                "Oceanfront Pool & Cabanas",
                "World-Class Spa",
                "Fitness Center with Personal Training",
                "Private Dining Room",
                "Business Center",
                "Children's Club",
                "Pet Services",
                "Housekeeping & Maintenance",
                "24/7 Concierge",
                "Valet Parking"
            ],
            unitTypes: ["1BR", "2BR", "3BR", "4BR+", "Penthouse"],
            parking: "Valet only, 1-3 spaces per unit"
        },
        financials: {
            landCost: 120000000,
            hardCosts: 450000000,
            softCosts: 80000000,
            totalProjectCost: 650000000,
            projectedProfit: 240000000,
            margin: 27.0
        },
        team: {
            developer: {
                name: "Lennar Corporation & Flag luxury Group",
                website: "https://lennar.com",
                principals: [
                    { name: "Stuart Miller", title: "Executive Chairman" },
                    { name: "Rick Beckwitt", title: "CEO" }
                ]
            },
            salesMarketing: {
                firm: "Douglas Elliman Development Marketing",
                team: [
                    { name: "Jay Phillip Parker", title: "CEO FL Region", priority: "CRITICAL" },
                    { name: "Susan de França", title: "President", priority: "CRITICAL" }
                ],
                salesGallery: {
                    address: "Coming Soon - Lincoln Road, Miami Beach",
                    status: "Coming Soon",
                    phone: "305-555-RITZ"
                }
            }
        }
    },
    {
        id: "biscayne-bay-tower",
        name: "Biscayne Bay Tower",
        address: "1200 Brickell Bay Dr, Miami",
        city: "Miami",
        developer: "Related Group",
        architect: "Kobi Karp Architecture",
        lender: "JPMorgan Chase",
        salesTeam: "Cervera Real Estate",
        individuals: [
            "Jorge Perez (Founder & CEO, Related Group)",
            "Jon Paul Perez (President, Related Group)",
            "Kobi Karp (Principal, Kobi Karp Architecture)",
            "Alicia Cervera (Managing Partner, Cervera Real Estate)"
        ],
        stakeholderList: [
            { name: "Jorge Perez", role: "Founder & CEO, Related Group", priority: "CRITICAL", raw: "Jorge Perez (Founder & CEO, Related Group)" },
            { name: "Jon Paul Perez", role: "President, Related Group", priority: "CRITICAL", raw: "Jon Paul Perez (President, Related Group)" },
            { name: "Alicia Cervera", role: "Managing Partner, Cervera", priority: "CRITICAL", raw: "Alicia Cervera (Managing Partner, Cervera)" },
            { name: "Kobi Karp", role: "Principal, Kobi Karp Architecture", priority: "HIGH", raw: "Kobi Karp (Principal, Kobi Karp Architecture)" }
        ],
        gdv: "$1.2B",
        gdvValue: 1200000000,
        floors: 55,
        units: 350,
        stage: "Demo",
        expectedDelivery: "2030",
        firstDetected: "11/15/2025",
        firstDetectedTime: 1761571200000,
        latestUpdate: "12/20/2025",
        latestUpdateTime: 1766188800000,
        isNew: true,
        image: projectGalleries["biscayne-bay-tower"][0],
        gallery: projectGalleries["biscayne-bay-tower"],
        description: "Iconic waterfront tower rising 55 stories above Biscayne Bay. This landmark development will feature 350 luxury residences with breathtaking water and city views. The building includes a private yacht club, marina, and exclusive resident amenities. Located in the heart of Brickell, Miami's financial district.",
        isFavorite: false,
        unitMix: [
            { type: "Studio", count: 40, avgPrice: "$650K", avgSqft: 550, pricePerSqft: "$1,182" },
            { type: "1 Bedroom", count: 100, avgPrice: "$1.1M", avgSqft: 850, pricePerSqft: "$1,294" },
            { type: "2 Bedroom", count: 120, avgPrice: "$2.1M", avgSqft: 1400, pricePerSqft: "$1,500" },
            { type: "3 Bedroom", count: 70, avgPrice: "$3.8M", avgSqft: 2200, pricePerSqft: "$1,727" },
            { type: "4+ Penthouse", count: 20, avgPrice: "$12M", avgSqft: 5000, pricePerSqft: "$2,400" }
        ],
        timeline: [
            { id: "1", date: "11/15/2025", source: "The Real Deal", title: "Related Group Files Plans for Brickell Tower", type: "system", url: "#" },
            { id: "2", date: "12/1/2025", source: "Miami Planning", title: "Development Review Committee Meeting", type: "permit", url: "#" },
            { id: "3", date: "12/20/2025", source: "Demo Permits", title: "Demolition Permits Filed", type: "permit", url: "#" }
        ],
        sourceLinks: [
            "https://relatedgroup.com/biscayne-bay-tower",
            "https://therealdeal.com/miami/related-brickell-tower",
            "https://cervera.com/biscayne-bay"
        ],
        coordinates: { lat: 25.7617, lng: -80.1918 },
        product: {
            type: "Luxury Waterfront Condominium",
            priceRange: "$600K - $20M",
            pricePerSqft: { min: "$1,100", avg: "$1,600", max: "$2,600" },
            amenities: [
                "Private Yacht Club",
                "Marina with Boat Slips",
                "Rooftop Infinity Pool",
                "Bayfront Pool Deck",
                "Private Theater",
                "Wellness Spa",
                "Fitness Center",
                "Co-working Lounge",
                "Game Room",
                "Children's Play Area",
                "24/7 Security",
                "Valet & Concierge"
            ],
            unitTypes: ["Studio", "1BR", "2BR", "3BR", "4BR+", "Penthouse"],
            parking: "1-4 spaces per unit, valet available"
        },
        financials: {
            landCost: 85000000,
            hardCosts: 580000000,
            softCosts: 95000000,
            totalProjectCost: 760000000,
            projectedProfit: 440000000,
            margin: 36.7
        },
        team: {
            developer: {
                name: "Related Group",
                website: "https://relatedgroup.com",
                principals: [
                    { name: "Jorge Perez", title: "Founder & CEO" },
                    { name: "Jon Paul Perez", title: "President" }
                ]
            },
            salesMarketing: {
                firm: "Cervera Real Estate",
                team: [
                    { name: "Alicia Cervera", title: "Managing Partner", priority: "CRITICAL" }
                ],
                salesGallery: {
                    address: "Coming Soon - Brickell Ave",
                    status: "Coming Soon",
                    phone: "305-789-0123"
                }
            }
        }
    }
];

export const mockSources = [
    { id: "1", url: "floridayimby.com", last_crawled: new Date().toISOString() },
    { id: "2", url: "therealdeal.com", last_crawled: new Date().toISOString() },
    { id: "3", url: "miamiherald.com", last_crawled: new Date().toISOString() },
    { id: "4", url: "condoblackbook.com", last_crawled: new Date().toISOString() },
    { id: "5", url: "profilemiami.com", last_crawled: new Date().toISOString() }
];

// Helper function to format currency
export function formatCurrency(amount: number): string {
    if (!amount) return "N/A";
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
}

// Calculate early signal score
export function calculateSignalScore(project: Project): number {
    const daysBeforeMarket = Math.max(0, Math.floor((project.firstDetectedTime - Date.now()) / (1000 * 60 * 60 * 24)) + 730);
    const gdvInMillions = project.gdvValue / 1000000;
    return daysBeforeMarket * gdvInMillions;
}
