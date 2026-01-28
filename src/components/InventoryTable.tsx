"use client";

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
    ChevronDown,
    Check,
    Plus,
    Search,
    Calendar,
    History,
    Zap,
    Building2,
    Clock,
    Package,
    TrendingUp,
    AlertTriangle,
    Loader2,
    DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface BatchStock {
    batch_code: string;
    expiry_date: string;
    purchased_qty: number;
    sold_qty: number;
    available_qty: number;
    pack_quantity: number;
    mrp: number;
    purchase_price: number;
    vendor_name: string;
    purchase_date: string;
}

interface ProductWithStock {
    id: number;
    name: string;
    category: string;
    brand: string;
    emoji: string;
    unit_value: string;
    unit_type: string;
    total_available: number;
    total_packs: number;
    batches: BatchStock[];
}

export function InventoryTable() {
    const supabase = createClient();
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [selectedRows, setSelectedRows] = useState<number[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadInventory();
    }, []);

    const loadInventory = async () => {
        setIsLoading(true);

        // Fetch all data
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .order('name');

        const { data: purchaseItems } = await supabase
            .from('purchase_items')
            .select(`
                *,
                purchases!inner(vendor_id, purchase_date, vendors!inner(business_name, full_name))
            `);

        const { data: saleItems } = await supabase
            .from('sale_items')
            .select('product_id, batch_code, quantity');

        // Calculate stock for each product
        const inventory: ProductWithStock[] = (productsData || []).map(product => {
            const unitValue = parseFloat(product.unit_value) || 1;

            // Get all purchase items for this product
            const productPurchases = (purchaseItems || []).filter(pi => pi.product_id === product.id);

            // Group by batch
            const batchMap = new Map<string, BatchStock>();

            productPurchases.forEach(pi => {
                const batchKey = pi.batch_code;
                const purchasedQty = (parseFloat(pi.quantity) + parseFloat(pi.free_quantity || 0)) * unitValue;

                if (batchMap.has(batchKey)) {
                    const existing = batchMap.get(batchKey)!;
                    existing.purchased_qty += purchasedQty;
                } else {
                    batchMap.set(batchKey, {
                        batch_code: pi.batch_code,
                        expiry_date: pi.expiry_date,
                        purchased_qty: purchasedQty,
                        sold_qty: 0,
                        available_qty: 0,
                        pack_quantity: 0,
                        mrp: parseFloat(pi.mrp || 0),
                        purchase_price: parseFloat(pi.purchase_price || 0),
                        vendor_name: pi.purchases?.vendors?.business_name || pi.purchases?.vendors?.full_name || 'Unknown',
                        purchase_date: pi.purchases?.purchase_date || 'N/A'
                    });
                }
            });

            // Calculate sold quantities per batch
            const productSales = (saleItems || []).filter(si => si.product_id === product.id);

            productSales.forEach(si => {
                if (batchMap.has(si.batch_code)) {
                    const batch = batchMap.get(si.batch_code)!;
                    batch.sold_qty += parseFloat(si.quantity || 0) * unitValue;
                }
            });

            // Calculate available quantities
            const batches: BatchStock[] = [];
            batchMap.forEach(batch => {
                batch.available_qty = batch.purchased_qty - batch.sold_qty;
                batch.pack_quantity = Math.floor(batch.available_qty / unitValue);

                // Only include batches with available stock
                if (batch.available_qty > 0) {
                    batches.push(batch);
                }
            });

            // Sort by expiry date (FEFO - First Expiry First Out)
            batches.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

            const total_available = batches.reduce((sum, b) => sum + b.available_qty, 0);
            const total_packs = Math.floor(total_available / unitValue);

            return {
                id: product.id,
                name: product.name,
                category: product.category || 'General',
                brand: product.brand || 'Generic',
                emoji: product.emoji || '💊',
                unit_value: product.unit_value,
                unit_type: product.unit_type,
                total_available,
                total_packs,
                batches
            };
        });

        // Filter out products with no stock
        const inStockProducts = inventory.filter(p => p.total_available > 0);

        setProducts(inStockProducts);
        setIsLoading(false);
    };

    const toggleExpand = (id: number) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const toggleSelect = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === products.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(products.map(p => p.id));
        }
    };

    const parseExpDate = (dateStr: string) => {
        return new Date(dateStr);
    };

    const sortedAndFilteredItems = useMemo(() => {
        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        );
        return [...filtered].sort((a, b) => {
            const aExpiry = a.batches[0] ? parseExpDate(a.batches[0].expiry_date).getTime() : Infinity;
            const bExpiry = b.batches[0] ? parseExpDate(b.batches[0].expiry_date).getTime() : Infinity;
            return aExpiry - bExpiry;
        });
    }, [searchQuery, products]);

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Loading Vault Inventory</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 min-w-0 flex flex-col gap-5">
            {/* Control Bar */}
            <div className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[24px] p-2 flex items-center justify-between shadow-sm">
                <div className="relative group flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search inventory..."
                        className="h-10 w-full pl-11 pr-4 bg-transparent outline-none text-[14px] font-bold text-gray-700 placeholder:text-gray-300"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Products</div>
                        <div className="text-[16px] font-black text-gray-900 tabular-nums">{products.length}</div>
                    </div>
                    <Link href="/purchase-entry" className="h-10 px-6 bg-gray-900 text-white rounded-[18px] text-[12px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg flex items-center gap-2">
                        <Plus size={14} strokeWidth={3} />
                        New Stock Entry
                    </Link>
                </div>
            </div>

            {/* Inventory Ledger */}
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="text-left text-[11px] font-black text-gray-400 uppercase tracking-[2px] bg-gray-50/50 border-b border-gray-100">
                            <th className="py-5 pl-8 w-12 text-center" onClick={toggleSelectAll}>
                                <div className={cn(
                                    "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer",
                                    selectedRows.length === products.length && products.length > 0 ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
                                )}>
                                    {selectedRows.length === products.length && products.length > 0 && <Check size={12} className="text-white" strokeWidth={4} />}
                                </div>
                            </th>
                            <th className="py-5 px-4 min-w-[280px]">Product Identity</th>
                            <th className="py-5 px-4 w-32 text-center">Category</th>
                            <th className="py-5 px-4 w-40 text-right">Available Packs</th>
                            <th className="py-5 px-4 w-32 text-center">Nearest Expiry</th>
                            <th className="py-5 pr-8 w-16"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredItems.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3 opacity-30">
                                        <Package size={48} strokeWidth={1} />
                                        <p className="text-[12px] font-black text-gray-400 uppercase tracking-[4px]">No Products in Vault</p>
                                    </div>
                                </td>
                            </tr>
                        ) : sortedAndFilteredItems.map((product) => {
                            const isExpanded = expandedRows.includes(product.id);
                            const isSelected = selectedRows.includes(product.id);
                            const nearestExpiry = product.batches[0]?.expiry_date;
                            const isExpiringSoon = nearestExpiry && parseExpDate(nearestExpiry).getTime() < new Date().getTime() + (90 * 24 * 60 * 60 * 1000);

                            return (
                                <div key={product.id} className="contents">
                                    <tr
                                        onClick={() => toggleExpand(product.id)}
                                        className={cn(
                                            "group cursor-pointer transition-all border-b border-gray-50 last:border-0",
                                            isExpanded ? "bg-indigo-50/10 shadow-inner" : "hover:bg-gray-50/50",
                                            isSelected && "bg-indigo-50/20"
                                        )}>
                                        <td className="py-6 pl-8 text-center" onClick={(e) => toggleSelect(product.id, e)}>
                                            <div className={cn(
                                                "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                isSelected ? "bg-indigo-600 border-indigo-600" : "border-gray-100"
                                            )}>
                                                {isSelected && <Check size={12} className="text-white" strokeWidth={4} />}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-inner">
                                                    {product.emoji}
                                                </div>
                                                <div>
                                                    <div className="text-[14px] font-black text-gray-900 leading-tight mb-1">{product.name}</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">{product.brand}</span>
                                                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                                                        <span className="text-[11px] font-bold text-gray-400">{product.unit_value} {product.unit_type} per pack</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                                                <span className="text-[12px] font-black text-gray-700 uppercase tracking-widest">{product.category}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <div className="text-[16px] font-black text-gray-900 tabular-nums leading-none mb-1">
                                                    {product.total_packs} Packs
                                                </div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                    {product.batches.length} Batch{product.batches.length !== 1 ? 'es' : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4 text-center">
                                            {nearestExpiry ? (
                                                <div className="flex flex-col items-center">
                                                    <span className={cn(
                                                        "text-[13px] font-black tracking-tight",
                                                        isExpiringSoon ? "text-red-500" : "text-gray-800"
                                                    )}>{new Date(nearestExpiry).toLocaleDateString()}</span>
                                                    {isExpiringSoon && (
                                                        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                                                            <AlertTriangle size={10} />
                                                            Urgent
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-[11px] font-bold text-gray-300">N/A</span>
                                            )}
                                        </td>
                                        <td className="py-6 pr-8 text-right">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                                                isExpanded ? "bg-gray-900 text-white shadow-xl rotate-180" : "text-gray-200 group-hover:text-indigo-600 group-hover:bg-indigo-50"
                                            )}>
                                                <ChevronDown size={14} strokeWidth={3} />
                                            </div>
                                        </td>
                                    </tr>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={6} className="p-0 border-b border-gray-100 bg-gray-50/30">
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-10 py-12">
                                                            <div className="mb-8 flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-[14px] bg-gray-900 flex items-center justify-center text-white shadow-indigo-200">
                                                                        <History size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="text-[17px] font-black text-gray-900 tracking-tight">Batch & Stock Records</h3>
                                                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[3px]">Real-time stock calculated from purchases & sales</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-4">
                                                                    <div className="px-5 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
                                                                        <div className="text-[13px] font-black text-emerald-600 leading-none">
                                                                            {product.total_packs} Packs
                                                                        </div>
                                                                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Available</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                                                                <table className="w-full">
                                                                    <thead>
                                                                        <tr className="bg-gray-50 text-left">
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Batch Code</th>
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Vendor</th>
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px]">Purchase Date</th>
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px] text-right">Available Packs</th>
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px] text-right">Purchase Price</th>
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px] text-right">MRP (Sale Price)</th>
                                                                            <th className="py-4 px-6 text-[11px] font-black text-gray-400 uppercase tracking-[2px] text-center">Expiry</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {product.batches.map((batch, i) => (
                                                                            <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                                                <td className="py-5 px-6">
                                                                                    <div className="px-2 py-1 bg-indigo-50 border border-indigo-100 rounded-lg w-fit text-[12px] font-black text-indigo-600 uppercase tracking-widest">
                                                                                        {batch.batch_code}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-5 px-6">
                                                                                    <div className="flex items-center gap-2 text-[13px] font-black text-gray-900">
                                                                                        <Building2 size={12} className="text-indigo-400" />
                                                                                        {batch.vendor_name}
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-5 px-6">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Calendar size={12} className="text-gray-300" />
                                                                                        <span className="text-[13px] font-black text-gray-800 tabular-nums">{batch.purchase_date}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-5 px-6 text-right">
                                                                                    <div className="text-[14px] font-black text-emerald-600 tabular-nums">
                                                                                        {batch.pack_quantity} Packs
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-5 px-6 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <DollarSign size={12} className="text-gray-400" />
                                                                                        <span className="text-[14px] font-black text-gray-600 tabular-nums">Rs.{batch.purchase_price.toFixed(2)}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-5 px-6 text-right">
                                                                                    <div className="flex items-center justify-end gap-1">
                                                                                        <DollarSign size={12} className="text-emerald-500" />
                                                                                        <span className="text-[14px] font-black text-emerald-600 tabular-nums">Rs.{batch.mrp.toFixed(2)}</span>
                                                                                    </div>
                                                                                </td>
                                                                                <td className="py-5 px-6 text-center">
                                                                                    <span className="text-[13px] font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full">{new Date(batch.expiry_date).toLocaleDateString()}</span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                                {product.batches.length === 0 && (
                                                                    <div className="py-20 text-center flex flex-col items-center gap-3">
                                                                        <Clock size={32} className="text-gray-200" />
                                                                        <p className="text-[12px] font-black text-gray-300 uppercase tracking-[4px]">No batch data available</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-8 flex items-center justify-between px-2">
                                                                <button className="flex items-center gap-2 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-all">
                                                                    <TrendingUp size={14} />
                                                                    View Sales Analytics
                                                                </button>
                                                                <div className="flex items-center gap-2">
                                                                    <Zap size={12} className="text-indigo-400" />
                                                                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Real-Time Calculation Active</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
