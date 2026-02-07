// Demo/Mock Data for Tower Scout Dashboard
// This enables the dashboard to display without requiring InstantDB connection

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
    // Enhanced fields for Step Inc.
    product?: {
        type: string;
        priceRange: string;
        pricePerSqft: { min: string; avg: string; max: string };
        amenities: string[];
    };
    financials?: {
        landCost: number;
        hardCosts: number;
        softCosts: number;
        totalProjectCost: number;
        projectedProfit: number;
        margin: number;
    };
    team?: {
        developer: { name: string; website: string; principals: any[] };
        salesMarketing: { firm: string; team: any[]; salesGallery: any };
    };
}

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
            { name: "Eduardo Otaola", role: "Principal", raw: "Eduardo Otaola (Principal, Constellation)" },
            { name: "Jose Boschetti", role: "CEO", raw: "Jose Boschetti (CEO, Boschetti Group)" },
            { name: "Jay Phillip Parker", role: "CEO FL Region", raw: "Jay Phillip Parker (CEO FL Region, Douglas Elliman)" },
            { name: "Susan de França", role: "President", raw: "Susan de França (President, DE Development Marketing)" },
            { name: "Giancarlo Pietri", role: "Principal", raw: "Giancarlo Pietri (Principal, Urban Robot)" },
            { name: "Bernardo Fort-Brescia", role: "Principal", raw: "Bernardo Fort-Brescia (Principal, Arquitectonica)" }
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
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
        gallery: [],
        description: "Cora Merrick Park is a 74-unit luxury wellness condominium in Coral Gables. The 12-story building features WELL Certified design, Mediterranean-modern architecture by Arquitectonica, and interiors by Urban Robot Associates. Amenities include spa with infrared sauna, hydrotherapy pools, rooftop wellness terrace, and meditation gardens. Sales gallery opened October 2025.",
        isFavorite: false,
        unitMix: [
            { type: "1 Bedroom", count: 30, avgPrice: "$1.1M" },
            { type: "2 Bedroom", count: 30, avgPrice: "$2.3M" },
            { type: "3 Bedroom", count: 14, avgPrice: "$3.6M" }
        ],
        timeline: [
            { id: "1", date: "2/1/2025", source: "CondoBlackBook", title: "Project First Detected", type: "system", url: "#" },
            { id: "2", date: "4/7/2025", source: "Coral Gables News", title: "Sales Launch Announced", type: "system", url: "#" },
            { id: "3", date: "10/15/2025", source: "PROFILEmiami", title: "Sales Gallery Opens", type: "system", url: "#" }
        ],
        sourceLinks: [
            "https://coramerrickpark.com",
            "https://profilemiamire.com",
            "https://southfloridaagentmagazine.com"
        ],
        coordinates: { lat: 25.7331, lng: -80.2634 },
        product: {
            type: "Luxury Wellness Condominium",
            priceRange: "$900K - $4M+",
            pricePerSqft: { min: "$620", avg: "$850", max: "$1,200" },
            amenities: ["WELL Certified", "Spa & Sauna", "Rooftop Terrace", "Fitness Center", "Meditation Gardens"]
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
                    { name: "Eduardo Otaola", title: "Principal", email: null, phone: null },
                    { name: "Jose Boschetti", title: "CEO", email: null, phone: null }
                ]
            },
            salesMarketing: {
                firm: "Douglas Elliman Development Marketing",
                team: [
                    { name: "Jay Phillip Parker", title: "CEO FL Region", priority: "CRITICAL" },
                    { name: "Susan de França", title: "President", priority: "CRITICAL" }
                ],
                salesGallery: {
                    address: "4200 Laguna Street, Coral Gables",
                    status: "Open",
                    phone: "305-320-4241"
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
        salesTeam: "One Sotheby's",
        individuals: ["Carlos Rodriguez (Principal)", "Maria Gonzalez (Sales Director)"],
        stakeholderList: [
            { name: "Carlos Rodriguez", role: "Principal", raw: "Carlos Rodriguez (Principal)" },
            { name: "Maria Gonzalez", role: "Sales Director", raw: "Maria Gonzalez (Sales Director)" }
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
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
        gallery: [],
        description: "Ultra-luxury boutique tower in the heart of Coral Gables. Mediterranean-inspired design with modern amenities.",
        isFavorite: false,
        timeline: [
            { id: "1", date: "1/15/2024", source: "System", title: "Project Detected", type: "system", url: "#" },
            { id: "2", date: "6/1/2024", source: "Permits", title: "Construction Permit Approved", type: "permit", url: "#" }
        ],
        sourceLinks: ["https://example.com/valencia"],
        coordinates: { lat: 25.7456, lng: -80.2567 }
    },
    {
        id: "the-ritz-carlton-south-beach",
        name: "Ritz-Carlton Residences South Beach",
        address: "1 Collins Ave, Miami Beach",
        city: "Miami Beach",
        developer: "Lennar Corporation",
        architect: "Arquitectonica",
        lender: "Bank of America",
        salesTeam: "Douglas Elliman",
        individuals: ["Stuart Miller (CEO, Lennar)", "John Smith (Project Lead)"],
        stakeholderList: [
            { name: "Stuart Miller", role: "CEO", raw: "Stuart Miller (CEO, Lennar)" },
            { name: "John Smith", role: "Project Lead", raw: "John Smith (Project Lead)" }
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
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
        gallery: [],
        description: "The first Ritz-Carlton branded residences in South Beach. Ultra-luxury oceanfront living with full-service amenities.",
        isFavorite: false,
        timeline: [
            { id: "1", date: "12/1/2025", source: "Miami Herald", title: "Ritz-Carlton Announces South Beach Tower", type: "system", url: "#" }
        ],
        sourceLinks: ["https://ritzcarlton.com"],
        coordinates: { lat: 25.7907, lng: -80.1300 }
    },
    {
        id: "biscayne-bay-tower",
        name: "Biscayne Bay Tower",
        address: "1200 Brickell Bay Dr, Miami",
        city: "Miami",
        developer: "Related Group",
        architect: "Kobi Karp",
        lender: "JPMorgan Chase",
        salesTeam: "Cervera Real Estate",
        individuals: ["Jorge Perez (CEO, Related)", "Michael Stern (Principal)"],
        stakeholderList: [
            { name: "Jorge Perez", role: "CEO", raw: "Jorge Perez (CEO, Related)" },
            { name: "Michael Stern", role: "Principal", raw: "Michael Stern (Principal)" }
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
        image: "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?auto=format&fit=crop&q=80&w=800",
        gallery: [],
        description: "Iconic waterfront tower rising 55 stories above Biscayne Bay. Features sky residences, yacht club, and private marina.",
        isFavorite: false,
        timeline: [
            { id: "1", date: "11/15/2025", source: "The Real Deal", title: "Related Group Files Plans for Brickell Tower", type: "system", url: "#" },
            { id: "2", date: "12/20/2025", source: "Demo Permits", title: "Demolition Permits Filed", type: "permit", url: "#" }
        ],
        sourceLinks: ["https://relatedgroup.com"],
        coordinates: { lat: 25.7617, lng: -80.1918 }
    }
];

export const mockSources = [
    { id: "1", url: "floridayimby.com", last_crawled: new Date().toISOString() },
    { id: "2", url: "therealdeal.com", last_crawled: new Date().toISOString() },
    { id: "3", url: "miamiherald.com", last_crawled: new Date().toISOString() },
    { id: "4", url: "condoblackbook.com", last_crawled: new Date().toISOString() }
];

// Helper function to format currency
export function formatCurrency(amount: number): string {
    if (!amount) return "N/A";
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
}
