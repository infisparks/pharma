"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight,
    Loader2,
    Calendar,
    Search,
    Plus,
    ArrowLeft,
    Check,
    Building2,
    Hash,
    Trash2,
    Boxes,
    ChevronDown,
    Gift,
    Database,
    Package,
    Scale,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { cn, disableScrollOnNumberInput } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface PurchaseItem {
    id: string;
    productId: string;
    batchCode: string;
    expiryDate: string;
    quantity: number;
    freeQuantity: number;
    purchasePrice: number;
    mrp: number;
    unitValue: string;
    unitType: string;
}

export default function PurchaseEntry() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    // Database State
    const [vendors, setVendors] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);

    // Header state
    const [vendorId, setVendorId] = useState<string | number>("");
    const [billNumber, setBillNumber] = useState("");
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [payLater, setPayLater] = useState(false);
    const [paymentDueDate, setPaymentDueDate] = useState("");
    const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
    const vendorRef = useRef<HTMLDivElement>(null);

    // Line items state
    const [items, setItems] = useState<PurchaseItem[]>([
        { id: Math.random().toString(), productId: "", batchCode: "", expiryDate: "", quantity: 0, freeQuantity: 0, purchasePrice: 0, mrp: 0, unitValue: "", unitType: "" }
    ]);

    // Product Dropdown State for specific rows
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState("");
    const productRef = useRef<HTMLTableCellElement>(null);

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const [vendorsRes, productsRes] = await Promise.all([
                    supabase.from('vendors').select('*').order('full_name'),
                    supabase.from('products').select('*').order('name')
                ]);

                if (vendorsRes.data) setVendors(vendorsRes.data);
                if (productsRes.data) setAllProducts(productsRes.data);
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const addRow = () => {
        setItems([...items, { id: Math.random().toString(), productId: "", batchCode: "", expiryDate: "", quantity: 0, freeQuantity: 0, purchasePrice: 0, mrp: 0, unitValue: "", unitType: "" }]);
    };

    const removeRow = (id: string) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const updateItem = (id: string, field: keyof PurchaseItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleProductSelect = (rowId: string, product: any) => {
        setItems(items.map(item =>
            item.id === rowId
                ? {
                    ...item,
                    productId: product.id.toString(),
                    unitValue: product.unit_value || "",
                    unitType: product.unit_type || ""
                }
                : item
        ));
        setActiveRowId(null);
        setProductSearch("");
    };

    const totals = useMemo(() => {
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
        const totalQty = items.reduce((acc, item) => acc + (item.quantity + (item.freeQuantity || 0)), 0);
        const numericGrandTotal = Math.max(0, subtotal - overallDiscount);
        return {
            subtotal: subtotal.toLocaleString('en-IN'),
            discount: overallDiscount.toLocaleString('en-IN'),
            grandTotal: numericGrandTotal.toLocaleString('en-IN'),
            numericGrandTotal,
            itemCount: items.length,
            totalQty
        };
    }, [items, overallDiscount]);

    const selectedVendor = useMemo(() => {
        if (!vendorId) return null;
        return vendors.find(v => v.id.toString() === vendorId.toString());
    }, [vendorId, vendors]);

    const filteredProducts = useMemo(() => {
        const query = productSearch.toLowerCase();
        return allProducts.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.category && p.category.toLowerCase().includes(query))
        );
    }, [productSearch, allProducts]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (vendorRef.current && !vendorRef.current.contains(event.target as Node)) setIsVendorDropdownOpen(false);
            if (productRef.current && !productRef.current.contains(event.target as Node)) setActiveRowId(null);
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorId || !billNumber) {
            alert("Please select a vendor and enter a bill number.");
            return;
        }
        setIsSubmitting(true);

        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .insert([{
                vendor_id: parseInt(vendorId.toString()),
                bill_number: billNumber,
                purchase_date: purchaseDate,
                overall_discount: overallDiscount,
                total_amount: totals.numericGrandTotal,
                is_credit: payLater,
                due_date: payLater ? paymentDueDate : null
            }])
            .select()
            .single();

        if (purchaseError) {
            alert("Header Error: " + purchaseError.message);
            setIsSubmitting(false);
            return;
        }

        const lineItems = items.filter(i => i.productId).map(item => ({
            purchase_id: purchase.id,
            product_id: parseInt(item.productId),
            batch_code: item.batchCode,
            expiry_date: item.expiryDate, // Use the correct property from PurchaseItem interface
            quantity: item.quantity,
            free_quantity: item.freeQuantity,
            purchase_price: item.purchasePrice,
            mrp: item.mrp,
            unit_value: item.unitValue,
            unit_type: item.unitType
        }));

        const { error: itemsError } = await supabase.from('purchase_items').insert(lineItems);

        if (!itemsError) {
            setIsSuccess(true);
        } else {
            alert("Line Item Error: " + itemsError.message);
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 gap-4">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Loading Enterprise Vault</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] flex flex-col font-sans mb-10">
            {/* Ultra Slim Nav */}
            <nav className="h-10 border-b border-gray-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-[100]">
                <div className="flex items-center gap-4">
                    <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 transition-all">
                        <ArrowLeft size={12} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Vault</span>
                    </Link>
                    <div className="h-3 w-[1px] bg-gray-200" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Stock Acquisition Protocol</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Online</span>
                </div>
            </nav>

            <main className="flex-1 flex flex-col items-center pt-4 px-4 overflow-visible">
                <div className="w-full max-w-[1300px] flex flex-col gap-3 overflow-visible">

                    {!isSuccess ? (
                        <>
                            {/* Header Info - High Density */}
                            <div className="bg-white rounded-2xl border border-gray-100 p-3 shadow-sm flex flex-wrap lg:flex-nowrap items-end gap-3 overflow-visible relative z-[90]">

                                <div className="flex-1 min-w-[300px] space-y-1 relative" ref={vendorRef}>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Source Vendor *</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                                        className="w-full h-9 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-between hover:bg-white transition-all shadow-sm"
                                    >
                                        {selectedVendor ? (
                                            <div className="flex items-center gap-2">
                                                <Building2 size={12} className="text-indigo-500" />
                                                <div className="flex flex-col">
                                                    <span className="text-[12px] font-black text-gray-800 leading-none">{selectedVendor.business_name || selectedVendor.full_name}</span>
                                                    {selectedVendor.phone_number && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{selectedVendor.phone_number}</span>}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-[12px] font-bold text-gray-300">Select Identity...</span>
                                        )}
                                        <ChevronDown size={12} className="text-gray-300" />
                                    </button>

                                    <AnimatePresence>
                                        {isVendorDropdownOpen && (
                                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full mt-1.5 left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] p-1.5">
                                                <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                                    {vendors.length === 0 ? (
                                                        <div className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">No Vendors Registered</div>
                                                    ) : vendors.map(v => (
                                                        <button key={v.id} type="button" onClick={() => { setVendorId(v.id); setIsVendorDropdownOpen(false); }} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50 transition-colors text-left border border-transparent hover:border-indigo-100">
                                                            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
                                                                <Building2 size={14} />
                                                            </div>
                                                            <div className="flex-1 overflow-hidden">
                                                                <div className="text-[12px] font-black text-gray-800 leading-none mb-1">{v.business_name || v.full_name}</div>
                                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                                                    {v.phone_number && <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-tight">{v.phone_number}</span>}
                                                                    {v.full_name && v.business_name && <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">• {v.full_name}</span>}
                                                                    {v.email && <span className="text-[9px] font-bold text-gray-300 lowercase truncate">• {v.email}</span>}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="w-36 space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Bill Reference</label>
                                    <div className="relative">
                                        <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
                                        <input value={billNumber} onChange={(e) => setBillNumber(e.target.value)} placeholder="0000" className="w-full h-9 pl-7 pr-3 bg-gray-50 border border-gray-100 rounded-xl outline-none font-black text-[12px] shadow-sm focus:bg-white focus:border-indigo-200 transition-all" />
                                    </div>
                                </div>

                                <div className="w-40 space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">Acquisition Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
                                        <input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full h-9 pl-7 pr-3 bg-gray-50 border border-gray-100 rounded-xl font-black text-[11px] shadow-sm outline-none cursor-pointer" />
                                    </div>
                                </div>

                                <div className="bg-gray-900 rounded-xl px-5 h-9 flex items-center justify-center gap-4 ml-auto shadow-lg">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Net Payable</span>
                                    <span className="text-sm font-black text-emerald-400 tabular-nums">Rs.{totals.grandTotal}</span>
                                </div>
                            </div>

                            {/* Entry Grid - Correcting Clipping Issues */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm relative z-10 overflow-visible">
                                <div className="px-5 py-2.5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between rounded-t-2xl">
                                    <div className="flex items-center gap-2">
                                        <Boxes size={12} className="text-gray-400" />
                                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-[1px]">Batch Identity Log ({items.length})</span>
                                    </div>
                                    <button type="button" onClick={addRow} className="h-7 px-4 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md active:scale-95 flex items-center gap-2">
                                        <Plus size={10} strokeWidth={4} /> Add Batch
                                    </button>
                                </div>

                                <div className="overflow-visible">
                                    <table className="w-full border-collapse">
                                        <thead className="bg-white text-left text-[9px] font-black text-gray-400 uppercase tracking-[2px] border-b border-gray-100">
                                            <tr>
                                                <th className="py-2.5 px-5 min-w-[280px]">Product Registry</th>
                                                <th className="py-2.5 px-2 w-36">Pack Spec</th>
                                                <th className="py-2.5 px-2 w-24">Batch #</th>
                                                <th className="py-2.5 px-2 w-32">Expiry</th>
                                                <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                                                <th className="py-2.5 px-2 w-20 text-center">Free</th>
                                                <th className="py-2.5 px-2 w-24 text-right">Cost</th>
                                                <th className="py-2.5 px-2 w-24 text-right">MRP</th>
                                                <th className="py-2.5 px-5 text-right">Total</th>
                                                <th className="py-2.5 px-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="overflow-visible">
                                            {items.map((item) => {
                                                const prod = allProducts.find(p => p.id.toString() === item.productId);
                                                return (
                                                    <tr key={item.id} className="border-b border-gray-50 hover:bg-indigo-50/20 transition-colors overflow-visible">
                                                        <td className="py-2 px-5 relative overflow-visible" ref={activeRowId === item.id ? productRef : null}>
                                                            <button type="button" onClick={() => { setActiveRowId(item.id); setProductSearch(""); }} className="w-full h-8 flex items-center justify-between text-left group">
                                                                {prod ? (
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-sm shrink-0">{prod.emoji || '📦'}</div>
                                                                        <div className="truncate">
                                                                            <div className="text-[13px] font-black text-gray-900 truncate">{prod.name}</div>
                                                                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">{prod.category}</div>
                                                                        </div>
                                                                    </div>
                                                                ) : <span className="text-[11px] font-bold text-gray-300 uppercase tracking-[1px]">Link Product Identity...</span>}
                                                                <ChevronDown size={11} className="text-gray-300 group-hover:text-indigo-400 transition-colors" />
                                                            </button>

                                                            {/* Dropdown with high Z-Index and fixed positioning to avoid parent clipping */}
                                                            <AnimatePresence>
                                                                {activeRowId === item.id && (
                                                                    <motion.div initial={{ opacity: 0, scale: 0.98, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="absolute top-[80%] left-5 w-[420px] bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[1000] p-3">
                                                                        <div className="relative mb-2">
                                                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                                                            <input autoFocus value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search Ledger..." className="w-full h-9 pl-8 pr-3 bg-gray-50 border border-gray-100 rounded-xl text-[12px] font-black outline-none focus:bg-white focus:border-indigo-200" />
                                                                        </div>
                                                                        <div className="max-h-52 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                                                                            {filteredProducts.length === 0 ? (
                                                                                <div className="p-8 text-center flex flex-col items-center gap-2">
                                                                                    <AlertCircle size={20} className="text-gray-200" />
                                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No Identity Matched</p>
                                                                                    <Link href="/product-registration" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">+ Register New</Link>
                                                                                </div>
                                                                            ) : filteredProducts.map(p => (
                                                                                <button key={p.id} type="button" onClick={() => handleProductSelect(item.id, p)} className="flex items-center gap-3 p-2 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all text-left group">
                                                                                    <div className="w-8 h-8 bg-white border border-gray-100 rounded-lg flex items-center justify-center text-sm shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">{p.emoji || '📦'}</div>
                                                                                    <div className="flex-1 overflow-hidden">
                                                                                        <div className="text-[13px] font-black text-gray-800 truncate">{p.name}</div>
                                                                                        <div className="text-[10px] font-bold text-gray-400 uppercase">{p.unit_value} {p.unit_type} | {p.category}</div>
                                                                                    </div>
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <div className="flex items-center gap-1 bg-gray-50 px-2 rounded-xl border border-gray-100 hover:bg-white transition-colors group h-8">
                                                                <input
                                                                    type="number"
                                                                    onWheel={disableScrollOnNumberInput}
                                                                    value={item.unitValue}
                                                                    onChange={(e) => updateItem(item.id, 'unitValue', e.target.value)}
                                                                    placeholder="0"
                                                                    className="w-10 bg-transparent outline-none font-black text-[11px] text-indigo-600 text-center"
                                                                />
                                                                <div className="w-[1px] h-3 bg-gray-200" />
                                                                <select value={item.unitType} onChange={(e) => updateItem(item.id, 'unitType', e.target.value)} className="flex-1 bg-transparent outline-none font-black text-[9px] uppercase text-gray-400 appearance-none cursor-pointer">
                                                                    {["mg", "ml", "mcg", "g", "IU", "pouch", "Strips", "Tablets", "Units"].map(u => <option key={u} value={u}>{u}</option>)}
                                                                </select>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input value={item.batchCode} onChange={(e) => updateItem(item.id, 'batchCode', e.target.value)} placeholder="Batch" className="w-full h-8 bg-gray-50 border border-gray-100 rounded-xl px-2 text-center font-black text-[11px] uppercase outline-none focus:bg-white" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input type="date" value={item.expiryDate} onChange={(e) => updateItem(item.id, 'expiryDate', e.target.value)} className="w-full h-8 bg-gray-50 border border-gray-100 rounded-xl px-1 text-[10px] font-black outline-none cursor-pointer focus:bg-white" />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input
                                                                type="number"
                                                                onWheel={disableScrollOnNumberInput}
                                                                value={item.quantity || ""}
                                                                placeholder="0"
                                                                onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="w-full h-8 border border-gray-100 rounded-xl text-center font-black text-[12px] outline-none hover:border-indigo-600 transition-all focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input
                                                                type="number"
                                                                onWheel={disableScrollOnNumberInput}
                                                                value={item.freeQuantity || ""}
                                                                placeholder="0"
                                                                onChange={(e) => updateItem(item.id, 'freeQuantity', parseFloat(e.target.value) || 0)}
                                                                className="w-full h-8 bg-emerald-50/30 border border-emerald-100 rounded-xl text-center font-black text-[12px] text-emerald-600 outline-none"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input
                                                                type="number"
                                                                onWheel={disableScrollOnNumberInput}
                                                                value={item.purchasePrice || ""}
                                                                placeholder="0.00"
                                                                onChange={(e) => updateItem(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                                                className="w-full h-8 border border-gray-100 rounded-xl text-right px-2 font-black text-[12px] text-indigo-600 outline-none"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-2">
                                                            <input
                                                                type="number"
                                                                onWheel={disableScrollOnNumberInput}
                                                                value={item.mrp || ""}
                                                                placeholder="0.00"
                                                                onChange={(e) => updateItem(item.id, 'mrp', parseFloat(e.target.value) || 0)}
                                                                className="w-full h-8 border border-gray-100 rounded-xl text-right px-2 font-black text-[12px] text-orange-600 outline-none"
                                                            />
                                                        </td>
                                                        <td className="py-2 px-5 text-right font-black text-[12px] tabular-nums text-gray-900">Rs.{(item.quantity * item.purchasePrice).toFixed(2)}</td>
                                                        <td className="py-2 px-2">
                                                            <button type="button" onClick={() => removeRow(item.id)} disabled={items.length === 1} className="w-7 h-7 flex items-center justify-center text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={12} /></button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-200"><Scale size={14} /></div>
                                            <div>
                                                <div className="text-[12px] font-black text-gray-900 leading-none mb-0.5">{totals.totalQty} Units</div>
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Gross Acquisition</div>
                                            </div>
                                        </div>
                                        <div className="h-8 w-[1px] bg-gray-200" />
                                        <div className="flex items-center gap-2 opacity-50">
                                            <Database size={12} className="text-gray-400" />
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Vault Ledger v7.0</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Overall Discount</span>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    onWheel={disableScrollOnNumberInput}
                                                    value={overallDiscount || ""}
                                                    onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                                                    placeholder="0.00"
                                                    className="w-24 h-8 px-3 bg-white border border-indigo-100 rounded-xl focus:border-indigo-600 outline-none font-black text-[13px] text-right text-indigo-600 shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Final Settlement</div>
                                            <div className="text-2xl font-black text-gray-900 tracking-tighter leading-none tabular-nums">Rs.{totals.grandTotal}</div>
                                        </div>
                                        <button type="submit" onClick={handleSubmit} disabled={isSubmitting || !vendorId} className="h-11 px-8 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-95 disabled:opacity-20 flex items-center gap-3">
                                            {isSubmitting ? <Loader2 className="animate-spin" size={14} /> : <>Finalize Vault Entry <ChevronRight size={14} /></>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[40px] p-24 flex flex-col items-center text-center shadow-2xl relative overflow-hidden mt-10">
                            <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-500" />
                            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 border border-emerald-100 shadow-lg shadow-emerald-50"><Check size={40} className="text-emerald-500" strokeWidth={3} /></div>
                            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tighter">Acquisition Synchronized</h2>
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-[3px] mb-10 max-w-sm leading-relaxed">The physical stock labels and batch identities have been reconciled with the global registry.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { setIsSuccess(false); setVendorId(""); setItems([{ id: Math.random().toString(), productId: "", batchCode: "", expiryDate: "", quantity: 0, freeQuantity: 0, purchasePrice: 0, mrp: 0, unitValue: "", unitType: "" }]); }} className="h-12 px-10 border-2 border-gray-100 rounded-2xl font-black text-[10px] uppercase tracking-[2px] text-gray-400 hover:text-gray-900 transition-all">New Entry</button>
                                <Link href="/" className="h-12 px-10 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] flex items-center justify-center shadow-lg hover:bg-indigo-600 transition-all">Dashboard</Link>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
