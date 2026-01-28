"use client";

import { useState, useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { mockPurchases, PurchaseRecord, PurchaseItem } from "@/data/purchases";
import {
    Search,
    ChevronDown,
    ChevronUp,
    Calendar,
    Building2,
    Hash,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpRight,
    Package,
    Boxes,
    ShieldCheck,
    Tag,
    History,
    Edit3,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function PurchaseLedger() {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [purchases, setPurchases] = useState<PurchaseRecord[]>(mockPurchases);

    const filteredPurchases = useMemo(() => {
        return purchases.filter(p =>
            p.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.billNumber.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery, purchases]);

    const updateStatus = (id: string, newStatus: 'Paid' | 'Unpaid') => {
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    };

    const updateDiscount = (id: string, newDiscount: number) => {
        setPurchases(prev => prev.map(p => {
            if (p.id === id) {
                const grandTotal = Math.max(0, p.subtotal - newDiscount);
                return { ...p, overallDiscount: newDiscount, grandTotal };
            }
            return p;
        }));
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
            <TopBar />

            <main className="flex-1 p-6 lg:p-10 max-w-[1400px] mx-auto w-full">
                {/* Header Context */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl shadow-gray-200">
                                <History size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 tracking-tighter leading-none mb-1">Procurement Ledger</h1>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[4px]">Verified Vendor Purchase Archives</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search bills or vendors..."
                                className="h-12 pl-12 pr-6 bg-gray-50 rounded-xl w-[280px] focus:w-[350px] focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 font-bold text-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Ledger Listing */}
                <div className="space-y-4">
                    {filteredPurchases.map((purchase) => {
                        const isExpanded = expandedRow === purchase.id;
                        const isOverdue = purchase.payLater && purchase.paymentDueDate && new Date() > new Date(purchase.paymentDueDate) && purchase.status !== 'Paid';

                        // Calculate days remaining or delayed
                        let dayDiff = 0;
                        if (purchase.paymentDueDate) {
                            const today = new Date();
                            const due = new Date(purchase.paymentDueDate);
                            dayDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        }

                        return (
                            <div key={purchase.id} className="group">
                                <motion.div
                                    className={cn(
                                        "bg-white rounded-[28px] border transition-all duration-300 relative overflow-hidden",
                                        isExpanded ? "border-indigo-200 shadow-xl" : "border-gray-100 hover:border-gray-200 hover:shadow-md"
                                    )}
                                >
                                    {/* Critical Status Bar */}
                                    <div className={cn(
                                        "h-1.5 w-full",
                                        purchase.status === 'Paid' ? "bg-emerald-500" : (isOverdue ? "bg-red-500" : "bg-amber-400")
                                    )} />

                                    <div className="p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white transition-colors">
                                                <Building2 className="text-gray-400" size={24} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1.5">
                                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{purchase.vendorName}</h3>
                                                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-widest">{purchase.billNumber}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={12} className="text-gray-400" />
                                                        <span className="text-[11px] font-bold text-gray-400">{purchase.purchaseDate}</span>
                                                    </div>
                                                    <div className="h-3 w-[1px] bg-gray-200" />
                                                    <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-800">
                                                        <Package size={12} className="text-indigo-400" />
                                                        {purchase.items.length} Items
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-10">
                                            {/* Payment Timeline */}
                                            {purchase.payLater && (
                                                <div className="text-right">
                                                    <div className="flex items-center justify-end gap-2 mb-1">
                                                        <Clock size={12} className={isOverdue ? "text-red-500 animate-pulse" : "text-amber-500"} />
                                                        <span className={cn(
                                                            "text-[10px] font-black uppercase tracking-widest",
                                                            isOverdue ? "text-red-500" : "text-amber-500"
                                                        )}>
                                                            {purchase.status === 'Paid' ? "Cycle Complete" : (isOverdue ? "Delayed Entry" : `${dayDiff} Days Remaining`)}
                                                        </span>
                                                    </div>
                                                    <div className="text-[13px] font-black text-gray-800 tabular-nums">Due: {purchase.paymentDueDate}</div>
                                                </div>
                                            )}

                                            <div className="h-10 w-[1px] bg-gray-100" />

                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[3px] block mb-1">Final Payable</span>
                                                <div className="text-2xl font-black text-gray-900 tabular-nums">Rs.{purchase.grandTotal.toLocaleString()}</div>
                                            </div>

                                            <button
                                                onClick={() => setExpandedRow(isExpanded ? null : purchase.id)}
                                                className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                                                    isExpanded ? "bg-gray-900 text-white rotate-180 shadow-lg" : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                                                )}
                                            >
                                                <ChevronDown size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden bg-gray-50/50 border-t border-gray-100"
                                            >
                                                <div className="p-8 md:p-12 space-y-12">
                                                    {/* Row 1: Itemized Bill */}
                                                    <div>
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center gap-3">
                                                                <Boxes size={18} className="text-gray-400" />
                                                                <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-[3px]">Itemized Purchase Detail</h4>
                                                            </div>
                                                            <span className="text-[10px] font-bold text-gray-400 italic font-serif">Landed costs sync verified</span>
                                                        </div>

                                                        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className="bg-gray-50/50 text-left border-b border-gray-50">
                                                                        <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                                                        <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Batch</th>
                                                                        <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Qty x Price</th>
                                                                        <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Row Total</th>
                                                                        <th className="py-4 px-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Expiry</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {purchase.items.map((item) => (
                                                                        <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors">
                                                                            <td className="py-5 px-6">
                                                                                <div className="text-[13px] font-black text-gray-900">{item.productName}</div>
                                                                                <div className="text-[9px] font-bold text-gray-400">Master Record Unique Identity</div>
                                                                            </td>
                                                                            <td className="py-5 px-6 text-center">
                                                                                <span className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase tracking-widest">{item.batchCode}</span>
                                                                            </td>
                                                                            <td className="py-5 px-6 text-center">
                                                                                <div className="text-[12px] font-black text-gray-700">{item.quantity} units <span className="text-gray-300 mx-1">@</span> Rs.{item.purchasePrice}</div>
                                                                                {item.freeQuantity > 0 && <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">+{item.freeQuantity} Free stock</div>}
                                                                            </td>
                                                                            <td className="py-5 px-6 text-right font-black text-gray-900 tabular-nums text-[13px]">
                                                                                Rs.{(item.quantity * item.purchasePrice).toLocaleString()}
                                                                            </td>
                                                                            <td className="py-5 px-6 text-center">
                                                                                <span className="text-[11px] font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full">{item.expiryDate}</span>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    {/* Row 2: Financial Management */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                                                        <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                            {/* Discount Control */}
                                                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <label className="text-[10px] font-black text-gray-900 uppercase tracking-[2px]">Adjust Discount</label>
                                                                    <Edit3 size={14} className="text-indigo-400" />
                                                                </div>
                                                                <div className="relative group">
                                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-black text-indigo-400 uppercase tracking-widest">LESS Rs.</div>
                                                                    <input
                                                                        type="number"
                                                                        value={purchase.overallDiscount}
                                                                        onChange={(e) => updateDiscount(purchase.id, parseFloat(e.target.value) || 0)}
                                                                        className="w-full h-14 pl-24 pr-6 bg-indigo-50/30 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-100 outline-none font-black text-indigo-600 tabular-nums text-lg transition-all"
                                                                    />
                                                                </div>
                                                                <p className="text-[9px] font-bold text-gray-400 leading-relaxed italic">Updating discount will automatically re-calculate the grand total and ledger balance.</p>
                                                            </div>

                                                            {/* Status Management */}
                                                            <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                                                                <label className="text-[10px] font-black text-gray-900 uppercase tracking-[2px] block mb-6">Settlement Status</label>
                                                                <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                                                    <button
                                                                        onClick={() => updateStatus(purchase.id, 'Paid')}
                                                                        className={cn(
                                                                            "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                                                                            purchase.status === 'Paid' ? "bg-white text-emerald-600 shadow-md border border-emerald-50" : "text-gray-400 hover:bg-white"
                                                                        )}
                                                                    >
                                                                        <CheckCircle2 size={14} />
                                                                        SETTLED
                                                                    </button>
                                                                    <button
                                                                        onClick={() => updateStatus(purchase.id, 'Unpaid')}
                                                                        className={cn(
                                                                            "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center",
                                                                            purchase.status !== 'Paid' ? "bg-white text-amber-600 shadow-md border border-amber-50" : "text-gray-400 hover:bg-white"
                                                                        )}
                                                                    >
                                                                        <AlertCircle size={14} />
                                                                        PENDING
                                                                    </button>
                                                                </div>
                                                                <div className="mt-6 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                                    <ShieldCheck size={18} className="text-indigo-400" />
                                                                    <div className="text-[10px] font-black text-gray-500 leading-tight uppercase tracking-widest">Digital Lock Verified <br /> System Archive Record</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Final Summary Card */}
                                                        <div className="bg-gray-900 rounded-[32px] p-8 text-white shadow-2xl space-y-8 relative overflow-hidden group">
                                                            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 transition-transform group-hover:scale-125">
                                                                <DollarSign size={120} strokeWidth={3} />
                                                            </div>

                                                            <div className="relative z-10">
                                                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[4px] block mb-2">Final Summary</label>
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[11px] font-bold text-gray-400">Invoice Amount</span>
                                                                        <span className="text-[14px] font-black tabular-nums">Rs.{purchase.subtotal.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="flex items-center justify-between text-indigo-400">
                                                                        <span className="text-[11px] font-bold">Adjusted Discount</span>
                                                                        <span className="text-[14px] font-black tabular-nums">- Rs.{purchase.overallDiscount.toLocaleString()}</span>
                                                                    </div>
                                                                    <div className="h-[1px] bg-white/10 my-4" />
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-[12px] font-black uppercase tracking-widest">NET PAYABLE</span>
                                                                        <span className="text-3xl font-black text-emerald-400 tabular-nums tracking-tighter">Rs.{purchase.grandTotal.toLocaleString()}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="relative z-10 pt-4">
                                                                <button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[3px] transition-all active:scale-95 flex items-center justify-center gap-3">
                                                                    Save Analysis
                                                                    <ArrowRight size={18} strokeWidth={3} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
