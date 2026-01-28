export interface Vendor {
    id: string;
    name: string;
    businessName: string;
    email: string;
    phone: string;
    address: string;
    status: 'Active' | 'Pending' | 'Suspended';
    rating: number;
    joinedDate: string;
    totalProducts: number;
    avatar: string;
}

export const mockVendors: Vendor[] = [
    {
        id: "V001",
        name: "John Anderson",
        businessName: "Luxe Cosmetics Co.",
        email: "john@luxecosmetics.com",
        phone: "+1 (555) 123-4567",
        address: "742 Evergreen Terrace, Springfield",
        status: 'Active',
        rating: 4.8,
        joinedDate: "Mar 12, 2023",
        totalProducts: 142,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John"
    },
    {
        id: "V002",
        name: "Sarah Jenkins",
        businessName: "Glow Skin Labs",
        email: "sarah@glowskin.tech",
        phone: "+1 (555) 987-6543",
        address: "123 Innovation Way, San Francisco",
        status: 'Active',
        rating: 4.9,
        joinedDate: "Jan 05, 2024",
        totalProducts: 89,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
        id: "V003",
        name: "Michael Chen",
        businessName: "Silk Road Imports",
        email: "michael@silkroad.com",
        phone: "+1 (555) 456-7890",
        address: "888 Dragon Blvd, Seattle",
        status: 'Pending',
        rating: 0,
        joinedDate: "Feb 22, 2024",
        totalProducts: 0,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
        id: "V004",
        name: "Elena Rodriguez",
        businessName: "Nature's Essence",
        email: "elena@natures.bio",
        phone: "+1 (555) 234-5678",
        address: "45 Forest Way, Portland",
        status: 'Active',
        rating: 4.7,
        joinedDate: "Nov 15, 2022",
        totalProducts: 215,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elena"
    },
    {
        id: "V005",
        name: "David Smith",
        businessName: "Pure Glow Distro",
        email: "david@pureglow.com",
        phone: "+1 (555) 876-5432",
        address: "99 Business Park, Chicago",
        status: 'Suspended',
        rating: 3.2,
        joinedDate: "Jun 10, 2021",
        totalProducts: 54,
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=David"
    }
];
