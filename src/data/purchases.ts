import { Product, mockProducts } from "./products";
import { Vendor, mockVendors } from "./vendors";

export interface PurchaseItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    freeQuantity: number;
    purchasePrice: number;
    mrp: number;
    batchCode: string;
    expiryDate: string;
}

export interface PurchaseRecord {
    id: string;
    billNumber: string;
    vendorId: string;
    vendorName: string;
    purchaseDate: string;
    paymentDueDate?: string;
    payLater: boolean;
    overallDiscount: number;
    status: 'Paid' | 'Unpaid' | 'Partial';
    items: PurchaseItem[];
    subtotal: number;
    grandTotal: number;
}

export const mockPurchases: PurchaseRecord[] = [
    {
        id: "PUR-001",
        billNumber: "INV-2026-001",
        vendorId: "1",
        vendorName: "Koreacosm.com",
        purchaseDate: "2024-01-15",
        paymentDueDate: "2024-01-25",
        payLater: true,
        overallDiscount: 250,
        status: 'Unpaid',
        subtotal: 4290,
        grandTotal: 4040,
        items: [
            {
                id: "ITEM-1",
                productId: "1",
                productName: "Donkey Steam Moisture Cream",
                quantity: 1000,
                freeQuantity: 50,
                purchasePrice: 4.29,
                mrp: 10.00,
                batchCode: "BT-05X",
                expiryDate: "02/2022"
            }
        ]
    },
    {
        id: "PUR-002",
        billNumber: "BILL-8892",
        vendorId: "2",
        vendorName: "Global Pharm Corp",
        purchaseDate: "2024-01-10",
        payLater: false,
        overallDiscount: 0,
        status: 'Paid',
        subtotal: 550,
        grandTotal: 550,
        items: [
            {
                id: "ITEM-2",
                productId: "2",
                productName: "Gold CF-Nest 97% B-Jo Serum",
                quantity: 100,
                freeQuantity: 0,
                purchasePrice: 5.50,
                mrp: 12.00,
                batchCode: "BT-15X",
                expiryDate: "05/2023"
            }
        ]
    }
];
