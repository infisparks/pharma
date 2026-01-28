export interface Product {
    id: string;
    sku: string;
    name: string;
    group: 'A' | 'B' | 'C';
    category: string;
    price: number;
    stock: number;
    totalStock: number;
    site: number;
    reserved: number;
    image: string;
    displayName: string;
    barcode: string;
    brand: string;
    vendor: string;
    expDate: string;
    cost: number;
    collection: string;
    country: string;
    tags: string[];
}

export const mockProducts: Product[] = [
    {
        id: "1",
        sku: "101-elz",
        name: "Silky Creamy Donkey Steam Moisture..",
        group: "A",
        category: "Cosmetics",
        price: 10.00,
        stock: 20,
        totalStock: 23,
        site: 15,
        reserved: 3,
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=1",
        displayName: "Elizavecca Milky Piggy EGF Retinol Cream",
        barcode: "8809418750673",
        brand: "Elizavecca",
        vendor: "Koreacosm.com",
        expDate: "02/2022",
        cost: 4.29,
        collection: "Retinol Creams",
        country: "South Korea",
        tags: ["egf", "retinol", "creams"]
    },
    {
        id: "2",
        sku: "233-elz",
        name: "Elizavecca Gold CF-Nest 97% B-Jo Serum",
        group: "A",
        category: "Cosmetics",
        price: 12.00,
        stock: 20,
        totalStock: 23,
        site: 18,
        reserved: 2,
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=2",
        displayName: "Elizavecca Gold CF-Nest 97% B-Jo Serum",
        barcode: "8809418750123",
        brand: "Elizavecca",
        vendor: "Koreacosm.com",
        expDate: "05/2023",
        cost: 5.50,
        collection: "Serums",
        country: "South Korea",
        tags: ["serum", "gold", "cf-nest"]
    },
    {
        id: "3",
        sku: "399-elz",
        name: "Elizavecca Milky Piggy EGF Retinol Cream",
        group: "B",
        category: "Cosmetics",
        price: 10.00,
        stock: 20,
        totalStock: 23,
        site: 20,
        reserved: 3,
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=3",
        displayName: "Elizavecca Milky Piggy EGF Retinol Cream",
        barcode: "8809418750673",
        brand: "Elizavecca",
        vendor: "Koreacosm.com",
        expDate: "02/2022",
        cost: 4.29,
        collection: "Retinol Creams",
        country: "South Korea",
        tags: ["egf", "retinol", "creams"]
    },
    {
        id: "4",
        sku: "394-elz",
        name: "Elizavecca Aqua Deep Power Ringer Mask",
        group: "A",
        category: "Cosmetics",
        price: 10.00,
        stock: 20,
        totalStock: 23,
        site: 20,
        reserved: 3,
        image: "https://api.dicebear.com/7.x/shapes/svg?seed=4",
        displayName: "Elizavecca Aqua Deep Power Ringer Mask",
        barcode: "8809418750999",
        brand: "Elizavecca",
        vendor: "Koreacosm.com",
        expDate: "12/2024",
        cost: 2.10,
        collection: "Masks",
        country: "South Korea",
        tags: ["mask", "aqua", "hydrating"]
    }
];
