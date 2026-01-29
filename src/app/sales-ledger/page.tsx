"use client";

import { useState, useMemo, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import {
    Search,
    ChevronDown,
    ChevronUp,
    User,
    Phone,
    Calendar,
    Clock,
    CreditCard,
    Package,
    TrendingUp,
    DollarSign,
    Receipt,
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileText,
    Zap,
    ShoppingBag,
    BarChart3,
    Filter,
    Download,
    Eye,
    Banknote,
    Percent,
    Hash,
    Loader2,
    Pencil,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

interface SaleItem {
    productName: string;
    batchCode: string;
    quantity: number;
    unitPrice: number;
    mrp: number;
    purchasePrice: number;
    profit: number;
    expiryDate: string;
    lineTotal: number;
}

interface SaleRecord {
    id: number;
    invoiceNumber: string;
    customerName: string;
    customerPhone: string;
    saleDate: string;
    saleTime: string;
    subtotal: number;
    discount: number;
    discountType: 'fixed' | 'percent';
    grandTotal: number;
    amountPaid: number;
    amountDue: number;
    cashAmount: number;
    onlineAmount: number;
    paymentStatus: 'Paid' | 'Unpaid' | 'Partial';
    paymentMethod: 'Cash' | 'Online' | 'Mixed';
    soldBy: string;
    status: string;
    notes: string;
    profit: number;
    totalPurchasePrice: number;
    items: SaleItem[];
}

export default function SalesLedgerPage() {
    const supabase = createClient();
    const [isLoading, setIsLoading] = useState(true);
    const [salesRecords, setSalesRecords] = useState<SaleRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [filterStatus, setFilterStatus] = useState<'All' | 'Paid' | 'Unpaid' | 'Partial'>('All');
    const [filterPayment, setFilterPayment] = useState<'All' | 'Cash' | 'Online' | 'Mixed'>('All');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadSales();
    }, [startDate, endDate]);

    const loadSales = async () => {
        setIsLoading(true);
        let query = supabase
            .from('sales')
            .select(`
                *,
                customers (
                    name,
                    phone
                ),
                sale_items (
                    *,
                    products (
                        name,
                        emoji
                    )
                )
            `);

        if (startDate) {
            query = query.gte('sale_date', `${startDate}T00:00:00`);
        }
        if (endDate) {
            query = query.lte('sale_date', `${endDate}T23:59:59`);
        }

        const { data: salesData } = await query.order('sale_date', { ascending: false });

        if (salesData) {
            // Fetch batch info from purchase_items to get expiry, original MRP, and purchase price for profit
            const { data: purchaseData } = await supabase
                .from('purchase_items')
                .select('product_id, batch_code, expiry_date, mrp, purchase_price');

            const mappedSales: SaleRecord[] = salesData.map(sale => {
                const cashAmount = parseFloat(sale.cash_amount) || 0;
                const onlineAmount = parseFloat(sale.online_amount) || 0;
                const totalPaid = cashAmount + onlineAmount;
                const grandTotal = parseFloat(sale.total_amount) || 0;
                const discountAmount = parseFloat(sale.discount_amount) || 0;
                const amountDue = Math.max(0, grandTotal - totalPaid);

                let totalSaleProfit = 0;
                let totalPurchasePrice = 0;
                const mappedItems = sale.sale_items?.map((item: any) => {
                    const pInfo = purchaseData?.find(pd => pd.product_id === item.product_id && pd.batch_code === item.batch_code);
                    const purchasePrice = pInfo?.purchase_price || 0;
                    const quantity = parseFloat(item.quantity) || 0;
                    const unitPrice = parseFloat(item.unit_price) || 0;
                    const itemProfit = (unitPrice - purchasePrice) * quantity;
                    totalSaleProfit += itemProfit;
                    totalPurchasePrice += purchasePrice * quantity;

                    return {
                        productName: item.products?.name || 'Unknown',
                        batchCode: item.batch_code || 'N/A',
                        quantity: quantity,
                        unitPrice: unitPrice,
                        lineTotal: parseFloat(item.subtotal) || 0,
                        mrp: pInfo?.mrp || item.unit_price,
                        purchasePrice: purchasePrice,
                        profit: itemProfit,
                        expiryDate: pInfo?.expiry_date ? new Date(pInfo.expiry_date).toLocaleDateString('en-GB') : 'N/A'
                    };
                }) || [];

                return {
                    id: sale.id,
                    invoiceNumber: `INV-${String(sale.id).padStart(5, '0')}`,
                    customerName: sale.customers?.name || 'Walk-in Customer',
                    customerPhone: sale.customers?.phone || 'N/A',
                    saleDate: sale.sale_date,
                    saleTime: new Date(sale.sale_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    grandTotal: grandTotal,
                    discount: discountAmount,
                    discountType: 'fixed',
                    subtotal: grandTotal + discountAmount,
                    amountPaid: totalPaid,
                    amountDue: amountDue,
                    cashAmount: cashAmount,
                    onlineAmount: onlineAmount,
                    paymentStatus: amountDue <= 0.01 ? 'Paid' : (totalPaid > 0 ? 'Partial' : 'Unpaid'),
                    paymentMethod: sale.payment_method,
                    soldBy: 'Administrator',
                    status: sale.status,
                    notes: sale.notes || '',
                    profit: totalSaleProfit - discountAmount,
                    totalPurchasePrice: totalPurchasePrice,
                    items: mappedItems
                };
            });
            setSalesRecords(mappedSales);
        }
        setIsLoading(false);
    };

    const handleDelete = async (saleId: number) => {
        if (!confirm("Are you sure you want to delete this sale? This action cannot be undone.")) return;

        try {
            // sale_items will be deleted automatically if CASCADE is set, 
            // but let's be explicit if not sure, or just delete the header.
            // Stock is calculated in real-time from sale_items, so deleting them is enough.

            const { error: itemsErr } = await supabase
                .from('sale_items')
                .delete()
                .eq('sale_id', saleId);

            if (itemsErr) throw itemsErr;

            const { error: saleErr } = await supabase
                .from('sales')
                .delete()
                .eq('id', saleId);

            if (saleErr) throw saleErr;

            setSalesRecords(prev => prev.filter(r => r.id !== saleId));
            alert("Sale deleted successfully.");
        } catch (err: any) {
            alert("Error deleting sale: " + err.message);
        }
    };

    const filteredRecords = useMemo(() => {
        return salesRecords.filter(record => {
            const matchesSearch =
                record.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                record.customerPhone.includes(searchQuery);

            const matchesStatus = filterStatus === 'All' || record.paymentStatus === filterStatus;
            const matchesPayment = filterPayment === 'All' || record.paymentMethod === filterPayment;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }, [searchQuery, filterStatus, filterPayment, salesRecords]);

    const stats = useMemo(() => {
        const initialStats = {
            totalSales: 0,
            totalPaid: 0,
            totalDue: 0,
            totalProfit: 0,
            totalTransactions: filteredRecords.length,
            cashSales: 0,
            onlineSales: 0,
            mixedSales: 0,
            cashCollected: 0,
            onlineCollected: 0,
            cashProfit: 0,
            onlineProfit: 0,
            mixedProfit: 0
        };

        if (filteredRecords.length === 0) return initialStats;

        return filteredRecords.reduce((acc, r) => {
            acc.totalSales += r.grandTotal;
            acc.totalPaid += r.amountPaid;
            acc.totalDue += r.amountDue;
            acc.totalProfit += r.profit;
            acc.cashCollected += r.cashAmount;
            acc.onlineCollected += r.onlineAmount;

            if (r.paymentMethod === 'Cash') {
                acc.cashSales += r.grandTotal;
                acc.cashProfit += r.profit;
            } else if (r.paymentMethod === 'Online') {
                acc.onlineSales += r.grandTotal;
                acc.onlineProfit += r.profit;
            } else if (r.paymentMethod === 'Mixed') {
                acc.mixedSales += r.grandTotal;
                acc.mixedProfit += r.profit;
            }

            return acc;
        }, initialStats);
    }, [filteredRecords]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Paid': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Unpaid': return 'text-red-600 bg-red-50 border-red-200';
            case 'Partial': return 'text-amber-600 bg-amber-50 border-amber-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getPaymentIcon = (method: string) => {
        switch (method) {
            case 'Cash': return <Banknote size={14} />;
            case 'Online': return <Zap size={14} />;
            case 'Mixed': return <DollarSign size={14} />;
            default: return <DollarSign size={14} />;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <TopBar />
                <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">Syncing Sales Ledger</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
            <TopBar />

            <div className="p-4 md:p-6 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                                Sales Ledger
                            </h1>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Transaction Records
                            </p>
                        </div>
                        <button className="h-9 px-4 bg-indigo-600 text-white rounded-lg font-black text-[11px] uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2">
                            <Download size={14} />
                            Export
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-b-4 border-b-emerald-500"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <CheckCircle2 size={40} strokeWidth={3} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 size={14} className="text-emerald-600" strokeWidth={3} />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Collected</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                        {stats.totalTransactions} Orders
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-emerald-600 tabular-nums leading-none mb-4">Rs.{stats.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

                                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-50">
                                    <div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Cash</div>
                                        <div className="text-[11px] font-bold text-gray-700 tabular-nums">{stats.cashCollected.toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Online</div>
                                        <div className="text-[11px] font-bold text-gray-700 tabular-nums">{stats.onlineCollected.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Due</div>
                                        <div className="text-[11px] font-bold text-red-600 tabular-nums">{stats.totalDue.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all border-b-4 border-b-purple-500"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <DollarSign size={40} strokeWidth={3} />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Percent size={14} className="text-purple-600" strokeWidth={3} />
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">Total Profit</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                        {stats.totalSales > 0 ? Math.round((stats.totalProfit / stats.totalSales) * 100) : 0}% Margin
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-purple-600 tabular-nums leading-none mb-4">Rs.{stats.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>

                                <div className="pt-3 border-t border-gray-50">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Net earnings after discounts</div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm mb-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="flex-[2] relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search Customer, Invoice..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 h-10 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-900 placeholder:text-gray-400 focus:bg-white transition-all shadow-inner"
                                />
                            </div>

                            {/* Date Filter */}
                            <div className="flex-1 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full pl-9 pr-2 h-10 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase focus:bg-white transition-all outline-none"
                                    />
                                </div>
                                <span className="text-gray-300 font-bold text-xs">to</span>
                                <div className="relative flex-1">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full pl-9 pr-2 h-10 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 uppercase focus:bg-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Status and Payment Filters */}
                            <div className="flex gap-2">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value as any)}
                                    className="px-3 h-10 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 focus:bg-white transition-all cursor-pointer outline-none uppercase tracking-wider min-w-[120px]"
                                >
                                    <option value="All">All Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Partial">Partial</option>
                                </select>

                                <select
                                    value={filterPayment}
                                    onChange={(e) => setFilterPayment(e.target.value as any)}
                                    className="px-3 h-10 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black text-gray-600 focus:bg-white transition-all cursor-pointer outline-none uppercase tracking-wider min-w-[120px]"
                                >
                                    <option value="All">All Methods</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Online">Online</option>
                                    <option value="Mixed">Mixed</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sales Records Table */}
                <div className="space-y-3">
                    {filteredRecords.length === 0 ? (
                        <div className="bg-white rounded-xl p-10 border border-gray-100 shadow-sm text-center">
                            <SearchX size={24} className="text-gray-200 mx-auto mb-3" />
                            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest">No Records</h3>
                        </div>
                    ) : (
                        filteredRecords.map((record, index) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                            >
                                {/* Main Row */}
                                <div className="p-3">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left: Customer Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                <User size={18} strokeWidth={2.5} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h3 className="text-[14px] font-black text-gray-900 truncate uppercase tracking-tight">{record.customerName}</h3>
                                                    <div className={cn("px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-widest", getStatusColor(record.paymentStatus))}>
                                                        {record.paymentStatus}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px]">
                                                    <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                                                        <Phone size={10} />
                                                        {record.customerPhone}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-gray-500 font-bold uppercase tracking-tighter">
                                                        <Receipt size={10} />
                                                        {record.invoiceNumber}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Center: Date & Time */}
                                        <div className="flex items-center gap-4 px-4 border-l border-r border-gray-50">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <Calendar size={12} />
                                                <span className="font-black text-[12px] tabular-nums">{new Date(record.saleDate).toLocaleDateString('en-GB')}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-400">
                                                <Clock size={11} />
                                                <span className="font-bold text-[11px] tabular-nums">{record.saleTime}</span>
                                            </div>
                                        </div>

                                        {/* Right: Financial Summary */}
                                        <div className="flex items-center gap-4">
                                            <div className="grid grid-cols-3 gap-6 text-right min-w-[300px]">
                                                {/* Purchase Price */}
                                                <div>
                                                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Purchase</div>
                                                    <div className="text-[14px] font-bold text-gray-500 tabular-nums leading-none">Rs.{record.totalPurchasePrice.toFixed(2)}</div>
                                                </div>

                                                {/* Amount Taken */}
                                                <div>
                                                    <div className="text-[9px] font-black text-emerald-500 uppercase tracking-tighter">Taken</div>
                                                    <div className="text-[14px] font-black text-emerald-600 tabular-nums leading-none">Rs.{record.amountPaid.toFixed(2)}</div>
                                                    {record.amountDue > 0.01 && (
                                                        <div className="text-[8px] font-black text-red-500 uppercase mt-0.5">Due: {record.amountDue.toFixed(2)}</div>
                                                    )}
                                                </div>

                                                {/* Profit */}
                                                <div>
                                                    <div className="text-[9px] font-black text-purple-500 uppercase tracking-tighter">Profit</div>
                                                    <div className="text-[14px] font-black text-purple-600 tabular-nums leading-none">Rs.{record.profit.toFixed(2)}</div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                                                    record.paymentMethod === 'Cash' ? 'bg-green-50 text-green-600' :
                                                        record.paymentMethod === 'Online' ? 'bg-indigo-50 text-indigo-600' :
                                                            'bg-amber-50 text-amber-600'
                                                )}>
                                                    {getPaymentIcon(record.paymentMethod)}
                                                </div>

                                                <div className="h-4 w-[1px] bg-gray-100 mx-1" />

                                                <Link
                                                    href={`/sell?type=edit&id=${record.id}`}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-amber-50 flex items-center justify-center text-gray-400 hover:text-amber-600 transition-all active:scale-95"
                                                    title="Edit Sale"
                                                >
                                                    <Pencil size={14} />
                                                </Link>

                                                <button
                                                    onClick={() => handleDelete(record.id)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-all active:scale-95"
                                                    title="Delete Sale"
                                                >
                                                    <Trash2 size={14} />
                                                </button>

                                                <button
                                                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                                                    className="w-8 h-8 rounded-lg bg-gray-50 hover:bg-indigo-50 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-all active:scale-95"
                                                >
                                                    {expandedId === record.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                <AnimatePresence>
                                    {expandedId === record.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="border-t border-gray-50 bg-gray-50/30"
                                        >
                                            <div className="p-4 space-y-4">
                                                {/* Items Table */}
                                                <div>
                                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2 flex items-center gap-2">
                                                        <Package size={10} />
                                                        Purchased Items
                                                    </h4>
                                                    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                                    <th className="text-left p-2.5">Product</th>
                                                                    <th className="text-left p-2.5">Batch</th>
                                                                    <th className="text-center p-2.5">Qty</th>
                                                                    <th className="text-right p-2.5">P.Unit</th>
                                                                    <th className="text-right p-2.5">MRP</th>
                                                                    <th className="text-right p-2.5 text-purple-600">Profit</th>
                                                                    <th className="text-center p-2.5">Expiry</th>
                                                                    <th className="text-right p-2.5">Total</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {record.items.map((item, idx) => (
                                                                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/20 transition-colors">
                                                                        <td className="p-2.5">
                                                                            <div className="font-black text-[11px] text-gray-800 uppercase tracking-tight">{item.productName}</div>
                                                                        </td>
                                                                        <td className="p-2.5">
                                                                            <div className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase tracking-wider inline-block italic">
                                                                                {item.batchCode}
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-2.5 text-center">
                                                                            <div className="font-black text-[11px] text-gray-800 tabular-nums">{item.quantity}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-right">
                                                                            <div className="font-black text-[11px] text-gray-800 tabular-nums">{item.unitPrice}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-right">
                                                                            <div className="font-bold text-[10px] text-gray-400 tabular-nums opacity-50">{item.mrp}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-right">
                                                                            <div className="font-black text-[11px] text-purple-600 tabular-nums">+{item.profit.toFixed(2)}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-center">
                                                                            <div className="font-bold text-[10px] text-red-500 uppercase tracking-tighter tabular-nums">{item.expiryDate}</div>
                                                                        </td>
                                                                        <td className="p-2.5 text-right">
                                                                            <div className="font-black text-[11px] text-indigo-600 tabular-nums">{item.lineTotal.toFixed(2)}</div>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                {/* Financial Breakdown */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Left: Payment Details */}
                                                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                                                            <DollarSign size={10} />
                                                            Ledger Balance
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12px] font-bold text-gray-500">Subtotal</span>
                                                                <span className="text-[12px] font-black text-gray-800 tabular-nums">Rs.{record.subtotal.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12px] font-bold text-gray-500 flex items-center gap-2">
                                                                    Discount
                                                                    <span className="px-1.5 py-0.5 bg-green-50 text-green-600 rounded text-[9px] font-black">
                                                                        Rs.{record.discount}
                                                                    </span>
                                                                </span>
                                                                <span className="text-[12px] font-black text-red-500 tabular-nums">
                                                                    -Rs.{record.discount.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div className="h-px bg-gray-50" />
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12px] font-black text-gray-800 uppercase tracking-tighter">Agreement Total</span>
                                                                <span className="text-[15px] font-black text-indigo-600 tabular-nums">Rs.{record.grandTotal.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[12px] font-bold text-emerald-600">Collected Amt</span>
                                                                <span className="text-[12px] font-black text-emerald-600 tabular-nums">Rs.{record.amountPaid.toFixed(2)}</span>
                                                            </div>
                                                            {record.amountDue > 0.01 && (
                                                                <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
                                                                    <span className="text-sm font-black text-red-600">Amount Due</span>
                                                                    <span className="text-xl font-black text-red-600 tabular-nums">Rs.{record.amountDue.toFixed(2)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Right: Additional Info */}
                                                    <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-3 flex items-center gap-2">
                                                            <FileText size={10} />
                                                            Ref. Metadata
                                                        </h4>
                                                        <div className="space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-black text-gray-400 uppercase">Gateway</span>
                                                                <div className="flex items-center gap-1.5">
                                                                    {getPaymentIcon(record.paymentMethod)}
                                                                    <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{record.paymentMethod}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-black text-gray-400 uppercase">Cashier</span>
                                                                <span className="text-[11px] font-black text-gray-800 uppercase tracking-tighter">{record.soldBy}</span>
                                                            </div>
                                                            {record.notes && (
                                                                <div className="mt-2 pt-2 border-t border-gray-50">
                                                                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[1px] mb-1">Internal Remarks</div>
                                                                    <p className="text-[11px] font-bold text-gray-500 italic leading-relaxed">
                                                                        "{record.notes}"
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function SearchX({ size, className }: { size: number, className: string }) {
    return (
        <div className={cn("relative", className)}>
            <Search size={size} />
            <div className="absolute top-0 right-0 -mr-1 -mt-1 text-red-500">
                <XCircle size={size / 2} />
            </div>
        </div>
    )
}
