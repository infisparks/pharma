export interface SaleItem {
    productId: string;
    productName: string;
    batchCode: string;
    quantity: number;
    unitPrice: number;
    mrp: number;
    expiryDate: string;
    lineTotal: number;
}

export interface SaleRecord {
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerPhone: string;
    saleDate: string;
    saleTime: string;
    items: SaleItem[];
    subtotal: number;
    discount: number;
    discountType: 'rs' | 'percent';
    grandTotal: number;
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    amountPaid: number;
    amountDue: number;
    paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Credit';
    notes?: string;
    soldBy: string;
}

export const mockSalesRecords: SaleRecord[] = [
    {
        id: 'SAL-001',
        invoiceNumber: 'INV-2024-001',
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 98765 43210',
        saleDate: '2024-01-20',
        saleTime: '10:30 AM',
        items: [
            {
                productId: '1',
                productName: 'Resistance Bands Set',
                batchCode: 'BATCH-RB-001-456',
                quantity: 2,
                unitPrice: 1299,
                mrp: 1499,
                expiryDate: '12/2024',
                lineTotal: 2598
            },
            {
                productId: '2',
                productName: 'Foam Roller Pro',
                batchCode: 'BATCH-FR-002-789',
                quantity: 1,
                unitPrice: 2499,
                mrp: 2999,
                expiryDate: '03/2025',
                lineTotal: 2499
            }
        ],
        subtotal: 5097,
        discount: 500,
        discountType: 'rs',
        grandTotal: 4597,
        paymentStatus: 'Paid',
        amountPaid: 4597,
        amountDue: 0,
        paymentMethod: 'UPI',
        notes: 'Regular customer - VIP discount applied',
        soldBy: 'Admin User'
    },
    {
        id: 'SAL-002',
        invoiceNumber: 'INV-2024-002',
        customerName: 'Priya Sharma',
        customerPhone: '+91 87654 32109',
        saleDate: '2024-01-21',
        saleTime: '02:15 PM',
        items: [
            {
                productId: '3',
                productName: 'Yoga Mat Premium',
                batchCode: 'BATCH-YM-003-123',
                quantity: 3,
                unitPrice: 1899,
                mrp: 2299,
                expiryDate: '06/2025',
                lineTotal: 5697
            },
            {
                productId: '5',
                productName: 'Massage Gun Elite',
                batchCode: 'BATCH-MG-005-654',
                quantity: 1,
                unitPrice: 8999,
                mrp: 12999,
                expiryDate: '09/2025',
                lineTotal: 8999
            }
        ],
        subtotal: 14696,
        discount: 10,
        discountType: 'percent',
        grandTotal: 13226.4,
        paymentStatus: 'Partial',
        amountPaid: 10000,
        amountDue: 3226.4,
        paymentMethod: 'Cash',
        notes: 'Bulk order for yoga studio',
        soldBy: 'Admin User'
    },
    {
        id: 'SAL-003',
        invoiceNumber: 'INV-2024-003',
        customerName: 'Amit Patel',
        customerPhone: '+91 76543 21098',
        saleDate: '2024-01-22',
        saleTime: '11:45 AM',
        items: [
            {
                productId: '4',
                productName: 'Therapy Ball Kit',
                batchCode: 'BATCH-TB-004-321',
                quantity: 5,
                unitPrice: 799,
                mrp: 999,
                expiryDate: '08/2025',
                lineTotal: 3995
            }
        ],
        subtotal: 3995,
        discount: 0,
        discountType: 'rs',
        grandTotal: 3995,
        paymentStatus: 'Unpaid',
        amountPaid: 0,
        amountDue: 3995,
        paymentMethod: 'Credit',
        notes: 'Credit sale - 30 days payment term',
        soldBy: 'Admin User'
    },
    {
        id: 'SAL-004',
        invoiceNumber: 'INV-2024-004',
        customerName: 'Sneha Reddy',
        customerPhone: '+91 65432 10987',
        saleDate: '2024-01-23',
        saleTime: '04:30 PM',
        items: [
            {
                productId: '6',
                productName: 'Hot/Cold Pack',
                batchCode: 'BATCH-HC-006-987',
                quantity: 10,
                unitPrice: 299,
                mrp: 399,
                expiryDate: '11/2024',
                lineTotal: 2990
            },
            {
                productId: '1',
                productName: 'Resistance Bands Set',
                batchCode: 'BATCH-RB-001-456',
                quantity: 4,
                unitPrice: 1299,
                mrp: 1499,
                expiryDate: '12/2024',
                lineTotal: 5196
            }
        ],
        subtotal: 8186,
        discount: 15,
        discountType: 'percent',
        grandTotal: 6958.1,
        paymentStatus: 'Paid',
        amountPaid: 6958.1,
        amountDue: 0,
        paymentMethod: 'Card',
        notes: 'Corporate bulk order',
        soldBy: 'Admin User'
    },
    {
        id: 'SAL-005',
        invoiceNumber: 'INV-2024-005',
        customerName: 'Vikram Singh',
        customerPhone: '+91 54321 09876',
        saleDate: '2024-01-24',
        saleTime: '09:00 AM',
        items: [
            {
                productId: '2',
                productName: 'Foam Roller Pro',
                batchCode: 'BATCH-FR-002-789',
                quantity: 2,
                unitPrice: 2499,
                mrp: 2999,
                expiryDate: '03/2025',
                lineTotal: 4998
            },
            {
                productId: '5',
                productName: 'Massage Gun Elite',
                batchCode: 'BATCH-MG-005-654',
                quantity: 1,
                unitPrice: 8999,
                mrp: 12999,
                expiryDate: '09/2025',
                lineTotal: 8999
            },
            {
                productId: '3',
                productName: 'Yoga Mat Premium',
                batchCode: 'BATCH-YM-003-123',
                quantity: 2,
                unitPrice: 1899,
                mrp: 2299,
                expiryDate: '06/2025',
                lineTotal: 3798
            }
        ],
        subtotal: 17795,
        discount: 2000,
        discountType: 'rs',
        grandTotal: 15795,
        paymentStatus: 'Paid',
        amountPaid: 15795,
        amountDue: 0,
        paymentMethod: 'UPI',
        notes: 'Physiotherapy clinic setup',
        soldBy: 'Admin User'
    }
];
